'use client';

import React, { useState } from 'react';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Compass,
  Flame,
  Layers,
  Play,
  Sparkles,
  Target,
  TrendingUp,
  FileDown,
} from 'lucide-react';
import { STAGES_DATA } from '@/lib/curriculum-data';
import type { StageProgressSummary, CadenceDayCell } from '@/hooks/use-odyssey-store';
import type { PrimaryWorkspace } from './Navbar';
import { SoapBubbleButton } from './soap-bubble';

interface ProgressAnalyticsDeckProps {
  currentStageId: string;
  stageProgressList: StageProgressSummary[];
  cadenceMetrics: {
    last28Days: CadenceDayCell[];
    weeklyMinutes: number;
    daysGoalMet7: number;
    activeDays28: number;
  };
  stats: {
    totalTopicsCount: number;
    completedTopicsCount: number;
    topicPercent: number;
    dailyGoalMinutes: number;
    todayMinutesLogged: number;
    currentStreak: number;
  };
  completedTopics: Record<string, boolean>;
  autoLogTopicPractice: boolean;
  onSetAutoLogTopicPractice: (enabled: boolean) => void;
  onCompleteTopicWithHabit: (topicId: string, stageId: string, logMinutes?: number) => void;
  onSetStageTargetDate: (stageId: string, targetDate: string) => void;
  onGeneratePersonalizedPlan: (horizonWeeks: 12 | 24 | 36) => {
    datesUpdated: number;
    milestonesAdded: number;
  };
  onNavigate: (workspace: PrimaryWorkspace, subTab?: string, stageId?: string) => void;
  onOpenAiMentor: (prompt?: string) => void;
  onDownloadMasteryPdf?: () => void;
}

const STEP_GUIDE = [
  {
    step: '01',
    title: 'Intuition First',
    desc: 'Read the mental model or ask AI Mentor to distill the core mechanism.',
  },
  {
    step: '02',
    title: 'Sandbox Proof',
    desc: 'Run the snippet in Python/C Playground, Shell, or Systems Visualizer.',
  },
  {
    step: '03',
    title: 'Explain Cold',
    desc: 'Write a 2-sentence lab note or answer an Exit Gate item without notes.',
  },
  {
    step: '04',
    title: 'Log & Lock',
    desc: 'Mark topic complete (+15m) so both curriculum & daily streak advance.',
  },
];

