/**
 * CS Odyssey Lightweight C-to-WebAssembly Compiler
 * Compiles a practical C11 subset (types, pointers, arrays, typedef structs,
 * recursion, stack frames, libc/math calls) directly into valid WebAssembly
 * binary modules (`\0asm\x01\0\0\0`) targeting WebAssembly.Memory.
 */

export interface CCompileError extends Error {
  line?: number;
  column?: number;
}

export interface WasmCompileMetadata {
  wasmBytes: Uint8Array;
  functions: string[];
  dataBytes: number;
  totalBytes: number;
  hexHeader: string;
  memoryLayout: {
    rodataStart: number;
    heapStart: number;
    stackTop: number;
  };
}

// ============================================================================
// 1. WASM Binary Primitives
// ============================================================================

const WASM_I32 = 0x7f;
const WASM_I64 = 0x7e;
const WASM_F64 = 0x7c;

const OP = {
  unreachable: 0x00,
  nop: 0x01,
  block: 0x02,
  loop: 0x03,
  if: 0x04,
  else: 0x05,
  end: 0x0b,
  br: 0x0c,
  br_if: 0x0d,
  return: 0x0f,
  call: 0x10,
  drop: 0x1a,
  select: 0x1b,
  local_get: 0x20,
  local_set: 0x21,
  local_tee: 0x22,
  global_get: 0x23,
  global_set: 0x24,
  i32_load: 0x28,
  i64_load: 0x29,
  f64_load: 0x2b,
  i32_load8_s: 0x2c,
  i32_load8_u: 0x2d,
  i32_load16_s: 0x2e,
  i32_load16_u: 0x2f,
  i32_store: 0x36,
  i64_store: 0x37,
  f64_store: 0x39,
  i32_store8: 0x3a,
  i32_store16: 0x3b,
  i32_const: 0x41,
  i64_const: 0x42,
  f64_const: 0x44,
  i32_eqz: 0x45,
  i32_eq: 0x46,
  i32_ne: 0x47,
  i32_lt_s: 0x48,
  i32_lt_u: 0x49,
  i32_gt_s: 0x4a,
  i32_gt_u: 0x4b,
  i32_le_s: 0x4c,
  i32_le_u: 0x4d,
  i32_ge_s: 0x4e,
  i32_ge_u: 0x4f,
  i64_eqz: 0x50,
  i64_eq: 0x51,
  i64_ne: 0x52,
  i64_lt_s: 0x53,
  i64_lt_u: 0x54,
  i64_gt_s: 0x55,
  i64_gt_u: 0x56,
  i64_le_s: 0x57,
  i64_le_u: 0x58,
  i64_ge_s: 0x59,
  i64_ge_u: 0x5a,
  f64_eq: 0x61,
  f64_ne: 0x62,
  f64_lt: 0x63,
  f64_gt: 0x64,
  f64_le: 0x65,
  f64_ge: 0x66,
  i32_add: 0x6a,
  i32_sub: 0x6b,
  i32_mul: 0x6c,
  i32_div_s: 0x6d,
  i32_div_u: 0x6e,
  i32_rem_s: 0x6f,
  i32_rem_u: 0x70,
  i32_and: 0x71,
  i32_or: 0x72,
  i32_xor: 0x73,
  i32_shl: 0x74,
  i32_shr_s: 0x75,
  i32_shr_u: 0x76,
  i64_add: 0x7c,
  i64_sub: 0x7d,
  i64_mul: 0x7e,
  i64_div_s: 0x7f,
  i64_div_u: 0x80,
  i64_rem_s: 0x81,
  i64_rem_u: 0x82,
  i64_and: 0x83,
  i64_or: 0x84,
  i64_xor: 0x85,
  i64_shl: 0x86,
  i64_shr_s: 0x87,
  i64_shr_u: 0x88,
  f64_neg: 0x9a,
  f64_add: 0xa0,
  f64_sub: 0xa1,
  f64_mul: 0xa2,
  f64_div: 0xa3,
  i32_wrap_i64: 0xa7,
  i32_trunc_f64_s: 0xaa,
  i64_extend_i32_s: 0xac,
  i64_extend_i32_u: 0xad,
  i64_trunc_f64_s: 0xb0,
  f64_convert_i32_s: 0xb7,
  f64_convert_i32_u: 0xb8,
  f64_convert_i64_s: 0xb9,
  f64_convert_i64_u: 0xba,
} as const;

function encodeUleb128(value: number): number[] {
  const out: number[] = [];
  let v = value >>> 0;
  do {
    let byte = v & 0x7f;
    v >>>= 7;
    if (v !== 0) byte |= 0x80;
    out.push(byte);
  } while (v !== 0);
  return out;
}

function encodeSleb128(value: number): number[] {
  const out: number[] = [];
  let v = Math.trunc(value);
  let more = true;
  while (more) {
    let byte = v & 0x7f;
    v >>= 7;
    const signBit = (byte & 0x40) !== 0;
    if ((v === 0 && !signBit) || (v === -1 && signBit)) {
      more = false;
    } else {
      byte |= 0x80;
    }
    out.push(byte);
  }
  return out;
}

function encodeBigIntSleb128(value: bigint): number[] {
  const out: number[] = [];
  let v = value;
  let more = true;
  const ZERO = BigInt(0);
  const NEG_ONE = BigInt(-1);
  const SEVEN = BigInt(7);
  const MASK = BigInt(0x7f);
  while (more) {
    let byte = Number(v & MASK);
    v >>= SEVEN;
    const signBit = (byte & 0x40) !== 0;
    if ((v === ZERO && !signBit) || (v === NEG_ONE && signBit)) {
      more = false;
    } else {
      byte |= 0x80;
    }
    out.push(byte);
  }
  return out;
}

function encodeF64(value: number): number[] {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setFloat64(0, value, true);
  return Array.from(new Uint8Array(buf));
}

function encodeUtf8(str: string): number[] {
  const bytes = Array.from(new TextEncoder().encode(str));
  return [...encodeUleb128(bytes.length), ...bytes];
}

function makeSection(id: number, payload: number[]): number[] {
  return [id, ...encodeUleb128(payload.length), ...payload];
}

// ============================================================================
// 2. Types System
// ============================================================================

type CType =
  | { kind: 'void' }
  | { kind: 'bool' }
  | { kind: 'char'; unsigned: boolean }
  | { kind: 'short'; unsigned: boolean }
  | { kind: 'int'; unsigned: boolean }
  | { kind: 'longlong'; unsigned: boolean }
  | { kind: 'double' }
  | { kind: 'pointer'; to: CType }
  | { kind: 'array'; elem: CType; length: number }
  | { kind: 'struct'; name: string };

interface StructField {
  name: string;
  type: CType;
  offset: number;
}

interface StructDef {
  name: string;
  fields: StructField[];
  size: number;
  align: number;
}

function isFloatType(t: CType): boolean {
  return t.kind === 'double';
}

function isI64Type(t: CType): boolean {
  return t.kind === 'longlong';
}

function isUnsignedType(t: CType): boolean {
  return (
    t.kind === 'pointer' ||
    ((t.kind === 'char' || t.kind === 'short' || t.kind === 'int' || t.kind === 'longlong') &&
      t.unsigned)
  );
}

function toWasmValType(t: CType): number | null {
  if (t.kind === 'void') return null;
  if (t.kind === 'double') return WASM_F64;
  if (t.kind === 'longlong') return WASM_I64;
  return WASM_I32;
}

// ============================================================================
// 3. Tokenizer & Preprocessor
// ============================================================================

type TokenKind =
  | 'ident'
  | 'number'
  | 'string'
  | 'char'
  | 'punct'
  | 'eof';

interface Token {
  kind: TokenKind;
  value: string;
  line: number;
  col: number;
  numSuffix?: 'll' | 'ull' | 'u' | 'l' | 'f';
  isFloat?: boolean;
}

const MULTI_CHAR_PUNCTS = [
  '<<=',
  '>>=',
  '...',
  '->',
  '++',
  '--',
  '<<',
  '>>',
  '<=',
  '>=',
  '==',
  '!=',
  '&&',
  '||',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '&=',
  '|=',
  '^=',
];

function syntaxErr(message: string, line?: number, col?: number): CCompileError {
  const loc = line ? `Line ${line}${col ? `:${col}` : ''}: ` : '';
  const err = new Error(`${loc}${message}`) as CCompileError;
  err.line = line;
  err.column = col;
  return err;
}

function preprocessAndTokenize(source: string): Token[] {
  const macros = new Map<string, string>([
    ['NULL', '0'],
    ['true', '1'],
    ['false', '0'],
    ['EOF', '-1'],
    ['EXIT_SUCCESS', '0'],
    ['EXIT_FAILURE', '1'],
    ['M_PI', '3.141592653589793'],
    ['M_E', '2.718281828459045'],
  ]);

  const rawLines = source.replace(/\r\n/g, '\n').split('\n');
  const cleanedLines: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      if (trimmed.startsWith('#define')) {
        const match = trimmed.match(/^#define\s+([A-Za-z_][A-Za-z0-9_]*)\s+(.+)$/);
        if (match) {
          macros.set(match[1], match[2].trim());
        }
      }
      cleanedLines.push('');
    } else {
      cleanedLines.push(line);
    }
  }

  const text = cleanedLines.join('\n');
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let col = 1;

  const advance = (n = 1) => {
    for (let k = 0; k < n; k++) {
      if (text[i] === '\n') {
        line++;
        col = 1;
      } else {
        col++;
      }
      i++;
    }
  };

  while (i < text.length) {
    const ch = text[i];

    // Whitespace
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      advance();
      continue;
    }

    // Line comment
    if (ch === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') advance();
      continue;
    }

    // Block comment
    if (ch === '/' && text[i + 1] === '*') {
      const startLine = line;
      advance(2);
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) {
        advance();
      }
      if (i >= text.length) {
        throw syntaxErr('Unterminated block comment', startLine);
      }
      advance(2);
      continue;
    }

    // String literal
    if (ch === '"') {
      const startLine = line;
      const startCol = col;
      advance();
      let str = '';
      while (i < text.length && text[i] !== '"') {
        if (text[i] === '\\') {
          advance();
          const esc = text[i];
          if (esc === 'n') str += '\n';
          else if (esc === 't') str += '\t';
          else if (esc === 'r') str += '\r';
          else if (esc === '0') str += '\0';
          else if (esc === '\\') str += '\\';
          else if (esc === '"') str += '"';
          else if (esc === '\'') str += '\'';
          else str += esc ?? '';
          advance();
        } else {
          str += text[i];
          advance();
        }
      }
      if (text[i] !== '"') throw syntaxErr('Unterminated string literal', startLine, startCol);
      advance();
      // C adjacent string literal concatenation
      if (tokens.length > 0 && tokens[tokens.length - 1].kind === 'string') {
        tokens[tokens.length - 1].value += str;
      } else {
        tokens.push({ kind: 'string', value: str, line: startLine, col: startCol });
      }
      continue;
    }

    // Char literal
    if (ch === '\'') {
      const startLine = line;
      const startCol = col;
      advance();
      let val = 0;
      if (text[i] === '\\') {
        advance();
        const esc = text[i];
        if (esc === 'n') val = 10;
        else if (esc === 't') val = 9;
        else if (esc === 'r') val = 13;
        else if (esc === '0') val = 0;
        else val = (esc ?? '\0').charCodeAt(0);
        advance();
      } else {
        val = (text[i] ?? '\0').charCodeAt(0);
        advance();
      }
      if (text[i] !== '\'') throw syntaxErr('Unterminated char literal', startLine, startCol);
      advance();
      tokens.push({ kind: 'char', value: String(val), line: startLine, col: startCol });
      continue;
    }

    // Number literal
    if ((ch >= '0' && ch <= '9') || (ch === '.' && text[i + 1] >= '0' && text[i + 1] <= '9')) {
      const startLine = line;
      const startCol = col;
      let numStr = '';
      let isFloat = false;
      if (ch === '0' && (text[i + 1] === 'x' || text[i + 1] === 'X')) {
        numStr += text[i] + text[i + 1];
        advance(2);
        while (i < text.length && /[0-9a-fA-F]/.test(text[i])) {
          numStr += text[i];
          advance();
        }
      } else {
        while (i < text.length && ((text[i] >= '0' && text[i] <= '9') || text[i] === '.')) {
          if (text[i] === '.') isFloat = true;
          numStr += text[i];
          advance();
        }
        if (text[i] === 'e' || text[i] === 'E') {
          isFloat = true;
          numStr += text[i];
          advance();
          if (text[i] === '+' || text[i] === '-') {
            numStr += text[i];
            advance();
          }
          while (i < text.length && text[i] >= '0' && text[i] <= '9') {
            numStr += text[i];
            advance();
          }
        }
      }
      let suffixRaw = '';
      while (i < text.length && /[uUlLfF]/.test(text[i])) {
        suffixRaw += text[i].toLowerCase();
        advance();
      }
      let numSuffix: Token['numSuffix'];
      if (suffixRaw.includes('ll')) {
        numSuffix = suffixRaw.includes('u') ? 'ull' : 'll';
      } else if (suffixRaw === 'u') {
        numSuffix = 'u';
      } else if (suffixRaw === 'f') {
        numSuffix = 'f';
        isFloat = true;
      }
      tokens.push({
        kind: 'number',
        value: numStr,
        line: startLine,
        col: startCol,
        numSuffix,
        isFloat,
      });
      continue;
    }

    // Identifier
    if (/[A-Za-z_]/.test(ch)) {
      const startLine = line;
      const startCol = col;
      let id = '';
      while (i < text.length && /[A-Za-z0-9_]/.test(text[i])) {
        id += text[i];
        advance();
      }
      const macroVal = macros.get(id);
      if (macroVal !== undefined && macroVal !== id) {
        const expanded = preprocessAndTokenize(macroVal).slice(0, -1);
        for (const t of expanded) {
          tokens.push({ ...t, line: startLine, col: startCol });
        }
      } else {
        tokens.push({ kind: 'ident', value: id, line: startLine, col: startCol });
      }
      continue;
    }

    // Punctuation
    const startLine = line;
    const startCol = col;
    let matchedPunct = '';
    for (const p of MULTI_CHAR_PUNCTS) {
      if (text.startsWith(p, i)) {
        matchedPunct = p;
        break;
      }
    }
    if (matchedPunct) {
      advance(matchedPunct.length);
      tokens.push({ kind: 'punct', value: matchedPunct, line: startLine, col: startCol });
    } else {
      advance(1);
      tokens.push({ kind: 'punct', value: ch, line: startLine, col: startCol });
    }
  }

  tokens.push({ kind: 'eof', value: '', line, col });
  return tokens;
}

