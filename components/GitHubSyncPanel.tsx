'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderGit2,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  LogOut,
  Copy,
  Check,
  Lock,
  Globe,
} from 'lucide-react';
import { SoapBubbleButton, SoapBubbleToggle } from '@/components/soap-bubble';
import type { OdysseyStoreData } from '@/hooks/use-odyssey-store';

interface GitHubSyncUser {
  login: string;
  name: string;
  avatarUrl: string;
  htmlUrl: string;
}

interface GitHubSyncPanelProps {
  data: OdysseyStoreData;
  stats: {
    completedTopicsCount: number;
    totalTopicsCount: number;
    completedProjectsCount: number;
    banditCount: number;
    totalMinutesLogged: number;
    xp: number;
    levelNumber: number;
    heroTitle: string;
    currentStreak: number;
  };
  compact?: boolean;
}

interface PushResultState {
  repoFullName: string;
  repositoryUrl: string;
  fileUrl: string;
  commitSha: string;
  commitUrl: string;
  createdRepo: boolean;
  pushedAt: string;
}

export function GitHubSyncPanel({ data, stats, compact = false }: GitHubSyncPanelProps) {
  const [configured, setConfigured] = useState<boolean>(true);
  const [connected, setConnected] = useState<boolean>(false);
  const [user, setUser] = useState<GitHubSyncUser | null>(null);
  const [callbackUrl, setCallbackUrl] = useState<string>('');
  const [statusLoading, setStatusLoading] = useState<boolean>(true);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [pushing, setPushing] = useState<boolean>(false);
  const [copiedCallback, setCopiedCallback] = useState<boolean>(false);

  const [repoName, setRepoName] = useState('cs-odyssey-progress');
  const [filePath, setFilePath] = useState('progress/cs-odyssey-progress.json');
  const [isPrivate, setIsPrivate] = useState(true);
  const [commitMessage, setCommitMessage] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [blockedPopupUrl, setBlockedPopupUrl] = useState<string | null>(null);
  const [pushResult, setPushResult] = useState<PushResultState | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const originParam =
        typeof window !== 'undefined' ? `?origin=${encodeURIComponent(window.location.origin)}` : '';
      const res = await fetch(`/api/auth/github/status${originParam}`, { cache: 'no-store' });
      if (!res.ok) return;
      const json = (await res.json()) as {
        configured?: boolean;
        connected?: boolean;
        callbackUrl?: string;
        user?: GitHubSyncUser | null;
      };
      setConfigured(Boolean(json.configured));
      setConnected(Boolean(json.connected));
      setCallbackUrl(json.callbackUrl || '');
      setUser(json.user || null);
    } catch {
      // Ignore transient probe errors
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const originParam =
      typeof window !== 'undefined' ? `?origin=${encodeURIComponent(window.location.origin)}` : '';

    fetch(`/api/auth/github/status${originParam}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          json: {
            configured?: boolean;
            connected?: boolean;
            callbackUrl?: string;
            user?: GitHubSyncUser | null;
          } | null
        ) => {
          if (cancelled || !json) return;
          setConfigured(Boolean(json.configured));
          setConnected(Boolean(json.connected));
          setCallbackUrl(json.callbackUrl || '');
          setUser(json.user || null);
        }
      )
      .catch(() => {
        // Ignore transient probe errors
      })
      .finally(() => {
        if (!cancelled) {
          setStatusLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const origin = event.origin || '';
      const isTrustedOrigin =
        origin === window.location.origin ||
        origin.endsWith('.run.app') ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1');
      if (!isTrustedOrigin) return;

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === 'github') {
        setConnecting(false);
        setBlockedPopupUrl(null);
        setErrorMsg(null);
        fetchStatus();
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR' && event.data?.provider === 'github') {
        setConnecting(false);
        setErrorMsg(event.data?.error || 'GitHub OAuth authorization was not completed.');
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [fetchStatus]);

  const handleConnectGitHub = async () => {
    setErrorMsg(null);
    setBlockedPopupUrl(null);
    setConnecting(true);

    try {
      const originParam = `?origin=${encodeURIComponent(window.location.origin)}`;
      const res = await fetch(`/api/auth/github/url${originParam}`, { cache: 'no-store' });
      const json = (await res.json()) as {
        url?: string;
        error?: string;
        callbackUrl?: string;
      };

      if (json.callbackUrl) {
        setCallbackUrl(json.callbackUrl);
      }

      if (!res.ok || !json.url) {
        setConnecting(false);
        setErrorMsg(json.error || 'Unable to initiate GitHub OAuth flow.');
        return;
      }

      const authWindow = window.open(
        json.url,
        'github_oauth_popup',
        'width=620,height=720,noopener=false'
      );

      if (!authWindow) {
        setConnecting(false);
        setBlockedPopupUrl(json.url);
        setErrorMsg('Popup blocked by browser. Use the direct authorization link below or allow popups.');
      }
    } catch (err) {
      setConnecting(false);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to contact GitHub OAuth service.');
    }
  };

  const handleDisconnect = async () => {
    await fetch('/api/auth/github/logout', { method: 'POST' });
    setConnected(false);
    setUser(null);
    setPushResult(null);
  };

  const handlePushProgress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setPushResult(null);
    setPushing(true);

    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName,
          filePath,
          isPrivate,
          commitMessage: commitMessage.trim() || undefined,
          summary: {
            completedTopicsCount: stats.completedTopicsCount,
            totalTopicsCount: stats.totalTopicsCount,
            completedProjectsCount: stats.completedProjectsCount,
            banditCount: stats.banditCount,
            totalMinutesLogged: stats.totalMinutesLogged,
            xp: stats.xp,
            levelNumber: stats.levelNumber,
            heroTitle: stats.heroTitle,
            currentStreak: stats.currentStreak,
          },
          progressData: data,
        }),
      });

      const payload = (await res.json()) as Partial<PushResultState> & {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok || !payload.ok) {
        setErrorMsg(payload.error || `GitHub push failed (${res.status}).`);
        return;
      }

      setPushResult({
        repoFullName: payload.repoFullName || `${user?.login}/${repoName}`,
        repositoryUrl: payload.repositoryUrl || '',
        fileUrl: payload.fileUrl || '',
        commitSha: payload.commitSha || '',
        commitUrl: payload.commitUrl || '',
        createdRepo: Boolean(payload.createdRepo),
        pushedAt: payload.pushedAt || new Date().toISOString(),
      });
      setCommitMessage('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error uploading to GitHub.');
    } finally {
      setPushing(false);
    }
  };

  const handleCopyCallback = () => {
    if (!callbackUrl) return;
    navigator.clipboard.writeText(callbackUrl);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 1800);
  };

  const projectNotesCount = Object.values(data.projectNotes || {}).filter((v) => v?.trim()).length;

  return (
    <div className="optical-panel rounded-2xl p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 dark:border-white/[0.08] pb-3.5">
        <div className="flex items-start gap-2.5">
          <FolderGit2 className="h-4 w-4 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Push Progress to GitHub (OAuth Sync)
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              Authenticate via GitHub OAuth and upload completed topics, project notes, and study logs as JSON to a dedicated repository.
            </p>
          </div>
        </div>

        {connected && user && (
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">@{user.login}</span>
            <button
              type="button"
              onClick={handleDisconnect}
              className="optical-card inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 cursor-pointer"
            >
              <LogOut className="h-3 w-3" />
              <span>Disconnect</span>
            </button>
          </div>
        )}
      </div>

      {/* Snapshot Summary Strip */}
      <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
        <div className="optical-inset rounded-xl px-3 py-2">
          <div className="text-[10px] text-slate-500 uppercase">Topics</div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
            {stats.completedTopicsCount}/{stats.totalTopicsCount}
          </div>
        </div>
        <div className="optical-inset rounded-xl px-3 py-2">
          <div className="text-[10px] text-slate-500 uppercase">Project Notes</div>
          <div className="text-sm font-semibold text-sky-600 dark:text-sky-400 mt-0.5">
            {projectNotesCount} saved
          </div>
        </div>
        <div className="optical-inset rounded-xl px-3 py-2">
          <div className="text-[10px] text-slate-500 uppercase">Study Logs</div>
          <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
            {data.studyLogs.length} entries
          </div>
        </div>
      </div>

      {statusLoading ? (
        <div className="optical-inset rounded-xl p-4 text-xs font-mono text-slate-600 dark:text-slate-400 flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-sky-600 dark:text-sky-400" />
          <span>Checking GitHub OAuth session...</span>
        </div>
      ) : !connected ? (
        <div className="space-y-3">
          {!configured && (
            <div className="rounded-xl border border-amber-500/35 dark:border-amber-400/35 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-1.5 font-mono font-semibold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>GitHub OAuth App Env Vars Needed</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900/90 dark:text-amber-100/90">
                Configure <code className="font-mono font-semibold text-slate-900 dark:text-white">GITHUB_CLIENT_ID</code> and{' '}
                <code className="font-mono font-semibold text-slate-900 dark:text-white">GITHUB_CLIENT_SECRET</code> on the server with this exact Authorization Callback URL:
              </p>
              {callbackUrl && (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 dark:border-amber-400/25 bg-slate-900 dark:bg-[#050811] px-2.5 py-1.5 font-mono text-[11px] text-cyan-300">
                  <span className="truncate">{callbackUrl}</span>
                  <button
                    type="button"
                    onClick={handleCopyCallback}
                    className="inline-flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer shrink-0"
                  >
                    {copiedCallback ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedCallback ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {configured && callbackUrl && !compact && (
            <div className="optical-inset rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
              <span className="truncate">
                OAuth Callback: <code className="text-slate-900 dark:text-slate-200">{callbackUrl}</code>
              </span>
              <button
                type="button"
                onClick={handleCopyCallback}
                className="text-sky-600 dark:text-sky-400 hover:text-sky-900 dark:hover:text-white cursor-pointer shrink-0 font-semibold"
              >
                {copiedCallback ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <SoapBubbleButton
              type="button"
              disabled={connecting || !configured}
              onClick={handleConnectGitHub}
              tint="rgb(56 189 248)"
              opacity={0.92}
              style={{ fontSize: 12 }}
              className="!min-h-[36px] !px-5 font-semibold text-white whitespace-nowrap"
            >
              {connecting ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FolderGit2 className="h-3.5 w-3.5" />
              )}
              <span>{connecting ? 'Waiting for GitHub...' : 'Connect GitHub via OAuth'}</span>
            </SoapBubbleButton>

            {blockedPopupUrl && (
              <a
                href={blockedPopupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-sky-600 dark:text-sky-400 hover:underline"
              >
                <span>Open GitHub Authorization Tab</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handlePushProgress} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                Dedicated Repository Name
              </label>
              <input
                type="text"
                required
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="cs-odyssey-progress"
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#050811] px-3 py-2 font-mono text-xs text-slate-900 dark:text-slate-100 focus:border-sky-500 dark:focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                JSON File Path in Repo
              </label>
              <input
                type="text"
                required
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="progress/cs-odyssey-progress.json"
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#050811] px-3 py-2 font-mono text-xs text-slate-900 dark:text-slate-100 focus:border-sky-500 dark:focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 optical-inset rounded-xl px-3.5 py-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              {isPrivate ? (
                <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>
                Auto-create repository as <strong>{isPrivate ? 'Private' : 'Public'}</strong> if missing
              </span>
            </div>

            <SoapBubbleToggle
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              aria-label="Create dedicated repository as private"
              color="#38bdf8"
              scale={0.65}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Optional commit message (e.g. chore: Stage 6 milestones & logs)"
              className="flex-1 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#050811] px-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-sky-500 dark:focus:border-sky-400 focus:outline-none"
            />

            <SoapBubbleButton
              type="submit"
              disabled={pushing}
              tint="rgb(16 185 129)"
              opacity={0.92}
              style={{ fontSize: 12 }}
              className="!min-h-[36px] !px-5 font-semibold text-white whitespace-nowrap shrink-0"
            >
              {pushing ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UploadCloud className="h-3.5 w-3.5" />
              )}
              <span>{pushing ? 'Uploading JSON...' : 'Push Progress JSON'}</span>
            </SoapBubbleButton>
          </div>
        </form>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 dark:bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-800 dark:text-rose-200">
          {errorMsg}
        </div>
      )}

      {pushResult && (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 dark:bg-emerald-950/30 p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-mono font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              {pushResult.createdRepo
                ? `Created ${pushResult.repoFullName} & uploaded progress JSON`
                : `Synced progress JSON to ${pushResult.repoFullName}`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 font-mono text-[11px]">
            <a
              href={pushResult.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-300 hover:underline"
            >
              <span>View Progress JSON</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            {pushResult.commitUrl && (
              <a
                href={pushResult.commitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 hover:underline"
              >
                <span>Commit {pushResult.commitSha.slice(0, 7)}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
