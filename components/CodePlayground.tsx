'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  Download,
  Copy,
  Check,
  Save,
  Trash2,
  FolderOpen,
  Code2,
  FileCode,
  Terminal,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  ChevronDown,
  ChevronRight,
  Plus,
  BookOpen,
} from 'lucide-react';
import { SavedCodeSnippet } from '@/hooks/use-odyssey-store';

export interface CodePlaygroundProps {
  initialLanguage?: 'python' | 'c';
  initialCode?: string;
  onOpenAiMentor?: (prompt?: string) => void;
  savedSnippets?: SavedCodeSnippet[];
  onSaveSnippet?: (snippet: { title: string; language: 'python' | 'c'; code: string; tags?: string[] }) => void;
  onDeleteSnippet?: (id: string) => void;
}

interface CodeTemplate {
  id: string;
  name: string;
  language: 'python' | 'c';
  category: string;
  description: string;
  code: string;
  sampleStdin?: string;
}

const STARTER_TEMPLATES: CodeTemplate[] = [
  // PYTHON TEMPLATES
  {
    id: 'py-basics',
    name: '1. Variables & Types (Python)',
    language: 'python',
    category: 'Basics',
    description: 'Dynamic typing, integers, floats, strings, and formatted printing.',
    code: `# Python Basics: Variables, Types & Formatted Output
name = "Alex"
age = 15
target_hours = 10.5
is_enrolled = True

print(f"=== CS Odyssey Student Profile ===")
print(f"Student: {name} | Age: {age}")
print(f"Weekly Study Goal: {target_hours} hrs | Enrolled: {is_enrolled}")
print(f"Types: age is {type(age).__name__}, target_hours is {type(target_hours).__name__}")

# Dynamic type arithmetic
daily_hours = target_hours / 7
print(f"Daily Commitment: {daily_hours:.2f} hours per day")
`,
  },
  {
    id: 'py-control-flow',
    name: '2. Control Flow & Loops (Python)',
    language: 'python',
    category: 'Basics',
    description: 'If/else conditional branching and counting loops with range.',
    code: `# Python Control Flow: Decisions & Iteration
scores = [85, 92, 78, 99, 64, 88]

print("--- Iterating Through Scores ---")
for i, score in enumerate(scores, 1):
    if score >= 90:
        grade = "A (Mastery)"
    elif score >= 80:
        grade = "B (Proficient)"
    elif score >= 70:
        grade = "C (Developing)"
    else:
        grade = "Needs Practice"
    print(f"Test #{i}: {score}/100 -> Grade: {grade}")

# Summation with while loop
total = 0
idx = 0
while idx < len(scores):
    total += scores[idx]
    idx += 1

average = total / len(scores)
print(f"\\nClass Average: {average:.1f}/100")
`,
  },
  {
    id: 'py-primes',
    name: '3. Prime Sieve Algorithm (Python)',
    language: 'python',
    category: 'Algorithms',
    description: 'Compute all prime numbers up to 100 using the Sieve of Eratosthenes.',
    code: `# Sieve of Eratosthenes: Finding Primes up to N
def find_primes(limit):
    sieve = [True] * (limit + 1)
    sieve[0] = sieve[1] = False
    
    for p in range(2, int(limit**0.5) + 1):
        if sieve[p]:
            for multiple in range(p * p, limit + 1, p):
                sieve[multiple] = False
                
    return [num for num, is_prime in enumerate(sieve) if is_prime]

limit = 100
primes = find_primes(limit)
print(f"Found {len(primes)} prime numbers up to {limit}:")
print(primes)
`,
  },
  {
    id: 'py-stdin',
    name: '4. Interactive Input Processing (Python)',
    language: 'python',
    category: 'I/O',
    description: 'Demonstrating stdin reading with user input.',
    sampleStdin: 'Ada Lovelace\n1815\nFirst Computer Programmer\n',
    code: `import sys

print("=== Standard Input Reader ===")
try:
    name = input("Enter Pioneer Name: ").strip()
    year = input("Enter Birth Year: ").strip()
    achievement = input("Enter Key Achievement: ").strip()

    print("\\n[Received Input]")
    print(f"Hero: {name}")
    print(f"Born: {year}")
    print(f"Legacy: {achievement}")
except EOFError:
    print("No stdin provided! Open the 'Standard Input' tab below and provide lines.")
`,
  },

  // C TEMPLATES
  {
    id: 'c-basics',
    name: '1. Hello World & Formats (C)',
    language: 'c',
    category: 'Basics',
    description: 'Standard library, format specifiers, and return codes in C11.',
    code: `#include <stdio.h>

int main(void) {
    printf("=== CS Odyssey: C Systems Bedrock ===\\n");
    
    int age = 15;
    double clock_ghz = 3.65;
    char grade = 'A';
    
    printf("Student Grade Level: %d\\n", 9);
    printf("Target CPU Frequency: %.2f GHz\\n", clock_ghz);
    printf("Letter Grade: %c\\n", grade);
    
    printf("\\nMemory Sizes on this 64-bit architecture:\\n");
    printf("  sizeof(char):   %zu byte\\n", sizeof(char));
    printf("  sizeof(int):    %zu bytes\\n", sizeof(int));
    printf("  sizeof(double): %zu bytes\\n", sizeof(double));
    printf("  sizeof(void*):  %zu bytes (64-bit pointer)\\n", sizeof(void*));
    
    return 0;
}
`,
  },
  {
    id: 'c-loops',
    name: '2. Loops & Math Functions (C)',
    language: 'c',
    category: 'Basics',
    description: 'For loops, while loops, and math.h functions with gcc -lm.',
    code: `#include <stdio.h>
#include <math.h>

int main(void) {
    printf("=== Math Powers & Roots Table ===\\n");
    printf("%-6s | %-10s | %-10s\\n", "n", "2^n", "sqrt(n)");
    printf("-----------------------------\\n");
    
    for (int n = 1; n <= 10; n++) {
        long long power_of_two = 1LL << n;
        double root = sqrt((double)n);
        printf("%-6d | %-10lld | %-10.4f\\n", n, power_of_two, root);
    }
    
    return 0;
}
`,
  },
  {
    id: 'c-pointers',
    name: '3. Pointers & Memory Addresses (C)',
    language: 'c',
    category: 'Systems',
    description: 'Demystifying pointers, dereferencing, and address-of operator.',
    code: `#include <stdio.h>

void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main(void) {
    int x = 42;
    int *ptr = &x;
    
    printf("Variable value x:       %d\\n", x);
    printf("Address of x (&x):      %p\\n", (void*)&x);
    printf("Pointer value ptr:      %p\\n", (void*)ptr);
    printf("Dereferenced (*ptr):    %d\\n", *ptr);
    
    // Modify value through pointer
    *ptr = 100;
    printf("\\nAfter *ptr = 100, x is now: %d\\n", x);
    
    int a = 7, b = 99;
    printf("\\nBefore swap: a = %d, b = %d\\n", a, b);
    swap(&a, &b);
    printf("After swap:  a = %d, b = %d\\n", a, b);
    
    return 0;
}
`,
  },
  {
    id: 'c-structs',
    name: '4. Structs & Dynamic Allocation (C)',
    language: 'c',
    category: 'Systems',
    description: 'Custom typedef structs and heap memory with malloc/free.',
    code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char name[32];
    int bandit_level;
    double xp;
} StudentHero;

int main(void) {
    // Dynamic allocation on heap
    StudentHero *hero = (StudentHero *)malloc(sizeof(StudentHero));
    if (hero == NULL) {
        fprintf(stderr, "Heap allocation failed!\\n");
        return 1;
    }
    
    strncpy(hero->name, "Kareem Hero", sizeof(hero->name) - 1);
    hero->bandit_level = 5;
    hero->xp = 1250.0;
    
    printf("=== Heap Allocated Hero Struct ===\\n");
    printf("Hero Name:    %s\\n", hero->name);
    printf("Bandit Level: %d/16\\n", hero->bandit_level);
    printf("Mastery XP:   %.1f\\n", hero->xp);
    printf("Struct Address in Heap: %p\\n", (void*)hero);
    
    // Crucial C Rule: Always free dynamic heap memory
    free(hero);
    printf("\\nHeap memory freed cleanly. No memory leak!\\n");
    
    return 0;
}
`,
  },
];

export function CodePlayground({
  initialLanguage = 'python',
  initialCode,
  onOpenAiMentor,
  savedSnippets = [],
  onSaveSnippet,
  onDeleteSnippet,
}: CodePlaygroundProps) {
  const [language, setLanguage] = useState<'python' | 'c'>(initialLanguage);
  const [code, setCode] = useState<string>(
    initialCode ||
      (initialLanguage === 'python'
        ? STARTER_TEMPLATES[0].code
        : STARTER_TEMPLATES[4].code)
  );
  const [stdin, setStdin] = useState<string>('');
  const [showStdin, setShowStdin] = useState<boolean>(false);
  const [activeOutputTab, setActiveOutputTab] = useState<'output' | 'errors' | 'stdin'>('output');

  // Execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [output, setOutput] = useState<string>('Press "Run Code" (Ctrl+Enter) to compile and execute.');
  const [stderr, setStderr] = useState<string>('');
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Snippets modal
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showLibraryModal, setShowLibraryModal] = useState<boolean>(false);
  const [snippetTitle, setSnippetTitle] = useState<string>('');
  const [snippetTag, setSnippetTag] = useState<string>('Practice');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [prevInitialCode, setPrevInitialCode] = useState(initialCode);
  if (initialCode !== prevInitialCode) {
    setPrevInitialCode(initialCode);
    if (initialCode) {
      setCode(initialCode);
    }
  }

  // Line count for editor line numbers
  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 12) }, (_, i) => i + 1);

  // Handle Tab key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Run on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runCode();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const indent = '    '; // 4 spaces
      const newCode = code.substring(0, start) + indent + code.substring(end);
      setCode(newCode);

      // Restore cursor position after state update
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + indent.length;
      }, 0);
    }
  };

  // Run code against /api/code/run
  const runCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput('Compiling and executing on server...');
    setStderr('');
    setExitCode(null);
    setExecutionTime(null);

    try {
      const res = await fetch('/api/code/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code,
          stdin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOutput('');
        setStderr(data.error || 'Server execution error');
        setActiveOutputTab('errors');
        setExitCode(1);
        return;
      }

      setOutput(data.stdout || (data.exitCode === 0 ? '(Process completed with no output)' : ''));
      setStderr(data.stderr || '');
      setExitCode(data.exitCode);
      setExecutionTime(data.executionTimeMs);

      if (data.stderr && !data.stdout) {
        setActiveOutputTab('errors');
      } else {
        setActiveOutputTab('output');
      }
    } catch (err: any) {
      setOutput('');
      setStderr(`Network or request failure: ${err.message}`);
      setActiveOutputTab('errors');
      setExitCode(1);
    } finally {
      setIsRunning(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download code as file
  const handleDownloadCode = () => {
    const ext = language === 'python' ? 'py' : 'c';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `main.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load template
  const handleLoadTemplate = (tpl: CodeTemplate) => {
    setLanguage(tpl.language);
    setCode(tpl.code);
    if (tpl.sampleStdin) {
      setStdin(tpl.sampleStdin);
      setShowStdin(true);
    }
    setOutput(`Loaded "${tpl.name}". Click "Run Code" to execute!`);
    setStderr('');
    setExitCode(null);
  };

  // Save current snippet
  const handleSaveSnippet = () => {
    if (!onSaveSnippet) return;
    const title = snippetTitle.trim() || `${language.toUpperCase()} Snippet - ${new Date().toLocaleTimeString()}`;
    onSaveSnippet({
      title,
      language,
      code,
      tags: [snippetTag, language.toUpperCase()],
    });
    setShowSaveModal(false);
    setSnippetTitle('');
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">CS Odyssey Embedded Playground</h3>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400">
                  REAL GCC &amp; PYTHON 3.10
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lightweight, low-latency execution environment. Write, compile, and run real C and Python code!
              </p>
            </div>
          </div>

          {/* Language Selector + Run Button */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Language Switcher */}
            <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-1 text-xs font-semibold">
              <button
                onClick={() => {
                  setLanguage('python');
                  if (!code.trim() || code.includes('#include')) {
                    setCode(STARTER_TEMPLATES[0].code);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-mono ${
                  language === 'python'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Python 3
              </button>
              <button
                onClick={() => {
                  setLanguage('c');
                  if (!code.trim() || code.startsWith('# Python')) {
                    setCode(STARTER_TEMPLATES[4].code);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-mono ${
                  language === 'c'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                C (GCC C11)
              </button>
            </div>

            {/* Run Button */}
            <button
              onClick={runCode}
              disabled={isRunning}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white px-4 py-2 text-xs font-bold font-mono transition-all shadow-lg shadow-emerald-950/40 active:scale-95 cursor-pointer"
            >
              <Play className={`h-4 w-4 fill-white ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running...' : 'Run Code (Ctrl+↵)'}</span>
            </button>
          </div>
        </div>

        {/* Secondary Actions Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-xs">
          {/* Template dropdown pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[11px] mr-1 flex items-center gap-1">
              <FileCode className="h-3.5 w-3.5 text-cyan-400" />
              Templates:
            </span>
            {STARTER_TEMPLATES.filter((t) => t.language === language).map((t) => (
              <button
                key={t.id}
                onClick={() => handleLoadTemplate(t)}
                className="rounded-lg border border-slate-800 bg-slate-950/80 hover:border-slate-700 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer font-mono"
              >
                {t.name.split('. ')[1] || t.name}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowStdin(!showStdin)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] transition-all cursor-pointer flex items-center gap-1 font-mono ${
                showStdin || stdin.trim()
                  ? 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Stdin {stdin.trim() ? '●' : ''}</span>
            </button>

            <button
              onClick={handleCopyCode}
              className="rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 px-2.5 py-1 text-[11px] transition-all cursor-pointer flex items-center gap-1"
              title="Copy code to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownloadCode}
              className="rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 px-2.5 py-1 text-[11px] transition-all cursor-pointer flex items-center gap-1"
              title="Download file"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Save File</span>
            </button>

            {onSaveSnippet && (
              <button
                onClick={() => setShowSaveModal(true)}
                className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 px-2.5 py-1 text-[11px] transition-all cursor-pointer flex items-center gap-1 font-semibold"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Snippet</span>
              </button>
            )}

            {savedSnippets.length > 0 && (
              <button
                onClick={() => setShowLibraryModal(true)}
                className="rounded-lg border border-purple-500/40 bg-purple-950/30 hover:bg-purple-900/40 text-purple-300 px-2.5 py-1 text-[11px] transition-all cursor-pointer flex items-center gap-1"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span>My Snippets ({savedSnippets.length})</span>
              </button>
            )}

            {onOpenAiMentor && (
              <button
                onClick={() =>
                  onOpenAiMentor(
                    `Explain this ${language === 'python' ? 'Python' : 'C'} code step by step for a high school student, and analyze any edge cases or performance bottlenecks:\n\`\`\`${language}\n${code}\n\`\`\``
                  )
                }
                className="rounded-lg border border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 px-2.5 py-1 text-[11px] transition-all cursor-pointer flex items-center gap-1 font-semibold"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Explain Code</span>
              </button>
            )}
          </div>
        </div>

        {/* Optional Stdin Drawer */}
        {showStdin && (
          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Standard Input (stdin for input() or scanf):</span>
              <button
                onClick={() => setStdin('')}
                className="text-slate-500 hover:text-slate-300 text-[10px]"
              >
                Clear Stdin
              </button>
            </div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter lines of input here that your program will read..."
              rows={2}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        )}
      </div>

      {/* 2. Main Editor & Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Code Editor (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-950 flex flex-col h-[480px] shadow-2xl overflow-hidden">
          {/* File Tab Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2 select-none shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                <span>main.{language === 'python' ? 'py' : 'c'}</span>
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
              <span>{lineCount} lines</span>
              <span>UTF-8</span>
              <span className="text-cyan-400 uppercase">{language}</span>
            </div>
          </div>

          {/* Editor Body with Line Numbers */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Gutter / Line Numbers */}
            <div className="w-12 bg-slate-900/40 border-r border-slate-800/80 py-3 text-right pr-2.5 select-none font-mono text-[11px] text-slate-600 overflow-hidden shrink-0">
              {lineNumbers.map((num) => (
                <div key={num} className="leading-5 h-5">
                  {num}
                </div>
              ))}
            </div>

            {/* Fast, lightweight textarea with Tab & shortcut support */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              className="flex-1 p-3 bg-transparent text-slate-200 font-mono text-xs leading-5 resize-none focus:outline-none overflow-y-auto whitespace-pre tab-4 selection:bg-cyan-500/30"
              style={{ tabSize: 4 }}
            />
          </div>
        </div>

        {/* Right: Console Output & Terminal (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-950 flex flex-col h-[480px] shadow-2xl overflow-hidden">
          {/* Console Header with Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3 py-1.5 select-none shrink-0">
            <div className="flex items-center gap-1 text-xs font-mono">
              <button
                onClick={() => setActiveOutputTab('output')}
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeOutputTab === 'output'
                    ? 'bg-slate-800 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>stdout</span>
              </button>
              <button
                onClick={() => setActiveOutputTab('errors')}
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeOutputTab === 'errors'
                    ? 'bg-slate-800 text-rose-400'
                    : stderr
                    ? 'text-rose-400/80'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>stderr / warnings {stderr ? '(!)' : ''}</span>
              </button>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-2 font-mono text-[10px]">
              {executionTime !== null && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="h-3 w-3 text-cyan-400" />
                  <span>{executionTime}ms</span>
                </span>
              )}
              {exitCode !== null && (
                <span
                  className={`px-1.5 py-0.5 rounded ${
                    exitCode === 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                  }`}
                >
                  exit: {exitCode}
                </span>
              )}
            </div>
          </div>

          {/* Console Content Stream */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-200 bg-slate-950">
            {activeOutputTab === 'output' && (
              <pre className="whitespace-pre-wrap leading-relaxed text-slate-200 font-mono">
                {output}
              </pre>
            )}

            {activeOutputTab === 'errors' && (
              <div className="space-y-2">
                {stderr ? (
                  <pre className="whitespace-pre-wrap leading-relaxed text-rose-300 font-mono text-[11px] bg-rose-950/20 border border-rose-900/50 p-3 rounded-xl">
                    {stderr}
                  </pre>
                ) : (
                  <div className="text-slate-500 italic text-[11px]">No compiler warnings or runtime errors recorded.</div>
                )}
                {stderr && onOpenAiMentor && (
                  <button
                    onClick={() =>
                      onOpenAiMentor(
                        `I am writing ${language === 'python' ? 'Python' : 'C'} code and got this error:\n\`\`\`\n${stderr}\n\`\`\`\nHere is my source code:\n\`\`\`${language}\n${code}\n\`\`\`\nExplain what went wrong in plain English and give me the fixed code!`
                      )
                    }
                    className="w-full mt-2 py-2 rounded-xl border border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <span>Ask AI Mentor to Fix This Error</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Console Footer Status */}
          <div className="border-t border-slate-900 bg-slate-900/40 px-3 py-2 text-[10px] font-mono text-slate-500 flex items-center justify-between shrink-0">
            <span>Isolation: Linux tmp container · Timeout: 5.0s</span>
            <button
              onClick={() => {
                setOutput('');
                setStderr('');
                setExitCode(null);
                setExecutionTime(null);
              }}
              className="text-slate-400 hover:text-white"
            >
              Clear Console
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Save Snippet */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Save className="h-4 w-4 text-emerald-400" />
                Save Snippet to Local Library
              </h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Snippet Title:</label>
                <input
                  type="text"
                  value={snippetTitle}
                  onChange={(e) => setSnippetTitle(e.target.value)}
                  placeholder="e.g. Binary Search in C, Prime Sieve"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">Category Tag:</label>
                <select
                  value={snippetTag}
                  onChange={(e) => setSnippetTag(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="Basics">Basics</option>
                  <option value="Algorithms">Algorithms</option>
                  <option value="Systems">Systems &amp; Memory</option>
                  <option value="Networking">Networking</option>
                  <option value="Practice">Practice</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSnippet}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Save Snippet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Snippets Library */}
      {showLibraryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-purple-400" />
                My Saved Snippets Library ({savedSnippets.length})
              </h3>
              <button
                onClick={() => setShowLibraryModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {savedSnippets.map((snip) => (
                <div
                  key={snip.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{snip.title}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-400 uppercase">
                        {snip.language}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Updated: {new Date(snip.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setLanguage(snip.language);
                        setCode(snip.code);
                        setShowLibraryModal(false);
                        setOutput(`Loaded saved snippet "${snip.title}"`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all cursor-pointer"
                    >
                      Load
                    </button>
                    {onDeleteSnippet && (
                      <button
                        onClick={() => onDeleteSnippet(snip.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete snippet"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
