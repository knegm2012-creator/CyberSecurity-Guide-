'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  ArrowRight,
  Terminal,
  Calculator,
  GitBranch,
  ShieldAlert,
  Code,
  Layers,
  Award,
  Clock,
  RotateCcw
} from 'lucide-react';

export interface DailyMicroTask {
  id: string;
  stageId: string;
  stageNumber: number;
  stageTitle: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  xpReward: number;
  category: 'Terminal' | 'Foundations' | 'Code' | 'Security' | 'Git';
  actionLabel: string;
  targetTab: string; // 'bandit' | 'foundations' | 'vault' | 'labs' | 'projects' | 'roadmap'
  hintPrompt: string;
}

export const STAGE_DAILY_CHALLENGES: Record<string, DailyMicroTask> = {
  'stage-0': {
    id: 'ch-s0',
    stageId: 'stage-0',
    stageNumber: 0,
    stageTitle: 'Foundations & Math Bedrock',
    title: 'Bitwise Place-Value Drill: Build Character "Z"',
    description: 'Launch the Binary Lab, toggle bits to create ASCII 90 ("Z", Hex 0x5A, Binary 01011010), and verify how weights 64 + 16 + 8 + 2 sum to 90.',
    estimatedMinutes: 5,
    xpReward: 25,
    category: 'Foundations',
    actionLabel: 'Open Binary Lab',
    targetTab: 'foundations',
    hintPrompt: 'ELI9: Show me how to calculate ASCII 90 in binary and hex using place values, and explain why 0x5A represents "Z".',
  },
  'stage-1': {
    id: 'ch-s1',
    stageId: 'stage-1',
    stageNumber: 1,
    stageTitle: 'Terminal & Command-Line Fluency',
    title: 'Linux Hidden File Discovery & Globbing',
    description: 'Open the Terminal and practice directory discovery: inspect hidden dotfiles with "ls -la" and test file wildcard pattern matching with "ls -d .*"',
    estimatedMinutes: 6,
    xpReward: 25,
    category: 'Terminal',
    actionLabel: 'Launch Terminal',
    targetTab: 'bandit',
    hintPrompt: 'ELI9: Explain the difference between ls, ls -a, and ls -la in Linux, and why configuration files start with a period.',
  },
  'stage-2': {
    id: 'ch-s2',
    stageId: 'stage-2',
    stageNumber: 2,
    stageTitle: 'Operating System & Architecture',
    title: 'Inspect ELF Header Types with "file"',
    description: 'In the Linux Terminal, run the "file" command on binaries in /bin to inspect ELF 64-bit LSB executable headers and architecture flags.',
    estimatedMinutes: 5,
    xpReward: 25,
    category: 'Terminal',
    actionLabel: 'Launch Terminal',
    targetTab: 'bandit',
    hintPrompt: 'ELI9: What does the Linux "file" command look at to determine file type, and what is an ELF header?',
  },
  'stage-3': {
    id: 'ch-s3',
    stageId: 'stage-3',
    stageNumber: 3,
    stageTitle: 'OverTheWire Bandit & Shell Mastery',
    title: 'Live SSH Strike: Crack Bandit Level 0',
    description: 'Connect via real Live SSH to bandit.labs.overthewire.org:2220 as bandit0. Read the "readme" file and extract the password for Level 1!',
    estimatedMinutes: 8,
    xpReward: 35,
    category: 'Security',
    actionLabel: 'Launch Live Bandit SSH',
    targetTab: 'bandit',
    hintPrompt: 'ELI9: Give me a hint for connecting to OverTheWire Bandit Level 0 and reading the readme file.',
  },
  'stage-4': {
    id: 'ch-s4',
    stageId: 'stage-4',
    stageNumber: 4,
    stageTitle: 'Git & Version Control',
    title: 'Visualize Branch Graph with "git log"',
    description: 'Search the Command Vault for Git inspection commands and learn how "git log --graph --oneline --all" reveals branch topology.',
    estimatedMinutes: 5,
    xpReward: 25,
    category: 'Git',
    actionLabel: 'Search Command Vault',
    targetTab: 'vault',
    hintPrompt: 'ELI9: Explain how Git stores commits as a directed acyclic graph (DAG) and what git log --graph displays.',
  },
  'stage-5': {
    id: 'ch-s5',
    stageId: 'stage-5',
    stageNumber: 5,
    stageTitle: 'C Programming & Memory Model',
    title: 'Pointer Arithmetic & Memory Address Step',
    description: 'Explore the Concept Labs memory visualizer to understand why an integer pointer ptr + 1 advances by 4 bytes rather than 1 byte.',
    estimatedMinutes: 7,
    xpReward: 30,
    category: 'Code',
    actionLabel: 'Explore Concept Labs',
    targetTab: 'labs',
    hintPrompt: 'ELI9: Explain pointer arithmetic in C: why does ptr++ increase the raw memory address by sizeof(*ptr)?',
  },
  'stage-6': {
    id: 'ch-s6',
    stageId: 'stage-6',
    stageNumber: 6,
    stageTitle: 'x86-64 Architecture & Assembly',
    title: 'CPU Register Triad: RAX, RIP, and RSP',
    description: 'Open the Foundations Studio CPU Architecture tab to review how RIP points to the next opcode and why RAX holds function return values.',
    estimatedMinutes: 6,
    xpReward: 25,
    category: 'Foundations',
    actionLabel: 'View CPU Architecture',
    targetTab: 'foundations',
    hintPrompt: 'ELI9: Explain the specific roles of RAX, RIP, and RSP registers in 64-bit Intel/AMD CPU execution.',
  },
  'stage-7': {
    id: 'ch-s7',
    stageId: 'stage-7',
    stageNumber: 7,
    stageTitle: 'Databases & SQL Security',
    title: 'Neutralize SQL Injection with Parameterized Queries',
    description: 'Review SQL command syntax in the Command Vault and contrast raw string formatting with prepared statements using ? placeholders.',
    estimatedMinutes: 6,
    xpReward: 25,
    category: 'Security',
    actionLabel: 'View SQL Vault',
    targetTab: 'vault',
    hintPrompt: 'ELI9: Why does parameterized SQL completely prevent injection attacks like \' OR 1=1 -- ?',
  },
  'stage-8': {
    id: 'ch-s8',
    stageId: 'stage-8',
    stageNumber: 8,
    stageTitle: 'Computer Networking & Protocols',
    title: 'Decipher TCP 3-Way Handshake Flag Bytes',
    description: 'In the Foundations Systems Bitmask tool, construct the TCP SYN-ACK flag byte (Hex 0x12 = 18 = SYN 2 + ACK 16) used to accept incoming sockets.',
    estimatedMinutes: 6,
    xpReward: 25,
    category: 'Foundations',
    actionLabel: 'Open TCP Bitmask',
    targetTab: 'foundations',
    hintPrompt: 'ELI9: Walk me through the TCP 3-way handshake (SYN, SYN-ACK, ACK) and what the flag bits look like in packet headers.',
  },
  'stage-9': {
    id: 'ch-s9',
    stageId: 'stage-9',
    stageNumber: 9,
    stageTitle: 'Defensive Security & Incident Response',
    title: 'Isolate Attacker IPs from auth.log',
    description: 'Learn the classic incident response pipeline: parse failed SSH attempts using grep "Failed password" piped into awk, sort, and uniq -c.',
    estimatedMinutes: 7,
    xpReward: 30,
    category: 'Security',
    actionLabel: 'Open Security Vault',
    targetTab: 'vault',
    hintPrompt: 'ELI9: How do security analysts parse Linux /var/log/auth.log to find brute force attackers using pipes?',
  },
  'stage-10': {
    id: 'ch-s10',
    stageId: 'stage-10',
    stageNumber: 10,
    stageTitle: 'Offensive Security & CTF Exploits',
    title: 'Base64 Token Dissection & Header Inspection',
    description: 'In the Terminal, practice payload decoding: pipe a simulated JWT or base64 string into base64 -d to read the algorithm header.',
    estimatedMinutes: 7,
    xpReward: 30,
    category: 'Security',
    actionLabel: 'Open Terminal',
    targetTab: 'bandit',
    hintPrompt: 'ELI9: Explain how Base64 encoding turns 3 binary bytes into 4 ASCII characters, and how hackers decode it.',
  },
  'stage-11': {
    id: 'ch-s11',
    stageId: 'stage-11',
    stageNumber: 11,
    stageTitle: 'Capstone Portfolio & Engineering Proof',
    title: 'Portfolio Engineering: Verify Acceptance Criteria',
    description: 'Open the Projects Studio, pick your active capstone build, review its acceptance criteria, and update your implementation notes.',
    estimatedMinutes: 8,
    xpReward: 35,
    category: 'Code',
    actionLabel: 'Open Projects Studio',
    targetTab: 'projects',
    hintPrompt: 'ELI9: Give me 3 tips for documenting a systems portfolio project to impress college admissions and internship recruiters.',
  },
};

