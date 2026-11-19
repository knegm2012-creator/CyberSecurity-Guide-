'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Send,
  Bookmark,
  Trash2,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Shield,
  Zap,
  History,
  MessageSquare,
  Maximize2,
  Settings,
  Search,
  ChevronDown,
  Dumbbell,
  Play,
  Terminal,
  Compass,
  Move,
  Footprints,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  X,
} from 'lucide-react';
import { STAGES_DATA } from '@/lib/curriculum-data';
import { ADVENTURE_REALMS } from '@/lib/adventure-quest';
import {
  findCachedMentorMatch,
  formatQuotaResetCountdown,
  type MentorQuotaSnapshot,
  type MentorSavedRequestEntry,
} from '@/lib/mentor-quota';
import {
  BUDDY_POSITION_STORAGE_KEY,
  buildBuddyTrainingDeck,
  clampBuddyPosition,
  getCornerPosition,
  getNextRoamWaypoint,
  type BuddyCorner,
  type BuddyMovementMode,
  type BuddyPoint,
} from '@/lib/buddy-helper';
import type { PrimaryWorkspace } from '@/components/Navbar';

export type CompanionMood =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'celebrating'
  | 'limit';

export type CompanionTab = 'chat' | 'train' | 'saved';

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  source?: string;
  cached?: boolean;
}

let companionTurnSeq = 0;
function nextCompanionTurnId(prefix: string): string {
  companionTurnSeq += 1;
  return `${prefix}-${companionTurnSeq}`;
}

interface LiveMentorCompanionProps {
  isOpen: boolean;
  onToggleOpen: (open: boolean) => void;
  initialTab?: CompanionTab;
  workspace: PrimaryWorkspace;
  currentStageId: string;
  isCelebrating?: boolean;
  quotaSnapshot: MentorQuotaSnapshot | null;
  requestedDailyLimit: number;
  mentorHistory: MentorSavedRequestEntry[];
  onQuotaUpdated: (snapshot: MentorQuotaSnapshot) => void;
  onSaveRequest: (entry: Omit<MentorSavedRequestEntry, 'id' | 'createdAt'>) => void;
  onTogglePinRequest: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onClearUnpinnedHistory: () => void;
  onExpandFullMentor: (prompt?: string) => void;
  onOpenSettings: () => void;
  onNavigateWorkspace: (
    workspace: PrimaryWorkspace,
    subTab?: string,
    stageId?: string
  ) => void;
  onLaunchStageCode: (lang: 'python' | 'c', code: string) => void;
  onOpenQuickQuiz: () => void;
  onCompleteTrainingDrill: (stageId: string, questionTitle: string) => void;
}

const WORKSPACE_QUICK_PROMPTS: Record<PrimaryWorkspace, string[]> = {
  overview: [
    'What is my highest-leverage 15-minute study move right now?',
    'Explain how this stage connects to systems engineering.',
    'Give me one fast intuition check on this stage.',
  ],
  curriculum: [
    'Give me a 2-sentence analogy for this stage first.',
    'What common mistake do beginners make on this stage?',
    'Give me a tiny command or snippet to prove this concept.',
  ],
  lab: [
    'Why do C pointers cause segfaults if uninitialized?',
    'Compare stack vs heap memory in plain English.',
    'How does QuickSort vs MergeSort behave on worst-case input?',
  ],
  shell: [
    'How do pipes (|) and stdout redirection (>) differ in Bash?',
    'How do I find a hidden file or inspect chmod bits safely?',
    'Explain grep + find together in one real command.',
  ],
  reference: [
    'Summarize Big-O time & space tradeoffs in 4 lines.',
    'Compare TCP vs UDP when designing a real protocol.',
    'Give me a quick POSIX process/signal survival tip.',
  ],
};

