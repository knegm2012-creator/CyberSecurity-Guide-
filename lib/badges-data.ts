import { STAGES_DATA } from './curriculum-data.ts';

export type BadgeCategory =
  | 'milestones'
  | 'streaks'
  | 'coding'
  | 'projects'
  | 'shell'
  | 'curriculum';
export type BadgeTier = 'Bronze' | 'Silver' | 'Gold' | 'Obsidian';

export interface BadgeProgressSnapshot {
  completedTopics: Record<string, boolean>;
  solvedBanditLevels: number[];
  projectStatuses: Record<string, 'not_started' | 'in_progress' | 'completed'>;
  userMilestones: Array<{ completed: boolean }>;
  savedSnippets: Array<{
    id: string;
    code?: string;
    language?: 'python' | 'c' | 'bash';
    tags?: string[];
  }>;
  completedDailyChallenges?: Record<string, boolean>;
  studyLogs: Array<{ date: string; minutes: number }>;
  earnedBadges?: Record<string, string>;
  currentStreak: number;
  linesOfCodeExecuted?: number;
  codeRunsCount?: number;
  recursionRunsCount?: number;
  cPointerRunsCount?: number;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  requirementLabel: string;
  category: BadgeCategory;
  tier: BadgeTier;
  xpBonus: number;
  iconName:
    | 'cpu'
    | 'target'
    | 'award'
    | 'trophy'
    | 'folder-git'
    | 'rocket'
    | 'layers'
    | 'crown'
    | 'terminal'
    | 'shield'
    | 'flame'
    | 'code'
    | 'git-branch'
    | 'binary'
    | 'zap'
    | 'sparkles';
  actionWorkspace: 'overview' | 'curriculum' | 'lab' | 'shell';
  actionSubTab?: string;
  actionStageId?: string;
  actionLabel: string;
  evaluate: (snap: BadgeProgressSnapshot) => { current: number; target: number };
}

export interface EvaluatedBadge {
  id: string;
  title: string;
  description: string;
  requirementLabel: string;
  category: BadgeCategory;
  tier: BadgeTier;
  xpBonus: number;
  iconName: BadgeDefinition['iconName'];
  actionWorkspace: BadgeDefinition['actionWorkspace'];
  actionSubTab?: string;
  actionStageId?: string;
  actionLabel: string;
  current: number;
  target: number;
  progressPct: number;
  unlocked: boolean;
  unlockedAt?: string;
}

const RECURSION_ALGO_TOPIC_IDS = ['s12-t1', 's12-t3', 's12-t4'] as const;
const C_POINTER_TOPIC_IDS = ['s6-t2', 's6-t4', 's6-t5'] as const;
const C_IGNORED_IDENTIFIERS = new Set([
  'if',
  'for',
  'while',
  'switch',
  'return',
  'sizeof',
  'main',
  'printf',
  'scanf',
  'fprintf',
  'malloc',
  'calloc',
  'realloc',
  'free',
  'strlen',
  'strcpy',
  'strncpy',
  'memcpy',
  'memset',
]);

/**
 * Counts non-empty lines of code across a snippet or playground submission.
 */
export function countNonEmptyLines(code: string | undefined | null): number {
  if (!code || typeof code !== 'string') return 0;
  return code
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0).length;
}

/**
 * Inspects Python or C source code for genuine direct recursion (a function invoking itself).
 */
