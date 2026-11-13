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
import { SoapBubbleButton } from '@/components/soap-bubble';

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
      <div className="optical-panel rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-300 shrink-0 shadow-[0_0_20px_-6px_rgba(56,189,248,0.45)]">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-display text-sm font-semibold text-white">Systems Code Playground</h3>
                <span className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-300">
                  GCC C11 / Python 3
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sandboxed server execution with 5s timeout, strict isolation, and stdin streaming.
              </p>
            </div>
          </div>

          {/* Language Selector + Run Button */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="optical-subnav flex rounded-xl p-1 text-xs font-medium">
              <button
                onClick={() => {
                  setLanguage('python');
                  if (!code.trim() || code.includes('#include')) {
                    setCode(STARTER_TEMPLATES[0].code);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-mono ${
                  language === 'python'
                    ? 'bg-sky-500/20 text-sky-200 border border-sky-400/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                    : 'text-slate-400 hover:text-slate-100 border border-transparent'
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
                    ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                    : 'text-slate-400 hover:text-slate-100 border border-transparent'
                }`}
              >
                C (GCC C11)
              </button>
            </div>

            <SoapBubbleButton
              onClick={runCode}
              disabled={isRunning}
              tint="rgb(16 185 129)"
              opacity={0.92}
              style={{ fontSize: 12 }}
              className="!min-h-[34px] !px-4 font-semibold font-mono text-white disabled:opacity-50"
            >
              <Play className={`h-3.5 w-3.5 fill-white ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running...' : 'Run Code (Ctrl+Enter)'}</span>
            </SoapBubbleButton>
          </div>
        </div>

        {/* Secondary Actions Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08] pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[11px] mr-1 flex items-center gap-1">
              <FileCode className="h-3.5 w-3.5 text-sky-400" />
              Templates:
            </span>
            {STARTER_TEMPLATES.filter((t) => t.language === language).map((t) => (
              <button
                key={t.id}
                onClick={() => handleLoadTemplate(t)}
                className="optical-inset hover:border-sky-400/35 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer font-mono"
              >
                {t.name.split('. ')[1] || t.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setShowStdin(!showStdin)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] transition-colors cursor-pointer flex items-center gap-1 font-mono ${
                showStdin || stdin.trim()
                  ? 'border-sky-400/40 bg-sky-500/15 text-sky-200'
                  : 'optical-inset text-slate-400 hover:text-slate-100'
              }`}
            >
              <span>Stdin {stdin.trim() ? '*' : ''}</span>
            </button>

            <button
              onClick={handleCopyCode}
              className="optical-card rounded-lg text-slate-300 px-2.5 py-1 text-[11px] cursor-pointer flex items-center gap-1"
              title="Copy code to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownloadCode}
              className="optical-card rounded-lg text-slate-300 px-2.5 py-1 text-[11px] cursor-pointer flex items-center gap-1"
              title="Download file"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>

            {onSaveSnippet && (
              <button
                onClick={() => setShowSaveModal(true)}
                className="rounded-lg border border-emerald-400/35 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 px-2.5 py-1 text-[11px] transition-colors cursor-pointer flex items-center gap-1 font-medium"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Snippet</span>
              </button>
            )}

            {savedSnippets.length > 0 && (
              <button
                onClick={() => setShowLibraryModal(true)}
                className="optical-card rounded-lg text-slate-200 px-2.5 py-1 text-[11px] cursor-pointer flex items-center gap-1"
              >
                <FolderOpen className="h-3.5 w-3.5 text-sky-400" />
                <span>Library ({savedSnippets.length})</span>
              </button>
            )}

            {onOpenAiMentor && (
              <button
                onClick={() =>
                  onOpenAiMentor(
                    `Explain this ${language === 'python' ? 'Python' : 'C'} code step by step for a student, and analyze any edge cases or performance bottlenecks:\n\`\`\`${language}\n${code}\n\`\`\``
                  )
                }
                className="rounded-lg border border-indigo-400/35 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 px-2.5 py-1 text-[11px] transition-colors cursor-pointer flex items-center gap-1 font-medium"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                <span>Explain Code</span>
              </button>
            )}
          </div>
        </div>

        {/* Optional Stdin Drawer */}
        {showStdin && (
          <div className="mt-3 optical-inset rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Standard Input (stdin for input() or scanf):</span>
              <button
                onClick={() => setStdin('')}
                className="text-slate-500 hover:text-slate-300 text-[10px] cursor-pointer"
              >
                Clear Stdin
              </button>
            </div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter lines of input here that your program will read..."
              rows={2}
              className="w-full rounded-lg border border-white/[0.08] bg-black/45 px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-400/60"
            />
          </div>
        )}
      </div>

      {/* 2. Main Editor & Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Code Editor (7 cols) */}
        <div className="lg:col-span-7 optical-panel rounded-2xl flex flex-col h-[500px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] px-4 py-2.5 select-none shrink-0">
            <div className="flex items-center gap-2">
              <FileCode className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-mono text-xs font-semibold text-slate-200">
                main.{language === 'python' ? 'py' : 'c'}
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
              <span className="tabular-nums">{lineCount} lines</span>
              <span>UTF-8</span>
              <span className="text-sky-400 uppercase">{language}</span>
            </div>
          </div>

          {/* Editor Body with Line Numbers */}
          <div className="flex-1 flex overflow-hidden relative bg-[#040710]/70">
            {/* Gutter / Line Numbers */}
            <div className="w-12 bg-white/[0.02] border-r border-white/[0.06] py-3 text-right pr-2.5 select-none font-mono text-[11px] text-slate-600 overflow-hidden shrink-0">
              {lineNumbers.map((num) => (
                <div key={num} className="leading-5 h-5 tabular-nums">
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
        <div className="lg:col-span-5 optical-panel rounded-2xl flex flex-col h-[500px] overflow-hidden">
          {/* Console Header with Tabs */}
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] px-3 py-2 select-none shrink-0">
            <div className="flex items-center gap-1 text-xs font-mono">
              <button
                onClick={() => setActiveOutputTab('output')}
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeOutputTab === 'output'
                    ? 'bg-emerald-500/15 border border-emerald-400/30 text-emerald-300'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>stdout</span>
              </button>
              <button
                onClick={() => setActiveOutputTab('errors')}
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeOutputTab === 'errors'
                    ? 'bg-rose-500/15 border border-rose-400/30 text-rose-300'
                    : stderr
                    ? 'text-rose-400/80 border border-transparent'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>stderr / warnings {stderr ? '(!)' : ''}</span>
              </button>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-2 font-mono text-[10px]">
              {executionTime !== null && (
                <span className="flex items-center gap-1 text-slate-400 tabular-nums">
                  <Clock className="h-3 w-3 text-cyan-400" />
                  <span>{executionTime}ms</span>
                </span>
              )}
              {exitCode !== null && (
                <span
                  className={`px-2 py-0.5 rounded-md tabular-nums ${
                    exitCode === 0 ? 'bg-emerald-500/15 border border-emerald-400/30 text-emerald-300' : 'bg-rose-500/15 border border-rose-400/30 text-rose-300'
                  }`}
                >
                  exit: {exitCode}
                </span>
              )}
            </div>
          </div>

          {/* Console Content Stream */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-200 bg-[#040710]/80">
            {activeOutputTab === 'output' && (
              <pre className="whitespace-pre-wrap leading-relaxed text-slate-200 font-mono">
                {output}
              </pre>
            )}

            {activeOutputTab === 'errors' && (
              <div className="space-y-2">
                {stderr ? (
                  <pre className="whitespace-pre-wrap leading-relaxed text-rose-300 font-mono text-[11px] bg-rose-950/25 border border-rose-400/30 p-3 rounded-xl">
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
                    className="w-full mt-2 py-2 rounded-xl border border-indigo-400/35 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Sparkles className="h-4 w-4 text-indigo-300" />
                    <span>Ask AI Mentor to Fix This Error</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Console Footer Status */}
          <div className="border-t border-white/[0.08] bg-white/[0.02] px-3.5 py-2 text-[10px] font-mono text-slate-500 flex items-center justify-between shrink-0">
            <span>Isolation: Linux tmp container · Timeout: 5.0s</span>
            <button
              onClick={() => {
                setOutput('');
                setStderr('');
                setExitCode(null);
                setExecutionTime(null);
              }}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              Clear Console
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Save Snippet */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#03050b]/80 p-4 backdrop-blur-md">
          <div className="optical-panel w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <Save className="h-4 w-4 text-emerald-400" />
                Save Snippet to Local Library
              </h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
              >
                Close
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
                  className="w-full rounded-xl border border-white/[0.1] bg-black/45 px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-400/60 font-mono"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">Category Tag:</label>
                <select
                  value={snippetTag}
                  onChange={(e) => setSnippetTag(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#070b14] px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-400/60 font-mono"
                >
                  <option value="Basics">Basics</option>
                  <option value="Algorithms">Algorithms</option>
                  <option value="Systems">Systems &amp; Memory</option>
                  <option value="Networking">Networking</option>
                  <option value="Practice">Practice</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="optical-card px-3.5 py-1.5 rounded-xl text-xs text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <SoapBubbleButton
                onClick={handleSaveSnippet}
                tint="rgb(16 185 129)"
                opacity={0.92}
                style={{ fontSize: 12 }}
                className="!min-h-[34px] !px-4 font-bold text-white"
              >
                Save Snippet
              </SoapBubbleButton>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Snippets Library */}
      {showLibraryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#03050b]/80 p-4 backdrop-blur-md">
          <div className="optical-panel w-full max-w-xl rounded-2xl p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-sky-400" />
                My Saved Snippets Library ({savedSnippets.length})
              </h3>
              <button
                onClick={() => setShowLibraryModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {savedSnippets.map((snip) => (
                <div
                  key={snip.id}
                  className="optical-inset rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{snip.title}</span>
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-[10px] font-mono text-cyan-300 uppercase">
                        {snip.language}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Updated: {new Date(snip.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <SoapBubbleButton
                      onClick={() => {
                        setLanguage(snip.language);
                        setCode(snip.code);
                        setShowLibraryModal(false);
                        setOutput(`Loaded saved snippet "${snip.title}"`);
                      }}
                      tint="rgb(14 165 233)"
                      opacity={0.9}
                      style={{ fontSize: 12 }}
                      className="!min-h-[30px] !px-3 font-semibold text-white"
                    >
                      Load
                    </SoapBubbleButton>
                    {onDeleteSnippet && (
                      <button
                        onClick={() => onDeleteSnippet(snip.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
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
