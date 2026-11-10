'use client';

import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  Clock,
  Target,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  FolderGit2,
  Terminal,
  ShieldCheck,
  Check,
  RotateCcw,
} from 'lucide-react';
import { STAGES_DATA } from '@/lib/curriculum-data';
import { UserMilestone, StudyLogEntry } from '@/hooks/use-odyssey-store';

interface ProgressDashboardProps {
  stats: {
    totalTopicsCount: number;
    completedTopicsCount: number;
    topicPercent: number;
    completedProjectsCount: number;
    totalProjectsCount: number;
    banditCount: number;
    totalMinutesLogged: number;
    todayMinutesLogged?: number;
    dailyGoalMinutes?: number;
    dailyGoalPercent?: number;
    completedMilestonesCount?: number;
    totalMilestonesCount?: number;
    xp: number;
    levelNumber: number;
    heroTitle: string;
    currentStreak: number;
  };
  completedTopics: Record<string, boolean>;
  userMilestones: UserMilestone[];
  studyLogs: StudyLogEntry[];
  onToggleMilestone: (id: string) => void;
  onAddMilestone: (title: string, category: UserMilestone['category'], targetDate?: string, stageId?: string, xpReward?: number) => void;
  onDeleteMilestone: (id: string) => void;
  onSetDailyGoal: (minutes: number) => void;
  onLogStudy: (minutes: number, stageId: string, notes: string) => void;
  onSelectStage: (stageId: string) => void;
  onOpenAiMentor?: (prompt?: string) => void;
}