function KineticDotFace({
  mood,
  size = 'md',
}: {
  mood: CompanionMood;
  size?: 'sm' | 'md';
}) {
  const dotDim = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';
  const dotColors =
    mood === 'celebrating'
      ? ['bg-emerald-400', 'bg-amber-300', 'bg-sky-400']
      : mood === 'limit'
      ? ['bg-amber-400', 'bg-rose-400', 'bg-amber-400']
      : mood === 'speaking'
      ? ['bg-sky-400', 'bg-cyan-300', 'bg-indigo-400']
      : mood === 'thinking'
      ? ['bg-cyan-300', 'bg-sky-400', 'bg-emerald-300']
      : mood === 'listening'
      ? ['bg-sky-300', 'bg-white', 'bg-sky-300']
      : ['bg-sky-400', 'bg-white', 'bg-cyan-300'];

  return (
    <div className="flex items-center justify-center gap-1" aria-hidden="true">
      {[0, 1, 2].map((idx) => {
        const anim =
          mood === 'thinking'
            ? {
                y: [0, -5, 0],
                scale: [1, 1.28, 1],
                opacity: [0.55, 1, 0.55],
              }
            : mood === 'speaking'
            ? {
                scaleY: [0.85, 1.85, 0.9, 1.5, 0.85],
                y: [0, -2.5, 0.5, -1.5, 0],
              }
            : mood === 'celebrating'
            ? {
                y: [0, -6, 0],
                scale: [1, 1.35, 1],
              }
            : mood === 'listening'
            ? {
                scale: [1, 1.2, 1],
                y: idx === 1 ? -1.5 : 0,
              }
            : mood === 'limit'
            ? {
                opacity: [0.45, 0.85, 0.45],
                scale: 0.9,
              }
            : {
                y: [0, idx === 1 ? -2 : -1, 0],
                scaleY: idx === 1 ? [1, 1, 0.3, 1, 1] : [1, 1, 0.35, 1, 1],
              };

        const transition =
          mood === 'thinking'
            ? {
                duration: 0.72,
                repeat: Infinity,
                delay: idx * 0.14,
                ease: 'easeInOut' as const,
              }
            : mood === 'speaking'
            ? {
                duration: 0.45,
                repeat: Infinity,
                delay: idx * 0.09,
                ease: 'easeInOut' as const,
              }
            : mood === 'celebrating'
            ? {
                duration: 0.6,
                repeat: Infinity,
                delay: idx * 0.1,
                ease: 'easeOut' as const,
              }
            : mood === 'limit'
            ? {
                duration: 1.8,
                repeat: Infinity,
                delay: idx * 0.2,
              }
            : {
                duration: 3.4,
                repeat: Infinity,
                delay: idx * 0.12,
                times: [0, 0.42, 0.47, 0.52, 1],
              };

        return (
          <motion.span
            key={idx}
            animate={anim}
            transition={transition}
            className={`${dotDim} rounded-full ${dotColors[idx]} shadow-[0_0_8px_currentColor]`}
          />
        );
      })}
    </div>
  );
}

