import crypto from 'crypto';
import { githubSyncRateLimiter } from './security.ts';

export { githubSyncRateLimiter };

export const GITHUB_SESSION_COOKIE = 'cs_odyssey_gh_session';
export const GITHUB_STATE_COOKIE = 'cs_odyssey_gh_state';
export const GITHUB_OAUTH_CALLBACK_PATH = '/api/auth/github/callback';
export const DEFAULT_PROGRESS_REPO = 'cs-odyssey-progress';
export const DEFAULT_PROGRESS_FILE = 'progress/cs-odyssey-progress.json';

const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const GITHUB_FETCH_TIMEOUT_MS = 10000;

export interface GitHubOAuthSession {
  accessToken: string;
  login: string;
  name: string;
  avatarUrl: string;
  htmlUrl: string;
  issuedAt: number;
}

export interface GitHubPublicUser {
  login: string;
  name: string;
  avatarUrl: string;
  htmlUrl: string;
}

const globalForSecret = globalThis as typeof globalThis & {
  __csOdysseyOAuthSecret?: Buffer;
};

function getSessionSecretKey(): Buffer {
  const configured =
    process.env.GITHUB_SESSION_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim() ||
    process.env.GITHUB_CLIENT_SECRET?.trim();

  if (configured && configured.length >= 16) {
    return crypto.createHash('sha256').update(`cs-odyssey-v1:${configured}`).digest();
  }

  if (!globalForSecret.__csOdysseyOAuthSecret) {
    globalForSecret.__csOdysseyOAuthSecret = crypto.randomBytes(32);
  }
  return globalForSecret.__csOdysseyOAuthSecret;
}

export function getGitHubOAuthClientConfig(): {
  clientId: string;
  clientSecret: string;
  configured: boolean;
} {
  const clientId = (process.env.GITHUB_CLIENT_ID || process.env.CLIENT_ID || '').trim();
  const clientSecret = (process.env.GITHUB_CLIENT_SECRET || process.env.CLIENT_SECRET || '').trim();
  const placeholders = new Set(['', 'YOUR_GITHUB_CLIENT_ID', 'YOUR_GITHUB_CLIENT_SECRET', 'changeme']);

  const configured =
    clientId.length >= 8 &&
    clientSecret.length >= 12 &&
    !placeholders.has(clientId) &&
    !placeholders.has(clientSecret);

  return { clientId, clientSecret, configured };
}

export function isAllowedAppOrigin(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  let parsed: URL;
  try {
    parsed = new URL(candidate.trim());
  } catch {
    return null;
  }

  const configuredAppUrl = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
  if (configuredAppUrl && parsed.origin === configuredAppUrl) {
    return parsed.origin;
  }

  if (parsed.protocol === 'https:' && parsed.hostname.endsWith('.run.app')) {
    return parsed.origin;
  }

  if (
    parsed.protocol === 'http:' &&
    (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
    (parsed.port === '3000' || parsed.port === '')
  ) {
    return parsed.origin;
  }

  return null;
}

export function resolveGitHubCallbackUrl(clientOriginHint?: string | null): string {
  const appUrlEnv = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
  const validatedHint = isAllowedAppOrigin(clientOriginHint);
  const baseOrigin = validatedHint || isAllowedAppOrigin(appUrlEnv) || appUrlEnv || 'http://localhost:3000';
  return `${baseOrigin}${GITHUB_OAUTH_CALLBACK_PATH}`;
}

export function sealGitHubSession(session: GitHubOAuthSession): string {
  const key = getSessionSecretKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(session), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

export function unsealGitHubSession(token: string | undefined | null): GitHubOAuthSession | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const raw = Buffer.from(token, 'base64url');
    if (raw.length < 29) return null;
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);
    const key = getSessionSecretKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const parsed = JSON.parse(decrypted.toString('utf8')) as GitHubOAuthSession;

    if (!parsed || typeof parsed.accessToken !== 'string' || typeof parsed.login !== 'string') {
      return null;
    }
    if (Date.now() - (parsed.issuedAt || 0) > SESSION_TTL_SECONDS * 1000) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function createSignedOAuthState(redirectUri: string): {
  stateToken: string;
  nonce: string;
} {
  const nonce = crypto.randomBytes(24).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      nonce,
      redirectUri,
      exp: Date.now() + STATE_TTL_MS,
    }),
    'utf8'
  ).toString('base64url');

  const sig = crypto
    .createHmac('sha256', getSessionSecretKey())
    .update(payload)
    .digest('base64url');

  return {
    stateToken: `${payload}.${sig}`,
    nonce,
  };
}

export function verifySignedOAuthState(
  stateToken: string | null | undefined,
  cookieNonce: string | null | undefined
): { redirectUri: string } | null {
  if (!stateToken || !cookieNonce) return null;
  const parts = stateToken.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, providedSig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getSessionSecretKey())
    .update(payloadB64)
    .digest('base64url');

  const a = Buffer.from(providedSig, 'utf8');
  const b = Buffer.from(expectedSig, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      nonce?: string;
      redirectUri?: string;
      exp?: number;
    };

    if (
      !decoded ||
      typeof decoded.nonce !== 'string' ||
      typeof decoded.redirectUri !== 'string' ||
      typeof decoded.exp !== 'number'
    ) {
      return null;
    }

    if (Date.now() > decoded.exp) {
      return null;
    }

    const nonceBufA = Buffer.from(decoded.nonce, 'utf8');
    const nonceBufB = Buffer.from(cookieNonce, 'utf8');
    if (nonceBufA.length !== nonceBufB.length || !crypto.timingSafeEqual(nonceBufA, nonceBufB)) {
      return null;
    }

    return { redirectUri: decoded.redirectUri };
  } catch {
    return null;
  }
}

export function getAuthenticatedGitHubSession(req: {
  cookies: { get: (name: string) => { value: string } | undefined };
}): GitHubOAuthSession | null {
  const sealed = req.cookies.get(GITHUB_SESSION_COOKIE)?.value;
  return unsealGitHubSession(sealed);
}

export function validateRepoName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const clean = raw.trim();
  if (!/^[a-zA-Z0-9._-]{1,100}$/.test(clean) || clean === '.' || clean === '..') {
    return null;
  }
  return clean;
}

export function validateRepoFilePath(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const clean = raw.trim().replace(/^\/+/, '');
  if (
    !clean ||
    clean.length > 180 ||
    clean.includes('..') ||
    clean.includes('\0') ||
    !/^[a-zA-Z0-9._/-]+\.json$/i.test(clean)
  ) {
    return null;
  }
  return clean;
}

export function validateBranchName(raw: unknown): string {
  if (typeof raw !== 'string') return 'main';
  const clean = raw.trim();
  if (
    !clean ||
    clean.length > 80 ||
    clean.includes('..') ||
    clean.startsWith('/') ||
    !/^[a-zA-Z0-9._/-]+$/.test(clean)
  ) {
    return 'main';
  }
  return clean;
}

export async function fetchGitHubApi(
  url: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GITHUB_FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'cs-odyssey-workbench',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.headers || {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export const IFRAME_OAUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
};
