'use client';

import React from 'react';
import { Timer, Pause, Play, RotateCcw, CheckCircle2, Focus, Minimize2, Sun, Moon } from 'lucide-react';
import type { PrimaryWorkspace } from './Navbar';
import {
  WORKSPACE_LABELS,
  formatSessionClock,
  computeLoggableMinutes,
  type AppTheme,
} from '@/lib/session-timer';

interface SessionTimerFooterBarProps {
  workspace: PrimaryWorkspace;
  elapsedSeconds: number;
  isPaused: boolean;
  isTabHidden: boolean;
  focusMode: boolean;
  autoPromptOnSwitch: boolean;
  theme?: AppTheme;
  onToggleTheme?: () => void;
  onTogglePause: () => void;
  onResetTimer: () => void;
  onOpenManualLog: () => void;
  onToggleFocusMode: () => void;
  onToggleAutoPrompt: () => void;
}

export function SessionTimerFooterBar({
  workspace,
  elapsedSeconds,
  isPaused,
  isTabHidden,
  focusMode,
  autoPromptOnSwitch,
  theme = 'light',
  onToggleTheme,
  onTogglePause,
  onResetTimer,
  onOpenManualLog,
  onToggleFocusMode,
  onToggleAutoPrompt,
}: SessionTimerFooterBarProps) {
  const activeMinutes = Math.floor(elapsedSeconds / 60);
  const loggableMinutes = computeLoggableMinutes(elapsedSeconds, true);
  const formattedClock = formatSessionClock(elapsedSeconds);
  const workspaceLabel = WORKSPACE_LABELS[workspace] || workspace;
  const isActivelyCounting = !isPaused && !isTabHidden;

  return (
    <div
      className="optical-inset rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono"
      aria-label="Workspace Session Timer"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <Timer
            className={`h-3.5 w-3.5 ${
              isActivelyCounting
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          />
          <span className="text-slate-500 dark:text-slate-400">Session Timer:</span>
          <span className="text-slate-950 dark:text-white font-semibold">{workspaceLabel}</span>
        </span>

        <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-sky-800 dark:text-sky-200 font-semibold tabular-nums">
          {formattedClock}
        </span>

        <span className="text-slate-600 dark:text-slate-400 tabular-nums">
          ({activeMinutes} min active)
        </span>

        {isPaused && (
          <span className="rounded border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-800 dark:text-amber-300 font-semibold">
            Paused
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="optical-card rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
          >
            {theme === 'light' ? (
              <>
                <Sun className="h-3 w-3 text-amber-600" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="h-3 w-3 text-sky-300" />
                <span>Dark</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onTogglePause}
          className="optical-card rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          title={isPaused ? 'Resume session timer' : 'Pause session timer'}
        >
          {isPaused ? (
            <>
              <Play className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <span>Resume</span>
            </>
          ) : (
            <>
              <Pause className="h-3 w-3 text-amber-600 dark:text-amber-300" />
              <span>Pause</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onResetTimer}
          disabled={elapsedSeconds === 0}
          className="optical-card rounded-lg px-2 py-1 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          title="Reset current workspace timer"
        >
          <RotateCcw className="h-3 w-3" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <button
          type="button"
          onClick={onOpenManualLog}
          className="rounded-lg border border-emerald-600/35 dark:border-emerald-400/35 bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-1 text-emerald-800 dark:text-emerald-200 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          title={`Log ${loggableMinutes}m study session now`}
        >
          <CheckCircle2 className="h-3 w-3 text-emerald-700 dark:text-emerald-300" />
          <span>Log {loggableMinutes}m</span>
        </button>

        <button
          type="button"
          onClick={onToggleAutoPrompt}
          className={`rounded-lg border px-2 py-1 text-[10px] cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            autoPromptOnSwitch
              ? 'border-sky-500/35 bg-sky-500/12 text-sky-800 dark:text-sky-300 font-medium'
              : 'border-slate-300 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Toggle automatic study log prompt when switching workspaces"
        >
          Auto-Prompt: {autoPromptOnSwitch ? 'ON' : 'OFF'}
        </button>

        <button
          type="button"
          onClick={onToggleFocusMode}
          className={`rounded-lg border px-2.5 py-1 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            focusMode
              ? 'border-fuchsia-500/45 bg-fuchsia-600 text-white dark:bg-fuchsia-500/20 dark:text-fuchsia-200'
              : 'border-indigo-500/35 bg-indigo-500/12 hover:bg-indigo-500/20 text-indigo-800 dark:text-indigo-200'
          }`}
          title="Toggle distraction-free Focus Mode (Ctrl+Shift+F)"
        >
          {focusMode ? (
            <>
              <Minimize2 className="h-3 w-3" />
              <span>Exit Focus</span>
            </>
          ) : (
            <>
              <Focus className="h-3 w-3" />
              <span>Focus Mode</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