export function ProgressAnalyticsDeck({
  currentStageId,
  stageProgressList,
  cadenceMetrics,
  stats,
  completedTopics,
  autoLogTopicPractice,
  onSetAutoLogTopicPractice,
  onCompleteTopicWithHabit,
  onSetStageTargetDate,
  onGeneratePersonalizedPlan,
  onNavigate,
  onOpenAiMentor,
  onDownloadMasteryPdf,
}: ProgressAnalyticsDeckProps) {
  const [selectedHorizon, setSelectedHorizon] = useState<12 | 24 | 36>(24);
  const [planNotice, setPlanNotice] = useState<string | null>(null);
  const [showAllStages, setShowAllStages] = useState(false);

  const activeStage = STAGES_DATA.find((s) => s.id === currentStageId) || STAGES_DATA[0];
  const nextTopicsQueue = activeStage.topics.filter((t) => !completedTopics[t.id]).slice(0, 3);

  const completedStagesCount = stageProgressList.filter((s) => s.isComplete).length;
  const remainingTopics = Math.max(0, stats.totalTopicsCount - stats.completedTopicsCount);
  const weeklyHours = (cadenceMetrics.weeklyMinutes / 60).toFixed(1);

  const visibleStages = showAllStages ? stageProgressList : stageProgressList.slice(0, 8);

  const handleApplyPlan = () => {
    const res = onGeneratePersonalizedPlan(selectedHorizon);
    setPlanNotice(
      res.datesUpdated > 0
        ? `Scheduled ${res.datesUpdated} remaining stages across ${selectedHorizon} weeks (+${res.milestonesAdded} milestones).`
        : `All ${STAGES_DATA.length} stages are already completed!`
    );
    setTimeout(() => setPlanNotice(null), 4500);
  };

  return (
    <section className="space-y-6" aria-label="Learning Progress & Personalized Stage Planner">
      {/* Row A: 28-Day Consistency Heatmap + Daily Topic-Completion Coaching Loop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 28-Day Heatmap & Velocity Card */}
        <div className="lg:col-span-5 optical-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-3.5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                28-Day Consistency Matrix
              </h2>
            </div>
            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
              {cadenceMetrics.activeDays28}/28 active days
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {cadenceMetrics.last28Days.map((cell) => {
              const ratio = stats.dailyGoalMinutes > 0 ? cell.minutes / stats.dailyGoalMinutes : 0;
              const toneClass =
                cell.minutes === 0
                  ? 'border-slate-200 dark:border-white/[0.06] bg-slate-100 dark:bg-[#050811] text-slate-400 dark:text-slate-600'
                  : ratio >= 1.5
                  ? 'border-emerald-500/60 bg-emerald-500/25 dark:bg-emerald-500/35 text-emerald-900 dark:text-emerald-100 font-semibold'
                  : ratio >= 1
                  ? 'border-emerald-500/45 bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200'
                  : 'border-sky-500/35 bg-sky-500/12 dark:bg-sky-500/15 text-sky-800 dark:text-sky-200';

              return (
                <div
                  key={cell.dateStr}
                  title={`${cell.dateStr}: ${cell.minutes} min logged (goal ${stats.dailyGoalMinutes}m)`}
                  className={`h-8 rounded-lg border flex items-center justify-center font-mono text-[10px] tabular-nums transition-colors ${toneClass} ${
                    cell.isToday ? 'ring-1 ring-sky-500 dark:ring-sky-400' : ''
                  }`}
                >
                  {cell.minutes > 0 ? `${cell.minutes}m` : '·'}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-white/[0.08] text-xs font-mono tabular-nums">
            <div className="optical-inset rounded-xl px-3 py-2">
              <div className="text-[10px] text-slate-500 uppercase">7d Volume</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{weeklyHours} hrs</div>
            </div>
            <div className="optical-inset rounded-xl px-3 py-2">
              <div className="text-[10px] text-slate-500 uppercase">Goal Hit (7d)</div>
              <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                {cadenceMetrics.daysGoalMet7} / 7 days
              </div>
            </div>
            <div className="optical-inset rounded-xl px-3 py-2">
              <div className="text-[10px] text-slate-500 uppercase">Remaining</div>
              <div className="text-sm font-semibold text-sky-700 dark:text-sky-400 mt-0.5">
                {remainingTopics} topics
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-1">
            <span className="inline-flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>Today: {stats.todayMinutesLogged}/{stats.dailyGoalMinutes}m daily goal</span>
            </span>
            <span className="font-mono text-slate-500">{completedStagesCount}/{STAGES_DATA.length} stages done</span>
          </div>
        </div>

        {/* Daily Topic-Completion Workflow & Next-Up Queue */}
        <div className="lg:col-span-7 optical-panel rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/[0.08] pb-3.5">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <div>
                <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                  Daily Topic Completion Loop · Stage {activeStage.number}
                </h2>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Consistent habit system: verify concept mastery, test in sandbox, then lock your daily streak.
                </p>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-[11px] font-mono text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoLogTopicPractice}
                onChange={(e) => onSetAutoLogTopicPractice(e.target.checked)}
                className="accent-sky-600 dark:accent-sky-400 h-3.5 w-3.5 rounded cursor-pointer"
              />
              <span>Auto-log +15m on check-off</span>
            </label>
          </div>

          {/* 4-Step Strategy Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {STEP_GUIDE.map((item) => (
              <div key={item.step} className="optical-inset rounded-xl p-2.5 space-y-1">
                <div className="font-mono text-[10px] text-sky-700 dark:text-sky-400 font-semibold">
                  STEP {item.step}
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">{item.title}</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Actionable Next Unchecked Topics Queue */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400">
              <span>NEXT TOPICS IN STAGE {activeStage.number}</span>
              <button
                type="button"
                onClick={() => onNavigate('curriculum', 'stages', activeStage.id)}
                className="text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
              >
                Open Full Stage Dossier -&gt;
              </button>
            </div>

            {nextTopicsQueue.length === 0 ? (
              <div className="optical-inset rounded-xl p-4 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  All topics in Stage {activeStage.number} are complete! Verify the Exit Gate or advance.
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('curriculum', 'stages', activeStage.id)}
                  className="font-mono text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Open Exit Gate
                </button>
              </div>
            ) : (
              <div className="optical-inset divide-y divide-slate-200 dark:divide-white/[0.06] rounded-xl overflow-hidden">
                {nextTopicsQueue.map((topic) => (
                  <div
                    key={topic.id}
                    className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {topic.title}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {topic.eli9}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenAiMentor(
                            `Give me a concise 3-step explanation + micro-exercise for "${topic.title}" in Stage ${activeStage.number}.`
                          )
                        }
                        className="optical-card inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-mono text-sky-700 dark:text-sky-300 hover:text-slate-950 dark:hover:text-white cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Explain</span>
                      </button>

                      {topic.codeSnippet ? (
                        <button
                          type="button"
                          onClick={() => onNavigate('lab', 'playground')}
                          className="optical-card inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer"
                        >
                          <Play className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Lab</span>
                        </button>
                      ) : null}

                      <SoapBubbleButton
                        onClick={() => onCompleteTopicWithHabit(topic.id, activeStage.id, 15)}
                        tint="rgb(16 185 129)"
                        opacity={0.9}
                        style={{ fontSize: 11 }}
                        className="!min-h-[28px] !px-3 font-mono font-semibold text-white"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Complete (+15m)</span>
                      </SoapBubbleButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row B: 16-Stage Mastery Matrix & Personalized Stage Milestones Planner */}
      <div className="optical-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <Layers className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <div>
              <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                {STAGES_DATA.length}-Stage Mastery &amp; Personalized Stage Deadlines
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Inspect topic + exit-gate mastery per stage and generate or customize target dates for every stage milestone.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="optical-inset flex rounded-lg p-0.5 text-[11px] font-mono">
              {([12, 24, 36] as const).map((weeks) => (
                <button
                  key={weeks}
                  type="button"
                  onClick={() => setSelectedHorizon(weeks)}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    selectedHorizon === weeks
                      ? 'bg-sky-500/18 text-sky-800 dark:text-sky-200 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {weeks}w Plan
                </button>
              ))}
            </div>

            <SoapBubbleButton
              onClick={handleApplyPlan}
              tint="rgb(56 189 248)"
              opacity={0.9}
              style={{ fontSize: 11.5 }}
              className="!min-h-[30px] !px-3.5 font-mono font-semibold text-white"
            >
              <Target className="h-3.5 w-3.5" />
              <span>Generate Stage Milestones</span>
            </SoapBubbleButton>

            <button
              type="button"
              onClick={() => setShowAllStages((prev) => !prev)}
              className="optical-card inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer"
            >
              <TrendingUp className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>{showAllStages ? 'Show Top 8' : `Show All ${stageProgressList.length}`}</span>
            </button>

            {onDownloadMasteryPdf && (
              <button
                type="button"
                onClick={onDownloadMasteryPdf}
                className="optical-card inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white cursor-pointer whitespace-nowrap"
              >
                <FileDown className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Mastery PDF</span>
              </button>
            )}
          </div>
        </div>

        {planNotice && (
          <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 dark:bg-emerald-950/30 px-3.5 py-2 text-xs font-mono text-emerald-800 dark:text-emerald-300">
            {planNotice}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {visibleStages.map((s) => {
            const isCurrent = s.stageId === currentStageId;
            return (
              <div
                key={s.stageId}
                className={`optical-card rounded-xl p-3.5 space-y-2.5 transition-colors ${
                  isCurrent ? '!border-sky-500/50 bg-sky-500/[0.06]' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('curriculum', 'stages', s.stageId)}
                    className="text-left min-w-0 cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      <span className={isCurrent ? 'text-sky-700 dark:text-sky-400 font-semibold' : ''}>
                        STAGE {String(s.stageNumber).padStart(2, '0')}
                      </span>
                      {s.isComplete && (
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors line-clamp-1 mt-0.5">
                      {s.shortTitle}
                    </div>
                  </button>
                  <span className="font-mono text-xs font-semibold text-sky-700 dark:text-sky-400 tabular-nums shrink-0">
                    {s.topicPercent}%
                  </span>
                </div>

                {/* Progress Track (Topics + Exit Gate) */}
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/[0.07] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        s.isComplete ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-sky-500 dark:bg-sky-400'
                      }`}
                      style={{ width: `${s.topicPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 tabular-nums">
                    <span>Topics {s.topicsDone}/{s.topicsTotal}</span>
                    <span>Exit {s.exitDone}/{s.exitTotal}</span>
                  </div>
                </div>

                {/* Editable Personalized Target Date */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-white/[0.06]">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-600 dark:text-slate-400 shrink-0">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    <span>Target</span>
                  </span>
                  <input
                    type="date"
                    aria-label={`Target date for Stage ${s.stageNumber}`}
                    value={s.targetDate || ''}
                    onChange={(e) => onSetStageTargetDate(s.stageId, e.target.value)}
                    className="rounded border border-slate-300 dark:border-white/10 bg-white dark:bg-[#050811] px-2 py-0.5 text-[10px] font-mono text-slate-800 dark:text-slate-200 focus:border-sky-500 dark:focus:border-sky-400 focus:outline-none"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
