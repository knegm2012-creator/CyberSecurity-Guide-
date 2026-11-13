'use client';

import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  Download,
  Copy,
  Check,
  Video,
  BookOpen,
  GraduationCap,
  FileCode2,
  FlaskConical,
  ScrollText,
  FolderGit2,
} from 'lucide-react';
import { SoapBubbleButton, SoapBubbleSearch } from '@/components/soap-bubble';
import {
  CURATED_CS_SOURCES,
  SourceMedium,
  SourceLevel,
  SourceDomain,
} from '@/lib/sources-catalog';
import { STAGES_DATA } from '@/lib/curriculum-data';
import { generateCuratedSourcesMarkdown } from '@/lib/curriculum-export';

const MEDIA_FILTERS: Array<{ id: 'All' | SourceMedium; label: string }> = [
  { id: 'All', label: 'All Formats' },
  { id: 'Course', label: 'University Courses' },
  { id: 'Video', label: 'Video Lectures' },
  { id: 'Book', label: 'Textbooks' },
  { id: 'Docs', label: 'Official Docs & RFCs' },
  { id: 'Lab', label: 'Interactive Labs' },
  { id: 'Paper', label: 'Seminal Papers' },
  { id: 'Repo', label: 'GitHub Repos' },
];

const LEVEL_FILTERS: Array<'All' | SourceLevel> = [
  'All',
  'Foundation',
  'Intermediate',
  'Advanced',
  'Research',
];

const DOMAIN_FILTERS: Array<'All' | SourceDomain> = [
  'All',
  'CS Basics & Math',
  'Programming & OOP',
  'Algorithms & DSA',
  'Operating Systems & C',
  'Databases',
  'Networking',
  'Distributed Systems',
  'Security & Cryptography',
  'Web & Full-Stack',
  'Compilers & Architecture',
];

function getMediumIcon(medium: SourceMedium) {
  switch (medium) {
    case 'Video':
      return <Video className="h-3.5 w-3.5 text-rose-400 shrink-0" />;
    case 'Course':
      return <GraduationCap className="h-3.5 w-3.5 text-sky-400 shrink-0" />;
    case 'Book':
      return <BookOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
    case 'Docs':
      return <FileCode2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
    case 'Lab':
      return <FlaskConical className="h-3.5 w-3.5 text-sky-400 shrink-0" />;
    case 'Paper':
      return <ScrollText className="h-3.5 w-3.5 text-slate-300 shrink-0" />;
    case 'Repo':
      return <FolderGit2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
  }
}