// ============================================================================
// 4. AST Definitions
// ============================================================================

type Expr =
  | { kind: 'num'; raw: string; isFloat: boolean; suffix?: Token['numSuffix']; line: number }
  | { kind: 'str'; value: string; line: number }
  | { kind: 'ident'; name: string; line: number }
  | { kind: 'call'; callee: string; args: Expr[]; line: number }
  | { kind: 'unary'; op: string; expr: Expr; line: number }
  | { kind: 'postfix'; op: '++' | '--'; expr: Expr; line: number }
  | { kind: 'binary'; op: string; left: Expr; right: Expr; line: number }
  | { kind: 'assign'; op: string; left: Expr; right: Expr; line: number }
  | { kind: 'ternary'; cond: Expr; thenExpr: Expr; elseExpr: Expr; line: number }
  | { kind: 'cast'; targetType: CType; expr: Expr; line: number }
  | { kind: 'sizeof_type'; targetType: CType; line: number }
  | { kind: 'sizeof_expr'; expr: Expr; line: number }
  | { kind: 'index'; arr: Expr; idx: Expr; line: number }
  | { kind: 'member'; obj: Expr; field: string; isArrow: boolean; line: number }
  | { kind: 'init_list'; items: Expr[]; line: number };

type Stmt =
  | { kind: 'block'; stmts: Stmt[]; line: number }
  | { kind: 'vardecl'; decls: VarDeclItem[]; line: number }
  | { kind: 'expr'; expr?: Expr; line: number }
  | { kind: 'if'; cond: Expr; thenBranch: Stmt; elseBranch?: Stmt; line: number }
  | { kind: 'while'; cond: Expr; body: Stmt; line: number }
  | { kind: 'dowhile'; body: Stmt; cond: Expr; line: number }
  | { kind: 'for'; init?: Stmt; cond?: Expr; post?: Expr; body: Stmt; line: number }
  | { kind: 'switch'; expr: Expr; cases: Array<{ value: Expr | null; stmts: Stmt[] }>; line: number }
  | { kind: 'break'; line: number }
  | { kind: 'continue'; line: number }
  | { kind: 'return'; expr?: Expr; line: number };

interface VarDeclItem {
  name: string;
  type: CType;
  init?: Expr;
}

interface ParamDecl {
  name: string;
  type: CType;
}

interface FuncDef {
  name: string;
  returnType: CType;
  params: ParamDecl[];
  body: Stmt;
  line: number;
}

// ============================================================================
// 5. Parser
// ============================================================================

const BASE_TYPE_KEYWORDS = new Set([
  'void',
  'char',
  'short',
  'int',
  'long',
  'float',
  'double',
  'signed',
  'unsigned',
  'const',
  'volatile',
  'static',
  'register',
  'inline',
  'struct',
  'size_t',
  'ssize_t',
  'bool',
  '_Bool',
  'int8_t',
  'uint8_t',
  'int16_t',
  'uint16_t',
  'int32_t',
  'uint32_t',
  'int64_t',
  'uint64_t',
  'FILE',
]);

