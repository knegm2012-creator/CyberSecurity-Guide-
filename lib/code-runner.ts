import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { sanitizeTerminalOutput } from './security.ts';

export interface CodeExecutionRequest {
  language: 'python' | 'c';
  code: string;
  stdin?: string;
  timeoutMs?: number;
}

export interface CodeExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  compileError?: string;
}

// Security & Execution Boundaries
const DEFAULT_TIMEOUT_MS = 5000;
const MAX_TIMEOUT_MS = 5000; // Hard cap at 5 seconds
const MAX_OUTPUT_BUFFER_BYTES = 1024 * 1024; // 1MB buffer ceiling
const MAX_CODE_LENGTH_CHARS = 100000; // 100KB source code limit

/**
 * Sanitized, stripped environment to prevent credential/environment variable leaks
 * (e.g. GEMINI_API_KEY, system secrets).
 */
function getSanitizedEnv(tmpDir: string): NodeJS.ProcessEnv {
  return {
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'production',
    PATH: '/usr/local/bin:/usr/bin:/bin',
    LANG: 'C.UTF-8',
    LC_ALL: 'C.UTF-8',
    HOME: tmpDir,
    TMPDIR: tmpDir,
    PYTHONDONTWRITEBYTECODE: '1',
    PYTHONUNBUFFERED: '1',
    PYTHONHASHSEED: 'random',
  };
}

/**
 * Spawns a subprocess with direct argument vectors, strict timeout, output caps,
 * and direct pipe-based stdin (NO shell interpolation, NO /bin/sh invocation).
 */
function runSubprocessDirect(
  executable: string,
  args: string[],
  cwd: string,
  stdinContent = '',
  timeoutMs = DEFAULT_TIMEOUT_MS,
  envOverride?: NodeJS.ProcessEnv
): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean; bufferExceeded: boolean }> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let bufferExceeded = false;
    let isFinished = false;

    const child = spawn(executable, args, {
      cwd,
      env: envOverride || getSanitizedEnv(cwd),
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false, // CRITICAL: NEVER invoke shell (/bin/sh)
      windowsHide: true,
    });

    const cleanupAndResolve = (code: number) => {
      if (!isFinished) {
        isFinished = true;
        clearTimeout(timer);
        resolve({
          stdout: sanitizeTerminalOutput(stdout),
          stderr: sanitizeTerminalOutput(stderr),
          exitCode: code,
          timedOut,
          bufferExceeded,
        });
      }
    };

    // Hard execution timeout (5 seconds max)
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill('SIGTERM');
        // Force kill after grace period if process resists SIGTERM
        setTimeout(() => {
          if (!isFinished) {
            try {
              child.kill('SIGKILL');
            } catch (_) {}
          }
        }, 500);
      } catch (_) {}
    }, timeoutMs);

    // Stdin direct pipe
    if (child.stdin) {
      try {
        if (stdinContent) {
          child.stdin.write(stdinContent);
        }
        child.stdin.end();
      } catch (_) {}
    }

    // Stdout stream capture with 1MB ceiling
    if (child.stdout) {
      child.stdout.on('data', (chunk: Buffer) => {
        if (stdout.length + chunk.length > MAX_OUTPUT_BUFFER_BYTES) {
          bufferExceeded = true;
          try {
            child.kill('SIGKILL');
          } catch (_) {}
        } else {
          stdout += chunk.toString('utf-8');
        }
      });
    }

    // Stderr stream capture with 1MB ceiling
    if (child.stderr) {
      child.stderr.on('data', (chunk: Buffer) => {
        if (stderr.length + chunk.length > MAX_OUTPUT_BUFFER_BYTES) {
          bufferExceeded = true;
          try {
            child.kill('SIGKILL');
          } catch (_) {}
        } else {
          stderr += chunk.toString('utf-8');
        }
      });
    }

    child.on('error', (err) => {
      stderr += `\n[Process spawn error: ${err.message}]`;
      cleanupAndResolve(1);
    });

    child.on('close', (code) => {
      const exitCode = typeof code === 'number' ? code : timedOut ? 124 : 1;
      cleanupAndResolve(exitCode);
    });
  });
}

