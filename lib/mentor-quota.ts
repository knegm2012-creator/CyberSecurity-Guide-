export const DEFAULT_MENTOR_DAILY_LIMIT = 50;
export const MIN_MENTOR_DAILY_LIMIT = 5;
export const MAX_MENTOR_DAILY_LIMIT = 500;
export const TUTOR_BURST_CAPACITY = 30;
export const MAX_MENTOR_HISTORY_ITEMS = 100;

export interface MentorQuotaSnapshot {
  dateKey: string;
  usedToday: number;
  dailyLimit: number;
  remainingToday: number;
  totalAllTime: number;
  resetsAtIso: string;
  burstRemaining: number;
  burstCapacity: number;
  retryAfterSec: number;
  isDailyLimitReached: boolean;
}

export interface MentorSavedRequestEntry {
  id: string;
  mode: string;
  stageId: string;
  workspace?: string;
  prompt: string;
  response: string;
  source: string;
  sources?: Array<{ title: string; uri: string }>;
  createdAt: string;
  pinned?: boolean;
}

export function clampMentorDailyLimit(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return DEFAULT_MENTOR_DAILY_LIMIT;
  }
  return Math.max(
    MIN_MENTOR_DAILY_LIMIT,
    Math.min(MAX_MENTOR_DAILY_LIMIT, Math.floor(raw))
  );
}

export function getUtcDateKey(nowMs: number = Date.now()): string {
  return new Date(nowMs).toISOString().split('T')[0];
}

export function getNextUtcMidnightIso(nowMs: number = Date.now()): string {
  const d = new Date(nowMs);
  const nextMidnight = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );
  return new Date(nextMidnight).toISOString();
}

export function findCachedMentorMatch(
  history: MentorSavedRequestEntry[] | undefined,
  params: {
    mode: string;
    stageId: string;
    prompt: string;
  }
): MentorSavedRequestEntry | null {
  if (!Array.isArray(history) || history.length === 0) return null;
  const normalizedPrompt = params.prompt.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalizedPrompt) return null;

  for (const item of history) {
    if (
      item.mode === params.mode &&
      item.stageId === params.stageId &&
      item.prompt.trim().toLowerCase().replace(/\s+/g, ' ') === normalizedPrompt &&
      !item.response.startsWith('Error:')
    ) {
      return item;
    }
  }
  return null;
}

export function formatQuotaResetCountdown(resetsAtIso: string, nowMs: number = Date.now()): string {
  const resetMs = Date.parse(resetsAtIso);
  if (Number.isNaN(resetMs)) return 'tomorrow UTC';
  const diffMs = Math.max(0, resetMs - nowMs);
  const totalMins = Math.ceil(diffMs / 60_000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