class CParser {
  private tokens: Token[];
  private pos = 0;
  public structs = new Map<string, StructDef>();
  public typedefs = new Map<string, CType>();
  public functions: FuncDef[] = [];
  public globals: VarDeclItem[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(offset = 0): Token {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)];
  }

  private next(): Token {
    const t = this.peek();
    this.pos++;
    return t;
  }

  private match(val: string): boolean {
    if (this.peek().value === val) {
      this.pos++;
      return true;
    }
    return false;
  }

  private expect(val: string, msg?: string): Token {
    const t = this.peek();
    if (t.value !== val) {
      throw syntaxErr(msg || `Expected '${val}' but found '${t.value || 'EOF'}'`, t.line, t.col);
    }
    this.pos++;
    return t;
  }

  public sizeofType(t: CType): number {
    switch (t.kind) {
      case 'void':
        return 1;
      case 'bool':
      case 'char':
        return 1;
      case 'short':
        return 2;
      case 'int':
      case 'pointer':
        return 4;
      case 'longlong':
      case 'double':
        return 8;
      case 'array':
        return Math.max(1, t.length) * this.sizeofType(t.elem);
      case 'struct': {
        const def = this.structs.get(t.name);
        if (!def) throw syntaxErr(`Unknown struct '${t.name}'`);
        return def.size;
      }
    }
  }

  private alignOfType(t: CType): number {
    switch (t.kind) {
      case 'void':
      case 'bool':
      case 'char':
        return 1;
      case 'short':
        return 2;
      case 'int':
      case 'pointer':
        return 4;
      case 'longlong':
      case 'double':
        return 8;
      case 'array':
        return this.alignOfType(t.elem);
      case 'struct': {
        const def = this.structs.get(t.name);
        return def ? def.align : 4;
      }
    }
  }

  private isTypeStart(offset = 0): boolean {
    const t = this.peek(offset);
    if (t.kind !== 'ident') return false;
    return BASE_TYPE_KEYWORDS.has(t.value) || this.typedefs.has(t.value);
  }

  private parseBaseType(): CType {
    let sawUnsigned = false;
    let sawSigned = false;
    let longCount = 0;
    let base: string | null = null;
    let count = 0;

    while (this.peek().kind === 'ident') {
      const w = this.peek().value;
      if (w === 'const' || w === 'volatile' || w === 'static' || w === 'register' || w === 'inline') {
        this.next();
        count++;
        continue;
      }
      if (w === 'unsigned') {
        sawUnsigned = true;
        this.next();
        count++;
        continue;
      }
      if (w === 'signed') {
        sawSigned = true;
        this.next();
        count++;
        continue;
      }
      if (w === 'long') {
        longCount++;
        this.next();
        count++;
        continue;
      }
      if (w === 'struct') {
        this.next();
        let structName = '';
        if (this.peek().kind === 'ident') {
          structName = this.next().value;
        }
        if (this.peek().value === '{') {
          const def = this.parseStructBody(structName);
          structName = def.name;
        }
        return { kind: 'struct', name: structName };
      }
      if (this.typedefs.has(w)) {
        if (base || longCount > 0) break;
        this.next();
        return this.typedefs.get(w)!;
      }
      if (BASE_TYPE_KEYWORDS.has(w)) {
        base = w;
        this.next();
        count++;
        continue;
      }
      break;
    }

    if (count === 0) {
      const t = this.peek();
      throw syntaxErr(`Expected type name, got '${t.value}'`, t.line, t.col);
    }

    const unsigned = sawUnsigned && !sawSigned;
    if (base === 'void') return { kind: 'void' };
    if (base === 'FILE') return { kind: 'int', unsigned: false };
    if (base === 'bool' || base === '_Bool') return { kind: 'bool' };
    if (base === 'char' || base === 'int8_t') return { kind: 'char', unsigned: base === 'char' ? unsigned : false };
    if (base === 'uint8_t') return { kind: 'char', unsigned: true };
    if (base === 'short' || base === 'int16_t') return { kind: 'short', unsigned };
    if (base === 'uint16_t') return { kind: 'short', unsigned: true };
    if (base === 'float' || base === 'double') return { kind: 'double' };
    if (base === 'size_t') return { kind: 'int', unsigned: true };
    if (base === 'ssize_t') return { kind: 'int', unsigned: false };
    if (base === 'int64_t') return { kind: 'longlong', unsigned: false };
    if (base === 'uint64_t') return { kind: 'longlong', unsigned: true };
    if (longCount >= 2) return { kind: 'longlong', unsigned };
    if (longCount === 1) return { kind: 'int', unsigned };
    return { kind: 'int', unsigned };
  }

  private parseStructBody(explicitName: string): StructDef {
    const name = explicitName || `__anon_struct_${this.structs.size + 1}`;
    this.expect('{');
    const fields: StructField[] = [];
    let offset = 0;
    let maxAlign = 1;

    while (this.peek().value !== '}' && this.peek().kind !== 'eof') {
      const base = this.parseBaseType();
      do {
        let fType = this.parsePointers(base);
        const fNameTok = this.peek();
        if (fNameTok.kind !== 'ident') {
          throw syntaxErr('Expected struct field identifier', fNameTok.line, fNameTok.col);
        }
        this.next();
        fType = this.parseArraySuffix(fType);
        const align = this.alignOfType(fType);
        const size = this.sizeofType(fType);
        maxAlign = Math.max(maxAlign, align);
        offset = Math.ceil(offset / align) * align;
        fields.push({ name: fNameTok.value, type: fType, offset });
        offset += size;
      } while (this.match(','));
      this.expect(';');
    }
    this.expect('}');
    const totalSize = Math.max(1, Math.ceil(offset / maxAlign) * maxAlign);
    const def: StructDef = { name, fields, size: totalSize, align: maxAlign };
    this.structs.set(name, def);
    return def;
  }

  private parsePointers(base: CType): CType {
    let t = base;
    while (this.match('*')) {
      t = { kind: 'pointer', to: t };
      while (this.peek().value === 'const' || this.peek().value === 'volatile') {
        this.next();
      }
    }
    return t;
  }

  private parseArraySuffix(base: CType): CType {
    const dims: number[] = [];
    while (this.match('[')) {
      if (this.match(']')) {
        dims.push(-1);
      } else {
        const sizeExpr = this.parseExpr();
        const len = this.evalConstInt(sizeExpr);
        this.expect(']');
        dims.push(len);
      }
    }
    let t = base;
    for (let i = dims.length - 1; i >= 0; i--) {
      t = { kind: 'array', elem: t, length: dims[i] };
    }
    return t;
  }

  private evalConstInt(e: Expr): number {
    if (e.kind === 'num') return parseInt(e.raw, e.raw.startsWith('0x') ? 16 : 10) || 0;
    if (e.kind === 'sizeof_type') return this.sizeofType(e.targetType);
    if (e.kind === 'unary' && e.op === '-') return -this.evalConstInt(e.expr);
    if (e.kind === 'binary') {
      const l = this.evalConstInt(e.left);
      const r = this.evalConstInt(e.right);
      if (e.op === '+') return l + r;
      if (e.op === '-') return l - r;
      if (e.op === '*') return l * r;
      if (e.op === '/') return Math.trunc(l / (r || 1));
    }
    throw syntaxErr('Expected constant integer expression', e.line);
  }

  private parseTypeName(): CType {
    let t = this.parseBaseType();
    t = this.parsePointers(t);
    if (this.peek().value === '[') {
      t = this.parseArraySuffix(t);
    }
    return t;
  }

  public parseProgram(): void {
    while (this.peek().kind !== 'eof') {
      if (this.match(';')) continue;

      if (this.peek().value === 'typedef') {
        this.next();
        const base = this.parseBaseType();
        const fullType = this.parsePointers(base);
        const aliasTok = this.peek();
        if (aliasTok.kind !== 'ident') {
          throw syntaxErr('Expected typedef alias name', aliasTok.line, aliasTok.col);
        }
        this.next();
        const finalType = this.parseArraySuffix(fullType);
        this.typedefs.set(aliasTok.value, finalType);
        this.expect(';');
        continue;
      }

      const line = this.peek().line;
      const base = this.parseBaseType();

      // Standalone struct definition: `struct Foo { ... };`
      if (base.kind === 'struct' && this.match(';')) {
        continue;
      }

      const firstPtrType = this.parsePointers(base);
      const nameTok = this.peek();
      if (nameTok.kind !== 'ident') {
        throw syntaxErr(`Expected identifier in declaration, found '${nameTok.value}'`, nameTok.line, nameTok.col);
      }
      this.next();

      // Function declaration or definition
      if (this.match('(')) {
        const params: ParamDecl[] = [];
        if (this.peek().value === 'void' && this.peek(1).value === ')') {
          this.next();
        } else if (this.peek().value !== ')') {
          do {
            const pBase = this.parseBaseType();
            let pType = this.parsePointers(pBase);
            let pName = `__param_${params.length}`;
            if (this.peek().kind === 'ident') {
              pName = this.next().value;
            }
            if (this.peek().value === '[') {
              this.parseArraySuffix(pType);
              pType = { kind: 'pointer', to: pType };
            }
            params.push({ name: pName, type: pType });
          } while (this.match(','));
        }
        this.expect(')');

        if (this.match(';')) {
          // Prototype — ignore body, handled automatically during full parse
          continue;
        }
        const body = this.parseBlock();
        this.functions.push({
          name: nameTok.value,
          returnType: firstPtrType,
          params,
          body,
          line,
        });
        continue;
      }

      // Global variable declaration(s)
      const decls: VarDeclItem[] = [];
      let curType = this.parseArraySuffix(firstPtrType);
      let init: Expr | undefined;
      if (this.match('=')) {
        init = this.parseInitializer();
      }
      if (curType.kind === 'array' && curType.length < 0 && init?.kind === 'init_list') {
        curType = { kind: 'array', elem: curType.elem, length: init.items.length };
      }
      decls.push({ name: nameTok.value, type: curType, init });

      while (this.match(',')) {
        let nextType = this.parsePointers(base);
        const nextName = this.next();
        nextType = this.parseArraySuffix(nextType);
        let nextInit: Expr | undefined;
        if (this.match('=')) {
          nextInit = this.parseInitializer();
        }
        decls.push({ name: nextName.value, type: nextType, init: nextInit });
      }
      this.expect(';');
      this.globals.push(...decls);
    }
  }

  private parseInitializer(): Expr {
    if (this.match('{')) {
      const line = this.peek().line;
      const items: Expr[] = [];
      if (this.peek().value !== '}') {
        do {
          if (this.peek().value === '}') break;
          items.push(this.parseAssignExpr());
        } while (this.match(','));
      }
      this.expect('}');
      return { kind: 'init_list', items, line };
    }
    return this.parseAssignExpr();
  }

  private parseBlock(): Stmt {
    const t = this.expect('{');
    const stmts: Stmt[] = [];
    while (this.peek().value !== '}' && this.peek().kind !== 'eof') {
      stmts.push(this.parseStmt());
    }
    this.expect('}');
    return { kind: 'block', stmts, line: t.line };
  }

  private parseStmt(): Stmt {
    const t = this.peek();

    if (t.value === '{') return this.parseBlock();
    if (this.match(';')) return { kind: 'expr', line: t.line };

    if (t.value === 'if') {
      this.next();
      this.expect('(');
      const cond = this.parseExpr();
      this.expect(')');
      const thenBranch = this.parseStmt();
      let elseBranch: Stmt | undefined;
      if (this.match('else')) {
        elseBranch = this.parseStmt();
      }
      return { kind: 'if', cond, thenBranch, elseBranch, line: t.line };
    }

    if (t.value === 'while') {
      this.next();
      this.expect('(');
      const cond = this.parseExpr();
      this.expect(')');
      const body = this.parseStmt();
      return { kind: 'while', cond, body, line: t.line };
    }

    if (t.value === 'do') {
      this.next();
      const body = this.parseStmt();
      this.expect('while');
      this.expect('(');
      const cond = this.parseExpr();
      this.expect(')');
      this.expect(';');
      return { kind: 'dowhile', body, cond, line: t.line };
    }

    if (t.value === 'for') {
      this.next();
      this.expect('(');
      let init: Stmt | undefined;
      if (!this.match(';')) {
        if (this.isTypeStart()) {
          init = this.parseLocalVarDecl();
        } else {
          const e = this.parseExpr();
          this.expect(';');
          init = { kind: 'expr', expr: e, line: t.line };
        }
      }
      let cond: Expr | undefined;
      if (this.peek().value !== ';') {
        cond = this.parseExpr();
      }
      this.expect(';');
      let post: Expr | undefined;
      if (this.peek().value !== ')') {
        post = this.parseExpr();
      }
      this.expect(')');
      const body = this.parseStmt();
      return { kind: 'for', init, cond, post, body, line: t.line };
    }

    if (t.value === 'switch') {
      this.next();
      this.expect('(');
      const expr = this.parseExpr();
      this.expect(')');
      this.expect('{');
      const cases: Array<{ value: Expr | null; stmts: Stmt[] }> = [];
      while (this.peek().value !== '}' && this.peek().kind !== 'eof') {
        if (this.match('case')) {
          const val = this.parseExpr();
          this.expect(':');
          cases.push({ value: val, stmts: [] });
        } else if (this.match('default')) {
          this.expect(':');
          cases.push({ value: null, stmts: [] });
        } else {
          if (cases.length === 0) cases.push({ value: null, stmts: [] });
          cases[cases.length - 1].stmts.push(this.parseStmt());
        }
      }
      this.expect('}');
      return { kind: 'switch', expr, cases, line: t.line };
    }

    if (t.value === 'break') {
      this.next();
      this.expect(';');
      return { kind: 'break', line: t.line };
    }

    if (t.value === 'continue') {
      this.next();
      this.expect(';');
      return { kind: 'continue', line: t.line };
    }

    if (t.value === 'return') {
      this.next();
      let expr: Expr | undefined;
      if (this.peek().value !== ';') {
        expr = this.parseExpr();
      }
      this.expect(';');
      return { kind: 'return', expr, line: t.line };
    }

    if (this.isTypeStart()) {
      return this.parseLocalVarDecl();
    }

    const expr = this.parseExpr();
    this.expect(';');
    return { kind: 'expr', expr, line: t.line };
  }

  private parseLocalVarDecl(): Stmt {
    const line = this.peek().line;
    const base = this.parseBaseType();
    const decls: VarDeclItem[] = [];
    do {
      let varType = this.parsePointers(base);
      const nameTok = this.peek();
      if (nameTok.kind !== 'ident') {
        throw syntaxErr('Expected variable name', nameTok.line, nameTok.col);
      }
      this.next();
      varType = this.parseArraySuffix(varType);
      let init: Expr | undefined;
      if (this.match('=')) {
        init = this.parseInitializer();
      }
      if (varType.kind === 'array' && varType.length < 0 && init?.kind === 'init_list') {
        varType = { kind: 'array', elem: varType.elem, length: init.items.length };
      } else if (varType.kind === 'array' && varType.length < 0 && init?.kind === 'str') {
        varType = { kind: 'array', elem: varType.elem, length: init.value.length + 1 };
      }
      decls.push({ name: nameTok.value, type: varType, init });
    } while (this.match(','));
    this.expect(';');
    return { kind: 'vardecl', decls, line };
  }

  private parseExpr(): Expr {
    let e = this.parseAssignExpr();
    while (this.match(',')) {
      const right = this.parseAssignExpr();
      e = { kind: 'binary', op: ',', left: e, right, line: e.line };
    }
    return e;
  }

  private parseAssignExpr(): Expr {
    const left = this.parseTernaryExpr();
    const op = this.peek().value;
    if (
      op === '=' ||
      op === '+=' ||
      op === '-=' ||
      op === '*=' ||
      op === '/=' ||
      op === '%=' ||
      op === '&=' ||
      op === '|=' ||
      op === '^=' ||
      op === '<<=' ||
      op === '>>='
    ) {
      const tok = this.next();
      const right = this.parseAssignExpr();
      return { kind: 'assign', op: tok.value, left, right, line: tok.line };
    }
    return left;
  }

  private parseTernaryExpr(): Expr {
    const cond = this.parseLogicalOr();
    if (this.match('?')) {
      const thenExpr = this.parseExpr();
      this.expect(':');
      const elseExpr = this.parseTernaryExpr();
      return { kind: 'ternary', cond, thenExpr, elseExpr, line: cond.line };
    }
    return cond;
  }

  private parseLogicalOr(): Expr {
    let left = this.parseLogicalAnd();
    while (this.match('||')) {
      const right = this.parseLogicalAnd();
      left = { kind: 'binary', op: '||', left, right, line: left.line };
    }
    return left;
  }

  private parseLogicalAnd(): Expr {
    let left = this.parseBitwiseOr();
    while (this.match('&&')) {
      const right = this.parseBitwiseOr();
      left = { kind: 'binary', op: '&&', left, right, line: left.line };
    }
    return left;
  }

  private parseBitwiseOr(): Expr {
    let left = this.parseBitwiseXor();
    while (this.match('|')) {
      const right = this.parseBitwiseXor();
      left = { kind: 'binary', op: '|', left, right, line: left.line };
    }
    return left;
  }

  private parseBitwiseXor(): Expr {
    let left = this.parseBitwiseAnd();
    while (this.match('^')) {
      const right = this.parseBitwiseAnd();
      left = { kind: 'binary', op: '^', left, right, line: left.line };
    }
    return left;
  }

  private parseBitwiseAnd(): Expr {
    let left = this.parseEquality();
    while (this.match('&')) {
      const right = this.parseEquality();
      left = { kind: 'binary', op: '&', left, right, line: left.line };
    }
    return left;
  }

  private parseEquality(): Expr {
    let left = this.parseRelational();
    while (this.peek().value === '==' || this.peek().value === '!=') {
      const op = this.next().value;
      const right = this.parseRelational();
      left = { kind: 'binary', op, left, right, line: left.line };
    }
    return left;
  }

  private parseRelational(): Expr {
    let left = this.parseShift();
    while (
      this.peek().value === '<' ||
      this.peek().value === '<=' ||
      this.peek().value === '>' ||
      this.peek().value === '>='
    ) {
      const op = this.next().value;
      const right = this.parseShift();
      left = { kind: 'binary', op, left, right, line: left.line };
    }
    return left;
  }

  private parseShift(): Expr {
    let left = this.parseAdditive();
    while (this.peek().value === '<<' || this.peek().value === '>>') {
      const op = this.next().value;
      const right = this.parseAdditive();
      left = { kind: 'binary', op, left, right, line: left.line };
    }
    return left;
  }

  private parseAdditive(): Expr {
    let left = this.parseMultiplicative();
    while (this.peek().value === '+' || this.peek().value === '-') {
      const op = this.next().value;
      const right = this.parseMultiplicative();
      left = { kind: 'binary', op, left, right, line: left.line };
    }
    return left;
  }

  private parseMultiplicative(): Expr {
    let left = this.parseUnary();
    while (this.peek().value === '*' || this.peek().value === '/' || this.peek().value === '%') {
      const op = this.next().value;
      const right = this.parseUnary();
      left = { kind: 'binary', op, left, right, line: left.line };
    }
    return left;
  }

  private parseUnary(): Expr {
    const t = this.peek();

    if (t.value === 'sizeof') {
      this.next();
      if (this.match('(')) {
        if (this.isTypeStart()) {
          const targetType = this.parseTypeName();
          this.expect(')');
          return { kind: 'sizeof_type', targetType, line: t.line };
        }
        const e = this.parseExpr();
        this.expect(')');
        return { kind: 'sizeof_expr', expr: e, line: t.line };
      }
      const e = this.parseUnary();
      return { kind: 'sizeof_expr', expr: e, line: t.line };
    }

    if (t.value === '(' && this.isTypeStart(1)) {
      this.next();
      const targetType = this.parseTypeName();
      this.expect(')');
      const expr = this.parseUnary();
      return { kind: 'cast', targetType, expr, line: t.line };
    }

    if (
      t.value === '+' ||
      t.value === '-' ||
      t.value === '!' ||
      t.value === '~' ||
      t.value === '*' ||
      t.value === '&' ||
      t.value === '++' ||
      t.value === '--'
    ) {
      this.next();
      const expr = this.parseUnary();
      return { kind: 'unary', op: t.value, expr, line: t.line };
    }

    return this.parsePostfix();
  }

  private parsePostfix(): Expr {
    let expr = this.parsePrimary();
    while (true) {
      const t = this.peek();
      if (t.value === '[') {
        this.next();
        const idx = this.parseExpr();
        this.expect(']');
        expr = { kind: 'index', arr: expr, idx, line: t.line };
      } else if (t.value === '.' || t.value === '->') {
        const isArrow = t.value === '->';
        this.next();
        const f = this.peek();
        if (f.kind !== 'ident') throw syntaxErr('Expected struct field name', f.line, f.col);
        this.next();
        expr = { kind: 'member', obj: expr, field: f.value, isArrow, line: t.line };
      } else if (t.value === '++' || t.value === '--') {
        this.next();
        expr = { kind: 'postfix', op: t.value, expr, line: t.line };
      } else {
        break;
      }
    }
    return expr;
  }

  private parsePrimary(): Expr {
    const t = this.peek();

    if (t.kind === 'number') {
      this.next();
      return { kind: 'num', raw: t.value, isFloat: !!t.isFloat, suffix: t.numSuffix, line: t.line };
    }

    if (t.kind === 'char') {
      this.next();
      return { kind: 'num', raw: t.value, isFloat: false, line: t.line };
    }

    if (t.kind === 'string') {
      this.next();
      return { kind: 'str', value: t.value, line: t.line };
    }

    if (t.value === '(') {
      this.next();
      const e = this.parseExpr();
      this.expect(')');
      return e;
    }

    if (t.kind === 'ident') {
      this.next();
      if (this.match('(')) {
        const args: Expr[] = [];
        if (this.peek().value !== ')') {
          do {
            args.push(this.parseAssignExpr());
          } while (this.match(','));
        }
        this.expect(')');
        return { kind: 'call', callee: t.value, args, line: t.line };
      }
      return { kind: 'ident', name: t.value, line: t.line };
    }

    throw syntaxErr(`Unexpected token '${t.value || 'EOF'}'`, t.line, t.col);
  }
}

