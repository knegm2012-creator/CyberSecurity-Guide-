'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Bell, Clock, Play, CheckCircle2, Settings, X } from 'lucide-react';
import { SoapBubbleButton } from '@/components/soap-bubble';
import { CATCH_UP_SESSION_MINUTES } from '@/lib/session-timer';

interface CatchUpNotificationBannerProps {
  hoursSinceLastOpen: number;
  daysAwayLabel: string;
  stageNumber: number;
  stageTitle: string;
  nextTopicTitle?: string;
  isPreview?: boolean;
  onStartCatchUp: () => void;
  onQuickLogFiveMinutes: () => void;
  onOpenSettings: () => void;
  onDismiss: () => void;
}

export function CatchUpNotificationBanner({
  hoursSinceLastOpen,
  daysAwayLabel,
  stageNumber,
  stageTitle,
  nextTopicTitle,
  isPreview = false,
  onStartCatchUp,
  onQuickLogFiveMinutes,
  onOpenSettings,
  onDismiss,
}: CatchUpNotificationBannerProps) {
  const awaySummary =
    hoursSinceLastOpen >= 48
      ? `It's been ${hoursSinceLastOpen} hours (${daysAwayLabel}) since your last visit.`
      : 'Previewing 48+ hour inactivity reminder.';

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4"
      role="status"
      aria-live="polite"
    >
      <div className="optical-panel rounded-2xl border border-amber-500/40 dark:border-amber-400/35 bg-gradient-to-r from-amber-50/90 via-white/95 to-sky-50/90 dark:from-amber-950/35 dark:via-[#060b16]/95 dark:to-sky-950/35 px-4 py-3.5 sm:px-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/35 bg-amber-500/15 text-amber-700 dark:text-amber-300">
              <Bell className="h-4 w-4" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                <span className="inline-flex items-center gap-1 font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  <Clock className="h-3 w-3" />
                  <span>{CATCH_UP_SESSION_MINUTES}-Minute Catch-Up Suggestion</span>
                </span>
                {isPreview && (
                  <span className="rounded border border-sky-500/35 bg-sky-500/12 px-1.5 py-0.5 text-[10px] text-sky-800 dark:text-sky-300 font-semibold">
                    Preview
                  </span>
                )}
                <span className="text-slate-600 dark:text-slate-400">{awaySummary}</span>
              </div>

              <div className="text-sm font-display font-bold text-slate-950 dark:text-white">
                Ease back in with a focused {CATCH_UP_SESSION_MINUTES}-minute Stage {stageNumber} sprint
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {nextTopicTitle ? (
                  <>
                    Pick up <span className="font-semibold text-slate-900 dark:text-white">&ldquo;{nextTopicTitle}&rdquo;</span> in Stage {stageNumber} ({stageTitle}) to rebuild momentum without overwhelm.
                  </>
                ) : (
                  <>
                    Run a quick {CATCH_UP_SESSION_MINUTES}-minute review in Stage {stageNumber} ({stageTitle}) to lock today&apos;s streak cleanly.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <SoapBubbleButton
              onClick={onStartCatchUp}
              tint="rgb(245 158 11)"
              opacity={0.94}
              style={{ fontSize: 12 }}
              className="!min-h-[34px] !px-4 font-semibold text-white whitespace-nowrap"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Start {CATCH_UP_SESSION_MINUTES}m Catch-Up</span>
            </SoapBubbleButton>

            <button
              type="button"
              onClick={onQuickLogFiveMinutes}
              className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-mono font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white cursor-pointer whitespace-nowrap"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Log +5m Review</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="optical-card inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer whitespace-nowrap"
              title="Open reminder settings"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label="Dismiss 5-minute catch-up suggestion"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
