/**
 * CS Odyssey Client-Safe Security & Logic Hardening Module
 * 
 * Provides browser-safe utilities with zero Node built-in dependencies:
 * - Terminal ANSI & stream sanitization
 * - Virtual filesystem path canonicalization (anti-traversal)
 * - State and storage invariant validation
 */

// ============================================================================
// 1. TERMINAL ANSI & STREAM SANITIZATION
// ============================================================================

/**
 * Sanitizes terminal output to prevent terminal injection vulnerabilities:
 * - Strips OSC (Operating System Command) sequences (e.g. title changes, hyperlinks, clipboard commands).
 * - Strips DCS (Device Control String) and APC / PM sequences.
 * - Strips dangerous terminal mode sequences (DEC private modes, alternate screens).
 * - Strips null bytes (\0) and unprintable ASCII control characters except \n, \r, \t, and standard ANSI color SGRs.
 * - Normalizes Windows CRLF to standard LF.
 */
export function sanitizeTerminalOutput(rawText: string): string {
  if (!rawText) return '';

  let sanitized = rawText;

  // 1. Remove OSC escape sequences: ESC ] ... (ST | BEL)
  sanitized = sanitized.replace(/\x1b\][\s\S]*?(?:\x1b\\|\x07)/g, '');

  // 2. Remove DCS, SOS, PM, APC sequences: ESC [PXZ_] ... ESC \
  sanitized = sanitized.replace(/\x1b[PXZ_][\s\S]*?\x1b\\/g, '');

  // 3. Remove dangerous CSI sequences (cursor jumps, screen clears, private mode resets)
  // Preserving only standard SGR color formatting: ESC [ <codes> m
  sanitized = sanitized.replace(/\x1b\[([0-9;]*[a-zA-Z])/g, (match, code) => {
    if (code.endsWith('m')) {
      return match;
    }
    return '';
  });

  // 4. Strip single ESC codes that are standalone
  sanitized = sanitized.replace(/\x1b[^[\]PXZ_a-zA-Z0-9]/g, '');

  // 5. Remove null bytes and non-printable control characters except \r, \n, \t, and \x1b
  sanitized = sanitized.replace(/[\x00-\x08\x0b\x0c\x0e-\x1a\x1c-\x1f\x7f]/g, '');

  // 6. Normalize newlines
  sanitized = sanitized.replace(/\r\n/g, '\n');

  return sanitized;
}

/**
 * Strips all ANSI escape sequences completely for plain-text representations or logs.
 */
export function stripAllAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}

// ============================================================================
// 2. VIRTUAL FILESYSTEM PATH CANONICALIZATION (ANTI-PATH-TRAVERSAL)
// ============================================================================

/**
 * Resolves a simulated filesystem path given current working path segments and a user input string.
 * Strictly prevents path traversal attacks (e.g. '../../../../etc/passwd' or null byte injection).
 * 
 * Returns canonical array of path segments relative to root:
 * e.g. ['home', 'bandit0'] -> '/home/bandit0'
 */
export function resolveVirtualPath(currentSegments: string[], rawTarget: string): string[] {
  if (!rawTarget || !rawTarget.trim()) {
    return [...currentSegments];
  }

  // Reject null bytes
  if (rawTarget.includes('\0')) {
    throw new Error('Invalid path: null byte detected.');
  }

  const target = rawTarget.trim();

  // Root start
  const isAbsolute = target.startsWith('/');
  const rawParts = target.split('/').filter(Boolean);

  const stack: string[] = isAbsolute ? [] : [...currentSegments];

  for (const part of rawParts) {
    if (part === '.' || part === '') {
      continue;
    }
    if (part === '..') {
      if (stack.length > 0) {
        stack.pop();
      }
      // If stack is empty, remain at root (/) - cannot traverse above root!
      continue;
    }
    // Disallow path segments with invalid or dangerous characters
    if (part.includes('\\') || part.includes(':')) {
      throw new Error(`Invalid path segment: '${part}'`);
    }
    stack.push(part);
  }

  return stack;
}