export function SourceLibraryView() {
  const [search, setSearch] = useState('');
  const [medium, setMedium] = useState<'All' | SourceMedium>('All');
  const [level, setLevel] = useState<'All' | SourceLevel>('All');
  const [domain, setDomain] = useState<'All' | SourceDomain>('All');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSources = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CURATED_CS_SOURCES.filter((src) => {
      if (medium !== 'All' && src.medium !== medium) return false;
      if (level !== 'All' && src.level !== level) return false;
      if (domain !== 'All' && src.domain !== domain) return false;
      if (stageFilter !== 'All' && !src.stageIds.includes(stageFilter)) return false;

      if (!q) return true;
      return (
        src.title.toLowerCase().includes(q) ||
        src.authorOrOrg.toLowerCase().includes(q) ||
        src.whyItMatters.toLowerCase().includes(q) ||
        src.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [search, medium, level, domain, stageFilter]);

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const handleExportMarkdown = () => {
    const md = generateCuratedSourcesMarkdown(filteredSources);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cs-odyssey-curated-sources.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Action */}
      <div className="optical-panel rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-cyan-400 tabular-nums">
              Global Open-Education Index · {CURATED_CS_SOURCES.length} Verified Sources
            </div>
            <h2 className="font-display text-xl font-bold text-white tracking-tight [text-wrap:balance]">
              Curated Websites, Videos, Courses, Books &amp; Papers
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Primary university courses, canonical video series, open-license textbooks, Internet RFC specs, and hands-on arenas mapped across all 14 stages.
            </p>
          </div>

          <SoapBubbleButton
            onClick={handleExportMarkdown}
            tint="rgb(56 189 248)"
            opacity={0.92}
            style={{ fontSize: 12 }}
            className="!min-h-[36px] !px-4 font-semibold text-white shrink-0 whitespace-nowrap"
          >
            <span className="inline-flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />
              <span>Export Filtered List (.md)</span>
            </span>
          </SoapBubbleButton>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-white/[0.08] items-center">
          <div className="md:col-span-5">
            <SoapBubbleSearch
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search titles, authors, MIT, Raft, pointers..."
              style={{ fontSize: 12 }}
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as 'All' | SourceDomain)}
              className="w-full rounded-xl border border-white/[0.1] bg-[#040710]/85 px-3 py-2 text-xs text-slate-200 focus:border-cyan-400/50 focus:outline-none cursor-pointer"
              aria-label="Filter by subject domain"
            >
              {DOMAIN_FILTERS.map((d) => (
                <option key={d} value={d}>
                  {d === 'All' ? 'All Subject Domains' : d}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as 'All' | SourceLevel)}
              className="w-full rounded-xl border border-white/[0.1] bg-[#040710]/85 px-3 py-2 text-xs text-slate-200 focus:border-cyan-400/50 focus:outline-none cursor-pointer"
              aria-label="Filter by difficulty level"
            >
              {LEVEL_FILTERS.map((lv) => (
                <option key={lv} value={lv}>
                  {lv === 'All' ? 'All Levels' : lv}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full rounded-xl border border-white/[0.1] bg-[#040710]/85 px-3 py-2 text-xs text-slate-200 focus:border-cyan-400/50 focus:outline-none cursor-pointer"
              aria-label="Filter by curriculum stage"
            >
              <option value="All">All 14 Stages</option>
              {STAGES_DATA.map((st) => (
                <option key={st.id} value={st.id}>
                  Stage {st.number}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Medium Segmented Bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="optical-subnav flex gap-1 p-1 rounded-xl overflow-x-auto no-scrollbar">
            {MEDIA_FILTERS.map((m) => {
              const active = medium === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMedium(m.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-cyan-500/18 text-cyan-200 border border-cyan-400/35 font-semibold'
                      : 'border border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          <span className="text-xs font-mono text-slate-500 tabular-nums shrink-0">
            Showing {filteredSources.length} of {CURATED_CS_SOURCES.length}
          </span>
        </div>
      </div>

      {/* Results List */}
      {filteredSources.length === 0 ? (
        <div className="optical-panel rounded-2xl border-dashed p-10 text-center space-y-2">
          <p className="text-sm font-medium text-slate-300">No sources matched the active filters.</p>
          <button
            onClick={() => {
              setSearch('');
              setMedium('All');
              setLevel('All');
              setDomain('All');
              setStageFilter('All');
            }}
            className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSources.map((src) => (
            <article
              key={src.id}
              className="optical-card rounded-2xl p-5 flex flex-col justify-between gap-4 transition-colors"
            >
              <div className="space-y-2">
                {/* Clean unboxed metadata kicker */}
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {getMediumIcon(src.medium)}
                    <span className="text-slate-200 font-semibold">{src.medium}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{src.domain}</span>
                  </div>
                  <span
                    className={`shrink-0 ${
                      src.cost === 'Free' || src.cost === 'Open Source'
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {src.cost}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white leading-snug">{src.title}</h3>
                <p className="text-xs font-mono text-slate-400">
                  {src.authorOrOrg} · {src.level}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">{src.whyItMatters}</p>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3 text-xs font-mono">
                <span className="text-[11px] text-slate-500 truncate">
                  {src.stageIds.map((id) => `S${id.replace('stage-', '')}`).join(', ')} ·{' '}
                  {src.tags.slice(0, 3).join(', ')}
                </span>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleCopyUrl(src.id, src.url)}
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title="Copy source URL"
                  >
                    {copiedId === src.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedId === src.id ? 'Copied' : 'Copy Link'}</span>
                  </button>

                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sky-400 hover:underline font-semibold whitespace-nowrap"
                  >
                    <span>Visit</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
