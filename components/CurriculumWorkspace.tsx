'use client';

import React, { useState } from 'react';
import { List, Network } from 'lucide-react';
import { StageExplorer } from './StageExplorer';
import { AdvancedHeroHub } from './AdvancedHeroHub';
import { ProjectsStudio } from './ProjectsStudio';
import { CurriculumExportHub } from './CurriculumExportHub';
import { CurriculumSkillGraph } from './CurriculumSkillGraph';

export type CurriculumSubTab = 'stages' | 'hero' | 'projects' | 'export';

interface CurriculumWorkspaceProps {
  activeSubTab: CurriculumSubTab;
  onChangeSubTab: (sub: CurriculumSubTab) => void;
  selectedStageId: string;
  onSelectStage: (stageId: string) => void;
  completedTopics: Record<string, boolean>;
  completedExitChecks: Record<string, boolean>;
  projectStatuses: Record<string, 'not_started' | 'in_progress' | 'completed'>;
  projectNotes: Record<string, string>;
  onToggleTopic: (topicId: string) => void;
  onToggleExitCheck: (checkKey: string) => void;
  onMarkStageComplete: (stageId: string, completed: boolean) => void;
  onAddMilestone: (
    title: string,
    category: 'basics' | 'algorithms' | 'systems' | 'bandit' | 'projects' | 'custom',
    targetDate?: string,
    stageId?: string,
    xpReward?: number
  ) => void;
  onUpdateProjectStatus: (projId: string, status: 'not_started' | 'in_progress' | 'completed') => void;
  onUpdateProjectNotes: (projId: string, notes: string) => void;
  onOpenAiMentor: (context?: string) => void;
  onOpenShell: () => void;
  onOpenNotes: (stageId: string) => void;
  onOpenPlayground: (language: 'python' | 'c', code: string) => void;
  onOpenLab: (labTab: 'foundations' | 'git') => void;
}

export function CurriculumWorkspace({
  activeSubTab,
  onChangeSubTab,
  selectedStageId,
  onSelectStage,
  completedTopics,
  completedExitChecks,
  projectStatuses,
  projectNotes,
  onToggleTopic,
  onToggleExitCheck,
  onMarkStageComplete,
  onAddMilestone,
  onUpdateProjectStatus,
  onUpdateProjectNotes,
  onOpenAiMentor,
  onOpenShell,
  onOpenNotes,
  onOpenPlayground,
  onOpenLab,
}: CurriculumWorkspaceProps) {
  const [stageViewMode, setStageViewMode] = useState<'handbook' | 'graph'>('handbook');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Sub-navigation optical header */}
      <div className="optical-panel rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-sky-400">
            Curriculum Architecture
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight [text-wrap:balance]">
            Curriculum &amp; Engineering Track
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            14-stage master path from foundations to compilers &amp; distributed systems, with visual dependency map and open-source export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeSubTab === 'stages' && (
            <div className="optical-subnav flex rounded-xl p-1 text-xs font-medium">
              <button
                onClick={() => setStageViewMode('handbook')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  stageViewMode === 'handbook'
                    ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>Handbook</span>
              </button>
              <button
                onClick={() => setStageViewMode('graph')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  stageViewMode === 'graph'
                    ? 'bg-white/10 text-sky-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Network className="h-3.5 w-3.5" />
                <span>Dependency Map</span>
              </button>
            </div>
          )}

          <div className="optical-subnav flex rounded-xl p-1 text-xs font-medium overflow-x-auto no-scrollbar">
            {[
              { id: 'stages', label: '14-Stage Handbook' },
              { id: 'hero', label: 'Systems Engineering (Hero)' },
              { id: 'projects', label: '14 Portfolio Projects' },
              { id: 'export', label: 'Open-Source Export' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onChangeSubTab(tab.id as CurriculumSubTab)}
                className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  activeSubTab === tab.id
                    ? 'bg-sky-500/20 text-white font-semibold ring-1 ring-sky-400/40 shadow-[0_0_16px_rgba(56,189,248,0.2)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeSubTab === 'stages' && (
        stageViewMode === 'graph' ? (
          <CurriculumSkillGraph
            completedTopics={completedTopics}
            currentStageId={selectedStageId}
            onOpenStage={(stageId) => {
              onSelectStage(stageId);
              setStageViewMode('handbook');
            }}
          />
        ) : (
          <StageExplorer
            selectedStageId={selectedStageId}
            onSelectStage={onSelectStage}
            completedTopics={completedTopics}
            completedExitChecks={completedExitChecks}
            onToggleTopic={onToggleTopic}
            onToggleExitCheck={onToggleExitCheck}
            onOpenAiMentor={onOpenAiMentor}
            onOpenShell={onOpenShell}
            onOpenNotes={onOpenNotes}
            onOpenPlayground={onOpenPlayground}
            onOpenLab={onOpenLab}
            onMarkStageComplete={onMarkStageComplete}
            onAddMilestone={onAddMilestone}
          />
        )
      )}

      {activeSubTab === 'hero' && (
        <AdvancedHeroHub
          onOpenAiMentor={onOpenAiMentor}
          onOpenPlaygroundWithCode={onOpenPlayground}
        />
      )}

      {activeSubTab === 'projects' && (
        <ProjectsStudio
          projectStatuses={projectStatuses}
          projectNotes={projectNotes}
          onUpdateStatus={onUpdateProjectStatus}
          onUpdateNotes={onUpdateProjectNotes}
          onOpenAiMentor={onOpenAiMentor}
          onOpenGitSandbox={() => onOpenLab('git')}
        />
      )}

      {activeSubTab === 'export' && <CurriculumExportHub />}
    </div>
  );
}
