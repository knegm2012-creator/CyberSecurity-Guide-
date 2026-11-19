'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Timer, ArrowRight, CheckCircle2, X, BookOpen } from 'lucide-react';
import { STAGES_DATA } from '@/lib/curriculum-data';
import { SoapBubbleButton } from '@/components/soap-bubble';
import type { PrimaryWorkspace } from './Navbar';
import {
  WORKSPACE_LABELS,
  formatSessionClock,
  computeLoggableMinutes,
  buildDefaultSessionNote,
} from '@/lib/session-timer';

export interface PendingSessionPrompt {
  fromWorkspace: PrimaryWorkspace;
  toWorkspace: PrimaryWorkspace;
  elapsedSeconds: number;
  isManual?: boolean;
  focusModeActive?: boolean;
}

interface WorkspaceSwitchPromptModalProps {
  prompt: PendingSessionPrompt;
  defaultStageId: string;
  onConfirmLog: (minutes: number, stageId: string, notes: string) => void;
  onSkip: () => void;
  onDisableAutoPrompt: () => void;
}

export function WorkspaceSwitchPromptModal({
  prompt,
  defaultStageId,
  onConfirmLog,
  onSkip,
  onDisableAutoPrompt,
}: WorkspaceSwitchPromptModalProps) {
  const suggestedMinutes = computeLoggableMinutes(prompt.elapsedSeconds, true);
  const [minutes, setMinutes] = useState<number>(suggestedMinutes);
  const [stageId, setStageId] = useState<string>(defaultStageId);
  const [notes, setNotes] = useState<string>(() =>
    buildDefaultSessionNote(prompt.fromWorkspace, prompt.elapsedSeconds, prompt.focusModeActive)
  );
  const [muteAutoPrompt, setMuteAutoPrompt] = useState<boolean>(false);

  const fromLabel = WORKSPACE_LABELS[prompt.fromWorkspace] || prompt.fromWorkspace;
  const toLabel = WORKSPACE_LABELS[prompt.toWorkspace] || prompt.toWorkspace;
  const xpEarned = Math.max(5, Math.floor(minutes / 30) * 25 || Math.round((minutes / 30) * 25));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (muteAutoPrompt) {
      onDisableAutoPrompt();
    }
    const cleanMins = Math.max(1, Math.min(240, Math.floor(Number(minutes) || 1)));
    const cleanNotes =
      notes.trim() ||
      buildDefaultSessionNote(prompt.fromWorkspace, cleanMins * 60, prompt.focusModeActive);
    onConfirmLog(cleanMins, stageId, cleanNotes);
  };

  const handleSkip = () => {
    if (muteAutoPrompt) {
      onDisableAutoPrompt();
    }
    onSkip();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 dark:bg-[#020409]/88 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-switch-prompt-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="optical-panel w-full max-w-md rounded-2xl p-6 space-y-4 border border-sky-500/30 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-white/[0.08] pb-3.5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 border border-sky-500/35 text-sky-700 dark:text-sky-300 shrink-0">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="session-switch-prompt-title"
                className="font-display text-base font-semibold text-slate-900 dark:text-white"
              >
                {prompt.isManual ? 'Log Active Study Session' : 'Log Workspace Study Session?'}
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-0.5 flex-wrap">
                <span className="text-sky-700 dark:text-sky-300 font-semibold">{fromLabel}</span>
                {!prompt.isManual && prompt.fromWorkspace !== prompt.toWorkspace && (
                  <>
                    <ArrowRight className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                    <span className="text-slate-800 dark:text-slate-300">{toLabel}</span>
                  </>
                )}
                <span>·</span>
                <span className="text-emerald-700 dark:text-emerald-300 tabular-nums font-medium">
                  {formatSessionClock(prompt.elapsedSeconds)} active
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            aria-label="Skip logging study session"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-slate-700 dark:text-slate-300">Active Minutes to Log</label>
              <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300 tabular-nums font-semibold">
                Est. +{xpEarned} XP
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {Array.from(new Set([suggestedMinutes, 15, 30, 45]))
                .slice(0, 4)
                .map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMinutes(preset)}
                    className={`py-1.5 font-mono rounded-lg border transition-colors cursor-pointer tabular-nums ${
                      minutes === preset
                        ? 'border-sky-500 bg-sky-500/15 text-sky-800 dark:text-sky-200 font-semibold'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04070e] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {preset}m
                  </button>
                ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">Custom:</span>
              <input
                type="number"
                min={1}
                max={240}
                value={minutes}
                onChange={(e) => setMinutes(Math.max(1, Math.min(240, Number(e.target.value) || 1)))}
                className="w-24 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#04070e] px-2.5 py-1 text-xs font-mono text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none tabular-nums"
              />
              <span className="text-[11px] font-mono text-slate-500">minutes</span>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <BookOpen className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>Curriculum Stage</span>
            </label>
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#04070e] px-3 py-2 text-slate-900 dark:text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              {STAGES_DATA.map((s) => (
                <option key={s.id} value={s.id}>
                  Stage {s.number}: {s.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">Session Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you build, debug, or master during this workspace session?"
              className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#04070e] p-2.5 text-slate-900 dark:text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {!prompt.isManual && (
            <label className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={muteAutoPrompt}
                onChange={(e) => setMuteAutoPrompt(e.target.checked)}
                className="rounded border-slate-300 dark:border-white/20 text-sky-600 focus:ring-0"
              />
              <span>Disable automatic switch prompts for this session</span>
            </label>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={handleSkip}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer"
            >
              {prompt.isManual ? 'Cancel' : 'Skip & Switch'}
            </button>

            <SoapBubbleButton
              type="submit"
              tint="rgb(16 185 129)"
              opacity={0.94}
              style={{ fontSize: 12 }}
              className="!min-h-[34px] !px-4 font-semibold text-white"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Save {minutes}m Session</span>
            </SoapBubbleButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

