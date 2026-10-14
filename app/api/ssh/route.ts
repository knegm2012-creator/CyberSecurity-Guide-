import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'ssh2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SshRequest {
  action: 'test' | 'exec';
  host?: string;
  port?: number;
  username: string;
  password?: string;
  command?: string;
  cwd?: string;
  timeoutMs?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SshRequest;
    const host = body.host || 'bandit.labs.overthewire.org';
    const port = Number(body.port) || 2220;
    const username = body.username?.trim();
    const password = body.password ?? '';
    const command = body.command;
    const cwd = body.cwd || `/home/${username}`;
    const timeoutMs = Math.min(30000, Math.max(2000, body.timeoutMs || 15000));

    if (!username) {
      return NextResponse.json({ error: 'Username is required (e.g. bandit0)' }, { status: 400 });
    }

    // ACTION: TEST CONNECTION / LOGIN
    if (body.action === 'test') {
      return new Promise<NextResponse>((resolve) => {
        const conn = new Client();
        let isResolved = false;

        const timer = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            conn.end();
            resolve(
              NextResponse.json(
                { error: `Connection timed out connecting to ${host}:${port}` },
                { status: 504 }
              )
            );
          }
        }, timeoutMs);

        conn
          .on('ready', () => {
            conn.exec('uname -a && pwd', (err, stream) => {
              if (err) {
                if (!isResolved) {
                  isResolved = true;
                  clearTimeout(timer);
                  conn.end();
                  resolve(NextResponse.json({ error: err.message }, { status: 500 }));
                }
                return;
              }

              let infoOut = '';
              stream.on('data', (d: Buffer | string) => {
                infoOut += d.toString();
              });

              stream.on('close', () => {
                if (!isResolved) {
                  isResolved = true;
                  clearTimeout(timer);
                  conn.end();
                  resolve(
                    NextResponse.json({
                      success: true,
                      message: `Successfully connected to ${host}:${port} as ${username}`,
                      host,
                      port,
                      username,
                      systemInfo: infoOut.trim(),
                      defaultDir: `/home/${username}`,
                    })
                  );
                }
              });
            });
          })
          .on('error', (err) => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timer);
              resolve(
                NextResponse.json(
                  {
                    error:
                      err.message.includes('authentication')
                        ? 'SSH Authentication failed. Check your password or flag!'
                        : `SSH Connection error: ${err.message}`,
                  },
                  { status: 401 }
                )
              );
            }
          })
          .connect({
            host,
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
        return NextResponse.json({ error: 'No command provided' }, { status: 400 });
      }

      return new Promise<NextResponse>((resolve) => {
        const conn = new Client();
        let isResolved = false;

        const timer = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            conn.end();
            resolve(
              NextResponse.json(
                {
                  error: 'Command timed out on remote server (exceeded 15 seconds).',
                  timedOut: true,
                },
                { status: 504 }
              )
            );
          }
        }, timeoutMs);

        conn
          .on('ready', () => {
            // Build command string that preserves working directory and captures exit code and new cwd
            // Escape double quotes in cwd
            const safeCwd = (cwd || `/home/${username}`).replace(/"/g, '\\"');
            const trimmedCmd = command.trim();

            const fullRemoteCmd = `cd "${safeCwd}" 2>/dev/null || cd ~; ${trimmedCmd}; __RET__=$?; echo ""; echo "___REMOTE_PWD___:$(pwd)"; echo "___REMOTE_EXIT___:$__RET__"`;

            conn.exec(fullRemoteCmd, (err, stream) => {
              if (err) {
                if (!isResolved) {
                  isResolved = true;
                  clearTimeout(timer);
                  conn.end();
                  resolve(NextResponse.json({ error: err.message }, { status: 500 }));
                }
                return;
              }

              let rawStdout = '';
              let rawStderr = '';

              stream.on('data', (d: Buffer | string) => {
                rawStdout += d.toString();
              });

              stream.stderr.on('data', (d: Buffer | string) => {
                rawStderr += d.toString();
              });

              stream.on('close', (code: number | null) => {
                if (!isResolved) {
                  isResolved = true;
                  clearTimeout(timer);
                  conn.end();

                  // Parse out ___REMOTE_PWD___ and ___REMOTE_EXIT___
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

                  // Strip markers from final stdout
                  cleanStdout = cleanStdout
                    .replace(/___REMOTE_PWD___:.*?(?:\r?\n|$)/g, '')
                    .replace(/___REMOTE_EXIT___:.*?(?:\r?\n|$)/g, '')
                    .replace(/\r\n/g, '\n');

                  // Trim only trailing newline introduced by echo marker
                  cleanStdout = cleanStdout.replace(/\n+$/, '');

                  // Detect possible Bandit password / flag (32-character alphanumeric string)
                  const flagRegex = /\b[A-Za-z0-9]{32}\b/g;
                  const detectedFlags = Array.from(new Set(cleanStdout.match(flagRegex) || []));

                  resolve(
                    NextResponse.json({
                      success: true,
                      stdout: cleanStdout,
                      stderr: rawStderr.replace(/\r\n/g, '\n').trim(),
                      newCwd,
                      exitCode: remoteExitCode,
                      detectedFlags,
                    })
                  );
                }
              });
            });
          })
          .on('error', (err) => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timer);
              resolve(
                NextResponse.json(
                  {
                    error: err.message.includes('authentication')
                      ? 'Authentication failed: Incorrect password for this Bandit level.'
                      : `SSH Connection error: ${err.message}`,
                  },
                  { status: 401 }
                )
              );
            }
          })
          .connect({
            host,
            port,
            username,
            password,
            readyTimeout: timeoutMs,
            keepaliveInterval: 5000,
          });
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
