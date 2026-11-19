'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import { useOdysseyStore } from '@/hooks/use-odyssey-store';
import { Navbar, PrimaryWorkspace } from '@/components/Navbar';
import type { CurriculumSubTab } from '@/components/CurriculumWorkspace';
import type { SystemsLabTab } from '@/components/SystemsLabWorkspace';
import type { ReferenceSubTab } from '@/components/ReferenceWorkspace';
import { SoapBubbleMaterial, SoapBubbleButton } from '@/components/soap-bubble';
import { SessionTimerFooterBar } from '@/components/SessionTimerFooterBar';
import type { PendingSessionPrompt } from '@/components/WorkspaceSwitchPromptModal';
import { FocusModeHUD } from '@/components/FocusModeHUD';
import {
  WORKSPACE_LABELS,
  THEME_STORAGE_KEY,
  SESSION_STORAGE_KEY,
  CATCH_UP_SESSION_MINUTES,
  evaluateCatchUpSuggestion,
  shouldPromptStudyLogOnSwitch,
  playFocusChime,
  type FocusTargetMinutes,
  type AppTheme,
} from '@/lib/session-timer';
import { VisualMedalEmblem } from '@/components/BadgesCollection';
import { STAGES_DATA } from '@/lib/curriculum-data';
import { DEFAULT_MENTOR_DAILY_LIMIT, type MentorQuotaSnapshot } from '@/lib/mentor-quota';
import { Terminal, RotateCcw, AlertTriangle, X, FileDown, FolderGit2, CheckCircle2, Sparkles, ArrowRight, Settings } from 'lucide-react';

function WorkspaceLoadingFallback({ label }: { label: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="optical-panel flex items-center gap-3 rounded-2xl px-5 py-4 text-xs font-mono text-slate-600 dark:text-slate-300">
        <Terminal className="h-4 w-4 text-sky-600 dark:text-sky-400" />
        <span>Loading {label}...</span>
      </div>
    </div>
  );
}

const OverviewWorkspace = dynamic(
  () => import('@/components/OverviewWorkspace').then((m) => m.OverviewWorkspace),
  { loading: () => <WorkspaceLoadingFallback label="Overview Workspace" />, ssr: false }
);

const CurriculumWorkspace = dynamic(
  () => import('@/components/CurriculumWorkspace').then((m) => m.CurriculumWorkspace),
  { loading: () => <WorkspaceLoadingFallback label="Curriculum Workspace" /> }
);

const SystemsLabWorkspace = dynamic(
  () => import('@/components/SystemsLabWorkspace').then((m) => m.SystemsLabWorkspace),
  { loading: () => <WorkspaceLoadingFallback label="Systems Lab" />, ssr: false }
);

const TerminalSimulator = dynamic(
  () => import('@/components/TerminalSimulator').then((m) => m.TerminalSimulator),
  { loading: () => <WorkspaceLoadingFallback label="Interactive Shell" />, ssr: false }
);

const ReferenceWorkspace = dynamic(
  () => import('@/components/ReferenceWorkspace').then((m) => m.ReferenceWorkspace),
  { loading: () => <WorkspaceLoadingFallback label="Reference Library" /> }
);

const AiMentorPanel = dynamic(
  () => import('@/components/AiMentorPanel').then((m) => m.AiMentorPanel),
  { ssr: false }
);

const QuickQuizModal = dynamic(
  () => import('@/components/QuickQuizModal').then((m) => m.QuickQuizModal),
  { ssr: false }
);

const CheatSheetModal = dynamic(
  () => import('@/components/CheatSheetModal').then((m) => m.CheatSheetModal),
  { ssr: false }
);

const CommandPalette = dynamic(
  () => import('@/components/CommandPalette').then((m) => m.CommandPalette),
  { ssr: false }
);

const SystemsArcadeGame = dynamic(
  () => import('@/components/SystemsArcadeGame').then((m) => m.SystemsArcadeGame),
  { ssr: false }
);

const GitHubSyncModal = dynamic(
  () => import('@/components/GitHubSyncModal').then((m) => m.GitHubSyncModal),
  { ssr: false }
);

const WorkspaceSwitchPromptModal = dynamic(
  () =>
    import('@/components/WorkspaceSwitchPromptModal').then(
      (m) => m.WorkspaceSwitchPromptModal
    ),
  { ssr: false }
);

const SettingsModal = dynamic(
  () => import('@/components/SettingsModal').then((m) => m.SettingsModal),
  { ssr: false }
);

const CatchUpNotificationBanner = dynamic(
  () =>
    import('@/components/CatchUpNotificationBanner').then(
      (m) => m.CatchUpNotificationBanner
    ),
  { ssr: false }
);

const LiveMentorCompanion = dynamic(
  () =>
    import('@/components/LiveMentorCompanion').then(
      (m) => m.LiveMentorCompanion
    ),
  { ssr: false }
);

