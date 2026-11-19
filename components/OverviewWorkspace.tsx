'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Clock,
  Target,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ArrowRight,
  HelpCircle,
  BookOpen,
  X,
  Calendar,
  Search,
  Grid3X3,
  Code2,
  Terminal,
  Download,
  Orbit,
  Gamepad2,
  Film,
  FileDown,
  FolderGit2,
  Sun,
  Moon,
  Compass,
  Clock3,
} from 'lucide-react';
import { STAGES_DATA } from '@/lib/curriculum-data';
import {
  StudyLogEntry,
  UserMilestone,
  type StageProgressSummary,
  type CadenceDayCell,
  type NextBestAction,
} from '@/hooks/use-odyssey-store';
import { summarizeWorkspaceMinutes, type AppTheme } from '@/lib/session-timer';
import { LiquidGlassLogo } from './liquid-glass-logo';
import { ChromaticButton } from './chromatic-button';
import { SoapBubbleButton } from './soap-bubble';
import type { EvaluatedBadge } from '@/lib/badges-data';
import type { PrimaryWorkspace } from './Navbar';

const DailyChallengeWidget = dynamic(
  () => import('./DailyChallengeWidget').then((m) => m.DailyChallengeWidget),
  { ssr: false }
);
const CurriculumSkillGraph = dynamic(
  () => import('./CurriculumSkillGraph').then((m) => m.CurriculumSkillGraph),
  { ssr: false }
);
const ProgressAnalyticsDeck = dynamic(
  () => import('./ProgressAnalyticsDeck').then((m) => m.ProgressAnalyticsDeck),
  { ssr: false }
);
const DailyHabitTracker = dynamic(
  () => import('./DailyHabitTracker').then((m) => m.DailyHabitTracker),
  { ssr: false }
);
const WeeklyContributionHeatmap = dynamic(
  () => import('./WeeklyContributionHeatmap').then((m) => m.WeeklyContributionHeatmap),
  { ssr: false }
);
const BadgesCollection = dynamic(
  () => import('./BadgesCollection').then((m) => m.BadgesCollection),
  { ssr: false }
);

interface OverviewWorkspaceProps {
  stats: {
    totalTopicsCount: number;
    completedTopicsCount: number;
    topicPercent: number;
    completedProjectsCount: number;
    totalProjectsCount: number;
    banditCount: number;
    totalMinutesLogged: number;
    todayMinutesLogged: number;
    dailyGoalMinutes: number;
    dailyGoalPercent: number;
    completedMilestonesCount: number;
    totalMilestonesCount: number;
    xp: number;
    levelNumber: number;
    heroTitle: string;
    currentStreak: number;
  };
  currentStageId: string;
  completedTopics: Record<string, boolean>;
  userMilestones: UserMilestone[];
  studyLogs: StudyLogEntry[];
  stageProgressList: StageProgressSummary[];
  cadenceMetrics: {
    last28Days: CadenceDayCell[];
    last30Days: CadenceDayCell[];
    last84Days: CadenceDayCell[];
    weeklyMinutes: number;
    daysGoalMet7: number;
    activeDays28: number;
    goalDays30: number;
    longestStreak30: number;
  };
  autoLogTopicPractice: boolean;
  badgesSummary: {
    badges: EvaluatedBadge[];
    unlockedCount: number;
    totalCount: number;
    totalLinesOfCode?: number;
    totalBadgeXp?: number;
  };
  recentlyUnlockedBadgeIds?: string[];
  onDismissBadgeCelebration?: (badgeId?: string) => void;
  isDailyChallengeCompleted: boolean;
  onCompleteDailyChallenge: (dateKey: string, xp: number, title: string, stageId: string) => void;
  onToggleMilestone: (id: string) => void;
  onAddMilestone: (
    title: string,
    category: UserMilestone['category'],
    targetDate?: string,
    stageId?: string,
    xpReward?: number
  ) => void;
  onDeleteMilestone: (id: string) => void;
  onSetDailyGoal: (minutes: number) => void;
  onSetAutoLogTopicPractice: (enabled: boolean) => void;
  onCompleteTopicWithHabit: (topicId: string, stageId: string, logMinutes?: number) => void;
  onSetStageTargetDate: (stageId: string, targetDate: string) => void;
  onGeneratePersonalizedPlan: (horizonWeeks: 12 | 24 | 36) => {
    datesUpdated: number;
    milestonesAdded: number;
  };
  onLogStudy: (minutes: number, stageId: string, notes: string) => void;
  onNavigate: (workspace: PrimaryWorkspace, subTab?: string, stageId?: string) => void;
  onOpenAiMentor: (prompt?: string) => void;
  onOpenQuickQuiz: () => void;
  onOpenCheatSheet: () => void;
  onOpenCommandPalette?: () => void;
  onOpenGame?: () => void;
  onDownloadMasteryPdf?: () => void;
  onOpenGitHubSync?: () => void;
  theme?: AppTheme;
  onToggleTheme?: () => void;
  nextBestAction?: NextBestAction;
  workspaceMinutes?: Record<string, number>;
}

