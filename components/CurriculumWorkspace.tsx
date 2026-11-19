'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { List, Network, Compass } from 'lucide-react';
import { StageExplorer } from './StageExplorer';
import { AdvancedHeroHub } from './AdvancedHeroHub';
import { ProjectsStudio } from './ProjectsStudio';
import { CurriculumExportHub } from './CurriculumExportHub';
import { CurriculumSkillGraph } from './CurriculumSkillGraph';
import { CurriculumAtoZAtlas } from './CurriculumAtoZAtlas';
import type { OdysseyStoreData } from '@/hooks/use-odyssey-store';
import type { MasteryReportInput } from '@/lib/mastery-report-pdf';

const AdventureQuestMode = dynamic(
  () => import('./AdventureQuestMode').then((m) => m.AdventureQuestMode),
  {
    loading: () => (
      <div className="optical-panel rounded-2xl p-6 text-xs font-mono text-slate-600 dark:text-slate-300">
        Loading CS Adventure Campaign...
      </div>
    ),
  }
);

export type CurriculumSubTab = 'quest' | 'atlas' | 'stages' | 'hero' | 'projects' | 'export';

interface CurriculumWorkspaceProps {
  activeSubTab: CurriculumSubTab;
  onChangeSubTab: (sub: CurriculumSubTab) => void;
  selectedStageId: string;
  onSelectStage: (stageId: string) => void;
  completedTopics: Record<string, boolean>;
  completedExitChecks: Record<string, boolean>;
  projectStatuses: Record<string, 'not_started' | 'in_progress' | 'completed'>;
  projectNotes: Record<string, string>;
  stageTargetDates?: Record<string, string>;
  onToggleTopic: (topicId: string) => void;
  onCompleteTopicWithHabit?: (topicId: string, stageId: string, logMinutes?: number) => void;
  onSetStageTargetDate?: (stageId: string, targetDate: string) => void;
  onToggleExitCheck: (checkKey: string) => void;
  onMarkStageComplete: (stageId: string, completed: boolean) => void;
  onLogBossClear?: (minutes: number, stageId: string, notes: string) => void;
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
  onOpenLab: (labTab: 'foundations' | 'git' | 'visualizer') => void;
  exportData?: OdysseyStoreData;
  exportStats?: MasteryReportInput['stats'];
  onDownloadMasteryPdf?: () => void;
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
  stageTargetDates,
  onToggleTopic,
  onCompleteTopicWithHabit,
  onSetStageTargetDate,
  onToggleExitCheck,
  onMarkStageComplete,
  onLogBossClear,
  onAddMilestone,
  onUpdateProjectStatus,
  onUpdateProjectNotes,
  onOpenAiMentor,
  onOpenShell,
  onOpenNotes,
  onOpenPlayground,
  onOpenLab,
  exportData,
  exportStats,
  onDownloadMasteryPdf,
}: CurriculumWorkspaceProps) {
  const [stageViewMode, setStageViewMode] = useState<'handbook' | 'graph'>('handbook');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Sub-navigation optical header */}
      <div className="optical-panel rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-sky-600 dark:text-sky-400 font-semibold">
            Curriculum Architecture
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight [text-wrap:balance]">
            CS Adventure &amp; Engineering Track
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Self-contained 16-chapter Quest Campaign from zero prior CS knowledge to compilers, cloud SRE &amp; AI compute.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeSubTab === 'stages' && (
            <div className="optical-subnav flex rounded-xl p-1 text-xs font-medium">
              <button
                onClick={() => setStageViewMode('handbook')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  stageViewMode === 'handbook'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>Handbook</span>
              </button>
              <button
                onClick={() => setStageViewMode('graph')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  stageViewMode === 'graph'
                    ? 'bg-white text-sky-700 shadow-sm dark:bg-white/10 dark:text-sky-300 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Network className="h-3.5 w-3.5" />
                <span>Dependency Map</span>
              </button>
            </div>
          )}

          <div className="optical-subnav flex rounded-xl p-1 text-xs font-medium overflow-x-auto no-scrollbar">
            {[
              { id: 'quest', label: 'Adventure Quest' },
              { id: 'atlas', label: 'A–Z Master Atlas' },
              { id: 'stages', label: '16-Stage Handbook' },
              { id: 'hero', label: 'Systems Engineering (Hero)' },
              { id: 'projects', label: '16 Portfolio Projects' },
              { id: 'export', label: 'Open-Source Export' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onChangeSubTab(tab.id as CurriculumSubTab)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeSubTab === tab.id
                    ? 'bg-sky-500/15 text-sky-800 dark:bg-sky-500/20 dark:text-white font-semibold ring-1 ring-sky-500/40 dark:ring-sky-400/40 shadow-[0_0_14px_rgba(14,165,233,0.16)]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tab.id === 'quest' && <Compass className="h-3.5 w-3.5" />}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeSubTab === 'quest' && (
        <AdventureQuestMode
          selectedStageId={selectedStageId}
          onSelectStage={onSelectStage}
          completedTopics={completedTopics}
          completedExitChecks={completedExitChecks}
          onToggleTopic={onToggleTopic}
          onCompleteTopicWithHabit={onCompleteTopicWithHabit}
          onToggleExitCheck={onToggleExitCheck}
          onMarkStageComplete={onMarkStageComplete}
          onLogBossClear={onLogBossClear}
          onOpenPlayground={onOpenPlayground}
          onOpenShell={onOpenShell}
          onOpenVisualizer={() => onOpenLab('visualizer')}
          onOpenHandbook={(stageId) => {
            onSelectStage(stageId);
            setStageViewMode('handbook');
            onChangeSubTab('stages');
          }}
          onOpenAiMentor={onOpenAiMentor}
        />
      )}

      {activeSubTab === 'atlas' && (
        <CurriculumAtoZAtlas
          completedTopics={completedTopics}
          completedExitChecks={completedExitChecks}
          onSelectStageAndOpen={(stageId) => {
            onSelectStage(stageId);
            setStageViewMode('handbook');
            onChangeSubTab('stages');
          }}
          onCompleteTopicWithHabit={onCompleteTopicWithHabit}
          onToggleTopic={onToggleTopic}
          onOpenPlayground={onOpenPlayground}
          onOpenAiMentor={onOpenAiMentor}
        />
      )}

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
            stageTargetDates={stageTargetDates}
            onToggleTopic={onToggleTopic}
            onCompleteTopicWithHabit={onCompleteTopicWithHabit}
            onSetStageTargetDate={onSetStageTargetDate}
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

      {activeSubTab === 'export' && (
        <CurriculumExportHub
          data={exportData}
          stats={exportStats}
          onDownloadMasteryPdf={onDownloadMasteryPdf}
        />
      )}
    </div>
  );
}
