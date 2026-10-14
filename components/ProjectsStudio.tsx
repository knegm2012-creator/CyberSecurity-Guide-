'use client';

import React, { useState } from 'react';
import { FolderGit2, CheckCircle2, Circle, Clock, Download, Copy, ExternalLink, Sparkles, Check, GitBranch } from 'lucide-react';
import { PORTFOLIO_PROJECTS, PortfolioProject } from '@/lib/curriculum-data';

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
  const [showReadmeModal, setShowReadmeModal] = useState(false);
  const [copiedReadme, setCopiedReadme] = useState(false);

  const filtered = PORTFOLIO_PROJECTS.filter((p) => {
    if (filter === 'all') return true;
    return p.difficulty === filter;
  });

  const completedCount = Object.values(projectStatuses).filter((s) => s === 'completed').length;

  const generateReadmeMarkdown = (proj: PortfolioProject) => {
    return `# ${proj.title}

> A student cybersecurity and systems engineering project built for the CS Odyssey 6-Month Mastery portfolio.

## 1. Project Purpose & Objectives
${proj.brief}

## 2. Scope & Safety Boundaries
- **Intended Use**: Educational testing, local verification, and portfolio demonstration.
- **Out-of-Scope**: Do not deploy against unauthorized third-party networks or systems.
- **Data Privacy**: Strictly uses synthetic or lab data. No personal data, passwords, or live tokens are stored.

## 3. Technologies & Tools
${proj.tools.map((t) => `- ${t}`).join('\n')}

## 4. Installation & Requirements
\`\`\`bash
# Clone the repository
git clone https://github.com/your-username/${proj.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.git
cd ${proj.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}

# Setup environment (if Python)
python3 -m venv .venv
source .venv/bin/activate
\`\`\`

## 5. How to Run
\`\`\`bash
# Safe sample execution command
python3 main.py --help
\`\`\`

## 6. Acceptance Criteria & Test Verification
${proj.acceptanceCriteria.map((c) => `- [x] ${c}`).join('\n')}

## 7. Threats & Limitations
- What this tool detects: Standard policy edge cases and synthetic test inputs.
- Known limitations: This tool provides heuristic estimates and does not guarantee absolute system security.

## 8. What I Learned
- ${proj.learningOutcome}
- Key takeaway: Building small, reproducible, and verifiable tools beats complex copied scripts.

## License
MIT License - Student Educational Project (2026)
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
    setTimeout(() => setCopiedReadme(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>GITHUB PORTFOLIO STUDIO</span>
            <span>·</span>
            <span>14 DEFINED STUDENT PROJECTS</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Your Engineering Portfolio Showcase</h2>
          <p className="text-xs text-slate-400 mt-1">
            &quot;Build at least 3 to 5 small projects with clear READMEs. A finished, understandable project beats a huge copied repository.&quot;
          </p>
        </div>

        {/* Git Sandbox Preparatory Callout */}
        {onOpenGitSandbox && (
          <button
            onClick={onOpenGitSandbox}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 text-xs font-semibold transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
          >
            <GitBranch className="h-4 w-4 text-emerald-400" />
            <span>Master Git in Interactive Sandbox →</span>
          </button>
        )}

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-1 text-xs font-semibold">
            {(['all', 'Easy', 'Medium'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className={`px-3 py-1 rounded transition-colors capitalize cursor-pointer ${
                  filter === lvl ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Projects List Sidebar */}
        <div className="lg:w-96 shrink-0 space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
          {filtered.map((proj) => {
            const status = projectStatuses[proj.id] || 'not_started';
            const isSelected = selectedProj.id === proj.id;

            return (
              <button
                key={proj.id}
                onClick={() => setSelectedProj(proj)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-950/40 shadow-lg shadow-cyan-950/40'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-slate-500">PROJECT {proj.number}</span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                      status === 'completed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        : status === 'in_progress'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {status === 'completed' ? 'Done' : status === 'in_progress' ? 'In Progress' : 'Not Started'}
                  </span>
                </div>

                <div className="text-sm font-bold text-white line-clamp-1">{proj.title}</div>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 font-mono">
                  <span>{proj.tools.join(', ')}</span>
                  <span>·</span>
                  <span
                    className={
                      proj.difficulty === 'Easy'
                        ? 'text-emerald-400'
                        : proj.difficulty === 'Medium'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }
                  >
                    {proj.difficulty}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Project Full Dossier */}
        <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="text-xs font-mono text-cyan-400 mb-1">
                PROJECT {selectedProj.number} · {selectedProj.difficulty.toUpperCase()} DIFFICULTY
              </div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">{selectedProj.title}</h3>
              <div className="flex items-center gap-2 mt-2 text-xs font-mono text-slate-300">
                <span className="text-slate-400">Tools:</span>
                {selectedProj.tools.map((t) => (
                  <span key={t} className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-cyan-300">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Status Selector */}
            <div className="flex items-center gap-2">
              {(['not_started', 'in_progress', 'completed'] as const).map((st) => {
                const currentStatus = projectStatuses[selectedProj.id] || 'not_started';
                const isActive = currentStatus === st;
                return (
                  <button
                    key={st}
                    onClick={() => onUpdateStatus(selectedProj.id, st)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      isActive
                        ? st === 'completed'
                          ? 'border-emerald-600 bg-emerald-950 text-emerald-300'
                          : st === 'in_progress'
                          ? 'border-amber-600 bg-amber-950 text-amber-300'
                          : 'border-slate-600 bg-slate-800 text-slate-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st === 'completed' ? 'Completed' : st === 'in_progress' ? 'In Progress' : 'Not Started'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project Brief */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Project Brief
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
              {selectedProj.brief}
            </p>
          </div>

          {/* Acceptance Criteria */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Acceptance Criteria Checklist
            </h4>
            <div className="space-y-2">
              {selectedProj.acceptanceCriteria.map((crit, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-800/80 bg-slate-950/70 text-xs text-slate-300"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{crit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Outcome */}
          <div className="rounded-xl border border-indigo-950/70 bg-indigo-950/20 p-4 text-xs text-indigo-200 leading-relaxed">
            <strong className="text-indigo-400">Core Engineering Outcome:</strong> {selectedProj.learningOutcome}
          </div>

          {/* Actions & README Generation */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={() =>
                onOpenAiMentor(
                  `Help me architect Project ${selectedProj.number}: "${selectedProj.title}". Give me advice on step-by-step code structure for a Grade 9 student!`
                )
              }
              className="flex items-center gap-2 rounded-lg border border-purple-500/40 bg-purple-950/40 px-4 py-2 text-xs font-semibold text-purple-200 hover:bg-purple-900/50 transition-colors cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>Architect with AI Mentor</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyReadme(selectedProj)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {copiedReadme ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedReadme ? 'Copied README' : 'Copy README.md'}</span>
              </button>
              <button
                onClick={() => handleDownloadReadme(selectedProj)}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download README.md</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
