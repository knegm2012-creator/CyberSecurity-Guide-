'use client';

import React, { useState } from 'react';
import { Sparkles, Terminal, Flame, Trophy, Clock, CheckCircle2, ArrowRight, BookOpen, Calculator, GitBranch } from 'lucide-react';
import { STAGES_DATA } from '@/lib/curriculum-data';
import { DailyChallengeWidget } from './DailyChallengeWidget';

interface MissionControlProps {
  stats: {
    totalTopicsCount: number;
    completedTopicsCount: number;
    topicPercent: number;
    completedProjectsCount: number;
    totalProjectsCount: number;
    banditCount: number;
    totalMinutesLogged: number;
    xp: number;
    levelNumber: number;
    heroTitle: string;
    currentStreak: number;
  };
  currentStageId?: string;
  onLogStudy: (minutes: number, stageId: string, notes: string) => void;
  onOpenBandit: () => void;
  onOpenAiMentor: (context?: string) => void;
  onOpenQuickQuiz?: () => void;
  onOpenFoundations?: () => void;
  onOpenGitSandbox?: () => void;
  onSelectStage: (stageId: string) => void;
  onSelectTab?: (tab: string) => void;
  onCompleteDailyChallenge?: (dateKey: string, xp: number, taskTitle: string, stageId: string) => void;
  isDailyChallengeCompleted?: boolean;
}

export function MissionControl({
  stats,
  currentStageId = 'stage-0',
  onLogStudy,
  onOpenBandit,
  onOpenAiMentor,
  onOpenQuickQuiz,
  onOpenFoundations,
  onOpenGitSandbox,
  onSelectStage,
  onSelectTab,
  onCompleteDailyChallenge,
  isDailyChallengeCompleted = false,
}: MissionControlProps) {
  const [showLogModal, setShowLogModal] = useState(false);
  const [minutes, setMinutes] = useState(90);
  const [selectedStage, setSelectedStage] = useState('stage-0');
  const [logNotes, setLogNotes] = useState('');

  const hoursLogged = (stats.totalMinutesLogged / 60).toFixed(1);

  const handleSubmitLog = (e: React.FormEvent) => {
    e.preventDefault();
    onLogStudy(Number(minutes), selectedStage, logNotes);
    setLogNotes('');
    setShowLogModal(false);
  };

  return (
    <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Hero Headline & Subhead */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
              <span>OCTOBER 2026 EDITION</span>
              <span>·</span>
              <span>GRADE 9 ACCELERATED PATH</span>
              <span>·</span>
              <span>10-12 HRS / WEEK</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white text-balance">
              Cybersecurity & CS: Zero to College Hero
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
              Your self-paced 6-month mastery roadmap. Build computer foundations first, conquer Linux on Bandit, master networking, write C/C++ memory code, and produce real GitHub proof.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenQuickQuiz && (
              <button
                onClick={onOpenQuickQuiz}
                className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-950/40 px-3.5 py-2.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/50 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Quick Quiz</span>
              </button>
            )}
            {onOpenFoundations && (
              <button
                onClick={onOpenFoundations}
                className="flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/50 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Calculator className="h-4 w-4 text-cyan-400" />
                <span>⚡ Binary &amp; Math Lab</span>
              </button>
            )}
            {onOpenGitSandbox && (
              <button
                onClick={onOpenGitSandbox}
                className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <GitBranch className="h-4 w-4 text-emerald-400" />
                <span>🌿 Git Sandbox</span>
              </button>
            )}
            <button
              onClick={() => setShowLogModal(true)}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-cyan-500 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Clock className="h-4 w-4" />
              <span>Log Study Session</span>
            </button>
            <button
              onClick={onOpenBandit}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
            >
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span>Bandit Terminal ({stats.banditCount}/16)</span>
            </button>
            <button
              onClick={() => onOpenAiMentor('ELI9: Give me a quick motivating breakdown of what to study today!')}
              className="flex items-center gap-2 rounded-lg border border-purple-500/40 bg-purple-950/40 px-3.5 py-2.5 text-xs font-semibold text-purple-200 hover:bg-purple-900/60 transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>Ask Mentor</span>
            </button>
          </div>
        </div>

        {/* Daily Challenge Widget */}
        <div className="mb-6">
          <DailyChallengeWidget
            currentStageId={currentStageId}
            onSelectTab={onSelectTab || (() => {})}
            onOpenAiMentor={onOpenAiMentor}
            onCompleteChallenge={
              onCompleteDailyChallenge ||
              ((dateKey, xp, title, stageId) => onLogStudy(10, stageId, `Completed Daily Challenge: "${title}"`))
            }
            isCompletedToday={isDailyChallengeCompleted}
            currentStreak={stats.currentStreak}
          />
        </div>

        {/* 4-Box Metric Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Box 1: Overall 6-Month Sprint Progress */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Curriculum Progress</span>
              <span className="font-mono text-cyan-400 font-bold tabular-nums">{stats.topicPercent}%</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tabular-nums">
                {stats.completedTopicsCount}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ {stats.totalTopicsCount} topics</span>
            </div>
            {/* Progress Bar */}
            <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.max(4, stats.topicPercent)}%` }}
              />
            </div>
          </div>

          {/* Box 2: Hero Level & XP */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                Hero Rank
              </span>
              <span className="font-mono text-amber-400 font-bold">Level {stats.levelNumber}</span>
            </div>
            <div className="mt-2">
              <div className="text-sm font-bold text-white truncate">{stats.heroTitle}</div>
              <div className="text-xs text-slate-400 font-mono mt-0.5 tabular-nums">
                {stats.xp} Total XP earned
              </div>
            </div>
          </div>

          {/* Box 3: Habit Streak */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                Daily Streak
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-medium">Consistent</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-orange-400 tabular-nums">
                {stats.currentStreak}
              </span>
              <span className="text-xs text-slate-400">consecutive days</span>
            </div>
          </div>

          {/* Box 4: Study Time Logged */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                Total Time
              </span>
              <span className="text-[11px] font-mono text-slate-400">Target: 10h/wk</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tabular-nums">
                {hoursLogged}
              </span>
              <span className="text-xs text-slate-400">hours logged</span>
            </div>
          </div>
        </div>
      </div>

      {/* Log Study Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Log Study Session</h3>
            <p className="text-xs text-slate-400 mb-4">
              &quot;1.5 hours daily beats 10 hours once a week.&quot; Log your focused study time to maintain your streak and earn XP!
            </p>

            <form onSubmit={handleSubmitLog} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Duration (Minutes)
                </label>
                <div className="flex gap-2">
                  {[30, 60, 90, 120].map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setMinutes(m)}
                      className={`flex-1 py-1.5 text-xs font-mono rounded border transition-colors ${
                        minutes === m
                          ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Active Stage
                </label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  {STAGES_DATA.map((s) => (
                    <option key={s.id} value={s.id}>
                      Stage {s.number}: {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  What did you solve or learn?
                </label>
                <textarea
                  required
                  rows={3}
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="e.g. Practiced Bandit levels 4-6 using find and strings. Solved 2 Python loops on Exercism."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="rounded-lg px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors"
                >
                  Save & Add XP (+{Math.floor(minutes / 30) * 25} XP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
