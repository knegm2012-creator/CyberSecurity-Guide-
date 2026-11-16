import { compileCToWasm, type WasmCompileMetadata } from './c-compiler.ts';

export interface WasmHeapStats {
  allocations: number;
  frees: number;
  leakedBytes: number;
  peakHeapBytes: number;
}

export interface CWasmExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  compileError?: string;
  wasmMetadata?: {
    totalBytes: number;
    dataBytes: number;
    functions: string[];
    hexHeader: string;
    memoryLayout: WasmCompileMetadata['memoryLayout'];
    heapStats: WasmHeapStats;
  };
}

class ExitSignal extends Error {
  public code: number;
  constructor(code: number) {
    super(`Program exited with status ${code}`);
    this.code = code;
  }
}

class WatchdogTimeoutError extends Error {
  constructor() {
    super('Execution halted: Loop instruction limit exceeded (possible infinite loop).');
  }
}

const HEAP_BASE = 0x4000;
const HEAP_GUARD_LIMIT = 0x28000; // Leave 0x28000..0x40000 (96KB) reserved for downward stack unless memory grows above stack
const MAX_OUTPUT_CHARS = 512 * 1024;
const MAX_TICKS = 5_000_000;

function readCString(mem: Uint8Array, ptr: number, maxLen = 65536): string {
  if (ptr <= 0 || ptr >= mem.length) return '';
  let end = ptr;
  const limit = Math.min(mem.length, ptr + maxLen);
  while (end < limit && mem[end] !== 0) end++;
  return new TextDecoder().decode(mem.subarray(ptr, end));
}

function writeCString(mem: Uint8Array, ptr: number, str: string, maxBytes?: number): number {
  if (ptr <= 0 || ptr >= mem.length) return 0;
  const encoded = new TextEncoder().encode(str);
  const limit =
    maxBytes !== undefined
      ? Math.max(0, Math.min(maxBytes - 1, mem.length - ptr - 1))
      : Math.max(0, mem.length - ptr - 1);
  const count = Math.min(encoded.length, limit);
  mem.set(encoded.subarray(0, count), ptr);
  if (ptr + count < mem.length) {
    mem[ptr + count] = 0;
  }
  return encoded.length;
}

