'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Bell,
  BellOff,
  Clock,
  Sparkles,
  CheckCircle2,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  X,
  Play,
  Shield,
  MessageSquare,
} from 'lucide-react';
import { SoapBubbleButton } from '@/components/soap-bubble';
import { CATCH_UP_SESSION_MINUTES, CATCH_UP_THRESHOLD_HOURS, type AppTheme } from '@/lib/session-timer';
import {
  formatQuotaResetCountdown,
  type MentorQuotaSnapshot,
} from '@/lib/mentor-quota';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  catchUpNotificationsEnabled: boolean;
  onToggleCatchUpNotifications: (enabled: boolean) => void;
  previousLastOpenedAt: string | null;
  onPreviewCatchUpNotification: () => void;
  dailyGoalMinutes: number;
  onSetDailyGoalMinutes: (mins: number) => void;
  autoLogTopicPractice: boolean;
  onSetAutoLogTopicPractice: (enabled: boolean) => void;
  autoPromptOnSwitch: boolean;
  onToggleAutoPromptOnSwitch: () => void;
  chimeMuted: boolean;
  onToggleChimeMute: () => void;
  theme: AppTheme;
  onToggleTheme: () => void;
  mentorCompanionEnabled: boolean;
  onToggleMentorCompanion: (enabled: boolean) => void;
  mentorDailyLimit: number;
  onSetMentorDailyLimit: (limit: number) => void;
  quotaSnapshot: MentorQuotaSnapshot | null;
}

