'use client';

import React, { useState, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  FileText,
  FileSpreadsheet,
  Braces,
  BookMarked,
  GraduationCap,
  FolderGit2,
  Printer,
  FileCode2,
  CalendarClock,
} from 'lucide-react';
import {
  ExportAudienceMode,
  generateFullCurriculumMarkdown,
  generateCuratedSourcesMarkdown,
  generateCurriculumCsv,
  generateOpenSourceJson,
  generateContributingMarkdown,
  generatePrintableHtmlSyllabus,
  computePacingSummary,
} from '@/lib/curriculum-export';
import { STAGES_DATA, ADVANCED_HERO_TOPICS, PORTFOLIO_PROJECTS } from '@/lib/curriculum-data';
import { CURATED_CS_SOURCES } from '@/lib/sources-catalog';
import { SoapBubbleButton, SoapBubbleSlider, SoapBubbleToggle } from './soap-bubble';

type ExportArtifactType =
  | 'curriculum-md'
  | 'printable-html'
  | 'sources-md'
  | 'contributing-md'
  | 'syllabus-csv'
  | 'open-json';

export function CurriculumExportHub() {
  const [mode, setMode] = useState<ExportAudienceMode>('student');
  const [artifact, setArtifact] = useState<ExportArtifactType>('curriculum-md');
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(10);
  const [includeStages, setIncludeStages] = useState(true);
  const [includeHeroModules, setIncludeHeroModules] = useState(true);
  const [includeSourcesCatalog, setIncludeSourcesCatalog] = useState(true);
  const [includeProjects, setIncludeProjects] = useState(true);
  const [includeCodeSnippets, setIncludeCodeSnippets] = useState(false);
  const [includeRubrics, setIncludeRubrics] = useState(true);
  const [copied, setCopied] = useState(false);

  const pacing = useMemo(() => computePacingSummary(hoursPerWeek), [hoursPerWeek]);

  const projectedCompletionDate = useMemo(() => {
    const target = new Date();
    target.setUTCDate(target.getUTCDate() + pacing.totalWeeks * 7);
    return target.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }, [pacing.totalWeeks]);

  const generatedOutput = useMemo(() => {
    switch (artifact) {
      case 'curriculum-md':
        return generateFullCurriculumMarkdown({
          mode,
          includeStages,
          includeHeroModules,
          includeSourcesCatalog,
          includeProjects,
          includeCodeSnippets,
          includeRubrics,
          hoursPerWeek,
        });
      case 'printable-html':
        return generatePrintableHtmlSyllabus(hoursPerWeek);
      case 'sources-md':
        return generateCuratedSourcesMarkdown();
      case 'contributing-md':
        return generateContributingMarkdown();
      case 'syllabus-csv':
        return generateCurriculumCsv();
      case 'open-json':
        return generateOpenSourceJson();
    }
  }, [
    artifact,
    mode,
    hoursPerWeek,
    includeStages,
    includeHeroModules,
    includeSourcesCatalog,
    includeProjects,
    includeCodeSnippets,
    includeRubrics,
  ]);

  const fileMetadata = useMemo(() => {
    const lineCount = generatedOutput.split('\n').length;
    const byteSize = new Blob([generatedOutput]).size;
    const kb = (byteSize / 1024).toFixed(1);

    let filename = 'CS-Odyssey-Curriculum.md';
    let mimeType = 'text/markdown;charset=utf-8';
    if (artifact === 'printable-html') {
      filename = `cs-odyssey-syllabus-${hoursPerWeek}h-wk.html`;
      mimeType = 'text/html;charset=utf-8';
    } else if (artifact === 'sources-md') {
      filename = 'CURATED-SOURCES.md';
    } else if (artifact === 'contributing-md') {
      filename = 'CONTRIBUTING.md';
    } else if (artifact === 'syllabus-csv') {
      filename = 'cs-odyssey-syllabus.csv';
      mimeType = 'text/csv;charset=utf-8';
    } else if (artifact === 'open-json') {
      filename = 'cs-odyssey-open-curriculum.json';
      mimeType = 'application/json;charset=utf-8';
    } else if (mode === 'teacher') {
      filename = 'EDUCATOR-SYLLABUS.md';
    } else if (mode === 'github') {
      filename = 'README-CURRICULUM.md';
    }

    return { lineCount, kb, filename, mimeType };
  }, [generatedOutput, artifact, mode, hoursPerWeek]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedOutput], { type: fileMetadata.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileMetadata.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Summary + Weekly Pacing Strip */}
      <div className="optical-panel rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
              MIT Open Educational Resource · Students, Teachers &amp; GitHub
            </div>
            <h2 className="font-display text-xl font-bold text-white tracking-tight">
              Open-Source Curriculum Pack &amp; Syllabus Exporter
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Generate complete, portable curriculum files ready for self-study checklists, printable classroom syllabi, LMS spreadsheets, and GitHub repositories.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleCopy}
              className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 cursor-pointer whitespace-nowrap"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Output'}</span>
            </button>

            <SoapBubbleButton
              onClick={handleDownload}
              tint="rgb(14 165 233)"
              opacity={0.92}
              style={{ fontSize: 12 }}
              className="!min-h-[34px] !px-4 font-semibold text-white whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download {fileMetadata.filename}</span>
            </SoapBubbleButton>
          </div>
        </div>

        {/* Weekly Pacing Calculator */}
        <div className="optical-inset rounded-xl p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-5 space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5 text-sky-400" />
                <span>Study / Course Pace</span>
              </span>
              <span className="text-sky-400 font-bold tabular-nums">{hoursPerWeek} hrs / week</span>
            </div>
            <div className="py-1">
              <SoapBubbleSlider
                value={hoursPerWeek}
                min={4}
                max={25}
                step={1}
                onValueChange={setHoursPerWeek}
                label="Study / Course Pace (hours per week)"
                from="#38bdf8"
                to="#a855f7"
                scale={0.75}
              />
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08] border border-white/[0.08] rounded-xl bg-[#070b14]/70 text-xs overflow-hidden">
            <div className="px-3.5 py-2.5">
              <div className="text-slate-400">Total Effort</div>
              <div className="font-mono font-bold text-white tabular-nums mt-0.5">{pacing.totalHours} hrs</div>
            </div>
            <div className="px-3.5 py-2.5">
              <div className="text-slate-400">Duration</div>
              <div className="font-mono font-bold text-sky-400 tabular-nums mt-0.5">{pacing.totalWeeks} weeks</div>
            </div>
            <div className="px-3.5 py-2.5">
              <div className="text-slate-400">Projected Finish</div>
              <div className="font-mono font-bold text-emerald-400 tabular-nums mt-0.5">{projectedCompletionDate}</div>
            </div>
            <div className="px-3.5 py-2.5">
              <div className="text-slate-400">Verified Sources</div>
              <div className="font-mono font-bold text-slate-200 tabular-nums mt-0.5">{CURATED_CS_SOURCES.length} links</div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Config & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-4 optical-panel rounded-2xl p-5 space-y-5">
          {/* Format Selector */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              1. Output Format
            </h3>
            <div className="space-y-1.5">
              {[
                {
                  id: 'curriculum-md' as ExportArtifactType,
                  label: 'Complete Curriculum (.md)',
                  sub: 'Markdown syllabus + custom weekly pacing',
                  icon: FileText,
                },
                {
                  id: 'printable-html' as ExportArtifactType,
                  label: 'Printable Classroom Syllabus (.html)',
                  sub: 'Self-contained Print / PDF handout',
                  icon: Printer,
                },
                {
                  id: 'sources-md' as ExportArtifactType,
                  label: 'Verified Sources Index (.md)',
                  sub: `${CURATED_CS_SOURCES.length} sites, videos, courses & books`,
                  icon: BookMarked,
                },
                {
                  id: 'contributing-md' as ExportArtifactType,
                  label: 'Open-Source CONTRIBUTING.md',
                  sub: 'GitHub PR verification standards & license',
                  icon: FileCode2,
                },
                {
                  id: 'syllabus-csv' as ExportArtifactType,
                  label: 'LMS / Spreadsheet Syllabus (.csv)',
                  sub: 'Import into Excel, Sheets, Canvas, Notion',
                  icon: FileSpreadsheet,
                },
                {
                  id: 'open-json' as ExportArtifactType,
                  label: 'Machine-Readable Schema (.json)',
                  sub: `${STAGES_DATA.length} stages, ${ADVANCED_HERO_TOPICS.length} tracks, ${PORTFOLIO_PROJECTS.length} builds`,
                  icon: Braces,
                },
              ].map((item) => {
                const Icon = item.icon;
                const active = artifact === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setArtifact(item.id)}
                    className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors cursor-pointer flex items-start gap-2.5 ${
                      active
                        ? 'border-sky-500/50 bg-sky-500/12 text-white shadow-[0_0_16px_rgba(56,189,248,0.14)]'
                        : 'border-white/[0.07] bg-[#04070e]/75 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${active ? 'text-sky-400' : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold">{item.label}</div>
                      <div className="text-[11px] text-slate-400">{item.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audience Mode */}
          {artifact === 'curriculum-md' && (
            <>
              <div className="space-y-2.5 pt-4 border-t border-white/[0.08]">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  2. Audience Profile
                </h3>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    {
                      id: 'student' as ExportAudienceMode,
                      label: 'Student Self-Study',
                      desc: 'Checkboxes, weekly cadence & practice labs',
                      icon: GraduationCap,
                    },
                    {
                      id: 'teacher' as ExportAudienceMode,
                      label: 'Educator Syllabus & Rubrics',
                      desc: 'Pacing guide, policies & assessment criteria',
                      icon: BookMarked,
                    },
                    {
                      id: 'github' as ExportAudienceMode,
                      label: 'GitHub Open-Source Pack',
                      desc: 'Repo badges, contributor rules & MIT guide',
                      icon: FolderGit2,
                    },
                  ].map((p) => {
                    const Icon = p.icon;
                    const active = mode === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setMode(p.id)}
                        className={`w-full text-left rounded-xl border px-3 py-2 transition-colors cursor-pointer flex items-start gap-2.5 ${
                          active
                            ? 'border-emerald-500/50 bg-emerald-500/12 text-white'
                            : 'border-white/[0.07] bg-[#04070e]/75 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${active ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <div>
                          <div className="text-xs font-semibold">{p.label}</div>
                          <div className="text-[11px] text-slate-400">{p.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section Toggles */}
              <div className="space-y-2.5 pt-4 border-t border-white/[0.08]">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  3. Included Curriculum Blocks
                </h3>
                <div className="space-y-2 text-xs text-slate-300">
                  {[
                    { label: 'All 14 Stage Syllabi & Topics', state: includeStages, setter: setIncludeStages },
                    { label: 'Hero Collegiate Systems Modules', state: includeHeroModules, setter: setIncludeHeroModules },
                    { label: '14 Capstone Portfolio Projects', state: includeProjects, setter: setIncludeProjects },
                    { label: 'Full Curated Source Directory', state: includeSourcesCatalog, setter: setIncludeSourcesCatalog },
                    { label: 'Assignments & Exit Gate Rubrics', state: includeRubrics, setter: setIncludeRubrics },
                    { label: 'Embed Python & C Code Listings', state: includeCodeSnippets, setter: setIncludeCodeSnippets },
                  ].map((opt) => (
                    <div
                      key={opt.label}
                      onClick={() => opt.setter(!opt.state)}
                      className="optical-inset flex items-center justify-between gap-3 rounded-xl px-3 py-2 cursor-pointer hover:border-white/20"
                    >
                      <span>{opt.label}</span>
                      <div onClick={(e) => e.stopPropagation()}>
                        <SoapBubbleToggle
                          checked={opt.state}
                          onCheckedChange={opt.setter}
                          aria-label={opt.label}
                          color="#38bdf8"
                          scale={0.65}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Right Live Preview (8 cols) */}
        <section className="lg:col-span-8 optical-panel rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.08] bg-[#050811]/70 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <span className="text-white font-semibold">{fileMetadata.filename}</span>
            <span className="text-slate-400 tabular-nums">
              {fileMetadata.lineCount} lines · {fileMetadata.kb} KB · MIT Open License
            </span>
          </div>

          <pre className="p-5 bg-[#03050b]/85 text-xs font-mono text-slate-200 overflow-x-auto max-h-[680px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {generatedOutput}
          </pre>
        </section>
      </div>
    </div>
  );
}
