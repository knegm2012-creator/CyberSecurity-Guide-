'use client';

import React from 'react';
import { X, FolderGit2 } from 'lucide-react';
import { GitHubSyncPanel } from '@/components/GitHubSyncPanel';
import type { OdysseyStoreData } from '@/hooks/use-odyssey-store';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: OdysseyStoreData;
  stats: {
    completedTopicsCount: number;
    totalTopicsCount: number;
    completedProjectsCount: number;
    banditCount: number;
    totalMinutesLogged: number;
    xp: number;
    levelNumber: number;
    heroTitle: string;
    currentStreak: number;
  };
}

export function GitHubSyncModal({ isOpen, onClose, data, stats }: GitHubSyncModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03050b]/90"
      onClick={onClose}
    >
      <div
        className="optical-panel relative w-full max-w-2xl rounded-2xl border-white/[0.12] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Push Progress to GitHub"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-[#040710]/70">
          <div className="flex items-center gap-2 font-display text-sm font-semibold text-white">
            <FolderGit2 className="h-4 w-4 text-sky-400" />
            <span>GitHub Progress Cloud Sync</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
            aria-label="Close GitHub Sync Modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 max-h-[82vh] overflow-y-auto">
          <GitHubSyncPanel data={data} stats={stats} />
        </div>
      </div>
    </div>
  );
}
