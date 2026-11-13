'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { STAGES_DATA } from '@/lib/curriculum-data';
import { StudyLogEntry, UserMilestone } from '@/hooks/use-odyssey-store';
import { DailyChallengeWidget } from './DailyChallengeWidget';
import { CurriculumSkillGraph } from './CurriculumSkillGraph';
import { LiquidGlassLogo } from './liquid-glass-logo';
import { ChromaticButton } from './chromatic-button';
import { SoapBubbleButton } from './soap-bubble';
import type { PrimaryWorkspace } from './Navbar';

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
  onLogStudy: (minutes: number, stageId: string, notes: string) => void;
  onNavigate: (workspace: PrimaryWorkspace, subTab?: string, stageId?: string) => void;
  onOpenAiMentor: (prompt?: string) => void;
  onOpenQuickQuiz: () => void;
  onOpenCheatSheet: () => void;
  onOpenCommandPalette?: () => void;
}

const PRESET_MILESTONES = [
  { title: 'Master 8-Bit Binary, Hex & Two\'s Complement', category: 'basics' as const, stageId: 'stage-0' },
  { title: 'Complete Wargame Levels 0-5 via Shell', category: 'bandit' as const, stageId: 'stage-1' },
  { title: 'Write & Run C Pointer Program in Playground', category: 'systems' as const, stageId: 'stage-4' },
  { title: 'Build First Documented GitHub Portfolio Project', category: 'projects' as const, stageId: 'stage-2' },
];

