import { NextRequest, NextResponse } from 'next/server';
import {
  apiSecurityHeaders,
  getClientIp,
  parseJsonBodySafe,
  RequestBodyError,
  sanitizeOdysseyStoreState,
} from '@/lib/security';
import {
  DEFAULT_PROGRESS_FILE,
  DEFAULT_PROGRESS_REPO,
  fetchGitHubApi,
  getAuthenticatedGitHubSession,
  githubSyncRateLimiter,
  validateBranchName,
  validateRepoFilePath,
  validateRepoName,
} from '@/lib/github-oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GitHubPushBody {
  repoName?: string;
  filePath?: string;
  branch?: string;
  isPrivate?: boolean;
  commitMessage?: string;
  summary?: {
    completedTopicsCount?: number;
    totalTopicsCount?: number;
    completedProjectsCount?: number;
    banditCount?: number;
    totalMinutesLogged?: number;
    xp?: number;
    levelNumber?: number;
    heroTitle?: string;
    currentStreak?: number;
  };
  progressData?: unknown;
}

export async function POST(req: NextRequest) {
  const headers = apiSecurityHeaders();
  const clientIp = getClientIp(req);

  if (!githubSyncRateLimiter.tryConsume(clientIp).allowed) {
    return NextResponse.json(
      { error: 'Too many GitHub sync requests. Please wait a minute and retry.' },
      { status: 429, headers }
    );
  }

  const session = getAuthenticatedGitHubSession(req);
  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated with GitHub. Connect your GitHub account via OAuth first.' },
      { status: 401, headers }
    );
  }

  try {
    const body = await parseJsonBodySafe<GitHubPushBody>(req, 512 * 1024);

    const repoName = validateRepoName(body.repoName ?? DEFAULT_PROGRESS_REPO);
    if (!repoName) {
      return NextResponse.json(
        { error: 'Invalid repository name. Use letters, numbers, dots, underscores, or hyphens.' },
        { status: 400, headers }
      );
    }

    const filePath = validateRepoFilePath(body.filePath ?? DEFAULT_PROGRESS_FILE);
    if (!filePath) {
      return NextResponse.json(
        { error: 'Invalid progress file path. Must be a safe relative .json path.' },
        { status: 400, headers }
      );
    }

    const isPrivate = body.isPrivate !== false;
    const rawState = body.progressData && typeof body.progressData === 'object' ? body.progressData : {};
    const sanitizedProgress = sanitizeOdysseyStoreState(rawState);

    const owner = session.login;
    const accessToken = session.accessToken;

    // 1. Check whether dedicated progress repository exists; create it automatically if missing
    let createdRepo = false;
    let targetBranch = validateBranchName(body.branch);

    const repoCheckRes = await fetchGitHubApi(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}`,
      accessToken
    );

    if (repoCheckRes.status === 404) {
      const createRes = await fetchGitHubApi('https://api.github.com/user/repos', accessToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: repoName,
          description:
            'CS Odyssey Learning Progress Backup — completed curriculum topics, capstone project notes, and study logs.',
          private: isPrivate,
          auto_init: true,
        }),
      });

      if (!createRes.ok) {
        const errPayload = (await createRes.json().catch(() => ({}))) as { message?: string };
        return NextResponse.json(
          {
            error:
              errPayload.message ||
              `Failed to create repository "${repoName}" (${createRes.status}). Ensure your GitHub OAuth app has "repo" scope.`,
          },
          { status: createRes.status === 401 || createRes.status === 403 ? 403 : 502, headers }
        );
      }

      const createdJson = (await createRes.json()) as { default_branch?: string };
      targetBranch = createdJson.default_branch || 'main';
      createdRepo = true;
    } else if (!repoCheckRes.ok) {
      return NextResponse.json(
        { error: `Unable to inspect repository (${repoCheckRes.status}). Try reconnecting GitHub.` },
        { status: repoCheckRes.status === 401 ? 401 : 502, headers }
      );
    } else {
      const existingRepo = (await repoCheckRes.json()) as { default_branch?: string };
      if (!body.branch && existingRepo.default_branch) {
        targetBranch = existingRepo.default_branch;
      }
    }

    // 2. Check for existing file SHA to perform idempotent update
    const encodedPath = filePath
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/');

    const existingFileRes = await fetchGitHubApi(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
        repoName
      )}/contents/${encodedPath}?ref=${encodeURIComponent(targetBranch)}`,
      accessToken
    );

    let existingSha: string | undefined;
    if (existingFileRes.ok) {
      const existingFile = (await existingFileRes.json()) as { sha?: string };
      if (typeof existingFile.sha === 'string') {
        existingSha = existingFile.sha;
      }
    }

    // 3. Assemble clean portable JSON archive containing topics, project notes, study logs, and summary
    const exportedAt = new Date().toISOString();
    const archivePayload = {
      schemaVersion: 'cs-odyssey-progress-v1',
      exportedAt,
      githubUser: owner,
      summary: body.summary || {
        completedTopicsCount: Object.keys(sanitizedProgress.completedTopics).length,
        completedProjectsCount: Object.values(sanitizedProgress.projectStatuses).filter(
          (s) => s === 'completed'
        ).length,
        studyLogsCount: sanitizedProgress.studyLogs.length,
        banditCount: sanitizedProgress.solvedBanditLevels.length,
      },
      progress: sanitizedProgress,
    };

    const jsonText = JSON.stringify(archivePayload, null, 2) + '\n';
    const contentBase64 = Buffer.from(jsonText, 'utf8').toString('base64');

    const safeCommitMessage =
      typeof body.commitMessage === 'string' && body.commitMessage.trim().length > 0
        ? body.commitMessage.trim().slice(0, 140)
        : `chore(progress): sync CS Odyssey progress (${exportedAt.split('T')[0]})`;

    const putRes = await fetchGitHubApi(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
        repoName
      )}/contents/${encodedPath}`,
      accessToken,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: safeCommitMessage,
          content: contentBase64,
          branch: targetBranch,
          ...(existingSha ? { sha: existingSha } : {}),
        }),
      }
    );

    if (!putRes.ok) {
      const putErr = (await putRes.json().catch(() => ({}))) as { message?: string };
      return NextResponse.json(
        {
          error: putErr.message || `Failed to upload progress JSON to GitHub (${putRes.status}).`,
        },
        { status: putRes.status === 409 ? 409 : 502, headers }
      );
    }

    const putResult = (await putRes.json()) as {
      content?: { html_url?: string; path?: string };
      commit?: { sha?: string; html_url?: string };
    };

    return NextResponse.json(
      {
        ok: true,
        createdRepo,
        repoFullName: `${owner}/${repoName}`,
        branch: targetBranch,
        filePath,
        repositoryUrl: `https://github.com/${owner}/${repoName}`,
        fileUrl: putResult.content?.html_url || `https://github.com/${owner}/${repoName}/blob/${targetBranch}/${filePath}`,
        commitSha: putResult.commit?.sha || '',
        commitUrl: putResult.commit?.html_url || '',
        pushedAt: exportedAt,
      },
      { headers }
    );
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'GitHub push failed unexpectedly.' },
      { status: 500, headers }
    );
  }
}
