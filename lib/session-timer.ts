import type { PrimaryWorkspace } from '@/components/Navbar';

export const WORKSPACE_LABELS: Record<PrimaryWorkspace, string> = {
  overview: 'Overview',
  curriculum: 'Curriculum',
  lab: 'Systems Lab',
  shell: 'Wargame Shell',
  reference: 'Reference',
};

export const AUTO_PROMPT_THRESHOLD_SECONDS = 30;
export const FOCUS_PRESET_TARGETS = [0, 5, 25, 45, 60] as const;
export type FocusTargetMinutes = (typeof FOCUS_PRESET_TARGETS)[number];
export type AppTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'cs_odyssey_theme';
export const SESSION_STORAGE_KEY = 'cs_odyssey_session_v1';
export const LAST_OPENED_STORAGE_KEY = 'cs_odyssey_last_opened_at_v1';
export const CATCH_UP_THRESHOLD_HOURS = 48;
export const CATCH_UP_THRESHOLD_MS = CATCH_UP_THRESHOLD_HOURS * 60 * 60 * 1000;
export const CATCH_UP_SESSION_MINUTES = 5;

export interface CatchUpSuggestionResult {
  shouldSuggest: boolean;
  hoursSinceLastOpen: number;
  daysAwayLabel: string;
  suggestedMinutes: number;
}

/**
 * Evaluates whether the user has been away for more than 48 hours and
 * should be offered a 5-minute catch-up study session.
 */
export function evaluateCatchUpSuggestion(params: {
  enabled: boolean;
  lastOpenedAt?: string | null;
  nowMs?: number;
  thresholdMs?: number;
}): CatchUpSuggestionResult {
  if (!params.enabled || !params.lastOpenedAt) {
    return {
      shouldSuggest: false,
      hoursSinceLastOpen: 0,
      daysAwayLabel: '',
      suggestedMinutes: CATCH_UP_SESSION_MINUTES,
    };
  }

  const lastMs = Date.parse(params.lastOpenedAt);
  if (Number.isNaN(lastMs) || lastMs <= 0) {
    return {
      shouldSuggest: false,
      hoursSinceLastOpen: 0,
      daysAwayLabel: '',
      suggestedMinutes: CATCH_UP_SESSION_MINUTES,
    };
  }

  const nowMs = typeof params.nowMs === 'number' && Number.isFinite(params.nowMs) ? params.nowMs : Date.now();
  const thresholdMs =
    typeof params.thresholdMs === 'number' && params.thresholdMs > 0
      ? params.thresholdMs
      : CATCH_UP_THRESHOLD_MS;

  const elapsedMs = nowMs - lastMs;
  if (elapsedMs <= thresholdMs) {
    return {
      shouldSuggest: false,
      hoursSinceLastOpen: Math.max(0, Math.floor(elapsedMs / 3_600_000)),
      daysAwayLabel: '',
      suggestedMinutes: CATCH_UP_SESSION_MINUTES,
    };
  }

  const hoursSinceLastOpen = Math.floor(elapsedMs / 3_600_000);
  const wholeDays = Math.floor(hoursSinceLastOpen / 24);
  const daysAwayLabel = wholeDays >= 2 ? `${wholeDays} days` : `${hoursSinceLastOpen} hours`;

  return {
    shouldSuggest: true,
    hoursSinceLastOpen,
    daysAwayLabel,
    suggestedMinutes: CATCH_UP_SESSION_MINUTES,
  };
}

/**
 * Formats an integer second count as MM:SS (or H:MM:SS for sessions >= 1 hour).
 */
export function formatSessionClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Converts active seconds spent in a workspace to a bounded loggable minute count.
 * Returns 0 when below the auto-prompt threshold unless forceMinimum is set.
 */
export function computeLoggableMinutes(
  elapsedSeconds: number,
  forceMinimum = false
): number {
  const safe = Math.max(0, Math.floor(Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0));
  if (!forceMinimum && safe < AUTO_PROMPT_THRESHOLD_SECONDS) {
    return 0;
  }
  return Math.max(1, Math.min(240, Math.round(safe / 60)));
}

/**
 * Determines whether switching workspaces should automatically prompt the learner
 * to log their accumulated active workspace study session.
 */
export function shouldPromptStudyLogOnSwitch(params: {
  fromWorkspace: PrimaryWorkspace;
  toWorkspace: PrimaryWorkspace;
  elapsedSeconds: number;
  autoPromptEnabled?: boolean;
}): boolean {
  if (params.autoPromptEnabled === false) return false;
  if (params.fromWorkspace === params.toWorkspace) return false;
  return params.elapsedSeconds >= AUTO_PROMPT_THRESHOLD_SECONDS;
}

/**
 * Synthesizes an editable study log summary for an active workspace session.
 */
export function buildDefaultSessionNote(
  workspace: PrimaryWorkspace,
  elapsedSeconds: number,
  focusModeActive = false
): string {
  const mins = computeLoggableMinutes(elapsedSeconds, true);
  const label = WORKSPACE_LABELS[workspace] || workspace;
  return focusModeActive
    ? `Deep Focus study session in ${label} (${mins}m)`
    : `Active study session in ${label} (${mins}m)`;
}

/**
 * Returns a sorted summary of cumulative minutes invested across workspaces.
 */
export function summarizeWorkspaceMinutes(
  raw?: Record<string, number>
): Array<{ workspace: PrimaryWorkspace; label: string; minutes: number }> {
  const keys: PrimaryWorkspace[] = ['overview', 'curriculum', 'lab', 'shell', 'reference'];
  return keys
    .map((ws) => ({
      workspace: ws,
      label: WORKSPACE_LABELS[ws],
      minutes: Math.max(0, Math.floor(Number(raw?.[ws] || 0))),
    }))
    .sort((a, b) => b.minutes - a.minutes);
}

/**
 * Plays a gentle two-note Web Audio harmonic chime when a Focus target completes.
 * Safely no-ops in SSR or browsers without AudioContext.
 */
export function playFocusChime(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return false;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99]; // C5 -> E5 -> G5 soft major triad
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.14 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.7);
    });

    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1500);
    return true;
  } catch {
    return false;
  }
}

