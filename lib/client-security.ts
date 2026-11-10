/**
 * CS Odyssey Client-Safe Security & Logic Hardening Module
 * 
 * Provides browser-safe utilities with zero Node built-in dependencies:
 * - Terminal ANSI & stream sanitization
 * - Virtual filesystem path canonicalization (anti-traversal)
 * - State and storage invariant validation
 */

// ============================================================================
// 1. TERMINAL ANSI & STREAM SANITIZATION
// ============================================================================

/**
 * Sanitizes terminal output to prevent terminal injection vulnerabilities:
 * - Strips OSC (Operating System Command) sequences (e.g. title changes, hyperlinks, clipboard commands).
 * - Strips DCS (Device Control String) and APC / PM sequences.
 * - Strips dangerous terminal mode sequences (DEC private modes, alternate screens).
 * - Strips null bytes (\0) and unprintable ASCII control characters except \n, \r, \t, and standard ANSI color SGRs.
 * - Normalizes Windows CRLF to standard LF.
 */
export function sanitizeTerminalOutput(rawText: string): string {
  if (!rawText) return '';

  let sanitized = rawText;

  // 1. Remove OSC escape sequences: ESC ] ... (ST | BEL)
  sanitized = sanitized.replace(/\x1b\][\s\S]*?(?:\x1b\\|\x07)/g, '');

  // 2. Remove DCS, SOS, PM, APC sequences: ESC [PXZ_] ... ESC \
  sanitized = sanitized.replace(/\x1b[PXZ_][\s\S]*?\x1b\\/g, '');

  // 3. Remove dangerous CSI sequences (cursor jumps, screen clears, private mode resets)
  // Preserving only standard SGR color formatting: ESC [ <codes> m
  sanitized = sanitized.replace(/\x1b\[([0-9;]*[a-zA-Z])/g, (match, code) => {
    if (code.endsWith('m')) {
      return match;
    }
    return '';
  });

  // 4. Strip single ESC codes that are standalone
  sanitized = sanitized.replace(/\x1b[^[\]PXZ_a-zA-Z0-9]/g, '');

  // 5. Remove null bytes and non-printable control characters except \r, \n, \t, and \x1b
  sanitized = sanitized.replace(/[\x00-\x08\x0b\x0c\x0e-\x1a\x1c-\x1f\x7f]/g, '');

  // 6. Normalize newlines
  sanitized = sanitized.replace(/\r\n/g, '\n');

  return sanitized;
}

/**
 * Strips all ANSI escape sequences completely for plain-text representations or logs.
 */
export function stripAllAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}

// ============================================================================
// 2. VIRTUAL FILESYSTEM PATH CANONICALIZATION (ANTI-PATH-TRAVERSAL)
// ============================================================================

/**
 * Resolves a simulated filesystem path given current working path segments and a user input string.
 * Strictly prevents path traversal attacks (e.g. '../../../../etc/passwd' or null byte injection).
 * 
 * Returns canonical array of path segments relative to root:
 * e.g. ['home', 'bandit0'] -> '/home/bandit0'
 */
export function resolveVirtualPath(currentSegments: string[], rawTarget: string): string[] {
  if (!rawTarget || !rawTarget.trim()) {
    return [...currentSegments];
  }

  // Reject null bytes
  if (rawTarget.includes('\0')) {
    throw new Error('Invalid path: null byte detected.');
  }

  const target = rawTarget.trim();

  // Root start
  const isAbsolute = target.startsWith('/');
  const rawParts = target.split('/').filter(Boolean);

  const stack: string[] = isAbsolute ? [] : [...currentSegments];

  for (const part of rawParts) {
    if (part === '.' || part === '') {
      continue;
    }
    if (part === '..') {
      if (stack.length > 0) {
        stack.pop();
      }
      // If stack is empty, remain at root (/) - cannot traverse above root!
      continue;
    }
    // Disallow path segments with invalid or dangerous characters
    if (part.includes('\\') || part.includes(':')) {
      throw new Error(`Invalid path segment: '${part}'`);
    }
    stack.push(part);
  }

  return stack;
}

// ============================================================================
// 3. STORE & STATE INVARIANT VALIDATION
// ============================================================================

/**
 * Validates and sanitizes imported or deserialized OdysseyStore state.
 * Prevents prototype pollution and state corruption.
 */
export function sanitizeOdysseyStoreState(rawState: unknown): Record<string, any> {
  if (!rawState || typeof rawState !== 'object' || Array.isArray(rawState)) {
    throw new Error('State must be a non-null object');
  }

  // Prevent prototype pollution
  const keys = Object.keys(rawState as object);
  for (const key of keys) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      throw new Error(`Prototype pollution attempt detected via property: ${key}`);
    }
  }

  const state = rawState as Record<string, any>;

  // Sanitize and validate solvedBanditLevels: must be array of non-negative integers
  let solvedBanditLevels: number[] = [0];
  if (Array.isArray(state.solvedBanditLevels)) {
    solvedBanditLevels = state.solvedBanditLevels
      .filter((lvl) => typeof lvl === 'number' && Number.isInteger(lvl) && lvl >= 0 && lvl <= 50);
    if (!solvedBanditLevels.includes(0)) solvedBanditLevels.unshift(0);
  }

  // Sanitize dailyGoalMinutes: between 10 and 360
  const dailyGoalMinutes = typeof state.dailyGoalMinutes === 'number'
    ? Math.max(10, Math.min(360, Math.floor(state.dailyGoalMinutes)))
    : 30;

  // Sanitize banditPasswords: safe map of level to string
  const banditPasswords: Record<number, string> = { 0: 'bandit0' };
  if (state.banditPasswords && typeof state.banditPasswords === 'object') {
    for (const [k, v] of Object.entries(state.banditPasswords)) {
      const num = parseInt(k, 10);
      if (!isNaN(num) && num >= 0 && num <= 50 && typeof v === 'string') {
        banditPasswords[num] = v.trim().slice(0, 100);
      }
    }
  }

  return {
    ...state,
    solvedBanditLevels,
    dailyGoalMinutes,
    banditPasswords,
  };
}
