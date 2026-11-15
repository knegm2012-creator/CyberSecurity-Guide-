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
    stageTitle: 'Basics: Binary & Digital Foundations',
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
    stageTitle: 'Python: Beginner to Independent Scripts',
    title: 'Write a Frequency-Counter Dictionary Script',
    description:
      'Open the Code Playground and run a Python frequency counter using dict.get(key, 0) cleanly with boundary edge cases.',
    estimatedMinutes: 6,
    xpReward: 25,
    category: 'Code',
    actionLabel: 'Open Code Lab',
    targetWorkspace: 'lab',
    targetSubTab: 'playground',
    hintPrompt:
      'Show how dict.get(word, 0) in Python avoids KeyError when counting word or IP frequencies.',
  },
  'stage-2': {
    id: 'ch-s2',
    stageId: 'stage-2',
    stageNumber: 2,
    stageTitle: 'CS Foundations & Digital Logic',
    title: 'Wire a Half-Adder & Trace Fetch-Decode-Execute',
    description:
      'Launch the Foundations lab to simulate AND/XOR logic gates producing binary Sum & Carry bits alongside memory cache latency comparisons.',
    estimatedMinutes: 6,
    xpReward: 25,
    category: 'Foundations',
    actionLabel: 'Open Logic Lab',
    targetWorkspace: 'lab',
    targetSubTab: 'foundations',
    hintPrompt:
      'Explain how chaining XOR + AND gates builds a Half Adder and why L1 SRAM cache beats DRAM latency.',
  },
  'stage-3': {
    id: 'ch-s3',
    stageId: 'stage-3',
    stageNumber: 3,
    stageTitle: 'Git, Linux & Operating Systems',
    title: 'Solve Citadel Level 0 & Construct a Git Branch DAG',
    description:
      'Inspect hidden dotfiles in Wargame Shell (offline sandbox or SSH bridge) or commit onto a feature branch inside Git DAG Studio.',
    estimatedMinutes: 8,
    xpReward: 35,
    category: 'Terminal',
    actionLabel: 'Launch Shell',
    targetWorkspace: 'shell',
    hintPrompt:
      'Explain ls -la, dashed filenames like cat ./-, and how Git stores commits as an immutable DAG.',
  },
  'stage-4': {
    id: 'ch-s4',
    stageId: 'stage-4',
    stageNumber: 4,
    stageTitle: 'Networking Fundamentals & Protocols',
    title: 'Trace the 6-Hop DNS, TCP Handshake & TLS Flow',
    description:
      'Walk through the live Packet Journey in Systems Lab from ARP/DNS lookup across the TCP 3-way handshake and TLS 1.3 negotiation.',
    estimatedMinutes: 6,
    xpReward: 25,
    category: 'Foundations',
    actionLabel: 'Open Packet Tracer',
    targetWorkspace: 'lab',
    targetSubTab: 'packet',
    hintPrompt:
      'Walk through the TCP 3-way handshake (SYN, SYN-ACK, ACK) and sequence number acknowledgment.',
  },
  'stage-5': {
    id: 'ch-s5',
    stageId: 'stage-5',
    stageNumber: 5,
    stageTitle: 'Web Basics & SQL Databases',
    title: 'Compare Parameterized SQL vs Injection Vectors',
    description:
      'Test Prepared Statements and sqlite3 queries cleanly inside the Code Playground and verify why bound parameters prevent SQL injection.',
    estimatedMinutes: 7,
    xpReward: 30,
    category: 'Security',
    actionLabel: 'Open Code Lab',
    targetWorkspace: 'lab',
    targetSubTab: 'playground',
    hintPrompt:
      'Why do parameterized SQL statements completely neutralize classic OR 1=1 injection payloads?',
  },
  'stage-6': {
    id: 'ch-s6',
    stageId: 'stage-6',
    stageNumber: 6,
    stageTitle: 'C Programming & Memory Foundations',
    title: 'Pointer Dereferencing & Heap Lifetime Audit',
    description:
      'Inspect the RAM Address Grid in Systems Lab to trace how *ptr mutates 0x1000 directly and verify balanced malloc/free heap ownership.',
    estimatedMinutes: 7,
    xpReward: 30,
    category: 'Code',
    actionLabel: 'Open Memory Lab',
    targetWorkspace: 'lab',
    targetSubTab: 'memory',
    hintPrompt:
      'Explain pointer arithmetic and dereferencing in C: why ptr + 1 advances by sizeof(*ptr) bytes.',
  },
  'stage-7': {
    id: 'ch-s7',
    stageId: 'stage-7',
    stageNumber: 7,
    stageTitle: 'Modern C++: Systems & RAII',
    title: 'Model Deterministic RAII Scoped Ownership',
    description:
      'Compare manual C cleanup against deterministic RAII destructors, bounds-checked std::vector.at(), and unique_ptr single ownership.',
    estimatedMinutes: 6,
    xpReward: 25,
    category: 'Code',
    actionLabel: 'Open Stage 7',
    targetWorkspace: 'curriculum',
    targetSubTab: 'stages',
    hintPrompt:
      'How does RAII eliminate resource leaks on early returns or exceptions compared to manual malloc/free?',
  },
  'stage-8': {
    id: 'ch-s8',
    stageId: 'stage-8',
    stageNumber: 8,
    stageTitle: 'Go (Golang): CLI Tools & Microservices',
    title: 'Design Bounded-Timeout HTTP & Worker Pipelines',
    description:
      'Test a Python fan-out deadline model or inspect Go context.WithTimeout and explicit (val, error) handling patterns in Stage 8.',
    estimatedMinutes: 6,
    xpReward: 25,
    category: 'Code',
    actionLabel: 'Open Code Lab',
    targetWorkspace: 'lab',
    targetSubTab: 'playground',
    hintPrompt:
      'Why must Go net/http servers and clients always attach explicit timeouts and context cancellation?',
  },
  'stage-9': {
    id: 'ch-s9',
    stageId: 'stage-9',
    stageNumber: 9,
    stageTitle: 'x86-64 Assembly & Reverse Engineering',
    title: 'Decode ELF Magic Headers & Calling Convention Registers',
    description:
      'Run the Python ELF magic parser or inspect System V AMD64 registers (RDI, RSI, RAX, RIP, RSP) in Stage 9.',
    estimatedMinutes: 7,
    xpReward: 30,
    category: 'Terminal',
    actionLabel: 'Open Shell',
    targetWorkspace: 'shell',
    hintPrompt:
      'Explain the System V AMD64 calling convention registers RDI, RSI, RDX, RAX, and RIP.',
  },
  'stage-10': {
    id: 'ch-s10',
    stageId: 'stage-10',
    stageNumber: 10,
    stageTitle: 'Cybersecurity Fundamentals & Legal Labs',
    title: 'Distinguish Salted Hashing vs Authenticated Encryption',
    description:
      'Verify SHA-256 + random salt vs Base64 encoding inside the Code Playground and review CIA Triad defenses in Stage 10.',
    estimatedMinutes: 7,
    xpReward: 30,
    category: 'Security',
    actionLabel: 'Open Code Lab',
    targetWorkspace: 'lab',
    targetSubTab: 'playground',
    hintPrompt:
      'Compare cryptographic hashing (SHA-256/Argon2id), symmetric encryption (AES-GCM), and Base64 encoding.',
  },
  'stage-11': {
    id: 'ch-s11',
    stageId: 'stage-11',
    stageNumber: 11,
    stageTitle: 'Portfolio, Specialization & College Prep',
    title: 'Audit Project Acceptance Criteria & README',
    description:
      'Open the 16 Portfolio Projects in Curriculum, review acceptance criteria for your active build, and generate a clean README.',
    estimatedMinutes: 8,
    xpReward: 35,
    category: 'Git',
    actionLabel: 'Open Portfolio',
    targetWorkspace: 'curriculum',
    targetSubTab: 'projects',
    hintPrompt:
      'What makes a systems engineering GitHub README compelling to technical reviewers?',
  },
  'stage-12': {
    id: 'ch-s12',
    stageId: 'stage-12',
    stageNumber: 12,
    stageTitle: 'Algorithms, Trees & Graph Traversal',
    title: "Trace Dijkstra's Shortest-Path Relaxation Live",
    description:
      'Launch the Algorithms & Graphs Visualizer, run Dijkstra on a weighted graph, and trace how priority-queue relaxations lock shortest distances.',
    estimatedMinutes: 8,
    xpReward: 35,
    category: 'Code',
    actionLabel: 'Open Graph Lab',
    targetWorkspace: 'lab',
    targetSubTab: 'visualizer',
    hintPrompt:
      "Explain why Dijkstra's algorithm requires non-negative edge weights and how its min-heap achieves O((V + E) log V).",
  },
  'stage-13': {
    id: 'ch-s13',
    stageId: 'stage-13',
    stageNumber: 13,
    stageTitle: 'Compilers, SSA IR & Distributed Consensus',
    title: 'Inspect AST Parsing & Raft Quorum Consensus',
    description:
      'Compare complexity curves and compiler/consensus mental models inside Systems Lab and verify your Stage 13 Exit Gate criteria.',
    estimatedMinutes: 9,
    xpReward: 40,
    category: 'Foundations',
    actionLabel: 'Open Complexity Lab',
    targetWorkspace: 'lab',
    targetSubTab: 'complexity',
    hintPrompt:
      'Explain how Static Single Assignment (SSA) simplifies compiler optimization and how Raft maintains quorum consensus.',
  },
  'stage-14': {
    id: 'ch-s14',
    stageId: 'stage-14',
    stageNumber: 14,
    stageTitle: 'Cloud Native Systems, Containers & SRE',
    title: 'Simulate Kubernetes Reconciliation & p99 Tail Latency',
    description:
      'Run Stage 14 reconciliation or p99 SLO error-budget calculators in the Code Playground and inspect Linux container namespace isolation.',
    estimatedMinutes: 8,
    xpReward: 40,
    category: 'Terminal',
    actionLabel: 'Open Code Lab',
    targetWorkspace: 'lab',
    targetSubTab: 'playground',
    hintPrompt:
      'Explain how Linux namespaces + cgroups power containers and why p99 tail latency governs microservice SLOs.',
  },
  'stage-15': {
    id: 'ch-s15',
    stageId: 'stage-15',
    stageNumber: 15,
    stageTitle: 'Linear Algebra, Neural Nets & HPC Compute',
    title: 'Run Gradient Descent & Row-Major C Dot Product',
    description:
      'Execute pure-Python backpropagation or contiguous C11 dot products in the Code Playground and inspect attention scaling in Hero Hub.',
    estimatedMinutes: 9,
    xpReward: 45,
    category: 'Code',
    actionLabel: 'Open Code Lab',
    targetWorkspace: 'lab',
    targetSubTab: 'playground',
    hintPrompt:
      'Explain scaled dot-product attention (Q K^T / sqrt(d_k)) and why row-major stride speeds up C matrix loops.',
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