export function OverviewWorkspace({
  stats,
  currentStageId,
  completedTopics,
  userMilestones,
  studyLogs,
  isDailyChallengeCompleted,
  onCompleteDailyChallenge,
  onToggleMilestone,
  onAddMilestone,
  onDeleteMilestone,
  onSetDailyGoal,
  onLogStudy,
  onNavigate,
  onOpenAiMentor,
  onOpenQuickQuiz,
  onOpenCheatSheet,
  onOpenCommandPalette,
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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-7 space-y-6">
      {/* 0. Futuristic Optical Entrance Stage */}
      <section className="optical-panel rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center">
        <div className="lg:col-span-6 p-7 sm:p-10 space-y-5 bg-gradient-to-br from-[#060913] via-[#04070e] to-black">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400 tabular-nums uppercase tracking-wider">
            <span className="text-sky-400 font-semibold">Level {stats.levelNumber}</span>
            <span aria-hidden="true">·</span>
            <span>{stats.heroTitle}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-300">{stats.xp.toLocaleString()} XP</span>
          </div>

          <div className="space-y-2.5">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white [text-wrap:balance]">
              Systems Engineering Odyssey
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Master computer science from Boolean logic and Linux shell internals to distributed systems, C memory models, and real-time optical hardware computation.
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
              onClick={() => onNavigate('curriculum', 'stages', currentStageId)}
            >
              Get started
            </ChromaticButton>

            <SoapBubbleButton
              onClick={() => onNavigate('lab', 'studio')}
              tint="rgb(148 163 184)"
              opacity={0.78}
              style={{ fontSize: 12.5 }}
              className="!min-h-[38px] !px-4 text-xs font-medium text-slate-100"
            >
              <Orbit className="h-3.5 w-3.5 text-sky-400" />
              <span>Open Spatial Studio</span>
            </SoapBubbleButton>
          </div>
        </div>

        <div className="lg:col-span-6 bg-[#e2e2e5] border-t lg:border-t-0 lg:border-l border-white/10 overflow-hidden">
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
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 border-b border-white/[0.08] pb-5">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-sky-400">
            Active Focus
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white [text-wrap:balance]">
            Systems Engineering Workbench
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Stage {activeStage.number} — <span className="text-slate-200 font-medium">{activeStage.title.split(':')[0]}</span>. Inspect dependency prerequisites, simulate algorithms live, practice in shell/C/Python sandboxes, or explore the Spatial Optical Studio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="optical-card inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 hover:text-white cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 text-sky-400" />
              <span>Quick Jump</span>
              <span className="rounded border border-white/10 bg-[#04070e] px-1.5 py-0.5 text-[10px] text-slate-400">
                Ctrl K
              </span>
            </button>
          )}

          <SoapBubbleButton
            onClick={() => onNavigate('curriculum', 'stages', currentStageId)}
            tint="rgb(14 165 233)"
            opacity={0.92}
            style={{ fontSize: 12 }}
            className="!min-h-[34px] !px-4 text-xs font-semibold text-white whitespace-nowrap"
          >
            <span>Resume Stage {activeStage.number}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </SoapBubbleButton>

          <button
            onClick={() => setShowLogModal(true)}
            className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:text-white cursor-pointer"
          >
            <Clock className="h-3.5 w-3.5 text-sky-400" />
            <span>Log Study</span>
          </button>

          <button
            onClick={onOpenQuickQuiz}
            className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
          >
            <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
            <span>Quiz</span>
          </button>

          <button
            onClick={onOpenCheatSheet}
            className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5 text-slate-300" />
            <span>Commands</span>
          </button>
        </div>
      </div>

      {/* 2. Unified Inline Engineering Telemetry Strip */}
      <div className="optical-panel grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Curriculum</div>
            <div className="font-mono text-lg font-bold text-white tabular-nums">
              {stats.completedTopicsCount}
              <span className="text-xs font-normal text-slate-500"> / {stats.totalTopicsCount} topics</span>
            </div>
          </div>
          <span className="font-mono text-sm font-semibold text-sky-400 tabular-nums">{stats.topicPercent}%</span>
        </div>

        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Daily Streak</div>
            <div className="font-mono text-lg font-bold text-white tabular-nums">
              {stats.currentStreak}
              <span className="text-xs font-normal text-slate-500"> {stats.currentStreak === 1 ? 'day' : 'days'}</span>
            </div>
          </div>
          <span
            className={`font-mono text-xs tabular-nums ${
              stats.dailyGoalPercent >= 100 ? 'text-emerald-400 font-semibold' : 'text-amber-400'
            }`}
          >
            {stats.todayMinutesLogged}/{stats.dailyGoalMinutes}m
          </span>
        </div>

        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Wargame Shell</div>
            <div className="font-mono text-lg font-bold text-white tabular-nums">
              {stats.banditCount}
              <span className="text-xs font-normal text-slate-500"> / 16 cleared</span>
            </div>
          </div>
          <span className="font-mono text-sm font-semibold text-emerald-400 tabular-nums">
            {Math.round((stats.banditCount / 16) * 100)}%
          </span>
        </div>

        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Practice &amp; Builds</div>
            <div className="font-mono text-lg font-bold text-white tabular-nums">
              {hoursLogged}
              <span className="text-xs font-normal text-slate-500"> hrs logged</span>
            </div>
          </div>
          <span className="font-mono text-xs text-slate-300 tabular-nums">
            {stats.completedProjectsCount}/{stats.totalProjectsCount} builds
          </span>
        </div>
      </div>

      {/* 3. Interactive 14-Stage Dependency Skill Graph */}
      <CurriculumSkillGraph
        completedTopics={completedTopics}
        currentStageId={currentStageId}
        onOpenStage={(stageId) => onNavigate('curriculum', 'stages', stageId)}
      />

      {/* 4. Interactive Workbench Launch Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            title: 'Spatial & Optical Studio',
            desc: 'Depth cloud, WebGL refraction, soap optics, terrain & rigid-body physics',
            icon: Orbit,
            accent: 'text-fuchsia-400',
            onClick: () => onNavigate('lab', 'studio'),
          },
          {
            title: 'Algorithms & Graphs Lab',
            desc: 'Live Merge, Quick, Dijkstra, BFS & DFS step visualizer',
            icon: Grid3X3,
            accent: 'text-sky-400',
            onClick: () => onNavigate('lab', 'visualizer'),
          },
          {
            title: 'Python & C Sandbox',
            desc: 'Isolated compiler & runtime with saved snippets',
            icon: Code2,
            accent: 'text-emerald-400',
            onClick: () => onNavigate('lab', 'playground'),
          },
          {
            title: 'Interactive Shell Terminal',
            desc: 'Virtual Linux FS, split viewer & hardened wargame SSH',
            icon: Terminal,
            accent: 'text-amber-400',
            onClick: () => onNavigate('shell'),
          },
          {
            title: 'Open-Source Syllabus Pack',
            desc: 'Custom pacing calculator, printable HTML & GitHub exports',
            icon: Download,
            accent: 'text-sky-300',
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
                <div className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">
                  {tool.title}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{tool.desc}</div>
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

      {/* 6. Two-Column Consistency, Milestones & Study Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Weekly Cadence & Milestones (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="optical-panel rounded-2xl p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-sky-400" />
                <h2 className="font-display text-sm font-semibold text-white">Weekly Cadence &amp; Daily Goal</h2>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-mono">
                <span className="text-slate-500 mr-1">Target:</span>
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => onSetDailyGoal(mins)}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer tabular-nums ${
                      stats.dailyGoalMinutes === mins
                        ? 'bg-sky-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(56,189,248,0.45)]'
                        : 'bg-white/[0.04] border border-white/10 text-slate-400 hover:text-slate-200'
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
                        ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300 font-semibold'
                        : 'border-white/[0.07] bg-[#04070f]/80 text-slate-600'
                    } ${d.isToday ? 'ring-1 ring-sky-400/70' : ''}`}
                    title={`${d.dateStr}: ${d.minutes}m logged`}
                  >
                    {d.minutes > 0 ? `${d.minutes}m` : '—'}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08] text-xs">
              <span className="text-slate-400 font-mono tabular-nums">
                Today: <strong className="text-slate-200">{stats.todayMinutesLogged}m</strong> / {stats.dailyGoalMinutes}m
              </span>
              <div className="flex items-center gap-1.5">
                {[15, 30, 45].map((m) => (
                  <button
                    key={m}
                    onClick={() => onLogStudy(m, currentStageId, `Quick logged ${m}m study practice`)}
                    className="optical-card px-2.5 py-1 rounded-lg text-xs font-mono text-slate-300 hover:text-white cursor-pointer tabular-nums"
                  >
                    +{m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="optical-panel rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
              <div>
                <h2 className="font-display text-sm font-semibold text-white">Engineering Milestones</h2>
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
                          ? 'bg-white/10 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowMilestoneForm(!showMilestoneForm)}
                  className="optical-card inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-sky-400" />
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
                    className="sm:col-span-2 rounded-lg border border-white/10 bg-[#060913] px-3 py-1.5 text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                    autoFocus
                  />
                  <select
                    value={msCategory}
                    onChange={(e) => setMsCategory(e.target.value as UserMilestone['category'])}
                    className="rounded-lg border border-white/10 bg-[#060913] px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
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
                    className="rounded-lg border border-white/10 bg-[#060913] px-2.5 py-1.5 text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={msStageId}
                    onChange={(e) => setMsStageId(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#060913] px-2.5 py-1.5 text-slate-300 font-mono focus:border-sky-500 focus:outline-none"
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
                      className="px-2.5 py-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <SoapBubbleButton
                      type="submit"
                      tint="rgb(14 165 233)"
                      opacity={0.9}
                      style={{ fontSize: 11.5 }}
                      className="!min-h-[28px] !px-3 font-semibold text-white"
                    >
                      Save (+75 XP)
                    </SoapBubbleButton>
                  </div>
                </div>
              </form>
            )}

            <div className="optical-inset divide-y divide-white/[0.06] rounded-xl overflow-hidden">
              {filteredMilestones.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No milestones in this view.
                </div>
              ) : (
                filteredMilestones.map((m) => (
                  <div
                    key={m.id}
                    className="px-3.5 py-3 flex items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => onToggleMilestone(m.id)}
                        className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                        title={m.completed ? 'Mark active' : 'Mark completed'}
                      >
                        {m.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div
                          className={`text-xs font-medium ${
                            m.completed ? 'line-through text-slate-500' : 'text-slate-200'
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
                                className="text-sky-400 hover:underline cursor-pointer"
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
                      <span className="text-[11px] font-mono text-amber-400 tabular-nums">
                        +{m.xpReward} XP
                      </span>
                      <button
                        onClick={() => onDeleteMilestone(m.id)}
                        className="p-1 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
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
                  className="optical-inset px-2.5 py-0.5 rounded-md text-slate-400 hover:text-slate-100 hover:border-white/20 transition-colors cursor-pointer truncate max-w-[220px]"
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
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="font-display text-sm font-semibold text-white">Recent Study Log</h2>
              <button
                onClick={() => setShowLogModal(true)}
                className="text-xs font-mono text-sky-400 hover:underline cursor-pointer"
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
                  <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 tabular-nums">
                    <span>{entry.date} · {entry.stageId.toUpperCase()}</span>
                    <span className="text-emerald-400 font-semibold">{entry.minutes}m</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed line-clamp-2">{entry.notes}</p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <button
                onClick={() => onNavigate('reference', 'sources')}
                className="text-sky-400 hover:underline cursor-pointer"
              >
                Browse Source Library -&gt;
              </button>
              <button
                onClick={() => onNavigate('curriculum', 'projects')}
                className="text-emerald-400 hover:underline cursor-pointer"
              >
                View 14 Capstone Builds -&gt;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Log Study Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020409]/80 backdrop-blur-md p-4">
          <div className="optical-panel w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="font-display text-base font-semibold text-white">Log Study Session</h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Duration (minutes)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 60, 90, 120].map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setLogMinutes(m)}
                      className={`py-1.5 font-mono rounded-lg border transition-colors cursor-pointer tabular-nums ${
                        logMinutes === m
                          ? 'border-sky-400 bg-sky-500/20 text-sky-200 font-semibold'
                          : 'border-white/10 bg-[#04070e] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Stage</label>
                <select
                  value={logStage}
                  onChange={(e) => setLogStage(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#04070e] px-3 py-2 text-slate-200 focus:border-sky-500 focus:outline-none"
                >
                  {STAGES_DATA.map((s) => (
                    <option key={s.id} value={s.id}>
                      Stage {s.number}: {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Notes</label>
                <textarea
                  required
                  rows={3}
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="Summarize what you practiced or solved..."
                  className="w-full rounded-lg border border-white/10 bg-[#04070e] p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <SoapBubbleButton
                  type="submit"
                  tint="rgb(14 165 233)"
                  opacity={0.92}
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
