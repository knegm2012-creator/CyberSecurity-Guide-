'use client';

import React, { useState, useMemo } from 'react';
import { Copy, Check, X, BookOpen, Terminal } from 'lucide-react';
import { SoapBubbleSearch } from '@/components/soap-bubble';

export interface CheatSheetEntry {
  id: string;
  name: string;
  syntax: string;
  category: 'Linux' | 'Pipes' | 'Security' | 'Git' | 'C' | 'Python' | 'Network' | 'Wargame';
  description: string;
  example: string;
  tags: string[];
}

export const CHEAT_SHEET_DATA: CheatSheetEntry[] = [
  {
    id: 'l-1',
    name: 'ls (List Directory)',
    syntax: 'ls -la [path]',
    category: 'Linux',
    description: 'List all files including hidden dotfiles in detailed long format with permissions, owner, and byte size.',
    example: 'ls -la /home/user',
    tags: ['list', 'hidden', 'files', 'permissions'],
  },
  {
    id: 'l-2',
    name: 'cat (Concatenate / View)',
    syntax: 'cat [--] <file>',
    category: 'Linux',
    description: 'Print file contents to stdout. For dashed filenames like "-file", use "cat ./-" or "cat -- -file".',
    example: 'cat ./-',
    tags: ['view', 'read', 'dashed', 'file'],
  },
  {
    id: 'l-3',
    name: 'find (Search Files by Criteria)',
    syntax: 'find [path] -type f -size [bytes]c ! -executable',
    category: 'Linux',
    description: 'Recursively search directory trees by file type, exact byte size, ownership, or permissions.',
    example: 'find . -type f -size 1033c ! -executable',
    tags: ['search', 'size', 'type', 'attributes'],
  },
  {
    id: 'l-4',
    name: 'file (Determine File Type)',
    syntax: 'file <file_or_glob>',
    category: 'Linux',
    description: 'Inspects magic bytes to identify true file type (ASCII text, gzip archive, ELF binary, etc.) regardless of extension.',
    example: 'file ./*',
    tags: ['magic', 'mime', 'binary', 'type'],
  },
  {
    id: 'l-5',
    name: 'chmod (Change Permissions)',
    syntax: 'chmod [octal] <file>',
    category: 'Linux',
    description: 'Set read (4), write (2), and execute (1) permissions for user, group, and others (e.g., 700 or 600).',
    example: 'chmod 600 ~/.ssh/id_rsa',
    tags: ['permissions', 'security', 'octal', 'access'],
  },
  {
    id: 'p-1',
    name: 'sort & uniq (Filter Unique Lines)',
    syntax: 'sort <file> | uniq -u',
    category: 'Pipes',
    description: 'uniq compares adjacent lines; sort first to group duplicates. -u outputs only lines occurring once.',
    example: 'sort data.txt | uniq -u',
    tags: ['pipeline', 'unique', 'frequency', 'dedup'],
  },
  {
    id: 'p-2',
    name: 'grep (Pattern Search)',
    syntax: 'grep -rnE "pattern" [dir]',
    category: 'Pipes',
    description: 'Recursively search files for regular expression patterns with line numbers (-n) and file paths (-r).',
    example: 'grep -rnE "password|flag" /etc/',
    tags: ['regex', 'search', 'filter', 'text'],
  },
  {
    id: 'p-3',
    name: 'tr (Translate / ROT13)',
    syntax: "tr 'A-Za-z' 'N-ZA-Mn-za-m'",
    category: 'Pipes',
    description: 'Translate or delete characters from stdin. Classic ROT13 Caesar shift rotates letters by 13 positions.',
    example: "cat data.txt | tr 'A-Za-z' 'N-ZA-Mn-za-m'",
    tags: ['rot13', 'caesar', 'cipher', 'substitution'],
  },
  {
    id: 'p-4',
    name: 'strings (Extract Printable Text)',
    syntax: 'strings -n [min_len] <binary_file>',
    category: 'Pipes',
    description: 'Scans binary executable or dump and prints human-readable strings of at least n characters.',
    example: 'strings data.txt | grep -E "====="',
    tags: ['binary', 'text', 'reverse-engineering'],
  },
  {
    id: 'p-5',
    name: 'xxd / hexdump (Hex Viewer & Reverse)',
    syntax: 'xxd -p <file> | xxd -r -p',
    category: 'Pipes',
    description: 'Creates a hex dump of a file or stdin. With -r, reverses hex back into raw binary.',
    example: 'xxd -r hexdump.txt binary_out',
    tags: ['hex', 'hexdump', 'binary', 'reverse'],
  },
  {
    id: 's-1',
    name: 'base64 (Encode & Decode)',
    syntax: 'base64 -d <file>',
    category: 'Security',
    description: 'Encodes or decodes standard Base64 data to/from binary or plaintext.',
    example: 'base64 -d data.txt',
    tags: ['base64', 'encoding', 'decode', 'crypto'],
  },
  {
    id: 's-2',
    name: 'openssl s_client (TLS Client)',
    syntax: 'openssl s_client -connect <host>:<port> -ign_eof',
    category: 'Security',
    description: 'Connects to a remote socket using an encrypted SSL/TLS tunnel.',
    example: 'openssl s_client -connect localhost:30001 -ign_eof',
    tags: ['tls', 'ssl', 'encryption', 'socket'],
  },
  {
    id: 's-3',
    name: 'nmap (Port Scanner)',
    syntax: 'nmap -sV -p [ports] <target>',
    category: 'Security',
    description: 'Network scanner that probes open TCP/UDP ports and identifies listening service versions.',
    example: 'nmap -p 31000-32000 localhost',
    tags: ['ports', 'network', 'recon', 'scan'],
  },
  {
    id: 's-4',
    name: 'sha256sum (Cryptographic Hash)',
    syntax: 'sha256sum <file>',
    category: 'Security',
    description: 'Computes 256-bit SHA-2 digest to verify file integrity and detect tampering.',
    example: 'sha256sum file.bin',
    tags: ['hash', 'sha256', 'integrity', 'crypto'],
  },
  {
    id: 'g-1',
    name: 'git commit (Record Snapshot)',
    syntax: 'git commit -m "feat: concise summary"',
    category: 'Git',
    description: 'Creates an immutable snapshot of staged changes linked to its parent commit.',
    example: 'git commit -m "feat(auth): add token validation"',
    tags: ['commit', 'snapshot', 'dag', 'history'],
  },
  {
    id: 'g-2',
    name: 'git switch -c (Create Branch)',
    syntax: 'git switch -c <new_branch>',
    category: 'Git',
    description: 'Creates and switches to a new branch pointer referencing the current commit.',
    example: 'git switch -c feature/sandbox',
    tags: ['branch', 'checkout', 'switch', 'pointers'],
  },
  {
    id: 'g-3',
    name: 'git rebase (Linear History)',
    syntax: 'git rebase <base_branch>',
    category: 'Git',
    description: 'Replays commits from your branch sequentially on top of another target branch.',
    example: 'git rebase main',
    tags: ['rebase', 'linear', 'history', 'clean'],
  },
  {
    id: 'g-4',
    name: 'git reset (Move Branch Pointer)',
    syntax: 'git reset HEAD~1',
    category: 'Git',
    description: 'Moves the branch pointer back by 1 commit while keeping edits in your working directory.',
    example: 'git reset HEAD~1',
    tags: ['reset', 'undo', 'rewind', 'head'],
  },
  {
    id: 'c-1',
    name: 'Pointers & Dereferencing (*, &)',
    syntax: 'int *p = &x; int val = *p;',
    category: 'C',
    description: '& yields a variable memory address; * declares a pointer or dereferences the address value.',
    example: 'int a = 42;\nint *ptr = &a;\nprintf("%d at %p\\n", *ptr, (void*)ptr);',
    tags: ['pointers', 'memory', 'addresses', 'c'],
  },
  {
    id: 'c-2',
    name: 'Dynamic Memory (malloc / free)',
    syntax: 'int *arr = malloc(n * sizeof(int)); free(arr);',
    category: 'C',
    description: 'Allocates contiguous bytes on the heap; always pair with free() to prevent leaks.',
    example: 'char *buf = malloc(1024);\nif (buf) { free(buf); buf = NULL; }',
    tags: ['heap', 'malloc', 'free', 'memory-leak'],
  },
  {
    id: 'c-3',
    name: 'GCC Hardened Compilation',
    syntax: 'gcc -O2 -Wall -Wextra -std=c11 main.c -o main.out',
    category: 'C',
    description: 'Compiles C source with strict warnings (-Wall -Wextra), optimization (-O2), and ISO C11.',
    example: 'gcc -Wall -Wextra -std=c11 main.c -o app',
    tags: ['compile', 'gcc', 'warnings', 'binary'],
  },
  {
    id: 'py-1',
    name: 'List Comprehensions',
    syntax: '[x*2 for x in items if x % 2 == 0]',
    category: 'Python',
    description: 'Idiomatic expression for mapping and filtering sequences cleanly.',
    example: 'evens = [x for x in range(20) if x % 2 == 0]',
    tags: ['comprehension', 'generator', 'pythonic'],
  },
  {
    id: 'py-2',
    name: 'Context Managers (with)',
    syntax: 'with open("file.txt", "r") as f: data = f.read()',
    category: 'Python',
    description: 'Guarantees deterministic cleanup and file descriptor closure even on exceptions.',
    example: 'with open("log.txt", "a") as f:\n    f.write("entry\\n")',
    tags: ['io', 'context-manager', 'clean', 'files'],
  },
  {
    id: 'w-1',
    name: 'Spaces in Filenames',
    syntax: 'cat "spaces in this filename"',
    category: 'Wargame',
    description: 'Quote filenames containing whitespace or escape spaces with backslashes.',
    example: 'cat "spaces in this filename"',
    tags: ['quotes', 'escape', 'spaces', 'filenames'],
  },
  {
    id: 'w-2',
    name: 'Leading Dash Filenames',
    syntax: 'cat ./- OR cat -- -file',
    category: 'Wargame',
    description: 'Prefix with ./ or pass -- so CLI utilities do not treat leading dashes as option flags.',
    example: 'cat ./-',
    tags: ['dash', 'flags', 'tricky', 'filenames'],
  },
  {
    id: 'w-3',
    name: 'Multilayer Decompression',
    syntax: 'tar -xvf / gzip -d / bzip2 -d',
    category: 'Wargame',
    description: 'Inspect format with "file", rename extension if needed, and decompress iteratively.',
    example: 'file archive.bin && mv archive.bin arch.gz && gzip -d arch.gz',
    tags: ['tar', 'gzip', 'bzip2', 'compression'],
  },
];

