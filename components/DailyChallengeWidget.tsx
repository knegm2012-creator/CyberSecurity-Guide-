'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Terminal,
  Calculator,
  GitBranch,
  Shield,
  Code2,
} from 'lucide-react';
import { SoapBubbleButton } from './soap-bubble';
import type { PrimaryWorkspace } from './Navbar';

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
  targetWorkspace: PrimaryWorkspace;
  targetSubTab?: string;
  hintPrompt: string;
}

export const STAGE_DAILY_CHALLENGES: Record<string, DailyMicroTask> = {
  'stage-0': {
    id: 'ch-s0',
    stageId: 'stage-0',
    stageNumber: 0,
    stageTitle: 'Foundations & Math Bedrock',
    title: 'Bitwise Place-Value Drill: Encode ASCII "Z"',
    description:
      'Open the Bitwise & Hardware lab, toggle register bits to construct ASCII 90 ("Z", Hex 0x5A, Binary 01011010), and verify weights 64 + 16 + 8 + 2.',
    estimatedMinutes: 5,
    xpReward: 25,
    category: 'Foundations',
    actionLabel: 'Open Bitwise Lab',
    targetWorkspace: 'lab',
    targetSubTab: 'foundations',
    hintPrompt:
      'Explain how to convert ASCII 90 ("Z") into binary and hex 0x5A using place values.',
  },
  'stage-1': {
    id: 'ch-s1',
    stageId: 'stage-1',
    stageNumber: 1,
    stageTitle: 'Terminal & Command-Line Fluency',
    title: 'Hidden Dotfiles & Globbing Discovery',
    description:
      'Open Wargame Shell and practice inspecting hidden configuration dotfiles using "ls -la" and reading dashed filenames safely with "cat ./-".',
    estimatedMinutes: 6,
    xpReward: 25,
    category: 'Terminal',
    actionLabel: 'Open Wargame Shell',
    targetWorkspace: 'shell',
    hintPrompt:
      'Explain the difference between ls, ls -a, and ls -la in Linux, and why dotfiles begin with a period.',
  },
  'stage-2': {
    id: 'ch-s2',
    stageId: 'stage-2',
    stageNumber: 2,
    stageTitle: 'Operating Systems & Architecture',
    title: 'Inspect File Headers & Magic Bytes',
    description:
      'In the Wargame Shell, inspect binary vs ASCII file types with "file ./*" to observe magic-byte signatures independent of file extensions.',
    estimatedMinutes: 5,
    xpReward: 25,
    category: 'Terminal',
    actionLabel: 'Open Wargame Shell',
    targetWorkspace: 'shell',
    hintPrompt:
      'How does the Linux "file" utility identify binary executables vs text using magic bytes and ELF headers?',
  },
  'stage-3': {
    id: 'ch-s3',
    stageId: 'stage-3',
    stageNumber: 3,
    stageTitle: 'Shell Pipelines & Cyber Citadel',
    title: 'Solve Citadel Level 0 & Extract Credential',
    description:
      'Inspect /home/bandit0 in Wargame Shell (offline sandbox or live SSH bridge), read the readme payload, and unlock Level 1.',
    estimatedMinutes: 8,
    xpReward: 35,
    category: 'Security',
    actionLabel: 'Launch Shell',
    targetWorkspace: 'shell',
    hintPrompt:
      'Walk me through connecting via SSH to a wargame host on port 2220 and inspecting the readme file.',
  },
  'stage-4': {
    id: 'ch-s4',
    stageId: 'stage-4',
    stageNumber: 4,
    stageTitle: 'Git & Version Control',
    title: 'Construct & Merge a Feature Branch in DAG Studio',
    description:
      'Launch the Git DAG Studio, create a feature branch, record two commits, and observe how branch pointers advance across the commit graph.',
    estimatedMinutes: 5,
    xpReward: 25,
    category: 'Git',
    actionLabel: 'Open Git Studio',
    targetWorkspace: 'lab',
    targetSubTab: 'git',
    hintPrompt:
      'Explain how Git models commit history as a Directed Acyclic Graph (DAG) with lightweight branch pointers.',
  },
  'stage-5': {
    id: 'ch-s5',
    stageId: 'stage-5',
    stageNumber: 5,
    stageTitle: 'C Programming & Memory Model',
    title: 'Pointer Dereferencing & Memory Addressing',
    description:
      'Inspect the RAM Address Grid in Systems Lab to trace how modifying *ptr_score mutates the target integer directly at address 0x1000.',
    estimatedMinutes: 7,
    xpReward: 30,
    category: 'Code',
    actionLabel: 'Open Memory Lab',
    targetWorkspace: 'lab',
    targetSubTab: 'memory',
    hintPrompt:
      'Explain pointer arithmetic and dereferencing in C: why ptr + 1 advances by sizeof(*ptr) bytes.',
  },
  'stage-6': {
    id: 'ch-s6',
    stageId: 'stage-6',
    stageNumber: 6,
    stageTitle: 'x86-64 Architecture & Registers',
    title: 'Trace the CPU Fetch-Decode-Execute Cycle',
    description:
      'Review CPU register roles (RAX, RIP, RSP) and step through the instruction pipeline inside the Hardware foundations module.',
    estimatedMinutes: 6,
    xpReward: 25,
    category: 'Foundations',
    actionLabel: 'Open Hardware Lab',
    targetWorkspace: 'lab',
    targetSubTab: 'foundations',
    hintPrompt:
      'Explain the specific roles of RAX, RIP, and RSP registers in 64-bit x86 execution.',
  },
  'stage-7': {
    id: 'ch-s7',
    stageId: 'stage-7',
    stageNumber: 7,
    stageTitle: 'Databases & SQL Security',
    title: 'Parameterized Queries vs SQL Injection',
    description:
      'Open the Command Vault in Reference and compare string-interpolated queries against prepared statements with bound parameters.',
    estimatedMinutes: 6,
    xpReward: 25,
    category: 'Security',
    actionLabel: 'Open Command Vault',
    targetWorkspace: 'reference',
    targetSubTab: 'commands',
    hintPrompt:
      'Why do parameterized SQL statements completely neutralize classic OR 1=1 injection payloads?',
  },
  'stage-8': {
    id: 'ch-s8',
    stageId: 'stage-8',
    stageNumber: 8,
    stageTitle: 'Computer Networking & Protocols',
    title: 'Trace TCP Handshake & Bitmask Flags',
    description:
      'Walk through the 6-hop Packet Journey in Systems Lab from local ARP/DNS resolution through the TCP 3-way handshake and TLS 1.3.',
    estimatedMinutes: 6,
    xpReward: 25,
    category: 'Foundations',
    actionLabel: 'Open Packet Tracer',
    targetWorkspace: 'lab',
    targetSubTab: 'packet',
    hintPrompt:
      'Walk through the TCP 3-way handshake (SYN, SYN-ACK, ACK) and sequence number acknowledgment.',
  },
  'stage-9': {
    id: 'ch-s9',
    stageId: 'stage-9',
    stageNumber: 9,
    stageTitle: 'Defensive Security & Log Analysis',
    title: 'Filter Authentication Anomalies with grep & uniq',
    description:
      'Review pipe filters in the Command Vault to isolate repeated authentication failures from auth.log with grep, sort, and uniq -c.',
    estimatedMinutes: 7,
    xpReward: 30,
    category: 'Security',
    actionLabel: 'Open Command Vault',
    targetWorkspace: 'reference',
    targetSubTab: 'commands',
    hintPrompt:
      'Show how security engineers pipeline grep, awk, sort, and uniq -c to summarize failed SSH logins.',
  },
  'stage-10': {
    id: 'ch-s10',
    stageId: 'stage-10',
    stageNumber: 10,
    stageTitle: 'Systems Analysis & Encoding',
    title: 'Decode Base64 & ROT13 Payloads in Shell',
    description:
      'Practice chained text transformations inside Wargame Shell using base64 -d, tr, and strings on sample artifacts.',
    estimatedMinutes: 7,
    xpReward: 30,
    category: 'Security',
    actionLabel: 'Open Wargame Shell',
    targetWorkspace: 'shell',
    hintPrompt:
      'Explain how Base64 encodes every 3 bytes into 4 ASCII characters and why padding "=" appears.',
  },
  'stage-11': {
    id: 'ch-s11',
    stageId: 'stage-11',
    stageNumber: 11,
    stageTitle: 'Capstone Portfolio & Engineering Proof',
    title: 'Audit Project Acceptance Criteria & README',
    description:
      'Open the 14 Portfolio Projects in Curriculum, review acceptance criteria for your active project, and export a clean README.',
    estimatedMinutes: 8,
    xpReward: 35,
    category: 'Code',
    actionLabel: 'Open Portfolio',
    targetWorkspace: 'curriculum',
    targetSubTab: 'projects',
    hintPrompt:
      'What makes a systems engineering GitHub README compelling to technical reviewers?',
  },
};