export function ProgressDashboard({
  stats,
  completedTopics,
  userMilestones,
  studyLogs,
  onToggleMilestone,
  onAddMilestone,
  onDeleteMilestone,
  onSetDailyGoal,
  onLogStudy,
  onSelectStage,
  onOpenAiMentor,
}: ProgressDashboardProps) {
  const [filterMilestones, setFilterMilestones] = useState<'all' | 'active' | 'completed'>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<UserMilestone['category']>('custom');
  const [newTargetDate, setNewTargetDate] = useState<string>('');
  const [newStageId, setNewStageId] = useState<string>('stage-0');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayMinutes = stats.todayMinutesLogged ?? 0;
  const dailyGoal = stats.dailyGoalMinutes ?? 30;
  const dailyPercent = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

  // 7-day streak activity calculation
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const minutes = studyLogs.filter((l) => l.date === dateStr).reduce((acc, curr) => acc + (curr.minutes || 0), 0);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    return { dateStr, minutes, dayLabel, isToday: dateStr === todayStr };
  });

  const filteredMilestones = userMilestones.filter((m) => {
    if (filterMilestones === 'active') return !m.completed;
    if (filterMilestones === 'completed') return m.completed;
    return true;
  });

  const handleCreateMilestone = () => {
    if (!newTitle.trim()) return;
    onAddMilestone(newTitle.trim(), newCategory, newTargetDate || undefined, newStageId || undefined, 75);
    setNewTitle('');
    setShowAddModal(false);
  };

  const PRESET_MILESTONES = [
    { title: 'Master 8-Bit Binary, Hex & 2s Complement', category: 'basics' as const, stageId: 'stage-0' },
    { title: 'Conquer Bandit Levels 0 to 5 over SSH', category: 'bandit' as const, stageId: 'stage-1' },
    { title: 'Write & Run First C Pointer Function in Playground', category: 'basics' as const, stageId: 'stage-2' },
    { title: 'Master Big-O Asymptotics & Sorting Algorithms', category: 'algorithms' as const, stageId: 'stage-4' },
    { title: 'Publish 1st Documented GitHub Portfolio Project', category: 'projects' as const, stageId: 'stage-2' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Executive Summary & Level Badge */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                <Trophy className="h-3.5 w-3.5" />
                Level {stats.levelNumber}: {stats.heroTitle}
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[11px] font-mono text-slate-300">
                {stats.xp} Total XP Earned
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>Student Progress &amp; Milestone Command</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Track your daily consistency, personalize your CS learning milestones, and monitor your 6-month journey
              from zero fundamentals to collegiate cybersecurity hero!
            </p>
          </div>

          {onOpenAiMentor && (
            <button
              onClick={() =>
                onOpenAiMentor(
                  `I am currently at Level ${stats.levelNumber} (${stats.heroTitle}) with ${stats.topicPercent}% curriculum completion and a ${stats.currentStreak}-day streak. Analyze my study momentum and give me a high-impact study goal for today!`
                )
              }
              className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/60 px-4 py-2.5 text-xs font-bold text-amber-200 transition-all cursor-pointer shadow-md shrink-0"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Ask AI Progress Coach</span>
            </button>
          )}
        </div>

        {/* 4 Metric Quick-Gauges */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Gauge 1: Curriculum Topics */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Curriculum Topics</span>
              <span className="text-cyan-400 font-bold">{stats.topicPercent}%</span>
            </div>
            <div className="text-xl font-extrabold text-white font-mono">
              {stats.completedTopicsCount} <span className="text-xs text-slate-500 font-normal">/ {stats.totalTopicsCount}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.topicPercent}%` }}
              />
            </div>
          </div>

          {/* Gauge 2: Bandit Wargames */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Bandit Wargame</span>
              <span className="text-emerald-400 font-bold">{stats.banditCount}/16</span>
            </div>
            <div className="text-xl font-extrabold text-white font-mono">
              Level {stats.banditCount > 0 ? stats.banditCount - 1 : 0}
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((stats.banditCount / 16) * 100)}%` }}
              />
            </div>
          </div>

          {/* Gauge 3: Portfolio Projects */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Portfolio Projects</span>
              <span className="text-indigo-400 font-bold">
                {stats.completedProjectsCount}/{stats.totalProjectsCount}
              </span>
            </div>
            <div className="text-xl font-extrabold text-white font-mono">
              {stats.completedProjectsCount} <span className="text-xs text-slate-500 font-normal">Done</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((stats.completedProjectsCount / stats.totalProjectsCount) * 100)}%` }}
              />
            </div>
          </div>

          {/* Gauge 4: Total Study Time */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Study Hours</span>
              <span className="text-amber-400 font-bold">
                {(stats.totalMinutesLogged / 60).toFixed(1)} hrs
              </span>
            </div>
            <div className="text-xl font-extrabold text-white font-mono">
              {stats.totalMinutesLogged} <span className="text-xs text-slate-500 font-normal">min</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((stats.totalMinutesLogged / 600) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Daily Goal & Streak Engine (Grid 2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Daily Study Goal Card (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Daily Learning Goal</h3>
            </div>

            {/* Goal selector */}
            <div className="flex items-center gap-1 text-xs font-mono">
              <span className="text-slate-400 mr-1">Target:</span>
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => onSetDailyGoal(mins)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    dailyGoal === mins
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Today's progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">
                Today&apos;s Focus: <strong className="text-white">{todayMinutes}</strong> / {dailyGoal} minutes
              </span>
              <span className={`font-bold ${dailyPercent >= 100 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                {dailyPercent >= 100 ? '🎉 Goal Completed!' : `${dailyPercent}% Met`}
              </span>
            </div>

            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  dailyPercent >= 100 ? 'bg-emerald-500' : 'bg-cyan-500'
                }`}
                style={{ width: `${dailyPercent}%` }}
              />
            </div>
          </div>

          {/* Quick study logging shortcuts */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-400 font-mono">Quick Log Today:</span>
            <div className="flex items-center gap-1.5">
              {[15, 30, 45].map((m) => (
                <button
                  key={m}
                  onClick={() => onLogStudy(m, 'stage-0', `Quick logged ${m}m study practice`)}
                  className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 transition-all cursor-pointer"
                >
                  +{m} min
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Streak & 7-Day Matrix (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-500 animate-pulse" />
              <h3 className="text-sm font-bold text-white">Daily Consistency Streak</h3>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 font-mono text-xs font-bold text-amber-400">
              <span>{stats.currentStreak} Day Streak 🔥</span>
            </div>
          </div>

          {/* 7-Day Activity Matrix */}
          <div className="grid grid-cols-7 gap-2 pt-1 text-center">
            {last7Days.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-400">{d.dayLabel}</span>
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center font-mono text-xs font-bold border transition-all ${
                    d.minutes > 0
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-sm shadow-emerald-950'
                      : 'bg-slate-950 border-slate-800 text-slate-600'
                  } ${d.isToday ? 'ring-2 ring-cyan-400' : ''}`}
                  title={`${d.dateStr}: ${d.minutes} minutes logged`}
                >
                  {d.minutes > 0 ? `${d.minutes}m` : '0'}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800/80 pt-3">
            Consistency is the single greatest predictor of collegiate CS success. Logging even 15 minutes a day maintains synaptic connections and protects your streak.
          </p>
        </div>
      </div>

      {/* 3. Personalized Milestones Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400 mb-1">
              <span>CUSTOM TARGETS</span>
              <span>·</span>
              <span>PERSONALIZED GOALS</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>My Personalized Milestones</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                ({userMilestones.filter((m) => m.completed).length}/{userMilestones.length} Completed)
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="flex rounded-lg bg-slate-950 border border-slate-800 p-1 text-xs font-semibold">
              {(['all', 'active', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterMilestones(f)}
                  className={`px-3 py-1 rounded transition-colors capitalize cursor-pointer ${
                    filterMilestones === f ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Add Milestone</span>
            </button>
          </div>
        </div>

        {/* Milestone Preset Quick-Adds */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 font-mono mr-1">Suggested Presets:</span>
          {PRESET_MILESTONES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => onAddMilestone(preset.title, preset.category, undefined, preset.stageId, 75)}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950 hover:border-purple-500/50 hover:bg-purple-950/20 text-slate-300 transition-all cursor-pointer"
            >
              + {preset.title}
            </button>
          ))}
        </div>

        {/* Milestones List */}
        <div className="space-y-2.5">
          {filteredMilestones.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 italic border border-dashed border-slate-800 rounded-xl">
              No milestones found in this filter. Click &quot;+ Add Milestone&quot; or choose a preset above to create your first goal!
            </div>
          ) : (
            filteredMilestones.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  m.completed
                    ? 'border-emerald-500/30 bg-emerald-950/10 text-slate-300'
                    : 'border-slate-800 bg-slate-950/80 text-white hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onToggleMilestone(m.id)}
                    className="cursor-pointer text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                    title={m.completed ? 'Mark in progress' : 'Mark completed'}
                  >
                    {m.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-600 hover:text-slate-400" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold font-mono ${m.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                        {m.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-300 uppercase">
                        {m.category}
                      </span>
                      {m.stageId && (
                        <button
                          onClick={() => onSelectStage(m.stageId!)}
                          className="text-[10px] font-mono text-cyan-400 hover:underline"
                        >
                          Stage {m.stageId.replace('stage-', '')}
                        </button>
                      )}
                    </div>
                    {m.targetDate && (
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                        <Calendar className="h-3 w-3" />
                        <span>Target: {m.targetDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    +{m.xpReward} XP
                  </span>
                  <button
                    onClick={() => onDeleteMilestone(m.id)}
                    className="p-1 rounded text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete milestone"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Stage-by-Stage Curriculum Visualizer */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-cyan-400" />
          <span>Curriculum Mastery by Stage</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STAGES_DATA.map((stage) => {
            const completedInStage = stage.topics.filter((t) => completedTopics[t.id]).length;
            const pct = Math.round((completedInStage / stage.topics.length) * 100);
            return (
              <button
                key={stage.id}
                onClick={() => onSelectStage(stage.id)}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-cyan-500/40 text-left transition-all cursor-pointer flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white font-mono">Stage {stage.number}</span>
                  <span className={`font-mono font-bold ${pct === 100 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {pct}%
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-semibold line-clamp-1">{stage.title}</div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODAL: Add Custom Milestone */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-400" />
                Set Personalized Milestone
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Milestone Goal:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Master C Memory Allocation, Complete Stage 3 Lab"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
                  >
                    <option value="basics">Basics &amp; Math</option>
                    <option value="algorithms">Algorithms</option>
                    <option value="systems">Systems &amp; OS</option>
                    <option value="bandit">Bandit Linux</option>
                    <option value="projects">GitHub Projects</option>
                    <option value="custom">Custom Goal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Stage Link (Optional):</label>
                  <select
                    value={newStageId}
                    onChange={(e) => setNewStageId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
                  >
                    {STAGES_DATA.map((s) => (
                      <option key={s.id} value={s.id}>
                        Stage {s.number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">Target Date (Optional):</label>
                <input
                  type="date"
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMilestone}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Set Milestone (+75 XP)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
