'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileDown,
  FileText,
  FolderGit2,
  Play,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Terminal,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { SoapBubbleButton } from '@/components/soap-bubble';
import { STAGES_DATA } from '@/lib/curriculum-data';
import type { SavedCodeSnippet } from '@/hooks/use-odyssey-store';
import {
  createInitialTerminalState,
  executeNotebookSnippet,
  formatTerminalCwd,
  parseMarkdownCodeSnippets,
  type SnippetLanguage,
  type TerminalHistoryEntry,
  type VirtualTerminalState,
} from '@/lib/terminal-engine';

interface NotebookViewProps {
  stageNotes: Record<string, string>;
  onUpdateStageNotes: (stageId: string, notes: string) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonStr: string) => boolean;
  onOpenAiMentor: (context?: string) => void;
  onDownloadMasteryPdf?: () => void;
  onOpenGitHubSync?: () => void;
  savedSnippets?: SavedCodeSnippet[];
  onSaveSnippet?: (
    snippet: Omit<SavedCodeSnippet, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => void;
  onDeleteSnippet?: (id: string) => void;
  onRunCommandInShell?: (command: string) => void;
}

interface NotebookExecutionRecord {
  id: number;
  snippetId: string;
  title: string;
  language: SnippetLanguage;
  transcript: TerminalHistoryEntry[];
  stdout: string;
  stderr: string;
  exitCode: number;
  cwd: string;
  commandsExecuted: number;
  engineMode: 'virtual-shell' | 'code-sandbox';
}

interface RenderableSnippet {
  id: string;
  title: string;
  language: SnippetLanguage;
  code: string;
  source: 'saved' | 'note';
  lineNumber?: number;
  updatedAt?: string;
}

