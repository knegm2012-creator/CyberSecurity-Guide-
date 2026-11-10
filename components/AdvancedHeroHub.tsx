'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Terminal,
  ExternalLink,
  Code2,
  CheckCircle2,
  Layers,
  Cpu,
  Database,
  Network,
  ShieldCheck,
  ChevronRight,
  Play,
  Copy,
  Check,
  Award,
  Globe,
  Lock,
} from 'lucide-react';
import { ADVANCED_HERO_TOPICS, AdvancedHeroTopic } from '@/lib/curriculum-data';

interface AdvancedHeroHubProps {
  onOpenAiMentor?: (prompt?: string) => void;
  onOpenPlaygroundWithCode?: (language: 'python' | 'c', code: string) => void;
}

export function AdvancedHeroHub({ onOpenAiMentor, onOpenPlaygroundWithCode }: AdvancedHeroHubProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(ADVANCED_HERO_TOPICS[0].id);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  const subjectAreas = [
    'All',
    'Algorithms & Data Structures',
    'Operating Systems & Concurrency',
    'Databases & Relational Theory',
    'Computer Networking & Protocols',
    'Software Engineering & System Design',
    'Distributed Systems & Cloud Architecture',
    'Systems Security & Cryptography',
  ];

  const filteredTopics = ADVANCED_HERO_TOPICS.filter((t) => {
    if (selectedSubject === 'All') return true;
    return t.subjectArea === selectedSubject;
  });

  const activeTopic =
    ADVANCED_HERO_TOPICS.find((t) => t.id === selectedTopicId) || filteredTopics[0] || ADVANCED_HERO_TOPICS[0];

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case 'Algorithms & Data Structures':
        return <Layers className="h-4 w-4 text-emerald-400" />;
      case 'Operating Systems & Concurrency':
        return <Cpu className="h-4 w-4 text-cyan-400" />;
      case 'Databases & Relational Theory':
        return <Database className="h-4 w-4 text-amber-400" />;
      case 'Computer Networking & Protocols':
        return <Network className="h-4 w-4 text-indigo-400" />;
      case 'Software Engineering & System Design':
        return <ShieldCheck className="h-4 w-4 text-purple-400" />;
      case 'Distributed Systems & Cloud Architecture':
        return <Globe className="h-4 w-4 text-sky-400" />;
      case 'Systems Security & Cryptography':
        return <Lock className="h-4 w-4 text-rose-400" />;
      default:
        return <BookOpen className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 p-6 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                <Award className="h-3.5 w-3.5 text-purple-400" />
                Hero Phase Advanced Curricula
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[11px] font-mono text-slate-300">
                Collegiate &amp; Production Depth
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>Advanced Computer Science Topics</span>
              <span className="text-sm font-normal text-slate-400 hidden sm:inline">
                · Zero to Hero Mastery
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Master the foundational systems paradigms expected of top collegiate CS majors and staff software engineers.
              Explore core overviews, key CLI tools, definitive textbook sources, practical tips, and runnable code snippets.
            </p>
          </div>

          {onOpenAiMentor && (
            <button
              onClick={() =>
                onOpenAiMentor(
                  'I am exploring the Advanced CS Hero Phase topics (Algorithms, OS, Databases, Networking, System Design). Provide an ELI9 roadmap of how these 5 disciplines connect into a single modern software application.'
                )
              }
              className="flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 px-4 py-2.5 text-xs font-bold text-purple-200 transition-all cursor-pointer shadow-md shrink-0"
            >
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>Ask AI Hero Mentor</span>
            </button>
          )}
        </div>

        {/* Subject Area Filter Pills */}
        <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar border-t border-slate-800 pt-4">
          {subjectAreas.map((subj) => {
            const isSelected = selectedSubject === subj;
            return (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {getSubjectIcon(subj)}
                <span>{subj}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Content Grid: Topic Selector + Detailed Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Topics list (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between px-1">
            <span>Advanced Modules ({filteredTopics.length})</span>
            <span className="text-[10px] font-mono text-slate-500">Select to inspect</span>
          </div>

          <div className="space-y-2.5">
            {filteredTopics.map((topic) => {
              const isSelected = activeTopic.id === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col gap-2 ${
                    isSelected
                      ? 'border-purple-500/80 bg-purple-950/20 ring-1 ring-purple-500/40 shadow-lg'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-purple-300 font-semibold flex items-center gap-1">
                      {getSubjectIcon(topic.subjectArea)}
                      <span>{topic.badge}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 truncate max-w-[130px]">
                      {topic.subjectArea}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-white leading-snug">
                    {topic.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {topic.overview}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-purple-400 pt-1 border-t border-slate-800/80 mt-1">
                    <span>{topic.keyConcepts.length} Core Concepts</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Detailed Topic Deep-Dive (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
            {/* Topic Header */}
            <div className="border-b border-slate-800 pb-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-purple-400 flex items-center gap-1.5">
                  {getSubjectIcon(activeTopic.subjectArea)}
                  <span>{activeTopic.subjectArea.toUpperCase()}</span>
                </span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {activeTopic.badge}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                {activeTopic.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {activeTopic.overview}
              </p>
            </div>

            {/* 1. Key Concepts */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Foundational Mastery Checklist</span>
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {activeTopic.keyConcepts.map((concept, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-950/70 text-xs text-slate-200 flex items-start gap-2.5"
                  >
                    <span className="font-mono text-purple-400 font-bold shrink-0">{idx + 1}.</span>
                    <span className="leading-relaxed">{concept}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Key Commands & Engineering Tools */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-cyan-400" />
                <span>Essential Commands &amp; CLI Diagnostic Tools</span>
              </h3>
              <div className="space-y-2">
                {activeTopic.keyCommands.map((cmd, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <code className="text-emerald-400 font-bold">{cmd.command}</code>
                    <span className="text-[11px] text-slate-400 font-sans">{cmd.purpose}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Recommended Books & World-Class Courses */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-amber-400" />
                <span>Definitive Sources &amp; Recommended Curricula</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeTopic.recommendedSources.map((source, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                          {source.type}
                        </span>
                        {source.isClassic && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                            Gold Standard
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1.5">{source.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{source.authorOrPlatform}</p>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">{source.notes}</p>
                    </div>

                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-purple-400 hover:text-purple-300 pt-2 border-t border-slate-800/80"
                    >
                      <span>Explore Source</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Essential Tips & Intuitive Mental Models */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span>Senior Engineer Insights &amp; Learning Hints</span>
              </h3>
              <div className="space-y-2">
                {activeTopic.essentialTips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-purple-500/30 bg-purple-950/10 text-xs text-slate-200 flex items-start gap-2.5"
                  >
                    <span className="text-purple-400 font-bold shrink-0">💡</span>
                    <span className="leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Runnable Code Snippet with Playground Bridge */}
            {activeTopic.sampleCodeSnippet && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Code2 className="h-4 w-4 text-emerald-400" />
                    <span>Mastery Implementation ({activeTopic.sampleCodeSnippet.language.toUpperCase()})</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleCopyCode(activeTopic.id, activeTopic.sampleCodeSnippet!.code)
                      }
                      className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 flex items-center gap-1 cursor-pointer font-mono"
                    >
                      {copiedSnippetId === activeTopic.id ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span>{copiedSnippetId === activeTopic.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    {onOpenPlaygroundWithCode && (
                      <button
                        onClick={() =>
                          onOpenPlaygroundWithCode(
                            activeTopic.sampleCodeSnippet!.language,
                            activeTopic.sampleCodeSnippet!.code
                          )
                        }
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer font-mono shadow-sm"
                      >
                        <Play className="h-3 w-3 fill-white" />
                        <span>Run in Playground →</span>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-2">
                  {activeTopic.sampleCodeSnippet.description}
                </p>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto">
                  <pre className="whitespace-pre leading-relaxed">
                    {activeTopic.sampleCodeSnippet.code}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
