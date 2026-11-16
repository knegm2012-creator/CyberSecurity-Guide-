'use client';

import { executeCInWasm, type WasmHeapStats } from './c-runtime';
import { PYTHON_WASM_PRELUDE } from './python-prelude';

export interface BrowserWasmResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  engine: 'micropython-wasm' | 'c-wasm';
  engineLabel: string;
  wasmMetadata?: {
    totalBytes: number;
    dataBytes: number;
    functions: string[];
    hexHeader: string;
    memoryLayout: {
      rodataStart: number;
      heapStart: number;
      stackTop: number;
    };
    heapStats: WasmHeapStats;
  };
}

const DEFAULT_TIMEOUT_MS = 5000;

let pythonWorker: Worker | null = null;
let activePythonReject: ((err: Error) => void) | null = null;
let activeCTimeout: ReturnType<typeof setTimeout> | null = null;
let requestSeq = 0;

function terminatePythonWorker(reason?: string) {
  if (pythonWorker) {
    try {
      pythonWorker.terminate();
    } catch {
      // Ignore cleanup errors
    }
    pythonWorker = null;
  }
  if (activePythonReject) {
    activePythonReject(new Error(reason || 'Python WebAssembly worker terminated.'));
    activePythonReject = null;
  }
}

export function abortBrowserWasmExecution(): void {
  terminatePythonWorker('Execution stopped by user.');
  if (activeCTimeout) {
    clearTimeout(activeCTimeout);
    activeCTimeout = null;
  }
}

async function runPythonInWasmWorker(
  code: string,
  stdin: string,
  timeoutMs: number
): Promise<BrowserWasmResult> {
  if (typeof Worker === 'undefined') {
    return {
      success: false,
      stdout: '',
      stderr: 'Web Workers are unavailable in this environment.',
      exitCode: 1,
      executionTimeMs: 0,
      engine: 'micropython-wasm',
      engineLabel: 'MicroPython 1.29 · WASM (440 KB VM)',
    };
  }

  return new Promise<BrowserWasmResult>((resolve) => {
    const id = ++requestSeq;
    let settled = false;

    if (!pythonWorker) {
      pythonWorker = new Worker('/wasm/python-worker.mjs', { type: 'module' });
    }
    const worker = pythonWorker;

    const cleanup = () => {
      clearTimeout(timer);
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      if (activePythonReject) {
        activePythonReject = null;
      }
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      terminatePythonWorker();
      resolve({
        success: false,
        stdout: '',
        stderr: `Execution timed out after ${(timeoutMs / 1000).toFixed(1)}s in WebAssembly sandbox (possible infinite loop). Worker terminated cleanly.`,
        exitCode: 124,
        executionTimeMs: timeoutMs,
        engine: 'micropython-wasm',
        engineLabel: 'MicroPython 1.29 · WASM (440 KB VM)',
      });
    }, timeoutMs);

    activePythonReject = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({
        success: false,
        stdout: '',
        stderr: err.message,
        exitCode: 130,
        executionTimeMs: 0,
        engine: 'micropython-wasm',
        engineLabel: 'MicroPython 1.29 · WASM (440 KB VM)',
      });
    };

    const onMessage = (ev: MessageEvent) => {
      const data = ev.data;
      if (!data || data.id !== id) return;
      if (settled) return;
      settled = true;
      cleanup();
      resolve({
        success: Boolean(data.success),
        stdout: String(data.stdout || ''),
        stderr: String(data.stderr || ''),
        exitCode: typeof data.exitCode === 'number' ? data.exitCode : 0,
        executionTimeMs: typeof data.executionTimeMs === 'number' ? data.executionTimeMs : 1,
        engine: 'micropython-wasm',
        engineLabel: 'MicroPython 1.29 · WASM (440 KB VM)',
      });
    };

    const onError = (err: ErrorEvent) => {
      if (settled) return;
      settled = true;
      cleanup();
      terminatePythonWorker();
      resolve({
        success: false,
        stdout: '',
        stderr: `WebAssembly Worker Error: ${err.message || 'Failed to execute Python WASM module'}`,
        exitCode: 1,
        executionTimeMs: 0,
        engine: 'micropython-wasm',
        engineLabel: 'MicroPython 1.29 · WASM (440 KB VM)',
      });
    };

    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    worker.postMessage({
      id,
      type: 'run',
      code,
      stdin,
      prelude: PYTHON_WASM_PRELUDE,
    });
  });
}

export async function runCodeInBrowserWasm(params: {
  language: 'python' | 'c';
  code: string;
  stdin?: string;
  timeoutMs?: number;
}): Promise<BrowserWasmResult> {
  const timeoutMs = Math.max(1000, Math.min(10000, params.timeoutMs ?? DEFAULT_TIMEOUT_MS));
  const stdin = params.stdin ?? '';

  if (params.language === 'python') {
    return runPythonInWasmWorker(params.code, stdin, timeoutMs);
  }

  // Yield a macrotask frame so React paints "Compiling & running in WASM..." state before synchronous compile+run
  await new Promise<void>((r) => {
    activeCTimeout = setTimeout(() => {
      activeCTimeout = null;
      r();
    }, 0);
  });

  const cRes = await executeCInWasm(params.code, stdin, timeoutMs);
  return {
    success: cRes.success,
    stdout: cRes.stdout,
    stderr: cRes.stderr,
    exitCode: cRes.exitCode,
    executionTimeMs: cRes.executionTimeMs,
    engine: 'c-wasm',
    engineLabel: 'Native C11 -> .wasm · WebAssembly.Memory',
    wasmMetadata: cRes.wasmMetadata,
  };
}
