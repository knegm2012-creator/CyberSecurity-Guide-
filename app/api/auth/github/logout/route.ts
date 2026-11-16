import { NextResponse } from 'next/server';
import { apiSecurityHeaders } from '@/lib/security';
import {
  GITHUB_SESSION_COOKIE,
  GITHUB_STATE_COOKIE,
  IFRAME_OAUTH_COOKIE_OPTIONS,
} from '@/lib/github-oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const headers = apiSecurityHeaders();
  const response = NextResponse.json({ ok: true, disconnected: true }, { headers });
  response.cookies.set(GITHUB_SESSION_COOKIE, '', {
    ...IFRAME_OAUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });
  response.cookies.set(GITHUB_STATE_COOKIE, '', {
    ...IFRAME_OAUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });
  return response;
}
