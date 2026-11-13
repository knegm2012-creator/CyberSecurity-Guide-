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
  BookOpen,
  Code2,
  Plus,
  Check,
  ArrowRight,
  Cpu,
  GitBranch,
  Download,
} from 'lucide-react';
import { STAGES_DATA, TopicItem, CommandItem, ResourceItem } from '@/lib/curriculum-data';
import { generateSingleStageMarkdown, getSourcesForStage } from '@/lib/curriculum-export';
import { SoapBubbleButton } from './soap-bubble';

interface StageExplorerProps {
  selectedStageId: string;
  onSelectStage: (stageId: string) => void;
  completedTopics: Record<string, boolean>;
  completedExitChecks: Record<string, boolean>;
  onToggleTopic: (topicId: string) => void;
  onToggleExitCheck: (checkKey: string) => void;
  onOpenAiMentor: (context?: string) => void;
  onOpenShell: () => void;
  onOpenNotes: (stageId: string) => void;
  onOpenPlayground?: (language: 'python' | 'c', code: string) => void;
  onOpenLab?: (labTab: 'foundations' | 'git') => void;
  onMarkStageComplete?: (stageId: string, completed: boolean) => void;
  onAddMilestone?: (
    title: string,
    category: 'basics' | 'algorithms' | 'systems' | 'bandit' | 'projects' | 'custom',
    targetDate?: string,
    stageId?: string,
    xpReward?: number
  ) => void;
}