const PRESET_MILESTONES = [
  { title: 'Master 8-Bit Binary, Hex & Two\'s Complement', category: 'basics' as const, stageId: 'stage-0' },
  { title: 'Complete Wargame Levels 0-5 via Shell', category: 'bandit' as const, stageId: 'stage-3' },
  { title: 'Write & Run C Pointer Program in Playground', category: 'systems' as const, stageId: 'stage-6' },
  { title: 'Build First Documented GitHub Portfolio Project', category: 'projects' as const, stageId: 'stage-11' },
];

export function OverviewWorkspace({
  stats,
  currentStageId,
  completedTopics,
  userMilestones,
  studyLogs,
  stageProgressList,
  cadenceMetrics,
  autoLogTopicPractice,
  badgesSummary,
  recentlyUnlockedBadgeIds,
  onDismissBadgeCelebration,
  isDailyChallengeCompleted,
  onCompleteDailyChallenge,
  onToggleMilestone,
  onAddMilestone,
  onDeleteMilestone,
  onSetDailyGoal,
  onSetAutoLogTopicPractice,
  onCompleteTopicWithHabit,
  onSetStageTargetDate,
  onGeneratePersonalizedPlan,
  onLogStudy,
  onNavigate,
  onOpenAiMentor,
  onOpenQuickQuiz,
  onOpenCheatSheet,
  onOpenCommandPalette,
  onOpenGame,
  onDownloadMasteryPdf,
  onOpenGitHubSync,
  theme = 'light',
  onToggleTheme,
  nextBestAction,
  workspaceMinutes,
}: OverviewWorkspaceProps) {
  const [filterMilestones, setFilterMilestones] = useState<'all' | 'active' | 'completed'>('all');
  const [showLogModal, setShowLogModal] = useState(false);
  const [logMinutes, setLogMinutes] = useState(60);
  const [logStage, setLogStage] = useState(currentStageId);
  const [logNotes, setLogNotes] = useState('');

  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [msTitle, setMsTitle] = useState('');
  const [msCategory, setMsCategory] = useState<UserMilestone['category']>('custom');
  const [msStageId, setMsStageId] = useState(currentStageId);
  const [msTargetDate, setMsTargetDate] = useState('');

  const activeStage = STAGES_DATA.find((s) => s.id === currentStageId) || STAGES_DATA[0];
  const hoursLogged = (stats.totalMinutesLogged / 60).toFixed(1);
  const todayStr = new Date().toISOString().split('T')[0];

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const minutes = studyLogs
      .filter((l) => l.date === dateStr)
      .reduce((acc, curr) => acc + (curr.minutes || 0), 0);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    return { dateStr, minutes, dayLabel, isToday: dateStr === todayStr };
  });

  const filteredMilestones = userMilestones.filter((m) => {
    if (filterMilestones === 'active') return !m.completed;
    if (filterMilestones === 'completed') return m.completed;
    return true;
  });

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    onLogStudy(logMinutes, logStage, logNotes);
    setLogNotes('');
    setShowLogModal(false);
  };

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msTitle.trim()) return;
    onAddMilestone(msTitle.trim(), msCategory, msTargetDate || undefined, msStageId, 75);
    setMsTitle('');
    setMsTargetDate('');
    setShowMilestoneForm(false);
  };

  const workspaceSummary = summarizeWorkspaceMinutes(workspaceMinutes);
  const totalTrackedWorkspaceMinutes = workspaceSummary.reduce((sum, w) => sum + w.minutes, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-7 space-y-6">
      {/* 0. Studio Light-First Hero Stage */}
      <section className="optical-panel rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center">
        <div className="lg:col-span-6 p-7 sm:p-10 space-y-5 bg-gradient-to-br from-white via-[#f8fafc] to-[#f1f5f9] dark:from-[#060913] dark:via-[#04070e] dark:to-black">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums uppercase tracking-wider">
            <span className="text-sky-700 dark:text-sky-400 font-semibold">Level {stats.levelNumber}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-700 dark:text-slate-300">{stats.heroTitle}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-900 dark:text-slate-200 font-semibold">{stats.xp.toLocaleString()} XP</span>
          </div>

          <div className="space-y-2.5">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-950 dark:text-white [text-wrap:balance]">
              Systems Engineering Odyssey
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Master computer science from Boolean logic and Linux shell internals to distributed systems, C memory models, and real-time WebAssembly computation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <ChromaticButton
              color="#b126ff"
              colorMode="spectrum"
              speed={0.7}
              paused={false}
              phase={0}
              feather={100}
              projectionScale={174.7}
              intensity={1.4}
              grain={0.105}
              seed={7}
              borderRadius={50}
              hoverEffect="brighten"
              entrance="blur-up"
              entranceSpeed={1}
              entranceBlur={10}
              entranceDistance={20}
              entranceScale={0.65}
              onClick={() => onNavigate('curriculum', 'quest', currentStageId)}
            >
              Start CS Adventure
            </ChromaticButton>

            <SoapBubbleButton
              onClick={() => onNavigate('curriculum', 'quest', 'stage-0')}
              tint="rgb(16 185 129)"
              opacity={0.92}
              style={{ fontSize: 12.5 }}
              className="!min-h-[38px] !px-4 text-xs font-semibold text-white whitespace-nowrap shrink-0"
            >
              <Compass className="h-3.5 w-3.5 text-emerald-100" />
              <span>Chapter 0 (Zero CS)</span>
            </SoapBubbleButton>

            <SoapBubbleButton
              onClick={() => onNavigate('lab', 'studio')}
              tint="rgb(59 130 246)"
              opacity={0.88}
              style={{ fontSize: 12.5 }}
              className="!min-h-[38px] !px-4 text-xs font-semibold text-white whitespace-nowrap shrink-0"
            >
              <Orbit className="h-3.5 w-3.5 text-sky-100" />
              <span>Open Optical Studio</span>
            </SoapBubbleButton>

            {onOpenGame && (
              <SoapBubbleButton
                onClick={onOpenGame}
                tint="rgb(245 158 11)"
                opacity={0.92}
                style={{ fontSize: 12.5 }}
                className="!min-h-[38px] !px-4 text-xs font-semibold text-white whitespace-nowrap shrink-0"
              >
                <Gamepad2 className="h-3.5 w-3.5 text-amber-100" />
                <span>Play Kernel Defense</span>
              </SoapBubbleButton>
            )}
          </div>
        </div>

        <div className="lg:col-span-6 bg-[#e2e2e5] border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/10 overflow-hidden">
          <LiquidGlassLogo
            logo="/logo.svg"
            ending="logo"
            theme="light"
            depth={2.9}
            style={{ height: 480 }}
          />
        </div>
      </section>

      {/* 1. Engineering Workbench Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 border-b border-slate-200 dark:border-white/[0.08] pb-5">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-sky-700 dark:text-sky-400 font-semibold">
            Active Focus
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
            Systems Engineering Workbench
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Stage {activeStage.number} — <span className="text-slate-900 dark:text-slate-200 font-semibold">{activeStage.title.split(':')[0]}</span>. Inspect dependency prerequisites, simulate algorithms live, practice in shell/C/Python WASM sandboxes, or explore the Optical Studio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer whitespace-nowrap shrink-0"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-600" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-sky-300" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          )}

          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="optical-card inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer whitespace-nowrap shrink-0"
            >
              <Search className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>Quick Jump</span>
              <span className="rounded border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#04070e] px-1.5 py-0.5 text-[10px] text-slate-600 dark:text-slate-400">
                Ctrl K
              </span>
            </button>
          )}

          <SoapBubbleButton
            onClick={() => onNavigate('curriculum', 'stages', currentStageId)}
            tint="rgb(14 165 233)"
            opacity={0.94}
            style={{ fontSize: 12 }}
            className="!min-h-[34px] !px-4 text-xs font-semibold text-white whitespace-nowrap shrink-0"
          >
            <span>Resume Stage {activeStage.number}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </SoapBubbleButton>

          <button
            onClick={() => setShowLogModal(true)}
            className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white cursor-pointer whitespace-nowrap shrink-0"
          >
            <Clock className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span>Log Study</span>
          </button>

          <button
            onClick={onOpenQuickQuiz}
            className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer whitespace-nowrap shrink-0"
          >
            <HelpCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span>Quiz</span>
          </button>

          <button
            onClick={onOpenCheatSheet}
            className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer whitespace-nowrap shrink-0"
          >
            <BookOpen className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
            <span>Commands</span>
          </button>

          {onDownloadMasteryPdf && (
            <button
              type="button"
              onClick={onDownloadMasteryPdf}
              className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:text-slate-950 dark:hover:text-white cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileDown className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Mastery PDF</span>
            </button>
          )}

          {onOpenGitHubSync && (
            <button
              type="button"
              onClick={onOpenGitHubSync}
              className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-sky-700 dark:text-sky-300 hover:text-slate-950 dark:hover:text-white cursor-pointer whitespace-nowrap shrink-0"
            >
              <FolderGit2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>Push to GitHub</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Unified Inline Engineering Telemetry Strip */}
      <div className="optical-panel grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Curriculum</div>
            <div className="font-mono text-lg font-bold text-slate-950 dark:text-white tabular-nums">
              {stats.completedTopicsCount}
              <span className="text-xs font-normal text-slate-500"> / {stats.totalTopicsCount} topics</span>
            </div>
          </div>
          <span className="font-mono text-sm font-semibold text-sky-700 dark:text-sky-400 tabular-nums">{stats.topicPercent}%</span>
        </div>

        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Daily Streak</div>
            <div className="font-mono text-lg font-bold text-slate-950 dark:text-white tabular-nums">
              {stats.currentStreak}
              <span className="text-xs font-normal text-slate-500"> {stats.currentStreak === 1 ? 'day' : 'days'}</span>
            </div>
          </div>
          <span
            className={`font-mono text-xs tabular-nums font-semibold ${
              stats.dailyGoalPercent >= 100 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
            }`}
          >
            {stats.todayMinutesLogged}/{stats.dailyGoalMinutes}m
          </span>
        </div>

        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Wargame Shell</div>
            <div className="font-mono text-lg font-bold text-slate-950 dark:text-white tabular-nums">
              {stats.banditCount}
              <span className="text-xs font-normal text-slate-500"> / 16 cleared</span>
            </div>
          </div>
          <span className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {Math.round((stats.banditCount / 16) * 100)}%
          </span>
        </div>

        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Practice &amp; Builds</div>
            <div className="font-mono text-lg font-bold text-slate-950 dark:text-white tabular-nums">
              {hoursLogged}
              <span className="text-xs font-normal text-slate-500"> hrs logged</span>
            </div>
          </div>
          <span className="font-mono text-xs text-slate-700 dark:text-slate-300 tabular-nums font-medium">
            {stats.completedProjectsCount}/{stats.totalProjectsCount} builds
          </span>
        </div>
      </div>

      {/* 2b. Next Best Engineering Action Advisor & Workspace Time Investment */}
      {nextBestAction && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 optical-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-sky-700 dark:text-sky-400 font-semibold">
                <Compass className="h-3.5 w-3.5" />
                <span>Next Best Action · {nextBestAction.badge}</span>
              </div>
              <h3 className="font-display text-base font-bold text-slate-950 dark:text-white">
                {nextBestAction.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                {nextBestAction.description}
              </p>
            </div>

            <SoapBubbleButton
              onClick={() =>
                onNavigate(nextBestAction.workspace, nextBestAction.subTab, nextBestAction.stageId)
              }
              tint="rgb(14 165 233)"
              opacity={0.94}
              style={{ fontSize: 12 }}
              className="!min-h-[36px] !px-4 font-semibold text-white whitespace-nowrap shrink-0"
            >
              <span>{nextBestAction.ctaLabel}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </SoapBubbleButton>
          </div>

          <div className="lg:col-span-4 optical-panel rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                <Clock3 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Workspace Time</span>
              </span>
              <span className="text-slate-500 tabular-nums">{totalTrackedWorkspaceMinutes}m logged</span>
            </div>
            <div className="space-y-1.5">
              {workspaceSummary.slice(0, 3).map((item) => {
                const pct =
                  totalTrackedWorkspaceMinutes > 0
                    ? Math.max(8, Math.round((item.minutes / totalTrackedWorkspaceMinutes) * 100))
                    : 0;
                return (
                  <div key={item.workspace} className="space-y-0.5 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>{item.label}</span>
                      <span className="text-slate-900 dark:text-slate-200 font-semibold tabular-nums">
                        {item.minutes}m
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
                        style={{ width: `${item.minutes > 0 ? pct : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Interactive 16-Stage Dependency Skill Graph */}
      <CurriculumSkillGraph
        completedTopics={completedTopics}
        currentStageId={currentStageId}
        onOpenStage={(stageId) => onNavigate('curriculum', 'stages', stageId)}
      />

      {/* 3b. Learning Progress Visualization, Personalized Stage Milestones & Topic Completion System */}
      <ProgressAnalyticsDeck
        currentStageId={currentStageId}
        stageProgressList={stageProgressList}
        cadenceMetrics={cadenceMetrics}
        stats={stats}
        completedTopics={completedTopics}
        autoLogTopicPractice={autoLogTopicPractice}
        onSetAutoLogTopicPractice={onSetAutoLogTopicPractice}
        onCompleteTopicWithHabit={onCompleteTopicWithHabit}
        onSetStageTargetDate={onSetStageTargetDate}
        onGeneratePersonalizedPlan={onGeneratePersonalizedPlan}
        onNavigate={onNavigate}
        onOpenAiMentor={onOpenAiMentor}
        onDownloadMasteryPdf={onDownloadMasteryPdf}
      />

      {/* 4. Interactive Workbench Launch Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          {
            title: 'Spatial & Optical Studio',
            desc: 'Depth cloud, WebGL refraction, soap optics, terrain & rigid-body physics',
            icon: Orbit,
            accent: 'text-fuchsia-600 dark:text-fuchsia-400',
            onClick: () => onNavigate('lab', 'studio'),
          },
          {
            title: 'Algorithms & Graphs Lab',
            desc: 'Live Merge, Quick, Dijkstra, BFS & DFS step visualizer',
            icon: Grid3X3,
            accent: 'text-sky-600 dark:text-sky-400',
            onClick: () => onNavigate('lab', 'visualizer'),
          },
          {
            title: 'Python & C WASM Sandbox',
            desc: 'Client-side WASM compiler & assertion runner with saved snippets',
            icon: Code2,
            accent: 'text-emerald-600 dark:text-emerald-400',
            onClick: () => onNavigate('lab', 'playground'),
          },
          {
            title: 'Interactive Shell Terminal',
            desc: 'Virtual Linux FS, split viewer & hardened wargame SSH',
            icon: Terminal,
            accent: 'text-amber-600 dark:text-amber-400',
            onClick: () => onNavigate('shell'),
          },
          {
            title: 'Diagram & Motion Studio',
            desc: 'Create CS blueprints, edit uploaded photos & export WebM animations',
            icon: Film,
            accent: 'text-cyan-600 dark:text-cyan-400',
            onClick: () => onNavigate('lab', 'media'),
          },
          {
            title: 'Open-Source Syllabus Pack',
            desc: 'Custom pacing calculator, printable HTML & GitHub exports',
            icon: Download,
            accent: 'text-sky-700 dark:text-sky-300',
            onClick: () => onNavigate('curriculum', 'export'),
          },
        ].map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.title}
              onClick={tool.onClick}
              className="optical-card rounded-xl p-4 text-left cursor-pointer group flex items-start gap-3"
            >
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${tool.accent}`} />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">
                  {tool.title}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">{tool.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 5. Daily Focus Micro-Task */}
      <DailyChallengeWidget
        currentStageId={currentStageId}
        onNavigate={(ws, sub) => onNavigate(ws, sub)}
        onOpenAiMentor={(p) => onOpenAiMentor(p)}
        onCompleteChallenge={onCompleteDailyChallenge}
        isCompletedToday={isDailyChallengeCompleted}
      />

      {/* 5b. 30-Day Daily Habit Tracker & Weekly Contribution Heatmap */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-6">
          <DailyHabitTracker
            last30Days={cadenceMetrics.last30Days}
            currentStreak={stats.currentStreak}
            longestStreak30={cadenceMetrics.longestStreak30}
            goalDays30={cadenceMetrics.goalDays30}
            dailyGoalMinutes={stats.dailyGoalMinutes}
            todayMinutesLogged={stats.todayMinutesLogged}
            currentStageId={currentStageId}
            onQuickLog={(minutes, stageId, notes) => onLogStudy(minutes, stageId, notes)}
          />
        </div>

        <div className="xl:col-span-6">
          <WeeklyContributionHeatmap
            studyLogs={studyLogs}
            last84Days={cadenceMetrics.last84Days}
            dailyGoalMinutes={stats.dailyGoalMinutes}
          />
        </div>
      </div>

      {/* 6. Dynamic Engineering Badges & Visual Medals */}
      <BadgesCollection
        badges={badgesSummary.badges}
        unlockedCount={badgesSummary.unlockedCount}
        totalCount={badgesSummary.totalCount}
        totalLinesOfCode={badgesSummary.totalLinesOfCode}
        totalBadgeXp={badgesSummary.totalBadgeXp}
        currentStreak={stats.currentStreak}
        completedProjectsCount={stats.completedProjectsCount}
        recentlyUnlockedIds={recentlyUnlockedBadgeIds}
        onDismissCelebration={onDismissBadgeCelebration}
        onNavigate={onNavigate}
      />

      {/* 7. Two-Column Consistency, Milestones & Study Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Weekly Cadence & Milestones (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="optical-panel rounded-2xl p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/[0.08] pb-3.5">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">Weekly Cadence &amp; Daily Goal</h2>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-mono">
                <span className="text-slate-500 mr-1">Target:</span>
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => onSetDailyGoal(mins)}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer tabular-nums ${
                      stats.dailyGoalMinutes === mins
                        ? 'bg-sky-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center">
              {last7Days.map((d) => (
                <div key={d.dateStr} className="flex flex-col items-center gap-1.5">
                  <span className="text-[11px] font-mono text-slate-500">{d.dayLabel}</span>
                  <div
                    className={`h-9 w-full rounded-lg flex items-center justify-center font-mono text-xs border tabular-nums ${
                      d.minutes > 0
                        ? 'border-emerald-500/40 bg-emerald-500/12 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-semibold'
                        : 'border-slate-200 dark:border-white/[0.07] bg-slate-100 dark:bg-[#04070f]/80 text-slate-500 dark:text-slate-600'
                    } ${d.isToday ? 'ring-1 ring-sky-500/70' : ''}`}
                    title={`${d.dateStr}: ${d.minutes}m logged`}
                  >
                    {d.minutes > 0 ? `${d.minutes}m` : '—'}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-white/[0.08] text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                Today: <strong className="text-slate-900 dark:text-slate-200">{stats.todayMinutesLogged}m</strong> / {stats.dailyGoalMinutes}m
              </span>
              <div className="flex items-center gap-1.5">
                {[15, 30, 45].map((m) => (
                  <button
                    key={m}
                    onClick={() => onLogStudy(m, currentStageId, `Quick logged ${m}m study practice`)}
                    className="optical-card px-2.5 py-1 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer tabular-nums"
                  >
                    +{m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="optical-panel rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/[0.08] pb-3.5">
              <div>
                <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">Engineering Milestones</h2>
                <p className="text-xs text-slate-500 font-mono tabular-nums">
                  {stats.completedMilestonesCount} of {stats.totalMilestonesCount} complete
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="optical-inset flex rounded-lg p-0.5 text-[11px] font-medium">
                  {(['all', 'active', 'completed'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilterMilestones(f)}
                      className={`px-2.5 py-1 rounded-md transition-colors capitalize cursor-pointer ${
                        filterMilestones === f
                          ? 'bg-white dark:bg-white/10 text-slate-950 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowMilestoneForm(!showMilestoneForm)}
                  className="optical-card inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {showMilestoneForm && (
              <form
                onSubmit={handleCreateMilestone}
                className="optical-inset rounded-xl p-3.5 space-y-3 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    value={msTitle}
                    onChange={(e) => setMsTitle(e.target.value)}
                    placeholder="Milestone title..."
                    className="sm:col-span-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#060913] px-3 py-1.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                    autoFocus
                  />
                  <select
                    value={msCategory}
                    onChange={(e) => setMsCategory(e.target.value as UserMilestone['category'])}
                    className="rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#060913] px-2.5 py-1.5 text-slate-900 dark:text-slate-200 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="basics">Basics &amp; Math</option>
                    <option value="algorithms">Algorithms</option>
                    <option value="systems">Systems &amp; C</option>
                    <option value="bandit">Wargame Shell</option>
                    <option value="projects">Projects</option>
                    <option value="custom">Custom</option>
                  </select>
                  <input
                    type="date"
                    value={msTargetDate}
                    onChange={(e) => setMsTargetDate(e.target.value)}
                    className="rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#060913] px-2.5 py-1.5 text-slate-900 dark:text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={msStageId}
                    onChange={(e) => setMsStageId(e.target.value)}
                    className="rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#060913] px-2.5 py-1.5 text-slate-800 dark:text-slate-300 font-mono focus:border-sky-500 focus:outline-none"
                  >
                    {STAGES_DATA.map((s) => (
                      <option key={s.id} value={s.id}>
                        Stage {s.number}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowMilestoneForm(false)}
                      className="px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <SoapBubbleButton
                      type="submit"
                      tint="rgb(14 165 233)"
                      opacity={0.94}
                      style={{ fontSize: 11.5 }}
                      className="!min-h-[28px] !px-3 font-semibold text-white"
                    >
                      Save (+75 XP)
                    </SoapBubbleButton>
                  </div>
                </div>
              </form>
            )}

            <div className="optical-inset divide-y divide-slate-200 dark:divide-white/[0.06] rounded-xl overflow-hidden">
              {filteredMilestones.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No milestones in this view.
                </div>
              ) : (
                filteredMilestones.map((m) => (
                  <div
                    key={m.id}
                    className="px-3.5 py-3 flex items-center justify-between gap-3 hover:bg-slate-200/40 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => onToggleMilestone(m.id)}
                        className="mt-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                        title={m.completed ? 'Mark active' : 'Mark completed'}
                      >
                        {m.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div
                          className={`text-xs font-medium ${
                            m.completed ? 'line-through text-slate-500' : 'text-slate-900 dark:text-slate-200'
                          }`}
                        >
                          {m.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 text-[11px] font-mono text-slate-500 mt-0.5">
                          <span className="uppercase">{m.category}</span>
                          {m.stageId && (
                            <>
                              <span aria-hidden="true">·</span>
                              <button
                                onClick={() => onNavigate('curriculum', 'stages', m.stageId)}
                                className="text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                              >
                                Stage {m.stageId.replace('stage-', '')}
                              </button>
                            </>
                          )}
                          {m.targetDate && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {m.targetDate}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 tabular-nums font-semibold">
                        +{m.xpReward} XP
                      </span>
                      <button
                        onClick={() => onDeleteMilestone(m.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete milestone"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-slate-500 font-mono">Presets:</span>
              {PRESET_MILESTONES.map((preset) => (
                <button
                  key={preset.title}
                  onClick={() => onAddMilestone(preset.title, preset.category, undefined, preset.stageId, 75)}
                  className="optical-inset px-2.5 py-0.5 rounded-md text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-white/20 transition-colors cursor-pointer truncate max-w-[220px]"
                >
                  + {preset.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Study Log + Quick Directory Links (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="optical-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-3">
              <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">Recent Study Log</h2>
              <button
                onClick={() => setShowLogModal(true)}
                className="text-xs font-mono text-sky-700 dark:text-sky-400 hover:underline cursor-pointer font-semibold"
              >
                + Log Session
              </button>
            </div>

            <div className="space-y-2.5">
              {studyLogs.slice(0, 6).map((entry) => (
                <div
                  key={entry.id}
                  className="optical-inset rounded-xl p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-mono text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
                    <span>{entry.date} · {entry.stageId.toUpperCase()}</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{entry.minutes}m</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">{entry.notes}</p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <button
                onClick={() => onNavigate('curriculum', 'atlas')}
                className="text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
              >
                Open A–Z Atlas -&gt;
              </button>
              <button
                onClick={() => onNavigate('curriculum', 'projects')}
                className="text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                View 16 Capstone Builds -&gt;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Log Study Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 dark:bg-[#020409]/92 backdrop-blur-sm p-4">
          <div className="optical-panel w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-3">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Log Study Session</h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">Duration (minutes)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 60, 90, 120].map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setLogMinutes(m)}
                      className={`py-1.5 font-mono rounded-lg border transition-colors cursor-pointer tabular-nums ${
                        logMinutes === m
                          ? 'border-sky-500 bg-sky-500/15 text-sky-800 dark:text-sky-200 font-semibold'
                          : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04070e] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">Stage</label>
                <select
                  value={logStage}
                  onChange={(e) => setLogStage(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#04070e] px-3 py-2 text-slate-900 dark:text-slate-200 focus:border-sky-500 focus:outline-none"
                >
                  {STAGES_DATA.map((s) => (
                    <option key={s.id} value={s.id}>
                      Stage {s.number}: {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notes</label>
                <textarea
                  required
                  rows={3}
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="Summarize what you practiced or solved..."
                  className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#04070e] p-2.5 text-slate-900 dark:text-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <SoapBubbleButton
                  type="submit"
                  tint="rgb(14 165 233)"
                  opacity={0.94}
                  style={{ fontSize: 12 }}
                  className="!min-h-[34px] !px-4 font-semibold text-white"
                >
                  Save Session (+{Math.floor(logMinutes / 30) * 25} XP)
                </SoapBubbleButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
