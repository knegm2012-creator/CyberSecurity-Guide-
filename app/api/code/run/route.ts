import { NextRequest, NextResponse } from 'next/server';
import { executeCodeSecurely } from '@/lib/code-runner';
import {
  codeExecRateLimiter,
  codeExecConcurrencyLimiter,
  getClientIp,
} from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  // 1. Rate Limiting Check
  const rateCheck = codeExecRateLimiter.tryConsume(clientIp);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: 'Too Many Requests: Code execution rate limit exceeded. Please wait a few seconds.',
        rateLimited: true,
      },
      { status: 429 }
    );
  }

  // 2. Concurrency Check
  if (!codeExecConcurrencyLimiter.tryAcquire(clientIp)) {
    return NextResponse.json(
      {
        error: 'Too Many Concurrent Runs: Another execution is already running for your session.',
        concurrencyLimited: true,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const result = await executeCodeSecurely({
      language: body.language,
      code: body.code,
      stdin: body.stdin,
      timeoutMs: body.timeoutMs,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message || 'Code execution failed.',
        success: false,
      },
      { status: 400 }
    );
  } finally {
    codeExecConcurrencyLimiter.release(clientIp);
  }
}