// ============================================================================
// 6. WASM Code Generator
// ============================================================================

interface HostImportSpec {
  name: string;
  params: number[];
  results: number[];
}

const HOST_IMPORTS: HostImportSpec[] = [
  { name: '__tick', params: [], results: [] },
  { name: '__putchar', params: [WASM_I32], results: [WASM_I32] },
  { name: '__puts', params: [WASM_I32], results: [WASM_I32] },
  { name: '__printf', params: [WASM_I32, WASM_I32, WASM_I32], results: [WASM_I32] },
  { name: '__fprintf', params: [WASM_I32, WASM_I32, WASM_I32, WASM_I32], results: [WASM_I32] },
  { name: '__sprintf', params: [WASM_I32, WASM_I32, WASM_I32, WASM_I32], results: [WASM_I32] },
  { name: '__snprintf', params: [WASM_I32, WASM_I32, WASM_I32, WASM_I32, WASM_I32], results: [WASM_I32] },
  { name: '__scanf', params: [WASM_I32, WASM_I32, WASM_I32], results: [WASM_I32] },
  { name: '__getchar', params: [], results: [WASM_I32] },
  { name: '__fgets', params: [WASM_I32, WASM_I32, WASM_I32], results: [WASM_I32] },
  { name: '__malloc', params: [WASM_I32], results: [WASM_I32] },
  { name: '__calloc', params: [WASM_I32, WASM_I32], results: [WASM_I32] },
  { name: '__realloc', params: [WASM_I32, WASM_I32], results: [WASM_I32] },
  { name: '__free', params: [WASM_I32], results: [] },
  { name: '__strlen', params: [WASM_I32], results: [WASM_I32] },
  { name: '__strcpy', params: [WASM_I32, WASM_I32], results: [WASM_I32] },
  { name: '__strncpy', params: [WASM_I32, WASM_I32, WASM_I32], results: [WASM_I32] },
  { name: '__strcmp', params: [WASM_I32, WASM_I32], results: [WASM_I32] },
  { name: '__strncmp', params: [WASM_I32, WASM_I32, WASM_I32], results: [WASM_I32] },
  { name: '__strcat', params: [WASM_I32, WASM_I32], results: [WASM_I32] },
  { name: '__memset', params: [WASM_I32, WASM_I32, WASM_I32], results: [WASM_I32] },
  { name: '__memcpy', params: [WASM_I32, WASM_I32, WASM_I32], results: [WASM_I32] },
  { name: '__atoi', params: [WASM_I32], results: [WASM_I32] },
  { name: '__atof', params: [WASM_I32], results: [WASM_F64] },
  { name: '__rand', params: [], results: [WASM_I32] },
  { name: '__srand', params: [WASM_I32], results: [] },
  { name: '__exit', params: [WASM_I32], results: [] },
  { name: '__sqrt', params: [WASM_F64], results: [WASM_F64] },
  { name: '__pow', params: [WASM_F64, WASM_F64], results: [WASM_F64] },
  { name: '__sin', params: [WASM_F64], results: [WASM_F64] },
  { name: '__cos', params: [WASM_F64], results: [WASM_F64] },
  { name: '__tan', params: [WASM_F64], results: [WASM_F64] },
  { name: '__floor', params: [WASM_F64], results: [WASM_F64] },
  { name: '__ceil', params: [WASM_F64], results: [WASM_F64] },
  { name: '__round', params: [WASM_F64], results: [WASM_F64] },
  { name: '__fabs', params: [WASM_F64], results: [WASM_F64] },
  { name: '__log', params: [WASM_F64], results: [WASM_F64] },
  { name: '__log2', params: [WASM_F64], results: [WASM_F64] },
  { name: '__log10', params: [WASM_F64], results: [WASM_F64] },
  { name: '__exp', params: [WASM_F64], results: [WASM_F64] },
  { name: '__fmin', params: [WASM_F64, WASM_F64], results: [WASM_F64] },
  { name: '__fmax', params: [WASM_F64, WASM_F64], results: [WASM_F64] },
];

const RODATA_BASE = 0x0400; // 1KB offset
const HEAP_BASE = 0x4000;   // 16KB offset
const STACK_TOP = 0x40000;  // 256KB top (initial memory = 4 pages = 256KB, stack grows down)

interface LocalSlot {
  type: CType;
  frameOffset: number; // relative to frame base (`__fp`)
}

interface LabelEntry {
  kind: 'block' | 'loop' | 'if';
  tag?: 'break' | 'continue';
}

class FuncCompiler {
  private parser: CParser;
  private funcMap: Map<string, { index: number; def: FuncDef }>;
  private hostMap: Map<string, { index: number; spec: HostImportSpec }>;
  private allocString: (str: string) => number;
  private funcDef: FuncDef;

  public code: number[] = [];
  // Fixed scratch locals per function:
  // 0..paramCount-1: params
  // fpLocal: i32 base pointer of frame
  // scratchI32A, scratchI32B: i32 temps
  // scratchI64: i64 temp
  // scratchF64: f64 temp
  private fpLocal = 0;
  private scratchI32A = 0;
  private scratchI32B = 0;
  private scratchI64 = 0;
  private scratchF64 = 0;
  private nextFrameOffset = 0;
  private varargMaxBytes = 0;
  private scopes: Array<Map<string, LocalSlot>> = [];
  private labels: LabelEntry[] = [];
  private globalMap: Map<string, { addr: number; type: CType }>;

  constructor(
    parser: CParser,
    funcMap: Map<string, { index: number; def: FuncDef }>,
    hostMap: Map<string, { index: number; spec: HostImportSpec }>,
    globalMap: Map<string, { addr: number; type: CType }>,
    allocString: (str: string) => number,
    funcDef: FuncDef
  ) {
    this.parser = parser;
    this.funcMap = funcMap;
    this.hostMap = hostMap;
    this.globalMap = globalMap;
    this.allocString = allocString;
    this.funcDef = funcDef;
  }

  private pushScope() {
    this.scopes.push(new Map());
  }

  private popScope() {
    this.scopes.pop();
  }

  private allocFrameSlot(name: string, type: CType): LocalSlot {
    const size = Math.max(4, this.parser.sizeofType(type));
    const align = type.kind === 'longlong' || type.kind === 'double' ? 8 : 4;
    this.nextFrameOffset = Math.ceil(this.nextFrameOffset / align) * align;
    const slot: LocalSlot = { type, frameOffset: this.nextFrameOffset };
    this.nextFrameOffset += Math.ceil(size / 4) * 4;
    this.scopes[this.scopes.length - 1].set(name, slot);
    return slot;
  }

