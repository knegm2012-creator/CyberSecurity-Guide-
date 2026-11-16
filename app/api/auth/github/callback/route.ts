import { NextRequest, NextResponse } from 'next/server';
import {
  fetchGitHubApi,
  getGitHubOAuthClientConfig,
  GITHUB_SESSION_COOKIE,
  GITHUB_STATE_COOKIE,
  IFRAME_OAUTH_COOKIE_OPTIONS,
  sealGitHubSession,
  verifySignedOAuthState,
} from '@/lib/github-oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function renderPopupCallbackHtml(payload: {
  ok: boolean;
  error?: string;
}): NextResponse {
  const safeMessage = payload.ok
    ? { type: 'OAUTH_AUTH_SUCCESS', provider: 'github' }
    : { type: 'OAUTH_AUTH_ERROR', provider: 'github', error: payload.error || 'OAuth failed' };

  const serialized = JSON.stringify(safeMessage).replace(/</g, '\\u003c');
  const statusHeadline = payload.ok
    ? 'GitHub Connected Successfully'
    : 'GitHub Connection Failed';
  const statusDetail = payload.ok
    ? 'You may close this window — CS Odyssey is syncing your session.'
    : (payload.error || 'Authentication did not complete.').replace(/[<>&"']/g, '');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${statusHeadline}</title>
    <style>
      body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: #070b14; color: #e2e8f0; display: grid; place-items: center; min-height: 100vh; padding: 24px; }
      .card { max-width: 420px; border: 1px solid rgba(255,255,255,0.12); background: #0d1424; border-radius: 16px; padding: 24px; text-align: center; }
      h1 { font-size: 16px; margin: 0 0 8px; color: ${payload.ok ? '#34d399' : '#fb7185'}; }
      p { font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${statusHeadline}</h1>
      <p>${statusDetail}</p>
    </div>
    <script>
      (function () {
        var msg = ${serialized};
        if (window.opener && !window.opener.closed) {
          try { window.opener.postMessage(msg, '*'); } catch (e) {}
          setTimeout(function () { window.close(); }, 350);
        } else {
          setTimeout(function () { window.location.href = '/'; }, 1200);
        }
      })();
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    status: payload.ok ? 200 : 400,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const oauthError = req.nextUrl.searchParams.get('error_description') || req.nextUrl.searchParams.get('error');

  if (oauthError) {
    return renderPopupCallbackHtml({ ok: false, error: `GitHub returned: ${oauthError}` });
  }

  if (!code || !state) {
    return renderPopupCallbackHtml({ ok: false, error: 'Missing OAuth authorization code or state parameter.' });
  }

  const cookieNonce = req.cookies.get(GITHUB_STATE_COOKIE)?.value;
  const verifiedState = verifySignedOAuthState(state, cookieNonce);
  if (!verifiedState) {
    return renderPopupCallbackHtml({ ok: false, error: 'Invalid or expired OAuth state token. Please try connecting again.' });
  }

  const cfg = getGitHubOAuthClientConfig();
  if (!cfg.configured) {
    return renderPopupCallbackHtml({ ok: false, error: 'Server GitHub OAuth credentials are not configured.' });
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        code,
        redirect_uri: verifiedState.redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      return renderPopupCallbackHtml({ ok: false, error: `GitHub token exchange failed (${tokenRes.status}).` });
    }

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenData.access_token) {
      return renderPopupCallbackHtml({
        ok: false,
        error: tokenData.error_description || tokenData.error || 'GitHub did not return an access token.',
      });
    }

    const userRes = await fetchGitHubApi('https://api.github.com/user', tokenData.access_token);
    if (!userRes.ok) {
      return renderPopupCallbackHtml({ ok: false, error: 'Unable to fetch authenticated GitHub user profile.' });
    }

    const ghUser = (await userRes.json()) as {
      login?: string;
      name?: string | null;
      avatar_url?: string;
      html_url?: string;
    };

    if (!ghUser.login) {
      return renderPopupCallbackHtml({ ok: false, error: 'Malformed GitHub profile response.' });
    }

    const sealedCookie = sealGitHubSession({
      accessToken: tokenData.access_token,
      login: ghUser.login,
      name: ghUser.name || ghUser.login,
      avatarUrl: ghUser.avatar_url || '',
      htmlUrl: ghUser.html_url || `https://github.com/${ghUser.login}`,
      issuedAt: Date.now(),
    });

    const response = renderPopupCallbackHtml({ ok: true });
    response.cookies.set(GITHUB_SESSION_COOKIE, sealedCookie, IFRAME_OAUTH_COOKIE_OPTIONS);
    response.cookies.set(GITHUB_STATE_COOKIE, '', {
      ...IFRAME_OAUTH_COOKIE_OPTIONS,
      maxAge: 0,
    });
    return response;
  } catch (err) {
    return renderPopupCallbackHtml({
      ok: false,
      error: err instanceof Error ? err.message : 'Unexpected OAuth callback error.',
    });
  }
}
