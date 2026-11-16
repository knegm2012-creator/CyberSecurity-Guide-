import { NextRequest, NextResponse } from 'next/server';
import { apiSecurityHeaders } from '@/lib/security';
import {
  getAuthenticatedGitHubSession,
  getGitHubOAuthClientConfig,
  resolveGitHubCallbackUrl,
} from '@/lib/github-oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const headers = apiSecurityHeaders();
  const cfg = getGitHubOAuthClientConfig();
  const originHint = req.nextUrl.searchParams.get('origin');
  const callbackUrl = resolveGitHubCallbackUrl(originHint);
  const session = getAuthenticatedGitHubSession(req);

  return NextResponse.json(
    {
      configured: cfg.configured,
      connected: session !== null,
      callbackUrl,
      user: session
        ? {
            login: session.login,
            name: session.name,
            avatarUrl: session.avatarUrl,
            htmlUrl: session.htmlUrl,
          }
        : null,
    },
    { headers }
  );
}
