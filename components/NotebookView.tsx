'use client';

import React, { useState, useRef } from 'react';
import { BookOpen, Save, Download, Upload, FileText, Check, Sparkles, RefreshCw } from 'lucide-react';
import { STAGES_DATA } from '@/lib/curriculum-data';

interface NotebookViewProps {
  stageNotes: Record<string, string>;
  onUpdateStageNotes: (stageId: string, notes: string) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonStr: string) => boolean;
  onOpenAiMentor: (context?: string) => void;
}

export function NotebookView({
  stageNotes,
  onUpdateStageNotes,
  onExportBackup,
  onImportBackup,
  onOpenAiMentor,
}: NotebookViewProps) {
  const [activeStageId, setActiveStageId] = useState<string>('stage-0');
  const [saveStatus, setSaveStatus] = useState<string>('All changes auto-saved');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentNote = stageNotes[activeStageId] || '';

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateStageNotes(activeStageId, e.target.value);
    setSaveStatus('Saving...');
    setTimeout(() => {
      setSaveStatus('All changes auto-saved');
    }, 400);
  };

  const insertTemplate = (templateType: 'weekly' | 'lab' | 'incident') => {
    let tpl = '';
    if (templateType === 'weekly') {
      tpl = `\n\n## 📝 Weekly Review Reflection (${new Date().toISOString().split('T')[0]})
1. **What did I build or solve this week?**
   - 
2. **Which idea can I explain without notes?**
   - 
3. **Where did I get stuck, and what changed when I debugged it?**
   - 
4. **What evidence did I record? Are there any secrets or personal details to remove?**
   - 
5. **What is the one weakest concept to revisit next week?**
   - 
6. **What are my top three realistic tasks for the coming week?**
   - 1. 
   - 2. 
   - 3. 
`;
    } else if (templateType === 'lab') {
      tpl = `\n\n## 🔬 10-Step Lab Write-Up (${new Date().toISOString().split('T')[0]})
1. **Title & Date**: 
2. **Scope & Authorization**: 
3. **Objective**: 
4. **Environment**: 
5. **Method Summary**: 
6. **Evidence & Sanitized Logs**: 
7. **Result & Observations**: 
8. **Concept Learned**: 
9. **Mitigation & Defensive Fix**: 
10. **Cleanup & Snapshot Restoration**: 
`;
    } else if (templateType === 'incident') {
      tpl = `\n\n## 🚨 Incident Report Simulation
- **Executive Summary**: 
- **Scope & Timeline**: 
- **Evidence**: 
- **Impact (CIA Triad)**: 
- **Actions Taken (Containment & Recovery)**: 
- **Root Cause & Contributing Factors**: 
- **Recommendations**: 
- **Lessons Learned**: 
`;
    }

    const updated = currentNote + tpl;
    onUpdateStageNotes(activeStageId, updated);
  };

  const handleDownloadMarkdown = () => {
    const stageName = STAGES_DATA.find((s) => s.id === activeStageId)?.title || 'Notes';
    const blob = new Blob([currentNote], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeStageId}-${stageName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const success = onImportBackup(text);
      if (success) {
        setImportStatus('Backup restored successfully!');
      } else {
        setImportStatus('Failed to parse backup JSON file.');
      }
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>STUDENT NOTEBOOK & CLOUD SYNC</span>
            <span>·</span>
            <span className="text-emerald-400 font-semibold">{saveStatus}</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Personal Study Journal & Lab Reports</h2>
          <p className="text-xs text-slate-400 mt-1">
            Write notes in your own words. Auto-saved locally with one-click JSON backup export and markdown downloads.
          </p>
        </div>

        {/* Cloud & Backup Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onExportBackup}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>Export Cloud JSON</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5 text-amber-400" />
            <span>Import Backup</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />

          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Export .md</span>
          </button>
        </div>
      </div>

      {importStatus && (
        <div className="rounded-lg bg-cyan-950/40 border border-cyan-800 p-3 text-xs text-cyan-200 font-mono">
          {importStatus}
        </div>
      )}

      {/* Stage Selector Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {STAGES_DATA.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveStageId(s.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors cursor-pointer ${
              activeStageId === s.id
                ? 'bg-cyan-600 text-white font-bold'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Stage {s.number}
          </button>
        ))}
      </div>

      {/* Editor & Templates Toolbar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="border-b border-slate-800 bg-slate-900/90 p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <span className="font-bold text-white">
              {STAGES_DATA.find((s) => s.id === activeStageId)?.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">Insert Template:</span>
            <button
              onClick={() => insertTemplate('weekly')}
              className="px-2.5 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              + Weekly Review
            </button>
            <button
              onClick={() => insertTemplate('lab')}
              className="px-2.5 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              + 10-Step Lab
            </button>
            <button
              onClick={() => insertTemplate('incident')}
              className="px-2.5 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              + Incident Report
            </button>

            <button
              onClick={() =>
                onOpenAiMentor(
                  `Review these study notes for ${STAGES_DATA.find((s) => s.id === activeStageId)?.title} and give me feedback on accuracy and suggestions:\n\n${currentNote}`
                )
              }
              className="flex items-center gap-1 px-3 py-1 text-[11px] rounded bg-purple-900/60 border border-purple-700 text-purple-200 hover:bg-purple-800 transition-colors cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-purple-400" />
              <span>Review Notes with AI</span>
            </button>
          </div>
        </div>

        {/* Textarea Workspace */}
        <textarea
          rows={22}
          value={currentNote}
          onChange={handleTextChange}
          placeholder="# Write your notes, command snippets, and reflections here..."
          className="w-full bg-slate-950 p-6 text-sm text-slate-200 focus:outline-none font-mono leading-relaxed resize-y"
        />
      </div>
    </div>
  );
}