interface DailyChallengeWidgetProps {
  currentStageId: string;
  onSelectTab: (tab: string) => void;
  onOpenAiMentor: (prompt: string) => void;
  onCompleteChallenge: (dateKey: string, xpReward: number, taskTitle: string, stageId: string) => void;
  isCompletedToday: boolean;
  currentStreak: number;
}

export function DailyChallengeWidget({
  currentStageId,
  onSelectTab,
  onOpenAiMentor,
  onCompleteChallenge,
  isCompletedToday,
  currentStreak,
}: DailyChallengeWidgetProps) {
  const [justCompleted, setJustCompleted] = useState(false);

  // Today's Date String (YYYY-MM-DD)
  const today = new Date();
  const dateKey = today.toISOString().split('T')[0];
  const dateFormatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const task = STAGE_DAILY_CHALLENGES[currentStageId] || STAGE_DAILY_CHALLENGES['stage-0'];

  const handleClaim = () => {
    onCompleteChallenge(dateKey, task.xpReward, task.title, task.stageId);
    setJustCompleted(true);
  };

  const completed = isCompletedToday || justCompleted;

  const getCategoryIcon = (category: DailyMicroTask['category']) => {
    switch (category) {
      case 'Terminal':
        return <Terminal className="h-4 w-4 text-emerald-400" />;
      case 'Foundations':
        return <Calculator className="h-4 w-4 text-cyan-400" />;
      case 'Git':
        return <GitBranch className="h-4 w-4 text-orange-400" />;
      case 'Code':
        return <Code className="h-4 w-4 text-indigo-400" />;
      case 'Security':
        return <ShieldAlert className="h-4 w-4 text-rose-400" />;
      default:
        return <Sparkles className="h-4 w-4 text-cyan-400" />;
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 relative overflow-hidden ${
        completed
          ? 'border-emerald-500/50 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-950 shadow-lg shadow-emerald-950/20'
          : 'border-cyan-500/40 bg-gradient-to-r from-cyan-950/25 via-slate-900/90 to-indigo-950/25 shadow-xl shadow-cyan-950/30'
      }`}
    >
      {/* Decorative subtle background aura */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

      <div className="p-5 sm:p-6 space-y-4">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              {completed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <Flame className="h-5 w-5 text-orange-400 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                  Daily Consistency Challenge
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  {dateFormatted}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                1 micro-task per day keeps your streak alive and builds real muscle memory.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono shrink-0">
            <span className="flex items-center gap-1 text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{task.estimatedMinutes} min</span>
            </span>
            <span className="flex items-center gap-1 text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-500/40 font-bold">
              <Award className="h-3.5 w-3.5 text-amber-400" />
              <span>+{task.xpReward} XP</span>
            </span>
          </div>
        </div>

        {/* Challenge Body */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-800/80 text-cyan-300 font-semibold border border-slate-700/80">
                Stage {task.stageNumber}: {task.stageTitle}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-slate-300 font-sans">
                {getCategoryIcon(task.category)}
                <span>{task.category}</span>
              </span>
            </div>

            <h4 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>{task.title}</span>
              {completed && (
                <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  Completed Today!
                </span>
              )}
            </h4>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {task.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0">
            {!completed ? (
              <>
                <button
                  onClick={() => onSelectTab(task.targetTab)}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2.5 text-xs font-mono font-bold text-white shadow-md shadow-cyan-950/50 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <span>{task.actionLabel}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  onClick={handleClaim}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50 px-3.5 py-2.5 text-xs font-mono font-bold text-emerald-300 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Mark Done (+{task.xpReward} XP)</span>
                </button>

                <button
                  onClick={() => onOpenAiMentor(task.hintPrompt)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/50 px-3 py-2.5 text-xs font-mono text-purple-300 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  title="Ask AI Coach for a hint"
                >
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span>Hint</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-950/60 border border-emerald-500/50 px-4 py-2 text-xs font-mono text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>+{task.xpReward} XP Claimed · Streak Alive!</span>
                </div>
                <button
                  onClick={() => onSelectTab(task.targetTab)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-slate-300 hover:text-white cursor-pointer"
                >
                  <span>Revisit Task</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
