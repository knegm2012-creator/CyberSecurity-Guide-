'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOdysseyStore } from '@/hooks/use-odyssey-store';
import { Navbar, PrimaryWorkspace } from '@/components/Navbar';
import { OverviewWorkspace } from '@/components/OverviewWorkspace';
import { CurriculumWorkspace, CurriculumSubTab } from '@/components/CurriculumWorkspace';
import { SystemsLabWorkspace, SystemsLabTab } from '@/components/SystemsLabWorkspace';
import { ReferenceWorkspace, ReferenceSubTab } from '@/components/ReferenceWorkspace';
import { TerminalSimulator } from '@/components/TerminalSimulator';
import { AiMentorPanel } from '@/components/AiMentorPanel';
import { QuickQuizModal } from '@/components/QuickQuizModal';
import { CheatSheetModal } from '@/components/CheatSheetModal';
import { CommandPalette } from '@/components/CommandPalette';
import { SoapBubbleMaterial, SoapBubbleButton } from '@/components/soap-bubble';
import { STAGES_DATA } from '@/lib/curriculum-data';
import { Terminal, RotateCcw, AlertTriangle, X } from 'lucide-react';

export default function HomePage() {
  const appShellRef = useRef<HTMLDivElement>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<PrimaryWorkspace>('overview');
  const [curriculumTab, setCurriculumTab] = useState<CurriculumSubTab>('stages');
  const [labTab, setLabTab] = useState<SystemsLabTab>('playground');
  const [referenceTab, setReferenceTab] = useState<ReferenceSubTab>('commands');
  const [userSelectedStageId, setUserSelectedStageId] = useState<string | null>(null);

  const [aiMentorOpen, setAiMentorOpen] = useState(false);
  const [aiMentorPrompt, setAiMentorPrompt] = useState<string | undefined>(undefined);
  const [quickQuizOpen, setQuickQuizOpen] = useState(false);
  const [cheatSheetOpen, setCheatSheetOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const [playgroundKey, setPlaygroundKey] = useState(0);
  const [playgroundCode, setPlaygroundCode] = useState<string | undefined>(undefined);
  const [playgroundLang, setPlaygroundLang] = useState<'python' | 'c' | undefined>(undefined);

  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  }, []);

  const {
    data,
    isLoaded,
    stats,
    toggleTopic,
    markStageTopicsComplete,
    toggleExitCheck,
    toggleBanditLevel,
    saveBanditPassword,
    completeDailyChallenge,
    updateProjectStatus,
    updateProjectNotes,
    updateStageNotes,
    addStudyLog,
    addMilestone,
    toggleMilestone,
    deleteMilestone,
    setDailyGoalMinutes,
    saveCodeSnippet,
    deleteCodeSnippet,
    exportBackup,
    importBackup,
    resetAll,
  } = useOdysseyStore();

  const currentStageId = useMemo(() => {
    for (const stage of STAGES_DATA) {
      const allDone = stage.topics.every((t) => data.completedTopics[t.id]);
      if (!allDone) {
        return stage.id;
      }
    }
    return STAGES_DATA[STAGES_DATA.length - 1]?.id || 'stage-13';
  }, [data.completedTopics]);

  const effectiveSelectedStageId = userSelectedStageId ?? currentStageId;
  const todayDateKey = new Date().toISOString().split('T')[0];

  const handleOpenPlaygroundWithCode = (lang: 'python' | 'c', code: string) => {
    setPlaygroundLang(lang);
    setPlaygroundCode(code);
    setPlaygroundKey((prev) => prev + 1);
    setLabTab('playground');
    setActiveWorkspace('lab');
  };

  const handleOpenAiWithPrompt = (prompt?: string) => {
    setAiMentorPrompt(prompt);
    setAiMentorOpen(true);
  };

  const handleOpenNotes = () => {
    setReferenceTab('notebook');
    setActiveWorkspace('reference');
  };

  const handleNavigate = (workspace: PrimaryWorkspace, subTab?: string, stageId?: string) => {
    setActiveWorkspace(workspace);

    if (workspace === 'curriculum') {
      if (subTab === 'stages' || subTab === 'hero' || subTab === 'projects' || subTab === 'export') {
        setCurriculumTab(subTab);
      }
      if (stageId) {
        setUserSelectedStageId(stageId);
      }
    } else if (workspace === 'lab') {
      if (
        subTab === 'playground' ||
        subTab === 'visualizer' ||
        subTab === 'foundations' ||
        subTab === 'git' ||
        subTab === 'memory' ||
        subTab === 'packet' ||
        subTab === 'complexity' ||
        subTab === 'studio'
      ) {
        setLabTab(subTab);
      }
    } else if (workspace === 'reference') {
      if (
        subTab === 'sources' ||
        subTab === 'commands' ||
        subTab === 'notebook' ||
        subTab === 'glossary' ||
        subTab === 'directory'
      ) {
        setReferenceTab(subTab);
      }
    }
  };

  const handleConfirmReset = () => {
    resetAll();
    setUserSelectedStageId(null);
    setResetConfirmOpen(false);
    setActiveWorkspace('overview');
  };

  if (!isLoaded) {
    return (
      <div className="optical-canvas flex h-screen items-center justify-center text-slate-300 font-mono text-xs">
        <div className="optical-panel flex items-center gap-3 rounded-xl px-5 py-3">
          <Terminal className="h-4 w-4 text-sky-400" />
          <span>Initializing CS Odyssey Optical Workbench...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={appShellRef}
      data-theme="dark"
      className="optical-canvas min-h-screen text-slate-100 flex flex-col font-sans"
    >
      <SoapBubbleMaterial
        backdrop={appShellRef}
        glass={0.95}
        iridescence={2}
        filmScale={4.85}
        oilOpacity={1}
        oilCoverage={1}
        oilEdge={18}
        oilEdgeFade={1}
        clearCenter={0.73}
        thickness={480}
        drainage={0.35}
        swirl={0.5}
        reflectivity={1.3}
        refraction={0.15}
        dispersion={1}
        bevel={14}
      >
        <Navbar
          activeWorkspace={activeWorkspace}
          setActiveWorkspace={setActiveWorkspace}
          openAiMentor={() =>
            handleOpenAiWithPrompt(
              'Give me a focused breakdown of what I should study next based on my current stage.'
            )
          }
        />

        <main className="flex-1 pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeWorkspace}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeWorkspace === 'overview' && (
                <OverviewWorkspace
                  stats={stats}
                  currentStageId={currentStageId}
                  completedTopics={data.completedTopics}
                  userMilestones={data.userMilestones || []}
                  studyLogs={data.studyLogs}
                  isDailyChallengeCompleted={Boolean(data.completedDailyChallenges?.[todayDateKey])}
                  onCompleteDailyChallenge={completeDailyChallenge}
                  onToggleMilestone={toggleMilestone}
                  onAddMilestone={addMilestone}
                  onDeleteMilestone={deleteMilestone}
                  onSetDailyGoal={setDailyGoalMinutes}
                  onLogStudy={(minutes, stageId, notes) => addStudyLog(minutes, stageId, notes)}
                  onNavigate={handleNavigate}
                  onOpenAiMentor={handleOpenAiWithPrompt}
                  onOpenQuickQuiz={() => setQuickQuizOpen(true)}
                  onOpenCheatSheet={() => setCheatSheetOpen(true)}
                  onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                />
              )}

              {activeWorkspace === 'curriculum' && (
                <CurriculumWorkspace
                  activeSubTab={curriculumTab}
                  onChangeSubTab={setCurriculumTab}
                  selectedStageId={effectiveSelectedStageId}
                  onSelectStage={(stageId) => setUserSelectedStageId(stageId)}
                  completedTopics={data.completedTopics}
                  completedExitChecks={data.completedExitChecks}
                  projectStatuses={data.projectStatuses}
                  projectNotes={data.projectNotes}
                  onToggleTopic={toggleTopic}
                  onToggleExitCheck={toggleExitCheck}
                  onMarkStageComplete={markStageTopicsComplete}
                  onAddMilestone={addMilestone}
                  onUpdateProjectStatus={updateProjectStatus}
                  onUpdateProjectNotes={updateProjectNotes}
                  onOpenAiMentor={handleOpenAiWithPrompt}
                  onOpenShell={() => setActiveWorkspace('shell')}
                  onOpenNotes={handleOpenNotes}
                  onOpenPlayground={handleOpenPlaygroundWithCode}
                  onOpenLab={(tab) => {
                    setLabTab(tab);
                    setActiveWorkspace('lab');
                  }}
                />
              )}

              {activeWorkspace === 'lab' && (
                <SystemsLabWorkspace
                  activeLab={labTab}
                  onSelectLab={setLabTab}
                  playgroundKey={playgroundKey}
                  initialLanguage={playgroundLang}
                  initialCode={playgroundCode}
                  savedSnippets={data.savedSnippets}
                  onSaveSnippet={saveCodeSnippet}
                  onDeleteSnippet={deleteCodeSnippet}
                  onAwardXp={(xp) =>
                    addStudyLog(15, currentStageId, `Completed Systems Lab drill (+${xp} XP)`)
                  }
                  onNavigateToProjects={() => handleNavigate('curriculum', 'projects')}
                  onNavigateToStage={() => handleNavigate('curriculum', 'stages', currentStageId)}
                  onNavigateToShell={() => handleNavigate('shell')}
                  onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                  onOpenAiMentor={handleOpenAiWithPrompt}
                />
              )}

              {activeWorkspace === 'shell' && (
                <TerminalSimulator
                  isActive={activeWorkspace === 'shell'}
                  solvedLevels={data.solvedBanditLevels}
                  banditPasswords={data.banditPasswords}
                  onSaveBanditPassword={saveBanditPassword}
                  onToggleLevel={toggleBanditLevel}
                  onOpenAiMentor={handleOpenAiWithPrompt}
                />
              )}

              {activeWorkspace === 'reference' && (
                <ReferenceWorkspace
                  activeSubTab={referenceTab}
                  onSelectSubTab={setReferenceTab}
                  stageNotes={data.stageNotes}
                  onUpdateStageNotes={updateStageNotes}
                  onExportBackup={exportBackup}
                  onImportBackup={importBackup}
                  onOpenAiMentor={handleOpenAiWithPrompt}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <QuickQuizModal
          isOpen={quickQuizOpen}
          onClose={() => setQuickQuizOpen(false)}
          currentStageId={currentStageId}
          onAwardXp={() => {
            addStudyLog(15, currentStageId, `Passed Quick Quiz on ${currentStageId}`);
          }}
          onOpenAiMentor={handleOpenAiWithPrompt}
        />

        <AiMentorPanel
          isOpen={aiMentorOpen}
          onClose={() => setAiMentorOpen(false)}
          initialPrompt={aiMentorPrompt}
        />

        <CheatSheetModal
          isOpen={cheatSheetOpen}
          onClose={() => setCheatSheetOpen(false)}
          onInsertCommand={() => {
            setCheatSheetOpen(false);
            setActiveWorkspace('shell');
          }}
        />

        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onNavigate={handleNavigate}
          onOpenAiMentor={handleOpenAiWithPrompt}
          onOpenQuickQuiz={() => setQuickQuizOpen(true)}
          onOpenCheatSheet={() => setCheatSheetOpen(true)}
        />

        {resetConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020409]/80 p-4 backdrop-blur-md">
            <div className="optical-panel w-full max-w-md rounded-2xl p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-display text-sm font-semibold text-white">
                      Reset Local Progress?
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      This clears all completed topics, notes, milestones, snippets, and wargame flags from this browser.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setResetConfirmOpen(false)}
                  className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  aria-label="Close confirmation dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="optical-inset rounded-xl p-3 text-xs text-slate-400">
                Consider exporting a JSON backup before resetting so you can restore your progress later.
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setResetConfirmOpen(false)}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:border-white/20 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <SoapBubbleButton
                  onClick={handleConfirmReset}
                  tint="rgb(244 63 94)"
                  opacity={0.9}
                  style={{ fontSize: 12 }}
                  className="!min-h-[34px] !px-4 text-xs font-semibold text-rose-100"
                >
                  Reset All Data
                </SoapBubbleButton>
              </div>
            </div>
          </div>
        )}

        <footer className="border-t border-white/[0.08] bg-[#03050b]/85 backdrop-blur-xl py-7 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display font-semibold text-slate-200">CS Odyssey</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Zero to Hero Computer Science Workbench</span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-400 font-mono">Local-First Storage</span>
            </div>

            <div className="flex items-center gap-4 font-mono text-[11px]">
              <button
                onClick={exportBackup}
                className="text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
              >
                Export JSON Backup
              </button>
              <span className="text-slate-700">·</span>
              <button
                onClick={() => setResetConfirmOpen(true)}
                className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Data</span>
              </button>
            </div>
          </div>
        </footer>
      </SoapBubbleMaterial>
    </div>
  );
}
