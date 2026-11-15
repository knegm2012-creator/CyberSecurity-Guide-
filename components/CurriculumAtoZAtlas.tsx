'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Compass,
  Play,
  Terminal,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { STAGES_DATA, type StageData } from '@/lib/curriculum-data';
import { SoapBubbleButton, SoapBubbleSearch } from './soap-bubble';

interface CurriculumAtoZAtlasProps {
  completedTopics: Record<string, boolean>;
  completedExitChecks: Record<string, boolean>;
  onSelectStageAndOpen: (stageId: string) => void;
  onCompleteTopicWithHabit?: (topicId: string, stageId: string, logMinutes?: number) => void;
  onToggleTopic: (topicId: string) => void;
  onOpenPlayground: (language: 'python' | 'c', code: string) => void;
  onOpenAiMentor: (prompt?: string) => void;
}

interface MasteryTier {
  id: 'tier-1' | 'tier-2' | 'tier-3' | 'tier-4';
  numeral: string;
  label: string;
  summary: string;
  stageNumbers: number[];
  accentText: string;
  accentBar: string;
}

const MASTERY_TIERS: MasteryTier[] = [
  {
    id: 'tier-1',
    numeral: 'TIER I · ZERO TO SCRIPTING',
    label: 'Foundations, Logic & Python Bedrock',
    summary: 'Bits, transistors, Two’s Complement, gates, CPU cycle, and writing independent Python tools.',
    stageNumbers: [0, 1, 2],
    accentText: 'text-sky-400',
    accentBar: 'bg-sky-400',
  },
  {
    id: 'tier-2',
    numeral: 'TIER II · CORE INFRASTRUCTURE',
    label: 'Git, Linux OS, Networking & SQL',
    summary: 'Command line fluency, kernel boundaries, DNS/TCP/HTTPS transport, relational SQL, and web security.',
    stageNumbers: [3, 4, 5],
    accentText: 'text-emerald-400',
    accentBar: 'bg-emerald-400',
  },
  {
    id: 'tier-3',
    numeral: 'TIER III · SYSTEMS & SECURITY',
    label: 'C/C++, Go, x86-64, Security & Portfolio',
    summary: 'Manual heap safety, RAII, concurrent microservices, GDB/Ghidra reversing, authorized CTFs, and proof.',
    stageNumbers: [6, 7, 8, 9, 10, 11],
    accentText: 'text-amber-400',
    accentBar: 'bg-amber-400',
  },
  {
    id: 'tier-4',
    numeral: 'TIER IV · HERO ENGINEERING',
    label: 'DSA, Compilers, Distributed, Cloud SRE & AI/HPC',
    summary: 'Graph theory, SSA compilers, Raft consensus, containers/K8s observability, neural backprop, and SIMD compute.',
    stageNumbers: [12, 13, 14, 15],
    accentText: 'text-fuchsia-400',
    accentBar: 'bg-fuchsia-400',
  },
];