interface DailyChallengeWidgetProps {
  currentStageId: string;
  onNavigate: (workspace: PrimaryWorkspace, subTab?: string) => void;
  onOpenAiMentor: (prompt: string) => void;
  onCompleteChallenge: (dateKey: string, xpReward: number, taskTitle: string, stageId: string) => void;
  isCompletedToday: boolean;
}

export function DailyChallengeWidget({
  currentStageId,
  onNavigate,
  onOpenAiMentor,
  onCompleteChallenge,
  isCompletedToday,
}: DailyChallengeWidgetProps) {
  const [justCompleted, setJustCompleted] = useState(false);

  const today = new Date();
  const dateKey = today.toISOString().split('T')[0];
  const dateFormatted = today.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const task = STAGE_DAILY_CHALLENGES[currentStageId] || STAGE_DAILY_CHALLENGES['stage-0'];
  const completed = isCompletedToday || justCompleted;

  const handleClaim = () => {
    onCompleteChallenge(dateKey, task.xpReward, task.title, task.stageId);
    setJustCompleted(true);
  };

  const getCategoryIcon = (category: DailyMicroTask['category']) => {
    switch (category) {
      case 'Terminal':
        return <Terminal className="h-3.5 w-3.5 text-emerald-400" />;
      case 'Foundations':
        return <Calculator className="h-3.5 w-3.5 text-sky-400" />;
      case 'Git':
        return <GitBranch className="h-3.5 w-3.5 text-amber-400" />;
      case 'Code':
        return <Code2 className="h-3.5 w-3.5 text-sky-400" />;
      case 'Security':
        return <Shield className="h-3.5 w-3.5 text-emerald-400" />;
    }
  };

  return (
    <section
      className={`optical-panel rounded-2xl p-5 sm:p-6 transition-colors ${
        completed ? '!border-emerald-500/35' : ''
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-3xl">
          {/* Inline metadata line */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-mono text-slate-400 tabular-nums">
            <span className="inline-flex items-center gap-1.5 text-sky-400 font-medium uppercase tracking-wider">
              {getCategoryIcon(task.category)}
              <span>Daily Focus</span>
            </span>
            <span className="text-slate-600">·</span>
            <span>Stage {task.stageNumber}</span>
            <span className="text-slate-600">·</span>
            <span>{dateFormatted}</span>
            <span className="text-slate-600">·</span>
            <span>~{task.estimatedMinutes} min</span>
            <span className="text-slate-600">·</span>
            <span className="text-amber-400">+{task.xpReward} XP</span>
            {completed && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-emerald-400 font-semibold">Done today</span>
              </>
            )}
          </div>

          <h3 className="font-display text-base sm:text-lg font-semibold text-white tracking-tight">
            {task.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {task.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <SoapBubbleButton
            onClick={() => onNavigate(task.targetWorkspace, task.targetSubTab)}
            tint="rgb(14 165 233)"
            opacity={0.92}
            style={{ fontSize: 12 }}
            className="!min-h-[34px] !px-4 text-xs font-semibold text-white whitespace-nowrap"
          >
            <span>{task.actionLabel}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </SoapBubbleButton>

          {!completed ? (
            <button
              onClick={handleClaim}
              className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:text-emerald-300 cursor-pointer whitespace-nowrap"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Mark Complete</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-xs font-mono text-emerald-400 whitespace-nowrap">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>+{task.xpReward} XP logged</span>
            </span>
          )}

          <button
            onClick={() => onOpenAiMentor(task.hintPrompt)}
            className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:text-white cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <span>Hint</span>
          </button>
        </div>
      </div>
    </section>
  );
}
