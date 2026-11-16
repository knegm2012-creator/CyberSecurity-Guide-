/**
 * Pure-Python stdlib shims & helpers preloaded into MicroPython WebAssembly VFS
 * so all CS Odyssey curriculum Python scripts (sqlite3, ipaddress, hashlib,
 * collections.Counter, re.findall, unittest, pathlib.Path.is_absolute, stdin)
 * execute cleanly 100% client-side in WebAssembly.
 */

export const PYTHON_WASM_PRELUDE = `
import sys
import io
import os
import builtins
import re as _orig_re
import collections as _orig_collections
import hashlib as _orig_hashlib
import hmac as _hmac
import pathlib as _orig_pathlib
import unittest as _orig_unittest

class _ModuleShim:
    def __init__(self, orig):
        for _attr in dir(orig):
            try:
                setattr(self, _attr, getattr(orig, _attr))
            except Exception:
                pass

try:
    os.mkdir('/lib')
except OSError:
    pass

if '/lib' not in sys.path:
    sys.path.insert(0, '/lib')

# 1. Interactive stdin / input() bridge
__CS_ODYSSEY_STDIN_LINES = []
__CS_ODYSSEY_STDIN_POS = 0

def __cs_odyssey_set_stdin(text):
    global __CS_ODYSSEY_STDIN_LINES, __CS_ODYSSEY_STDIN_POS
    __CS_ODYSSEY_STDIN_LINES = text.splitlines() if text else []
    __CS_ODYSSEY_STDIN_POS = 0
    try:
        sys.stdin = io.StringIO(text or "")
    except AttributeError:
        _sys_mod = _ModuleShim(sys)
        _sys_mod.stdin = io.StringIO(text or "")
        sys.modules['sys'] = _sys_mod

def __cs_odyssey_input(prompt=""):
    global __CS_ODYSSEY_STDIN_POS
    if prompt:
        sys.stdout.write(str(prompt))
    if __CS_ODYSSEY_STDIN_POS >= len(__CS_ODYSSEY_STDIN_LINES):
        raise EOFError("EOF when reading a line")
    line = __CS_ODYSSEY_STDIN_LINES[__CS_ODYSSEY_STDIN_POS]
    __CS_ODYSSEY_STDIN_POS += 1
    if prompt:
        sys.stdout.write(line + "\\n")
    return line

builtins.input = __cs_odyssey_input

# 2. collections wrapper with Counter
class Counter(dict):
    def __init__(self, iterable=None, **kw):
        super().__init__()
        self.update(iterable, **kw)

    def __missing__(self, key):
        return 0

    def update(self, iterable=None, **kw):
        if iterable is not None:
            if isinstance(iterable, dict):
                for k, v in iterable.items():
                    self[k] = self.get(k, 0) + v
            else:
                for item in iterable:
                    self[item] = self.get(item, 0) + 1
        for k, v in kw.items():
            self[k] = self.get(k, 0) + v

    def most_common(self, n=None):
        items = sorted(self.items(), key=lambda kv: (-kv[1], kv[0]))
        return items if n is None else items[:n]

_collections_mod = _ModuleShim(_orig_collections)
_collections_mod.Counter = Counter
sys.modules['collections'] = _collections_mod

# 3. re wrapper with findall
_re_mod = _ModuleShim(_orig_re)

def _re_findall(pattern, string):
    rx = _orig_re.compile(pattern)
    results = []
    pos = 0
    while pos <= len(string):
        m = rx.search(string, pos)
        if not m:
            break
        groups = []
        i = 1
        while True:
            try:
                groups.append(m.group(i))
                i += 1
            except IndexError:
                break
        if len(groups) == 0:
            results.append(m.group(0))
        elif len(groups) == 1:
            results.append(groups[0])
        else:
            results.append(tuple(groups))
        matched = m.group(0)
        found_at = string.find(matched, pos)
        pos = (found_at + len(matched)) if (found_at >= 0 and len(matched) > 0) else (pos + 1)
    return results

_re_mod.findall = _re_findall
sys.modules['re'] = _re_mod

# 4. pathlib wrapper adding full Path class with .is_absolute(), .name, .suffix, .parent, /
class Path:
    def __init__(self, *parts):
        if not parts:
            self._path = '.'
        else:
            joined = '/'.join(str(p) for p in parts if str(p))
            while '//' in joined:
                joined = joined.replace('//', '/')
            if len(joined) > 1 and joined.endswith('/'):
                joined = joined[:-1]
            self._path = joined or '/'

    def __truediv__(self, other):
        other_str = str(other).lstrip('/')
        if self._path == '/':
            return Path('/' + other_str)
        if self._path == '.':
            return Path(other_str)
        return Path(self._path + '/' + other_str)

    @property
    def name(self):
        if self._path in ('/', '.', '..'):
            return ''
        return self._path.rsplit('/', 1)[-1]

    @property
    def suffix(self):
        nm = self.name
        dot = nm.rfind('.')
        if dot <= 0:
            return ''
        return nm[dot:]

    @property
    def parent(self):
        if '/' not in self._path:
            return Path('.')
        head = self._path.rsplit('/', 1)[0]
        return Path(head or '/')

    def is_absolute(self):
        return self._path.startswith('/')

    def __str__(self):
        return self._path

    def __repr__(self):
        return f"PosixPath('{self._path}')"

_pathlib_mod = _ModuleShim(_orig_pathlib)
_pathlib_mod.Path = Path
sys.modules['pathlib'] = _pathlib_mod

# 5. hashlib wrapper with .hexdigest() and fast host-assisted pbkdf2_hmac
class _HashWrapper:
    def __init__(self, h):
        self._h = h
    def update(self, data):
        return self._h.update(data)
    def digest(self):
        return self._h.digest()
    def hexdigest(self):
        return self._h.digest().hex()

_hashlib_mod = _ModuleShim(_orig_hashlib)

_raw_sha256 = getattr(_orig_hashlib, 'sha256', None)
if _raw_sha256 is not None:
    _hashlib_mod.sha256 = lambda data=b'': _HashWrapper(_raw_sha256(data))

_raw_sha1 = getattr(_orig_hashlib, 'sha1', None)
if _raw_sha1 is not None:
    _hashlib_mod.sha1 = lambda data=b'': _HashWrapper(_raw_sha1(data))

def _pbkdf2_hmac(hash_name, password, salt, iterations, dklen=None):
    if isinstance(password, str):
        password = password.encode('utf-8')
    if isinstance(salt, str):
        salt = salt.encode('utf-8')
    try:
        import js as _js
        host = getattr(_js, '__csOdysseyWasmHost', None)
        if host is not None:
            raw_hex = host.pbkdf2Hex(hash_name, list(password), list(salt), int(iterations), int(dklen or 32))
            return bytes.fromhex(raw_hex)
    except Exception:
        pass
    hash_fn = _raw_sha256 if hash_name == 'sha256' else _raw_sha1
    hlen = 32 if hash_name == 'sha256' else 20
    dklen = dklen or hlen
    def _prf(k, msg):
        return _hmac.new(k, msg, hash_fn).digest()
    out = b''
    block_idx = 1
    while len(out) < dklen:
        u = _prf(password, salt + block_idx.to_bytes(4, 'big'))
        acc = bytearray(u)
        for _ in range(1, iterations):
            u = _prf(password, u)
            for j in range(len(acc)):
                acc[j] ^= u[j]
        out += bytes(acc)
        block_idx += 1
    return out[:dklen]

_hashlib_mod.pbkdf2_hmac = _pbkdf2_hmac
sys.modules['hashlib'] = _hashlib_mod

# 6. unittest wrapper adding defaultTestLoader & TextTestRunner(verbosity=...)
_unittest_mod = _ModuleShim(_orig_unittest)

if not hasattr(_unittest_mod, 'defaultTestLoader'):
    class _DefaultTestLoader:
        def loadTestsFromTestCase(self, cls):
            suite = _orig_unittest.TestSuite()
            suite.addTest(cls())
            return suite
    _unittest_mod.defaultTestLoader = _DefaultTestLoader()

_OrigTextTestRunner = getattr(_orig_unittest, 'TextTestRunner', None)
_OrigTestRunner = getattr(_orig_unittest, 'TestRunner', None)
class _CompatTextTestRunner:
    def __init__(self, verbosity=1):
        self.verbosity = verbosity
    def run(self, suite):
        runner = _OrigTextTestRunner() if _OrigTextTestRunner is not None else _OrigTestRunner()
        res = runner.run(suite)
        if not hasattr(res, 'wasSuccessful'):
            res.wasSuccessful = lambda: (len(getattr(res, 'failures', [])) == 0 and len(getattr(res, 'errors', [])) == 0)
        return res

_unittest_mod.TextTestRunner = _CompatTextTestRunner
sys.modules['unittest'] = _unittest_mod

# 7. ipaddress module -> /lib/ipaddress.py
with open('/lib/ipaddress.py', 'w') as f:
    f.write("""
class IPv4Address:
    def __init__(self, addr):
        if isinstance(addr, int):
            self._int = addr & 0xFFFFFFFF
        else:
            parts = str(addr).split('.')
            if len(parts) != 4:
                raise ValueError('Invalid IPv4 address')
            val = 0
            for p in parts:
                n = int(p)
                if n < 0 or n > 255:
                    raise ValueError('Octet out of range')
                val = (val << 8) | n
            self._int = val

    def __int__(self):
        return self._int

    def __str__(self):
        return '.'.join(str((self._int >> shift) & 0xFF) for shift in (24, 16, 8, 0))

    def __repr__(self):
        return f"IPv4Address('{self}')"

class IPv4Network:
    def __init__(self, cidr, strict=False):
        ip_str, prefix_str = str(cidr).split('/')
        prefix = int(prefix_str)
        mask = (0xFFFFFFFF << (32 - prefix)) & 0xFFFFFFFF if prefix > 0 else 0
        ip_int = int(IPv4Address(ip_str))
        net_int = ip_int & mask
        bcast_int = net_int | (~mask & 0xFFFFFFFF)
        self.prefixlen = prefix
        self.network_address = IPv4Address(net_int)
        self.broadcast_address = IPv4Address(bcast_int)
        self.netmask = IPv4Address(mask)

    def hosts(self):
        start = int(self.network_address) + 1
        end = int(self.broadcast_address)
        for addr in range(start, end):
            yield IPv4Address(addr)

    def __str__(self):
        return f"{self.network_address}/{self.prefixlen}"

class IPv4Interface:
    def __init__(self, cidr):
        ip_str, prefix_str = str(cidr).split('/')
        self.ip = IPv4Address(ip_str)
        self.network = IPv4Network(cidr, strict=False)
""")

# 8. sqlite3 in-memory SQL subset -> /lib/sqlite3.py (no re.I needed for MicroPython!)
with open('/lib/sqlite3.py', 'w') as f:
    f.write("""
import re

def _split_csv(s):
    items, cur, in_q, q_ch, depth = [], '', False, '', 0
    for ch in s:
        if in_q:
            cur += ch
            if ch == q_ch:
                in_q = False
        elif ch in ("'", '"'):
            in_q = True
            q_ch = ch
            cur += ch
        elif ch == '(':
            depth += 1
            cur += ch
        elif ch == ')':
            depth -= 1
            cur += ch
        elif ch == ',' and depth == 0:
            items.append(cur.strip())
            cur = ''
        else:
            cur += ch
    if cur.strip():
        items.append(cur.strip())
    return items

def _parse_lit(tok):
    tok = tok.strip()
    if (tok.startswith("'") and tok.endswith("'")) or (tok.startswith('"') and tok.endswith('"')):
        return tok[1:-1]
    if tok.upper() == 'NULL':
        return None
    try:
        return int(tok)
    except ValueError:
        try:
            return float(tok)
        except ValueError:
            return tok

def _lower_keywords(sql):
    # Lowercase SQL outside quoted string literals so regex stays case-exact while keeping literal values intact
    out = []
    in_q = False
    q_ch = ''
    for ch in sql:
        if in_q:
            out.append(ch)
            if ch == q_ch:
                in_q = False
        elif ch in ("'", '"'):
            in_q = True
            q_ch = ch
            out.append(ch)
        else:
            out.append(ch.lower())
    return ''.join(out)

class Cursor:
    def __init__(self, conn):
        self._conn = conn
        self._rows = []

    def execute(self, sql, params=()):
        self._rows = self._conn._exec_one(sql, params)
        return self

    def executescript(self, script):
        for stmt in script.split(';'):
            s = stmt.strip()
            if s:
                self._conn._exec_one(s, ())
        return self

    def fetchall(self):
        return list(self._rows)

    def fetchone(self):
        return self._rows[0] if self._rows else None

class Connection:
    def __init__(self):
        self._tables = {}

    def cursor(self):
        return Cursor(self)

    def execute(self, sql, params=()):
        return Cursor(self).execute(sql, params)

    def executescript(self, script):
        return Cursor(self).executescript(script)

    def _exec_one(self, sql, params):
        clean = ' '.join(sql.strip().rstrip(';').split())
        low = _lower_keywords(clean)

        if low.startswith('create table'):
            m = re.match(r'^create\\s+table\\s+([a-z0-9_]+)\\s*\\((.*)\\)$', low)
            if not m:
                return []
            tname = m.group(1)
            cols = []
            for part in _split_csv(m.group(2)):
                head = part.split()[0]
                if head in ('foreign', 'primary', 'unique', 'check', 'constraint'):
                    continue
                cols.append(head)
            self._tables[tname] = {'cols': cols, 'rows': []}
            return []

        if low.startswith('insert into'):
            m = re.match(r'^insert\\s+into\\s+([a-z0-9_]+)\\s+values\\s*(.*)$', low)
            if not m:
                return []
            tname = m.group(1)
            tbl = self._tables[tname]
            vals_blob = m.group(2).strip()
            # Preserve case of original string literals via clean slice
            orig_m = re.search(r'\\bvalues\\b', low)
            if orig_m:
                v_idx = low.find(orig_m.group(0))
                orig_vals_blob = clean[v_idx + len(orig_m.group(0)):].strip()
            else:
                orig_vals_blob = vals_blob
            tuples = []
            cur, depth, in_q = '', 0, False
            for ch in orig_vals_blob:
                if ch == "'":
                    in_q = not in_q
                if not in_q and ch == '(':
                    if depth == 0:
                        cur = ''
                    else:
                        cur += ch
                    depth += 1
                elif not in_q and ch == ')':
                    depth -= 1
                    if depth == 0:
                        tuples.append(cur)
                    else:
                        cur += ch
                elif depth > 0:
                    cur += ch
            p_idx = 0
            for tup in tuples:
                parsed = []
                for tok in _split_csv(tup):
                    if tok == '?' and p_idx < len(params):
                        parsed.append(params[p_idx])
                        p_idx += 1
                    else:
                        parsed.append(_parse_lit(tok))
                row = {}
                for idx, col in enumerate(tbl['cols']):
                    row[col] = parsed[idx] if idx < len(parsed) else None
                tbl['rows'].append(row)
            return []

        if low.startswith('select'):
            # Split clauses cleanly using string scanning on lowercased SQL
            rest = low[6:].strip()
            def _find_kw(text, kw):
                m_kw = re.search(r'\\s+' + kw + r'\\s+', text)
                if not m_kw:
                    return None
                matched = m_kw.group(0)
                idx = text.find(matched)
                return (idx, idx + len(matched)) if idx >= 0 else None

            from_pos = _find_kw(rest, 'from')
            if not from_pos:
                return []
            sel_str = rest[:from_pos[0]].strip()
            after_from = rest[from_pos[1]:].strip()

            group_col = None
            gb_pos = _find_kw(after_from, 'group\\s+by')
            if gb_pos:
                group_col = after_from[gb_pos[1]:].strip().split()[0]
                after_from = after_from[:gb_pos[0]].strip()

            where_str = None
            wh_pos = _find_kw(after_from, 'where')
            if wh_pos:
                where_str = after_from[wh_pos[1]:].strip()
                after_from = after_from[:wh_pos[0]].strip()

            t2 = None
            a2 = None
            on_l = None
            on_r = None
            jn_pos = _find_kw(after_from, 'join')
            if jn_pos:
                t1_part = after_from[:jn_pos[0]].strip().split()
                t1 = t1_part[0]
                a1 = t1_part[1] if len(t1_part) > 1 else t1
                join_rest = after_from[jn_pos[1]:].strip()
                on_pos = _find_kw(join_rest, 'on')
                if not on_pos:
                    return []
                t2_part = join_rest[:on_pos[0]].strip().split()
                t2 = t2_part[0]
                a2 = t2_part[1] if len(t2_part) > 1 else t2
                on_clause = join_rest[on_pos[1]:].strip()
                on_parts = [x.strip() for x in on_clause.split('=')]
                on_l, on_r = on_parts[0], on_parts[1]
            else:
                t1_part = after_from.split()
                t1 = t1_part[0]
                a1 = t1_part[1] if len(t1_part) > 1 else t1

            combined = []
            for r1 in self._tables[t1]['rows']:
                base = {f'{a1}.{k}': v for k, v in r1.items()}
                for k, v in r1.items():
                    base[k] = v
                if t2:
                    for r2 in self._tables[t2]['rows']:
                        merged = dict(base)
                        for k, v in r2.items():
                            merged[f'{a2}.{k}'] = v
                            if k not in merged:
                                merged[k] = v
                        if merged.get(on_l) == merged.get(on_r):
                            combined.append(merged)
                else:
                    combined.append(base)

            if where_str:
                wm = re.match(r'^([a-z0-9_\\.]+)\\s*=\\s*(.*)$', where_str.strip())
                if wm:
                    w_col, w_val_tok = wm.group(1), wm.group(2).strip()
                    w_val = params[0] if w_val_tok == '?' else _parse_lit(w_val_tok)
                    combined = [r for r in combined if r.get(w_col) == w_val]

            sel_items = _split_csv(sel_str)
            if group_col:
                groups = {}
                for r in combined:
                    key = r.get(group_col)
                    groups.setdefault(key, []).append(r)
                out = []
                for key, grp in groups.items():
                    row_out = []
                    for item in sel_items:
                        as_m = re.search(r'\\s+as\\s+[a-z0-9_]+$', item)
                        item_clean = item[:len(item) - len(as_m.group(0))].strip() if as_m else item.strip()
                        if item_clean.startswith('count('):
                            row_out.append(len(grp))
                        else:
                            row_out.append(grp[0].get(item_clean))
                    out.append(tuple(row_out))
                return out

            out = []
            for r in combined:
                if sel_items == ['*']:
                    out.append(tuple(r.values()))
                else:
                    row_out = []
                    for item in sel_items:
                        as_m = re.search(r'\\s+as\\s+[a-z0-9_]+$', item)
                        item_clean = item[:len(item) - len(as_m.group(0))].strip() if as_m else item.strip()
                        if item_clean.startswith('count('):
                            row_out.append(len(combined))
                        else:
                            row_out.append(r.get(item_clean))
                    out.append(tuple(row_out))
            return out

        return []

def connect(database):
    return Connection()
""")
`;