// ============================================================================
// 3. STORE & STATE INVARIANT VALIDATION
// ============================================================================

/**
 * Validates and sanitizes imported or deserialized OdysseyStore state.
 * Prevents prototype pollution and state corruption.
 */
export function sanitizeOdysseyStoreState(rawState: unknown): Record<string, any> {
  if (!rawState || typeof rawState !== 'object' || Array.isArray(rawState)) {
    throw new Error('State must be a non-null object');
  }

  // Prevent prototype pollution
  const keys = Object.keys(rawState as object);
  for (const key of keys) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      throw new Error(`Prototype pollution attempt detected via property: ${key}`);
    }
  }

  const state = rawState as Record<string, any>;

  // Sanitize and validate solvedBanditLevels: must be array of non-negative integers
  let solvedBanditLevels: number[] = [0];
  if (Array.isArray(state.solvedBanditLevels)) {
    solvedBanditLevels = state.solvedBanditLevels
      .filter((lvl) => typeof lvl === 'number' && Number.isInteger(lvl) && lvl >= 0 && lvl <= 50);
    if (!solvedBanditLevels.includes(0)) solvedBanditLevels.unshift(0);
  }

  // Sanitize dailyGoalMinutes: between 10 and 360
  const dailyGoalMinutes = typeof state.dailyGoalMinutes === 'number'
    ? Math.max(10, Math.min(360, Math.floor(state.dailyGoalMinutes)))
    : 30;

  // Sanitize banditPasswords: safe map of level to string
  const banditPasswords: Record<number, string> = { 0: 'bandit0' };
  if (state.banditPasswords && typeof state.banditPasswords === 'object') {
    for (const [k, v] of Object.entries(state.banditPasswords)) {
      const num = parseInt(k, 10);
      if (!isNaN(num) && num >= 0 && num <= 50 && typeof v === 'string') {
        banditPasswords[num] = v.trim().slice(0, 100);
      }
    }
  }

  // Sanitize earnedBadges: safe map of badge ID -> ISO timestamp
  const earnedBadges: Record<string, string> = {};
  if (state.earnedBadges && typeof state.earnedBadges === 'object' && !Array.isArray(state.earnedBadges)) {
    for (const [badgeId, timestamp] of Object.entries(state.earnedBadges)) {
      if (
        /^[a-z0-9-]{2,48}$/.test(badgeId) &&
        typeof timestamp === 'string' &&
        timestamp.length <= 40
      ) {
        earnedBadges[badgeId] = timestamp;
      }
    }
  }

  // Sanitize stageTargetDates: safe map of stage-0..stage-15 -> YYYY-MM-DD
  const stageTargetDates: Record<string, string> = {};
  if (state.stageTargetDates && typeof state.stageTargetDates === 'object' && !Array.isArray(state.stageTargetDates)) {
    for (const [stageId, dateVal] of Object.entries(state.stageTargetDates)) {
      if (
        /^stage-([0-9]|1[0-5])$/.test(stageId) &&
        typeof dateVal === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())
      ) {
        stageTargetDates[stageId] = dateVal.trim();
      }
    }
  }

  const autoLogTopicPractice =
    typeof state.autoLogTopicPractice === 'boolean' ? state.autoLogTopicPractice : true;

  const catchUpNotificationsEnabled =
    typeof state.catchUpNotificationsEnabled === 'boolean'
      ? state.catchUpNotificationsEnabled
      : true;

  const mentorCompanionEnabled =
    typeof state.mentorCompanionEnabled === 'boolean'
      ? state.mentorCompanionEnabled
      : true;

  const mentorDailyLimit =
    typeof state.mentorDailyLimit === 'number' && Number.isFinite(state.mentorDailyLimit)
      ? Math.max(5, Math.min(500, Math.floor(state.mentorDailyLimit)))
      : 50;

  const lastOpenedAt =
    typeof state.lastOpenedAt === 'string' &&
    state.lastOpenedAt.length <= 40 &&
    !Number.isNaN(Date.parse(state.lastOpenedAt))
      ? state.lastOpenedAt
      : undefined;

  // Helper for boolean map sanitization
  const sanitizeBoolMap = (raw: unknown): Record<string, boolean> | undefined => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
    const out: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (/^[a-zA-Z0-9_-]{1,64}$/.test(k) && typeof v === 'boolean') {
        out[k] = v;
      }
    }
    return out;
  };

  const completedTopics = sanitizeBoolMap(state.completedTopics);
  const completedExitChecks = sanitizeBoolMap(state.completedExitChecks);
  const completedDailyChallenges = sanitizeBoolMap(state.completedDailyChallenges);

  // Helper for bounded non-negative integers
  const sanitizeBoundedInt = (raw: unknown, max: number): number => {
    if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) return 0;
    return Math.min(max, Math.floor(raw));
  };

  const linesOfCodeExecuted = sanitizeBoundedInt(state.linesOfCodeExecuted, 10_000_000);
  const codeRunsCount = sanitizeBoundedInt(state.codeRunsCount, 1_000_000);
  const recursionRunsCount = sanitizeBoundedInt(state.recursionRunsCount, 1_000_000);
  const cPointerRunsCount = sanitizeBoundedInt(state.cPointerRunsCount, 1_000_000);

  // Sanitize workspaceMinutes map across valid primary workspaces
  const validWorkspaces = new Set(['overview', 'curriculum', 'lab', 'shell', 'reference']);
  const workspaceMinutes: Record<string, number> = {};
  if (state.workspaceMinutes && typeof state.workspaceMinutes === 'object' && !Array.isArray(state.workspaceMinutes)) {
    for (const [ws, mins] of Object.entries(state.workspaceMinutes)) {
      if (validWorkspaces.has(ws)) {
        workspaceMinutes[ws] = sanitizeBoundedInt(mins, 100_000);
      }
    }
  }

  // Sanitize projectStatuses: allowlisted status enum with bounded IDs
  const projectStatuses: Record<string, 'not_started' | 'in_progress' | 'completed'> = {};
  if (state.projectStatuses && typeof state.projectStatuses === 'object' && !Array.isArray(state.projectStatuses)) {
    for (const [projId, status] of Object.entries(state.projectStatuses)) {
      if (
        /^[a-zA-Z0-9_-]{1,48}$/.test(projId) &&
        (status === 'not_started' || status === 'in_progress' || status === 'completed')
      ) {
        projectStatuses[projId] = status;
      }
    }
  }

  // Helper for bounded string maps (notes)
  const sanitizeStringMap = (
    raw: unknown,
    keyPattern: RegExp,
    maxEntries = 100,
    maxValLen = 20_000
  ): Record<string, string> => {
    const out: Record<string, string> = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
    let count = 0;
    for (const [k, v] of Object.entries(raw)) {
      if (count >= maxEntries) break;
      if (keyPattern.test(k) && typeof v === 'string') {
        out[k] = v.slice(0, maxValLen);
        count++;
      }
    }
    return out;
  };

  const projectNotes = sanitizeStringMap(state.projectNotes, /^[a-zA-Z0-9_-]{1,48}$/);
  const stageNotes = sanitizeStringMap(state.stageNotes, /^stage-([0-9]|1[0-5])$/);

  // Sanitize userMilestones
  const validMilestoneCats = new Set(['basics', 'algorithms', 'systems', 'bandit', 'projects', 'custom']);
  const userMilestones = Array.isArray(state.userMilestones)
    ? state.userMilestones
        .filter((m) => m && typeof m === 'object' && !Array.isArray(m))
        .slice(0, 100)
        .map((m: Record<string, unknown>, idx: number) => ({
          id: typeof m.id === 'string' && m.id.trim() ? m.id.slice(0, 64) : `ms-${idx}`,
          title: typeof m.title === 'string' ? m.title.slice(0, 200) : 'Milestone',
          category:
            typeof m.category === 'string' && validMilestoneCats.has(m.category)
              ? (m.category as 'basics' | 'algorithms' | 'systems' | 'bandit' | 'projects' | 'custom')
              : 'custom',
          ...(typeof m.targetDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(m.targetDate)
            ? { targetDate: m.targetDate }
            : {}),
          completed: typeof m.completed === 'boolean' ? m.completed : false,
          ...(typeof m.completedAt === 'string' ? { completedAt: m.completedAt.slice(0, 40) } : {}),
          ...(typeof m.stageId === 'string' && /^stage-([0-9]|1[0-5])$/.test(m.stageId)
            ? { stageId: m.stageId }
            : {}),
          xpReward: sanitizeBoundedInt(m.xpReward, 1000),
        }))
    : undefined;

  // Sanitize weeklyReviews
  const weeklyReviews = Array.isArray(state.weeklyReviews)
    ? state.weeklyReviews
        .filter((r) => r && typeof r === 'object' && !Array.isArray(r))
        .slice(0, 104)
        .map((r: Record<string, unknown>, idx: number) => ({
          id: typeof r.id === 'string' && r.id.trim() ? r.id.slice(0, 64) : `rev-${idx}`,
          weekNum: sanitizeBoundedInt(r.weekNum, 520),
          date:
            typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date)
              ? r.date
              : new Date().toISOString().split('T')[0],
          built: typeof r.built === 'string' ? r.built.slice(0, 2000) : '',
          explained: typeof r.explained === 'string' ? r.explained.slice(0, 2000) : '',
          stuck: typeof r.stuck === 'string' ? r.stuck.slice(0, 2000) : '',
          evidence: typeof r.evidence === 'string' ? r.evidence.slice(0, 2000) : '',
          weakest: typeof r.weakest === 'string' ? r.weakest.slice(0, 1000) : '',
          topTasks: typeof r.topTasks === 'string' ? r.topTasks.slice(0, 2000) : '',
        }))
    : undefined;

  // Sanitize savedSnippets array if present
  const savedSnippets = Array.isArray(state.savedSnippets)
    ? state.savedSnippets
        .filter((s) => s && typeof s === 'object' && !Array.isArray(s))
        .slice(0, 200)
        .map((s: Record<string, unknown>, idx: number) => ({
          id: typeof s.id === 'string' && s.id.trim() ? s.id.slice(0, 64) : `snip-${idx}`,
          title:
            typeof s.title === 'string' && s.title.trim()
              ? s.title.slice(0, 140)
              : 'Saved Snippet',
          language: s.language === 'c' ? 'c' : s.language === 'bash' ? 'bash' : 'python',
          code: typeof s.code === 'string' ? s.code.slice(0, 65_536) : '',
          createdAt:
            typeof s.createdAt === 'string' ? s.createdAt.slice(0, 40) : new Date().toISOString(),
          updatedAt:
            typeof s.updatedAt === 'string' ? s.updatedAt.slice(0, 40) : new Date().toISOString(),
          tags: Array.isArray(s.tags)
            ? s.tags
                .filter((t): t is string => typeof t === 'string')
                .slice(0, 8)
                .map((t) => t.slice(0, 32))
            : [],
        }))
    : undefined;

  // Sanitize studyLogs array if provided
  const studyLogs = Array.isArray(state.studyLogs)
    ? state.studyLogs
        .filter((l) => l && typeof l === 'object' && !Array.isArray(l))
        .slice(0, 500)
        .map((l: Record<string, unknown>, idx: number) => ({
          id: typeof l.id === 'string' ? l.id.slice(0, 64) : `log-${idx}`,
          date:
            typeof l.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(l.date)
              ? l.date
              : new Date().toISOString().split('T')[0],
          minutes:
            typeof l.minutes === 'number' && Number.isFinite(l.minutes)
              ? Math.max(1, Math.min(1440, Math.floor(l.minutes)))
              : 30,
          stageId:
            typeof l.stageId === 'string' && /^stage-([0-9]|1[0-5])$/.test(l.stageId)
              ? l.stageId
              : 'stage-0',
          notes: typeof l.notes === 'string' ? l.notes.slice(0, 1000) : '',
        }))
    : undefined;

  const mentorHistory = Array.isArray(state.mentorHistory)
    ? state.mentorHistory
        .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
        .slice(0, 100)
        .map((item: Record<string, unknown>, idx: number) => ({
          id: typeof item.id === 'string' && item.id.trim() ? item.id.slice(0, 64) : `mr-${idx}`,
          mode:
            typeof item.mode === 'string' && /^[a-z0-9_]{1,24}$/.test(item.mode)
              ? item.mode
              : 'companion',
          stageId:
            typeof item.stageId === 'string' && /^stage-([0-9]|1[0-5])$/.test(item.stageId)
              ? item.stageId
              : 'stage-0',
          ...(typeof item.workspace === 'string' && validWorkspaces.has(item.workspace)
            ? { workspace: item.workspace }
            : {}),
          prompt: typeof item.prompt === 'string' ? item.prompt.slice(0, 2000) : '',
          response: typeof item.response === 'string' ? item.response.slice(0, 12000) : '',
          source: typeof item.source === 'string' ? item.source.slice(0, 32) : 'local',
          ...(Array.isArray(item.sources)
            ? {
                sources: item.sources
                  .filter(
                    (s): s is { title: string; uri: string } =>
                      Boolean(
                        s &&
                          typeof s === 'object' &&
                          typeof (s as { uri?: unknown }).uri === 'string' &&
                          /^https?:\/\//i.test((s as { uri: string }).uri)
                      )
                  )
                  .slice(0, 6)
                  .map((s) => ({
                    title: typeof s.title === 'string' ? s.title.slice(0, 120) : 'Reference',
                    uri: s.uri.slice(0, 500),
                  })),
              }
            : {}),
          createdAt:
            typeof item.createdAt === 'string'
              ? item.createdAt.slice(0, 40)
              : new Date().toISOString(),
          pinned: item.pinned === true,
        }))
        .filter((item) => item.prompt.length > 0 || item.response.length > 0)
    : undefined;

  const startDate =
    typeof state.startDate === 'string' && state.startDate.length <= 40
      ? state.startDate
      : new Date().toISOString();

  return {
    solvedBanditLevels,
    dailyGoalMinutes,
    banditPasswords,
    earnedBadges,
    stageTargetDates,
    autoLogTopicPractice,
    catchUpNotificationsEnabled,
    mentorCompanionEnabled,
    mentorDailyLimit,
    ...(lastOpenedAt ? { lastOpenedAt } : {}),
    linesOfCodeExecuted,
    codeRunsCount,
    recursionRunsCount,
    cPointerRunsCount,
    projectStatuses,
    projectNotes,
    stageNotes,
    startDate,
    ...(Object.keys(workspaceMinutes).length > 0 ? { workspaceMinutes } : {}),
    ...(userMilestones ? { userMilestones } : {}),
    ...(weeklyReviews ? { weeklyReviews } : {}),
    ...(savedSnippets ? { savedSnippets } : {}),
    ...(mentorHistory ? { mentorHistory } : {}),
    ...(completedTopics ? { completedTopics } : {}),
    ...(completedExitChecks ? { completedExitChecks } : {}),
    ...(completedDailyChallenges ? { completedDailyChallenges } : {}),
    ...(studyLogs ? { studyLogs } : {}),
  };
}