function formatPrintf(
  fmt: string,
  argCount: number,
  varargsPtr: number,
  memory: WebAssembly.Memory
): string {
  const view = new DataView(memory.buffer);
  const mem = new Uint8Array(memory.buffer);
  let argIndex = 0;

  const readArg = (): { tag: number; i32: number; u32: number; i64: bigint; f64: number } => {
    if (argIndex >= argCount || varargsPtr <= 0 || varargsPtr + argIndex * 16 + 16 > memory.buffer.byteLength) {
      argIndex++;
      return { tag: 0, i32: 0, u32: 0, i64: BigInt(0), f64: 0 };
    }
    const base = varargsPtr + argIndex * 16;
    argIndex++;
    const tag = view.getInt32(base, true);
    const i32 = view.getInt32(base + 8, true);
    const u32 = view.getUint32(base + 8, true);
    const i64 = view.getBigInt64(base + 8, true);
    const f64 = view.getFloat64(base + 8, true);
    return { tag, i32, u32, i64, f64 };
  };

  let out = '';
  let i = 0;
  while (i < fmt.length) {
    if (fmt[i] !== '%') {
      out += fmt[i++];
      continue;
    }
    i++; // skip '%'
    if (fmt[i] === '%') {
      out += '%';
      i++;
      continue;
    }

    // Parse flags: '-', '+', ' ', '0', '#'
    let leftAlign = false;
    let zeroPad = false;
    let showPlus = false;
    while (i < fmt.length && (fmt[i] === '-' || fmt[i] === '+' || fmt[i] === ' ' || fmt[i] === '0' || fmt[i] === '#')) {
      if (fmt[i] === '-') leftAlign = true;
      else if (fmt[i] === '0') zeroPad = true;
      else if (fmt[i] === '+') showPlus = true;
      i++;
    }

    // Width
    let width = 0;
    if (fmt[i] === '*') {
      width = readArg().i32;
      i++;
    } else {
      while (i < fmt.length && fmt[i] >= '0' && fmt[i] <= '9') {
        width = width * 10 + (fmt[i].charCodeAt(0) - 48);
        i++;
      }
    }

    // Precision
    let precision: number | null = null;
    if (fmt[i] === '.') {
      i++;
      precision = 0;
      if (fmt[i] === '*') {
        precision = Math.max(0, readArg().i32);
        i++;
      } else {
        while (i < fmt.length && fmt[i] >= '0' && fmt[i] <= '9') {
          precision = precision * 10 + (fmt[i].charCodeAt(0) - 48);
          i++;
        }
      }
    }

    // Length modifiers (l, ll, z, h)
    let isLongLong = false;
    while (i < fmt.length && (fmt[i] === 'l' || fmt[i] === 'h' || fmt[i] === 'z')) {
      if (fmt[i] === 'l' && fmt[i + 1] === 'l') {
        isLongLong = true;
        i += 2;
      } else {
        i++;
      }
    }

    const spec = fmt[i] || '';
    i++;
    const arg = readArg();
    let piece = '';

    const getNumericInt = (): bigint => {
      if (arg.tag === 2) return arg.i64;
      if (arg.tag === 4) return BigInt.asUintN(64, arg.i64);
      if (arg.tag === 3) return BigInt(Math.trunc(arg.f64));
      if (arg.tag === 1 || arg.tag === 5) return BigInt(arg.u32);
      return BigInt(arg.i32);
    };

    const getNumericFloat = (): number => {
      if (arg.tag === 3) return arg.f64;
      if (arg.tag === 2 || arg.tag === 4) return Number(arg.i64);
      return arg.i32;
    };

    if (spec === 'd' || spec === 'i') {
      const val = isLongLong && (arg.tag === 2 || arg.tag === 4) ? arg.i64 : getNumericInt();
      piece = val >= BigInt(0) && showPlus ? `+${val}` : `${val}`;
    } else if (spec === 'u') {
      const val = arg.tag === 4 || arg.tag === 2 ? BigInt.asUintN(64, arg.i64) : BigInt(arg.u32 >>> 0);
      piece = `${val}`;
    } else if (spec === 'x' || spec === 'X') {
      const val = arg.tag === 2 || arg.tag === 4 ? BigInt.asUintN(64, arg.i64) : BigInt(arg.u32 >>> 0);
      piece = val.toString(16);
      if (spec === 'X') piece = piece.toUpperCase();
    } else if (spec === 'o') {
      const val = arg.tag === 2 || arg.tag === 4 ? BigInt.asUintN(64, arg.i64) : BigInt(arg.u32 >>> 0);
      piece = val.toString(8);
    } else if (spec === 'p') {
      piece = `0x${(arg.u32 >>> 0).toString(16).padStart(8, '0')}`;
    } else if (spec === 'f' || spec === 'F') {
      const prec = precision ?? 6;
      const val = getNumericFloat();
      piece = val.toFixed(prec);
      if (val >= 0 && showPlus) piece = `+${piece}`;
    } else if (spec === 'e' || spec === 'E') {
      const prec = precision ?? 6;
      piece = getNumericFloat().toExponential(prec);
      if (spec === 'E') piece = piece.toUpperCase();
    } else if (spec === 'g' || spec === 'G') {
      const prec = precision ?? 6;
      piece = Number(getNumericFloat().toPrecision(Math.max(1, prec))).toString();
    } else if (spec === 'c') {
      piece = String.fromCharCode((arg.i32 & 0xff) || 0);
    } else if (spec === 's') {
      const rawStr = arg.u32 === 0 ? '(null)' : readCString(mem, arg.u32);
      piece = precision !== null ? rawStr.slice(0, precision) : rawStr;
    } else {
      piece = `%${spec}`;
    }

    if (width > piece.length) {
      const padChar = zeroPad && !leftAlign && spec !== 's' && spec !== 'c' ? '0' : ' ';
      const pad = padChar.repeat(width - piece.length);
      piece = leftAlign ? piece + pad : pad + piece;
    }
    out += piece;
  }

  return out;
}

/**
 * Compiles & executes C source code directly via WebAssembly.instantiate in a linear Memory.
 */
