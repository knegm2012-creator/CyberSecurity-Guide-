'use client';

import React, { useState, useMemo } from 'react';
import { useOdysseyStore } from '@/hooks/use-odyssey-store';
import { Navbar } from '@/components/Navbar';
import { MissionControl } from '@/components/MissionControl';
import { StageExplorer } from '@/components/StageExplorer';
import { TerminalSimulator } from '@/components/TerminalSimulator';
import { ConceptLabs } from '@/components/ConceptLabs';
import { ProjectsStudio } from '@/components/ProjectsStudio';
import { CommandVault } from '@/components/CommandVault';
import { DirectoryView } from '@/components/DirectoryView';
import { GlossaryFlashcards } from '@/components/GlossaryFlashcards';
import { NotebookView } from '@/components/NotebookView';
import { AiMentorPanel } from '@/components/AiMentorPanel';
import { QuickQuizModal } from '@/components/QuickQuizModal';
import { FoundationsStudio } from '@/components/FoundationsStudio';
import { GitSandbox } from '@/components/GitSandbox';
import { STAGES_DATA } from '@/lib/curriculum-data';
import { Terminal, RotateCcw } from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<string>('roadmap');
  const [aiMentorOpen, setAiMentorOpen] = useState(false);
  const [aiMentorPrompt, setAiMentorPrompt] = useState<string | undefined>(undefined);
  const [quickQuizOpen, setQuickQuizOpen] = useState(false);

  const {
    data,
    isLoaded,
    stats,
    toggleTopic,
    toggleExitCheck,
    toggleBanditLevel,
    saveBanditPassword,
    completeDailyChallenge,
    updateProjectStatus,
    updateProjectNotes,
    updateStageNotes,
    addStudyLog,
    exportBackup,
    importBackup,
    resetAll,
  } = useOdysseyStore();

  // Dynamically determine current active learning stage from store
  const currentStageId = useMemo(() => {
    for (const stage of STAGES_DATA) {
      const allDone = stage.topics.every((t) => data.completedTopics[t.id]);
      if (!allDone) {
        return stage.id;
      }
    }
    return 'stage-11';
  }, [data.completedTopics]);

  const handleOpenAiWithPrompt = (prompt?: string) => {
    setAiMentorPrompt(prompt);
    setAiMentorOpen(true);
  };

  const handleOpenNotes = (stageId: string) => {
    setActiveTab('notebook');
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 animate-spin text-cyan-400" />
          <span>Booting CS Odyssey Workstation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAiMentor={() => handleOpenAiWithPrompt('ELI9: Give me a quick motivating overview of what I should focus on next!')}
        openQuickQuiz={() => setQuickQuizOpen(true)}
        stats={{
          levelNumber: stats.levelNumber,
          heroTitle: stats.heroTitle,
          topicPercent: stats.topicPercent,
          currentStreak: stats.currentStreak,
        }}
      />

      {/* Hero & Executive Dashboard (Mission Control) */}
      <MissionControl
        stats={stats}
        currentStageId={currentStageId}
        onLogStudy={(minutes, stageId, notes) => addStudyLog(minutes, stageId, notes)}
        onOpenBandit={() => setActiveTab('bandit')}
        onOpenAiMentor={(prompt) => handleOpenAiWithPrompt(prompt)}
        onOpenQuickQuiz={() => setQuickQuizOpen(true)}
        onOpenFoundations={() => setActiveTab('foundations')}
        onOpenGitSandbox={() => setActiveTab('git')}
        onSelectStage={(stageId) => {
          setActiveTab('roadmap');
        }}
        onSelectTab={(tab) => setActiveTab(tab)}
        onCompleteDailyChallenge={(dateKey, xp, title, stageId) => completeDailyChallenge(dateKey, xp, title, stageId)}
        isDailyChallengeCompleted={Boolean(data.completedDailyChallenges?.[new Date().toISOString().split('T')[0]])}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {activeTab === 'roadmap' && (
          <StageExplorer
            completedTopics={data.completedTopics}
            completedExitChecks={data.completedExitChecks}
            onToggleTopic={toggleTopic}
            onToggleExitCheck={toggleExitCheck}
            onOpenAiMentor={handleOpenAiWithPrompt}
            onOpenBandit={() => setActiveTab('bandit')}
            onOpenNotes={handleOpenNotes}
          />
        )}

        {activeTab === 'foundations' && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <FoundationsStudio
              onOpenAiMentor={handleOpenAiWithPrompt}
              onAwardXp={(xp) => addStudyLog(15, 'stage-0', `Practiced math and binary tools (+${xp} XP)`)}
            />
          </div>
        )}

        {activeTab === 'git' && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <GitSandbox
              onOpenAiMentor={handleOpenAiWithPrompt}
              onNavigateToProjects={() => setActiveTab('projects')}
            />
          </div>
        )}

        {activeTab === 'bandit' && (
          <TerminalSimulator
            solvedLevels={data.solvedBanditLevels}
            banditPasswords={data.banditPasswords}
            onSaveBanditPassword={saveBanditPassword}
            onToggleLevel={toggleBanditLevel}
            onOpenAiMentor={handleOpenAiWithPrompt}
          />
        )}

        {activeTab === 'labs' && (
          <ConceptLabs onOpenAiMentor={handleOpenAiWithPrompt} />
        )}

        {activeTab === 'projects' && (
          <ProjectsStudio
            projectStatuses={data.projectStatuses}
            projectNotes={data.projectNotes}
            onUpdateStatus={updateProjectStatus}
            onUpdateNotes={updateProjectNotes}
            onOpenAiMentor={handleOpenAiWithPrompt}
            onOpenGitSandbox={() => setActiveTab('git')}
          />
        )}

        {activeTab === 'vault' && (
          <CommandVault onOpenAiMentor={handleOpenAiWithPrompt} />
        )}

        {activeTab === 'directory' && <DirectoryView />}

        {activeTab === 'glossary' && (
          <GlossaryFlashcards onOpenAiMentor={handleOpenAiWithPrompt} />
        )}

        {activeTab === 'notebook' && (
          <NotebookView
            stageNotes={data.stageNotes}
            onUpdateStageNotes={updateStageNotes}
            onExportBackup={exportBackup}
            onImportBackup={importBackup}
            onOpenAiMentor={handleOpenAiWithPrompt}
          />
        )}
      </main>

      {/* Dedicated Quick Quiz Modal */}
      <QuickQuizModal
        isOpen={quickQuizOpen}
        onClose={() => setQuickQuizOpen(false)}
        currentStageId={currentStageId}
        onAwardXp={(amount) => {
          addStudyLog(15, currentStageId, `Passed Quick Quiz on Stage ${currentStageId}!`);
        }}
        onOpenAiMentor={handleOpenAiWithPrompt}
      />

      {/* Embedded Slide-over AI Mentor */}
      <AiMentorPanel
        isOpen={aiMentorOpen}
        onClose={() => setAiMentorOpen(false)}
        initialPrompt={aiMentorPrompt}
      />

      {/* Quiet Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">CS Odyssey</span>
            <span>·</span>
            <span>Zero to College Student Handbook (October 2026 Edition)</span>
            <span>·</span>
            <span className="text-emerald-400 font-mono">100% Client-Side Privacy</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <button
              onClick={exportBackup}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Export JSON Backup
            </button>
            <span>·</span>
            <button
              onClick={resetAll}
              className="text-slate-600 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Data</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