export function LiveMentorCompanion({
  isOpen,
  onToggleOpen,
  initialTab = 'chat',
  workspace,
  currentStageId,
  isCelebrating = false,
  quotaSnapshot,
  requestedDailyLimit,
  mentorHistory,
  onQuotaUpdated,
  onSaveRequest,
  onTogglePinRequest,
  onDeleteRequest,
  onClearUnpinnedHistory,
  onExpandFullMentor,
  onOpenSettings,
  onNavigateWorkspace,
  onLaunchStageCode,
  onOpenQuickQuiz,
  onCompleteTrainingDrill,
}: LiveMentorCompanionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<CompanionTab>(initialTab);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [localCelebration, setLocalCelebration] = useState(false);
  const [preferOffline, setPreferOffline] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);
  const [historySearch, setHistorySearch] = useState('');
  const [savedFilter, setSavedFilter] = useState<'all' | 'pinned'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);

  // Training Deck interactive state
  const [drillIndex, setDrillIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [drillsClearedSession, setDrillsClearedSession] = useState(0);
  const [activeTipBubble, setActiveTipBubble] = useState<string | null>(null);

  // Interactive movement & roaming state
  const [viewportSize, setViewportSize] = useState<{ w: number; h: number }>({
    w: 1280,
    h: 800,
  });
  const [position, setPosition] = useState<BuddyPoint>({ x: 18, y: 720 });
  const [positionReady, setPositionReady] = useState(false);
  const [movementMode, setMovementMode] = useState<BuddyMovementMode>('docked');
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [roamStep, setRoamStep] = useState(0);

  const dragMetaRef = useRef<{
    active: boolean;
    moved: boolean;
    startClientX: number;
    startClientY: number;
    startPosX: number;
    startPosY: number;
  }>({
    active: false,
    moved: false,
    startClientX: 0,
    startClientY: 0,
    startPosX: 0,
    startPosY: 0,
  });

  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const stageObj = useMemo(
    () => STAGES_DATA.find((s) => s.id === currentStageId) || STAGES_DATA[0],
    [currentStageId]
  );

  const stageRealm = useMemo(
    () => ADVENTURE_REALMS.find((r) => r.stageId === stageObj.id) || ADVENTURE_REALMS[0],
    [stageObj.id]
  );

  const trainingDeck = useMemo(
    () => buildBuddyTrainingDeck(stageObj.id),
    [stageObj.id]
  );

  const activeDrill = trainingDeck[drillIndex % Math.max(1, trainingDeck.length)];

  const triggerBriefCelebration = useCallback(() => {
    setLocalCelebration(true);
    if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    celebrationTimerRef.current = setTimeout(() => setLocalCelebration(false), 2600);
  }, []);

  const persistBuddyLayout = useCallback((pt: BuddyPoint, mode: BuddyMovementMode) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        BUDDY_POSITION_STORAGE_KEY,
        JSON.stringify({ x: pt.x, y: pt.y, mode })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  // Initialize viewport & persisted position cleanly on mount + handle window resize
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromViewport = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setViewportSize({ w: vw, h: vh });

      let initialPt = getCornerPosition('bottom-left', vw, vh);
      let initialMode: BuddyMovementMode = 'docked';
      try {
        const raw = localStorage.getItem(BUDDY_POSITION_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { x?: number; y?: number; mode?: string };
          if (parsed.mode === 'roam' || parsed.mode === 'docked') {
            initialMode = parsed.mode;
          }
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            initialPt = clampBuddyPosition({ x: parsed.x, y: parsed.y }, vw, vh);
          }
        }
      } catch {
        // Ignore parse failure
      }
      setMovementMode(initialMode);
      setPosition(initialPt);
      setPositionReady(true);
    };

    const rafId = requestAnimationFrame(syncFromViewport);

    const handleResize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setViewportSize({ w: vw, h: vh });
      setPosition((prev) => clampBuddyPosition(prev, vw, vh));
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Autonomous roaming loop when enabled and undisturbed
  useEffect(() => {
    if (
      !positionReady ||
      movementMode !== 'roam' ||
      isOpen ||
      isDragging ||
      isHovered ||
      prefersReducedMotion
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setRoamStep((prev) => {
        const next = prev + 1;
        setPosition(getNextRoamWaypoint(next, viewportSize.w, viewportSize.h));
        return next;
      });
    }, 5200);

    return () => window.clearInterval(intervalId);
  }, [
    positionReady,
    movementMode,
    isOpen,
    isDragging,
    isHovered,
    prefersReducedMotion,
    viewportSize.w,
    viewportSize.h,
  ]);

  // Reset drill cursor when user advances to a new stage
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setDrillIndex(0);
      setSelectedOption(null);
    });
    return () => cancelAnimationFrame(rafId);
  }, [stageObj.id]);

  // Sync tab when parent requests opening on a specific view
  useEffect(() => {
    if (!isOpen) return;
    const rafId = requestAnimationFrame(() => {
      setActiveTab(initialTab);
      setNowMs(Date.now());
      setActiveTipBubble(null);
    });
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, initialTab]);

  // Cooldown 1s countdown when rate-limited
  useEffect(() => {
    if (cooldownSec <= 0) return;
    const tid = window.setInterval(() => {
      setCooldownSec((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(tid);
  }, [cooldownSec]);

  useEffect(() => {
    return () => {
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatTurns, isLoading]);

  // Pointer drag listeners
  const handlePillPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    dragMetaRef.current = {
      active: true,
      moved: false,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };

    const onMove = (ev: PointerEvent) => {
      if (!dragMetaRef.current.active) return;
      const dx = ev.clientX - dragMetaRef.current.startClientX;
      const dy = ev.clientY - dragMetaRef.current.startClientY;
      if (!dragMetaRef.current.moved && Math.hypot(dx, dy) >= 6) {
        dragMetaRef.current.moved = true;
        setIsDragging(true);
      }
      if (dragMetaRef.current.moved) {
        const clamped = clampBuddyPosition(
          {
            x: dragMetaRef.current.startPosX + dx,
            y: dragMetaRef.current.startPosY + dy,
          },
          window.innerWidth,
          window.innerHeight
        );
        setPosition(clamped);
      }
    };

    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const wasMoved = dragMetaRef.current.moved;
      const dx = ev.clientX - dragMetaRef.current.startClientX;
      const dy = ev.clientY - dragMetaRef.current.startClientY;
      dragMetaRef.current.active = false;
      setIsDragging(false);

      if (wasMoved) {
        const finalPt = clampBuddyPosition(
          {
            x: dragMetaRef.current.startPosX + dx,
            y: dragMetaRef.current.startPosY + dy,
          },
          window.innerWidth,
          window.innerHeight
        );
        setPosition(finalPt);
        persistBuddyLayout(finalPt, movementMode);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handlePillClick = () => {
    if (dragMetaRef.current.moved) {
      dragMetaRef.current.moved = false;
      return;
    }
    onToggleOpen(!isOpen);
  };

  const handleSnapCorner = (corner: BuddyCorner) => {
    const nextPt = getCornerPosition(corner, viewportSize.w, viewportSize.h);
    setMovementMode('docked');
    setPosition(nextPt);
    persistBuddyLayout(nextPt, 'docked');
  };

  const handleToggleRoam = () => {
    const nextMode: BuddyMovementMode = movementMode === 'roam' ? 'docked' : 'roam';
    setMovementMode(nextMode);
    if (nextMode === 'roam') {
      const nextWaypoint = getNextRoamWaypoint(roamStep + 1, viewportSize.w, viewportSize.h);
      setRoamStep((s) => s + 1);
      setPosition(nextWaypoint);
      persistBuddyLayout(nextWaypoint, nextMode);
    } else {
      persistBuddyLayout(position, nextMode);
    }
  };

  const handleNudgeBuddy = () => {
    triggerBriefCelebration();
    const tips = [
      `Stage ${stageObj.number} Tip: ${stageRealm.zeroJargonAnalogy}`,
      `Watch out: ${stageRealm.commonBeginnerTrap}`,
      `Core principle: ${stageRealm.firstPrinciples[0] || stageObj.goal}`,
    ];
    const nextTip = tips[(roamStep + drillsClearedSession) % tips.length];
    setActiveTipBubble(nextTip);
  };

  const effectiveDailyLimit = quotaSnapshot?.dailyLimit ?? requestedDailyLimit;
  const usedToday = quotaSnapshot?.usedToday ?? 0;
  const remainingToday = Math.max(0, effectiveDailyLimit - usedToday);
  const isDailyLimitHit = quotaSnapshot?.isDailyLimitReached ?? remainingToday <= 0;

  const mood: CompanionMood = isLoading
    ? 'thinking'
    : isCelebrating || localCelebration
    ? 'celebrating'
    : (isDailyLimitHit && !preferOffline) || cooldownSec > 0
    ? 'limit'
    : isSpeaking
    ? 'speaking'
    : isListening
    ? 'listening'
    : 'idle';

  const cachedMatch = useMemo(() => {
    if (!inputText.trim()) return null;
    return findCachedMentorMatch(mentorHistory, {
      mode: 'companion',
      stageId: stageObj.id,
      prompt: inputText,
    });
  }, [inputText, mentorHistory, stageObj.id]);

  const filteredSaved = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    return (mentorHistory || []).filter((item) => {
      if (savedFilter === 'pinned' && !item.pinned) return false;
      if (!q) return true;
      return (
        item.prompt.toLowerCase().includes(q) ||
        item.response.toLowerCase().includes(q) ||
        item.mode.toLowerCase().includes(q) ||
        item.stageId.toLowerCase().includes(q)
      );
    });
  }, [mentorHistory, historySearch, savedFilter]);

  const sendCompanionQuery = async (
    rawPrompt: string,
    options?: { bypassCache?: boolean; forceOffline?: boolean }
  ) => {
    const prompt = rawPrompt.trim();
    if (!prompt || isLoading) return;

    const useOffline = options?.forceOffline ?? preferOffline;

    if (!options?.bypassCache) {
      const hit = findCachedMentorMatch(mentorHistory, {
        mode: 'companion',
        stageId: stageObj.id,
        prompt,
      });
      if (hit) {
        setChatTurns((prev) => [
          ...prev,
          { id: nextCompanionTurnId('u'), role: 'user', text: prompt },
          {
            id: nextCompanionTurnId('a'),
            role: 'assistant',
            text: hit.response,
            source: hit.source,
            cached: true,
          },
        ]);
        setInputText('');
        setIsSpeaking(true);
        if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
        speakingTimerRef.current = setTimeout(() => setIsSpeaking(false), 2200);
        return;
      }
    }

    const userTurn: ChatTurn = {
      id: nextCompanionTurnId('u'),
      role: 'user',
      text: prompt,
    };
    const nextRecent = [...chatTurns.slice(-3), userTurn].map((t) => ({
      role: t.role,
      text: t.text,
    }));

    setChatTurns((prev) => [...prev, userTurn]);
    setInputText('');
    setIsLoading(true);
    setIsSpeaking(false);

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'companion',
          stageId: stageObj.id,
          stageTitle: `Stage ${stageObj.number}: ${stageObj.title}`,
          workspace,
          promptText: prompt,
          requestedDailyLimit,
          preferOffline: useOffline,
          recentHistory: nextRecent,
        }),
      });

      const data = await res.json();
      if (data?.quota) {
        onQuotaUpdated(data.quota as MentorQuotaSnapshot);
      }
      if (typeof data?.retryAfterSec === 'number' && data.retryAfterSec > 0) {
        setCooldownSec(data.retryAfterSec);
      }

      if (!res.ok || data.error) {
        setChatTurns((prev) => [
          ...prev,
          {
            id: nextCompanionTurnId('err'),
            role: 'assistant',
            text: `${data.error || `Request failed (${res.status})`} — Toggle "Offline Free" above to keep chatting without quota.`,
            source: 'limit-notice',
          },
        ]);
        return;
      }

      const replyText = typeof data.result === 'string' ? data.result : '';
      const replySource = typeof data.source === 'string' ? data.source : 'local';

      setChatTurns((prev) => [
        ...prev,
        {
          id: nextCompanionTurnId('a'),
          role: 'assistant',
          text: replyText,
          source: replySource,
        },
      ]);

      onSaveRequest({
        mode: 'companion',
        stageId: stageObj.id,
        workspace,
        prompt,
        response: replyText,
        source: replySource,
      });

      setIsSpeaking(true);
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
      speakingTimerRef.current = setTimeout(() => setIsSpeaking(false), 3200);
    } catch {
      setChatTurns((prev) => [
        ...prev,
        {
          id: nextCompanionTurnId('err'),
          role: 'assistant',
          text: 'Network error reaching the mentor endpoint. Switch to "Offline Free" for instant offline guidance.',
          source: 'error',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1600);
  };

  const handleAnswerDrill = (optIdx: number) => {
    if (selectedOption !== null || !activeDrill) return;
    setSelectedOption(optIdx);
    if (optIdx === activeDrill.correctIndex) {
      setDrillsClearedSession((c) => c + 1);
      triggerBriefCelebration();
      onCompleteTrainingDrill(stageObj.id, activeDrill.question);
    }
  };

  const quickPrompts = WORKSPACE_QUICK_PROMPTS[workspace] || WORKSPACE_QUICK_PROMPTS.overview;
  const resetCountdown = quotaSnapshot
    ? formatQuotaResetCountdown(quotaSnapshot.resetsAtIso, nowMs)
    : '24h';
  const quotaPct = Math.min(100, Math.round((usedToday / Math.max(1, effectiveDailyLimit)) * 100));

  // Smart anchoring inside viewport bounds
  const openBelow = position.y < viewportSize.h * 0.48;
  const alignRight = position.x > viewportSize.w * 0.56;

  if (!positionReady) return null;

  return (
    <motion.div
      style={{ top: 0, left: 0 }}
      initial={false}
      animate={{ x: position.x, y: position.y }}
      transition={
        isDragging
          ? { duration: 0 }
          : { type: 'spring', stiffness: 175, damping: 24, mass: 0.9 }
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed z-40 pointer-events-none select-none"
    >
      <div className="relative pointer-events-auto">
        {/* Popover anchored relative to movable Buddy pill */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="odyssey-buddy-popover"
              initial={{ opacity: 0, y: openBelow ? -10 : 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: openBelow ? -8 : 10, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-label="Odyssey Buddy Interactive Mentor & Trainer"
              className={`absolute ${
                openBelow ? 'top-[58px]' : 'bottom-[58px]'
              } ${
                alignRight ? 'right-0' : 'left-0'
              } optical-panel w-[min(420px,calc(100vw-2rem))] max-h-[min(600px,calc(100vh-8rem))] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/15 flex flex-col overflow-hidden`}
            >
              {/* Header */}
              <div className="bg-[#060b16] text-white px-4 py-3 flex items-center justify-between gap-2 border-b border-white/10">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={handleNudgeBuddy}
                    title="High-five Odyssey Buddy for a quick Stage tip!"
                    className="h-8 w-11 rounded-xl bg-white/[0.06] border border-white/15 flex items-center justify-center shrink-0 hover:border-sky-400/60 transition-colors cursor-pointer"
                  >
                    <KineticDotFace mood={mood} size="md" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-display font-bold tracking-tight whitespace-nowrap">
                        Odyssey Buddy
                      </span>
                      <span aria-hidden="true" className="text-slate-500">·</span>
                      <span className="font-mono text-[11px] text-sky-300 tabular-nums whitespace-nowrap">
                        Stage {stageObj.number}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      {mood === 'thinking'
                        ? 'Thinking through your question...'
                        : mood === 'speaking'
                        ? 'Sharing live guidance'
                        : mood === 'celebrating'
                        ? 'Great work! Celebrating progress'
                        : mood === 'limit'
                        ? cooldownSec > 0
                          ? `Burst cooldown (${cooldownSec}s) · Train & Offline free`
                          : `Daily limit reached · Train & Offline free`
                        : `${movementMode === 'roam' ? 'Roaming active' : 'Docked'} · Drag anywhere`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleToggleRoam}
                    className={`rounded-lg px-2 py-1 text-[10px] font-mono inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                      movementMode === 'roam'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                    title={
                      movementMode === 'roam'
                        ? 'Pause autonomous roaming'
                        : 'Let Buddy gently roam along screen edges'
                    }
                  >
                    <Footprints className="h-3 w-3" />
                    <span>{movementMode === 'roam' ? 'Roam On' : 'Roam'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onExpandFullMentor(inputText || undefined)}
                    className="rounded-lg p-1.5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Open full AI Study Mentor drawer"
                    aria-label="Expand full AI Mentor"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="rounded-lg p-1.5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Configure request limits & companion settings"
                    aria-label="Open quota and companion settings"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleOpen(false)}
                    className="rounded-lg p-1.5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Minimize Odyssey Buddy"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Live Quota & Mode Strip */}
              <div className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/90 dark:bg-[#050914]/90 px-3.5 py-2 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold tabular-nums">
                    <Shield className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                    <span>
                      Quota: {usedToday}/{effectiveDailyLimit} ({remainingToday} left)
                    </span>
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                    Burst {quotaSnapshot?.burstRemaining ?? 30}/{quotaSnapshot?.burstCapacity ?? 30} · Reset {resetCountdown}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/[0.08] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      quotaPct >= 95
                        ? 'bg-rose-500'
                        : quotaPct >= 75
                        ? 'bg-amber-500'
                        : 'bg-sky-500'
                    }`}
                    style={{ width: `${quotaPct}%` }}
                  />
                </div>

                {/* Primary Interactive Tabs */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-white/[0.06] p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setActiveTab('chat')}
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        activeTab === 'chat'
                          ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-sm font-semibold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span>Chat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('train')}
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        activeTab === 'train'
                          ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-sm font-semibold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      <Dumbbell className="h-3 w-3" />
                      <span>Train &amp; Help</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('saved')}
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                        activeTab === 'saved'
                          ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-sm font-semibold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      <History className="h-3 w-3" />
                      <span>Saved ({mentorHistory.length})</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreferOffline((p) => !p)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-mono cursor-pointer transition-colors whitespace-nowrap ${
                      preferOffline
                        ? 'border-emerald-500/45 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-semibold'
                        : 'border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300'
                    }`}
                    title="Offline Free mode does not consume your daily request limit"
                  >
                    <Zap className="h-2.5 w-2.5" />
                    <span>{preferOffline ? 'Offline Free' : 'Live Quota'}</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: Partner Chat */}
              {activeTab === 'chat' && (
                <>
                  <div
                    ref={chatScrollRef}
                    className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 min-h-[210px] max-h-[300px]"
                  >
                    {chatTurns.length === 0 ? (
                      <div className="space-y-3">
                        <div className="optical-inset rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          Drag me anywhere on your screen, run interactive drills in{' '}
                          <button
                            type="button"
                            onClick={() => setActiveTab('train')}
                            className="font-semibold text-sky-700 dark:text-sky-300 underline cursor-pointer"
                          >
                            Train &amp; Help
                          </button>
                          , or ask me anything about{' '}
                          <span className="font-mono">
                            Stage {stageObj.number} ({stageObj.title.split(':')[0]})
                          </span>
                          .
                        </div>

                        <div className="space-y-1.5">
                          <div className="text-[10px] font-mono text-slate-500">
                            Quick prompts for {workspace}
                          </div>
                          {quickPrompts.map((qp) => (
                            <button
                              key={qp}
                              type="button"
                              onClick={() => sendCompanionQuery(qp)}
                              className="w-full text-left optical-card rounded-xl px-3 py-2 text-[11px] text-slate-700 dark:text-slate-200 hover:border-sky-500/40 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
                            >
                              {qp}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      chatTurns.map((turn) => (
                        <div
                          key={turn.id}
                          className={`flex flex-col ${
                            turn.role === 'user' ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`max-w-[92%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                              turn.role === 'user'
                                ? 'bg-sky-600 text-white rounded-br-sm'
                                : 'optical-inset text-slate-800 dark:text-slate-200 rounded-bl-sm'
                            }`}
                          >
                            {turn.text}
                            {turn.role === 'assistant' && turn.source && (
                              <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-slate-200/70 dark:border-white/[0.08] pt-1 text-[9px] font-mono text-slate-500 dark:text-slate-400">
                                <span>
                                  {turn.cached
                                    ? 'Saved Cache · 0 quota used'
                                    : turn.source === 'gemini'
                                    ? 'Gemini Live'
                                    : turn.source === 'local'
                                    ? 'Offline CS Engine'
                                    : turn.source}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(turn.id, turn.text)}
                                  className="inline-flex items-center gap-0.5 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                >
                                  {copiedId === turn.id ? (
                                    <>
                                      <Check className="h-2.5 w-2.5 text-emerald-500" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-2.5 w-2.5" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}

                    {isLoading && (
                      <div className="flex items-center gap-2 optical-inset rounded-xl px-3 py-2 w-fit text-[11px] font-mono text-slate-600 dark:text-slate-300">
                        <KineticDotFace mood="thinking" size="sm" />
                        <span>Working on it...</span>
                      </div>
                    )}
                  </div>

                  {cachedMatch && (
                    <div className="mx-3.5 mb-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 flex items-center justify-between gap-2 text-[10px] font-mono text-emerald-800 dark:text-emerald-200">
                      <span className="truncate">
                        Saved answer found — instant replay uses 0 quota
                      </span>
                      <button
                        type="button"
                        onClick={() => sendCompanionQuery(inputText, { bypassCache: true })}
                        className="shrink-0 underline font-semibold cursor-pointer"
                      >
                        Ask Fresh
                      </button>
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendCompanionQuery(inputText);
                    }}
                    className="border-t border-slate-200 dark:border-white/[0.08] bg-slate-50/90 dark:bg-[#050914]/90 p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inputText}
                        onFocus={() => setIsListening(true)}
                        onBlur={() => setIsListening(false)}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={
                          isDailyLimitHit && !preferOffline
                            ? 'Daily limit reached — switch to Offline Free...'
                            : `Ask Buddy about Stage ${stageObj.number}...`
                        }
                        className="flex-1 rounded-xl border border-slate-300 dark:border-white/[0.12] bg-white dark:bg-[#080f1f] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !inputText.trim() || cooldownSec > 0}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-45 text-white transition-colors cursor-pointer shrink-0"
                        aria-label="Send message to Odyssey Buddy"
                      >
                        {isLoading ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    {chatTurns.length > 0 && (
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <button
                          type="button"
                          onClick={() => setChatTurns([])}
                          className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          Clear thread (history stays saved)
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('saved')}
                          className="text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                        >
                          View {mentorHistory.length} saved
                        </button>
                      </div>
                    )}
                  </form>
                </>
              )}

              {/* TAB 2: Interactive Training Drills & Direct Help */}
              {activeTab === 'train' && (
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 max-h-[410px]">
                  {/* Active Rapid Drill */}
                  {activeDrill && (
                    <div className="optical-inset rounded-xl p-3 space-y-2.5 border border-slate-200 dark:border-white/[0.08]">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-sky-700 dark:text-sky-300">
                          Stage {stageObj.number} Drill {(drillIndex % trainingDeck.length) + 1}/{trainingDeck.length}
                        </span>
                        <span className="tabular-nums">
                          Solved today: {drillsClearedSession} · 0 quota
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-950 dark:text-white leading-snug">
                        {activeDrill.question}
                      </div>

                      <div className="space-y-1.5">
                        {activeDrill.options.map((opt, idx) => {
                          const answered = selectedOption !== null;
                          const isPicked = selectedOption === idx;
                          const isCorrect = idx === activeDrill.correctIndex;

                          let btnClass =
                            'border-slate-200 dark:border-white/10 bg-white dark:bg-[#081022] text-slate-700 dark:text-slate-200 hover:border-sky-500/40';
                          if (answered) {
                            if (isCorrect) {
                              btnClass =
                                'border-emerald-500/60 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 font-semibold';
                            } else if (isPicked) {
                              btnClass =
                                'border-rose-500/60 bg-rose-500/15 text-rose-800 dark:text-rose-200 line-through';
                            }
                          }

                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={answered}
                              onClick={() => handleAnswerDrill(idx)}
                              className={`w-full text-left rounded-lg border px-2.5 py-2 text-[11px] transition-colors flex items-center justify-between gap-2 cursor-pointer ${btnClass}`}
                            >
                              <span>{opt}</span>
                              {answered && isCorrect && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {selectedOption !== null && (
                        <div className="rounded-lg bg-slate-100 dark:bg-white/[0.05] p-2.5 space-y-2 text-[11px] text-slate-700 dark:text-slate-300">
                          <div>
                            <strong className="text-slate-900 dark:text-white">
                              {selectedOption === activeDrill.correctIndex
                                ? 'Verified (+5m practice XP logged): '
                                : 'Explanation: '}
                            </strong>
                            {activeDrill.explanation}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOption(null);
                              setDrillIndex((i) => (i + 1) % trainingDeck.length);
                            }}
                            className="inline-flex items-center gap-1 font-mono font-semibold text-sky-700 dark:text-sky-300 hover:underline cursor-pointer"
                          >
                            <span>Next Training Drill</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Analogy & Trap Card */}
                  <div className="optical-inset rounded-xl p-3 space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                      <span>{stageRealm.realmName} Intuition &amp; Pitfall</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {stageRealm.zeroJargonAnalogy}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed pt-0.5">
                      <strong className="text-slate-700 dark:text-slate-200">Watch out:</strong>{' '}
                      {stageRealm.commonBeginnerTrap}
                    </p>
                  </div>

                  {/* Direct Interactive Help Actions */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Companion Actions · Jump &amp; Practice
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onLaunchStageCode(
                            stageRealm.playgroundStarter.language,
                            stageRealm.playgroundStarter.code
                          );
                          onToggleOpen(false);
                        }}
                        className="optical-card rounded-xl px-2.5 py-2 text-left text-[11px] font-medium text-slate-800 dark:text-slate-200 hover:border-sky-500/45 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">
                          Run Stage {stageObj.number} {stageRealm.playgroundStarter.language.toUpperCase()}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onNavigateWorkspace('curriculum', 'quest', stageObj.id);
                          onToggleOpen(false);
                        }}
                        className="optical-card rounded-xl px-2.5 py-2 text-left text-[11px] font-medium text-slate-800 dark:text-slate-200 hover:border-sky-500/45 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Compass className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                        <span className="truncate">Adventure Quest</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onNavigateWorkspace('shell');
                          onToggleOpen(false);
                        }}
                        className="optical-card rounded-xl px-2.5 py-2 text-left text-[11px] font-medium text-slate-800 dark:text-slate-200 hover:border-sky-500/45 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Terminal className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">Open Linux Shell</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onOpenQuickQuiz();
                          onToggleOpen(false);
                        }}
                        className="optical-card rounded-xl px-2.5 py-2 text-left text-[11px] font-medium text-slate-800 dark:text-slate-200 hover:border-sky-500/45 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                        <span className="truncate">Full Stage Quiz</span>
                      </button>
                    </div>
                  </div>

                  {/* Position & Movement Dock Presets */}
                  <div className="border-t border-slate-200 dark:border-white/[0.08] pt-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <Move className="h-3 w-3" />
                      <span>Move Buddy:</span>
                    </span>
                    <div className="flex items-center gap-1">
                      {(
                        [
                          { id: 'bottom-left', label: 'BL' },
                          { id: 'bottom-right', label: 'BR' },
                          { id: 'top-left', label: 'TL' },
                          { id: 'top-right', label: 'TR' },
                        ] as const
                      ).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSnapCorner(c.id)}
                          className="rounded border border-slate-300 dark:border-white/15 px-1.5 py-0.5 text-slate-700 dark:text-slate-300 hover:border-sky-500 cursor-pointer"
                        >
                          {c.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleToggleRoam}
                        className={`rounded border px-2 py-0.5 cursor-pointer ${
                          movementMode === 'roam'
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold'
                            : 'border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {movementMode === 'roam' ? 'Stop Roam' : 'Auto Roam'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Saved Requests & Quota */}
              {activeTab === 'saved' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-slate-200 dark:border-white/[0.08] space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="h-3 w-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={historySearch}
                          onChange={(e) => setHistorySearch(e.target.value)}
                          placeholder="Filter saved requests..."
                          className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#080f1f] pl-7 pr-2.5 py-1.5 text-[11px] text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setSavedFilter((f) => (f === 'all' ? 'pinned' : 'all'))}
                        className={`rounded-lg border px-2 py-1.5 text-[10px] font-mono cursor-pointer whitespace-nowrap ${
                          savedFilter === 'pinned'
                            ? 'border-amber-500/45 bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold'
                            : 'border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {savedFilter === 'pinned' ? 'Pinned Only' : 'All Saved'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>
                        Showing {filteredSaved.length} saved request{filteredSaved.length === 1 ? '' : 's'}
                      </span>
                      {mentorHistory.some((h) => !h.pinned) && (
                        <button
                          type="button"
                          onClick={onClearUnpinnedHistory}
                          className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                        >
                          Clear unpinned
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[310px]">
                    {filteredSaved.length === 0 ? (
                      <div className="py-10 text-center text-xs text-slate-500 space-y-1">
                        <Sparkles className="h-5 w-5 mx-auto text-sky-500/70" />
                        <p>No saved requests match this filter yet.</p>
                        <p className="text-[11px]">Ask Buddy or use AI Study Mentor to auto-save.</p>
                      </div>
                    ) : (
                      filteredSaved.map((item) => (
                        <div
                          key={item.id}
                          className="optical-inset rounded-xl p-2.5 space-y-1.5 border border-slate-200/80 dark:border-white/[0.06]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                                <span className="uppercase text-sky-700 dark:text-sky-400 font-semibold">
                                  {item.mode}
                                </span>
                                <span>·</span>
                                <span>{item.stageId}</span>
                                <span>·</span>
                                <span>{item.source}</span>
                              </div>
                              <div className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                                {item.prompt}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => onTogglePinRequest(item.id)}
                                className={`p-1 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 cursor-pointer ${
                                  item.pinned
                                    ? 'text-amber-500'
                                    : 'text-slate-400 hover:text-amber-500'
                                }`}
                                title={item.pinned ? 'Unpin saved request' : 'Pin saved request'}
                                aria-label={item.pinned ? 'Unpin request' : 'Pin request'}
                              >
                                <Bookmark className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopy(item.id, item.response)}
                                className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 cursor-pointer"
                                title="Copy response"
                                aria-label="Copy saved response"
                              >
                                {copiedId === item.id ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteRequest(item.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-200/70 dark:hover:bg-white/10 cursor-pointer"
                                title="Delete saved request"
                                aria-label="Delete saved request"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 whitespace-pre-wrap">
                            {item.response}
                          </p>

                          <div className="flex items-center justify-between pt-0.5 text-[10px] font-mono">
                            <span className="text-slate-400">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('chat');
                                setChatTurns((prev) => [
                                  ...prev,
                                  { id: nextCompanionTurnId('u'), role: 'user', text: item.prompt },
                                  {
                                    id: nextCompanionTurnId('a'),
                                    role: 'assistant',
                                    text: item.response,
                                    source: item.source,
                                    cached: true,
                                  },
                                ]);
                              }}
                              className="text-sky-700 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                            >
                              Replay (0 quota)
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Speech Tip Bubble when nudged while closed */}
        <AnimatePresence>
          {!isOpen && activeTipBubble && (
            <motion.div
              key="buddy-tip-bubble"
              initial={{ opacity: 0, y: 6, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.94 }}
              className={`absolute ${
                openBelow ? 'top-[56px]' : 'bottom-[56px]'
              } ${
                alignRight ? 'right-0' : 'left-0'
              } w-[250px] optical-panel rounded-xl border border-sky-500/30 p-3 shadow-xl text-[11px] text-slate-800 dark:text-slate-100 space-y-2`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="leading-snug">{activeTipBubble}</p>
                <button
                  type="button"
                  onClick={() => setActiveTipBubble(null)}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer shrink-0"
                  aria-label="Close tip"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTipBubble(null);
                    setActiveTab('train');
                    onToggleOpen(true);
                  }}
                  className="text-sky-700 dark:text-sky-300 font-semibold hover:underline cursor-pointer"
                >
                  Start 30s Drill →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Movable Draggable Floating Kinetic Dot Mascot Pill */}
        <div className="flex items-center gap-1.5">
          <motion.button
            type="button"
            whileHover={{ scale: isDragging ? 1 : 1.03 }}
            whileTap={{ scale: 0.97 }}
            onPointerDown={handlePillPointerDown}
            onClick={handlePillClick}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleNudgeBuddy();
            }}
            aria-expanded={isOpen}
            aria-label="Odyssey Buddy — drag to move, click to open mentor and training"
            className={`group flex items-center gap-2.5 rounded-full border px-3 py-2 shadow-xl transition-colors backdrop-blur-md ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab active:cursor-grabbing'
            } ${
              isCelebrating || localCelebration
                ? 'border-emerald-400/60 bg-[#071915]/95 text-emerald-100'
                : isDailyLimitHit && !preferOffline
                ? 'border-amber-400/60 bg-[#140e07]/95 text-amber-100'
                : 'border-white/20 bg-[#060b16]/95 text-white hover:border-sky-400/50'
            }`}
          >
            <span className="flex h-6 w-9 items-center justify-center rounded-full bg-white/[0.08] border border-white/10">
              <KineticDotFace mood={mood} size="sm" />
            </span>

            <div className="flex flex-col items-start leading-none">
              <span className="font-display text-[11px] font-bold tracking-tight whitespace-nowrap">
                Odyssey Buddy
              </span>
              <span className="text-[9px] font-mono text-slate-300 tabular-nums mt-0.5 whitespace-nowrap">
                {remainingToday}/{effectiveDailyLimit} left · {mentorHistory.length} saved
              </span>
            </div>
          </motion.button>

          {!isOpen && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('train');
                onToggleOpen(true);
              }}
              title={`Train Stage ${stageObj.number} & Help Actions`}
              aria-label="Open Odyssey Buddy Training Drill"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-[#060b16]/90 text-sky-300 hover:text-white hover:border-sky-400/50 shadow-lg backdrop-blur-md transition-colors cursor-pointer"
            >
              <Dumbbell className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
