'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Copy,
  Sparkles,
  Check,
  GitBranch,
} from 'lucide-react';
import { PORTFOLIO_PROJECTS, PortfolioProject } from '@/lib/curriculum-data';
import { SoapBubbleButton } from './soap-bubble';

interface ProjectsStudioProps {
  projectStatuses: Record<string, 'not_started' | 'in_progress' | 'completed'>;
  projectNotes: Record<string, string>;
  onUpdateStatus: (projId: string, status: 'not_started' | 'in_progress' | 'completed') => void;
  onUpdateNotes: (projId: string, notes: string) => void;
  onOpenAiMentor: (context?: string) => void;
  onOpenGitSandbox?: () => void;
}

export function ProjectsStudio({
  projectStatuses,
  projectNotes,
  onUpdateStatus,
  onUpdateNotes,
  onOpenAiMentor,
  onOpenGitSandbox,
}: ProjectsStudioProps) {
  const [filter, setFilter] = useState<'all' | 'Easy' | 'Medium'>('all');
  const [selectedProj, setSelectedProj] = useState<PortfolioProject>(PORTFOLIO_PROJECTS[0]);
  const [copiedReadme, setCopiedReadme] = useState(false);

  const filtered = PORTFOLIO_PROJECTS.filter((p) => {
    if (filter === 'all') return true;
    return p.difficulty === filter;
  });

  const generateReadmeMarkdown = (proj: PortfolioProject) => {
    const slug = proj.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `# ${proj.title}

> Built as part of the CS Odyssey Systems Engineering Portfolio.

## 1. Objective
${proj.brief}

## 2. Scope & Safety Boundaries
- **Intended Use**: Educational testing, local verification, and portfolio demonstration.
- **Out-of-Scope**: Never execute against unauthorized networks or third-party infrastructure.
- **Privacy**: Strictly uses synthetic or local fixture data.

## 3. Technologies
${proj.tools.map((t) => `- ${t}`).join('\n')}

## 4. Setup & Execution
\`\`\`bash
git clone https://github.com/your-username/${slug}.git
cd ${slug}
python3 main.py --help
\`\`\`

## 5. Acceptance Criteria
${proj.acceptanceCriteria.map((c) => `- [x] ${c}`).join('\n')}

## 6. Key Outcome
- ${proj.learningOutcome}

## License
MIT
`;
  };

  const handleDownloadReadme = (proj: PortfolioProject) => {
    const content = generateReadmeMarkdown(proj);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `README-${proj.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyReadme = (proj: PortfolioProject) => {
    navigator.clipboard.writeText(generateReadmeMarkdown(proj));
    setCopiedReadme(true);
    setTimeout(() => setCopiedReadme(false), 1800);
  };

  const currentStatus = projectStatuses[selectedProj.id] || 'not_started';

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white tracking-tight">
            14 Portfolio Projects
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Small, reproducible repositories with clear READMEs, bounded scope, and verifiable tests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenGitSandbox && (
            <button
              onClick={onOpenGitSandbox}
              className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-200 cursor-pointer"
            >
              <GitBranch className="h-3.5 w-3.5 text-emerald-400" />
              <span>Git Studio</span>
            </button>
          )}

          <div className="optical-subnav flex rounded-xl p-1 text-xs font-medium">
            {(['all', 'Easy', 'Medium'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg transition-colors capitalize cursor-pointer ${
                  filter === lvl ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2-Column Portfolio Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Project Index */}
        <aside className="lg:col-span-4 optical-panel rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.08] bg-[#050811]/70 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Project Specifications ({filtered.length})
          </div>
          <div className="divide-y divide-white/[0.06] max-h-[680px] overflow-y-auto">
            {filtered.map((proj) => {
              const status = projectStatuses[proj.id] || 'not_started';
              const isSelected = selectedProj.id === proj.id;

              return (
                <button
                  key={proj.id}
                  onClick={() => setSelectedProj(proj)}
                  className={`w-full text-left px-4 py-3 transition-colors cursor-pointer space-y-1 ${
                    isSelected
                      ? 'bg-sky-500/12 text-white shadow-[inset_0_0_0_1px_rgba(56,189,248,0.22)]'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className={isSelected ? 'text-sky-400 font-semibold' : 'text-slate-500'}>
                      PROJECT {String(proj.number).padStart(2, '0')}
                    </span>
                    <span
                      className={
                        status === 'completed'
                          ? 'text-emerald-400'
                          : status === 'in_progress'
                          ? 'text-amber-400'
                          : 'text-slate-500'
                      }
                    >
                      {status === 'completed' ? 'Done' : status === 'in_progress' ? 'Active' : 'Todo'}
                    </span>
                  </div>
                  <div className={`text-xs sm:text-sm font-semibold line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {proj.title}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 truncate">
                    {proj.tools.join(' · ')} · {proj.difficulty}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Selected Project Dossier */}
        <section className="lg:col-span-8 optical-panel rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-sky-400 uppercase tracking-wider">
                Project {selectedProj.number} · {selectedProj.difficulty} · {selectedProj.tools.join(' / ')}
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                {selectedProj.title}
              </h3>
            </div>

            {/* Status Switch */}
            <div className="optical-subnav flex rounded-xl p-1 text-xs font-medium shrink-0">
              {(['not_started', 'in_progress', 'completed'] as const).map((st) => {
                const isActive = currentStatus === st;
                return (
                  <button
                    key={st}
                    onClick={() => onUpdateStatus(selectedProj.id, st)}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? st === 'completed'
                          ? 'bg-emerald-500 text-slate-950 font-semibold'
                          : st === 'in_progress'
                          ? 'bg-amber-400 text-slate-950 font-semibold'
                          : 'bg-white/15 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st === 'completed' ? 'Completed' : st === 'in_progress' ? 'In Progress' : 'Not Started'}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-mono text-sky-400 uppercase tracking-wider font-semibold">
              Architecture Brief
            </h4>
            <p className="optical-inset text-xs sm:text-sm text-slate-200 leading-relaxed p-4 rounded-xl">
              {selectedProj.brief}
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-mono text-sky-400 uppercase tracking-wider font-semibold">
              Acceptance Criteria
            </h4>
            <div className="optical-inset divide-y divide-white/[0.06] rounded-xl overflow-hidden">
              {selectedProj.acceptanceCriteria.map((crit, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 text-xs text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{crit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="optical-inset rounded-xl p-3.5 text-xs text-slate-300 leading-relaxed">
            <span className="font-mono text-emerald-400 font-semibold mr-1.5">Engineering Outcome:</span>
            {selectedProj.learningOutcome}
          </div>

          {/* Wired Implementation Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider">
              Implementation Notes & Repo Link
            </label>
            <textarea
              rows={3}
              value={projectNotes[selectedProj.id] || ''}
              onChange={(e) => onUpdateNotes(selectedProj.id, e.target.value)}
              placeholder="Track design decisions, edge cases tested, or your GitHub repository URL..."
              className="optical-inset w-full rounded-xl p-3 text-xs text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
            <button
              onClick={() =>
                onOpenAiMentor(
                  `Help me structure Project ${selectedProj.number}: "${selectedProj.title}" into clean modules and automated tests.`
                )
              }
              className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              <span>Architect with Mentor</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleCopyReadme(selectedProj)}
                className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 cursor-pointer"
              >
                {copiedReadme ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedReadme ? 'Copied' : 'Copy README'}</span>
              </button>
              <SoapBubbleButton
                onClick={() => handleDownloadReadme(selectedProj)}
                tint="rgb(14 165 233)"
                opacity={0.92}
                style={{ fontSize: 12 }}
                className="!min-h-[34px] !px-4 font-semibold text-white"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download README.md</span>
              </SoapBubbleButton>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