export function CurriculumAtoZAtlas({
  completedTopics,
  completedExitChecks,
  onSelectStageAndOpen,
  onCompleteTopicWithHabit,
  onToggleTopic,
  onOpenPlayground,
  onOpenAiMentor,
}: CurriculumAtoZAtlasProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<'all' | MasteryTier['id']>('all');
  const [onlyRemaining, setOnlyRemaining] = useState(false);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const totalStats = useMemo(() => {
    let topicsTotal = 0;
    let topicsDone = 0;
    let runnableCount = 0;
    let stagesDone = 0;

    STAGES_DATA.forEach((stage) => {
      let stageTopicsDone = 0;
      stage.topics.forEach((t) => {
        topicsTotal++;
        if (completedTopics[t.id]) {
          topicsDone++;
          stageTopicsDone++;
        }
        if (t.codeSnippet) runnableCount++;
      });
      if (stage.topics.length > 0 && stageTopicsDone === stage.topics.length) {
        stagesDone++;
      }
    });

    const percent = topicsTotal > 0 ? Math.round((topicsDone / topicsTotal) * 100) : 0;
    return { topicsTotal, topicsDone, runnableCount, stagesDone, percent };
  }, [completedTopics]);

  const filterStageMatches = (stage: StageData) => {
    const doneInStage = stage.topics.filter((t) => completedTopics[t.id]).length;
    if (onlyRemaining && doneInStage === stage.topics.length) {
      return false;
    }

    if (!normalizedQuery) return true;

    const hay = [
      `stage ${stage.number}`,
      stage.title,
      stage.subtitle,
      stage.goal,
      stage.practiceTask.title,
      ...stage.topics.map((t) => `${t.title} ${t.description}`),
      ...stage.commands.map((c) => `${c.name} ${c.explanation}`),
      ...stage.exitChecklist,
    ]
      .join(' ')
      .toLowerCase();

    return hay.includes(normalizedQuery);
  };

  const visibleTiers = MASTERY_TIERS.filter((tier) => selectedTier === 'all' || tier.id === selectedTier);

  return (
    <div className="space-y-6">
      {/* Atlas Control Strip */}
      <div className="optical-panel rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-sky-400">
              <Compass className="h-3.5 w-3.5" />
              <span>A–Z Zero-to-Hero Master Atlas · Stages 00–15</span>
            </div>
            <h2 className="font-display text-xl font-bold text-white tracking-tight [text-wrap:balance]">
              Complete Computer Science &amp; Systems Map
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Search every stage, topic, runnable sandbox script, CLI tool, and mastery checkpoint from hardware switches to AI compute.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-xs font-mono tabular-nums shrink-0">
            <div className="optical-inset rounded-xl px-3.5 py-2">
              <div className="text-[10px] text-slate-500 uppercase">Stages</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {totalStats.stagesDone}/{STAGES_DATA.length}
              </div>
            </div>
            <div className="optical-inset rounded-xl px-3.5 py-2">
              <div className="text-[10px] text-slate-500 uppercase">Topics</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {totalStats.topicsDone}/{totalStats.topicsTotal} ({totalStats.percent}%)
              </div>
            </div>
            <div className="optical-inset rounded-xl px-3.5 py-2">
              <div className="text-[10px] text-slate-500 uppercase">Runnable</div>
              <div className="text-sm font-bold text-sky-400 mt-0.5">
                {totalStats.runnableCount} labs
              </div>
            </div>
          </div>
        </div>

        {/* Search + Tier Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex-1">
            <SoapBubbleSearch
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter stages, topics, commands, Kubernetes, Raft, backprop, pointers..."
              style={{ fontSize: 12 }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="optical-subnav flex rounded-xl p-1 text-xs font-medium overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedTier('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  selectedTier === 'all'
                    ? 'bg-sky-500/20 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Tiers (0–15)
              </button>
              {MASTERY_TIERS.map((tier, idx) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTier(tier.id)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    selectedTier === tier.id
                      ? 'bg-sky-500/20 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tier {idx + 1} (S{tier.stageNumbers[0]}–S{tier.stageNumbers[tier.stageNumbers.length - 1]})
                </button>
              ))}
            </div>

            <label className="optical-card inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-300 cursor-pointer select-none whitespace-nowrap">
              <input
                type="checkbox"
                checked={onlyRemaining}
                onChange={(e) => setOnlyRemaining(e.target.checked)}
                className="accent-sky-400 h-3.5 w-3.5 rounded cursor-pointer"
              />
              <span>Incomplete only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Tier Sections */}
      <div className="space-y-6">
        {visibleTiers.map((tier) => {
          const tierStages = tier.stageNumbers
            .map((num) => STAGES_DATA.find((s) => s.number === num))
            .filter((s): s is StageData => Boolean(s));

          const tierTopicsTotal = tierStages.reduce((sum, s) => sum + s.topics.length, 0);
          const tierTopicsDone = tierStages.reduce(
            (sum, s) => sum + s.topics.filter((t) => completedTopics[t.id]).length,
            0
          );
          const tierPct = tierTopicsTotal > 0 ? Math.round((tierTopicsDone / tierTopicsTotal) * 100) : 0;

          const matchingStages = tierStages.filter(filterStageMatches);
          if (matchingStages.length === 0) return null;

          return (
            <section key={tier.id} className="optical-panel rounded-2xl p-5 sm:p-6 space-y-5">
              {/* Tier Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
                <div className="space-y-1">
                  <div className={`text-[11px] font-mono uppercase tracking-[0.16em] ${tier.accentText}`}>
                    {tier.numeral}
                  </div>
                  <h3 className="font-display text-lg font-bold text-white tracking-tight">
                    {tier.label}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-2xl">{tier.summary}</p>
                </div>

                <div className="w-full sm:w-56 space-y-1.5 shrink-0">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 tabular-nums">
                    <span>Tier Mastery</span>
                    <span className="text-white font-semibold">
                      {tierTopicsDone}/{tierTopicsTotal} ({tierPct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.07] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${tier.accentBar}`}
                      style={{ width: `${tierPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Stages Grid inside Tier */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {matchingStages.map((stage) => {
                  const doneCount = stage.topics.filter((t) => completedTopics[t.id]).length;
                  const stagePct = Math.round((doneCount / Math.max(stage.topics.length, 1)) * 100);
                  const exitDone = stage.exitChecklist.filter((_, idx) =>
                    Boolean(completedExitChecks[`${stage.id}-${idx}`])
                  ).length;

                  const firstRunnable = stage.topics.find((t) => t.codeSnippet)?.codeSnippet;

                  return (
                    <div
                      key={stage.id}
                      className="optical-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-3.5">
                        {/* Stage Top Line */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400 tabular-nums">
                              <span className={`${tier.accentText} font-semibold`}>
                                STAGE {String(stage.number).padStart(2, '0')}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{stage.sprintMonth}</span>
                              <span aria-hidden="true">·</span>
                              <span>{stage.timeEstimate}</span>
                            </div>
                            <h4 className="font-display text-base font-bold text-white leading-snug">
                              {stage.title}
                            </h4>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {stage.goal}
                            </p>
                          </div>

                          <div className="text-right font-mono text-xs tabular-nums shrink-0">
                            <div className={stagePct === 100 ? 'text-emerald-400 font-bold' : 'text-slate-200 font-semibold'}>
                              {stagePct}%
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {doneCount}/{stage.topics.length} topics
                            </div>
                          </div>
                        </div>

                        {/* Interactive Topic Checklist */}
                        <div className="optical-inset divide-y divide-white/[0.06] rounded-xl overflow-hidden">
                          {stage.topics.map((topic) => {
                            const checked = Boolean(completedTopics[topic.id]);
                            const matchedTopic =
                              !normalizedQuery ||
                              `${topic.title} ${topic.description}`.toLowerCase().includes(normalizedQuery);

                            return (
                              <div
                                key={topic.id}
                                className={`px-3 py-2 flex items-center justify-between gap-2.5 text-xs transition-colors ${
                                  matchedTopic ? 'opacity-100' : 'opacity-45'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!checked && onCompleteTopicWithHabit) {
                                      onCompleteTopicWithHabit(topic.id, stage.id, 15);
                                    } else {
                                      onToggleTopic(topic.id);
                                    }
                                  }}
                                  className="flex items-center gap-2.5 text-left min-w-0 flex-1 cursor-pointer group"
                                  title={checked ? 'Uncheck topic' : 'Complete topic & log +15m practice'}
                                >
                                  {checked ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                  ) : (
                                    <Circle className="h-3.5 w-3.5 text-slate-500 group-hover:text-sky-400 shrink-0 transition-colors" />
                                  )}
                                  <span
                                    className={`truncate ${
                                      checked
                                        ? 'text-slate-400 line-through'
                                        : 'text-slate-200 group-hover:text-white'
                                    }`}
                                  >
                                    {topic.title}
                                  </span>
                                </button>

                                {topic.codeSnippet && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onOpenPlayground(topic.codeSnippet!.language, topic.codeSnippet!.code)
                                    }
                                    className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 shrink-0 cursor-pointer"
                                    title={`Run ${topic.codeSnippet.language.toUpperCase()} exercise in Playground`}
                                  >
                                    <Play className="h-2.5 w-2.5 fill-current" />
                                    <span>{topic.codeSnippet.language.toUpperCase()}</span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Metadata Summary Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 tabular-nums">
                          <span className="inline-flex items-center gap-1.5">
                            <Terminal className="h-3 w-3 text-slate-500" />
                            <span>{stage.commands.length} CLI tools</span>
                            <span className="text-slate-600">·</span>
                            <BookOpen className="h-3 w-3 text-slate-500" />
                            <span>{stage.resources.length} sources</span>
                          </span>
                          <span>
                            Exit Gate: {exitDone}/{stage.exitChecklist.length} verified
                          </span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/[0.07]">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onOpenAiMentor(
                                `Walk me through Stage ${stage.number} ("${stage.title}") from intuition to the deliverable "${stage.practiceTask.title}".`
                              )
                            }
                            className="optical-inset inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-sky-300 hover:text-white cursor-pointer"
                          >
                            <Sparkles className="h-3 w-3" />
                            <span>Ask Mentor</span>
                          </button>

                          {firstRunnable && (
                            <button
                              type="button"
                              onClick={() => onOpenPlayground(firstRunnable.language, firstRunnable.code)}
                              className="optical-inset inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-emerald-300 hover:text-white cursor-pointer"
                            >
                              <Play className="h-3 w-3" />
                              <span>Run Lab</span>
                            </button>
                          )}
                        </div>

                        <SoapBubbleButton
                          onClick={() => onSelectStageAndOpen(stage.id)}
                          tint="rgb(14 165 233)"
                          opacity={0.9}
                          style={{ fontSize: 11.5 }}
                          className="!min-h-[30px] !px-3.5 text-xs font-semibold text-white whitespace-nowrap"
                        >
                          <span>Open Stage {stage.number}</span>
                          <ArrowRight className="h-3 w-3" />
                        </SoapBubbleButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
