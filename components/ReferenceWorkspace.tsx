'use client';

import React from 'react';
import { Terminal, BookOpen, Compass, FileText, Library, Layers } from 'lucide-react';
import { CommandVault } from '@/components/CommandVault';
import { NotebookView } from '@/components/NotebookView';
import { GlossaryFlashcards } from '@/components/GlossaryFlashcards';
import { DirectoryView } from '@/components/DirectoryView';
import { SourceLibraryView } from '@/components/SourceLibraryView';
import { CheatSheetsReferenceView } from '@/components/CheatSheetsReferenceView';

export type ReferenceSubTab =
  | 'sources'
  | 'commands'
  | 'cheatsheets'
  | 'notebook'
  | 'glossary'
  | 'directory';

interface ReferenceWorkspaceProps {
  activeSubTab: ReferenceSubTab;
  onSelectSubTab: (tab: ReferenceSubTab) => void;
  stageNotes: Record<string, string>;
  onUpdateStageNotes: (stageId: string, notes: string) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonStr: string) => boolean;
  onOpenAiMentor: (context?: string) => void;
  onRunCommandInShell?: (command: string) => void;
  onDownloadMasteryPdf?: () => void;
  onOpenGitHubSync?: () => void;
}

export function ReferenceWorkspace({
  activeSubTab,
  onSelectSubTab,
  stageNotes,
  onUpdateStageNotes,
  onExportBackup,
  onImportBackup,
  onOpenAiMentor,
  onRunCommandInShell,
  onDownloadMasteryPdf,
  onOpenGitHubSync,
}: ReferenceWorkspaceProps) {
  const tabs: Array<{
    id: ReferenceSubTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'sources', label: 'Source Library', icon: Library },
    { id: 'commands', label: 'Command Vault', icon: Terminal },
    { id: 'cheatsheets', label: 'Cheat Sheets & Matrices', icon: Layers },
    { id: 'notebook', label: 'Study Notebook', icon: FileText },
    { id: 'glossary', label: 'Glossary & Flashcards', icon: BookOpen },
    { id: 'directory', label: 'Field Directory & Certs', icon: Compass },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="optical-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-cyan-400">
            Sources, Cheat Sheets, Commands, Active Recall &amp; Study Logs
          </p>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5 [text-wrap:balance]">
            Reference Library
          </h1>
        </div>

        <div className="optical-subnav flex items-center gap-1 rounded-xl p-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectSubTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/18 text-cyan-200 border border-cyan-400/35'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeSubTab === 'sources' && <SourceLibraryView />}

      {activeSubTab === 'commands' && <CommandVault onOpenAiMentor={onOpenAiMentor} />}

      {activeSubTab === 'cheatsheets' && (
        <CheatSheetsReferenceView
          onOpenAiMentor={onOpenAiMentor}
          onOpenShell={onRunCommandInShell}
        />
      )}

      {activeSubTab === 'notebook' && (
        <NotebookView
          stageNotes={stageNotes}
          onUpdateStageNotes={onUpdateStageNotes}
          onExportBackup={onExportBackup}
          onImportBackup={onImportBackup}
          onOpenAiMentor={onOpenAiMentor}
          onDownloadMasteryPdf={onDownloadMasteryPdf}
          onOpenGitHubSync={onOpenGitHubSync}
        />
      )}

      {activeSubTab === 'glossary' && <GlossaryFlashcards onOpenAiMentor={onOpenAiMentor} />}

      {activeSubTab === 'directory' && <DirectoryView />}
    </div>
  );
}

