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
  Play,
  Copy,
  Check,
  Globe,
  Lock,
} from 'lucide-react';
import { ADVANCED_HERO_TOPICS } from '@/lib/curriculum-data';
import { SoapBubbleButton } from './soap-bubble';

interface AdvancedHeroHubProps {
  onOpenAiMentor?: (prompt?: string) => void;
  onOpenPlaygroundWithCode?: (language: 'python' | 'c', code: string) => void;
}

const SUBJECT_AREAS = [
  'All',
  'Algorithms & Data Structures',
  'Operating Systems & Concurrency',
  'Databases & Relational Theory',
  'Computer Networking & Protocols',
  'Software Engineering & System Design',
  'Distributed Systems & Cloud Architecture',
  'Systems Security & Cryptography',
  'Compilers & Programming Languages',
  'Computer Architecture & Hardware',
];

export function AdvancedHeroHub({ onOpenAiMentor, onOpenPlaygroundWithCode }: AdvancedHeroHubProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(ADVANCED_HERO_TOPICS[0].id);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  const filteredTopics = ADVANCED_HERO_TOPICS.filter((t) =>
    selectedSubject === 'All' ? true : t.subjectArea === selectedSubject
  );

  const activeTopic =
    filteredTopics.find((t) => t.id === selectedTopicId) ||
    filteredTopics[0] ||
    ADVANCED_HERO_TOPICS[0];

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 1800);
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case 'Algorithms & Data Structures':
        return <Layers className="h-3.5 w-3.5 text-emerald-400" />;
      case 'Operating Systems & Concurrency':
        return <Cpu className="h-3.5 w-3.5 text-sky-400" />;
      case 'Databases & Relational Theory':
        return <Database className="h-3.5 w-3.5 text-amber-400" />;
      case 'Computer Networking & Protocols':
        return <Network className="h-3.5 w-3.5 text-sky-400" />;
      case 'Software Engineering & System Design':
        return <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />;
      case 'Distributed Systems & Cloud Architecture':
        return <Globe className="h-3.5 w-3.5 text-sky-400" />;
      case 'Systems Security & Cryptography':
        return <Lock className="h-3.5 w-3.5 text-rose-400" />;
      case 'Compilers & Programming Languages':
        return <Code2 className="h-3.5 w-3.5 text-emerald-400" />;
      case 'Computer Architecture & Hardware':
        return <Cpu className="h-3.5 w-3.5 text-amber-400" />;
      default:
        return <BookOpen className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Domain Filters */}
      <div className="optical-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-mono text-sky-400 uppercase tracking-wider">
              Hero Phase · Collegiate & Systems Depth
            </div>
            <h2 className="font-display text-xl font-bold text-white tracking-tight">
              Advanced Computer Science Systems
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Algorithms, OS concurrency, database storage engines, TCP/TLS networking, distributed architecture, and cryptography.
            </p>
          </div>

          {onOpenAiMentor && (
            <button
              onClick={() =>
                onOpenAiMentor(
                  'Explain how operating systems, databases, networking protocols, and algorithms combine inside a production backend service.'
                )
              }
              className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 cursor-pointer shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              <span>Ask Systems Mentor</span>
            </button>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar border-t border-white/[0.08] pt-3">
          {SUBJECT_AREAS.map((subj) => {
            const isSelected = selectedSubject === subj;
            return (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-sky-500/20 text-white font-semibold ring-1 ring-sky-400/40'
                    : 'optical-inset text-slate-400 hover:text-slate-200'
                }`}
              >
                {subj !== 'All' && !isSelected && getSubjectIcon(subj)}
                <span>{subj}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <aside className="lg:col-span-4 optical-panel rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.08] bg-[#050811]/70 flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            <span>Modules ({filteredTopics.length})</span>
            <span>Select to inspect</span>
          </div>

          <div className="divide-y divide-white/[0.06] max-h-[700px] overflow-y-auto">
            {filteredTopics.map((topic) => {
              const isSelected = activeTopic.id === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer space-y-1 ${
                    isSelected
                      ? 'bg-sky-500/12 text-white shadow-[inset_0_0_0_1px_rgba(56,189,248,0.22)]'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                    {getSubjectIcon(topic.subjectArea)}
                    <span className={isSelected ? 'text-sky-400 font-semibold' : ''}>{topic.badge}</span>
                  </div>
                  <h3 className={`text-xs sm:text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {topic.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {topic.overview}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Dossier */}
        <section className="lg:col-span-8 optical-panel rounded-2xl p-6 space-y-6">
          <div className="border-b border-white/[0.08] pb-4 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-mono text-sky-400 uppercase tracking-wider">
              {getSubjectIcon(activeTopic.subjectArea)}
              <span>{activeTopic.subjectArea}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{activeTopic.badge}</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              {activeTopic.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {activeTopic.overview}
            </p>
          </div>

          {/* 1. Core Concepts */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Core Mastery Checklist</span>
            </h3>
            <div className="optical-inset divide-y divide-white/[0.06] rounded-xl overflow-hidden">
              {activeTopic.keyConcepts.map((concept, idx) => (
                <div key={idx} className="px-3.5 py-2.5 text-xs text-slate-200 flex items-start gap-2.5">
                  <span className="font-mono text-sky-400 font-semibold shrink-0 tabular-nums">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="leading-relaxed">{concept}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. CLI Diagnostic Tools */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-sky-400" />
              <span>Diagnostic Commands & Tools</span>
            </h3>
            <div className="optical-inset divide-y divide-white/[0.06] rounded-xl overflow-hidden">
              {activeTopic.keyCommands.map((cmd, idx) => (
                <div
                  key={idx}
                  className="px-3.5 py-2.5 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <code className="text-emerald-400 font-semibold">{cmd.command}</code>
                  <span className="text-xs text-slate-400 font-sans">{cmd.purpose}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Authoritative Textbooks & Sources */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-amber-400" />
              <span>Authoritative References</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeTopic.recommendedSources.map((source, idx) => (
                <div
                  key={idx}
                  className="optical-card p-3.5 rounded-xl flex flex-col justify-between gap-2.5"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-sky-400 uppercase">{source.type}</span>
                      {source.isClassic && (
                        <span className="text-amber-400 font-semibold">Classic Text</span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-white">{source.title}</h4>
                    <p className="text-[11px] text-slate-500 font-mono">{source.authorOrPlatform}</p>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">{source.notes}</p>
                  </div>

                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono text-sky-400 hover:underline pt-2 border-t border-white/[0.07]"
                  >
                    <span>Open Source</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Engineering Insights */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Engineering Mental Models
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {activeTopic.essentialTips.map((tip, idx) => (
                <li
                  key={idx}
                  className="optical-inset p-3 rounded-xl leading-relaxed"
                >
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* 5. Runnable Code Snippet */}
          {activeTopic.sampleCodeSnippet && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Reference Implementation ({activeTopic.sampleCodeSnippet.language.toUpperCase()})</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyCode(activeTopic.id, activeTopic.sampleCodeSnippet!.code)}
                    className="optical-card px-2.5 py-1.5 rounded-lg text-xs text-slate-300 flex items-center gap-1 cursor-pointer font-mono"
                  >
                    {copiedSnippetId === activeTopic.id ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>{copiedSnippetId === activeTopic.id ? 'Copied' : 'Copy'}</span>
                  </button>

                  {onOpenPlaygroundWithCode && (
                    <SoapBubbleButton
                      onClick={() =>
                        onOpenPlaygroundWithCode(
                          activeTopic.sampleCodeSnippet!.language,
                          activeTopic.sampleCodeSnippet!.code
                        )
                      }
                      tint="rgb(16 185 129)"
                      opacity={0.92}
                      style={{ fontSize: 11.5 }}
                      className="!min-h-[30px] !px-3.5 font-semibold text-white font-mono"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Run in Playground</span>
                    </SoapBubbleButton>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-400">{activeTopic.sampleCodeSnippet.description}</p>

              <pre className="optical-inset rounded-xl p-4 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre leading-relaxed">
                {activeTopic.sampleCodeSnippet.code}
              </pre>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
