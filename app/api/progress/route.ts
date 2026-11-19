import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import {
  apiSecurityHeaders,
  getClientIp,
  parseJsonBodySafe,
  progressRateLimiter,
  RequestBodyError,
  sanitizeOdysseyStoreState,
} from '@/lib/security';
import { STAGES_DATA } from '@/lib/curriculum-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_STATE_BYTES = 512 * 1024; // 512KB max persisted profile

function resolveProgressPaths() {
  const configured = process.env.CS_ODYSSEY_DATA_DIR?.trim();
  const dir = configured ? path.resolve(configured) : path.resolve(process.cwd(), '.data');
  return {
    dir,
    filePath: path.join(dir, 'odyssey-progress.json'),
    backupPath: path.join(dir, 'odyssey-progress.bak.json'),
  };
}

interface StoredEnvelope {
  version: 1;
  updatedAt: string;
  state: Record<string, unknown>;
}

function computeServerMetrics(state: Record<string, unknown>) {
  const completedTopics =
    state.completedTopics && typeof state.completedTopics === 'object' && !Array.isArray(state.completedTopics)
      ? (state.completedTopics as Record<string, boolean>)
      : {};
  let totalTopicsCount = 0;
  let completedTopicsCount = 0;
  for (const stage of STAGES_DATA) {
    for (const topic of stage.topics) {
      totalTopicsCount++;
      if (completedTopics[topic.id]) completedTopicsCount++;
    }
  }
  const banditCount = Array.isArray(state.solvedBanditLevels) ? state.solvedBanditLevels.length : 0;
  const totalMinutes = Array.isArray(state.studyLogs)
    ? state.studyLogs.reduce((acc, l) => acc + (typeof l?.minutes === 'number' ? l.minutes : 0), 0)
    : 0;
  const scheduledStagesCount =
    state.stageTargetDates && typeof state.stageTargetDates === 'object'
      ? Object.keys(state.stageTargetDates).length
      : 0;

  return {
    completedTopicsCount,
    totalTopicsCount,
    topicPercent: totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0,
    banditCount,
    totalMinutes,
    scheduledStagesCount,
  };
}

let writeQueue: Promise<unknown> = Promise.resolve();

function enqueueDiskOp<T>(op: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(op, op);
  writeQueue = next.catch(() => {});
  return next;
}

async function readEnvelopeWithBackupFallback(filePath: string, backupPath: string) {
  for (const candidate of [filePath, backupPath]) {
    try {
      const raw = await fs.readFile(candidate, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<StoredEnvelope>;
      if (parsed && typeof parsed === 'object' && parsed.state) {
        const cleanState = sanitizeOdysseyStoreState(parsed.state);
        return {
          available: true,
          exists: true,
          state: cleanState,
          metrics: computeServerMetrics(cleanState),
          updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
          recoveredFromBackup: candidate === backupPath,
        };
      }
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code === 'ENOENT' && candidate === filePath) {
        continue;
      }
    }
  }
  return null;
}

export async function GET() {
  const headers = apiSecurityHeaders();
  const { filePath, backupPath } = resolveProgressPaths();

  try {
    const recovered = await readEnvelopeWithBackupFallback(filePath, backupPath);
    if (recovered) {
      return NextResponse.json(recovered, { headers });
    }
    return NextResponse.json({ available: true, exists: false, state: null, updatedAt: null }, { headers });
  } catch {
    return NextResponse.json(
      { available: false, exists: false, state: null, updatedAt: null },
      { headers }
    );
  }
}

export async function PUT(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateCheck = progressRateLimiter.tryConsume(clientIp);
  const headers = apiSecurityHeaders({
    'X-RateLimit-Remaining': String(rateCheck.remaining),
    ...(rateCheck.allowed ? {} : { 'Retry-After': String(rateCheck.retryAfterSec) }),
  });

  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests: Progress sync throttled.' },
      { status: 429, headers }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await parseJsonBodySafe<Record<string, unknown>>(req, MAX_STATE_BYTES);
  } catch (err) {
    if (err instanceof RequestBodyError) {
      return NextResponse.json({ error: err.message }, { status: err.status, headers });
    }
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers });
  }

  let cleanState: Record<string, unknown>;
  try {
    cleanState = sanitizeOdysseyStoreState(body.state ?? body);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid state structure.' },
      { status: 400, headers }
    );
  }

  const updatedAt = new Date().toISOString();
  const envelope: StoredEnvelope = {
    version: 1,
    updatedAt,
    state: cleanState,
  };

  const { dir, filePath, backupPath } = resolveProgressPaths();
  const metrics = computeServerMetrics(cleanState);

  return enqueueDiskOp(async () => {
    const tempPath = path.join(dir, `.odyssey-progress-${crypto.randomBytes(6).toString('hex')}.tmp`);
    try {
      await fs.mkdir(dir, { recursive: true, mode: 0o700 });
      await fs.copyFile(filePath, backupPath).catch(() => {});
      await fs.writeFile(tempPath, JSON.stringify(envelope, null, 2), { encoding: 'utf-8', mode: 0o600 });
      await fs.rename(tempPath, filePath);

      return NextResponse.json({ ok: true, persistedToDisk: true, updatedAt, metrics }, { headers });
    } catch {
      try {
        await fs.rm(tempPath, { force: true });
      } catch (_) {}
      // Gracefully allow browser localStorage-only mode on read-only hosts without failing client saves
      return NextResponse.json({ ok: true, persistedToDisk: false, updatedAt, metrics }, { headers });
    }
  });
}

export async function DELETE(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateCheck = progressRateLimiter.tryConsume(clientIp);
  const headers = apiSecurityHeaders({
    'X-RateLimit-Remaining': String(rateCheck.remaining),
    ...(rateCheck.allowed ? {} : { 'Retry-After': String(rateCheck.retryAfterSec) }),
  });

  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests: Progress delete throttled.' },
      { status: 429, headers }
    );
  }

  const { filePath, backupPath } = resolveProgressPaths();
  await enqueueDiskOp(() =>
    Promise.allSettled([
      fs.rm(filePath, { force: true }),
      fs.rm(backupPath, { force: true }),
    ])
  );

  return NextResponse.json({ ok: true, cleared: true }, { headers });
}