export function NotebookView({
  stageNotes,
  onUpdateStageNotes,
  onExportBackup,
  onImportBackup,
  onOpenAiMentor,
  onDownloadMasteryPdf,
  onOpenGitHubSync,
  savedSnippets = [],
  onSaveSnippet,
  onDeleteSnippet,
  onRunCommandInShell,
}: NotebookViewProps) {
  const [activeStageId, setActiveStageId] = useState<string>('stage-0');
  const [saveStatus, setSaveStatus] = useState<string>('All changes auto-saved');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shared Terminal Simulator session state scoped to Notebook
  const terminalStateRef = useRef<VirtualTerminalState>(createInitialTerminalState());
  const execSeqRef = useRef(0);
  const [shellCwd, setShellCwd] = useState<string>('/home/bandit0');
  const [runningSnippetId, setRunningSnippetId] = useState<string | null>(null);
  const [perSnippetOutputs, setPerSnippetOutputs] = useState<
    Record<string, NotebookExecutionRecord>
  >({});
  const [activeOutputSnippetId, setActiveOutputSnippetId] = useState<string | null>(null);
  const [copiedOutputId, setCopiedOutputId] = useState<string | null>(null);

  // Inline "New Snippet" composer inside Notebook
  const [showNewSnippetForm, setShowNewSnippetForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLanguage, setNewLanguage] = useState<SnippetLanguage>('bash');
  const [newCode, setNewCode] = useState('ls -la\ncat readme');

  const currentNote = stageNotes[activeStageId] || '';

  const noteSnippets = useMemo(
    () => parseMarkdownCodeSnippets(currentNote),
    [currentNote]
  );

  const combinedSnippets: RenderableSnippet[] = useMemo(() => {
    const saved: RenderableSnippet[] = savedSnippets.map((s) => ({
      id: s.id,
      title: s.title,
      language: s.language,
      code: s.code,
      source: 'saved',
      updatedAt: s.updatedAt,
    }));
    const fromNotes: RenderableSnippet[] = noteSnippets.map((s) => ({
      id: s.id,
      title: s.title,
      language: s.language,
      code: s.code,
      source: 'note',
      lineNumber: s.lineNumber,
    }));
    return [...saved, ...fromNotes];
  }, [savedSnippets, noteSnippets]);

  const activeOutputRecord = activeOutputSnippetId
    ? perSnippetOutputs[activeOutputSnippetId] || null
    : null;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateStageNotes(activeStageId, e.target.value);
    setSaveStatus('Saving...');
    setTimeout(() => {
      setSaveStatus('All changes auto-saved');
    }, 400);
  };

  const insertTemplate = (templateType: 'weekly' | 'lab' | 'incident' | 'snippet') => {
    let tpl = '';
    if (templateType === 'weekly') {
      tpl = `\n\n## Weekly Review Reflection (${new Date().toISOString().split('T')[0]})
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
      tpl = `\n\n## 10-Step Lab Write-Up (${new Date().toISOString().split('T')[0]})
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
      tpl = `\n\n## Incident Report Simulation
- **Executive Summary**: 
- **Scope & Timeline**: 
- **Evidence**: 
- **Impact (CIA Triad)**: 
- **Actions Taken (Containment & Recovery)**: 
- **Root Cause & Contributing Factors**: 
- **Recommendations**: 
- **Lessons Learned**: 
`;
    } else {
      tpl = `\n\n\`\`\`bash
# Citadel Sandbox Check
pwd
ls -la
cat notes.txt
\`\`\`\n`;
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

  const handleExecuteSnippet = async (snippet: {
    id: string;
    title: string;
    language: SnippetLanguage;
    code: string;
  }) => {
    if (!snippet.code.trim() || runningSnippetId) return;
    setRunningSnippetId(snippet.id);

    try {
      const result = await executeNotebookSnippet(terminalStateRef.current, {
        code: snippet.code,
        language: snippet.language,
      });

      terminalStateRef.current = result.nextState;
      setShellCwd(result.cwd);

      execSeqRef.current += 1;
      const record: NotebookExecutionRecord = {
        id: execSeqRef.current,
        snippetId: snippet.id,
        title: snippet.title,
        language: snippet.language,
        transcript: result.transcript,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        cwd: result.cwd,
        commandsExecuted: result.commandsExecuted,
        engineMode: result.engineMode,
      };

      setPerSnippetOutputs((prev) => ({
        ...prev,
        [snippet.id]: record,
      }));
      setActiveOutputSnippetId(snippet.id);
    } finally {
      setRunningSnippetId(null);
    }
  };

  const handleSaveNewSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveSnippet || !newCode.trim()) return;
    onSaveSnippet({
      title: newTitle.trim() || `${newLanguage.toUpperCase()} Notebook Snippet`,
      language: newLanguage,
      code: newCode,
      tags: ['notebook', activeStageId],
    });
    setNewTitle('');
    setNewCode(
      newLanguage === 'bash'
        ? 'ls -la\ncat readme'
        : newLanguage === 'python'
        ? 'print("Hello from Notebook Sandbox")'
        : '#include <stdio.h>\nint main(void) { printf("Hello from C11\\n"); return 0; }'
    );
    setShowNewSnippetForm(false);
  };

  const handleResetNotebookShell = () => {
    terminalStateRef.current = createInitialTerminalState();
    setShellCwd(formatTerminalCwd(terminalStateRef.current.currentPath));
    setPerSnippetOutputs({});
    setActiveOutputSnippetId(null);
  };

  const handleCopyTranscript = async (record: NotebookExecutionRecord) => {
    const plainText = record.transcript.map((line) => line.text).join('\n');
    try {
      await navigator.clipboard.writeText(plainText);
      setCopiedOutputId(record.snippetId);
      setTimeout(() => setCopiedOutputId(null), 1800);
    } catch {
      // Clipboard blocked in restricted context
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="optical-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-400 mb-1">
            <span>Student Notebook &amp; Local Persistence</span>
            <span>·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{saveStatus}</span>
          </div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white tracking-tight [text-wrap:balance]">
            Personal Study Journal &amp; Lab Reports
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Write notes in your own words, save code snippets, and execute commands directly through the Citadel terminal engine.
          </p>
        </div>

        {/* Cloud & Backup Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onDownloadMasteryPdf && (
            <button
              type="button"
              onClick={onDownloadMasteryPdf}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/35 dark:border-emerald-400/30 bg-emerald-500/12 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-200 hover:bg-emerald-500/20 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileDown className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Mastery PDF</span>
            </button>
          )}

          {onOpenGitHubSync && (
            <button
              type="button"
              onClick={onOpenGitHubSync}
              className="flex items-center gap-1.5 rounded-xl border border-sky-500/35 dark:border-sky-400/30 bg-sky-500/12 px-3 py-2 text-xs font-medium text-sky-700 dark:text-sky-200 hover:bg-sky-500/20 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <FolderGit2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>GitHub Sync</span>
            </button>
          )}

          <button
            onClick={onExportBackup}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#040710]/80 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#040710]/80 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Upload className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span>Import JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />

          <SoapBubbleButton
            onClick={handleDownloadMarkdown}
            tint="rgb(56 189 248)"
            opacity={0.92}
            style={{ fontSize: 12 }}
            className="!min-h-[34px] !px-4 font-semibold text-white whitespace-nowrap shrink-0"
          >
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span>Export .md</span>
            </span>
          </SoapBubbleButton>
        </div>
      </div>

      {importStatus && (
        <div className="optical-panel rounded-xl border-cyan-500/35 dark:border-cyan-400/35 bg-cyan-500/10 p-3 text-xs text-cyan-800 dark:text-cyan-200 font-mono">
          {importStatus}
        </div>
      )}

      {/* Stage Selector */}
      <div className="optical-subnav flex gap-1 p-1 rounded-xl overflow-x-auto no-scrollbar">
        {STAGES_DATA.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveStageId(s.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap shrink-0 transition-colors cursor-pointer border ${
              activeStageId === s.id
                ? 'bg-cyan-500/15 dark:bg-cyan-500/18 border-cyan-500/35 dark:border-cyan-400/35 text-cyan-700 dark:text-cyan-200 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Stage {s.number}
          </button>
        ))}
      </div>

      {/* Editor & Templates Toolbar */}
      <div className="optical-panel rounded-2xl overflow-hidden">
        <div className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#040710]/65 p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">
              {STAGES_DATA.find((s) => s.id === activeStageId)?.title}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
              Insert Template:
            </span>
            <button
              type="button"
              onClick={() => insertTemplate('weekly')}
              className="px-2.5 py-1 text-[11px] rounded-lg border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.09] transition-colors cursor-pointer"
            >
              + Weekly Review
            </button>
            <button
              type="button"
              onClick={() => insertTemplate('lab')}
              className="px-2.5 py-1 text-[11px] rounded-lg border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.09] transition-colors cursor-pointer"
            >
              + 10-Step Lab
            </button>
            <button
              type="button"
              onClick={() => insertTemplate('incident')}
              className="px-2.5 py-1 text-[11px] rounded-lg border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.09] transition-colors cursor-pointer"
            >
              + Incident Report
            </button>
            <button
              type="button"
              onClick={() => insertTemplate('snippet')}
              className="px-2.5 py-1 text-[11px] rounded-lg border border-emerald-500/35 dark:border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 hover:bg-emerald-500/20 transition-colors cursor-pointer font-mono"
            >
              + Runnable Shell Block
            </button>

            <button
              type="button"
              onClick={() =>
                onOpenAiMentor(
                  `Review these study notes for ${STAGES_DATA.find((s) => s.id === activeStageId)?.title} and give me feedback on accuracy and suggestions:\n\n${currentNote}`
                )
              }
              className="flex items-center gap-1 px-3 py-1 text-[11px] rounded-lg bg-purple-500/12 dark:bg-purple-500/15 border border-purple-500/35 dark:border-purple-400/35 text-purple-700 dark:text-purple-200 hover:bg-purple-500/20 dark:hover:bg-purple-500/25 transition-colors cursor-pointer font-medium"
            >
              <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-300" />
              <span>Review Notes with AI</span>
            </button>
          </div>
        </div>

        {/* Textarea Workspace */}
        <textarea
          rows={18}
          value={currentNote}
          onChange={handleTextChange}
          placeholder="# Write your notes, fenced ```bash / ```python / ```c snippets, and reflections here..."
          className="w-full bg-white dark:bg-[#040710]/85 p-6 text-sm text-slate-900 dark:text-slate-200 focus:outline-none font-mono leading-relaxed resize-y placeholder:text-slate-400 dark:placeholder:text-slate-600"
        />
      </div>

      {/* Saved Snippets & Terminal Simulator Execution Panel */}
      <div className="optical-panel rounded-2xl overflow-hidden">
        <div className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#040710]/65 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
              <Terminal className="h-3.5 w-3.5" />
              <span>Saved Snippets &amp; Terminal Runner</span>
              <span>·</span>
              <span className="text-slate-600 dark:text-slate-400 normal-case tracking-normal tabular-nums">
                {combinedSnippets.length} snippet{combinedSnippets.length === 1 ? '' : 's'} · cwd:{' '}
                <code className="text-cyan-700 dark:text-cyan-300">{shellCwd}</code>
              </span>
            </div>
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mt-0.5">
              Executable Code &amp; Command Snippets
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onSaveSnippet && (
              <button
                type="button"
                onClick={() => setShowNewSnippetForm((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/35 dark:border-cyan-400/35 bg-cyan-500/12 px-3 py-1.5 text-xs font-semibold text-cyan-800 dark:text-cyan-200 hover:bg-cyan-500/20 transition-colors cursor-pointer"
              >
                {showNewSnippetForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                <span>{showNewSnippetForm ? 'Cancel' : 'New Snippet'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleResetNotebookShell}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] px-3 py-1.5 text-xs font-mono text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Reset notebook terminal virtual filesystem and working directory"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span>Reset Shell</span>
            </button>
          </div>
        </div>

        {/* Inline New Snippet Composer */}
        {showNewSnippetForm && onSaveSnippet && (
          <form
            onSubmit={handleSaveNewSnippet}
            className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-100/75 dark:bg-white/[0.02] p-5 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                  Snippet Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Bandit Level 0 Discovery Commands"
                  className="w-full rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#040710]/90 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                  Runtime
                </label>
                <select
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value as SnippetLanguage)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#040710]/90 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                >
                  <option value="bash">Bash (Virtual Terminal)</option>
                  <option value="python">Python 3 (Sandbox)</option>
                  <option value="c">C11 / GCC (Sandbox)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                Code or Shell Commands
              </label>
              <textarea
                rows={4}
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="ls -la&#10;cat readme"
                className="w-full rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#040710]/90 p-3 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save to Notebook</span>
              </button>
            </div>
          </form>
        )}

        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Snippet Cards */}
          <div className="lg:col-span-6 space-y-3">
            {combinedSnippets.length === 0 ? (
              <div className="optical-inset rounded-xl p-6 text-center space-y-2.5">
                <Terminal className="h-6 w-6 text-cyan-600 dark:text-cyan-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  No saved or markdown snippets in this view yet
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                  Click <span className="font-mono font-semibold">New Snippet</span> above, save snippets from the Code Playground, or add a fenced{' '}
                  <code className="font-mono text-cyan-700 dark:text-cyan-300">```bash</code> block inside your stage notes.
                </p>
              </div>
            ) : (
              combinedSnippets.map((snip) => {
                const isRunning = runningSnippetId === snip.id;
                const snippetOutput = perSnippetOutputs[snip.id];
                const isSelectedOutput = activeOutputSnippetId === snip.id;

                return (
                  <div
                    key={snip.id}
                    className={`rounded-xl border transition-colors overflow-hidden ${
                      isSelectedOutput
                        ? 'border-cyan-500/45 dark:border-cyan-400/45 bg-slate-50/90 dark:bg-[#060c18]'
                        : 'border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#040710]/70'
                    }`}
                  >
                    <div className="px-3.5 py-2.5 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-semibold text-slate-900 dark:text-white truncate">
                          {snip.title}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5 tabular-nums">
                          <span className="uppercase font-semibold text-cyan-700 dark:text-cyan-300">
                            {snip.language}
                          </span>
                          <span>·</span>
                          <span>{snip.source === 'saved' ? 'Saved Snippet' : `Note line ${snip.lineNumber}`}</span>
                          <span>·</span>
                          <span>{snip.code.split(/\r?\n/).length} lines</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleExecuteSnippet(snip)}
                          disabled={Boolean(runningSnippetId)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                          title="Execute this snippet in the Terminal Simulator engine"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>{isRunning ? 'Running...' : 'Execute'}</span>
                        </button>

                        {snip.source === 'note' && onSaveSnippet && (
                          <button
                            type="button"
                            onClick={() =>
                              onSaveSnippet({
                                title: snip.title,
                                language: snip.language,
                                code: snip.code,
                                tags: ['notebook', activeStageId],
                              })
                            }
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                            title="Save note block to Saved Snippets"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {snip.language === 'bash' && onRunCommandInShell && (
                          <button
                            type="button"
                            onClick={() => {
                              const firstLine =
                                snip.code
                                  .split(/\r?\n/)
                                  .map((l) => l.trim())
                                  .find((l) => l && !l.startsWith('#')) || snip.code.trim();
                              onRunCommandInShell(firstLine);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                            title="Open command in full Shell tab"
                          >
                            <Terminal className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {snip.source === 'saved' && onDeleteSnippet && (
                          <button
                            type="button"
                            onClick={() => onDeleteSnippet(snip.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete saved snippet"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <pre className="p-3 text-[11px] font-mono text-slate-800 dark:text-slate-200 bg-slate-50/70 dark:bg-[#03060d] overflow-x-auto max-h-40 leading-relaxed">
                      {snip.code}
                    </pre>

                    {snippetOutput && (
                      <div className="border-t border-slate-200 dark:border-white/[0.08] bg-[#040710] px-3 py-2 flex items-center justify-between gap-2 text-[11px] font-mono">
                        <span
                          className={
                            snippetOutput.exitCode === 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }
                        >
                          exit {snippetOutput.exitCode} · {snippetOutput.commandsExecuted} cmd
                          {snippetOutput.commandsExecuted === 1 ? '' : 's'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveOutputSnippetId(snip.id)}
                          className="text-cyan-300 hover:text-cyan-200 underline-offset-2 hover:underline cursor-pointer"
                        >
                          {isSelectedOutput ? 'Viewing output' : 'Focus output'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Direct Notebook Terminal Output Console */}
          <div className="lg:col-span-6 rounded-xl border border-slate-800 dark:border-white/[0.1] bg-[#040710] text-slate-200 flex flex-col min-h-[280px] max-h-[520px] overflow-hidden font-mono shadow-lg">
            <div className="border-b border-white/[0.08] bg-[#060b16] px-4 py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 text-xs">
                <Terminal className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white truncate">
                  {activeOutputRecord
                    ? activeOutputRecord.title
                    : 'Notebook Terminal Engine Output'}
                </span>
                {activeOutputRecord && (
                  <span
                    className={`text-[10px] shrink-0 tabular-nums ${
                      activeOutputRecord.exitCode === 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    · exit {activeOutputRecord.exitCode}
                  </span>
                )}
              </div>

              {activeOutputRecord && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyTranscript(activeOutputRecord)}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.09] px-2 py-1 text-[10px] text-slate-300 cursor-pointer"
                  >
                    {copiedOutputId === activeOutputRecord.snippetId ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>Copy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = combinedSnippets.find(
                        (s) => s.id === activeOutputRecord.snippetId
                      );
                      if (target) handleExecuteSnippet(target);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-500/15 hover:bg-emerald-500/25 px-2 py-1 text-[10px] text-emerald-300 cursor-pointer"
                  >
                    <Play className="h-2.5 w-2.5 fill-current" />
                    <span>Re-run</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveOutputSnippetId(null)}
                    className="rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.09] px-2 py-1 text-[10px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 text-xs leading-relaxed">
              {!activeOutputRecord ? (
                <div className="h-full flex flex-col justify-center items-start text-slate-400 space-y-2 py-6">
                  <div className="text-cyan-300 font-semibold">
                    guest@odyssey-box:~{shellCwd === '/home/bandit0' ? '' : ` (${shellCwd})`}$ _
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Click <span className="text-emerald-300 font-semibold">Execute</span> on any saved snippet or markdown code block to run it through the Cyber Citadel terminal simulator engine and inspect its output right here.
                  </p>
                </div>
              ) : (
                <>
                  {activeOutputRecord.transcript.map((entry, idx) => (
                    <div
                      key={`${activeOutputRecord.id}-${idx}`}
                      className={`whitespace-pre-wrap break-words ${
                        entry.type === 'input'
                          ? 'text-cyan-300 font-semibold pt-1 first:pt-0'
                          : entry.isError
                          ? 'text-rose-400'
                          : entry.isSuccess
                          ? 'text-emerald-300'
                          : 'text-slate-200'
                      }`}
                    >
                      {entry.text}
                    </div>
                  ))}
                  <div className="pt-2 border-t border-white/[0.06] text-[10px] text-slate-500 flex items-center justify-between tabular-nums">
                    <span>
                      Engine:{' '}
                      {activeOutputRecord.engineMode === 'virtual-shell'
                        ? 'Citadel Virtual Terminal Simulator'
                        : 'Virtual FS + Code Sandbox'}
                    </span>
                    <span>cwd: {activeOutputRecord.cwd}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
