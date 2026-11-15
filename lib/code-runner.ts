import { spawn } from 'child_process';
import fs from 'fs/promises';
import { existsSync } from 'fs';
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
  toolchainMissing?: boolean;
}

export interface ToolchainStatus {
  available: boolean;
  executable: string | null;
  version: string | null;
}

export interface ToolchainCapabilities {
  platform: NodeJS.Platform;
  arch: string;
  python: ToolchainStatus;
  gcc: ToolchainStatus;
}

// Security & Execution Boundaries
const DEFAULT_TIMEOUT_MS = 5000;
const MAX_TIMEOUT_MS = 5000; // Hard cap at 5 seconds
const MAX_OUTPUT_BUFFER_BYTES = 1024 * 1024; // 1MB buffer ceiling
const MAX_CODE_LENGTH_CHARS = 100000; // 100KB source code limit

const IS_WINDOWS = process.platform === 'win32';

function getCandidateBinDirs(): string[] {
  const hostPathEntries = (process.env.PATH || '')
    .split(path.delimiter)
    .map((p) => p.trim())
    .filter(Boolean);

  const platformDefaults = IS_WINDOWS
    ? [
        'C:\\Program Files\\LLVM\\bin',
        'C:\\msys64\\ucrt64\\bin',
        'C:\\msys64\\mingw64\\bin',
        'C:\\MinGW\\bin',
        'C:\\Windows\\System32',
      ]
    : [
        '/opt/homebrew/bin',
        '/usr/local/bin',
        '/usr/bin',
        '/bin',
      ];

  return Array.from(new Set([...platformDefaults, ...hostPathEntries]));
}

async function resolveExecutable(candidates: string[]): Promise<string | null> {
  const dirs = getCandidateBinDirs();

  for (const name of candidates) {
    for (const dir of dirs) {
      const fullPath = path.join(dir, name);
      try {
        if (existsSync(fullPath)) {
          return fullPath;
        }
      } catch {
        // Ignore unreadable directory entries
      }
    }
  }
  return null;
}

export async function resolvePythonExecutable(): Promise<string | null> {
  const candidates = IS_WINDOWS
    ? ['python3.exe', 'python.exe', 'py.exe']
    : ['python3', 'python'];
  return resolveExecutable(candidates);
}

export async function resolveGccExecutable(): Promise<string | null> {
  const candidates = IS_WINDOWS ? ['gcc.exe', 'clang.exe'] : ['gcc', 'clang'];
  return resolveExecutable(candidates);
}

/**
 * Sanitized, stripped environment to prevent credential/environment variable leaks
 * (e.g. GEMINI_API_KEY, system secrets) while remaining portable across Linux, macOS, and Windows.
 */
function getSanitizedEnv(tmpDir: string, resolvedExecutable?: string): NodeJS.ProcessEnv {
  const safePathDirs = new Set<string>(
    IS_WINDOWS
      ? ['C:\\Windows\\System32', 'C:\\Windows']
      : ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin']
  );

  if (resolvedExecutable) {
    safePathDirs.add(path.dirname(resolvedExecutable));
  }

  const baseEnv: NodeJS.ProcessEnv = {
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'production',
    PATH: Array.from(safePathDirs).join(path.delimiter),
    LANG: 'C.UTF-8',
    LC_ALL: 'C.UTF-8',
    HOME: tmpDir,
    TMPDIR: tmpDir,
    TMP: tmpDir,
    TEMP: tmpDir,
    PYTHONDONTWRITEBYTECODE: '1',
    PYTHONUNBUFFERED: '1',
    PYTHONHASHSEED: 'random',
  };

  if (IS_WINDOWS) {
    baseEnv.USERPROFILE = tmpDir;
    if (process.env.SYSTEMROOT) baseEnv.SYSTEMROOT = process.env.SYSTEMROOT;
    if (process.env.COMSPEC) baseEnv.COMSPEC = process.env.COMSPEC;
  }

  return baseEnv;
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
      env: envOverride || getSanitizedEnv(cwd, executable),
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

async function probeVersion(executable: string | null): Promise<ToolchainStatus> {
  if (!executable) {
    return { available: false, executable: null, version: null };
  }
  const tmpDir = os.tmpdir();
  const res = await runSubprocessDirect(executable, ['--version'], tmpDir, '', 2000);
  const firstLine = (res.stdout || res.stderr || '').split('\n')[0]?.trim() || null;
  return {
    available: res.exitCode === 0,
    executable: path.basename(executable),
    version: firstLine,
  };
}

export async function detectToolchainCapabilities(): Promise<ToolchainCapabilities> {
  const [pyExe, gccExe] = await Promise.all([
    resolvePythonExecutable(),
    resolveGccExecutable(),
  ]);
  const [python, gcc] = await Promise.all([
    probeVersion(pyExe),
    probeVersion(gccExe),
  ]);

  return {
    platform: process.platform,
    arch: process.arch,
    python,
    gcc,
  };
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
  const timeoutMs = Math.min(MAX_TIMEOUT_MS, Math.max(1000, Number(req.timeoutMs) || DEFAULT_TIMEOUT_MS));

  if (!code || typeof code !== 'string') {
    throw new Error('Code is required.');
  }

  if (code.length > MAX_CODE_LENGTH_CHARS) {
    throw new Error(`Code length exceeds maximum allowed limit (${MAX_CODE_LENGTH_CHARS} characters).`);
  }

  if (typeof stdin !== 'string' || stdin.length > 65536) {
    throw new Error('Standard input must be a string under 64KB.');
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
      const pythonBin = await resolvePythonExecutable();
      if (!pythonBin) {
        return {
          success: false,
          stdout: '',
          stderr:
            'Python 3 runtime was not found on this machine.\nInstall Python 3: macOS (`brew install python`), Ubuntu/Debian (`sudo apt install python3`), or Windows (`winget install Python.Python.3.12`), or use the provided Dockerfile.',
          exitCode: 127,
          executionTimeMs: Date.now() - startTime,
          toolchainMissing: true,
        };
      }

      const scriptPath = path.join(tmpDir, 'main.py');
      await fs.writeFile(scriptPath, code, { encoding: 'utf-8', mode: 0o600 });

      const runArgs = path.basename(pythonBin).toLowerCase().startsWith('py.exe')
        ? ['-3', '-I', '-u', scriptPath]
        : ['-I', '-u', scriptPath];

      const runResult = await runSubprocessDirect(
        pythonBin,
        runArgs,
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
      const gccBin = await resolveGccExecutable();
      if (!gccBin) {
        return {
          success: false,
          stdout: '',
          stderr:
            'GCC/Clang C compiler was not found on this machine.\nInstall C compiler: macOS (`xcode-select --install`), Ubuntu/Debian (`sudo apt install build-essential`), or Windows (`winget install MSYS2.MSYS2` + mingw-w64), or use the provided Dockerfile.',
          exitCode: 127,
          executionTimeMs: Date.now() - startTime,
          toolchainMissing: true,
        };
      }

      const sourcePath = path.join(tmpDir, 'main.c');
      const binPath = path.join(tmpDir, IS_WINDOWS ? 'main.exe' : 'main.out');

      await fs.writeFile(sourcePath, code, { encoding: 'utf-8', mode: 0o600 });

      // Step 1: Compile with gcc/clang directly using explicit argument vector
      const compileArgs = [
        '-O2',
        '-Wall',
        '-Wextra',
        '-std=c11',
        sourcePath,
        '-o',
        binPath,
        ...(IS_WINDOWS ? [] : ['-lm']),
      ];

      const compileResult = await runSubprocessDirect(
        gccBin,
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