interface CheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCommand?: (cmd: string) => void;
}

export function CheatSheetModal({ isOpen, onClose, onInsertCommand }: CheatSheetModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['All', 'Linux', 'Pipes', 'Security', 'Git', 'C', 'Python', 'Wargame'];

  const filteredEntries = useMemo(() => {
    return CHEAT_SHEET_DATA.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.syntax.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03050b]/80 backdrop-blur-md">
      <div className="optical-panel relative w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl border-white/[0.12] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#040710]/65">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-4 w-4 text-cyan-400" />
            <div>
              <h2 className="font-display text-sm font-semibold text-white">
                Master Syntax Cheat Sheet
              </h2>
              <p className="text-xs text-slate-400">
                Linux, pipelines, security tools, Git, C memory, and Python reference
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 border-b border-white/[0.08] bg-[#040710]/45 space-y-3">
          <SoapBubbleSearch
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search syntax, commands, flags, or topics..."
            style={{ fontSize: 12 }}
          />

          <div className="optical-subnav flex items-center gap-1 p-1 rounded-xl overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const count =
                cat === 'All'
                  ? CHEAT_SHEET_DATA.length
                  : CHEAT_SHEET_DATA.filter((d) => d.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-cyan-500/18 border-cyan-400/35 text-cyan-200 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat} <span className="opacity-70 font-mono text-[10px] tabular-nums">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 divide-y divide-white/[0.07]">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              No matches for &quot;{search}&quot;
            </div>
          ) : (
            filteredEntries.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-display text-sm font-semibold text-white">
                        {item.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 uppercase">
                        · {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 font-mono">
                    <button
                      onClick={() => handleCopy(item.id, item.syntax)}
                      className="px-2.5 py-1 rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {onInsertCommand && (
                      <button
                        onClick={() => {
                          onInsertCommand(item.example || item.syntax);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg border border-cyan-400/35 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Terminal className="h-3 w-3" />
                        <span>Run</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="optical-inset rounded-xl p-3 font-mono text-xs space-y-1">
                  <div>
                    <span className="text-slate-500 select-none mr-2">syntax </span>
                    <code className="text-cyan-300">{item.syntax}</code>
                  </div>
                  <div>
                    <span className="text-slate-500 select-none mr-2">ex     </span>
                    <code className="text-emerald-400">{item.example}</code>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