export function StageExplorer({
  selectedStageId,
  onSelectStage,
  completedTopics,
  completedExitChecks,
  onToggleTopic,
  onToggleExitCheck,
  onOpenAiMentor,
  onOpenShell,
  onOpenNotes,
  onOpenPlayground,
  onOpenLab,
  onMarkStageComplete,
  onAddMilestone,
}: StageExplorerProps) {
  const [activeTab, setActiveTab] = useState<'topics' | 'commands' | 'resources' | 'task' | 'exit'>('topics');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [milestoneAddedId, setMilestoneAddedId] = useState<string | null>(null);

  const stage = STAGES_DATA.find((s) => s.id === selectedStageId) || STAGES_DATA[0];
  const stageCompletedTopics = stage.topics.filter((t) => completedTopics[t.id]).length;
  const stageTopicProgress = Math.round((stageCompletedTopics / stage.topics.length) * 100);
  const isStageFullyComplete = stageCompletedTopics === stage.topics.length && stage.topics.length > 0;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 1800);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Rail: 14-Stage Index (4 cols) */}
      <aside className="lg:col-span-4 optical-panel rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.08] bg-[#050811]/70 flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {STAGES_DATA.length}-Stage Roadmap
          </span>
          <span className="font-mono text-[11px] text-slate-500">Zero to Systems</span>
        </div>

        <div className="divide-y divide-white/[0.06] max-h-[720px] overflow-y-auto">
          {STAGES_DATA.map((s) => {
            const isSelected = s.id === stage.id;
            const completedCount = s.topics.filter((t) => completedTopics[t.id]).length;
            const isComplete = completedCount === s.topics.length && s.topics.length > 0;

            return (
              <button
                key={s.id}
                onClick={() => onSelectStage(s.id)}
                className={`w-full px-4 py-3 text-left transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-sky-500/12 text-white shadow-[inset_0_0_0_1px_rgba(56,189,248,0.22)]'
                    : 'hover:bg-white/[0.03]'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                    <span className={isSelected ? 'text-sky-400 font-semibold' : ''}>
                      STAGE {String(s.number).padStart(2, '0')}
                    </span>
                    <span>·</span>
                    <span className="truncate">{s.sprintMonth}</span>
                  </div>
                  <div className={`text-xs font-semibold mt-0.5 line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {s.title}
                  </div>
                </div>

                <div className="shrink-0 pt-0.5 font-mono text-[11px] tabular-nums">
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <span className="text-slate-500">{completedCount}/{s.topics.length}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right Workspace: Selected Stage Dossier (8 cols) */}
      <section className="lg:col-span-8 optical-panel rounded-2xl overflow-hidden">
        {/* Stage Header */}
        <div className="p-6 border-b border-white/[0.08] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-sky-400 uppercase tracking-wider">
                <span>Stage {stage.number}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">{stage.timeEstimate}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">{stage.sprintMonth}</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                {stage.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {stage.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onMarkStageComplete && (
                <button
                  onClick={() => onMarkStageComplete(stage.id, !isStageFullyComplete)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                    isStageFullyComplete
                      ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                      : 'optical-card text-slate-200'
                  }`}
                >
                  <CheckCircle2 className={`h-3.5 w-3.5 ${isStageFullyComplete ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{isStageFullyComplete ? 'Completed' : 'Complete All'}</span>
                </button>
              )}

              {onAddMilestone && (
                <button
                  onClick={() => {
                    onAddMilestone(
                      `Complete Stage ${stage.number}: ${stage.title.split(':')[0]}`,
                      'basics',
                      undefined,
                      stage.id,
                      100
                    );
                    setMilestoneAddedId(stage.id);
                    setTimeout(() => setMilestoneAddedId(null), 2000);
                  }}
                  className="optical-card inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 cursor-pointer"
                >
                  {milestoneAddedId === stage.id ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-sky-400" />
                  )}
                  <span>{milestoneAddedId === stage.id ? 'Added' : 'Milestone'}</span>
                </button>
              )}

              <button
                onClick={() => onOpenNotes(stage.id)}
                className="optical-card inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                <span>Notes</span>
              </button>

              <button
                onClick={() => {
                  const md = generateSingleStageMarkdown(stage.id);
                  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `cs-odyssey-stage-${stage.number}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="optical-card inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 cursor-pointer"
                title="Download stage syllabus as Markdown"
              >
                <Download className="h-3.5 w-3.5 text-sky-400" />
                <span>Export .md</span>
              </button>

              {stage.number === 3 && (
                <SoapBubbleButton
                  onClick={onOpenShell}
                  tint="rgb(16 185 129)"
                  opacity={0.92}
                  style={{ fontSize: 11.5 }}
                  className="!min-h-[30px] !px-3.5 font-semibold text-white"
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Wargame Shell</span>
                </SoapBubbleButton>
              )}
            </div>
          </div>

          {/* Goal & Intuition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="optical-inset rounded-xl p-3.5 space-y-1">
              <div className="font-mono text-[11px] text-sky-400 uppercase tracking-wider font-semibold">
                Stage Objective
              </div>
              <p className="text-slate-300 leading-relaxed">{stage.goal}</p>
            </div>
            <div className="optical-inset rounded-xl p-3.5 space-y-1">
              <div className="font-mono text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Mental Model
              </div>
              <p className="text-slate-300 leading-relaxed">{stage.eli9Metaphor}</p>
            </div>
          </div>

          {/* Deep-link Bar to Unified Systems Labs */}
          {onOpenLab && (stage.number === 0 || stage.number === 1 || stage.number === 2) && (
            <div className="optical-inset rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-300">
                Hands-on interactive practice for Stage {stage.number} is available in <strong className="text-white">Systems Lab</strong>.
              </span>
              <div className="flex items-center gap-2">
                <SoapBubbleButton
                  onClick={() => onOpenLab('foundations')}
                  tint="rgb(14 165 233)"
                  opacity={0.9}
                  style={{ fontSize: 11.5 }}
                  className="!min-h-[30px] !px-3.5 font-semibold text-white"
                >
                  <Cpu className="h-3.5 w-3.5" />
                  <span>Bitwise &amp; Hardware Lab</span>
                  <ArrowRight className="h-3 w-3" />
                </SoapBubbleButton>
                <button
                  onClick={() => onOpenLab('git')}
                  className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium text-slate-200 cursor-pointer"
                >
                  <GitBranch className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Git Studio</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-white/[0.08] bg-[#050811]/70 px-6 gap-6 text-xs font-medium overflow-x-auto no-scrollbar">
          {[
            { id: 'topics', label: `Topics (${stageCompletedTopics}/${stage.topics.length})` },
            { id: 'commands', label: `Commands (${stage.commands.length})` },
            {
              id: 'resources',
              label: `Sources (${stage.resources.length + getSourcesForStage(stage.id).length})`,
            },
            { id: 'task', label: 'Assignment' },
            { id: 'exit', label: 'Exit Gate' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-3 whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-sky-400 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'topics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Check off each concept as you build working mastery.</span>
                <span className="font-mono text-sky-400 font-semibold tabular-nums">
                  {stageTopicProgress}% Complete
                </span>
              </div>

              <div className="optical-inset divide-y divide-white/[0.06] rounded-xl overflow-hidden">
                {stage.topics.map((topic: TopicItem) => {
                  const isChecked = Boolean(completedTopics[topic.id]);
                  return (
                    <div key={topic.id} className="p-4 flex items-start gap-3.5">
                      <button
                        onClick={() => onToggleTopic(topic.id)}
                        className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors shrink-0 cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <h4
                            className={`text-sm font-semibold ${
                              isChecked ? 'text-slate-400 line-through' : 'text-white'
                            }`}
                          >
                            {topic.title}
                          </h4>
                          <button
                            onClick={() =>
                              onOpenAiMentor(`Explain "${topic.title}" from Stage ${stage.number} clearly with a concise example.`)
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-400 hover:underline shrink-0 cursor-pointer"
                          >
                            <Sparkles className="h-3 w-3" />
                            <span>Explain</span>
                          </button>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">{topic.description}</p>

                        <div className="rounded-lg border border-white/[0.07] bg-[#060913]/80 px-3 py-2 text-xs text-slate-400">
                          <span className="font-mono text-sky-400 font-semibold mr-1.5">Intuition:</span>
                          {topic.eli9}
                        </div>

                        {topic.codeSnippet && (
                          <div className="rounded-xl border border-white/[0.08] bg-[#03060d] p-3 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                                <Code2 className="h-3.5 w-3.5" />
                                <span>{topic.codeSnippet.language.toUpperCase()} Example</span>
                              </span>
                              {onOpenPlayground && (
                                <button
                                  onClick={() => onOpenPlayground(topic.codeSnippet!.language, topic.codeSnippet!.code)}
                                  className="text-sky-400 hover:underline font-semibold cursor-pointer"
                                >
                                  Open in Playground -&gt;
                                </button>
                              )}
                            </div>
                            <pre className="p-2.5 rounded-lg bg-black/50 text-[11px] font-mono text-slate-200 overflow-x-auto whitespace-pre border border-white/[0.06]">
                              {topic.codeSnippet.code}
                            </pre>
                            <div className="text-[11px] text-slate-500">
                              {topic.codeSnippet.explanation}
                            </div>
                          </div>
                        )}

                        {topic.externalLinks && topic.externalLinks.length > 0 && (
                          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono">
                            <span className="text-slate-500">References:</span>
                            {topic.externalLinks.map((link, lIdx) => (
                              <a
                                key={lIdx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sky-400 hover:underline"
                              >
                                <span>{link.title}</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'commands' && (
            <div className="space-y-3">
              {stage.commands.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-xs text-slate-500">
                  Stage {stage.number} focuses on conceptual hardware and architectural models.
                </div>
              ) : (
                <div className="optical-inset divide-y divide-white/[0.06] rounded-xl overflow-hidden">
                  {stage.commands.map((cmd: CommandItem, idx: number) => (
                    <div key={idx} className="p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-sky-400">{cmd.name}</span>
                          <span className="text-[11px] text-slate-500">· {cmd.category}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(cmd.syntax)}
                          className="optical-card inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-300 hover:text-white cursor-pointer"
                        >
                          {copiedCmd === cmd.syntax ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{copiedCmd === cmd.syntax ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="rounded-lg bg-black/50 border border-white/[0.06] px-3 py-2 font-mono text-slate-200 overflow-x-auto">
                        {cmd.syntax}
                      </pre>
                      <p className="text-slate-400">{cmd.explanation}</p>
                      {cmd.safeNote && (
                        <div className="text-[11px] text-amber-400/90 flex items-center gap-1.5">
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

          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stage.resources.map((res: ResourceItem, idx: number) => (
                  <div
                    key={idx}
                    className="optical-card flex flex-col justify-between rounded-xl p-4 space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className={res.isFree ? 'text-emerald-400' : 'text-amber-400'}>
                          {res.isFree ? 'Free Access' : res.costNote || 'Audit Free'}
                        </span>
                        <span className="text-slate-500 uppercase">{res.type}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white">{res.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{res.notes}</p>
                    </div>

                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-xs font-mono text-sky-400 hover:underline pt-2 border-t border-white/[0.07]"
                    >
                      <span>Open Source</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>

              {getSourcesForStage(stage.id).length > 0 && (
                <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                    Extended Open-Source Library for Stage {stage.number} (Courses, Videos, Books &amp; Labs)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getSourcesForStage(stage.id).map((src) => (
                      <div
                        key={src.id}
                        className="optical-card flex flex-col justify-between rounded-xl p-4 space-y-2.5"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                            <span>
                              {src.medium} · {src.level}
                            </span>
                            <span className={src.cost === 'Free' || src.cost === 'Open Source' ? 'text-emerald-400' : 'text-amber-400'}>
                              {src.cost}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-white">{src.title}</h4>
                          <p className="text-[11px] font-mono text-slate-500">{src.authorOrOrg}</p>
                          <p className="text-xs text-slate-400 leading-relaxed">{src.whyItMatters}</p>
                        </div>

                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 text-xs font-mono text-sky-400 hover:underline pt-2 border-t border-white/[0.07]"
                        >
                          <span>Open {src.medium}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'task' && (
            <div className="optical-inset rounded-xl p-5 space-y-4">
              <div className="space-y-1">
                <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                  Deliverable Assignment
                </div>
                <h4 className="font-display text-lg font-semibold text-white">
                  {stage.practiceTask.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {stage.practiceTask.description}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-[#060913]/80 p-3.5 text-xs space-y-1">
                <div className="font-mono text-[11px] text-sky-400 font-semibold">Required Deliverable</div>
                <p className="text-slate-200">{stage.practiceTask.deliverable}</p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <SoapBubbleButton
                  onClick={() =>
                    onOpenAiMentor(
                      `Break down step-by-step engineering hints for: "${stage.practiceTask.title}".`
                    )
                  }
                  tint="rgb(14 165 233)"
                  opacity={0.92}
                  style={{ fontSize: 12 }}
                  className="!min-h-[34px] !px-4 font-semibold text-white"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Ask Mentor for Breakdown</span>
                </SoapBubbleButton>
                <button
                  onClick={() => onOpenNotes(stage.id)}
                  className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 cursor-pointer"
                >
                  <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                  <span>Write Lab Notes</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'exit' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/15 p-3.5 text-xs text-amber-200/90 leading-relaxed">
                <strong>Exit Gate Verification:</strong> Verify you can demonstrate every item below independently without consulting a tutorial before advancing.
              </div>

              <div className="optical-inset divide-y divide-white/[0.06] rounded-xl overflow-hidden">
                {stage.exitChecklist.map((check: string, idx: number) => {
                  const checkKey = `${stage.id}-${idx}`;
                  const isChecked = Boolean(completedExitChecks[checkKey]);

                  return (
                    <button
                      key={idx}
                      onClick={() => onToggleExitCheck(checkKey)}
                      className="w-full flex items-start gap-3 p-3.5 text-left hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-600" />
                        )}
                      </div>
                      <span className={`text-xs ${isChecked ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {check}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/[0.08] bg-[#04070e]/85 px-6 py-3 flex items-center gap-2 text-xs text-amber-400/90">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          <span>{stage.safetyWarning}</span>
        </div>
      </section>
    </div>
  );
}