/**
 * Executes user code (Python or C) inside an isolated temporary directory
 * with zero shell interpolation, stripped environment, and hard resource boundaries.
 */
export async function executeCodeSecurely(
  req: CodeExecutionRequest
): Promise<CodeExecutionResult> {
  const startTime = Date.now();
  const { language, code, stdin = '' } = req;
  const timeoutMs = Math.min(MAX_TIMEOUT_MS, Math.max(1000, req.timeoutMs || DEFAULT_TIMEOUT_MS));

  if (!code || typeof code !== 'string') {
    throw new Error('Code is required.');
  }

  if (code.length > MAX_CODE_LENGTH_CHARS) {
    throw new Error(`Code length exceeds maximum allowed limit (${MAX_CODE_LENGTH_CHARS} characters).`);
  }

  if (language !== 'python' && language !== 'c') {
    throw new Error('Unsupported language. Allowed: "python" or "c".');
  }

  // Generate isolated temporary directory with random nonce
  const randomId = crypto.randomBytes(8).toString('hex');
  const tmpDir = path.join(os.tmpdir(), `cs_odyssey_box_${randomId}`);
  await fs.mkdir(tmpDir, { recursive: true, mode: 0o700 });

  try {
    let stdout = '';
    let stderr = '';
    let exitCode = 0;
    let compileError = '';

    if (language === 'python') {
      const scriptPath = path.join(tmpDir, 'main.py');
      await fs.writeFile(scriptPath, code, { encoding: 'utf-8', mode: 0o600 });

      // Execute python3 directly: /usr/bin/python3 -u main.py
      const runResult = await runSubprocessDirect(
        'python3',
        ['-u', scriptPath],
        tmpDir,
        stdin,
        timeoutMs
      );

      stdout = runResult.stdout;
      stderr = runResult.stderr;
      exitCode = runResult.exitCode;

      if (runResult.timedOut) {
        stderr += `\n[Execution timed out after ${timeoutMs / 1000} seconds. Possible infinite loop detected.]`;
      }
      if (runResult.bufferExceeded) {
        stderr += `\n[Output limit exceeded: Process terminated after emitting over 1MB of stdout/stderr.]`;
      }
    } else if (language === 'c') {
      const sourcePath = path.join(tmpDir, 'main.c');
      const binPath = path.join(tmpDir, 'main.out');

      await fs.writeFile(sourcePath, code, { encoding: 'utf-8', mode: 0o600 });

      // Step 1: Compile with gcc directly using explicit argument vector
      const compileArgs = [
        '-O2',
        '-Wall',
        '-Wextra',
        '-std=c11',
        sourcePath,
        '-o',
        binPath,
        '-lm',
      ];

      const compileResult = await runSubprocessDirect(
        'gcc',
        compileArgs,
        tmpDir,
        '',
        timeoutMs
      );

      if (compileResult.exitCode !== 0) {
        compileError = compileResult.stderr || compileResult.stdout || 'Compilation failed';
        return {
          success: false,
          stdout: '',
          stderr: compileError,
          compileError,
          exitCode: compileResult.exitCode,
          executionTimeMs: Date.now() - startTime,
        };
      }

      if (compileResult.stderr) {
        stderr += compileResult.stderr + '\n';
      }

      // Step 2: Execute compiled binary directly with no shell
      const runResult = await runSubprocessDirect(
        binPath,
        [],
        tmpDir,
        stdin,
        timeoutMs
      );

      stdout = runResult.stdout;
      stderr += runResult.stderr;
      exitCode = runResult.exitCode;

      if (runResult.timedOut) {
        stderr += `\n[Execution timed out after ${timeoutMs / 1000} seconds. Possible infinite loop or segmentation fault.]`;
      }
      if (runResult.bufferExceeded) {
        stderr += `\n[Output limit exceeded: Process terminated after emitting over 1MB of stdout/stderr.]`;
      }
    }

    const executionTimeMs = Date.now() - startTime;

    return {
      success: exitCode === 0,
      stdout,
      stderr,
      exitCode,
      executionTimeMs,
      compileError: compileError || undefined,
    };
  } finally {
    // Guaranteed secure cleanup of sandbox directory
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch (_) {}
  }
}
