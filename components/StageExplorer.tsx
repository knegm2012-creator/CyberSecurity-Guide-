'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  Sparkles,
  Terminal,
  ShieldAlert,
  HelpCircle,
  BookOpen,
  Award,
  ChevronRight,
  Flame,
  Check,
  Calculator,
  GitBranch,
} from 'lucide-react';
import { STAGES_DATA, StageData, TopicItem, CommandItem, ResourceItem } from '@/lib/curriculum-data';
import { FoundationsStudio } from './FoundationsStudio';
import { GitSandbox } from './GitSandbox';

interface StageExplorerProps {
  completedTopics: Record<string, boolean>;
  completedExitChecks: Record<string, boolean>;
  onToggleTopic: (topicId: string) => void;
  onToggleExitCheck: (checkKey: string) => void;
  onOpenAiMentor: (context?: string) => void;
  onOpenBandit: () => void;
  onOpenNotes: (stageId: string) => void;
}

export function StageExplorer({
  completedTopics,
  completedExitChecks,
  onToggleTopic,
  onToggleExitCheck,
  onOpenAiMentor,
  onOpenBandit,
  onOpenNotes,
}: StageExplorerProps) {
  const [selectedStageId, setSelectedStageId] = useState<string>('stage-0');
  const [activeTab, setActiveTab] = useState<'topics' | 'foundations' | 'git' | 'commands' | 'resources' | 'task' | 'exit'>('topics');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const stage = STAGES_DATA.find((s) => s.id === selectedStageId) || STAGES_DATA[0];

  const stageCompletedTopics = stage.topics.filter((t) => completedTopics[t.id]).length;
  const stageTopicProgress = Math.round((stageCompletedTopics / stage.topics.length) * 100);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Stage Carousel / Selector */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-white tracking-tight">The 12-Stage Odyssey Roadmap</h2>
          <span className="text-xs font-mono text-cyan-400">Total 6-Month Intensive Plan</span>
        </div>

        {/* Scrollable Stage Pills / Segmented Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {STAGES_DATA.map((s) => {
            const isSelected = s.id === selectedStageId;
            const completedCount = s.topics.filter((t) => completedTopics[t.id]).length;
            const isComplete = completedCount === s.topics.length && s.topics.length > 0;

            return (
              <button
                key={s.id}
                onClick={() => setSelectedStageId(s.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-950/40 shadow-lg shadow-cyan-950/50'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>STAGE {s.number}</span>
                  {isComplete ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <span className="text-slate-500">{completedCount}/{s.topics.length}</span>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-200 line-clamp-1">{s.title.split(':')[0]}</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono truncate">{s.sprintMonth}</div>

                {/* Bottom line progress */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-300"
                    style={{ width: `${(completedCount / s.topics.length) * 100}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Workspace */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
        {/* Stage Header */}
        <div className="border-b border-slate-800 p-6 bg-slate-900/80">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1.5">
                <span>STAGE {stage.number}</span>
                <span>·</span>
                <span>{stage.timeEstimate}</span>
                <span>·</span>
                <span>{stage.sprintMonth}</span>
              </div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                {stage.title}
              </h3>
              <p className="mt-1 text-sm text-slate-300 max-w-3xl">
                {stage.subtitle}
              </p>
            </div>

            {/* Quick action buttons for this stage */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => onOpenAiMentor(`Quiz me on Stage ${stage.number}: ${stage.title}`)}
                className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-950/40 px-3 py-1.5 text-xs font-semibold text-purple-200 hover:bg-purple-900/50 transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span>Quiz Me</span>
              </button>

              <button
                onClick={() => onOpenNotes(stage.id)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                <span>Stage Notes</span>
              </button>

              {stage.number === 3 && (
                <button
                  onClick={onOpenBandit}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors cursor-pointer"
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Bandit Wargame</span>
                </button>
              )}
            </div>
          </div>

          {/* Goal & Grade 9 Metaphor Callout */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1 font-semibold">
                Core Stage Goal
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {stage.goal}
              </p>
            </div>

            <div className="rounded-xl border border-indigo-950/70 bg-indigo-950/20 p-4">
              <div className="text-xs font-mono text-indigo-400 uppercase tracking-wider mb-1 font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                ELI9 Intuitive Mental Model
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {stage.eli9Metaphor}
              </p>
            </div>
          </div>
          {/* Stage 0 & 1 Bedrock Banner */}
          {(stage.number === 0 || stage.number === 1) && (
            <div className="mt-4 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Stage {stage.number} Bedrock: Master Binary, Hex, Bitwise &amp; Math</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Before configuring code editors, master electrical switches, 8-bit registers, hex nibbles, bit shifts, and Boolean logic gates.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('foundations')}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-mono font-bold text-white transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-cyan-950/60"
              >
                Launch Math &amp; Binary Studio →
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation for Stage Details */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-6 text-xs font-medium overflow-x-auto no-scrollbar">
          {[
            { id: 'topics', label: `Topics & Milestones (${stageCompletedTopics}/${stage.topics.length})` },
            ...(stage.number === 0 || stage.number === 1 || stage.number === 2
              ? [
                  { id: 'foundations', label: '⚡ Math, Binary & Logic Studio' },
                  { id: 'git', label: '🌿 Git Sandbox' },
                ]
              : []),
            { id: 'commands', label: `Command Deck (${stage.commands.length})` },
            { id: 'resources', label: `Curated Sources (${stage.resources.length})` },
            { id: 'task', label: 'Hands-on Assignment' },
            { id: 'exit', label: 'Exit Verification Gate' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 whitespace-nowrap transition-colors relative cursor-pointer ${
                activeTab === tab.id
                  ? 'text-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Areas */}
        <div className="p-6">
          {/* TAB 0: FOUNDATIONS STUDIO (STAGE 0 & 1 & 2) */}
          {activeTab === 'foundations' && (
            <FoundationsStudio onOpenAiMentor={onOpenAiMentor} />
          )}

          {/* TAB 0.5: GIT SANDBOX (STAGE 0 & 1 & 2) */}
          {activeTab === 'git' && (
            <GitSandbox onOpenAiMentor={onOpenAiMentor} />
          )}

          {/* TAB 1: TOPICS CHECKLIST */}
          {activeTab === 'topics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Check off each topic as you practice and master it.</span>
                <span className="font-mono text-cyan-400 font-semibold">{stageTopicProgress}% Completed</span>
              </div>

              <div className="space-y-3">
                {stage.topics.map((topic: TopicItem) => {
                  const isChecked = Boolean(completedTopics[topic.id]);
                  return (
                    <div
                      key={topic.id}
                      className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all ${
                        isChecked
                          ? 'border-emerald-900/60 bg-emerald-950/15'
                          : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                      }`}
                    >
                      <button
                        onClick={() => onToggleTopic(topic.id)}
                        className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors shrink-0 cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-600 hover:text-cyan-400" />
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className={`text-sm font-bold ${
                              isChecked ? 'text-emerald-300 line-through opacity-85' : 'text-white'
                            }`}
                          >
                            {topic.title}
                          </h4>
                          <button
                            onClick={() =>
                              onOpenAiMentor(`ELI9: Explain "${topic.title}" from Stage ${stage.number} with a simple Grade 9 analogy and code example!`)
                            }
                            className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 shrink-0 cursor-pointer"
                          >
                            <Sparkles className="h-3 w-3" />
                            <span>Explain</span>
                          </button>
                        </div>

                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                          {topic.description}
                        </p>

                        <div className="mt-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 px-3 py-1.5 text-[11px] text-slate-400 font-mono">
                          <span className="text-indigo-400 font-semibold">ELI9:</span> {topic.eli9}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: COMMAND DECK */}
          {activeTab === 'commands' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Key commands, compiler flags, and syntax you need to practice for this stage. Click copy to grab them for your terminal!
              </p>

              {stage.commands.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
                  This stage focuses on conceptual foundations. See the Command Vault tab for general tools!
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {stage.commands.map((cmd: CommandItem, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-cyan-400">{cmd.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 border border-slate-800 rounded px-1.5 py-0.5">
                            {cmd.category}
                          </span>
                          <button
                            onClick={() => handleCopy(cmd.syntax)}
                            className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            {copiedCmd === cmd.syntax ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            <span>{copiedCmd === cmd.syntax ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="rounded bg-slate-900 border border-slate-800 p-2 text-slate-200 select-all overflow-x-auto">
                        {cmd.syntax}
                      </div>

                      <p className="text-[11px] text-slate-400 font-sans">{cmd.explanation}</p>

                      {cmd.safeNote && (
                        <div className="text-[11px] text-amber-400/90 font-sans flex items-center gap-1.5 mt-1">
                          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                          <span>{cmd.safeNote}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CURATED SOURCES */}
          {activeTab === 'resources' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Verified high-quality resources from the student roadmap. &quot;Free&quot; indicates open educational access verified for October 2026.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stage.resources.map((res: ResourceItem, idx: number) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                            res.isFree
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                          }`}
                        >
                          {res.isFree ? '100% Free' : res.costNote || 'Paid / Audit Free'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{res.type}</span>
                      </div>

                      <h4 className="text-sm font-bold text-white mb-1">{res.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{res.notes}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-900 flex justify-end">
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                      >
                        <span>Open Resource</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PRACTICE TASK */}
          {activeTab === 'task' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-2 font-semibold">
                  <Award className="h-4 w-4" />
                  <span>Deliverable Assignment for Stage {stage.number}</span>
                </div>
                <h4 className="text-lg font-bold text-white mb-2">{stage.practiceTask.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {stage.practiceTask.description}
                </p>

                <div className="rounded-lg bg-slate-900 border border-slate-800 p-3.5">
                  <div className="text-[11px] font-mono text-cyan-400 font-semibold mb-1">
                    Required Deliverable:
                  </div>
                  <p className="text-xs text-slate-200">{stage.practiceTask.deliverable}</p>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() =>
                      onOpenAiMentor(
                        `Review and guide me on the assignment: "${stage.practiceTask.title}". What are the key steps for a Grade 9 student to complete this safely?`
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Get Assignment Tips from AI</span>
                  </button>
                  <button
                    onClick={() => onOpenNotes(stage.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Write Lab Report in Notes</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: EXIT CHECKLIST */}
          {activeTab === 'exit' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-amber-900/40 bg-amber-950/20 text-xs text-amber-300/90 leading-relaxed">
                <strong>The Exit Gate Rule:</strong> Do not rush to the next stage! You should be able to demonstrate every single item below independently without following a step-by-step tutorial.
              </div>

              <div className="space-y-2.5">
                {stage.exitChecklist.map((check: string, idx: number) => {
                  const checkKey = `${stage.id}-${idx}`;
                  const isChecked = Boolean(completedExitChecks[checkKey]);

                  return (
                    <button
                      key={idx}
                      onClick={() => onToggleExitCheck(checkKey)}
                      className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isChecked
                          ? 'border-emerald-800/80 bg-emerald-950/25'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-600" />
                        )}
                      </div>
                      <span className={`text-xs ${isChecked ? 'text-emerald-200 line-through' : 'text-slate-200'}`}>
                        {check}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Safety Warning Footer */}
        <div className="border-t border-slate-800 bg-slate-950/80 px-6 py-3 flex items-center gap-2.5 text-xs text-amber-400/90">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
          <span>{stage.safetyWarning}</span>
        </div>
      </div>
    </div>
  );
}