export function SettingsModal({
  isOpen,
  onClose,
  catchUpNotificationsEnabled,
  onToggleCatchUpNotifications,
  previousLastOpenedAt,
  onPreviewCatchUpNotification,
  dailyGoalMinutes,
  onSetDailyGoalMinutes,
  autoLogTopicPractice,
  onSetAutoLogTopicPractice,
  autoPromptOnSwitch,
  onToggleAutoPromptOnSwitch,
  chimeMuted,
  onToggleChimeMute,
  theme,
  onToggleTheme,
  mentorCompanionEnabled,
  onToggleMentorCompanion,
  mentorDailyLimit,
  onSetMentorDailyLimit,
  quotaSnapshot,
}: SettingsModalProps) {
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      return 'unsupported';
    }
    return Notification.permission;
  });

  const [renderedAtMs, setRenderedAtMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!isOpen) return;
    const rafId = requestAnimationFrame(() => setRenderedAtMs(Date.now()));
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  const handleRequestBrowserNotifications = async () => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      setBrowserPerm('unsupported');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setBrowserPerm(result);
    } catch {
      // Ignore permission rejection in sandboxed iframes
    }
  };

  const formattedLastVisit = (() => {
    if (!previousLastOpenedAt) return 'First recorded session today';
    const ms = Date.parse(previousLastOpenedAt);
    if (Number.isNaN(ms)) return 'First recorded session today';
    const diffHours = Math.max(0, Math.floor((renderedAtMs - ms) / 3_600_000));
    const dateLabel = new Date(ms).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateLabel} (${diffHours}h ago)`;
  })();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 dark:bg-[#02040a]/90 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            className="optical-panel w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] px-6 py-4 bg-slate-50/80 dark:bg-[#050914]/90">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/12 text-sky-600 dark:text-sky-400">
                  <Settings className="h-4 w-4" />
                </div>
                <div>
                  <h2
                    id="settings-modal-title"
                    className="font-display text-sm font-bold text-slate-950 dark:text-white"
                  >
                    Workbench &amp; Notification Settings
                  </h2>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Study reminders, pacing goals, audio &amp; theme preferences
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                aria-label="Close settings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-6 py-5 space-y-5">
              {/* Primary Feature: 48-Hour 5-Minute Catch-Up Notification Toggle */}
              <div className="optical-inset rounded-xl p-4 space-y-3.5 border border-sky-500/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                        catchUpNotificationsEnabled
                          ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-300 dark:border-white/10 bg-slate-200/60 dark:bg-white/[0.04] text-slate-500'
                      }`}
                    >
                      {catchUpNotificationsEnabled ? (
                        <Bell className="h-4 w-4" />
                      ) : (
                        <BellOff className="h-4 w-4" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-950 dark:text-white">
                          48-Hour Catch-Up Study Reminder
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold ${
                            catchUpNotificationsEnabled
                              ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-200 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {catchUpNotificationsEnabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        When enabled, automatically suggests a friction-free{' '}
                        <strong className="text-slate-900 dark:text-slate-200">
                          {CATCH_UP_SESSION_MINUTES}-minute catch-up study session
                        </strong>{' '}
                        if you haven&apos;t opened CS Odyssey in over {CATCH_UP_THRESHOLD_HOURS} hours.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={catchUpNotificationsEnabled}
                    aria-label="Toggle 48-hour 5-minute catch-up study session notifications"
                    onClick={() => onToggleCatchUpNotifications(!catchUpNotificationsEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors cursor-pointer ${
                      catchUpNotificationsEnabled
                        ? 'border-emerald-500 bg-emerald-600 dark:bg-emerald-500'
                        : 'border-slate-300 dark:border-white/15 bg-slate-300 dark:bg-white/10'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        catchUpNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 dark:border-white/[0.06] pt-3 text-[11px] font-mono">
                  <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Previous visit: {formattedLastVisit}</span>
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {browserPerm === 'default' && catchUpNotificationsEnabled && (
                      <button
                        type="button"
                        onClick={handleRequestBrowserNotifications}
                        className="optical-card rounded-lg px-2.5 py-1 text-[10px] font-semibold text-sky-700 dark:text-sky-300 hover:text-slate-950 dark:hover:text-white cursor-pointer"
                      >
                        Allow Browser Alerts
                      </button>
                    )}
                    {browserPerm === 'granted' && catchUpNotificationsEnabled && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Browser alerts granted</span>
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={!catchUpNotificationsEnabled}
                      onClick={() => {
                        onPreviewCatchUpNotification();
                        onClose();
                      }}
                      className="optical-card inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-700 dark:hover:text-sky-300 disabled:opacity-40 cursor-pointer"
                      title="Simulate returning after >48 hours to test the 5-minute catch-up prompt"
                    >
                      <Play className="h-2.5 w-2.5 text-sky-600 dark:text-sky-400" />
                      <span>Preview 5m Catch-Up</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Mentor Partner & Request Limits */}
              <div className="optical-inset rounded-xl p-4 space-y-3.5 border border-sky-500/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                        mentorCompanionEnabled
                          ? 'border-sky-500/35 bg-sky-500/15 text-sky-700 dark:text-sky-300'
                          : 'border-slate-300 dark:border-white/10 bg-slate-200/60 dark:bg-white/[0.04] text-slate-500'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-950 dark:text-white">
                          Odyssey Buddy (Live Mentor Partner)
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold ${
                            mentorCompanionEnabled
                              ? 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-500/30'
                              : 'bg-slate-200 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {mentorCompanionEnabled ? 'VISIBLE' : 'HIDDEN'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Floating animated dot partner across every workspace with automatic request saving, smart cache hits, and live quota controls.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={mentorCompanionEnabled}
                    aria-label="Toggle Odyssey Buddy live mentor companion"
                    onClick={() => onToggleMentorCompanion(!mentorCompanionEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors cursor-pointer ${
                      mentorCompanionEnabled
                        ? 'border-sky-500 bg-sky-600 dark:bg-sky-500'
                        : 'border-slate-300 dark:border-white/15 bg-slate-300 dark:bg-white/10'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        mentorCompanionEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="border-t border-slate-200/80 dark:border-white/[0.06] pt-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                      <Shield className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                      <span>Daily AI Request Limit</span>
                    </span>
                    <div className="flex items-center gap-1 font-mono text-xs">
                      {[15, 30, 50, 100, 200].map((limitVal) => (
                        <button
                          key={limitVal}
                          type="button"
                          onClick={() => onSetMentorDailyLimit(limitVal)}
                          className={`px-2 py-1 rounded-lg transition-colors cursor-pointer tabular-nums ${
                            mentorDailyLimit === limitVal
                              ? 'bg-sky-600 text-white font-semibold'
                              : 'optical-card text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                          }`}
                        >
                          {limitVal}/d
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    <span>
                      Used today: {quotaSnapshot?.usedToday ?? 0}/{quotaSnapshot?.dailyLimit ?? mentorDailyLimit} · Burst buffer: {quotaSnapshot?.burstRemaining ?? 30}/{quotaSnapshot?.burstCapacity ?? 30}
                    </span>
                    <span>
                      Resets in {quotaSnapshot ? formatQuotaResetCountdown(quotaSnapshot.resetsAtIso, renderedAtMs) : '24h'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Study & Session Preferences */}
              <div className="space-y-3">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  Study &amp; Session Preferences
                </div>

                {/* Daily Study Goal */}
                <div className="optical-inset rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      Daily Study Goal
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      Target daily minutes used for heatmap &amp; streak progress
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-xs">
                    {[15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => onSetDailyGoalMinutes(mins)}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer tabular-nums ${
                          dailyGoalMinutes === mins
                            ? 'bg-sky-600 text-white font-semibold'
                            : 'optical-card text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto-Log Topic Completion */}
                <div className="optical-inset rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      Auto-Log +15m on Topic Check-Off
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      Automatically add a 15-minute study log whenever a topic is marked complete
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoLogTopicPractice}
                    aria-label="Toggle auto-log 15m on topic check-off"
                    onClick={() => onSetAutoLogTopicPractice(!autoLogTopicPractice)}
                    className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full border transition-colors cursor-pointer ${
                      autoLogTopicPractice
                        ? 'border-sky-500 bg-sky-600'
                        : 'border-slate-300 dark:border-white/15 bg-slate-300 dark:bg-white/10'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        autoLogTopicPractice ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Auto-Prompt on Workspace Switch */}
                <div className="optical-inset rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      Auto-Prompt Study Log on Workspace Switch
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      Offer to log accumulated active time when switching between workspaces
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoPromptOnSwitch}
                    aria-label="Toggle auto-prompt study log on workspace switch"
                    onClick={onToggleAutoPromptOnSwitch}
                    className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full border transition-colors cursor-pointer ${
                      autoPromptOnSwitch
                        ? 'border-sky-500 bg-sky-600'
                        : 'border-slate-300 dark:border-white/15 bg-slate-300 dark:bg-white/10'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        autoPromptOnSwitch ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Focus Chime & Theme Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={onToggleChimeMute}
                    className="optical-inset rounded-xl px-4 py-3 flex items-center justify-between gap-2 text-left cursor-pointer hover:border-sky-500/35 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        Focus Chime Audio
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {chimeMuted ? 'Muted' : 'Enabled'}
                      </div>
                    </div>
                    {chimeMuted ? (
                      <VolumeX className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className="optical-inset rounded-xl px-4 py-3 flex items-center justify-between gap-2 text-left cursor-pointer hover:border-sky-500/35 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        Appearance Theme
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 capitalize">
                        {theme} Mode
                      </div>
                    </div>
                    {theme === 'light' ? (
                      <Sun className="h-4 w-4 text-amber-600" />
                    ) : (
                      <Moon className="h-4 w-4 text-sky-300" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 dark:border-white/[0.08] px-6 py-3.5 bg-slate-50/80 dark:bg-[#050914]/90">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <Sparkles className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                <span>Saved automatically to local workspace &amp; disk sync</span>
              </span>

              <SoapBubbleButton
                onClick={onClose}
                tint="rgb(14 165 233)"
                opacity={0.94}
                style={{ fontSize: 12 }}
                className="!min-h-[32px] !px-4 font-semibold text-white"
              >
                Done
              </SoapBubbleButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
