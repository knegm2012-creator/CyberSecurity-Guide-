/**
 * CS Odyssey Browser WebAssembly Python Worker
 * Runs MicroPython 1.29 WASM inside a dedicated ES Module Web Worker so execution
 * is non-blocking, sandboxed from DOM/cookies/secrets, and safely terminable.
 */

import { loadMicroPython } from '/wasm/micropython.mjs';

// Compact synchronous SHA-256 + HMAC + PBKDF2-HMAC-SHA256 for fast key-derivation in WASM
const K256 = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function sha256Bytes(msg) {
  const bitLen = msg.length * 8;
  const padLen = ((msg.length + 9 + 63) & ~63);
  const padded = new Uint8Array(padLen);
  padded.set(msg);
  padded[msg.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padLen - 4, bitLen >>> 0, false);
  view.setUint32(padLen - 8, Math.floor(bitLen / 0x100000000), false);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Uint32Array(64);

  for (let off = 0; off < padLen; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = ((w[i - 15] >>> 7) | (w[i - 15] << 25)) ^ ((w[i - 15] >>> 18) | (w[i - 15] << 14)) ^ (w[i - 15] >>> 3);
      const s1 = ((w[i - 2] >>> 17) | (w[i - 2] << 15)) ^ ((w[i - 2] >>> 19) | (w[i - 2] << 13)) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K256[i] + w[i]) | 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0;
      d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }
  const out = new Uint8Array(32);
  const ov = new DataView(out.buffer);
  ov.setUint32(0, h0, false); ov.setUint32(4, h1, false); ov.setUint32(8, h2, false); ov.setUint32(12, h3, false);
  ov.setUint32(16, h4, false); ov.setUint32(20, h5, false); ov.setUint32(24, h6, false); ov.setUint32(28, h7, false);
  return out;
}

function hmacSha256(keyBytes, msgBytes) {
  let k = keyBytes;
  if (k.length > 64) k = sha256Bytes(k);
  const ipad = new Uint8Array(64 + msgBytes.length);
  const opad = new Uint8Array(64 + 32);
  ipad.fill(0x36, 0, 64);
  opad.fill(0x5c, 0, 64);
  for (let i = 0; i < k.length; i++) {
    ipad[i] ^= k[i];
    opad[i] ^= k[i];
  }
  ipad.set(msgBytes, 64);
  opad.set(sha256Bytes(ipad), 64);
  return sha256Bytes(opad);
}

function pbkdf2Hex(_hashName, pwArr, saltArr, iterations, dklen) {
  const pw = Uint8Array.from(pwArr);
  const salt = Uint8Array.from(saltArr);
  const len = Number(dklen) || 32;
  const blocks = Math.ceil(len / 32);
  const dk = new Uint8Array(blocks * 32);
  const msg = new Uint8Array(salt.length + 4);
  msg.set(salt);

  for (let b = 1; b <= blocks; b++) {
    msg[salt.length] = (b >>> 24) & 0xff;
    msg[salt.length + 1] = (b >>> 16) & 0xff;
    msg[salt.length + 2] = (b >>> 8) & 0xff;
    msg[salt.length + 3] = b & 0xff;

    let u = hmacSha256(pw, msg);
    const acc = new Uint8Array(u);
    for (let i = 1; i < iterations; i++) {
      u = hmacSha256(pw, u);
      for (let j = 0; j < 32; j++) acc[j] ^= u[j];
    }
    dk.set(acc, (b - 1) * 32);
  }
  return Array.from(dk.slice(0, len))
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}

globalThis.__csOdysseyWasmHost = { pbkdf2Hex };

let mp = null;
let stdoutBuf = '';
let stderrBuf = '';
const MAX_OUTPUT_CHARS = 512 * 1024;
let preludeLoaded = false;

async function ensureMicroPython(prelude) {
  if (!mp) {
    mp = await loadMicroPython({
      url: '/wasm/micropython.wasm',
      heapsize: 16 * 1024 * 1024,
      linebuffer: true,
      stdout: (line) => {
        if (stdoutBuf.length < MAX_OUTPUT_CHARS) {
          stdoutBuf += line + '\n';
        }
      },
      stderr: (line) => {
        if (stderrBuf.length < MAX_OUTPUT_CHARS) {
          stderrBuf += line + '\n';
        }
      },
    });
  }
  if (!preludeLoaded && prelude) {
    mp.runPython(prelude);
    preludeLoaded = true;
  }
}

self.onmessage = async (event) => {
  const { id, type, code, stdin, prelude } = event.data || {};
  if (type !== 'run') return;

  const t0 = performance.now();
  stdoutBuf = '';
  stderrBuf = '';

  try {
    await ensureMicroPython(prelude);
    // Reset stdin safely using JSON-encoded string literal
    mp.runPython(`__cs_odyssey_set_stdin(${JSON.stringify(stdin || '')})`);
    mp.runPython(String(code || ''));
    self.postMessage({
      id,
      success: true,
      stdout: stdoutBuf,
      stderr: stderrBuf,
      exitCode: 0,
      executionTimeMs: Math.max(1, Math.round(performance.now() - t0)),
    });
  } catch (err) {
    const errText = err && err.message ? err.message : String(err);
    self.postMessage({
      id,
      success: false,
      stdout: stdoutBuf,
      stderr: (stderrBuf ? stderrBuf + '\n' : '') + errText,
      exitCode: 1,
      executionTimeMs: Math.max(1, Math.round(performance.now() - t0)),
    });
  }
};
