import { NextRequest, NextResponse } from 'next/server';
import {
  apiSecurityHeaders,
  getClientIp,
  parseJsonBodySafe,
  progressRateLimiter,
  RequestBodyError,
  tutorRateLimiter,
} from '@/lib/security';
import { clampMentorDailyLimit } from '@/lib/mentor-quota';
import {
  getMentorQuotaSnapshotServer,
  setMentorDailyLimitServer,
} from '@/lib/mentor-quota-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req);
  const burst = tutorRateLimiter.peekRemaining(clientIp);
  const headers = apiSecurityHeaders();

  try {
    const snapshot = await getMentorQuotaSnapshotServer(burst.remaining, burst.retryAfterSec);
    return NextResponse.json({ quota: snapshot }, { headers });
  } catch {
    return NextResponse.json(
      { error: 'Unable to read mentor quota state.' },
      { status: 500, headers }
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
      { error: 'Too Many Requests: Limit update throttled.', retryAfterSec: rateCheck.retryAfterSec },
      { status: 429, headers }
    );
  }

  try {
    const body = await parseJsonBodySafe<{ dailyLimit?: unknown }>(req, 4096);
    if (typeof body.dailyLimit !== 'number' || !Number.isFinite(body.dailyLimit)) {
      return NextResponse.json(
        { error: 'dailyLimit must be a finite number between 5 and 500.' },
        { status: 400, headers }
      );
    }

    const clamped = clampMentorDailyLimit(body.dailyLimit);
    const burst = tutorRateLimiter.peekRemaining(clientIp);
    const snapshot = await setMentorDailyLimitServer(clamped, burst.remaining);
    return NextResponse.json({ ok: true, quota: snapshot }, { headers });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers });
    }
    return NextResponse.json({ error: 'Unable to update mentor quota limit.' }, { status: 500, headers });
  }
}
