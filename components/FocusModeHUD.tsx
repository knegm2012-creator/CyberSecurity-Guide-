'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Focus, Pause, Play, CheckCircle2, Minimize2, Sparkles, Volume2, VolumeX } from 'lucide-react';
import type { PrimaryWorkspace } from './Navbar';
import {
  WORKSPACE_LABELS,
  FOCUS_PRESET_TARGETS,
  formatSessionClock,
  computeLoggableMinutes,
  type FocusTargetMinutes,
} from '@/lib/session-timer';

interface FocusModeHUDProps {
  workspace: PrimaryWorkspace;
  elapsedSeconds: number;
  isPaused: boolean;
  focusTargetMinutes: FocusTargetMinutes;
  chimeMuted?: boolean;
  onToggleChimeMute?: () => void;
  onSelectTargetMinutes: (mins: FocusTargetMinutes) => void;
  onTogglePause: () => void;
  onLogNow: () => void;
  onExitFocusMode: () => void;
}

export function FocusModeHUD({
  workspace,
  elapsedSeconds,
  isPaused,
  focusTargetMinutes,
  chimeMuted = false,
  onToggleChimeMute,
  onSelectTargetMinutes,
  onTogglePause,
  onLogNow,
  onExitFocusMode,
}: FocusModeHUDProps) {
  const workspaceLabel = WORKSPACE_LABELS[workspace] || workspace;
  const formattedClock = formatSessionClock(elapsedSeconds);
  const loggableMinutes = computeLoggableMinutes(elapsedSeconds, true);

  const targetSeconds = focusTargetMinutes > 0 ? focusTargetMinutes * 60 : 0;
  const remainingSeconds = targetSeconds > 0 ? Math.max(0, targetSeconds - elapsedSeconds) : 0;
  const targetCompleted = targetSeconds > 0 && elapsedSeconds >= targetSeconds;
  const progressPct =
    targetSeconds > 0 ? Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-3 z-40 mx-auto w-full max-w-4xl px-4 pt-3"
    >
      <div className="optical-panel rounded-2xl border border-indigo-500/35 bg-white/95 dark:bg-[#040711]/94 px-4 py-2.5 shadow-xl space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Focus Indicator + Live Clock */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-500/35 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                <Focus className="h-3.5 w-3.5" />
              </span>
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-indigo-700 dark:text-indigo-300 font-semibold">
                  Deep Focus Mode
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">{workspaceLabel}</div>
              </div>
            </div>

            <div className="h-5 w-px bg-slate-200 dark:bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-2 font-mono">
              <span className="rounded-lg border border-sky-500/35 bg-sky-500/10 px-2.5 py-1 text-sm font-bold text-sky-800 dark:text-sky-200 tabular-nums">
                {formattedClock}
              </span>
              {targetSeconds > 0 && (
                <span
                  className={`text-[11px] tabular-nums inline-flex items-center gap-1 ${
                    targetCompleted
                      ? 'text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {targetCompleted ? (
                    <>
                      <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{focusTargetMinutes}m goal reached!</span>
                    </>
                  ) : (
                    <span>{formatSessionClock(remainingSeconds)} left</span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Right: Target Presets & Controls */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
            <div className="optical-inset flex items-center rounded-lg p-0.5">
              {FOCUS_PRESET_TARGETS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onSelectTargetMinutes(mins)}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                    focusTargetMinutes === mins
                      ? 'bg-indigo-600 text-white dark:bg-indigo-500/35 dark:text-indigo-100 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
                  }`}
                >
                  {mins === 0 ? 'Free' : `${mins}m`}
                </button>
              ))}
            </div>

            {onToggleChimeMute && (
              <button
                type="button"
                onClick={onToggleChimeMute}
                className="optical-card rounded-lg p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer shrink-0"
                title={chimeMuted ? 'Enable completion chime' : 'Mute completion chime'}
                aria-label={chimeMuted ? 'Enable completion chime' : 'Mute completion chime'}
              >
                {chimeMuted ? (
                  <VolumeX className="h-3.5 w-3.5 text-slate-500" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onTogglePause}
              className="optical-card rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
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
              onClick={onLogNow}
              className="rounded-lg border border-emerald-600/35 dark:border-emerald-400/35 bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-1 text-emerald-800 dark:text-emerald-200 font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-700 dark:text-emerald-300" />
              <span>Log {loggableMinutes}m</span>
            </button>

            <button
              type="button"
              onClick={onExitFocusMode}
              className="rounded-lg border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] px-2.5 py-1 text-slate-800 dark:text-slate-200 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              title="Exit Focus Mode (Esc)"
            >
              <Minimize2 className="h-3 w-3" />
              <span>Exit Focus</span>
            </button>
          </div>
        </div>

        {targetSeconds > 0 && (
          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                targetCompleted
                  ? 'bg-gradient-to-r from-emerald-500 to-sky-500'
                  : 'bg-gradient-to-r from-indigo-500 to-sky-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

