import { NextRequest, NextResponse } from 'next/server';
import { executeCodeSecurely } from '@/lib/code-runner';
import {
  apiSecurityHeaders,
  codeExecConcurrencyLimiter,
  codeExecRateLimiter,
  getClientIp,
  parseJsonBodySafe,
  RequestBodyError,
} from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CodeRunPayload {
  language?: string;
  code?: string;
  stdin?: string;
  timeoutMs?: number;
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateCheck = codeExecRateLimiter.tryConsume(clientIp);
  const headers = apiSecurityHeaders({
    'X-RateLimit-Remaining': String(rateCheck.remaining),
    ...(rateCheck.allowed ? {} : { 'Retry-After': String(rateCheck.retryAfterSec) }),
  });

  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: 'Too Many Requests: Code execution rate limit exceeded. Please wait a few seconds.',
        rateLimited: true,
        retryAfterSec: rateCheck.retryAfterSec,
      },
      { status: 429, headers }
    );
  }

  if (!codeExecConcurrencyLimiter.tryAcquire(clientIp)) {
    return NextResponse.json(
      {
        error: 'Too Many Concurrent Runs: Another execution is already running for your session.',
        concurrencyLimited: true,
      },
      { status: 429, headers }
    );
  }

  try {
    const body = await parseJsonBodySafe<CodeRunPayload>(req, 256 * 1024);
    const language = body.language === 'python' || body.language === 'c' ? body.language : null;
    if (!language) {
      return NextResponse.json(
        { error: 'Unsupported language. Allowed: "python" or "c".', success: false },
        { status: 400, headers }
      );
    }

    const result = await executeCodeSecurely({
      language,
      code: typeof body.code === 'string' ? body.code : '',
      stdin: typeof body.stdin === 'string' ? body.stdin : '',
      timeoutMs: typeof body.timeoutMs === 'number' ? body.timeoutMs : undefined,
    });

    return NextResponse.json(result, { headers });
  } catch (err) {
    if (err instanceof RequestBodyError) {
      return NextResponse.json(
        { error: err.message, success: false },
        { status: err.status, headers }
      );
    }
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Code execution failed.',
        success: false,
      },
      { status: 400, headers }
    );
  } finally {
    codeExecConcurrencyLimiter.release(clientIp);
  }
}
