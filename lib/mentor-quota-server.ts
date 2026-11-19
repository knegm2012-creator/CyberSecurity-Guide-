import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import {
  DEFAULT_MENTOR_DAILY_LIMIT,
  TUTOR_BURST_CAPACITY,
  clampMentorDailyLimit,
  getUtcDateKey,
  getNextUtcMidnightIso,
  type MentorQuotaSnapshot,
} from './mentor-quota.ts';

interface PersistedQuotaFile {
  version: 1;
  dateKey: string;
  usedToday: number;
  dailyLimit: number;
  totalAllTime: number;
  updatedAt: string;
}

function resolveQuotaFilePath(): { dir: string; filePath: string } {
  const configured = process.env.CS_ODYSSEY_DATA_DIR?.trim();
  const dir = configured ? path.resolve(configured) : path.resolve(process.cwd(), '.data');
  return {
    dir,
    filePath: path.join(dir, 'tutor-quota.json'),
  };
}

let quotaWriteQueue: Promise<unknown> = Promise.resolve();

function enqueueQuotaOp<T>(op: () => Promise<T>): Promise<T> {
  const next = quotaWriteQueue.then(op, op);
  quotaWriteQueue = next.catch(() => {});
  return next;
}

function defaultRecord(nowMs: number = Date.now()): PersistedQuotaFile {
  return {
    version: 1,
    dateKey: getUtcDateKey(nowMs),
    usedToday: 0,
    dailyLimit: DEFAULT_MENTOR_DAILY_LIMIT,
    totalAllTime: 0,
    updatedAt: new Date(nowMs).toISOString(),
  };
}

async function readNormalizedRecord(nowMs: number = Date.now()): Promise<PersistedQuotaFile> {
  const { filePath } = resolveQuotaFilePath();
  const todayKey = getUtcDateKey(nowMs);

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<PersistedQuotaFile>;
    if (!parsed || typeof parsed !== 'object') {
      return defaultRecord(nowMs);
    }

    const dailyLimit = clampMentorDailyLimit(parsed.dailyLimit);
    const totalAllTime =
      typeof parsed.totalAllTime === 'number' && Number.isFinite(parsed.totalAllTime) && parsed.totalAllTime >= 0
        ? Math.floor(parsed.totalAllTime)
        : 0;
    const isSameDay = parsed.dateKey === todayKey;
    const usedToday =
      isSameDay &&
      typeof parsed.usedToday === 'number' &&
      Number.isFinite(parsed.usedToday) &&
      parsed.usedToday >= 0
        ? Math.floor(parsed.usedToday)
        : 0;

    return {
      version: 1,
      dateKey: todayKey,
      usedToday,
      dailyLimit,
      totalAllTime,
      updatedAt:
        typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date(nowMs).toISOString(),
    };
  } catch {
    return defaultRecord(nowMs);
  }
}

async function writeRecordAtomic(record: PersistedQuotaFile): Promise<void> {
  const { dir, filePath } = resolveQuotaFilePath();
  const tempPath = path.join(dir, `.tutor-quota-${crypto.randomBytes(6).toString('hex')}.tmp`);
  try {
    await fs.mkdir(dir, { recursive: true, mode: 0o700 });
    await fs.writeFile(tempPath, JSON.stringify(record, null, 2), {
      encoding: 'utf-8',
      mode: 0o600,
    });
    await fs.rename(tempPath, filePath);
  } catch {
    try {
      await fs.rm(tempPath, { force: true });
    } catch {
      // Ignore cleanup error on read-only hosts
    }
  }
}

export function buildQuotaSnapshot(
  record: PersistedQuotaFile,
  burstRemaining: number = TUTOR_BURST_CAPACITY,
  retryAfterSec: number = 0,
  nowMs: number = Date.now()
): MentorQuotaSnapshot {
  const remainingToday = Math.max(0, record.dailyLimit - record.usedToday);
  return {
    dateKey: record.dateKey,
    usedToday: record.usedToday,
    dailyLimit: record.dailyLimit,
    remainingToday,
    totalAllTime: record.totalAllTime,
    resetsAtIso: getNextUtcMidnightIso(nowMs),
    burstRemaining: Math.max(0, Math.min(TUTOR_BURST_CAPACITY, Math.floor(burstRemaining))),
    burstCapacity: TUTOR_BURST_CAPACITY,
    retryAfterSec: Math.max(0, Math.floor(retryAfterSec)),
    isDailyLimitReached: remainingToday <= 0,
  };
}

export async function getMentorQuotaSnapshotServer(
  burstRemaining: number = TUTOR_BURST_CAPACITY,
  retryAfterSec: number = 0
): Promise<MentorQuotaSnapshot> {
  return enqueueQuotaOp(async () => {
    const nowMs = Date.now();
    const record = await readNormalizedRecord(nowMs);
    return buildQuotaSnapshot(record, burstRemaining, retryAfterSec, nowMs);
  });
}

export async function consumeMentorDailyQuotaServer(options: {
  requestedLimit?: number;
  burstRemaining: number;
  retryAfterSec?: number;
}): Promise<{ allowed: boolean; snapshot: MentorQuotaSnapshot }> {
  return enqueueQuotaOp(async () => {
    const nowMs = Date.now();
    const record = await readNormalizedRecord(nowMs);
    if (typeof options.requestedLimit === 'number' && Number.isFinite(options.requestedLimit)) {
      record.dailyLimit = clampMentorDailyLimit(options.requestedLimit);
    }

    if (record.usedToday >= record.dailyLimit) {
      return {
        allowed: false,
        snapshot: buildQuotaSnapshot(record, options.burstRemaining, options.retryAfterSec ?? 0, nowMs),
      };
    }

    record.usedToday += 1;
    record.totalAllTime += 1;
    record.updatedAt = new Date(nowMs).toISOString();
    await writeRecordAtomic(record);

    return {
      allowed: true,
      snapshot: buildQuotaSnapshot(record, options.burstRemaining, options.retryAfterSec ?? 0, nowMs),
    };
  });
}

export async function setMentorDailyLimitServer(
  dailyLimit: number,
  burstRemaining: number = TUTOR_BURST_CAPACITY
): Promise<MentorQuotaSnapshot> {
  return enqueueQuotaOp(async () => {
    const nowMs = Date.now();
    const record = await readNormalizedRecord(nowMs);
    record.dailyLimit = clampMentorDailyLimit(dailyLimit);
    record.updatedAt = new Date(nowMs).toISOString();
    await writeRecordAtomic(record);
    return buildQuotaSnapshot(record, burstRemaining, 0, nowMs);
  });
}