export function detectRecursiveCode(code: string | undefined | null, language?: 'python' | 'c' | 'bash'): boolean {
  if (!code || typeof code !== 'string' || language === 'bash') return false;
  const lines = code.split(/\r?\n/);

  if (language === 'python' || (!language && /\bdef\s+[A-Za-z_]\w*\s*\(/.test(code))) {
    for (let i = 0; i < lines.length; i++) {
      const defMatch = lines[i].match(/^(\s*)def\s+([A-Za-z_]\w*)\s*\(/);
      if (!defMatch) continue;
      const baseIndent = defMatch[1].length;
      const fnName = defMatch[2];
      if (fnName === 'main' || fnName.startsWith('__')) continue;

      const callRegex = new RegExp(`\\b${fnName}\\s*\\(`);
      for (let j = i + 1; j < lines.length; j++) {
        const raw = lines[j];
        const trimmed = raw.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const indentMatch = raw.match(/^(\s*)/);
        const currentIndent = indentMatch ? indentMatch[1].length : 0;
        if (currentIndent <= baseIndent) break;
        const codeOnly = trimmed.split('#')[0];
        if (callRegex.test(codeOnly)) {
          return true;
        }
      }
    }
  }

  if (language === 'c' || (!language && /#include|[;{}]/.test(code))) {
    const fnDeclRegex =
      /\b(?:int|long|unsigned|char|void|float|double|size_t|bool)\s+\*?\s*([A-Za-z_]\w*)\s*\([^;{}]*\)\s*\{/g;
    let match: RegExpExecArray | null;
    while ((match = fnDeclRegex.exec(code)) !== null) {
      const fnName = match[1];
      if (C_IGNORED_IDENTIFIERS.has(fnName)) continue;

      const bodyStart = match.index + match[0].length;
      let depth = 1;
      let cursor = bodyStart;
      while (cursor < code.length && depth > 0) {
        const ch = code[cursor];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        cursor++;
      }
      const body = code.slice(bodyStart, Math.max(bodyStart, cursor - 1));
      const cleanBody = body
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/"(?:\\.|[^"\\])*"/g, '""');
      const callRegex = new RegExp(`\\b${fnName}\\s*\\(`);
      if (callRegex.test(cleanBody)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detects genuine C pointer / heap allocation usage.
 */
export function detectPointerUsage(code: string | undefined | null, language?: 'python' | 'c' | 'bash'): boolean {
  if (!code || typeof code !== 'string' || language === 'python' || language === 'bash') return false;
  return /\b(?:malloc|calloc|realloc|free)\s*\(/.test(code) || /\*\s*[A-Za-z_]\w*/.test(code) && /&[A-Za-z_]\w*/.test(code);
}

/**
 * Computes total lines of code contributed across persisted runs and saved snippets.
 */
export function computeTotalLinesOfCode(snap: BadgeProgressSnapshot): number {
  const executed = Math.max(0, Math.floor(snap.linesOfCodeExecuted ?? 0));
  const saved = (snap.savedSnippets || []).reduce(
    (sum, snippet) => sum + countNonEmptyLines(snippet.code),
    0
  );
  return executed + saved;
}

function countCompletedTopicsForStage(completedTopics: Record<string, boolean>, stageId: string): number {
  const stage = STAGES_DATA.find((s) => s.id === stageId);
  if (!stage) return 0;
  return stage.topics.filter((t) => Boolean(completedTopics[t.id])).length;
}

function countFullStagesMastered(completedTopics: Record<string, boolean>): number {
  return STAGES_DATA.filter(
    (s) => s.topics.length > 0 && s.topics.every((t) => Boolean(completedTopics[t.id]))
  ).length;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'wasm-spark',
    title: 'WASM Code Ignition',
    description: 'Compile or execute your first Python or C11 program in the Systems Code Playground.',
    requirementLabel: 'Run or save 1 code program',
    category: 'coding',
    tier: 'Bronze',
    xpBonus: 50,
    iconName: 'zap',
    actionWorkspace: 'lab',
    actionSubTab: 'playground',
    actionLabel: 'Open Code Lab',
    evaluate: (snap) => ({
      current: Math.max(0, snap.codeRunsCount ?? 0) + snap.savedSnippets.length,
      target: 1,
    }),
  },
  {
    id: 'first-1000-loc',
    title: 'First 1000 Lines of Code',
    description: 'Write, execute, and save 1,000 non-empty lines of Python and C11 code across your Systems Lab sessions.',
    requirementLabel: 'Write & run 1,000 lines',
    category: 'coding',
    tier: 'Gold',
    xpBonus: 250,
    iconName: 'code',
    actionWorkspace: 'lab',
    actionSubTab: 'playground',
    actionLabel: 'Write Code',
    evaluate: (snap) => ({
      current: computeTotalLinesOfCode(snap),
      target: 1000,
    }),
  },
  {
    id: 'master-of-recursion',
    title: 'Master of Recursion',
    description: 'Write and execute recursive functions in Python or C alongside Stage 12 recurrence & DP mastery.',
    requirementLabel: 'Run recursive code & master S12 topics',
    category: 'coding',
    tier: 'Obsidian',
    xpBonus: 350,
    iconName: 'git-branch',
    actionWorkspace: 'lab',
    actionSubTab: 'playground',
    actionStageId: 'stage-12',
    actionLabel: 'Practice Recursion',
    evaluate: (snap) => {
      const algoTopicsDone = RECURSION_ALGO_TOPIC_IDS.filter((id) =>
        Boolean(snap.completedTopics[id])
      ).length;
      const recursiveSnippets = (snap.savedSnippets || []).filter((s) =>
        detectRecursiveCode(s.code, s.language)
      ).length;
      const recursionRuns = Math.max(0, snap.recursionRunsCount ?? 0);
      const recursionCodeSignals = recursionRuns + recursiveSnippets;

      // Require at least 1 real recursive execution or saved recursive snippet paired with
      // Stage 12 recursion/DP mastery (or 2+ recursive code experiments + 1 topic).
      const topicContribution = Math.min(2, algoTopicsDone);
      const codeContribution = Math.min(2, recursionCodeSignals);
      return {
        current: Math.min(3, topicContribution + codeContribution),
        target: 3,
      };
    },
  },
  {
    id: 'pointer-surgeon',
    title: 'Memory & Pointer Surgeon',
    description: 'Trace stack/heap addresses, execute C pointer & malloc code in WASM, and complete Stage 6 topics.',
    requirementLabel: 'Run C pointer code & Stage 6 topics',
    category: 'coding',
    tier: 'Silver',
    xpBonus: 150,
    iconName: 'binary',
    actionWorkspace: 'lab',
    actionSubTab: 'memory',
    actionStageId: 'stage-6',
    actionLabel: 'Inspect Pointers',
    evaluate: (snap) => {
      const pointerTopicsDone = C_POINTER_TOPIC_IDS.filter((id) =>
        Boolean(snap.completedTopics[id])
      ).length;
      const pointerSnippets = (snap.savedSnippets || []).filter((s) =>
        detectPointerUsage(s.code, s.language)
      ).length;
      const pointerRuns = Math.max(0, snap.cPointerRunsCount ?? 0);
      return {
        current: Math.min(3, Math.min(2, pointerTopicsDone) + Math.min(2, pointerRuns + pointerSnippets)),
        target: 3,
      };
    },
  },
  {
    id: 'milestone-spark',
    title: 'First Milestone',
    description: 'Set an objective and cross your first engineering milestone across the finish line.',
    requirementLabel: 'Complete 1 milestone',
    category: 'milestones',
    tier: 'Bronze',
    xpBonus: 50,
    iconName: 'target',
    actionWorkspace: 'overview',
    actionLabel: 'View Milestones',
    evaluate: (snap) => ({
      current: snap.userMilestones.filter((m) => m.completed).length,
      target: 1,
    }),
  },
  {
    id: 'milestone-hunter',
    title: 'Milestone Hunter',
    description: 'Build sustained engineering momentum by clearing three distinct study milestones.',
    requirementLabel: 'Complete 3 milestones',
    category: 'milestones',
    tier: 'Silver',
    xpBonus: 100,
    iconName: 'award',
    actionWorkspace: 'overview',
    actionLabel: 'Track Milestones',
    evaluate: (snap) => ({
      current: snap.userMilestones.filter((m) => m.completed).length,
      target: 3,
    }),
  },
  {
    id: 'milestone-architect',
    title: 'Goal Architect',
    description: 'Prove long-horizon discipline by completing five custom or roadmap milestones.',
    requirementLabel: 'Complete 5 milestones',
    category: 'milestones',
    tier: 'Gold',
    xpBonus: 200,
    iconName: 'trophy',
    actionWorkspace: 'overview',
    actionLabel: 'Add Milestone',
    evaluate: (snap) => ({
      current: snap.userMilestones.filter((m) => m.completed).length,
      target: 5,
    }),
  },
  {
    id: 'daily-cadence',
    title: 'Consistent Cadence',
    description: 'Maintain active study consistency through daily logs or multi-day study momentum.',
    requirementLabel: '3-day streak or 3 logs',
    category: 'milestones',
    tier: 'Silver',
    xpBonus: 100,
    iconName: 'flame',
    actionWorkspace: 'overview',
    actionLabel: 'Log Practice',
    evaluate: (snap) => ({
      current: Math.max(snap.currentStreak, snap.studyLogs.length),
      target: 3,
    }),
  },
  {
    id: 'streak-3',
    title: '3-Day Ignition Medal',
    description: 'Sustain an unbroken 3-day consecutive study streak to forge daily systems focus.',
    requirementLabel: 'Reach a 3-day study streak',
    category: 'streaks',
    tier: 'Bronze',
    xpBonus: 75,
    iconName: 'flame',
    actionWorkspace: 'overview',
    actionLabel: 'Log Today',
    evaluate: (snap) => ({
      current: snap.currentStreak,
      target: 3,
    }),
  },
  {
    id: 'streak-7',
    title: '7-Day Focus Laureate',
    description: 'Hold an unbroken 7-day consecutive study streak across an entire week of engineering.',
    requirementLabel: 'Reach a 7-day study streak',
    category: 'streaks',
    tier: 'Silver',
    xpBonus: 175,
    iconName: 'flame',
    actionWorkspace: 'overview',
    actionLabel: 'Keep Streak',
    evaluate: (snap) => ({
      current: snap.currentStreak,
      target: 7,
    }),
  },
  {
    id: 'streak-14',
    title: '14-Day Iron Discipline',
    description: 'Two full weeks of daily deliberate practice without missing a single calendar day.',
    requirementLabel: 'Reach a 14-day study streak',
    category: 'streaks',
    tier: 'Gold',
    xpBonus: 300,
    iconName: 'award',
    actionWorkspace: 'overview',
    actionLabel: 'View Streaks',
    evaluate: (snap) => ({
      current: snap.currentStreak,
      target: 14,
    }),
  },
  {
    id: 'habit-centurion',
    title: '30-Day Habit Guardian',
    description: 'Build unstoppable engineering stamina with 30 unique study days or a 30-day unbroken streak.',
    requirementLabel: '30-day streak or 30 active days',
    category: 'streaks',
    tier: 'Obsidian',
    xpBonus: 450,
    iconName: 'sparkles',
    actionWorkspace: 'overview',
    actionLabel: 'View Habit Grid',
    evaluate: (snap) => {
      const uniqueDays = new Set((snap.studyLogs || []).map((l) => l.date).filter(Boolean)).size;
      return {
        current: Math.max(snap.currentStreak, uniqueDays),
        target: 30,
      };
    },
  },
  {
    id: 'first-blueprint',
    title: 'Project Blueprint',
    description: 'Kick off hands-on engineering work by starting your first portfolio build.',
    requirementLabel: 'Start 1 portfolio project',
    category: 'projects',
    tier: 'Bronze',
    xpBonus: 50,
    iconName: 'folder-git',
    actionWorkspace: 'curriculum',
    actionSubTab: 'projects',
    actionLabel: 'Open Projects',
    evaluate: (snap) => ({
      current: Object.values(snap.projectStatuses).filter(
        (s) => s === 'in_progress' || s === 'completed'
      ).length,
      target: 1,
    }),
  },
  {
    id: 'shipping-engineer',
    title: 'Shipping Engineer',
    description: 'Move from tutorials to shipped artifacts by finishing a full portfolio project.',
    requirementLabel: 'Complete 1 portfolio project',
    category: 'projects',
    tier: 'Silver',
    xpBonus: 120,
    iconName: 'rocket',
    actionWorkspace: 'curriculum',
    actionSubTab: 'projects',
    actionLabel: 'Complete Project',
    evaluate: (snap) => ({
      current: Object.values(snap.projectStatuses).filter((s) => s === 'completed').length,
      target: 1,
    }),
  },
  {
    id: 'portfolio-builder',
    title: 'Portfolio Architect',
    description: 'Deliver three documented projects demonstrating real systems, web, or security skill.',
    requirementLabel: 'Complete 3 portfolio projects',
    category: 'projects',
    tier: 'Gold',
    xpBonus: 220,
    iconName: 'layers',
    actionWorkspace: 'curriculum',
    actionSubTab: 'projects',
    actionLabel: 'Build Portfolio',
    evaluate: (snap) => ({
      current: Object.values(snap.projectStatuses).filter((s) => s === 'completed').length,
      target: 3,
    }),
  },
  {
    id: 'capstone-master',
    title: 'Principal Builder',
    description: 'Establish a deep engineering portfolio with six completed capstone implementations.',
    requirementLabel: 'Complete 6 portfolio projects',
    category: 'projects',
    tier: 'Gold',
    xpBonus: 300,
    iconName: 'crown',
    actionWorkspace: 'curriculum',
    actionSubTab: 'projects',
    actionLabel: 'View Capstones',
    evaluate: (snap) => ({
      current: Object.values(snap.projectStatuses).filter((s) => s === 'completed').length,
      target: 6,
    }),
  },
  {
    id: 'capstone-legend',
    title: 'Grand Systems Laureate',
    description: 'Ship ten documented portfolio projects across OS internals, compilers, networking, and security.',
    requirementLabel: 'Complete 10 portfolio projects',
    category: 'projects',
    tier: 'Obsidian',
    xpBonus: 500,
    iconName: 'trophy',
    actionWorkspace: 'curriculum',
    actionSubTab: 'projects',
    actionLabel: 'Ship Capstones',
    evaluate: (snap) => ({
      current: Object.values(snap.projectStatuses).filter((s) => s === 'completed').length,
      target: 10,
    }),
  },
  {
    id: 'shell-operator',
    title: 'Shell Operator',
    description: 'Navigate hidden files, pipes, and dashed filenames to clear three wargame levels.',
    requirementLabel: 'Clear 3 wargame levels',
    category: 'shell',
    tier: 'Bronze',
    xpBonus: 75,
    iconName: 'terminal',
    actionWorkspace: 'shell',
    actionLabel: 'Open Shell',
    evaluate: (snap) => ({
      current: snap.solvedBanditLevels.length,
      target: 3,
    }),
  },
  {
    id: 'citadel-breacher',
    title: 'Citadel Breacher',
    description: 'Master grep pipelines, encodings, SSH keys, and binary inspection across eight levels.',
    requirementLabel: 'Clear 8 wargame levels',
    category: 'shell',
    tier: 'Gold',
    xpBonus: 225,
    iconName: 'shield',
    actionWorkspace: 'shell',
    actionLabel: 'Play Wargame',
    evaluate: (snap) => ({
      current: snap.solvedBanditLevels.length,
      target: 8,
    }),
  },
  {
    id: 'bitwise-initiate',
    title: 'Bitwise Initiate',
    description: 'Build hardware intuition by mastering Stage 0 digital and binary foundations.',
    requirementLabel: 'Complete all Stage 0 topics',
    category: 'curriculum',
    tier: 'Bronze',
    xpBonus: 75,
    iconName: 'cpu',
    actionWorkspace: 'curriculum',
    actionSubTab: 'stages',
    actionStageId: 'stage-0',
    actionLabel: 'Study Stage 0',
    evaluate: (snap) => {
      const stage0Total = STAGES_DATA[0]?.topics.length || 3;
      return {
        current: countCompletedTopicsForStage(snap.completedTopics, 'stage-0'),
        target: stage0Total,
      };
    },
  },
  {
    id: 'systems-polymath',
    title: 'Systems Polymath',
    description: 'Combine full-stage theoretical mastery with saved code experiments in the sandbox.',
    requirementLabel: 'Master 2 full stages & save 1 snippet',
    category: 'curriculum',
    tier: 'Obsidian',
    xpBonus: 300,
    iconName: 'code',
    actionWorkspace: 'lab',
    actionSubTab: 'playground',
    actionLabel: 'Open Code Lab',
    evaluate: (snap) => {
      const fullStages = countFullStagesMastered(snap.completedTopics);
      const hasSnippet = snap.savedSnippets.length > 0 ? 1 : 0;
      return {
        current: Math.min(2, fullStages) + hasSnippet,
        target: 3,
      };
    },
  },
  {
    id: 'az-hero-master',
    title: 'A–Z Odyssey Hero',
    description: 'Reach summit mastery by clearing Cloud SRE (Stage 14) and AI & HPC (Stage 15), or completing 8 full stages.',
    requirementLabel: 'Complete S14 & S15 or 8 stages',
    category: 'curriculum',
    tier: 'Obsidian',
    xpBonus: 500,
    iconName: 'crown',
    actionWorkspace: 'curriculum',
    actionSubTab: 'atlas',
    actionLabel: 'Open A–Z Atlas',
    evaluate: (snap) => {
      const fullStages = countFullStagesMastered(snap.completedTopics);
      const s14 = STAGES_DATA.find((s) => s.id === 'stage-14');
      const s15 = STAGES_DATA.find((s) => s.id === 'stage-15');
      const s14Done = Boolean(s14 && s14.topics.every((t) => Boolean(snap.completedTopics[t.id])));
      const s15Done = Boolean(s15 && s15.topics.every((t) => Boolean(snap.completedTopics[t.id])));
      if (s14Done && s15Done) {
        return { current: 8, target: 8 };
      }
      return { current: Math.min(8, fullStages), target: 8 };
    },
  },
];

export const VALID_BADGE_IDS = new Set(BADGE_DEFINITIONS.map((b) => b.id));

export function evaluateBadges(snapshot: BadgeProgressSnapshot): {
  badges: EvaluatedBadge[];
  unlockedCount: number;
  totalCount: number;
  newlyUnlockedIds: string[];
  totalLinesOfCode: number;
  totalBadgeXp: number;
} {
  const persisted = snapshot.earnedBadges || {};
  const newlyUnlockedIds: string[] = [];
  const totalLinesOfCode = computeTotalLinesOfCode(snapshot);

  const badges: EvaluatedBadge[] = BADGE_DEFINITIONS.map((def) => {
    const { current, target } = def.evaluate(snapshot);
    const safeTarget = Math.max(1, target);
    const clampedCurrent = Math.max(0, Math.min(safeTarget, current));
    const criteriaMet = current >= safeTarget;
    const unlockedAt = persisted[def.id];
    const unlocked = criteriaMet || Boolean(unlockedAt);

    if (criteriaMet && !unlockedAt) {
      newlyUnlockedIds.push(def.id);
    }

    return {
      id: def.id,
      title: def.title,
      description: def.description,
      requirementLabel: def.requirementLabel,
      category: def.category,
      tier: def.tier,
      xpBonus: def.xpBonus,
      iconName: def.iconName,
      actionWorkspace: def.actionWorkspace,
      actionSubTab: def.actionSubTab,
      actionStageId: def.actionStageId,
      actionLabel: def.actionLabel,
      current: unlocked ? safeTarget : clampedCurrent,
      target: safeTarget,
      progressPct: unlocked ? 100 : Math.round((clampedCurrent / safeTarget) * 100),
      unlocked,
      unlockedAt,
    };
  });

  const totalBadgeXp = badges
    .filter((b) => b.unlocked)
    .reduce((sum, b) => sum + b.xpBonus, 0);

  return {
    badges,
    unlockedCount: badges.filter((b) => b.unlocked).length,
    totalCount: badges.length,
    newlyUnlockedIds,
    totalLinesOfCode,
    totalBadgeXp,
  };
}
