'use client';

import React, { useMemo, useState } from 'react';
import {
  Compass,
  Crown,
  CheckCircle2,
  Circle,
  Heart,
  Swords,
  Code2,
  Terminal,
  Grid3X3,
  Lightbulb,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Cpu,
  Flame,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { STAGES_DATA } from '@/lib/curriculum-data';
import {
  ADVENTURE_REALMS,
  BIT_WEIGHTS,
  computeBitsValue,
  toSigned8Bit,
  toHexByte,
  toAsciiPreview,
  evaluateBinaryLabMission,
  evaluateLogicGate,
  evaluateLogicLabMission,
  getBossQuestionsForRealm,
  computeAdventureCampaignProgress,
  type AdventureRealm,
  type RealmInteractiveLab,
  type LogicGateType,
  type BinaryLabConfig,
  type LogicGateLabConfig,
  type TraceStepperLabConfig,
  type SystemDiagnosticLabConfig,
} from '@/lib/adventure-quest';
import { SoapBubbleButton } from './soap-bubble';

interface AdventureQuestModeProps {
  selectedStageId: string;
  onSelectStage: (stageId: string) => void;
  completedTopics: Record<string, boolean>;
  completedExitChecks: Record<string, boolean>;
  onToggleTopic: (topicId: string) => void;
  onCompleteTopicWithHabit?: (topicId: string, stageId: string, logMinutes?: number) => void;
  onToggleExitCheck: (checkKey: string) => void;
  onMarkStageComplete: (stageId: string, completed: boolean) => void;
  onLogBossClear?: (minutes: number, stageId: string, notes: string) => void;
  onOpenPlayground: (language: 'python' | 'c', code: string) => void;
  onOpenShell: () => void;
  onOpenVisualizer?: () => void;
  onOpenHandbook: (stageId: string) => void;
  onOpenAiMentor: (context?: string) => void;
}

export function AdventureQuestMode({
  selectedStageId,
  onSelectStage,
  completedTopics,
  completedExitChecks,
  onToggleTopic,
  onCompleteTopicWithHabit,
  onToggleExitCheck,
  onMarkStageComplete,
  onLogBossClear,
  onOpenPlayground,
  onOpenShell,
  onOpenVisualizer,
  onOpenHandbook,
  onOpenAiMentor,
}: AdventureQuestModeProps) {
  const [solvedLabStages, setSolvedLabStages] = useState<Record<string, boolean>>({});
  const [clearedBossStages, setClearedBossStages] = useState<Record<string, boolean>>({});
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const campaign = useMemo(
    () => computeAdventureCampaignProgress(completedTopics, completedExitChecks),
    [completedTopics, completedExitChecks]
  );

  const activeRealm = useMemo(
    () => ADVENTURE_REALMS.find((r) => r.stageId === selectedStageId) || ADVENTURE_REALMS[0],
    [selectedStageId]
  );

  const activeStage = useMemo(
    () => STAGES_DATA.find((s) => s.id === activeRealm.stageId) || STAGES_DATA[0],
    [activeRealm.stageId]
  );

  const activeStatus =
    campaign.realms.find((r) => r.stageId === activeRealm.stageId) || campaign.realms[0];

  const handleSelectChapter = (stageId: string) => {
    setShowHint(false);
    setExpandedTopicId(null);
    onSelectStage(stageId);
  };

  const handleLabSolved = (stageId: string) => {
    if (solvedLabStages[stageId]) return;
    setSolvedLabStages((prev) => ({ ...prev, [stageId]: true }));

    // Reward learner by marking the first incomplete topic in this stage if habit logger is available
    const stageObj = STAGES_DATA.find((s) => s.id === stageId);
    const firstIncomplete = stageObj?.topics.find((t) => !completedTopics[t.id]);
    if (firstIncomplete) {
      if (onCompleteTopicWithHabit) {
        onCompleteTopicWithHabit(firstIncomplete.id, stageId, 10);
      } else {
        onToggleTopic(firstIncomplete.id);
      }
    }
  };

  const handleBossVictory = (realm: AdventureRealm, score: number, total: number) => {
    setClearedBossStages((prev) => ({ ...prev, [realm.stageId]: true }));
    onMarkStageComplete(realm.stageId, true);
    const firstExitKey = `${realm.stageId}-0`;
    if (!completedExitChecks[firstExitKey]) {
      onToggleExitCheck(firstExitKey);
    }
    onLogBossClear?.(
      20,
      realm.stageId,
      `Defeated ${realm.bossName} in Chapter ${realm.chapterNumber} (${score}/${total} verified, +${realm.xpClearReward} XP)`
    );
  };

  const nextRealm = ADVENTURE_REALMS[activeRealm.chapterNumber + 1];

  return (
    <div className="space-y-6">
      {/* Top Campaign Summary + 16-Realm Adventure Map */}
      <section className="optical-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 tabular-nums">
              <span className="inline-flex items-center gap-1.5 text-sky-700 dark:text-sky-400 font-semibold">
                <Compass className="h-3.5 w-3.5" />
                Zero-to-Mastery CS Adventure
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {campaign.masteredRealmsCount} / {campaign.totalRealmsCount} Realms Cleared
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                {campaign.overallPercent}% Campaign Mastery
              </span>
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-950 dark:text-white tracking-tight">
              From Zero Knowledge to Principal Systems Mastery
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeRealm.chapterNumber !== 0 && (
              <button
                type="button"
                onClick={() => handleSelectChapter('stage-0')}
                className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span>Start from Chapter 0</span>
              </button>
            )}
            {campaign.recommendedStageId !== activeRealm.stageId && (
              <SoapBubbleButton
                onClick={() => handleSelectChapter(campaign.recommendedStageId)}
                tint="rgb(14 165 233)"
                opacity={0.94}
                style={{ fontSize: 12 }}
                className="!min-h-[34px] !px-3.5 font-semibold text-white whitespace-nowrap shrink-0"
              >
                <span>Resume Recommended Chapter</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </SoapBubbleButton>
            )}
          </div>
        </div>

        {/* Interactive Chapter Trail */}
        <div className="flex items-stretch gap-2 overflow-x-auto pb-1.5 no-scrollbar">
          {campaign.realms.map((realm) => {
            const isSelected = realm.stageId === activeRealm.stageId;
            const bossDefeated = realm.mastered || Boolean(clearedBossStages[realm.stageId]);
            return (
              <button
                key={realm.stageId}
                type="button"
                onClick={() => handleSelectChapter(realm.stageId)}
                className={`group flex flex-col justify-between min-w-[144px] rounded-xl p-3 text-left border transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'border-sky-500 bg-sky-500/12 dark:bg-sky-500/18 shadow-sm ring-1 ring-sky-500/35'
                    : bossDefeated
                    ? 'border-emerald-500/35 bg-emerald-500/6 dark:bg-emerald-950/20 hover:border-emerald-500/60'
                    : 'border-slate-200 dark:border-white/[0.08] bg-white/75 dark:bg-[#050914]/80 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono tabular-nums">
                  <span
                    className={
                      isSelected
                        ? 'text-sky-700 dark:text-sky-300 font-bold'
                        : 'text-slate-500 dark:text-slate-400'
                    }
                  >
                    CH {String(realm.chapterNumber).padStart(2, '0')}
                  </span>
                  {bossDefeated ? (
                    <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">
                      {realm.progressPercent}%
                    </span>
                  )}
                </div>

                <div className="mt-1.5 text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {realm.realmName}
                </div>

                <div className="mt-2 h-1 w-full rounded-full bg-slate-200 dark:bg-white/[0.08] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      bossDefeated
                        ? 'bg-emerald-500'
                        : isSelected
                        ? 'bg-sky-500'
                        : 'bg-slate-400 dark:bg-slate-500'
                    }`}
                    style={{ width: `${Math.max(bossDefeated ? 100 : 0, realm.progressPercent)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Playable Realm Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Primary Quest Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1 & 2: Zero-CS Story Briefing & First Principles */}
          <section className="optical-panel rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 dark:border-white/[0.08] pb-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 tabular-nums">
                  <span className="text-sky-700 dark:text-sky-400 font-semibold">
                    Chapter {String(activeRealm.chapterNumber).padStart(2, '0')}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{activeRealm.tierLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">
                    +{activeRealm.xpClearReward} Boss XP
                  </span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-950 dark:text-white">
                  {activeRealm.realmName}: {activeStage.title.split(':')[0]}
                </h3>
              </div>

              {(activeStatus.mastered || clearedBossStages[activeRealm.stageId]) && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                  <Crown className="h-4 w-4 text-amber-500" />
                  Realm Mastered
                </span>
              )}
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {activeRealm.storyHook}
            </p>

            {/* Plain-English Analogy for Zero Prior Knowledge */}
            <div className="optical-inset rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                <Lightbulb className="h-3.5 w-3.5" />
                <span>Start From Zero · Plain-English Analogy</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {activeRealm.zeroJargonAnalogy}
              </p>
            </div>

            {/* First Principles Rules */}
            <div className="space-y-2">
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Core Mental Model (4 Takeaways)
              </div>
              <ul className="space-y-2">
                {activeRealm.firstPrinciples.map((rule, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed"
                  >
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-sky-500/12 text-[11px] font-mono font-bold text-sky-700 dark:text-sky-300 tabular-nums">
                      {idx + 1}
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Common Beginner Trap */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 dark:bg-amber-950/20 p-3.5 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Watch Out For This Trap: </span>
                {activeRealm.commonBeginnerTrap}
              </div>
            </div>
          </section>

          {/* Step 3: Interactive Hands-On Quest Lab */}
          <section className="optical-panel rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/[0.08] pb-3.5">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <h4 className="font-display text-base font-bold text-slate-950 dark:text-white">
                  Interactive Hands-On Trial
                </h4>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                {solvedLabStages[activeRealm.stageId] ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Trial Verified (+15m logged)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowHint((h) => !h)}
                    className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300 cursor-pointer"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>{showHint ? 'Hide Hint' : 'Need a Hint?'}</span>
                  </button>
                )}
              </div>
            </div>

            <InteractiveLabRenderer
              key={activeRealm.stageId}
              lab={activeRealm.interactiveLab}
              showHint={showHint}
              alreadySolved={Boolean(solvedLabStages[activeRealm.stageId])}
              onSolved={() => handleLabSolved(activeRealm.stageId)}
            />
          </section>

          {/* Step 4: Boss Encounter */}
          <BossEncounterCard
            key={`boss-${activeRealm.stageId}`}
            realm={activeRealm}
            alreadyCleared={activeStatus.mastered || Boolean(clearedBossStages[activeRealm.stageId])}
            onVictory={(score, total) => handleBossVictory(activeRealm, score, total)}
            nextRealm={nextRealm}
            onAdvanceNext={nextRealm ? () => handleSelectChapter(nextRealm.stageId) : undefined}
          />
        </div>

        {/* Right Companion Sidebar (5 cols) */}
        <aside className="lg:col-span-5 space-y-6">
          {/* Interactive Topic Guide */}
          <section className="optical-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-3">
              <div>
                <h4 className="font-display text-sm font-bold text-slate-950 dark:text-white">
                  Chapter {activeRealm.chapterNumber} Mastery Checklist
                </h4>
                <p className="text-[11px] font-mono text-slate-500 tabular-nums mt-0.5">
                  {activeStatus.topicsDone} of {activeStatus.topicsTotal} concepts verified
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenHandbook(activeRealm.stageId)}
                className="text-xs font-mono text-sky-700 dark:text-sky-400 hover:underline cursor-pointer inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Full Handbook</span>
              </button>
            </div>

            <div className="space-y-2">
              {activeStage.topics.map((topic) => {
                const done = Boolean(completedTopics[topic.id]);
                const expanded = expandedTopicId === topic.id;
                return (
                  <div
                    key={topic.id}
                    className={`rounded-xl border transition-colors ${
                      done
                        ? 'border-emerald-500/30 bg-emerald-500/6 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-white/[0.08] bg-white/70 dark:bg-[#050914]/70'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 p-3">
                      <button
                        type="button"
                        onClick={() => onToggleTopic(topic.id)}
                        className="mt-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer shrink-0"
                        aria-label={`Toggle ${topic.title}`}
                      >
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedTopicId(expanded ? null : topic.id)}
                        className="flex-1 text-left cursor-pointer min-w-0"
                      >
                        <div
                          className={`text-xs font-semibold leading-snug ${
                            done ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {topic.title}
                        </div>
                        <div className="text-[11px] font-mono text-sky-700 dark:text-sky-400 mt-0.5">
                          {expanded ? 'Hide plain explanation' : 'Read plain explanation'}
                        </div>
                      </button>
                    </div>

                    {expanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-200/80 dark:border-white/[0.06] space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <p>
                          <strong className="text-slate-900 dark:text-white">Intuition: </strong>
                          {topic.eli9}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">
                          {topic.description}
                        </p>
                        {topic.codeSnippet && (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenPlayground(
                                topic.codeSnippet!.language === 'c' ? 'c' : 'python',
                                topic.codeSnippet!.code
                              )
                            }
                            className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            <Code2 className="h-3.5 w-3.5" />
                            <span>Run topic example in Sandbox</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Real-World Sandbox Launchpad */}
          <section className="optical-panel rounded-2xl p-5 space-y-3.5">
            <div className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
              Practice in Real Tools
            </div>

            <button
              type="button"
              onClick={() =>
                onOpenPlayground(activeRealm.playgroundStarter.language, activeRealm.playgroundStarter.code)
              }
              className="w-full optical-card rounded-xl p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <Code2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300">
                    {activeRealm.playgroundStarter.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Launch {activeRealm.playgroundStarter.language.toUpperCase()} starter in live WASM sandbox
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
            </button>

            {activeRealm.shellStarterCommand && (
              <button
                type="button"
                onClick={onOpenShell}
                className="w-full optical-card rounded-xl p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <Terminal className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300">
                      Open Linux Wargame Shell
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Practice pipes, permissions &amp; Bandit challenges live
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
              </button>
            )}

            {activeRealm.showAlgoVisualizerButton && onOpenVisualizer && (
              <button
                type="button"
                onClick={onOpenVisualizer}
                className="w-full optical-card rounded-xl p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <Grid3X3 className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300">
                      Open Algorithm &amp; Graph Visualizer
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Animate Merge Sort, Quick Sort, BFS &amp; Dijkstra step-by-step
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                onOpenAiMentor(
                  `Explain Chapter ${activeRealm.chapterNumber} (${activeStage.title}) to someone starting from complete zero, then give me one tiny self-check question.`
                )
              }
              className="w-full optical-card rounded-xl p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300">
                    Ask Mentor About This Chapter
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Get a simpler breakdown or personalized debugging help
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

/* ============================================================================
 * Interactive Micro-Lab Sub-Engines (Deterministic & Zero-Dependency)
 * ========================================================================== */

function InteractiveLabRenderer({
  lab,
  showHint,
  alreadySolved,
  onSolved,
}: {
  lab: RealmInteractiveLab;
  showHint: boolean;
  alreadySolved: boolean;
  onSolved: () => void;
}) {
  if (lab.type === 'binary-switches') {
    return (
      <BinarySwitchboardLab
        config={lab}
        showHint={showHint}
        alreadySolved={alreadySolved}
        onSolved={onSolved}
      />
    );
  }
  if (lab.type === 'logic-gates') {
    return (
      <LogicGateBenchLab
        config={lab}
        showHint={showHint}
        alreadySolved={alreadySolved}
        onSolved={onSolved}
      />
    );
  }
  if (lab.type === 'trace-stepper') {
    return (
      <TraceStepperLab
        config={lab}
        alreadySolved={alreadySolved}
        onSolved={onSolved}
      />
    );
  }
  return (
    <SystemDiagnosticLab
      config={lab}
      alreadySolved={alreadySolved}
      onSolved={onSolved}
    />
  );
}

function BinarySwitchboardLab({
  config,
  showHint,
  alreadySolved,
  onSolved,
}: {
  config: BinaryLabConfig;
  showHint: boolean;
  alreadySolved: boolean;
  onSolved: () => void;
}) {
  const [bits, setBits] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);
  const evaluation = evaluateBinaryLabMission(bits, config.targetUnsigned);
  const currentVal = computeBitsValue(bits);

  const toggleBit = (idx: number) => {
    const next = bits.map((b, i) => (i === idx ? (b ? 0 : 1) : b));
    setBits(next);
    if (evaluateBinaryLabMission(next, config.targetUnsigned).solved) {
      onSolved();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
        {config.prompt}
      </p>

      {showHint && (
        <div className="rounded-lg border border-sky-500/30 bg-sky-500/8 px-3 py-2 text-xs text-sky-900 dark:text-sky-200">
          Hint: {config.hint}
        </div>
      )}

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {BIT_WEIGHTS.map((weight, idx) => {
          const isOn = bits[idx] === 1;
          return (
            <button
              key={weight}
              type="button"
              onClick={() => toggleBit(idx)}
              className={`rounded-xl p-2.5 border text-center transition-all cursor-pointer tabular-nums ${
                isOn
                  ? 'border-sky-500 bg-sky-500 text-white shadow-sm'
                  : 'border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#050914] text-slate-700 dark:text-slate-300 hover:border-slate-400'
              }`}
            >
              <div className={`text-[10px] font-mono ${isOn ? 'text-sky-100' : 'text-slate-500'}`}>
                {weight}
              </div>
              <div className="font-mono text-lg font-bold mt-0.5">{isOn ? '1' : '0'}</div>
            </button>
          );
        })}
      </div>

      <div className="optical-inset rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono text-xs tabular-nums">
        <div>
          <div className="text-[10px] uppercase text-slate-500">Unsigned</div>
          <div className="text-base font-bold text-slate-950 dark:text-white">{currentVal}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-500">Signed (2&apos;s Comp)</div>
          <div className="text-base font-bold text-slate-950 dark:text-white">
            {toSigned8Bit(currentVal)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-500">Hex</div>
          <div className="text-base font-bold text-sky-700 dark:text-sky-400">
            {toHexByte(currentVal)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-500">ASCII</div>
          <div className="text-base font-bold text-emerald-700 dark:text-emerald-400">
            {toAsciiPreview(currentVal)}
          </div>
        </div>
      </div>

      {(evaluation.solved || alreadySolved) && (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>{config.explainAfterSolve}</span>
        </div>
      )}
    </div>
  );
}

function LogicGateBenchLab({
  config,
  showHint,
  alreadySolved,
  onSolved,
}: {
  config: LogicGateLabConfig;
  showHint: boolean;
  alreadySolved: boolean;
  onSolved: () => void;
}) {
  const [gate, setGate] = useState<LogicGateType>('AND');
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);

  const checkSolved = (nextGate: LogicGateType, nextA: boolean, nextB: boolean) => {
    const res = evaluateLogicLabMission(nextGate, nextA, nextB, config);
    if (res.solved) onSolved();
  };

  const output = evaluateLogicGate(gate, a, b);
  const res = evaluateLogicLabMission(gate, a, b, config);

  return (
    <div className="space-y-4">
      <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
        {config.prompt}
      </p>

      {showHint && (
        <div className="rounded-lg border border-sky-500/30 bg-sky-500/8 px-3 py-2 text-xs text-sky-900 dark:text-sky-200">
          Hint: {config.hint}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {(['AND', 'OR', 'XOR', 'NAND', 'XNOR'] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => {
              setGate(g);
              checkSolved(g, a, b);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors cursor-pointer ${
              gate === g
                ? 'border-sky-500 bg-sky-500/15 text-sky-800 dark:text-sky-200'
                : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="optical-inset rounded-xl p-4 grid grid-cols-3 gap-3 items-center text-center font-mono">
        <button
          type="button"
          onClick={() => {
            const nextA = !a;
            setA(nextA);
            checkSolved(gate, nextA, b);
          }}
          className={`rounded-xl py-3 border text-xs font-bold cursor-pointer transition-colors ${
            a
              ? 'border-sky-500 bg-sky-500 text-white'
              : 'border-slate-300 dark:border-white/15 bg-white dark:bg-[#050914] text-slate-700 dark:text-slate-300'
          }`}
        >
          Input A: {a ? '1 (ON)' : '0 (OFF)'}
        </button>

        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
          {gate} Gate
        </div>

        <button
          type="button"
          onClick={() => {
            const nextB = !b;
            setB(nextB);
            checkSolved(gate, a, nextB);
          }}
          className={`rounded-xl py-3 border text-xs font-bold cursor-pointer transition-colors ${
            b
              ? 'border-sky-500 bg-sky-500 text-white'
              : 'border-slate-300 dark:border-white/15 bg-white dark:bg-[#050914] text-slate-700 dark:text-slate-300'
          }`}
        >
          Input B: {b ? '1 (ON)' : '0 (OFF)'}
        </button>
      </div>

      <div
        className={`rounded-xl p-3 text-center font-mono text-sm font-bold border tabular-nums ${
          output
            ? 'border-emerald-500/40 bg-emerald-500/12 text-emerald-800 dark:text-emerald-300'
            : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#050914] text-slate-600 dark:text-slate-400'
        }`}
      >
        Output Signal: {output ? '1 (HIGH / TRUE)' : '0 (LOW / FALSE)'}
      </div>

      {(res.solved || alreadySolved) && (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>{config.explainAfterSolve}</span>
        </div>
      )}
    </div>
  );
}

function TraceStepperLab({
  config,
  alreadySolved,
  onSolved,
}: {
  config: TraceStepperLabConfig;
  alreadySolved: boolean;
  onSolved: () => void;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const currentStep = config.steps[stepIdx] || config.steps[0];
  const isCorrect = selectedChoice === config.correctIndex;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
          {config.prompt}
        </p>
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          {config.languageLabel} · Step {stepIdx + 1}/{config.steps.length}
        </span>
      </div>

      {/* Live Stepper Window */}
      <div className="optical-inset rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-sky-700 dark:text-sky-400">
          <span>{currentStep.lineLabel}</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={stepIdx === 0}
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
              className="px-2 py-1 rounded border border-slate-300 dark:border-white/15 disabled:opacity-40 cursor-pointer inline-flex items-center gap-1 text-slate-700 dark:text-slate-200"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Prev</span>
            </button>
            <button
              type="button"
              disabled={stepIdx >= config.steps.length - 1}
              onClick={() => setStepIdx((i) => Math.min(config.steps.length - 1, i + 1))}
              className="px-2.5 py-1 rounded bg-sky-600 text-white disabled:opacity-40 cursor-pointer inline-flex items-center gap-1 font-semibold"
            >
              <span>Next Step</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <pre className="rounded-lg bg-slate-900 dark:bg-black/80 text-sky-200 px-3.5 py-2.5 font-mono text-xs overflow-x-auto">
          {currentStep.codeLine}
        </pre>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {currentStep.variables.map((v) => (
            <div
              key={v.name}
              className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#050914] p-2.5 font-mono"
            >
              <div className="text-[10px] text-slate-500">{v.name}</div>
              <div className="text-sm font-bold text-slate-950 dark:text-white mt-0.5">
                {v.value}
              </div>
              {v.note && (
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {v.note}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {currentStep.explanation}
        </p>
      </div>

      {/* Verification Checkpoint */}
      <div className="space-y-2 pt-1">
        <div className="text-xs font-semibold text-slate-900 dark:text-white">
          Checkpoint: {config.checkpointQuestion}
        </div>
        <div className="grid grid-cols-1 gap-2">
          {config.options.map((opt, idx) => {
            const picked = selectedChoice === idx;
            const correctOpt = idx === config.correctIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedChoice(idx);
                  if (idx === config.correctIndex) onSolved();
                }}
                className={`rounded-xl border px-3.5 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                  picked
                    ? correctOpt
                      ? 'border-emerald-500 bg-emerald-500/12 text-emerald-900 dark:text-emerald-200 font-semibold'
                      : 'border-rose-500 bg-rose-500/12 text-rose-900 dark:text-rose-200'
                    : 'border-slate-200 dark:border-white/[0.08] bg-white/75 dark:bg-[#050914]/75 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {(isCorrect || alreadySolved) && (
          <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>{config.explainAfterSolve}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SystemDiagnosticLab({
  config,
  alreadySolved,
  onSolved,
}: {
  config: SystemDiagnosticLabConfig;
  alreadySolved: boolean;
  onSolved: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pickedOption = config.options.find((o) => o.id === selectedId);

  return (
    <div className="space-y-4">
      <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
        {config.prompt}
      </p>

      <div className="rounded-xl border border-slate-300/70 dark:border-white/10 bg-slate-900 dark:bg-black/90 p-3.5 space-y-1.5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
          {config.artifactTitle}
        </div>
        <pre className="font-mono text-xs text-sky-200 whitespace-pre-wrap leading-relaxed">
          {config.artifactBody}
        </pre>
      </div>

      <div className="space-y-2">
        {config.options.map((opt) => {
          const isPicked = selectedId === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setSelectedId(opt.id);
                if (opt.isCorrect) onSolved();
              }}
              className={`w-full rounded-xl border p-3.5 text-left transition-colors cursor-pointer ${
                isPicked
                  ? opt.isCorrect
                    ? 'border-emerald-500 bg-emerald-500/12 text-emerald-950 dark:text-emerald-100'
                    : 'border-rose-500 bg-rose-500/12 text-rose-950 dark:text-rose-100'
                  : 'border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-[#050914]/80 hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                {opt.label}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                {opt.detail}
              </div>
            </button>
          );
        })}
      </div>

      {pickedOption && (
        <div
          className={`rounded-xl border p-3 text-xs flex items-start gap-2 ${
            pickedOption.isCorrect
              ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
              : 'border-rose-500/35 bg-rose-500/10 text-rose-900 dark:text-rose-200'
          }`}
        >
          {pickedOption.isCorrect ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          )}
          <span>{pickedOption.feedback}</span>
        </div>
      )}

      {!pickedOption && alreadySolved && (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-3 text-xs text-emerald-900 dark:text-emerald-200">
          {config.explainAfterSolve}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * 3-Heart Chapter Boss Encounter Arena
 * ========================================================================== */

function BossEncounterCard({
  realm,
  alreadyCleared,
  onVictory,
  nextRealm,
  onAdvanceNext,
}: {
  realm: AdventureRealm;
  alreadyCleared: boolean;
  onVictory: (score: number, total: number) => void;
  nextRealm?: AdventureRealm;
  onAdvanceNext?: () => void;
}) {
  const questions = useMemo(() => getBossQuestionsForRealm(realm.stageId), [realm.stageId]);
  const [phase, setPhase] = useState<'idle' | 'active' | 'victory' | 'defeat'>('idle');
  const [qIndex, setQIndex] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [combo, setCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);

  const startEncounter = () => {
    setPhase('active');
    setQIndex(0);
    setHearts(3);
    setCombo(0);
    setCorrectCount(0);
    setPickedIndex(null);
  };

  const currentQ = questions[qIndex] || questions[0];

  const handleAnswer = (idx: number) => {
    if (pickedIndex !== null) return;
    setPickedIndex(idx);
    if (idx === currentQ.correctIndex) {
      setCorrectCount((c) => c + 1);
      setCombo((c) => c + 1);
    } else {
      setCombo(0);
      setHearts((h) => Math.max(0, h - 1));
    }
  };

  const handleNextQuestion = () => {
    if (hearts <= 0) {
      setPhase('defeat');
      return;
    }
    if (qIndex + 1 >= questions.length) {
      setPhase('victory');
      onVictory(correctCount, questions.length);
      return;
    }
    setQIndex((i) => i + 1);
    setPickedIndex(null);
  };

  return (
    <section className="optical-panel rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/[0.08] pb-3.5">
        <div className="flex items-center gap-2.5">
          <Swords className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <div>
            <h4 className="font-display text-base font-bold text-slate-950 dark:text-white">
              Stage Boss Gate: {realm.bossName}
            </h4>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Clear {questions.length} first-principles checks with 3 Focus Hearts to certify Chapter {realm.chapterNumber}
            </p>
          </div>
        </div>

        {phase === 'active' && (
          <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 font-semibold">
              <Flame className="h-3.5 w-3.5" />
              x{Math.max(1, combo)}
            </span>
            <div className="flex items-center gap-1" aria-label={`${hearts} hearts remaining`}>
              {[0, 1, 2].map((i) => (
                <Heart
                  key={i}
                  className={`h-4 w-4 ${
                    i < hearts
                      ? 'text-rose-500 fill-rose-500'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {phase === 'idle' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
            {alreadyCleared
              ? `You already conquered ${realm.bossName} and certified Stage ${realm.chapterNumber}. Replay anytime to sharpen recall.`
              : `Ready to prove mastery? Answer ${questions.length} rapid engineering challenges. Every cleared Boss certifies all Stage ${realm.chapterNumber} concepts and awards +${realm.xpClearReward} XP.`}
          </div>
          <SoapBubbleButton
            onClick={startEncounter}
            tint="rgb(245 158 11)"
            opacity={0.94}
            style={{ fontSize: 12.5 }}
            className="!min-h-[38px] !px-4 font-semibold text-white whitespace-nowrap shrink-0"
          >
            <Swords className="h-3.5 w-3.5" />
            <span>{alreadyCleared ? 'Rematch Boss' : 'Start Boss Trial'}</span>
          </SoapBubbleButton>
        </div>
      )}

      {phase === 'active' && currentQ && (
        <div className="space-y-4">
          <div className="text-[11px] font-mono text-slate-500 tabular-nums">
            Encounter {qIndex + 1} of {questions.length}
          </div>
          <div className="text-sm font-semibold text-slate-950 dark:text-white leading-snug">
            {currentQ.question}
          </div>

          <div className="grid grid-cols-1 gap-2">
            {currentQ.options.map((opt, idx) => {
              const isPicked = pickedIndex === idx;
              const isAnswer = idx === currentQ.correctIndex;
              const reveal = pickedIndex !== null;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={reveal}
                  onClick={() => handleAnswer(idx)}
                  className={`rounded-xl border px-4 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                    reveal
                      ? isAnswer
                        ? 'border-emerald-500 bg-emerald-500/14 text-emerald-950 dark:text-emerald-100 font-semibold'
                        : isPicked
                        ? 'border-rose-500 bg-rose-500/14 text-rose-950 dark:text-rose-100'
                        : 'border-slate-200 dark:border-white/[0.06] opacity-55 text-slate-600 dark:text-slate-400'
                      : 'border-slate-200 dark:border-white/[0.1] bg-white/80 dark:bg-[#050914]/80 text-slate-800 dark:text-slate-200 hover:border-sky-400'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {pickedIndex !== null && (
            <div className="optical-inset rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong className="text-slate-950 dark:text-white">
                  {pickedIndex === currentQ.correctIndex ? 'Verified: ' : 'Concept Note: '}
                </strong>
                {currentQ.explanation}
              </p>
              <SoapBubbleButton
                onClick={handleNextQuestion}
                tint={hearts <= 0 ? 'rgb(244 63 94)' : 'rgb(14 165 233)'}
                opacity={0.94}
                style={{ fontSize: 12 }}
                className="!min-h-[34px] !px-4 font-semibold text-white whitespace-nowrap shrink-0"
              >
                <span>
                  {hearts <= 0
                    ? 'Review Result'
                    : qIndex + 1 >= questions.length
                    ? 'Claim Victory'
                    : 'Next Challenge'}
                </span>
                <ChevronRight className="h-3.5 w-3.5" />
              </SoapBubbleButton>
            </div>
          )}
        </div>
      )}

      {phase === 'victory' && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <div className="font-display text-sm font-bold text-emerald-950 dark:text-emerald-100">
                  {realm.bossName} Defeated! ({correctCount}/{questions.length} verified)
                </div>
                <div className="text-xs text-emerald-800 dark:text-emerald-300">
                  Chapter {realm.chapterNumber} topics certified, +20m study session logged, and +{realm.xpClearReward} XP earned.
                </div>
              </div>
            </div>

            {nextRealm && onAdvanceNext && (
              <SoapBubbleButton
                onClick={onAdvanceNext}
                tint="rgb(16 185 129)"
                opacity={0.94}
                style={{ fontSize: 12.5 }}
                className="!min-h-[36px] !px-4 font-semibold text-white whitespace-nowrap shrink-0"
              >
                <span>Enter Chapter {nextRealm.chapterNumber}: {nextRealm.realmName}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </SoapBubbleButton>
            )}
          </div>
        </div>
      )}

      {phase === 'defeat' && (
        <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
            <strong>Focus Hearts Depleted:</strong> Review the 4 Core Rules above and try again—every mistake turns into lasting intuition.
          </div>
          <button
            type="button"
            onClick={startEncounter}
            className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Retry Boss</span>
          </button>
        </div>
      )}
    </section>
  );
}