  private lookupVar(name: string): { kind: 'local'; slot: LocalSlot } | { kind: 'global'; addr: number; type: CType } | null {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const slot = this.scopes[i].get(name);
      if (slot) return { kind: 'local', slot };
    }
    const g = this.globalMap.get(name);
    if (g) return { kind: 'global', addr: g.addr, type: g.type };
    return null;
  }

  private emit(...bytes: number[]) {
    this.code.push(...bytes);
  }

  private emitI32Const(n: number) {
    this.emit(OP.i32_const, ...encodeSleb128(n | 0));
  }

  private emitI64Const(n: bigint) {
    this.emit(OP.i64_const, ...encodeBigIntSleb128(n));
  }

  private emitF64Const(n: number) {
    this.emit(OP.f64_const, ...encodeF64(n));
  }

  private emitStore(type: CType) {
    if (type.kind === 'char' || type.kind === 'bool') this.emit(OP.i32_store8, 0x00, 0x00);
    else if (type.kind === 'short') this.emit(OP.i32_store16, 0x01, 0x00);
    else if (type.kind === 'longlong') this.emit(OP.i64_store, 0x03, 0x00);
    else if (type.kind === 'double') this.emit(OP.f64_store, 0x03, 0x00);
    else this.emit(OP.i32_store, 0x02, 0x00);
  }

  private emitLoad(type: CType) {
    if (type.kind === 'char') {
      this.emit(type.unsigned ? OP.i32_load8_u : OP.i32_load8_s, 0x00, 0x00);
    } else if (type.kind === 'bool') {
      this.emit(OP.i32_load8_u, 0x00, 0x00);
    } else if (type.kind === 'short') {
      this.emit(type.unsigned ? OP.i32_load16_u : OP.i32_load16_s, 0x01, 0x00);
    } else if (type.kind === 'longlong') {
      this.emit(OP.i64_load, 0x03, 0x00);
    } else if (type.kind === 'double') {
      this.emit(OP.f64_load, 0x03, 0x00);
    } else {
      this.emit(OP.i32_load, 0x02, 0x00);
    }
  }

  private convertType(from: CType, to: CType) {
    if (from.kind === 'void' || to.kind === 'void') return;
    const fromW = toWasmValType(from);
    const toW = toWasmValType(to);
    if (fromW === toW) return;

    if (fromW === WASM_I32 && toW === WASM_F64) {
      this.emit(isUnsignedType(from) ? OP.f64_convert_i32_u : OP.f64_convert_i32_s);
    } else if (fromW === WASM_I64 && toW === WASM_F64) {
      this.emit(isUnsignedType(from) ? OP.f64_convert_i64_u : OP.f64_convert_i64_s);
    } else if (fromW === WASM_F64 && toW === WASM_I32) {
      this.emit(OP.i32_trunc_f64_s);
    } else if (fromW === WASM_F64 && toW === WASM_I64) {
      this.emit(OP.i64_trunc_f64_s);
    } else if (fromW === WASM_I32 && toW === WASM_I64) {
      this.emit(isUnsignedType(from) ? OP.i64_extend_i32_u : OP.i64_extend_i32_s);
    } else if (fromW === WASM_I64 && toW === WASM_I32) {
      this.emit(OP.i32_wrap_i64);
    }
  }

  private toTruthyI32(from: CType) {
    const w = toWasmValType(from);
    if (w === WASM_I32) {
      this.emitI32Const(0);
      this.emit(OP.i32_ne);
    } else if (w === WASM_I64) {
      this.emitI64Const(BigInt(0));
      this.emit(OP.i64_ne);
    } else if (w === WASM_F64) {
      this.emitF64Const(0);
      this.emit(OP.f64_ne);
    }
  }

  private binaryResultType(a: CType, b: CType): CType {
    if (isFloatType(a) || isFloatType(b)) return { kind: 'double' };
    if (isI64Type(a) || isI64Type(b)) return { kind: 'longlong', unsigned: isUnsignedType(a) || isUnsignedType(b) };
    if (a.kind === 'pointer') return a;
    if (b.kind === 'pointer') return b;
    return { kind: 'int', unsigned: isUnsignedType(a) && isUnsignedType(b) };
  }

  private inferType(e: Expr): CType {
    switch (e.kind) {
      case 'num':
        if (e.isFloat || e.suffix === 'f') return { kind: 'double' };
        if (e.suffix === 'll' || e.suffix === 'ull') {
          return { kind: 'longlong', unsigned: e.suffix === 'ull' };
        }
        return { kind: 'int', unsigned: e.suffix === 'u' };
      case 'str':
        return { kind: 'pointer', to: { kind: 'char', unsigned: false } };
      case 'ident': {
        if (e.name === 'stdout') return { kind: 'int', unsigned: false };
        if (e.name === 'stderr') return { kind: 'int', unsigned: false };
        if (e.name === 'stdin') return { kind: 'int', unsigned: false };
        const v = this.lookupVar(e.name);
        if (!v) throw syntaxErr(`Undeclared identifier '${e.name}'`, e.line);
        const t = v.kind === 'local' ? v.slot.type : v.type;
        return t;
      }
      case 'cast':
        return e.targetType;
      case 'sizeof_type':
      case 'sizeof_expr':
        return { kind: 'int', unsigned: true };
      case 'call': {
        const uFn = this.funcMap.get(e.callee);
        if (uFn) return uFn.def.returnType;
        const hSpec = this.resolveBuiltinReturnType(e.callee);
        if (hSpec) return hSpec;
        throw syntaxErr(`Call to undeclared function '${e.callee}'`, e.line);
      }
      case 'unary': {
        const inner = this.inferType(e.expr);
        if (e.op === '&') return { kind: 'pointer', to: inner };
        if (e.op === '*') {
          if (inner.kind === 'pointer') return inner.to;
          if (inner.kind === 'array') return inner.elem;
          throw syntaxErr('Cannot dereference non-pointer type', e.line);
        }
        if (e.op === '!') return { kind: 'int', unsigned: false };
        return inner;
      }
      case 'postfix':
        return this.inferType(e.expr);
      case 'index': {
        const arrT = this.inferType(e.arr);
        if (arrT.kind === 'array') return arrT.elem;
        if (arrT.kind === 'pointer') return arrT.to;
        throw syntaxErr('Subscripted value is neither array nor pointer', e.line);
      }
      case 'member': {
        const objT = this.inferType(e.obj);
        const structT = e.isArrow
          ? objT.kind === 'pointer'
            ? objT.to
            : objT
          : objT;
        if (structT.kind !== 'struct') throw syntaxErr('Member access on non-struct type', e.line);
        const def = this.parser.structs.get(structT.name);
        const field = def?.fields.find((f) => f.name === e.field);
        if (!field) throw syntaxErr(`Struct '${structT.name}' has no member '${e.field}'`, e.line);
        return field.type;
      }
      case 'assign':
        return this.inferType(e.left);
      case 'ternary':
        return this.binaryResultType(this.inferType(e.thenExpr), this.inferType(e.elseExpr));
      case 'binary': {
        if (
          e.op === '==' ||
          e.op === '!=' ||
          e.op === '<' ||
          e.op === '<=' ||
          e.op === '>' ||
          e.op === '>=' ||
          e.op === '&&' ||
          e.op === '||'
        ) {
          return { kind: 'int', unsigned: false };
        }
        if (e.op === ',') return this.inferType(e.right);
        const lt = this.inferType(e.left);
        const rt = this.inferType(e.right);
        if ((e.op === '+' || e.op === '-') && (lt.kind === 'pointer' || lt.kind === 'array')) {
          if (lt.kind === 'array') return { kind: 'pointer', to: lt.elem };
          return lt;
        }
        if (e.op === '+' && (rt.kind === 'pointer' || rt.kind === 'array')) {
          if (rt.kind === 'array') return { kind: 'pointer', to: rt.elem };
          return rt;
        }
        return this.binaryResultType(lt, rt);
      }
      case 'init_list':
        return { kind: 'void' };
    }
  }

  private resolveBuiltinReturnType(name: string): CType | null {
    switch (name) {
      case 'printf':
      case 'fprintf':
      case 'sprintf':
      case 'snprintf':
      case 'scanf':
      case 'puts':
      case 'putchar':
      case 'getchar':
      case 'strcmp':
      case 'strncmp':
      case 'atoi':
      case 'abs':
      case 'rand':
        return { kind: 'int', unsigned: false };
      case 'labs':
        return { kind: 'longlong', unsigned: false };
      case 'strlen':
        return { kind: 'int', unsigned: true };
      case 'malloc':
      case 'calloc':
      case 'realloc':
      case 'memset':
      case 'memcpy':
      case 'memmove':
        return { kind: 'pointer', to: { kind: 'void' } };
      case 'strcpy':
      case 'strncpy':
      case 'strcat':
      case 'fgets':
        return { kind: 'pointer', to: { kind: 'char', unsigned: false } };
      case 'free':
      case 'srand':
      case 'exit':
        return { kind: 'void' };
      case 'sqrt':
      case 'pow':
      case 'sin':
      case 'cos':
      case 'tan':
      case 'floor':
      case 'ceil':
      case 'round':
      case 'fabs':
      case 'log':
      case 'log2':
      case 'log10':
      case 'exp':
      case 'fmin':
      case 'fmax':
      case 'atof':
        return { kind: 'double' };
      default:
        return null;
    }
  }

  /** Emits i32 address of an LValue expression. */
  private emitAddress(e: Expr): CType {
    if (e.kind === 'ident') {
      const v = this.lookupVar(e.name);
      if (!v) throw syntaxErr(`Undeclared variable '${e.name}'`, e.line);
      if (v.kind === 'local') {
        this.emit(OP.local_get, ...encodeUleb128(this.fpLocal));
        if (v.slot.frameOffset !== 0) {
          this.emitI32Const(v.slot.frameOffset);
          this.emit(OP.i32_add);
        }
        return v.slot.type;
      } else {
        this.emitI32Const(v.addr);
        return v.type;
      }
    }
    if (e.kind === 'unary' && e.op === '*') {
      const pt = this.emitExpr(e.expr);
      if (pt.kind === 'pointer') return pt.to;
      if (pt.kind === 'array') return pt.elem;
      throw syntaxErr('Dereference target must be a pointer', e.line);
    }
    if (e.kind === 'index') {
      const arrT = this.inferType(e.arr);
      const elemT = arrT.kind === 'array' ? arrT.elem : arrT.kind === 'pointer' ? arrT.to : null;
      if (!elemT) throw syntaxErr('Subscript target is not an array or pointer', e.line);
      this.emitExpr(e.arr); // decays array to base addr or evaluates pointer
      const idxT = this.emitExpr(e.idx);
      this.convertType(idxT, { kind: 'int', unsigned: false });
      const elemSize = this.parser.sizeofType(elemT);
      if (elemSize !== 1) {
        this.emitI32Const(elemSize);
        this.emit(OP.i32_mul);
      }
      this.emit(OP.i32_add);
      return elemT;
    }
    if (e.kind === 'member') {
      let structType: CType;
      if (e.isArrow) {
        const ptrType = this.emitExpr(e.obj);
        if (ptrType.kind !== 'pointer' || ptrType.to.kind !== 'struct') {
          throw syntaxErr('Arrow operator requires pointer to struct', e.line);
        }
        structType = ptrType.to;
      } else {
        structType = this.emitAddress(e.obj);
        if (structType.kind !== 'struct') {
          throw syntaxErr('Dot operator requires struct', e.line);
        }
      }
      const def = this.parser.structs.get(structType.name);
      const field = def?.fields.find((f) => f.name === e.field);
      if (!field) throw syntaxErr(`Unknown struct field '${e.field}'`, e.line);
      if (field.offset !== 0) {
        this.emitI32Const(field.offset);
        this.emit(OP.i32_add);
      }
      return field.type;
    }
    throw syntaxErr('Expression is not an assignable lvalue', e.line);
  }

  private emitExpr(e: Expr): CType {
    switch (e.kind) {
      case 'num': {
        if (e.isFloat || e.suffix === 'f') {
          this.emitF64Const(parseFloat(e.raw));
          return { kind: 'double' };
        }
        if (e.suffix === 'll' || e.suffix === 'ull') {
          const big = BigInt(e.raw);
          this.emitI64Const(big);
          return { kind: 'longlong', unsigned: e.suffix === 'ull' };
        }
        const n = e.raw.startsWith('0x') || e.raw.startsWith('0X')
          ? parseInt(e.raw, 16)
          : parseInt(e.raw, 10);
        this.emitI32Const(n | 0);
        return { kind: 'int', unsigned: e.suffix === 'u' };
      }

      case 'str': {
        const addr = this.allocString(e.value);
        this.emitI32Const(addr);
        return { kind: 'pointer', to: { kind: 'char', unsigned: false } };
      }

      case 'ident': {
        if (e.name === 'stdout') {
          this.emitI32Const(1);
          return { kind: 'int', unsigned: false };
        }
        if (e.name === 'stderr') {
          this.emitI32Const(2);
          return { kind: 'int', unsigned: false };
        }
        if (e.name === 'stdin') {
          this.emitI32Const(0);
          return { kind: 'int', unsigned: false };
        }
        const addrType = this.emitAddress(e);
        if (addrType.kind === 'array') {
          return { kind: 'pointer', to: addrType.elem };
        }
        if (addrType.kind === 'struct') {
          throw syntaxErr('Passing/evaluating struct by value is unsupported; use pointer (&s or ->)', e.line);
        }
        this.emitLoad(addrType);
        return addrType;
      }

      case 'sizeof_type': {
        this.emitI32Const(this.parser.sizeofType(e.targetType));
        return { kind: 'int', unsigned: true };
      }

      case 'sizeof_expr': {
        const t = this.inferType(e.expr);
        this.emitI32Const(this.parser.sizeofType(t));
        return { kind: 'int', unsigned: true };
      }

      case 'cast': {
        const from = this.emitExpr(e.expr);
        this.convertType(from, e.targetType);
        return e.targetType;
      }

      case 'unary': {
        if (e.op === '&') {
          const inner = this.emitAddress(e.expr);
          return { kind: 'pointer', to: inner };
        }
        if (e.op === '*') {
          const pt = this.emitExpr(e.expr);
          const elem = pt.kind === 'pointer' ? pt.to : pt.kind === 'array' ? pt.elem : null;
          if (!elem) throw syntaxErr('Cannot dereference non-pointer', e.line);
          if (elem.kind === 'array') return { kind: 'pointer', to: elem.elem };
          this.emitLoad(elem);
          return elem;
        }
        if (e.op === '+') {
          return this.emitExpr(e.expr);
        }
        if (e.op === '-') {
          const t = this.inferType(e.expr);
          if (isFloatType(t)) {
            this.emitExpr(e.expr);
            this.emit(OP.f64_neg);
            return t;
          } else if (isI64Type(t)) {
            this.emitI64Const(BigInt(0));
            this.emitExpr(e.expr);
            this.emit(OP.i64_sub);
            return t;
          } else {
            this.emitI32Const(0);
            this.emitExpr(e.expr);
            this.emit(OP.i32_sub);
            return t;
          }
        }
        if (e.op === '!') {
          const t = this.emitExpr(e.expr);
          const w = toWasmValType(t);
          if (w === WASM_I64) {
            this.emit(OP.i64_eqz);
          } else if (w === WASM_F64) {
            this.emitF64Const(0);
            this.emit(OP.f64_eq);
          } else {
            this.emit(OP.i32_eqz);
          }
          return { kind: 'int', unsigned: false };
        }
        if (e.op === '~') {
          const t = this.emitExpr(e.expr);
          if (isI64Type(t)) {
            this.emitI64Const(BigInt(-1));
            this.emit(OP.i64_xor);
          } else {
            this.emitI32Const(-1);
            this.emit(OP.i32_xor);
          }
          return t;
        }
        if (e.op === '++' || e.op === '--') {
          return this.emitIncDec(e.expr, e.op === '++' ? 1 : -1, false);
        }
        throw syntaxErr(`Unsupported unary operator '${e.op}'`, e.line);
      }

      case 'postfix': {
        return this.emitIncDec(e.expr, e.op === '++' ? 1 : -1, true);
      }

      case 'index': {
        const elemT = this.emitAddress(e);
        if (elemT.kind === 'array') return { kind: 'pointer', to: elemT.elem };
        this.emitLoad(elemT);
        return elemT;
      }

      case 'member': {
        const fieldT = this.emitAddress(e);
        if (fieldT.kind === 'array') return { kind: 'pointer', to: fieldT.elem };
        this.emitLoad(fieldT);
        return fieldT;
      }

      case 'assign': {
        return this.emitAssignment(e.op, e.left, e.right);
      }

      case 'ternary': {
        const ct = this.emitExpr(e.cond);
        this.toTruthyI32(ct);
        const resT = this.inferType(e);
        const w = toWasmValType(resT) || 0x40;
        this.emit(OP.if, w);
        this.labels.push({ kind: 'if' });
        const lt = this.emitExpr(e.thenExpr);
        this.convertType(lt, resT);
        this.emit(OP.else);
        const rt = this.emitExpr(e.elseExpr);
        this.convertType(rt, resT);
        this.labels.pop();
        this.emit(OP.end);
        return resT;
      }

      case 'binary': {
        if (e.op === ',') {
          const lt = this.emitExpr(e.left);
          if (lt.kind !== 'void') this.emit(OP.drop);
          return this.emitExpr(e.right);
        }

        if (e.op === '&&') {
          const lt = this.emitExpr(e.left);
          this.toTruthyI32(lt);
          this.emit(OP.if, WASM_I32);
          this.labels.push({ kind: 'if' });
          const rt = this.emitExpr(e.right);
          this.toTruthyI32(rt);
          this.emit(OP.else);
          this.emitI32Const(0);
          this.labels.pop();
          this.emit(OP.end);
          return { kind: 'int', unsigned: false };
        }

        if (e.op === '||') {
          const lt = this.emitExpr(e.left);
          this.toTruthyI32(lt);
          this.emit(OP.if, WASM_I32);
          this.labels.push({ kind: 'if' });
          this.emitI32Const(1);
          this.emit(OP.else);
          const rt = this.emitExpr(e.right);
          this.toTruthyI32(rt);
          this.labels.pop();
          this.emit(OP.end);
          return { kind: 'int', unsigned: false };
        }

        const lt = this.inferType(e.left);
        const rt = this.inferType(e.right);

        // Pointer arithmetic: ptr +/- int, int + ptr
        if ((e.op === '+' || e.op === '-') && (lt.kind === 'pointer' || lt.kind === 'array')) {
          const target = lt.kind === 'pointer' ? lt.to : lt.elem;
          if (rt.kind === 'pointer' && e.op === '-') {
            this.emitExpr(e.left);
            this.emitExpr(e.right);
            this.emit(OP.i32_sub);
            const sz = this.parser.sizeofType(target);
            if (sz > 1) {
              this.emitI32Const(sz);
              this.emit(OP.i32_div_s);
            }
            return { kind: 'int', unsigned: false };
          }
          this.emitExpr(e.left);
          const idxT = this.emitExpr(e.right);
          this.convertType(idxT, { kind: 'int', unsigned: false });
          const sz = this.parser.sizeofType(target);
          if (sz > 1) {
            this.emitI32Const(sz);
            this.emit(OP.i32_mul);
          }
          this.emit(e.op === '+' ? OP.i32_add : OP.i32_sub);
          return lt.kind === 'array' ? { kind: 'pointer', to: target } : lt;
        }

        const common = this.binaryResultType(lt, rt);
        const emitL = this.emitExpr(e.left);
        this.convertType(emitL, common);
        const emitR = this.emitExpr(e.right);
        this.convertType(emitR, common);

        const isCmp =
          e.op === '==' ||
          e.op === '!=' ||
          e.op === '<' ||
          e.op === '<=' ||
          e.op === '>' ||
          e.op === '>=';

        if (isFloatType(common)) {
          switch (e.op) {
            case '+': this.emit(OP.f64_add); break;
            case '-': this.emit(OP.f64_sub); break;
            case '*': this.emit(OP.f64_mul); break;
            case '/': this.emit(OP.f64_div); break;
            case '==': this.emit(OP.f64_eq); break;
            case '!=': this.emit(OP.f64_ne); break;
            case '<': this.emit(OP.f64_lt); break;
            case '<=': this.emit(OP.f64_le); break;
            case '>': this.emit(OP.f64_gt); break;
            case '>=': this.emit(OP.f64_ge); break;
            default: throw syntaxErr(`Operator '${e.op}' cannot be applied to double`, e.line);
          }
          return isCmp ? { kind: 'int', unsigned: false } : common;
        }

        if (isI64Type(common)) {
          const uns = isUnsignedType(common);
          switch (e.op) {
            case '+': this.emit(OP.i64_add); break;
            case '-': this.emit(OP.i64_sub); break;
            case '*': this.emit(OP.i64_mul); break;
            case '/': this.emit(uns ? OP.i64_div_u : OP.i64_div_s); break;
            case '%': this.emit(uns ? OP.i64_rem_u : OP.i64_rem_s); break;
            case '&': this.emit(OP.i64_and); break;
            case '|': this.emit(OP.i64_or); break;
            case '^': this.emit(OP.i64_xor); break;
            case '<<': this.emit(OP.i64_shl); break;
            case '>>': this.emit(uns ? OP.i64_shr_u : OP.i64_shr_s); break;
            case '==': this.emit(OP.i64_eq); break;
            case '!=': this.emit(OP.i64_ne); break;
            case '<': this.emit(uns ? OP.i64_lt_u : OP.i64_lt_s); break;
            case '<=': this.emit(uns ? OP.i64_le_u : OP.i64_le_s); break;
            case '>': this.emit(uns ? OP.i64_gt_u : OP.i64_gt_s); break;
            case '>=': this.emit(uns ? OP.i64_ge_u : OP.i64_ge_s); break;
            default: throw syntaxErr(`Unsupported 64-bit operator '${e.op}'`, e.line);
          }
          return isCmp ? { kind: 'int', unsigned: false } : common;
        }

        const uns = isUnsignedType(common);
        switch (e.op) {
          case '+': this.emit(OP.i32_add); break;
          case '-': this.emit(OP.i32_sub); break;
          case '*': this.emit(OP.i32_mul); break;
          case '/': this.emit(uns ? OP.i32_div_u : OP.i32_div_s); break;
          case '%': this.emit(uns ? OP.i32_rem_u : OP.i32_rem_s); break;
          case '&': this.emit(OP.i32_and); break;
          case '|': this.emit(OP.i32_or); break;
          case '^': this.emit(OP.i32_xor); break;
          case '<<': this.emit(OP.i32_shl); break;
          case '>>': this.emit(uns ? OP.i32_shr_u : OP.i32_shr_s); break;
          case '==': this.emit(OP.i32_eq); break;
          case '!=': this.emit(OP.i32_ne); break;
          case '<': this.emit(uns ? OP.i32_lt_u : OP.i32_lt_s); break;
          case '<=': this.emit(uns ? OP.i32_le_u : OP.i32_le_s); break;
          case '>': this.emit(uns ? OP.i32_gt_u : OP.i32_gt_s); break;
          case '>=': this.emit(uns ? OP.i32_ge_u : OP.i32_ge_s); break;
          default: throw syntaxErr(`Unsupported operator '${e.op}'`, e.line);
        }
        return isCmp ? { kind: 'int', unsigned: false } : common;
      }

      case 'call': {
        return this.emitCall(e.callee, e.args, e.line);
      }

      case 'init_list':
        throw syntaxErr('Initializer list only allowed in variable declaration', e.line);
    }
  }

  private emitIncDec(target: Expr, delta: number, isPostfix: boolean): CType {
    const t = this.emitAddress(target);
    this.emit(OP.local_tee, ...encodeUleb128(this.scratchI32A)); // addr
    this.emitLoad(t);
    const step = t.kind === 'pointer' ? this.parser.sizeofType(t.to) * delta : delta;

    if (isFloatType(t)) {
      this.emit(OP.local_tee, ...encodeUleb128(this.scratchF64));
      this.emit(OP.local_get, ...encodeUleb128(this.scratchI32A));
      this.emit(OP.local_get, ...encodeUleb128(this.scratchF64));
      this.emitF64Const(step);
      this.emit(OP.f64_add);
      this.emitStore(t);
      if (isPostfix) {
        this.emit(OP.local_get, ...encodeUleb128(this.scratchF64));
      } else {
        this.emit(OP.local_get, ...encodeUleb128(this.scratchF64));
        this.emitF64Const(step);
        this.emit(OP.f64_add);
      }
      return t;
    }

    if (isI64Type(t)) {
      this.emit(OP.local_tee, ...encodeUleb128(this.scratchI64));
      this.emit(OP.local_get, ...encodeUleb128(this.scratchI32A));
      this.emit(OP.local_get, ...encodeUleb128(this.scratchI64));
      this.emitI64Const(BigInt(step));
      this.emit(OP.i64_add);
      this.emitStore(t);
      if (isPostfix) {
        this.emit(OP.local_get, ...encodeUleb128(this.scratchI64));
      } else {
        this.emit(OP.local_get, ...encodeUleb128(this.scratchI64));
        this.emitI64Const(BigInt(step));
        this.emit(OP.i64_add);
      }
      return t;
    }

    this.emit(OP.local_tee, ...encodeUleb128(this.scratchI32B));
    this.emit(OP.local_get, ...encodeUleb128(this.scratchI32A));
    this.emit(OP.local_get, ...encodeUleb128(this.scratchI32B));
    this.emitI32Const(step);
    this.emit(OP.i32_add);
    this.emitStore(t);
    if (isPostfix) {
      this.emit(OP.local_get, ...encodeUleb128(this.scratchI32B));
    } else {
      this.emit(OP.local_get, ...encodeUleb128(this.scratchI32B));
      this.emitI32Const(step);
      this.emit(OP.i32_add);
    }
    return t;
  }

  private emitAssignment(op: string, left: Expr, right: Expr): CType {
    const lType = this.emitAddress(left);
    this.emit(OP.local_set, ...encodeUleb128(this.scratchI32A)); // addr

    if (op === '=') {
      this.emit(OP.local_get, ...encodeUleb128(this.scratchI32A));
      const rType = this.emitExpr(right);
      this.convertType(rType, lType);
      this.saveTempAndStore(lType);
      return lType;
    }

    const baseOp = op.slice(0, -1); // '+' from '+='
    // Load current value at addr
    this.emit(OP.local_get, ...encodeUleb128(this.scratchI32A));
    this.emit(OP.local_get, ...encodeUleb128(this.scratchI32A));
    this.emitLoad(lType);

    const rType = this.emitExpr(right);
    if (lType.kind === 'pointer' && (baseOp === '+' || baseOp === '-')) {
      this.convertType(rType, { kind: 'int', unsigned: false });
      const sz = this.parser.sizeofType(lType.to);
      if (sz > 1) {
        this.emitI32Const(sz);
        this.emit(OP.i32_mul);
      }
      this.emit(baseOp === '+' ? OP.i32_add : OP.i32_sub);
    } else {
      this.convertType(rType, lType);
      if (isFloatType(lType)) {
        if (baseOp === '+') this.emit(OP.f64_add);
        else if (baseOp === '-') this.emit(OP.f64_sub);
        else if (baseOp === '*') this.emit(OP.f64_mul);
        else if (baseOp === '/') this.emit(OP.f64_div);
      } else if (isI64Type(lType)) {
        const uns = isUnsignedType(lType);
        if (baseOp === '+') this.emit(OP.i64_add);
        else if (baseOp === '-') this.emit(OP.i64_sub);
        else if (baseOp === '*') this.emit(OP.i64_mul);
        else if (baseOp === '/') this.emit(uns ? OP.i64_div_u : OP.i64_div_s);
        else if (baseOp === '%') this.emit(uns ? OP.i64_rem_u : OP.i64_rem_s);
        else if (baseOp === '&') this.emit(OP.i64_and);
        else if (baseOp === '|') this.emit(OP.i64_or);
        else if (baseOp === '^') this.emit(OP.i64_xor);
        else if (baseOp === '<<') this.emit(OP.i64_shl);
        else if (baseOp === '>>') this.emit(uns ? OP.i64_shr_u : OP.i64_shr_s);
      } else {
        const uns = isUnsignedType(lType);
        if (baseOp === '+') this.emit(OP.i32_add);
        else if (baseOp === '-') this.emit(OP.i32_sub);
        else if (baseOp === '*') this.emit(OP.i32_mul);
        else if (baseOp === '/') this.emit(uns ? OP.i32_div_u : OP.i32_div_s);
        else if (baseOp === '%') this.emit(uns ? OP.i32_rem_u : OP.i32_rem_s);
        else if (baseOp === '&') this.emit(OP.i32_and);
        else if (baseOp === '|') this.emit(OP.i32_or);
        else if (baseOp === '^') this.emit(OP.i32_xor);
        else if (baseOp === '<<') this.emit(OP.i32_shl);
        else if (baseOp === '>>') this.emit(uns ? OP.i32_shr_u : OP.i32_shr_s);
      }
    }
    this.saveTempAndStore(lType);
    return lType;
  }

  /** Stack top has value, below it has addr. Stores value AND leaves value on stack. */
  private saveTempAndStore(type: CType) {
    if (isFloatType(type)) {
      this.emit(OP.local_tee, ...encodeUleb128(this.scratchF64));
      this.emitStore(type);
      this.emit(OP.local_get, ...encodeUleb128(this.scratchF64));
    } else if (isI64Type(type)) {
      this.emit(OP.local_tee, ...encodeUleb128(this.scratchI64));
      this.emitStore(type);
      this.emit(OP.local_get, ...encodeUleb128(this.scratchI64));
    } else {
      this.emit(OP.local_tee, ...encodeUleb128(this.scratchI32B));
      this.emitStore(type);
      this.emit(OP.local_get, ...encodeUleb128(this.scratchI32B));
    }
  }

  /** Serializes variadic arguments into a scratch buffer inside the stack frame:
   * Each slot is 16 bytes:
   *   offset +0: i32 tag (0=i32/signed, 1=u32/ptr, 2=i64, 3=f64)
   *   offset +8: value (i32, i64, or f64)
   */
  private emitVarargsBuffer(varArgs: Expr[]): number {
    if (varArgs.length === 0) {
      this.emitI32Const(0);
      return 0;
    }
    const bytesNeeded = varArgs.length * 16;
    if (bytesNeeded > this.varargMaxBytes) {
      this.varargMaxBytes = bytesNeeded;
    }
    // We place varargs at dynamic address __sp (Wait: __sp is current bottom of stack frame;
    // reserving space below frame works if we bump __sp temporarily OR place vararg area at fixed frame offset!).
    // Even simpler: compute vararg buffer at end of locals (`fpLocal + frameVarargPlaceholder`) OR pass offset patched during finalize!
    // We use a distinct scratch local `scratchI32A` initialized after locals? Better: reserve bytes at fixed offset below `__sp`!
    // Since nothing else runs while preparing varargs, `[__sp - bytesNeeded]` is safe ONLY if args don't call printf recursively.
    // To allow nested calls cleanly, reserve a per-function vararg area at fixed frame offset by allocating each vararg at `fp + fixedVarargOffset`?
    // Even simpler: allocate slot via temp `__sp -= bytesNeeded` around the call, OR use `this.nextFrameOffset` cleanly!
    // Notice: evaluating args BEFORE updating vararg slots handles nested calls safely! So allocate temp slots cleanly:
    const startOffset = this.nextFrameOffset;
    this.nextFrameOffset += bytesNeeded;

    for (let i = 0; i < varArgs.length; i++) {
      const slotOff = startOffset + i * 16;
      const arg = varArgs[i];
      // Evaluate into scratch first so nested calls can't clobber buffer address
      const t = this.emitExpr(arg);
      let tag = 0;
      if (isFloatType(t)) {
        tag = 3;
        this.emit(OP.local_set, ...encodeUleb128(this.scratchF64));
      } else if (isI64Type(t)) {
        tag = isUnsignedType(t) ? 4 : 2;
        this.emit(OP.local_set, ...encodeUleb128(this.scratchI64));
      } else {
        tag = t.kind === 'pointer' ? 5 : isUnsignedType(t) ? 1 : 0;
        this.emit(OP.local_set, ...encodeUleb128(this.scratchI32B));
      }

      // Store tag
      this.emit(OP.local_get, ...encodeUleb128(this.fpLocal));
      if (slotOff !== 0) {
        this.emitI32Const(slotOff);
        this.emit(OP.i32_add);
      }
      this.emitI32Const(tag);
      this.emit(OP.i32_store, 0x02, 0x00);

      // Store value at +8
      this.emit(OP.local_get, ...encodeUleb128(this.fpLocal));
      this.emitI32Const(slotOff + 8);
      this.emit(OP.i32_add);
      if (isFloatType(t)) {
        this.emit(OP.local_get, ...encodeUleb128(this.scratchF64));
        this.emit(OP.f64_store, 0x03, 0x00);
      } else if (isI64Type(t)) {
        this.emit(OP.local_get, ...encodeUleb128(this.scratchI64));
        this.emit(OP.i64_store, 0x03, 0x00);
      } else {
        this.emit(OP.local_get, ...encodeUleb128(this.scratchI32B));
        this.emit(OP.i32_store, 0x02, 0x00);
      }
    }

    this.emit(OP.local_get, ...encodeUleb128(this.fpLocal));
    if (startOffset !== 0) {
      this.emitI32Const(startOffset);
      this.emit(OP.i32_add);
    }
    return varArgs.length;
  }

  private emitCall(callee: string, args: Expr[], line: number): CType {
    // 1. User-defined function
    const userFn = this.funcMap.get(callee);
    if (userFn) {
      for (let i = 0; i < userFn.def.params.length; i++) {
        const expected = userFn.def.params[i].type;
        if (i < args.length) {
          const actual = this.emitExpr(args[i]);
          this.convertType(actual, expected);
        } else {
          this.emitI32Const(0);
        }
      }
      this.emit(OP.call, ...encodeUleb128(userFn.index));
      return userFn.def.returnType;
    }

    // 2. Variadic libc functions
    if (callee === 'printf') {
      if (args.length < 1) throw syntaxErr('printf expects at least 1 argument', line);
      const fmtT = this.emitExpr(args[0]);
      this.convertType(fmtT, { kind: 'pointer', to: { kind: 'char', unsigned: false } });
      this.emitI32Const(args.length - 1);
      this.emitVarargsBuffer(args.slice(1));
      this.emit(OP.call, ...encodeUleb128(this.hostMap.get('__printf')!.index));
      return { kind: 'int', unsigned: false };
    }

    if (callee === 'fprintf') {
      if (args.length < 2) throw syntaxErr('fprintf expects at least 2 arguments', line);
      const streamT = this.emitExpr(args[0]);
      this.convertType(streamT, { kind: 'int', unsigned: false });
      const fmtT = this.emitExpr(args[1]);
      this.convertType(fmtT, { kind: 'pointer', to: { kind: 'char', unsigned: false } });
      this.emitI32Const(args.length - 2);
      this.emitVarargsBuffer(args.slice(2));
      this.emit(OP.call, ...encodeUleb128(this.hostMap.get('__fprintf')!.index));
      return { kind: 'int', unsigned: false };
    }

    if (callee === 'sprintf') {
      if (args.length < 2) throw syntaxErr('sprintf expects at least 2 arguments', line);
      this.emitExpr(args[0]);
      this.emitExpr(args[1]);
      this.emitI32Const(args.length - 2);
      this.emitVarargsBuffer(args.slice(2));
      this.emit(OP.call, ...encodeUleb128(this.hostMap.get('__sprintf')!.index));
      return { kind: 'int', unsigned: false };
    }

    if (callee === 'snprintf') {
      if (args.length < 3) throw syntaxErr('snprintf expects at least 3 arguments', line);
      this.emitExpr(args[0]);
      const szT = this.emitExpr(args[1]);
      this.convertType(szT, { kind: 'int', unsigned: false });
      this.emitExpr(args[2]);
      this.emitI32Const(args.length - 3);
      this.emitVarargsBuffer(args.slice(3));
      this.emit(OP.call, ...encodeUleb128(this.hostMap.get('__snprintf')!.index));
      return { kind: 'int', unsigned: false };
    }

    if (callee === 'scanf') {
      if (args.length < 1) throw syntaxErr('scanf expects at least 1 argument', line);
      this.emitExpr(args[0]);
      this.emitI32Const(args.length - 1);
      this.emitVarargsBuffer(args.slice(1));
      this.emit(OP.call, ...encodeUleb128(this.hostMap.get('__scanf')!.index));
      return { kind: 'int', unsigned: false };
    }

    if (callee === 'abs' && args.length === 1) {
      const t = this.emitExpr(args[0]);
      this.convertType(t, { kind: 'double' });
      this.emit(OP.call, ...encodeUleb128(this.hostMap.get('__fabs')!.index));
      this.emit(OP.i32_trunc_f64_s);
      return { kind: 'int', unsigned: false };
    }

    if (callee === 'labs' && args.length === 1) {
      const t = this.emitExpr(args[0]);
      this.convertType(t, { kind: 'double' });
      this.emit(OP.call, ...encodeUleb128(this.hostMap.get('__fabs')!.index));
      this.emit(OP.i64_trunc_f64_s);
      return { kind: 'longlong', unsigned: false };
    }

    // 3. Direct host import mapping `__<name>`
    const hostEntry = this.hostMap.get(`__${callee}`);
    if (hostEntry) {
      const { index, spec } = hostEntry;
      for (let i = 0; i < spec.params.length; i++) {
        const expectedW = spec.params[i];
        const expectedType: CType =
          expectedW === WASM_F64
            ? { kind: 'double' }
            : expectedW === WASM_I64
            ? { kind: 'longlong', unsigned: false }
            : { kind: 'int', unsigned: false };
        if (i < args.length) {
          const actual = this.emitExpr(args[i]);
          this.convertType(actual, expectedType);
        } else {
          if (expectedW === WASM_F64) this.emitF64Const(0);
          else this.emitI32Const(0);
        }
      }
      this.emit(OP.call, ...encodeUleb128(index));
      return this.resolveBuiltinReturnType(callee) || { kind: 'void' };
    }

    throw syntaxErr(`Undefined function '${callee}'`, line);
  }

  private emitZeroInit(frameOffset: number, sizeBytes: number) {
    for (let off = 0; off < sizeBytes; off += 4) {
      this.emit(OP.local_get, ...encodeUleb128(this.fpLocal));
      if (frameOffset + off !== 0) {
        this.emitI32Const(frameOffset + off);
        this.emit(OP.i32_add);
      }
      this.emitI32Const(0);
      this.emit(OP.i32_store, 0x02, 0x00);
    }
  }

  private emitStmt(s: Stmt) {
    switch (s.kind) {
      case 'block': {
        this.pushScope();
        for (const inner of s.stmts) {
          this.emitStmt(inner);
        }
        this.popScope();
        break;
      }

      case 'vardecl': {
        for (const decl of s.decls) {
          const slot = this.allocFrameSlot(decl.name, decl.type);
          if (!decl.init) continue;

          if (decl.type.kind === 'array') {
            const totalSize = this.parser.sizeofType(decl.type);
            this.emitZeroInit(slot.frameOffset, totalSize);
            if (decl.init.kind === 'init_list') {
              const elemSize = this.parser.sizeofType(decl.type.elem);
              const count = Math.min(decl.init.items.length, Math.max(0, decl.type.length));
              for (let idx = 0; idx < count; idx++) {
                this.emit(OP.local_get, ...encodeUleb128(this.fpLocal));
                const off = slot.frameOffset + idx * elemSize;
                if (off !== 0) {
                  this.emitI32Const(off);
                  this.emit(OP.i32_add);
                }
                const it = this.emitExpr(decl.init.items[idx]);
                this.convertType(it, decl.type.elem);
                this.emitStore(decl.type.elem);
              }
            } else if (decl.init.kind === 'str') {
              // Copy string bytes into stack array
              this.emit(OP.local_get, ...encodeUleb128(this.fpLocal));
              if (slot.frameOffset !== 0) {
                this.emitI32Const(slot.frameOffset);
                this.emit(OP.i32_add);
              }
              this.emitExpr(decl.init);
              this.emitI32Const(totalSize);
              this.emit(OP.call, ...encodeUleb128(this.hostMap.get('__strncpy')!.index));
              this.emit(OP.drop);
            }
          } else {
            this.emit(OP.local_get, ...encodeUleb128(this.fpLocal));
            if (slot.frameOffset !== 0) {
              this.emitI32Const(slot.frameOffset);
              this.emit(OP.i32_add);
            }
            const initT = this.emitExpr(decl.init);
            this.convertType(initT, decl.type);
            this.emitStore(decl.type);
          }
        }
        break;
      }

      case 'expr': {
        if (s.expr) {
          const t = this.emitExpr(s.expr);
          if (t.kind !== 'void') this.emit(OP.drop);
        }
        break;
      }

      case 'if': {
        const ct = this.emitExpr(s.cond);
        this.toTruthyI32(ct);
        this.emit(OP.if, 0x40);
        this.labels.push({ kind: 'if' });
        this.emitStmt(s.thenBranch);
        if (s.elseBranch) {
          this.emit(OP.else);
          this.emitStmt(s.elseBranch);
        }
        this.labels.pop();
        this.emit(OP.end);
        break;
      }

      case 'while': {
        this.emit(OP.block, 0x40);
        this.labels.push({ kind: 'block', tag: 'break' });
        this.emit(OP.loop, 0x40);
        this.labels.push({ kind: 'loop' });
        const ct = this.emitExpr(s.cond);
        this.toTruthyI32(ct);
        this.emit(OP.i32_eqz);
        this.emit(OP.br_if, ...encodeUleb128(1)); // branch to outer $break
        this.emit(OP.block, 0x40);
        this.labels.push({ kind: 'block', tag: 'continue' });
        this.emitStmt(s.body);
        this.labels.pop();
        this.emit(OP.end);
        this.emit(OP.call, ...encodeUleb128(this.hostMap.get('__tick')!.index));
        this.emit(OP.br, ...encodeUleb128(0)); // repeat $loop
        this.labels.pop();
        this.emit(OP.end);
        this.labels.pop();
        this.emit(OP.end);
        break;
      }

      case 'dowhile': {
        this.emit(OP.block, 0x40);
        this.labels.push({ kind: 'block', tag: 'break' });
        this.emit(OP.loop, 0x40);
        this.labels.push({ kind: 'loop' });
        this.emit(OP.block, 0x40);
        this.labels.push({ kind: 'block', tag: 'continue' });
        this.emitStmt(s.body);
        this.labels.pop();
        this.emit(OP.end);
        this.emit(OP.call, ...encodeUleb128(this.hostMap.get('__tick')!.index));
        const ct = this.emitExpr(s.cond);
        this.toTruthyI32(ct);
        this.emit(OP.br_if, ...encodeUleb128(0));
        this.labels.pop();
        this.emit(OP.end);
        this.labels.pop();
        this.emit(OP.end);
        break;
      }

      case 'for': {
        this.pushScope();
        if (s.init) this.emitStmt(s.init);

        this.emit(OP.block, 0x40);
        this.labels.push({ kind: 'block', tag: 'break' });
        this.emit(OP.loop, 0x40);
        this.labels.push({ kind: 'loop' });

        if (s.cond) {
          const ct = this.emitExpr(s.cond);
          this.toTruthyI32(ct);
          this.emit(OP.i32_eqz);
          this.emit(OP.br_if, ...encodeUleb128(1));
        }

        this.emit(OP.block, 0x40);
        this.labels.push({ kind: 'block', tag: 'continue' });
        this.emitStmt(s.body);
        this.labels.pop();
        this.emit(OP.end);

        if (s.post) {
          const pt = this.emitExpr(s.post);
          if (pt.kind !== 'void') this.emit(OP.drop);
        }

        this.emit(OP.call, ...encodeUleb128(this.hostMap.get('__tick')!.index));
        this.emit(OP.br, ...encodeUleb128(0));
        this.labels.pop();
        this.emit(OP.end);
        this.labels.pop();
        this.emit(OP.end);
        this.popScope();
        break;
      }

      case 'switch': {
        this.emit(OP.block, 0x40);
        this.labels.push({ kind: 'block', tag: 'break' });
        // Lower switch sequentially to if-blocks sharing the outer $break label
        const st = this.emitExpr(s.expr);
        this.convertType(st, { kind: 'int', unsigned: false });
        this.emit(OP.local_set, ...encodeUleb128(this.scratchI32B));

        let fallthroughFlagOffset = -1;
        if (s.cases.length > 1) {
          fallthroughFlagOffset = this.nextFrameOffset;
          this.nextFrameOffset += 4;
          this.emit(OP.local_get, ...encodeUleb128(this.fpLocal));
          if (fallthroughFlagOffset !== 0) {
            this.emitI32Const(fallthroughFlagOffset);
            this.emit(OP.i32_add);
          }
          this.emitI32Const(0);
          this.emit(OP.i32_store, 0x02, 0x00);
        }

        for (const c of s.cases) {
          if (c.value !== null) {
            if (fallthroughFlagOffset >= 0) {
              this.emit(OP.local_get, ...encodeUleb128(this.fpLocal));
              if (fallthroughFlagOffset !== 0) {
                this.emitI32Const(fallthroughFlagOffset);
                this.emit(OP.i32_add);
              }
              this.emit(OP.i32_load, 0x02, 0x00);
            } else {
              this.emitI32Const(0);
            }
            this.emit(OP.local_get, ...encodeUleb128(this.scratchI32B));
            const vt = this.emitExpr(c.value);
            this.convertType(vt, { kind: 'int', unsigned: false });
            this.emit(OP.i32_eq);
            this.emit(OP.i32_or);
          } else {
            this.emitI32Const(1);
          }

          this.emit(OP.if, 0x40);
          this.labels.push({ kind: 'if' });
          if (fallthroughFlagOffset >= 0) {
            this.emit(OP.local_get, ...encodeUleb128(this.fpLocal));
            if (fallthroughFlagOffset !== 0) {
              this.emitI32Const(fallthroughFlagOffset);
              this.emit(OP.i32_add);
            }
            this.emitI32Const(1);
            this.emit(OP.i32_store, 0x02, 0x00);
          }
          for (const stItem of c.stmts) {
            this.emitStmt(stItem);
          }
          this.labels.pop();
          this.emit(OP.end);
        }
        this.labels.pop();
        this.emit(OP.end);
        break;
      }

      case 'break': {
        for (let i = this.labels.length - 1; i >= 0; i--) {
          if (this.labels[i].tag === 'break') {
            const depth = this.labels.length - 1 - i;
            this.emit(OP.br, ...encodeUleb128(depth));
            return;
          }
        }
        throw syntaxErr("'break' statement not within loop or switch", s.line);
      }

      case 'continue': {
        for (let i = this.labels.length - 1; i >= 0; i--) {
          if (this.labels[i].tag === 'continue') {
            const depth = this.labels.length - 1 - i;
            this.emit(OP.br, ...encodeUleb128(depth));
            return;
          }
        }
        throw syntaxErr("'continue' statement not within a loop", s.line);
      }

      case 'return': {
        if (s.expr) {
          const t = this.emitExpr(s.expr);
          this.convertType(t, this.funcDef.returnType);
        } else if (this.funcDef.returnType.kind !== 'void') {
          const w = toWasmValType(this.funcDef.returnType);
          if (w === WASM_F64) this.emitF64Const(0);
          else if (w === WASM_I64) this.emitI64Const(BigInt(0));
          else this.emitI32Const(0);
        }
        // Restore __sp = fpLocal + alignedFrameSize (via saved old __sp or fpLocal + frameSize)
        // We emit a placeholder marker or restore via local epilogue trick:
        // Wait: __sp was bumped DOWN by frameSize at entry, so restoring __sp = fpLocal + frameSize!
        // Since frameSize is known only after body emits, we record patch slots or store old SP at entry!
        // Storing `oldSP` in `savedSpLocal` is O(1) and needs ZERO binary patching!
        this.emit(OP.local_get, ...encodeUleb128(this.savedSpLocal));
        this.emit(OP.global_set, ...encodeUleb128(0));
        this.emit(OP.return);
        break;
      }
    }
  }

  private savedSpLocal = 0;

  public compile(): number[] {
    const paramCount = this.funcDef.params.length;
    this.savedSpLocal = paramCount;
    this.fpLocal = paramCount + 1;
    this.scratchI32A = paramCount + 2;
    this.scratchI32B = paramCount + 3;
    this.scratchI64 = paramCount + 4;
    this.scratchF64 = paramCount + 5;

    this.pushScope();

    // Reserve parameter slots in linear stack frame so `&param` works cleanly!
    const paramCopyCode: number[] = [];
    for (let i = 0; i < paramCount; i++) {
      const p = this.funcDef.params[i];
      const slot = this.allocFrameSlot(p.name, p.type);
      paramCopyCode.push(OP.local_get, ...encodeUleb128(this.fpLocal));
      if (slot.frameOffset !== 0) {
        paramCopyCode.push(OP.i32_const, ...encodeSleb128(slot.frameOffset), OP.i32_add);
      }
      paramCopyCode.push(OP.local_get, ...encodeUleb128(i));
      if (p.type.kind === 'char' || p.type.kind === 'bool') {
        paramCopyCode.push(OP.i32_store8, 0x00, 0x00);
      } else if (p.type.kind === 'short') {
        paramCopyCode.push(OP.i32_store16, 0x01, 0x00);
      } else if (p.type.kind === 'longlong') {
        paramCopyCode.push(OP.i64_store, 0x03, 0x00);
      } else if (p.type.kind === 'double') {
        paramCopyCode.push(OP.f64_store, 0x03, 0x00);
      } else {
        paramCopyCode.push(OP.i32_store, 0x02, 0x00);
      }
    }

    // Emit body (accumulates `this.nextFrameOffset`)
    this.emitStmt(this.funcDef.body);
    this.popScope();

    const frameSize = Math.max(16, Math.ceil(this.nextFrameOffset / 16) * 16);

    // Prologue
    const prologue: number[] = [
      OP.global_get, ...encodeUleb128(0),
      OP.local_tee, ...encodeUleb128(this.savedSpLocal),
      OP.i32_const, ...encodeSleb128(frameSize),
      OP.i32_sub,
      OP.local_tee, ...encodeUleb128(this.fpLocal),
      OP.global_set, ...encodeUleb128(0),
      ...paramCopyCode,
    ];

    // Epilogue (restore __sp and default return value if falling off end)
    const epilogue: number[] = [
      OP.local_get, ...encodeUleb128(this.savedSpLocal),
      OP.global_set, ...encodeUleb128(0),
    ];
    if (this.funcDef.returnType.kind !== 'void') {
      const w = toWasmValType(this.funcDef.returnType);
      if (w === WASM_F64) epilogue.push(OP.f64_const, ...encodeF64(0));
      else if (w === WASM_I64) epilogue.push(OP.i64_const, ...encodeBigIntSleb128(BigInt(0)));
      else epilogue.push(OP.i32_const, ...encodeSleb128(0));
    }
    epilogue.push(OP.end);

    // Locals declaration:
    // 4 i32 locals: savedSpLocal, fpLocal, scratchI32A, scratchI32B
    // 1 i64 local: scratchI64
    // 1 f64 local: scratchF64
    const localsDecl = [
      ...encodeUleb128(3), // 3 local groups
      ...encodeUleb128(4), WASM_I32,
      ...encodeUleb128(1), WASM_I64,
      ...encodeUleb128(1), WASM_F64,
    ];

    const bodyBytes = [...localsDecl, ...prologue, ...this.code, ...epilogue];
    return [...encodeUleb128(bodyBytes.length), ...bodyBytes];
  }
}

