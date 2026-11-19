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
  Square,
  HardDrive,
  Binary,
  ShieldCheck,
  FlaskConical,
} from 'lucide-react';
import { SavedCodeSnippet } from '@/hooks/use-odyssey-store';
import { SoapBubbleButton } from '@/components/soap-bubble';
import {
  countNonEmptyLines,
  detectRecursiveCode,
  detectPointerUsage,
} from '@/lib/badges-data';
import {
  runCodeInBrowserWasm,
  abortBrowserWasmExecution,
  type BrowserWasmResult,
} from '@/lib/wasm/browser-sandbox';

export interface CodePlaygroundProps {
  initialLanguage?: 'python' | 'c';
  initialCode?: string;
  onOpenAiMentor?: (prompt?: string) => void;
  savedSnippets?: SavedCodeSnippet[];
  onSaveSnippet?: (snippet: { title: string; language: 'python' | 'c'; code: string; tags?: string[] }) => void;
  onDeleteSnippet?: (id: string) => void;
  onCodeExecuted?: (payload: { language: 'python' | 'c'; code: string; success: boolean }) => void;
}

interface CodeTemplate {
  id: string;
  name: string;
  language: 'python' | 'c';
  category: string;
  description: string;
  code: string;
  sampleStdin?: string;
  expectedStdout?: string;
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
  {
    id: 'py-recursion',
    name: '5. Recursion & Memoization (Python)',
    language: 'python',
    category: 'Algorithms',
    description: 'Classic recursive call stack and memoized Fibonacci recurrence.',
    code: `# Stage 12 Algorithms: Recursion & Recurrence Trees
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

def fib_memo(n, memo=None):
    if memo is None:
        memo = {}
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)
    return memo[n]

print("=== Recursive Call Stack Explorer ===")
for k in range(1, 8):
    print(f"{k}! = {factorial(k):>5}  |  fib({k * 3}) = {fib_memo(k * 3)}")
`,
    expectedStdout: '7! =  5040',
  },
  {
    id: 'py-dsa',
    name: '6. Binary Search & Quicksort (Python)',
    language: 'python',
    category: 'Algorithms',
    description: 'In-place divide-and-conquer Quicksort paired with O(log N) Binary Search.',
    expectedStdout: 'Binary Search index of 23: 5',
    code: `# Divide & Conquer: Quicksort + Binary Search (Stage 12)
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    mid = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + mid + quicksort(right)

def binary_search(sorted_arr, target):
    lo, hi = 0, len(sorted_arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if sorted_arr[mid] == target:
            return mid
        if sorted_arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

raw = [42, 7, 19, 3, 23, 88, 11, 5]
ordered = quicksort(raw)
print("Sorted:", ordered)
idx = binary_search(ordered, 23)
print(f"Binary Search index of 23: {idx}")
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
  {
    id: 'c-recursion',
    name: '5. Recursion & Call Stack (C)',
    language: 'c',
    category: 'Algorithms',
    description: 'Recursive factorial & binary tree / GCD recurrence in C11 WASM.',
    code: `#include <stdio.h>

int gcd(int a, int b) {
    if (b == 0) return a;
    return gcd(b, a % b);
}

int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}

int main(void) {
    printf("=== Recursive C Call Stack ===\\n");
    for (int i = 0; i <= 10; i++) {
        printf("fib(%2d) = %d\\n", i, fib(i));
    }
    printf("gcd(1071, 462) = %d\\n", gcd(1071, 462));
    return 0;
}
`,
    expectedStdout: 'gcd(1071, 462) = 21',
  },
  {
    id: 'c-bitmask',
    name: '6. Bitmasking & Dynamic Array (C)',
    language: 'c',
    category: 'Systems',
    description: 'Hardware bit manipulation (popcount, bit masks) on heap-allocated buffers.',
    expectedStdout: 'POPCOUNT=4',
    code: `#include <stdio.h>
#include <stdlib.h>

int count_set_bits(unsigned int n) {
    int count = 0;
    while (n > 0) {
        n &= (n - 1); // Brian Kernighan trick
        count++;
    }
    return count;
}

int main(void) {
    unsigned int flags = 0x2D; // Binary 0010 1101 -> 4 bits set
    int *arr = (int *)malloc(4 * sizeof(int));
    if (!arr) return 1;
    for (int i = 0; i < 4; i++) arr[i] = (i + 1) * 10;

    printf("Flags Hex: 0x%02X | POPCOUNT=%d\\n", flags, count_set_bits(flags));
    printf("Heap Array Sum Check: %d\\n", arr[0] + arr[1] + arr[2] + arr[3]);
    free(arr);
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
  onCodeExecuted,
}: CodePlaygroundProps) {
  const [language, setLanguage] = useState<'python' | 'c'>(initialLanguage);
  const [code, setCode] = useState<string>(
    initialCode ||
      (initialLanguage === 'python'
        ? STARTER_TEMPLATES[0].code
        : STARTER_TEMPLATES[6].code)
  );
  const [stdin, setStdin] = useState<string>('');
  const [showStdin, setShowStdin] = useState<boolean>(false);
  const [showAssert, setShowAssert] = useState<boolean>(false);
  const [expectedOutput, setExpectedOutput] = useState<string>('');
  const [assertionStatus, setAssertionStatus] = useState<'idle' | 'pass' | 'fail'>('idle');
  const [runtimeMode, setRuntimeMode] = useState<'wasm' | 'server'>('wasm');
  const [activeOutputTab, setActiveOutputTab] = useState<'output' | 'errors' | 'wasm'>('output');

  // Execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [output, setOutput] = useState<string>('Press "Run Code" (Ctrl+Enter) to execute directly in Browser WebAssembly.');
  const [stderr, setStderr] = useState<string>('');
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [lastWasmMeta, setLastWasmMeta] = useState<BrowserWasmResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Snippets modal
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showLibraryModal, setShowLibraryModal] = useState<boolean>(false);
  const [snippetTitle, setSnippetTitle] = useState<string>('');
  const [snippetTag, setSnippetTag] = useState<string>('Practice');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Line count & static code diagnostics for live telemetry strip
  const lineCount = code.split('\n').length;
  const nonEmptyLoc = countNonEmptyLines(code);
  const hasRecursion = detectRecursiveCode(code, language);
  const hasPointers = detectPointerUsage(code, language);
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

  // Run code via Browser WebAssembly VM or isolated Server Sandbox
  const runCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput(
      runtimeMode === 'wasm'
        ? language === 'c'
          ? 'Compiling C11 -> WebAssembly (.wasm) and instantiating linear RAM...'
          : 'Executing Python inside Browser WebAssembly Worker...'
        : 'Compiling and executing on isolated server sandbox...'
    );
    setStderr('');
    setExitCode(null);
    setExecutionTime(null);

    try {
      if (runtimeMode === 'wasm') {
        const res = await runCodeInBrowserWasm({
          language,
          code,
          stdin,
          timeoutMs: 5000,
        });
        setLastWasmMeta(res);
        setOutput(res.stdout || (res.exitCode === 0 ? '(Process completed with no output)' : ''));
        setStderr(res.stderr || '');
        setExitCode(res.exitCode);
        setExecutionTime(res.executionTimeMs);

        if (res.stderr && !res.stdout) {
          setActiveOutputTab('errors');
        } else {
          setActiveOutputTab('output');
        }
        if (expectedOutput.trim()) {
          const passed =
            res.exitCode === 0 && (res.stdout || '').includes(expectedOutput.trim());
          setAssertionStatus(passed ? 'pass' : 'fail');
        } else {
          setAssertionStatus('idle');
        }
        if (res.exitCode === 0) {
          onCodeExecuted?.({ language, code, success: true });
        }
        return;
      }

      setLastWasmMeta(null);
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
        setAssertionStatus(expectedOutput.trim() ? 'fail' : 'idle');
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
      if (expectedOutput.trim()) {
        const passed =
          data.exitCode === 0 && (data.stdout || '').includes(expectedOutput.trim());
        setAssertionStatus(passed ? 'pass' : 'fail');
      } else {
        setAssertionStatus('idle');
      }
      if (data.exitCode === 0) {
        onCodeExecuted?.({ language, code, success: true });
      }
    } catch (err: unknown) {
      setOutput('');
      setStderr(`Execution error: ${err instanceof Error ? err.message : String(err)}`);
      setActiveOutputTab('errors');
      setAssertionStatus(expectedOutput.trim() ? 'fail' : 'idle');
      setExitCode(1);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStopWasm = () => {
    abortBrowserWasmExecution();
    setIsRunning(false);
    setExitCode(130);
    setStderr('Execution interrupted by user.');
    setActiveOutputTab('errors');
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
    if (tpl.expectedStdout) {
      setExpectedOutput(tpl.expectedStdout);
      setShowAssert(true);
    } else {
      setExpectedOutput('');
    }
    setAssertionStatus('idle');
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-700 dark:text-sky-300 shrink-0">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">Systems Code Playground</h3>
                <span className="rounded-md border border-emerald-500/35 bg-emerald-500/12 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-800 dark:text-emerald-300">
                  {runtimeMode === 'wasm'
                    ? 'Browser WASM · MicroPython + C11->WASM'
                    : 'Server Sandbox · Python 3 / GCC C11'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {runtimeMode === 'wasm'
                  ? 'Client-side WebAssembly runtime running inside an isolated worker & linear RAM with 5s timeout.'
                  : 'Sandboxed server execution with 5s timeout, strict isolation, and stdin streaming.'}
              </p>
            </div>
          </div>

          {/* Runtime + Language Selector + Run Button */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="optical-subnav flex rounded-xl p-1 text-[11px] font-mono" title="Select Execution Environment">
              <button
                onClick={() => {
                  setRuntimeMode('wasm');
                  if (activeOutputTab === 'wasm' || exitCode === null) {
                    setOutput('Ready for client-side WebAssembly execution (Ctrl+Enter).');
                  }
                }}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  runtimeMode === 'wasm'
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-200 border border-emerald-500/40 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 border border-transparent'
                }`}
              >
                <Cpu className="h-3 w-3" />
                <span>Browser WASM</span>
              </button>
              <button
                onClick={() => setRuntimeMode('server')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  runtimeMode === 'server'
                    ? 'bg-amber-600 text-white dark:bg-amber-500/20 dark:text-amber-200 border border-amber-500/40 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 border border-transparent'
                }`}
              >
                <Layers className="h-3 w-3" />
                <span>Server</span>
              </button>
            </div>

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
                    ? 'bg-sky-600 text-white dark:bg-sky-500/20 dark:text-sky-200 border border-sky-500/40 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 border border-transparent'
                }`}
              >
                Python 3
              </button>
              <button
                onClick={() => {
                  setLanguage('c');
                  if (!code.trim() || code.startsWith('# Python') || code.startsWith('# Divide')) {
                    setCode(STARTER_TEMPLATES[6].code);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-mono ${
                  language === 'c'
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500/20 dark:text-indigo-200 border border-indigo-500/40 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 border border-transparent'
                }`}
              >
                C11
              </button>
            </div>

            {isRunning && runtimeMode === 'wasm' && (
              <button
                onClick={handleStopWasm}
                className="rounded-xl border border-rose-500/40 bg-rose-600 text-white hover:bg-rose-700 px-3 py-1.5 text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Square className="h-3 w-3 fill-white" />
                <span>Stop</span>
              </button>
            )}

            <SoapBubbleButton
              onClick={runCode}
              disabled={isRunning}
              tint="rgb(16 185 129)"
              opacity={0.94}
              style={{ fontSize: 12 }}
              className="!min-h-[34px] !px-4 font-semibold font-mono text-white disabled:opacity-50 whitespace-nowrap"
            >
              <Play className={`h-3.5 w-3.5 fill-white ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running...' : 'Run Code (Ctrl+Enter)'}</span>
            </SoapBubbleButton>
          </div>
        </div>

        {/* Live Telemetry & Static Diagnostics Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-white/[0.08] pt-2.5 text-[11px] font-mono text-slate-600 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-3">
            <span className="tabular-nums">
              Active LoC: <strong className="text-slate-900 dark:text-white">{nonEmptyLoc}</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className={hasRecursion ? 'text-indigo-700 dark:text-indigo-300 font-semibold' : ''}>
              Recursion: {hasRecursion ? 'Detected' : 'None'}
            </span>
            {language === 'c' && (
              <>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className={hasPointers ? 'text-sky-700 dark:text-sky-300 font-semibold' : ''}>
                  Pointers/Heap: {hasPointers ? 'Active' : 'Stack only'}
                </span>
              </>
            )}
          </div>

          {assertionStatus !== 'idle' && (
            <span
              className={`rounded-md px-2 py-0.5 font-semibold inline-flex items-center gap-1 ${
                assertionStatus === 'pass'
                  ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/35 text-rose-800 dark:text-rose-300'
              }`}
            >
              <FlaskConical className="h-3 w-3" />
              <span>{assertionStatus === 'pass' ? 'Assertion PASS' : 'Assertion FAIL'}</span>
            </span>
          )}
        </div>

        {/* Secondary Actions Bar */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-white/[0.08] pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] mr-1 flex items-center gap-1">
              <FileCode className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              Templates:
            </span>
            {STARTER_TEMPLATES.filter((t) => t.language === language).map((t) => (
              <button
                key={t.id}
                onClick={() => handleLoadTemplate(t)}
                className="optical-inset hover:border-sky-500/45 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer font-mono"
              >
                {t.name.split('. ')[1] || t.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setShowAssert(!showAssert)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] transition-colors cursor-pointer flex items-center gap-1 font-mono ${
                showAssert || expectedOutput.trim()
                  ? 'border-indigo-500/40 bg-indigo-500/12 text-indigo-800 dark:text-indigo-200 font-semibold'
                  : 'optical-inset text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100'
              }`}
            >
              <FlaskConical className="h-3 w-3" />
              <span>Assert {expectedOutput.trim() ? '*' : ''}</span>
            </button>

            <button
              onClick={() => setShowStdin(!showStdin)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] transition-colors cursor-pointer flex items-center gap-1 font-mono ${
                showStdin || stdin.trim()
                  ? 'border-sky-500/40 bg-sky-500/12 text-sky-800 dark:text-sky-200 font-semibold'
                  : 'optical-inset text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100'
              }`}
            >
              <span>Stdin {stdin.trim() ? '*' : ''}</span>
            </button>

            <button
              onClick={handleCopyCode}
              className="optical-card rounded-lg text-slate-700 dark:text-slate-300 px-2.5 py-1 text-[11px] cursor-pointer flex items-center gap-1"
              title="Copy code to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownloadCode}
              className="optical-card rounded-lg text-slate-700 dark:text-slate-300 px-2.5 py-1 text-[11px] cursor-pointer flex items-center gap-1"
              title="Download source file"
            >
              <Download className="h-3.5 w-3.5" />
              <span>.{language === 'python' ? 'py' : 'c'}</span>
            </button>

            {onSaveSnippet && (
              <button
                onClick={() => setShowSaveModal(true)}
                className="rounded-lg border border-emerald-600/35 dark:border-emerald-400/35 bg-emerald-500/12 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 px-2.5 py-1 text-[11px] transition-colors cursor-pointer flex items-center gap-1 font-semibold"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Snippet</span>
              </button>
            )}

            {savedSnippets.some((s) => s.language === 'python' || s.language === 'c') && (
              <button
                onClick={() => setShowLibraryModal(true)}
                className="optical-card rounded-lg text-slate-700 dark:text-slate-200 px-2.5 py-1 text-[11px] cursor-pointer flex items-center gap-1"
              >
                <FolderOpen className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span>
                  Library ({savedSnippets.filter((s) => s.language === 'python' || s.language === 'c').length})
                </span>
              </button>
            )}

            {onOpenAiMentor && (
              <button
                onClick={() =>
                  onOpenAiMentor(
                    `Explain this ${language === 'python' ? 'Python' : 'C'} code step by step for a student, and analyze any edge cases or performance bottlenecks:\n\`\`\`${language}\n${code}\n\`\`\``
                  )
                }
                className="rounded-lg border border-indigo-500/35 bg-indigo-500/12 hover:bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 px-2.5 py-1 text-[11px] transition-colors cursor-pointer flex items-center gap-1 font-semibold"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
                <span>Explain Code</span>
              </button>
            )}
          </div>
        </div>

        {/* Optional Assertion Drawer */}
        {showAssert && (
          <div className="mt-3 optical-inset rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400">
              <span>Expected stdout substring assertion (checked automatically on every run):</span>
              <button
                onClick={() => {
                  setExpectedOutput('');
                  setAssertionStatus('idle');
                }}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 text-[10px] cursor-pointer"
              >
                Clear Assertion
              </button>
            </div>
            <input
              type="text"
              value={expectedOutput}
              onChange={(e) => {
                setExpectedOutput(e.target.value);
                setAssertionStatus('idle');
              }}
              placeholder="e.g. gcd(1071, 462) = 21"
              className="w-full rounded-lg border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-black/45 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Optional Stdin Drawer */}
        {showStdin && (
          <div className="mt-3 optical-inset rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400">
              <span>Standard Input (stdin for input() or scanf):</span>
              <button
                onClick={() => setStdin('')}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 text-[10px] cursor-pointer"
              >
                Clear Stdin
              </button>
            </div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter lines of input here that your program will read..."
              rows={2}
              className="w-full rounded-lg border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-black/45 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 font-mono focus:outline-none focus:border-sky-500"
            />
          </div>
        )}
      </div>

      {/* 2. Main Editor & Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Code Editor (7 cols) - Dark high-contrast code viewport inside studio frame */}
        <div className="lg:col-span-7 optical-panel rounded-2xl flex flex-col h-[500px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] px-4 py-2.5 select-none shrink-0">
            <div className="flex items-center gap-2">
              <FileCode className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-200">
                main.{language === 'python' ? 'py' : 'c'}
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
              <span className="tabular-nums">{lineCount} lines</span>
              <span>UTF-8</span>
              <span className="text-sky-700 dark:text-sky-400 uppercase font-semibold">{language}</span>
            </div>
          </div>

          {/* Editor Body with Line Numbers */}
          <div className="flex-1 flex overflow-hidden relative bg-[#0b101d] text-slate-100">
            <div className="w-12 bg-[#070b15] border-r border-white/[0.08] py-3 text-right pr-2.5 select-none font-mono text-[11px] text-slate-500 overflow-hidden shrink-0">
              {lineNumbers.map((num) => (
                <div key={num} className="leading-5 h-5 tabular-nums">
                  {num}
                </div>
              ))}
            </div>

            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              className="flex-1 p-3 bg-transparent text-slate-100 font-mono text-xs leading-5 resize-none focus:outline-none overflow-y-auto whitespace-pre tab-4 selection:bg-cyan-500/30"
              style={{ tabSize: 4 }}
            />
          </div>
        </div>

        {/* Right: Console Output & Terminal (5 cols) */}
        <div className="lg:col-span-5 optical-panel rounded-2xl flex flex-col h-[500px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] px-3 py-2 select-none shrink-0 gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 text-xs font-mono">
              <button
                onClick={() => setActiveOutputTab('output')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeOutputTab === 'output'
                    ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-800 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 border border-transparent'
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>stdout</span>
              </button>
              <button
                onClick={() => setActiveOutputTab('errors')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeOutputTab === 'errors'
                    ? 'bg-rose-500/15 border border-rose-500/35 text-rose-800 dark:text-rose-300'
                    : stderr
                    ? 'text-rose-600 dark:text-rose-400/80 border border-transparent'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 border border-transparent'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>stderr {stderr ? '(!)' : ''}</span>
              </button>
              <button
                onClick={() => setActiveOutputTab('wasm')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeOutputTab === 'wasm'
                    ? 'bg-sky-500/15 border border-sky-500/35 text-sky-800 dark:text-sky-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 border border-transparent'
                }`}
              >
                <Binary className="h-3.5 w-3.5" />
                <span>wasm / ram</span>
              </button>
            </div>

            <div className="flex items-center gap-2 font-mono text-[10px] shrink-0">
              {executionTime !== null && (
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 tabular-nums">
                  <Clock className="h-3 w-3 text-sky-600 dark:text-cyan-400" />
                  <span>{executionTime}ms</span>
                </span>
              )}
              {exitCode !== null && (
                <span
                  className={`px-2 py-0.5 rounded-md tabular-nums font-semibold ${
                    exitCode === 0
                      ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-500/15 border border-rose-500/35 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  exit: {exitCode}
                </span>
              )}
            </div>
          </div>

          {/* Dark Terminal Output Surface */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-100 bg-[#0b101d]">
            {activeOutputTab === 'output' && (
              <pre className="whitespace-pre-wrap leading-relaxed text-slate-100 font-mono">
                {output}
              </pre>
            )}

            {activeOutputTab === 'errors' && (
              <div className="space-y-2">
                {stderr ? (
                  <pre className="whitespace-pre-wrap leading-relaxed text-rose-300 font-mono text-[11px] bg-rose-950/35 border border-rose-400/30 p-3 rounded-xl">
                    {stderr}
                  </pre>
                ) : (
                  <div className="text-slate-400 italic text-[11px]">No compiler warnings or runtime errors recorded.</div>
                )}
                {stderr && onOpenAiMentor && (
                  <button
                    onClick={() =>
                      onOpenAiMentor(
                        `I am writing ${language === 'python' ? 'Python' : 'C'} code and got this error:\n\`\`\`\n${stderr}\n\`\`\`\nHere is my source code:\n\`\`\`${language}\n${code}\n\`\`\`\nExplain what went wrong in plain English and give me the fixed code!`
                      )
                    }
                    className="w-full mt-2 py-2 rounded-xl border border-indigo-400/35 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-100 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Sparkles className="h-4 w-4 text-indigo-300" />
                    <span>Ask AI Mentor to Fix This Error</span>
                  </button>
                )}
              </div>
            )}

            {activeOutputTab === 'wasm' && (
              <div className="space-y-3 text-[11px]">
                <div className="rounded-xl bg-[#070b15] border border-white/[0.08] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Active Runtime Engine</span>
                    <span className="text-emerald-300 font-semibold flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {lastWasmMeta?.engineLabel ||
                        (runtimeMode === 'wasm'
                          ? language === 'c'
                            ? 'Native C11 -> .wasm · WebAssembly.Memory'
                            : 'MicroPython 1.29 · WASM (440 KB VM)'
                          : 'Server Sandbox Subprocess')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Execution Isolation</span>
                    <span className="text-slate-200">
                      {runtimeMode === 'wasm'
                        ? language === 'python'
                          ? 'ES Module Web Worker + VFS /lib'
                          : 'Browser WebAssembly.instantiate + Linear RAM'
                        : 'Server tmpdir · Zero shell interpolation'}
                    </span>
                  </div>
                </div>

                {lastWasmMeta?.wasmMetadata ? (
                  <>
                    <div className="rounded-xl bg-[#070b15] border border-white/[0.08] p-3 space-y-2">
                      <div className="text-sky-300 font-semibold flex items-center gap-1.5">
                        <Binary className="h-3.5 w-3.5" />
                        <span>Compiled .wasm Binary &amp; Exports</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-300">
                        <div>Module Size: <span className="text-white font-semibold tabular-nums">{lastWasmMeta.wasmMetadata.totalBytes} bytes</span></div>
                        <div>.rodata Strings: <span className="text-white font-semibold tabular-nums">{lastWasmMeta.wasmMetadata.dataBytes} bytes</span></div>
                      </div>
                      <div className="text-slate-400">
                        Functions: <span className="text-cyan-300">{lastWasmMeta.wasmMetadata.functions.join(', ')}</span>
                      </div>
                      <div className="rounded-lg bg-black/50 border border-white/[0.06] p-2 text-[10px] text-emerald-300 break-all">
                        <div className="text-slate-400 mb-0.5">WASM Header Bytes (`\0asm v1`):</div>
                        {lastWasmMeta.wasmMetadata.hexHeader}
                      </div>
                    </div>

                    <div className="rounded-xl bg-[#070b15] border border-white/[0.08] p-3 space-y-2">
                      <div className="text-indigo-300 font-semibold flex items-center gap-1.5">
                        <HardDrive className="h-3.5 w-3.5" />
                        <span>Linear WebAssembly.Memory &amp; Heap Audit</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-300 tabular-nums">
                        <div>.rodata Base: <span className="text-white">0x{lastWasmMeta.wasmMetadata.memoryLayout.rodataStart.toString(16).padStart(4, '0')}</span></div>
                        <div>Heap Base: <span className="text-white">0x{lastWasmMeta.wasmMetadata.memoryLayout.heapStart.toString(16).padStart(4, '0')}</span></div>
                        <div>Stack Top: <span className="text-white">0x{lastWasmMeta.wasmMetadata.memoryLayout.stackTop.toString(16)}</span></div>
                        <div>Peak Heap: <span className="text-white">{lastWasmMeta.wasmMetadata.heapStats.peakHeapBytes} B</span></div>
                        <div>malloc() calls: <span className="text-sky-300">{lastWasmMeta.wasmMetadata.heapStats.allocations}</span></div>
                        <div>free() calls: <span className="text-emerald-300">{lastWasmMeta.wasmMetadata.heapStats.frees}</span></div>
                      </div>
                      <div className={`rounded-lg px-2.5 py-1.5 border ${
                        lastWasmMeta.wasmMetadata.heapStats.leakedBytes === 0
                          ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
                          : 'bg-amber-500/10 border-amber-400/30 text-amber-300'
                      }`}>
                        {lastWasmMeta.wasmMetadata.heapStats.leakedBytes === 0
                          ? 'Heap Audit: 0 bytes leaked cleanly at program exit.'
                          : `Heap Audit: ${lastWasmMeta.wasmMetadata.heapStats.leakedBytes} bytes still allocated at exit (call free()).`}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl bg-[#070b15] border border-white/[0.08] p-3 text-slate-300 leading-relaxed">
                    {runtimeMode === 'wasm' && language === 'python'
                      ? 'MicroPython 1.29 WebAssembly VM executes inside an isolated Web Worker with a 16 MB linear heap and preloaded CS Odyssey stdlib VFS (/lib/sqlite3.py, /lib/ipaddress.py, collections.Counter, hashlib, re.findall, unittest, pathlib).'
                      : 'Run a C or Python program in Browser WASM mode to inspect WebAssembly module size, binary header bytes, linear RAM stack/heap offsets, and malloc()/free() leak diagnostics.'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Console Footer Status */}
          <div className="border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] px-3.5 py-2 text-[10px] font-mono text-slate-600 dark:text-slate-400 flex items-center justify-between shrink-0">
            <span>
              {runtimeMode === 'wasm'
                ? 'Isolation: Client WebAssembly Sandbox · Timeout: 5.0s'
                : 'Isolation: Sandboxed tmp workspace · Timeout: 5.0s'}
            </span>
            <button
              onClick={() => {
                setOutput('');
                setStderr('');
                setExitCode(null);
                setExecutionTime(null);
                setLastWasmMeta(null);
                setAssertionStatus('idle');
              }}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white cursor-pointer font-semibold"
            >
              Clear Console
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Save Snippet */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 dark:bg-[#03050b]/92 backdrop-blur-sm p-4">
          <div className="optical-panel w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Save className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Save Snippet to Local Library
              </h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-mono cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-mono">Snippet Title:</label>
                <input
                  type="text"
                  value={snippetTitle}
                  onChange={(e) => setSnippetTitle(e.target.value)}
                  placeholder="e.g. Binary Search in C, Prime Sieve"
                  className="w-full rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-black/45 px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-mono">Category Tag:</label>
                <select
                  value={snippetTag}
                  onChange={(e) => setSnippetTag(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#070b14] px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
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
                className="optical-card px-3.5 py-1.5 rounded-xl text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <SoapBubbleButton
                onClick={handleSaveSnippet}
                tint="rgb(16 185 129)"
                opacity={0.94}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 dark:bg-[#03050b]/92 backdrop-blur-sm p-4">
          <div className="optical-panel w-full max-w-xl rounded-2xl p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                My Saved Snippets Library ({savedSnippets.filter((s) => s.language === 'python' || s.language === 'c').length})
              </h3>
              <button
                onClick={() => setShowLibraryModal(false)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-mono cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {savedSnippets
                .filter((snip): snip is SavedCodeSnippet & { language: 'python' | 'c' } => snip.language === 'python' || snip.language === 'c')
                .map((snip) => (
                <div
                  key={snip.id}
                  className="optical-inset rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{snip.title}</span>
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] text-[10px] font-mono text-sky-700 dark:text-cyan-300 uppercase">
                        {snip.language}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
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
                      opacity={0.94}
                      style={{ fontSize: 12 }}
                      className="!min-h-[30px] !px-3 font-semibold text-white"
                    >
                      Load
                    </SoapBubbleButton>
                    {onDeleteSnippet && (
                      <button
                        onClick={() => onDeleteSnippet(snip.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
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
