import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'ssh2';
import {
  apiSecurityHeaders,
  getClientIp,
  parseJsonBodySafe,
  RequestBodyError,
  resolveAndValidateSshTarget,
  sanitizeTerminalOutput,
  sshConcurrencyLimiter,
  sshRateLimiter,
} from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SshRequest {
  action?: 'test' | 'exec';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  command?: string;
  cwd?: string;
  timeoutMs?: number;
}

// Hard limits
const MAX_OUTPUT_BYTES = 1024 * 1024; // 1MB buffer ceiling
const MAX_TIMEOUT_MS = 20000;
const MIN_TIMEOUT_MS = 2000;

export async function POST(req: NextRequest) {
  const headers = apiSecurityHeaders();
  const clientIp = getClientIp(req);

  // 1. Rate Limiting Check
  const rateCheck = sshRateLimiter.tryConsume(clientIp);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: 'Too Many Requests: SSH rate limit exceeded. Please wait a moment before sending more commands.',
        rateLimited: true,
      },
      { status: 429, headers }
    );
  }

  // 2. Concurrency Check
  if (!sshConcurrencyLimiter.tryAcquire(clientIp)) {
    return NextResponse.json(
      {
        error: 'Too Many Concurrent Requests: You have too many active SSH connections running. Please wait for previous commands to complete.',
        concurrencyLimited: true,
      },
      { status: 429, headers }
    );
  }

  let concurrencyReleased = false;
  const releaseConcurrency = () => {
    if (!concurrencyReleased) {
      concurrencyReleased = true;
      sshConcurrencyLimiter.release(clientIp);
    }
  };

  try {
    const body = await parseJsonBodySafe<SshRequest>(req, 32 * 1024);
    const rawHost = typeof body.host === 'string' ? body.host : undefined;
    const rawPort = typeof body.port === 'number' ? body.port : Number(body.port) || undefined;
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password.slice(0, 256) : '';
    const command = typeof body.command === 'string' ? body.command.slice(0, 2048) : undefined;
    const cwd = typeof body.cwd === 'string' ? body.cwd : `/home/${username}`;
    const timeoutMs = Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, Number(body.timeoutMs) || 12000));

    if (!username) {
      releaseConcurrency();
      return NextResponse.json({ error: 'Username is required (e.g. bandit0)' }, { status: 400, headers });
    }

    // Validate username syntax strictly: alphanumeric and underscore/hyphen only (e.g. bandit0)
    if (!/^[a-zA-Z0-9_-]{1,32}$/.test(username)) {
      releaseConcurrency();
      return NextResponse.json(
        { error: 'Invalid username format. Must be 1-32 alphanumeric characters.' },
        { status: 400, headers }
      );
    }

    // 3. Rigorous SSRF and Trust Boundary Enforcement
    let validatedTarget;
    try {
      validatedTarget = await resolveAndValidateSshTarget(rawHost, rawPort);
    } catch (ssrfErr) {
      releaseConcurrency();
      return NextResponse.json(
        { error: ssrfErr instanceof Error ? ssrfErr.message : 'Forbidden destination host or port.' },
        { status: 403, headers }
      );
    }

    const { host, port, resolvedIp } = validatedTarget;

    // ACTION: TEST CONNECTION / LOGIN
    if (body.action === 'test') {
      return new Promise<NextResponse>((resolve) => {
        const conn = new Client();
        let isResolved = false;

        const cleanupAndResolve = (resp: NextResponse) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timer);
            releaseConcurrency();
            try {
              conn.end();
            } catch (_) {}
            resolve(resp);
          }
        };

        const timer = setTimeout(() => {
          cleanupAndResolve(
            NextResponse.json(
              { error: `Connection timed out connecting to ${host}:${port}` },
              { status: 504, headers }
            )
          );
        }, timeoutMs);

        conn
          .on('ready', () => {
            conn.exec('uname -a && pwd', (err, stream) => {
              if (err) {
                cleanupAndResolve(
                  NextResponse.json({ error: sanitizeTerminalOutput(err.message) }, { status: 500, headers })
                );
                return;
              }

              let infoOut = '';
              stream.on('data', (d: Buffer | string) => {
                if (infoOut.length < MAX_OUTPUT_BYTES) {
                  infoOut += d.toString();
                }
              });

              stream.on('close', () => {
                const cleanInfo = sanitizeTerminalOutput(infoOut).trim();
                cleanupAndResolve(
                  NextResponse.json(
                    {
                      success: true,
                      message: `Successfully connected to ${host}:${port} as ${username}`,
                      host,
                      port,
                      username,
                      systemInfo: cleanInfo,
                      defaultDir: `/home/${username}`,
                    },
                    { headers }
                  )
                );
              });
            });
          })
          .on('error', (err) => {
            cleanupAndResolve(
              NextResponse.json(
                {
                  error: err.message.includes('authentication')
                    ? 'SSH Authentication failed. Check your password or flag!'
                    : `SSH Connection error: ${sanitizeTerminalOutput(err.message)}`,
                },
                { status: 401, headers }
              )
            );
          })
          .connect({
            host: resolvedIp,
            port,
            username,
            password,
            readyTimeout: timeoutMs,
            keepaliveInterval: 5000,
          });
      });
    }

    // ACTION: EXECUTE COMMAND ON BANDIT SERVER
    if (body.action === 'exec') {
      if (!command || !command.trim()) {
        releaseConcurrency();
        return NextResponse.json({ error: 'No command provided' }, { status: 400, headers });
      }

      return new Promise<NextResponse>((resolve) => {
        const conn = new Client();
        let isResolved = false;

        const cleanupAndResolve = (resp: NextResponse) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timer);
            releaseConcurrency();
            try {
              conn.end();
            } catch (_) {}
            resolve(resp);
          }
        };

        const timer = setTimeout(() => {
          cleanupAndResolve(
            NextResponse.json(
              {
                error: 'Command timed out on remote server (exceeded timeout threshold).',
                timedOut: true,
              },
              { status: 504, headers }
            )
          );
        }, timeoutMs);

        conn
          .on('ready', () => {
            // Sanitize safeCwd - restrict to safe path characters
            const sanitizedCwd = (cwd || `/home/${username}`).replace(/[^a-zA-Z0-9_\-./]/g, '');
            const trimmedCmd = command.trim();

            // Delimiters for remote state inspection
            const fullRemoteCmd = `cd "${sanitizedCwd}" 2>/dev/null || cd ~; ${trimmedCmd}; __RET__=$?; echo ""; echo "___REMOTE_PWD___:$(pwd)"; echo "___REMOTE_EXIT___:$__RET__"`;

            conn.exec(fullRemoteCmd, (err, stream) => {
              if (err) {
                cleanupAndResolve(
                  NextResponse.json({ error: sanitizeTerminalOutput(err.message) }, { status: 500, headers })
                );
                return;
              }

              let rawStdout = '';
              let rawStderr = '';

              stream.on('data', (d: Buffer | string) => {
                if (rawStdout.length < MAX_OUTPUT_BYTES) {
                  rawStdout += d.toString();
                }
              });

              stream.stderr.on('data', (d: Buffer | string) => {
                if (rawStderr.length < MAX_OUTPUT_BYTES) {
                  rawStderr += d.toString();
                }
              });

              stream.on('close', (code: number | null) => {
                let newCwd = cwd;
                let remoteExitCode = typeof code === 'number' ? code : 0;
                let cleanStdout = rawStdout;

                const pwdMatch = rawStdout.match(/___REMOTE_PWD___:(.*?)(?:\r?\n|$)/);
                if (pwdMatch && pwdMatch[1]) {
                  newCwd = pwdMatch[1].trim();
                }

                const exitMatch = rawStdout.match(/___REMOTE_EXIT___:(.*?)(?:\r?\n|$)/);
                if (exitMatch && exitMatch[1]) {
                  const parsed = parseInt(exitMatch[1].trim(), 10);
                  if (!isNaN(parsed)) remoteExitCode = parsed;
                }

                // Strip internal markers from output
                cleanStdout = cleanStdout
                  .replace(/___REMOTE_PWD___:.*?(?:\r?\n|$)/g, '')
                  .replace(/___REMOTE_EXIT___:.*?(?:\r?\n|$)/g, '');

                cleanStdout = sanitizeTerminalOutput(cleanStdout);
                const cleanStderr = sanitizeTerminalOutput(rawStderr);

                const flagRegex = /\b[A-Za-z0-9]{32}\b/g;
                const detectedFlags = Array.from(new Set(cleanStdout.match(flagRegex) || []));

                cleanupAndResolve(
                  NextResponse.json(
                    {
                      success: true,
                      stdout: cleanStdout.replace(/\n+$/, ''),
                      stderr: cleanStderr.trim(),
                      newCwd,
                      exitCode: remoteExitCode,
                      detectedFlags,
                    },
                    { headers }
                  )
                );
              });
            });
          })
          .on('error', (err) => {
            cleanupAndResolve(
              NextResponse.json(
                {
                  error: err.message.includes('authentication')
                    ? 'Authentication failed: Incorrect password for this Bandit level.'
                    : `SSH Connection error: ${sanitizeTerminalOutput(err.message)}`,
                },
                { status: 401, headers }
              )
            );
          })
          .connect({
            host: resolvedIp,
            port,
            username,
            password,
            readyTimeout: timeoutMs,
            keepaliveInterval: 5000,
          });
      });
    }

    releaseConcurrency();
    return NextResponse.json({ error: 'Invalid action. Supported: "test" or "exec"' }, { status: 400, headers });
  } catch (error) {
    releaseConcurrency();
    if (error instanceof RequestBodyError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500, headers }
    );
  }
}