export async function executeCInWasm(
  code: string,
  stdin = '',
  timeoutMs = 5000
): Promise<CWasmExecutionResult> {
  const start = Date.now();
  let meta: WasmCompileMetadata;

  try {
    meta = compileCToWasm(code);
  } catch (err) {
    return {
      success: false,
      stdout: '',
      stderr: err instanceof Error ? err.message : 'Compilation failed.',
      compileError: err instanceof Error ? err.message : 'Compilation failed.',
      exitCode: 1,
      executionTimeMs: Date.now() - start,
    };
  }

  const memory = new WebAssembly.Memory({ initial: 4, maximum: 256 });
  let stdout = '';
  let stderr = '';
  let stdinPos = 0;
  let tickCount = 0;
  let rngState = 123456789;

  // Heap allocator state inside linear WebAssembly.Memory starting at HEAP_BASE (0x4000)
  let heapBump = HEAP_BASE;
  const activeAllocations = new Map<number, number>();
  const freeBlocks: Array<{ ptr: number; size: number }> = [];
  const heapStats: WasmHeapStats = {
    allocations: 0,
    frees: 0,
    leakedBytes: 0,
    peakHeapBytes: 0,
  };

  const appendOut = (stream: 1 | 2, text: string) => {
    if (stream === 2) {
      if (stderr.length < MAX_OUTPUT_CHARS) {
        stderr += text.slice(0, MAX_OUTPUT_CHARS - stderr.length);
      }
    } else {
      if (stdout.length < MAX_OUTPUT_CHARS) {
        stdout += text.slice(0, MAX_OUTPUT_CHARS - stdout.length);
      }
    }
  };

  const allocHeap = (reqBytes: number): number => {
    const size = Math.max(8, Math.ceil(reqBytes / 8) * 8);
    // First-fit from free list
    const reusableIdx = freeBlocks.findIndex((b) => b.size >= size);
    if (reusableIdx !== -1) {
      const blk = freeBlocks.splice(reusableIdx, 1)[0];
      activeAllocations.set(blk.ptr, blk.size);
      heapStats.allocations++;
      return blk.ptr;
    }

    if (heapBump + size > HEAP_GUARD_LIMIT) {
      // Place overflow heap allocations above stackTop (0x40000+) cleanly via memory.grow()
      const overflowBase = Math.max(heapBump, 0x40000);
      const neededBytes = overflowBase + size;
      const currentBytes = memory.buffer.byteLength;
      if (neededBytes > currentBytes) {
        const extraPages = Math.ceil((neededBytes - currentBytes) / 65536);
        try {
          memory.grow(extraPages);
        } catch {
          return 0;
        }
      }
      heapBump = overflowBase + size;
      activeAllocations.set(overflowBase, size);
      heapStats.allocations++;
      heapStats.peakHeapBytes = Math.max(heapStats.peakHeapBytes, heapBump - HEAP_BASE);
      return overflowBase;
    }

    const ptr = heapBump;
    heapBump += size;
    activeAllocations.set(ptr, size);
    heapStats.allocations++;
    heapStats.peakHeapBytes = Math.max(heapStats.peakHeapBytes, heapBump - HEAP_BASE);
    return ptr;
  };

  const freeHeap = (ptr: number) => {
    if (ptr === 0) return;
    const size = activeAllocations.get(ptr);
    if (size === undefined) {
      appendOut(2, `[WASM Heap Warning: Attempted free() on invalid or already-freed pointer 0x${(ptr >>> 0).toString(16)}]\n`);
      return;
    }
    activeAllocations.delete(ptr);
    freeBlocks.push({ ptr, size });
    heapStats.frees++;
  };

  const imports: WebAssembly.Imports = {
    env: {
      memory,
      __tick: () => {
        tickCount++;
        if (tickCount > MAX_TICKS || Date.now() - start > timeoutMs) {
          throw new WatchdogTimeoutError();
        }
      },
      __putchar: (ch: number) => {
        appendOut(1, String.fromCharCode(ch & 0xff));
        return ch & 0xff;
      },
      __puts: (ptr: number) => {
        const str = readCString(new Uint8Array(memory.buffer), ptr);
        appendOut(1, `${str}\n`);
        return 1;
      },
      __printf: (fmtPtr: number, argc: number, argvPtr: number) => {
        const fmt = readCString(new Uint8Array(memory.buffer), fmtPtr);
        const formatted = formatPrintf(fmt, argc, argvPtr, memory);
        appendOut(1, formatted);
        return formatted.length;
      },
      __fprintf: (stream: number, fmtPtr: number, argc: number, argvPtr: number) => {
        const fmt = readCString(new Uint8Array(memory.buffer), fmtPtr);
        const formatted = formatPrintf(fmt, argc, argvPtr, memory);
        appendOut(stream === 2 ? 2 : 1, formatted);
        return formatted.length;
      },
      __sprintf: (dstPtr: number, fmtPtr: number, argc: number, argvPtr: number) => {
        const fmt = readCString(new Uint8Array(memory.buffer), fmtPtr);
        const formatted = formatPrintf(fmt, argc, argvPtr, memory);
        return writeCString(new Uint8Array(memory.buffer), dstPtr, formatted);
      },
      __snprintf: (dstPtr: number, maxSize: number, fmtPtr: number, argc: number, argvPtr: number) => {
        const fmt = readCString(new Uint8Array(memory.buffer), fmtPtr);
        const formatted = formatPrintf(fmt, argc, argvPtr, memory);
        return writeCString(new Uint8Array(memory.buffer), dstPtr, formatted, maxSize);
      },
      __getchar: () => {
        if (stdinPos >= stdin.length) return -1;
        return stdin.charCodeAt(stdinPos++);
      },
      __fgets: (dstPtr: number, size: number, _stream: number) => {
        if (stdinPos >= stdin.length || size <= 1) return 0;
        let line = '';
        while (stdinPos < stdin.length && line.length < size - 1) {
          const c = stdin[stdinPos++];
          line += c;
          if (c === '\n') break;
        }
        writeCString(new Uint8Array(memory.buffer), dstPtr, line, size);
        return dstPtr;
      },
      __scanf: (fmtPtr: number, argc: number, argvPtr: number) => {
        const mem = new Uint8Array(memory.buffer);
        const view = new DataView(memory.buffer);
        const fmt = readCString(mem, fmtPtr);
        const specifiers = fmt.match(/%[diufcs]/g) || [];
        let matched = 0;
        for (let idx = 0; idx < Math.min(specifiers.length, argc); idx++) {
          const spec = specifiers[idx];
          const destPtr = view.getUint32(argvPtr + idx * 16 + 8, true);
          if (!destPtr) break;

          if (spec !== '%c') {
            while (stdinPos < stdin.length && /\s/.test(stdin[stdinPos])) stdinPos++;
          }
          if (stdinPos >= stdin.length) break;

          if (spec === '%c') {
            mem[destPtr] = stdin.charCodeAt(stdinPos++);
            matched++;
          } else if (spec === '%s') {
            let tok = '';
            while (stdinPos < stdin.length && !/\s/.test(stdin[stdinPos])) {
              tok += stdin[stdinPos++];
            }
            writeCString(mem, destPtr, tok);
            matched++;
          } else {
            let tok = '';
            while (stdinPos < stdin.length && !/\s/.test(stdin[stdinPos])) {
              tok += stdin[stdinPos++];
            }
            if (spec === '%f') {
              const val = parseFloat(tok);
              if (!Number.isNaN(val)) {
                view.setFloat64(destPtr, val, true);
                matched++;
              }
            } else {
              const val = parseInt(tok, 10);
              if (!Number.isNaN(val)) {
                view.setInt32(destPtr, val | 0, true);
                matched++;
              }
            }
          }
        }
        return matched;
      },
      __malloc: allocHeap,
      __calloc: (n: number, size: number) => {
        const total = n * size;
        const ptr = allocHeap(total);
        if (ptr > 0) {
          new Uint8Array(memory.buffer).fill(0, ptr, ptr + total);
        }
        return ptr;
      },
      __realloc: (ptr: number, newSize: number) => {
        if (ptr === 0) return allocHeap(newSize);
        const oldSize = activeAllocations.get(ptr) ?? 0;
        const nextPtr = allocHeap(newSize);
        if (nextPtr > 0 && oldSize > 0) {
          const mem = new Uint8Array(memory.buffer);
          mem.copyWithin(nextPtr, ptr, ptr + Math.min(oldSize, newSize));
          freeHeap(ptr);
        }
        return nextPtr;
      },
      __free: freeHeap,
      __strlen: (ptr: number) => readCString(new Uint8Array(memory.buffer), ptr).length,
      __strcpy: (dst: number, src: number) => {
        const mem = new Uint8Array(memory.buffer);
        const str = readCString(mem, src);
        writeCString(mem, dst, str);
        return dst;
      },
      __strncpy: (dst: number, src: number, n: number) => {
        const mem = new Uint8Array(memory.buffer);
        const str = readCString(mem, src);
        const enc = new TextEncoder().encode(str);
        const count = Math.min(enc.length, Math.max(0, n));
        mem.set(enc.subarray(0, count), dst);
        for (let k = count; k < n && dst + k < mem.length; k++) {
          mem[dst + k] = 0;
        }
        return dst;
      },
      __strcmp: (a: number, b: number) => {
        const mem = new Uint8Array(memory.buffer);
        const sa = readCString(mem, a);
        const sb = readCString(mem, b);
        return sa === sb ? 0 : sa < sb ? -1 : 1;
      },
      __strncmp: (a: number, b: number, n: number) => {
        const mem = new Uint8Array(memory.buffer);
        const sa = readCString(mem, a).slice(0, n);
        const sb = readCString(mem, b).slice(0, n);
        return sa === sb ? 0 : sa < sb ? -1 : 1;
      },
      __strcat: (dst: number, src: number) => {
        const mem = new Uint8Array(memory.buffer);
        const cur = readCString(mem, dst);
        const add = readCString(mem, src);
        writeCString(mem, dst, cur + add);
        return dst;
      },
      __memset: (ptr: number, val: number, n: number) => {
        const mem = new Uint8Array(memory.buffer);
        mem.fill(val & 0xff, ptr, Math.min(mem.length, ptr + n));
        return ptr;
      },
      __memcpy: (dst: number, src: number, n: number) => {
        const mem = new Uint8Array(memory.buffer);
        mem.copyWithin(dst, src, Math.min(mem.length, src + n));
        return dst;
      },
      __atoi: (ptr: number) => parseInt(readCString(new Uint8Array(memory.buffer), ptr), 10) || 0,
      __atof: (ptr: number) => parseFloat(readCString(new Uint8Array(memory.buffer), ptr)) || 0,
      __rand: () => {
        rngState = (1103515245 * rngState + 12345) & 0x7fffffff;
        return rngState;
      },
      __srand: (seed: number) => {
        rngState = seed >>> 0;
      },
      __exit: (code: number) => {
        throw new ExitSignal(code | 0);
      },
      __sqrt: (x: number) => Math.sqrt(x),
      __pow: (a: number, b: number) => Math.pow(a, b),
      __sin: (x: number) => Math.sin(x),
      __cos: (x: number) => Math.cos(x),
      __tan: (x: number) => Math.tan(x),
      __floor: (x: number) => Math.floor(x),
      __ceil: (x: number) => Math.ceil(x),
      __round: (x: number) => Math.round(x),
      __fabs: (x: number) => Math.abs(x),
      __log: (x: number) => Math.log(x),
      __log2: (x: number) => Math.log2(x),
      __log10: (x: number) => Math.log10(x),
      __exp: (x: number) => Math.exp(x),
      __fmin: (a: number, b: number) => Math.min(a, b),
      __fmax: (a: number, b: number) => Math.max(a, b),
    },
  };

  let exitCode = 0;
  try {
    const { instance } = await WebAssembly.instantiate(
      meta.wasmBytes as BufferSource,
      imports
    );
    const mainFn = instance.exports.main as () => number;
    if (typeof mainFn !== 'function') {
      throw new Error('WASM export "main" missing.');
    }
    const ret = mainFn();
    exitCode = typeof ret === 'number' ? ret | 0 : 0;
  } catch (err) {
    if (err instanceof ExitSignal) {
      exitCode = err.code;
    } else if (err instanceof WatchdogTimeoutError) {
      exitCode = 124;
      appendOut(2, `${err.message}\n`);
    } else {
      exitCode = 1;
      appendOut(2, `WebAssembly Runtime Trap: ${err instanceof Error ? err.message : String(err)}\n`);
    }
  }

  for (const bytes of activeAllocations.values()) {
    heapStats.leakedBytes += bytes;
  }

  return {
    success: exitCode === 0,
    stdout,
    stderr,
    exitCode,
    executionTimeMs: Math.max(1, Date.now() - start),
    wasmMetadata: {
      totalBytes: meta.totalBytes,
      dataBytes: meta.dataBytes,
      functions: meta.functions,
      hexHeader: meta.hexHeader,
      memoryLayout: meta.memoryLayout,
      heapStats,
    },
  };
}
