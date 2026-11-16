import { NextRequest, NextResponse } from 'next/server';
import { apiSecurityHeaders } from '@/lib/security';
import {
  createSignedOAuthState,
  getGitHubOAuthClientConfig,
  GITHUB_STATE_COOKIE,
  IFRAME_OAUTH_COOKIE_OPTIONS,
  resolveGitHubCallbackUrl,
} from '@/lib/github-oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const headers = apiSecurityHeaders();
  const cfg = getGitHubOAuthClientConfig();
  const originHint = req.nextUrl.searchParams.get('origin');
  const redirectUri = resolveGitHubCallbackUrl(originHint);

  if (!cfg.configured) {
    return NextResponse.json(
      {
        error:
          'GitHub OAuth is not configured on this server. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in environment variables.',
        configured: false,
        callbackUrl: redirectUri,
      },
      { status: 503, headers }
    );
  }

  const { stateToken, nonce } = createSignedOAuthState(redirectUri);

  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: redirectUri,
    scope: 'repo read:user',
    state: stateToken,
    allow_signup: 'true',
  });

  const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
  const response = NextResponse.json(
    {
      url,
      callbackUrl: redirectUri,
      configured: true,
    },
    { headers }
  );

  response.cookies.set(GITHUB_STATE_COOKIE, nonce, {
    ...IFRAME_OAUTH_COOKIE_OPTIONS,
    maxAge: 600,
  });

  return response;
}