// ============================================================================
// 7. Public Compiler Entry Point
// ============================================================================

export function compileCToWasm(sourceCode: string): WasmCompileMetadata {
  const tokens = preprocessAndTokenize(sourceCode);
  const parser = new CParser(tokens);
  parser.parseProgram();

  if (!parser.functions.some((f) => f.name === 'main')) {
    throw syntaxErr("Program must define an entry point 'int main(void)' or 'int main()'.");
  }

  // Build Data Section (`.rodata`)
  const rodataBytes: number[] = [];
  const stringPool = new Map<string, number>();

  const allocString = (str: string): number => {
    const existing = stringPool.get(str);
    if (existing !== undefined) return existing;
    const addr = RODATA_BASE + rodataBytes.length;
    const utf8 = Array.from(new TextEncoder().encode(str));
    rodataBytes.push(...utf8, 0);
    // Align to 4 bytes
    while (rodataBytes.length % 4 !== 0) rodataBytes.push(0);
    stringPool.set(str, addr);
    return addr;
  };

  // Reserve static global variables in `.rodata`/data region cleanly
  const globalMap = new Map<string, { addr: number; type: CType }>();
  for (const g of parser.globals) {
    const size = Math.max(4, parser.sizeofType(g.type));
    const addr = RODATA_BASE + rodataBytes.length;
    for (let b = 0; b < size; b++) rodataBytes.push(0);
    while (rodataBytes.length % 4 !== 0) rodataBytes.push(0);
    globalMap.set(g.name, { addr, type: g.type });
  }

  // Check `.rodata` fits before HEAP_BASE
  if (RODATA_BASE + rodataBytes.length >= HEAP_BASE) {
    throw syntaxErr('Static string/data section exceeds 15KB limit.');
  }

  // Deduplicate function signatures for WASM Type section
  interface Sig {
    params: number[];
    results: number[];
  }
  const types: Sig[] = [];
  const sigKey = (p: number[], r: number[]) => `${p.join(',')}->${r.join(',')}`;
  const sigMap = new Map<string, number>();
  const internType = (params: number[], results: number[]): number => {
    const k = sigKey(params, results);
    const existing = sigMap.get(k);
    if (existing !== undefined) return existing;
    const idx = types.length;
    types.push({ params, results });
    sigMap.set(k, idx);
    return idx;
  };

  const hostMap = new Map<string, { index: number; spec: HostImportSpec }>();
  const importEntries: number[] = [];
  let nextFuncIdx = 0;

  // Memory import: env.memory (initial 4 pages = 256KB, max 256 pages = 16MB)
  importEntries.push(
    ...encodeUtf8('env'),
    ...encodeUtf8('memory'),
    0x02, // memory import kind
    0x01, // has maximum flag
    ...encodeUleb128(4),
    ...encodeUleb128(256)
  );

  for (const spec of HOST_IMPORTS) {
    const typeIdx = internType(spec.params, spec.results);
    hostMap.set(spec.name, { index: nextFuncIdx++, spec });
    importEntries.push(
      ...encodeUtf8('env'),
      ...encodeUtf8(spec.name),
      0x00, // function import kind
      ...encodeUleb128(typeIdx)
    );
  }

  // Register user functions
  const funcMap = new Map<string, { index: number; def: FuncDef }>();
  const funcTypeIndices: number[] = [];

  for (const fn of parser.functions) {
    const params = fn.params.map((p) => toWasmValType(p.type) || WASM_I32);
    const ret = toWasmValType(fn.returnType);
    const results = ret === null ? [] : [ret];
    const typeIdx = internType(params, results);
    funcTypeIndices.push(typeIdx);
    funcMap.set(fn.name, { index: nextFuncIdx++, def: fn });
  }

  // Compile all user function bodies
  const compiledBodies: number[][] = [];
  for (const fn of parser.functions) {
    const compiler = new FuncCompiler(
      parser,
      funcMap,
      hostMap,
      globalMap,
      allocString,
      fn
    );
    compiledBodies.push(compiler.compile());
  }

  // Section 1: Type Section
  const typePayload: number[] = [...encodeUleb128(types.length)];
  for (const t of types) {
    typePayload.push(
      0x60,
      ...encodeUleb128(t.params.length), ...t.params,
      ...encodeUleb128(t.results.length), ...t.results
    );
  }

  // Section 2: Import Section (1 memory + HOST_IMPORTS.length functions)
  const importPayload: number[] = [
    ...encodeUleb128(1 + HOST_IMPORTS.length),
    ...importEntries,
  ];

  // Section 3: Function Section
  const funcPayload: number[] = [
    ...encodeUleb128(funcTypeIndices.length),
    ...funcTypeIndices.flatMap((idx) => encodeUleb128(idx)),
  ];

  // Section 6: Global Section (`__sp` mutable i32 = STACK_TOP)
  const globalPayload: number[] = [
    ...encodeUleb128(1),
    WASM_I32,
    0x01, // mutable
    OP.i32_const, ...encodeSleb128(STACK_TOP),
    OP.end,
  ];

  // Section 7: Export Section (`main`)
  const mainEntry = funcMap.get('main')!;
  const exportPayload: number[] = [
    ...encodeUleb128(1),
    ...encodeUtf8('main'),
    0x00,
    ...encodeUleb128(mainEntry.index),
  ];

  // Section 10: Code Section
  const codePayload: number[] = [
    ...encodeUleb128(compiledBodies.length),
    ...compiledBodies.flat(),
  ];

  // Section 11: Data Section (`.rodata` active segment at RODATA_BASE)
  const hasData = rodataBytes.length > 0;
  const dataPayload: number[] = hasData
    ? [
        ...encodeUleb128(1),
        0x00, // active memory 0
        OP.i32_const, ...encodeSleb128(RODATA_BASE),
        OP.end,
        ...encodeUleb128(rodataBytes.length),
        ...rodataBytes,
      ]
    : [...encodeUleb128(0)];

  const wasmArray = [
    0x00, 0x61, 0x73, 0x6d, // `\0asm`
    0x01, 0x00, 0x00, 0x00, // version 1
    ...makeSection(0x01, typePayload),
    ...makeSection(0x02, importPayload),
    ...makeSection(0x03, funcPayload),
    ...makeSection(0x06, globalPayload),
    ...makeSection(0x07, exportPayload),
    ...makeSection(0x0a, codePayload),
    ...(hasData ? makeSection(0x0b, dataPayload) : []),
  ];

  const wasmBytes = new Uint8Array(wasmArray);
  const hexHeader = Array.from(wasmBytes.slice(0, 32))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');

  return {
    wasmBytes,
    functions: parser.functions.map((f) => f.name),
    dataBytes: rodataBytes.length,
    totalBytes: wasmBytes.length,
    hexHeader,
    memoryLayout: {
      rodataStart: RODATA_BASE,
      heapStart: HEAP_BASE,
      stackTop: STACK_TOP,
    },
  };
}