export default function HomePage() {
  const appShellRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
      } catch {
        return 'light';
      }
    }
    return 'light';
  });

  const [activeWorkspace, setActiveWorkspace] = useState<PrimaryWorkspace>('overview');
  const [curriculumTab, setCurriculumTab] = useState<CurriculumSubTab>('quest');
  const [labTab, setLabTab] = useState<SystemsLabTab>('playground');
  const [referenceTab, setReferenceTab] = useState<ReferenceSubTab>('commands');
  const [userSelectedStageId, setUserSelectedStageId] = useState<string | null>(null);

  const [aiMentorOpen, setAiMentorOpen] = useState(false);
  const [aiMentorPrompt, setAiMentorPrompt] = useState<string | undefined>(undefined);
  const [quickQuizOpen, setQuickQuizOpen] = useState(false);
  const [cheatSheetOpen, setCheatSheetOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [arcadeGameOpen, setArcadeGameOpen] = useState(false);
  const [gitHubSyncOpen, setGitHubSyncOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [liveBuddyOpen, setLiveBuddyOpen] = useState(false);
  const [liveBuddyTab, setLiveBuddyTab] = useState<'chat' | 'train' | 'saved'>('chat');
  const [mentorQuota, setMentorQuota] = useState<MentorQuotaSnapshot | null>(null);
  const [catchUpDismissed, setCatchUpDismissed] = useState(false);
  const [catchUpPreviewForced, setCatchUpPreviewForced] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const browserCatchUpNotifiedRef = useRef(false);

  // Active workspace session timer & Focus Mode state
  const [sessionSeconds, setSessionSeconds] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { sessionSeconds?: number };
          if (typeof parsed.sessionSeconds === 'number' && parsed.sessionSeconds >= 0) {
            return Math.min(86400, Math.floor(parsed.sessionSeconds));
          }
        }
      } catch {
        // Ignore storage read failure
      }
    }
    return 0;
  });
  const [timerPaused, setTimerPaused] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [autoPromptOnSwitch, setAutoPromptOnSwitch] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { autoPromptOnSwitch?: boolean };
          if (typeof parsed.autoPromptOnSwitch === 'boolean') return parsed.autoPromptOnSwitch;
        }
      } catch {
        // Ignore
      }
    }
    return true;
  });
  const [pendingSessionPrompt, setPendingSessionPrompt] =
    useState<PendingSessionPrompt | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [focusTargetMinutes, setFocusTargetMinutes] = useState<FocusTargetMinutes>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { focusTargetMinutes?: FocusTargetMinutes };
          if (
            parsed.focusTargetMinutes === 0 ||
            parsed.focusTargetMinutes === 5 ||
            parsed.focusTargetMinutes === 25 ||
            parsed.focusTargetMinutes === 45 ||
            parsed.focusTargetMinutes === 60
          ) {
            return parsed.focusTargetMinutes;
          }
        }
      } catch {
        // Ignore
      }
    }
    return 25;
  });
  const [chimeMuted, setChimeMuted] = useState(false);
  const chimeFiredForTargetRef = useRef<number | null>(null);

  const [playgroundKey, setPlaygroundKey] = useState(0);
  const [playgroundCode, setPlaygroundCode] = useState<string | undefined>(undefined);
  const [playgroundLang, setPlaygroundLang] = useState<'python' | 'c' | undefined>(undefined);
  const [pendingTerminalCmd, setPendingTerminalCmd] = useState<{ id: number; command: string } | null>(null);

  // Sync theme to documentElement + localStorage
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore quota issues
    }
  }, [theme]);

  // Persist active session clock and preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          sessionSeconds,
          autoPromptOnSwitch,
          focusTargetMinutes,
        })
      );
    } catch {
      // Ignore quota issues
    }
  }, [sessionSeconds, autoPromptOnSwitch, focusTargetMinutes]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Hydrate server-side mentor request quota on mount
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/tutor/quota', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload?.quota) {
          setMentorQuota(payload.quota as MentorQuotaSnapshot);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFocusMode((prev) => !prev);
        return;
      }
      if (
        e.key === 'Escape' &&
        focusMode &&
        !pendingSessionPrompt &&
        !commandPaletteOpen &&
        !quickQuizOpen &&
        !cheatSheetOpen &&
        !aiMentorOpen &&
        !resetConfirmOpen &&
        !gitHubSyncOpen &&
        !settingsOpen &&
        !arcadeGameOpen
      ) {
        setFocusMode(false);
      }
    };
    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  }, [
    focusMode,
    pendingSessionPrompt,
    commandPaletteOpen,
    quickQuizOpen,
    cheatSheetOpen,
    aiMentorOpen,
    resetConfirmOpen,
    gitHubSyncOpen,
    settingsOpen,
    arcadeGameOpen,
  ]);

  useEffect(() => {
    const handleVisibility = () => {
      setIsTabHidden(document.visibilityState === 'hidden');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    const intervalId = window.setInterval(() => {
      if (
        document.visibilityState !== 'hidden' &&
        !timerPaused &&
        !pendingSessionPrompt &&
        !resetConfirmOpen
      ) {
        setSessionSeconds((prev) => prev + 1);
      }
    }, 1000);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(intervalId);
    };
  }, [timerPaused, pendingSessionPrompt, resetConfirmOpen]);

  // Trigger optional chime & toast when Focus target completes
  useEffect(() => {
    if (focusTargetMinutes <= 0) {
      chimeFiredForTargetRef.current = null;
      return;
    }
    const targetSecs = focusTargetMinutes * 60;
    if (
      focusMode &&
      sessionSeconds >= targetSecs &&
      chimeFiredForTargetRef.current !== focusTargetMinutes
    ) {
      chimeFiredForTargetRef.current = focusTargetMinutes;
      if (!chimeMuted) {
        playFocusChime();
      }
      setActionToast(`Focus goal reached (${focusTargetMinutes}m)! Ready to log session.`);
      const tid = window.setTimeout(() => setActionToast(null), 5000);
      return () => window.clearTimeout(tid);
    }
    if (sessionSeconds < targetSecs) {
      chimeFiredForTargetRef.current = null;
    }
  }, [focusMode, focusTargetMinutes, sessionSeconds, chimeMuted]);

  const {
    data,
    isLoaded,
    stats,
    stageProgressList,
    cadenceMetrics,
    badgesSummary,
    recentlyUnlockedBadgeIds,
    dismissBadgeCelebration,
    toggleTopic,
    completeTopicWithHabit,
    markStageTopicsComplete,
    toggleExitCheck,
    toggleBanditLevel,
    saveBanditPassword,
    completeDailyChallenge,
    updateProjectStatus,
    updateProjectNotes,
    updateStageNotes,
    addStudyLog,
    addMilestone,
    toggleMilestone,
    deleteMilestone,
    setDailyGoalMinutes,
    setStageTargetDate,
    setAutoLogTopicPractice,
    setCatchUpNotificationsEnabled,
    setMentorCompanionEnabled,
    setMentorDailyLimit,
    saveMentorRequest,
    togglePinMentorRequest,
    deleteMentorRequest,
    clearUnpinnedMentorHistory,
    previousLastOpenedAt,
    generatePersonalizedPlan,
    saveCodeSnippet,
    deleteCodeSnippet,
    recordCodeExecution,
    recordWorkspaceMinutes,
    nextBestAction,
    exportBackup,
    importBackup,
    resetAll,
  } = useOdysseyStore();

  const currentStageId = useMemo(() => {
    for (const stage of STAGES_DATA) {
      const allDone = stage.topics.every((t) => data.completedTopics[t.id]);
      if (!allDone) {
        return stage.id;
      }
    }
    return STAGES_DATA[STAGES_DATA.length - 1]?.id || 'stage-15';
  }, [data.completedTopics]);

  const effectiveSelectedStageId = userSelectedStageId ?? currentStageId;
  const todayDateKey = new Date().toISOString().split('T')[0];

  const catchUpNotificationsEnabled = data.catchUpNotificationsEnabled !== false;
  const catchUpEval = useMemo(
    () =>
      evaluateCatchUpSuggestion({
        enabled: catchUpNotificationsEnabled,
        lastOpenedAt: previousLastOpenedAt,
      }),
    [catchUpNotificationsEnabled, previousLastOpenedAt]
  );

  const showCatchUpBanner =
    catchUpNotificationsEnabled &&
    !catchUpDismissed &&
    (catchUpEval.shouldSuggest || catchUpPreviewForced);

  const catchUpStageSummary = useMemo(() => {
    const stageObj =
      STAGES_DATA.find((s) => s.id === effectiveSelectedStageId) || STAGES_DATA[0];
    const nextTopic = stageObj.topics.find((t) => !data.completedTopics[t.id]);
    return {
      stageNumber: stageObj.number,
      stageTitle: stageObj.title.split(':')[0],
      nextTopicTitle: nextTopic?.title,
    };
  }, [effectiveSelectedStageId, data.completedTopics]);

  useEffect(() => {
    if (
      !catchUpEval.shouldSuggest ||
      browserCatchUpNotifiedRef.current ||
      typeof window === 'undefined' ||
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted'
    ) {
      return;
    }
    browserCatchUpNotifiedRef.current = true;
    try {
      new Notification(`CS Odyssey · ${CATCH_UP_SESSION_MINUTES}-Minute Catch-Up`, {
        body: `It's been ${catchUpEval.hoursSinceLastOpen}h since your last session. Jump back in with a quick ${CATCH_UP_SESSION_MINUTES}-minute Stage ${catchUpStageSummary.stageNumber} review!`,
      });
    } catch {
      // Ignore browser notification errors in restricted contexts
    }
  }, [catchUpEval.shouldSuggest, catchUpEval.hoursSinceLastOpen, catchUpStageSummary.stageNumber]);

  const transitionWorkspace = (nextWorkspace: PrimaryWorkspace, preAction?: () => void) => {
    preAction?.();
    if (nextWorkspace === activeWorkspace) return;

    if (
      shouldPromptStudyLogOnSwitch({
        fromWorkspace: activeWorkspace,
        toWorkspace: nextWorkspace,
        elapsedSeconds: sessionSeconds,
        autoPromptEnabled: autoPromptOnSwitch,
      })
    ) {
      setPendingSessionPrompt({
        fromWorkspace: activeWorkspace,
        toWorkspace: nextWorkspace,
        elapsedSeconds: sessionSeconds,
        focusModeActive: focusMode,
      });
    }

    setActiveWorkspace(nextWorkspace);
    setSessionSeconds(0);
  };

  const handleOpenManualSessionLog = () => {
    setPendingSessionPrompt({
      fromWorkspace: activeWorkspace,
      toWorkspace: activeWorkspace,
      elapsedSeconds: sessionSeconds,
      isManual: true,
      focusModeActive: focusMode,
    });
  };

  const handleConfirmSessionLog = (minutes: number, stageId: string, notes: string) => {
    const sourceWorkspace = pendingSessionPrompt?.fromWorkspace ?? activeWorkspace;
    const wasManual = Boolean(pendingSessionPrompt?.isManual);
    addStudyLog(minutes, stageId, notes);
    recordWorkspaceMinutes(sourceWorkspace, minutes);
    if (wasManual) {
      setSessionSeconds(0);
    }
    setPendingSessionPrompt(null);
    setActionToast(
      `Logged ${minutes}m study session (${WORKSPACE_LABELS[sourceWorkspace] || sourceWorkspace})`
    );
    setTimeout(() => setActionToast(null), 4000);
  };

  const handleStartCatchUpSession = () => {
    setCatchUpDismissed(true);
    setCatchUpPreviewForced(false);
    setFocusTargetMinutes(CATCH_UP_SESSION_MINUTES);
    setTimerPaused(false);
    setFocusMode(true);
    transitionWorkspace('curriculum', () => {
      setCurriculumTab('quest');
      setUserSelectedStageId(effectiveSelectedStageId);
    });
    setSessionSeconds(0);
    setActionToast(`Started ${CATCH_UP_SESSION_MINUTES}-minute catch-up study session!`);
    setTimeout(() => setActionToast(null), 4000);
  };

  const handleQuickLogCatchUp = () => {
    addStudyLog(
      CATCH_UP_SESSION_MINUTES,
      effectiveSelectedStageId,
      `Completed ${CATCH_UP_SESSION_MINUTES}-minute catch-up review session (Stage ${catchUpStageSummary.stageNumber})`
    );
    setCatchUpDismissed(true);
    setCatchUpPreviewForced(false);
    setActionToast(`Logged ${CATCH_UP_SESSION_MINUTES}m catch-up review session!`);
    setTimeout(() => setActionToast(null), 4000);
  };

  const handleOpenPlaygroundWithCode = (lang: 'python' | 'c', code: string) => {
    transitionWorkspace('lab', () => {
      setPlaygroundLang(lang);
      setPlaygroundCode(code);
      setPlaygroundKey((prev) => prev + 1);
      setLabTab('playground');
    });
  };

  const handleOpenAiWithPrompt = (prompt?: string) => {
    setAiMentorPrompt(prompt);
    setAiMentorOpen(true);
  };

  const handleOpenNotes = () => {
    transitionWorkspace('reference', () => {
      setReferenceTab('notebook');
    });
  };

  const handleNavigate = (workspace: PrimaryWorkspace, subTab?: string, stageId?: string) => {
    transitionWorkspace(workspace, () => {
      if (workspace === 'curriculum') {
        if (
          subTab === 'quest' ||
          subTab === 'atlas' ||
          subTab === 'stages' ||
          subTab === 'hero' ||
          subTab === 'projects' ||
          subTab === 'export'
        ) {
          setCurriculumTab(subTab);
        }
        if (stageId) {
          setUserSelectedStageId(stageId);
        }
      } else if (workspace === 'lab') {
        if (
          subTab === 'playground' ||
          subTab === 'visualizer' ||
          subTab === 'foundations' ||
          subTab === 'git' ||
          subTab === 'memory' ||
          subTab === 'packet' ||
          subTab === 'complexity' ||
          subTab === 'studio' ||
          subTab === 'media'
        ) {
          setLabTab(subTab);
        }
      } else if (workspace === 'reference') {
        if (
          subTab === 'sources' ||
          subTab === 'commands' ||
          subTab === 'cheatsheets' ||
          subTab === 'notebook' ||
          subTab === 'glossary' ||
          subTab === 'directory'
        ) {
          setReferenceTab(subTab);
        }
      }
    });
  };

  const handleDownloadMasteryPdf = async () => {
    const { downloadMasteryReportPdf } = await import('@/lib/mastery-report-pdf');
    const res = downloadMasteryReportPdf({
      stats,
      stageProgressList,
      cadenceMetrics,
      badgesSummary,
      data,
    });
    setActionToast(`Downloaded ${res.filename} (${res.pageCount} pages)`);
    setTimeout(() => setActionToast(null), 4000);
  };

  const handleConfirmReset = () => {
    resetAll();
    setUserSelectedStageId(null);
    setResetConfirmOpen(false);
    setSessionSeconds(0);
    setActiveWorkspace('overview');
  };

  if (!isLoaded) {
    return (
      <div className="optical-canvas flex h-screen items-center justify-center text-slate-600 dark:text-slate-300 font-mono text-xs">
        <div className="optical-panel flex items-center gap-3 rounded-xl px-5 py-3">
          <Terminal className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span>Initializing CS Odyssey Workbench...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={appShellRef}
      data-theme={theme}
      className="optical-canvas page relative min-h-screen text-slate-900 dark:text-slate-100 flex flex-col font-sans"
    >
      <div
        className={`relative z-10 flex-1 flex flex-col transition-colors duration-300 ${
          focusMode ? 'bg-slate-200/40 dark:bg-[#02040a]/60' : ''
        }`}
      >
        <SoapBubbleMaterial
          backdrop={appShellRef}
          iridescence={theme === 'light' ? 0.5 : 2}
          filmScale={4.85}
          oilOpacity={1}
          oilCoverage={theme === 'light' ? 0.73 : 1}
          oilEdge={18}
          oilEdgeFade={theme === 'light' ? 2.33 : 1}
          clearCenter={theme === 'light' ? 0.57 : 0.73}
          thickness={480}
          drainage={0.35}
          swirl={0.5}
          reflectivity={1.3}
          refraction={0.15}
          dispersion={1}
          bevel={14}
          windowLength={1.3}
          windowMargin={0.85}
          windowBend={0.75}
          windowSize={0.75}
          windowWidth={0.8}
          windowGradient={0.96}
          windowHead={0.7}
          windowTail={0.6}
          glintSize={1.65}
          glintIntensity={0}
          glintDistance={-0.45}
          glintHeight={0.65}
          windowIntensity={0.85}
          windowTwin={false}
          bottomShadeColor={theme === 'light' ? '#ffffff' : undefined}
        >
          {focusMode ? (
            <FocusModeHUD
              workspace={activeWorkspace}
              elapsedSeconds={sessionSeconds}
              isPaused={timerPaused}
              focusTargetMinutes={focusTargetMinutes}
              chimeMuted={chimeMuted}
              onToggleChimeMute={() => setChimeMuted((m) => !m)}
              onSelectTargetMinutes={setFocusTargetMinutes}
              onTogglePause={() => setTimerPaused((p) => !p)}
              onLogNow={handleOpenManualSessionLog}
              onExitFocusMode={() => setFocusMode(false)}
            />
          ) : (
            <Navbar
              activeWorkspace={activeWorkspace}
              setActiveWorkspace={(ws) => transitionWorkspace(ws)}
              openAiMentor={() =>
                handleOpenAiWithPrompt(
                  'Give me a focused breakdown of what I should study next based on my current stage.'
                )
              }
              focusMode={focusMode}
              onToggleFocusMode={() => setFocusMode((prev) => !prev)}
              theme={theme}
              onToggleTheme={toggleTheme}
              onOpenSettings={() => setSettingsOpen(true)}
              hasActiveReminder={showCatchUpBanner}
            />
          )}

          <AnimatePresence>
            {showCatchUpBanner && (
              <CatchUpNotificationBanner
                hoursSinceLastOpen={catchUpEval.hoursSinceLastOpen}
                daysAwayLabel={catchUpEval.daysAwayLabel}
                stageNumber={catchUpStageSummary.stageNumber}
                stageTitle={catchUpStageSummary.stageTitle}
                nextTopicTitle={catchUpStageSummary.nextTopicTitle}
                isPreview={catchUpPreviewForced && !catchUpEval.shouldSuggest}
                onStartCatchUp={handleStartCatchUpSession}
                onQuickLogFiveMinutes={handleQuickLogCatchUp}
                onOpenSettings={() => setSettingsOpen(true)}
                onDismiss={() => {
                  setCatchUpDismissed(true);
                  setCatchUpPreviewForced(false);
                }}
              />
            )}
          </AnimatePresence>

          <main className="flex-1 pb-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeWorkspace}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                {activeWorkspace === 'overview' && (
                  <OverviewWorkspace
                    stats={stats}
                    currentStageId={currentStageId}
                    completedTopics={data.completedTopics}
                    userMilestones={data.userMilestones || []}
                    studyLogs={data.studyLogs}
                    stageProgressList={stageProgressList}
                    cadenceMetrics={cadenceMetrics}
                    autoLogTopicPractice={data.autoLogTopicPractice !== false}
                    badgesSummary={badgesSummary}
                    recentlyUnlockedBadgeIds={recentlyUnlockedBadgeIds}
                    onDismissBadgeCelebration={dismissBadgeCelebration}
                    isDailyChallengeCompleted={Boolean(data.completedDailyChallenges?.[todayDateKey])}
                    onCompleteDailyChallenge={completeDailyChallenge}
                    onToggleMilestone={toggleMilestone}
                    onAddMilestone={addMilestone}
                    onDeleteMilestone={deleteMilestone}
                    onSetDailyGoal={setDailyGoalMinutes}
                    onSetAutoLogTopicPractice={setAutoLogTopicPractice}
                    onCompleteTopicWithHabit={completeTopicWithHabit}
                    onSetStageTargetDate={setStageTargetDate}
                    onGeneratePersonalizedPlan={generatePersonalizedPlan}
                    onLogStudy={(minutes, stageId, notes) => addStudyLog(minutes, stageId, notes)}
                    onNavigate={handleNavigate}
                    onOpenAiMentor={handleOpenAiWithPrompt}
                    onOpenQuickQuiz={() => setQuickQuizOpen(true)}
                    onOpenCheatSheet={() => setCheatSheetOpen(true)}
                    onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                    onOpenGame={() => setArcadeGameOpen(true)}
                    onDownloadMasteryPdf={handleDownloadMasteryPdf}
                    onOpenGitHubSync={() => setGitHubSyncOpen(true)}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                    nextBestAction={nextBestAction}
                    workspaceMinutes={data.workspaceMinutes}
                  />
                )}

                {activeWorkspace === 'curriculum' && (
                  <CurriculumWorkspace
                    activeSubTab={curriculumTab}
                    onChangeSubTab={setCurriculumTab}
                    selectedStageId={effectiveSelectedStageId}
                    onSelectStage={(stageId) => setUserSelectedStageId(stageId)}
                    completedTopics={data.completedTopics}
                    completedExitChecks={data.completedExitChecks}
                    projectStatuses={data.projectStatuses}
                    projectNotes={data.projectNotes}
                    stageTargetDates={data.stageTargetDates}
                    onToggleTopic={toggleTopic}
                    onCompleteTopicWithHabit={completeTopicWithHabit}
                    onSetStageTargetDate={setStageTargetDate}
                    onToggleExitCheck={toggleExitCheck}
                    onMarkStageComplete={markStageTopicsComplete}
                    onLogBossClear={addStudyLog}
                    onAddMilestone={addMilestone}
                    onUpdateProjectStatus={updateProjectStatus}
                    onUpdateProjectNotes={updateProjectNotes}
                    onOpenAiMentor={handleOpenAiWithPrompt}
                    onOpenShell={() => transitionWorkspace('shell')}
                    onOpenNotes={handleOpenNotes}
                    onOpenPlayground={handleOpenPlaygroundWithCode}
                    onOpenLab={(tab) => {
                      transitionWorkspace('lab', () => {
                        setLabTab(tab);
                      });
                    }}
                    exportData={data}
                    exportStats={stats}
                    onDownloadMasteryPdf={handleDownloadMasteryPdf}
                  />
                )}

                {activeWorkspace === 'lab' && (
                  <SystemsLabWorkspace
                    activeLab={labTab}
                    onSelectLab={setLabTab}
                    playgroundKey={playgroundKey}
                    initialLanguage={playgroundLang}
                    initialCode={playgroundCode}
                    savedSnippets={data.savedSnippets}
                    onSaveSnippet={saveCodeSnippet}
                    onDeleteSnippet={deleteCodeSnippet}
                    onAwardXp={(xp) =>
                      addStudyLog(15, currentStageId, `Completed Systems Lab drill (+${xp} XP)`)
                    }
                    onNavigateToProjects={() => handleNavigate('curriculum', 'projects')}
                    onNavigateToStage={() => handleNavigate('curriculum', 'stages', currentStageId)}
                    onNavigateToShell={() => handleNavigate('shell')}
                    onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                    onOpenGame={() => setArcadeGameOpen(true)}
                    onOpenAiMentor={handleOpenAiWithPrompt}
                    onCodeExecuted={recordCodeExecution}
                  />
                )}

                {activeWorkspace === 'shell' && (
                  <TerminalSimulator
                    isActive={activeWorkspace === 'shell'}
                    solvedLevels={data.solvedBanditLevels}
                    banditPasswords={data.banditPasswords}
                    onSaveBanditPassword={saveBanditPassword}
                    onToggleLevel={toggleBanditLevel}
                    onOpenAiMentor={handleOpenAiWithPrompt}
                    pendingCommand={pendingTerminalCmd}
                  />
                )}

                {activeWorkspace === 'reference' && (
                  <ReferenceWorkspace
                    activeSubTab={referenceTab}
                    onSelectSubTab={setReferenceTab}
                    stageNotes={data.stageNotes}
                    onUpdateStageNotes={updateStageNotes}
                    onExportBackup={exportBackup}
                    onImportBackup={importBackup}
                    onOpenAiMentor={handleOpenAiWithPrompt}
                    onRunCommandInShell={(cmd) => {
                      transitionWorkspace('shell', () => {
                        setPendingTerminalCmd({ id: Date.now(), command: cmd });
                      });
                    }}
                    onDownloadMasteryPdf={handleDownloadMasteryPdf}
                    onOpenGitHubSync={() => setGitHubSyncOpen(true)}
                    savedSnippets={data.savedSnippets}
                    onSaveSnippet={saveCodeSnippet}
                    onDeleteSnippet={deleteCodeSnippet}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          <AnimatePresence>
            {recentlyUnlockedBadgeIds.length > 0 && (() => {
              const latestMedal = badgesSummary.badges.find(
                (b) => b.id === recentlyUnlockedBadgeIds[0] && b.unlocked
              );
              if (!latestMedal) return null;
              return (
                <motion.div
                  key={`medal-toast-${latestMedal.id}`}
                  initial={{ opacity: 0, y: 18, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.96 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed bottom-20 right-5 z-50 w-[min(360px,calc(100vw-2.5rem))] optical-panel rounded-2xl border-emerald-500/45 bg-white/95 dark:bg-[#07111e]/95 p-4 shadow-2xl"
                >
                  <div className="flex items-start gap-3">
                    <VisualMedalEmblem
                      iconName={latestMedal.iconName}
                      tier={latestMedal.tier}
                      unlocked
                      size="md"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-bold">
                          <Sparkles className="h-3 w-3" />
                          Medal Unlocked · {latestMedal.tier}
                        </span>
                        <button
                          type="button"
                          onClick={() => dismissBadgeCelebration()}
                          className="p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          aria-label="Dismiss medal popup"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="font-display text-sm font-bold text-slate-950 dark:text-white truncate">
                        {latestMedal.title}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                        {latestMedal.description}
                      </p>
                      <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                        <span className="font-semibold text-amber-700 dark:text-amber-300">
                          +{latestMedal.xpBonus} Medal XP
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (activeWorkspace !== 'overview') {
                              transitionWorkspace('overview');
                            }
                            window.setTimeout(() => {
                              document
                                .getElementById('badges-showcase')
                                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 160);
                          }}
                          className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                        >
                          <span>Trophy Shelf</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {actionToast && (
            <div className="fixed bottom-5 right-5 z-50 optical-panel flex items-center gap-2 rounded-xl border-emerald-500/40 bg-white dark:bg-[#07111e]/95 px-4 py-2.5 text-xs font-mono text-emerald-700 dark:text-emerald-300 shadow-xl">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{actionToast}</span>
            </div>
          )}

          {quickQuizOpen && (
            <QuickQuizModal
              isOpen={quickQuizOpen}
              onClose={() => setQuickQuizOpen(false)}
              currentStageId={currentStageId}
              onAwardXp={() => {
                addStudyLog(15, currentStageId, `Passed Quick Quiz on ${currentStageId}`);
              }}
              onOpenAiMentor={handleOpenAiWithPrompt}
            />
          )}

          {aiMentorOpen && (
            <AiMentorPanel
              isOpen={aiMentorOpen}
              onClose={() => setAiMentorOpen(false)}
              initialPrompt={aiMentorPrompt}
              completedTopicsCount={stats.completedTopicsCount}
              dailyGoalMinutes={stats.dailyGoalMinutes}
              activeStageId={effectiveSelectedStageId}
              quotaSnapshot={mentorQuota}
              requestedDailyLimit={data.mentorDailyLimit ?? DEFAULT_MENTOR_DAILY_LIMIT}
              onQuotaUpdated={setMentorQuota}
              onSaveRequest={saveMentorRequest}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          )}

          {data.mentorCompanionEnabled !== false && !focusMode && (
            <LiveMentorCompanion
              isOpen={liveBuddyOpen}
              onToggleOpen={(open) => {
                setLiveBuddyOpen(open);
                if (!open) setLiveBuddyTab('chat');
              }}
              initialTab={liveBuddyTab}
              workspace={activeWorkspace}
              currentStageId={effectiveSelectedStageId}
              isCelebrating={recentlyUnlockedBadgeIds.length > 0}
              quotaSnapshot={mentorQuota}
              requestedDailyLimit={data.mentorDailyLimit ?? DEFAULT_MENTOR_DAILY_LIMIT}
              mentorHistory={data.mentorHistory || []}
              onQuotaUpdated={setMentorQuota}
              onSaveRequest={saveMentorRequest}
              onTogglePinRequest={togglePinMentorRequest}
              onDeleteRequest={deleteMentorRequest}
              onClearUnpinnedHistory={clearUnpinnedMentorHistory}
              onExpandFullMentor={(prompt) => {
                setLiveBuddyOpen(false);
                handleOpenAiWithPrompt(prompt);
              }}
              onOpenSettings={() => setSettingsOpen(true)}
              onNavigateWorkspace={handleNavigate}
              onLaunchStageCode={handleOpenPlaygroundWithCode}
              onOpenQuickQuiz={() => setQuickQuizOpen(true)}
              onCompleteTrainingDrill={(stageId, qTitle) => {
                addStudyLog(
                  5,
                  stageId,
                  `Completed Odyssey Buddy training drill: "${qTitle.slice(0, 80)}"`
                );
              }}
            />
          )}

          {cheatSheetOpen && (
            <CheatSheetModal
              isOpen={cheatSheetOpen}
              onClose={() => setCheatSheetOpen(false)}
              onInsertCommand={(cmd) => {
                transitionWorkspace('shell', () => {
                  setPendingTerminalCmd({ id: Date.now(), command: cmd });
                  setCheatSheetOpen(false);
                });
              }}
            />
          )}

          {commandPaletteOpen && (
            <CommandPalette
              isOpen={commandPaletteOpen}
              onClose={() => setCommandPaletteOpen(false)}
              onNavigate={handleNavigate}
              onOpenAiMentor={handleOpenAiWithPrompt}
              onOpenQuickQuiz={() => setQuickQuizOpen(true)}
              onOpenCheatSheet={() => setCheatSheetOpen(true)}
              onOpenGame={() => setArcadeGameOpen(true)}
              onDownloadMasteryPdf={handleDownloadMasteryPdf}
              onOpenGitHubSync={() => setGitHubSyncOpen(true)}
              focusMode={focusMode}
              onToggleFocusMode={() => setFocusMode((prev) => !prev)}
              theme={theme}
              onToggleTheme={toggleTheme}
              onOpenManualSessionLog={handleOpenManualSessionLog}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenLiveBuddy={(tab = 'chat') => {
                setMentorCompanionEnabled(true);
                setLiveBuddyTab(tab);
                setLiveBuddyOpen(true);
              }}
            />
          )}

          {settingsOpen && (
            <SettingsModal
              isOpen={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              catchUpNotificationsEnabled={catchUpNotificationsEnabled}
              onToggleCatchUpNotifications={(enabled) => {
                setCatchUpNotificationsEnabled(enabled);
                if (!enabled) {
                  setCatchUpPreviewForced(false);
                }
              }}
              previousLastOpenedAt={previousLastOpenedAt}
              onPreviewCatchUpNotification={() => {
                setCatchUpDismissed(false);
                setCatchUpPreviewForced(true);
              }}
              dailyGoalMinutes={stats.dailyGoalMinutes}
              onSetDailyGoalMinutes={setDailyGoalMinutes}
              autoLogTopicPractice={data.autoLogTopicPractice !== false}
              onSetAutoLogTopicPractice={setAutoLogTopicPractice}
              autoPromptOnSwitch={autoPromptOnSwitch}
              onToggleAutoPromptOnSwitch={() => setAutoPromptOnSwitch((prev) => !prev)}
              chimeMuted={chimeMuted}
              onToggleChimeMute={() => setChimeMuted((m) => !m)}
              theme={theme}
              onToggleTheme={toggleTheme}
              mentorCompanionEnabled={data.mentorCompanionEnabled !== false}
              onToggleMentorCompanion={setMentorCompanionEnabled}
              mentorDailyLimit={data.mentorDailyLimit ?? DEFAULT_MENTOR_DAILY_LIMIT}
              onSetMentorDailyLimit={(limit) => {
                setMentorDailyLimit(limit);
                setMentorQuota((prev) =>
                  prev
                    ? {
                        ...prev,
                        dailyLimit: limit,
                        remainingToday: Math.max(0, limit - prev.usedToday),
                        isDailyLimitReached: prev.usedToday >= limit,
                      }
                    : null
                );
              }}
              quotaSnapshot={mentorQuota}
            />
          )}

          {pendingSessionPrompt && (
            <WorkspaceSwitchPromptModal
              prompt={pendingSessionPrompt}
              defaultStageId={currentStageId}
              onConfirmLog={handleConfirmSessionLog}
              onSkip={() => setPendingSessionPrompt(null)}
              onDisableAutoPrompt={() => setAutoPromptOnSwitch(false)}
            />
          )}

          {gitHubSyncOpen && (
            <GitHubSyncModal
              isOpen={gitHubSyncOpen}
              onClose={() => setGitHubSyncOpen(false)}
              data={data}
              stats={stats}
            />
          )}

          {arcadeGameOpen && (
            <SystemsArcadeGame
              isOpen={arcadeGameOpen}
              onClose={() => setArcadeGameOpen(false)}
              onAwardXp={(xp, summary) => addStudyLog(15, currentStageId, `${summary} (+${xp} XP)`)}
            />
          )}

          {resetConfirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 dark:bg-[#020409]/92 p-4 backdrop-blur-sm">
              <div className="optical-panel w-full max-w-md rounded-2xl p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                        Reset Local Progress?
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        This clears all completed topics, notes, milestones, snippets, and wargame flags from this browser.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setResetConfirmOpen(false)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    aria-label="Close confirmation dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="optical-inset rounded-xl p-3 text-xs text-slate-600 dark:text-slate-400">
                  Consider exporting a JSON backup before resetting so you can restore your progress later.
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => setResetConfirmOpen(false)}
                    className="rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <SoapBubbleButton
                    onClick={handleConfirmReset}
                    tint="rgb(244 63 94)"
                    opacity={0.92}
                    style={{ fontSize: 12 }}
                    className="!min-h-[34px] !px-4 text-xs font-semibold text-white"
                  >
                    Reset All Data
                  </SoapBubbleButton>
                </div>
              </div>
            </div>
          )}

          <footer className="border-t border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#03050b]/94 py-5 px-4 sm:px-6 lg:px-8 text-xs text-slate-600 dark:text-slate-400">
            <div className="mx-auto max-w-7xl space-y-4">
              <SessionTimerFooterBar
                workspace={activeWorkspace}
                elapsedSeconds={sessionSeconds}
                isPaused={timerPaused}
                isTabHidden={isTabHidden}
                focusMode={focusMode}
                autoPromptOnSwitch={autoPromptOnSwitch}
                theme={theme}
                onToggleTheme={toggleTheme}
                onTogglePause={() => setTimerPaused((p) => !p)}
                onResetTimer={() => setSessionSeconds(0)}
                onOpenManualLog={handleOpenManualSessionLog}
                onToggleFocusMode={() => setFocusMode((prev) => !prev)}
                onToggleAutoPrompt={() => setAutoPromptOnSwitch((prev) => !prev)}
              />

              {!focusMode && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display font-semibold text-slate-900 dark:text-slate-200">
                      CS Odyssey
                    </span>
                    <span className="text-slate-400 dark:text-slate-600">·</span>
                    <span className="text-slate-600 dark:text-slate-400">
                      Zero to Hero Computer Science Workbench
                    </span>
                    <span className="text-slate-400 dark:text-slate-600">·</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono">
                      Local-First Storage
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 font-mono text-[11px]">
                    <button
                      onClick={handleDownloadMasteryPdf}
                      className="text-emerald-700 dark:text-emerald-400 hover:underline transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <FileDown className="h-3 w-3" />
                      <span>Mastery PDF</span>
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <button
                      onClick={() => setGitHubSyncOpen(true)}
                      className="text-sky-700 dark:text-sky-400 hover:underline transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <FolderGit2 className="h-3 w-3" />
                      <span>Push to GitHub</span>
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <button
                      onClick={exportBackup}
                      className="text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 transition-colors cursor-pointer"
                    >
                      Export JSON Backup
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <button
                      onClick={() => setSettingsOpen(true)}
                      className="text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Settings className="h-3 w-3" />
                      <span>Settings</span>
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <button
                      onClick={() => setResetConfirmOpen(true)}
                      className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset Data</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </footer>
        </SoapBubbleMaterial>
      </div>
    </div>
  );
}

