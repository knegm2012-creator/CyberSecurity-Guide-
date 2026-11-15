import { STAGES_DATA } from './curriculum-data.ts';

export type BadgeCategory = 'milestones' | 'projects' | 'shell' | 'curriculum';
export type BadgeTier = 'Bronze' | 'Silver' | 'Gold' | 'Obsidian';

export interface BadgeProgressSnapshot {
  completedTopics: Record<string, boolean>;
  solvedBanditLevels: number[];
  projectStatuses: Record<string, 'not_started' | 'in_progress' | 'completed'>;
  userMilestones: Array<{ completed: boolean }>;
  savedSnippets: Array<{ id: string }>;
  completedDailyChallenges?: Record<string, boolean>;
  studyLogs: Array<{ date: string; minutes: number }>;
  earnedBadges?: Record<string, string>;
  currentStreak: number;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  requirementLabel: string;
  category: BadgeCategory;
  tier: BadgeTier;
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
    | 'code';
  actionWorkspace: 'overview' | 'curriculum' | 'lab' | 'shell';
  actionSubTab?: string;
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
  iconName: BadgeDefinition['iconName'];
  actionWorkspace: BadgeDefinition['actionWorkspace'];
  actionSubTab?: string;
  actionLabel: string;
  current: number;
  target: number;
  progressPct: number;
  unlocked: boolean;
  unlockedAt?: string;
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
    id: 'milestone-spark',
    title: 'First Milestone',
    description: 'Set an objective and cross your first engineering milestone across the finish line.',
    requirementLabel: 'Complete 1 milestone',
    category: 'milestones',
    tier: 'Bronze',
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
    description: 'Maintain active study consistency through daily streaks or micro-challenges.',
    requirementLabel: '3-day streak or 3 logs',
    category: 'milestones',
    tier: 'Silver',
    iconName: 'flame',
    actionWorkspace: 'overview',
    actionLabel: 'Log Practice',
    evaluate: (snap) => ({
      current: Math.max(snap.currentStreak, snap.studyLogs.length),
      target: 3,
    }),
  },
  {
    id: 'first-blueprint',
    title: 'Project Blueprint',
    description: 'Kick off hands-on engineering work by starting your first portfolio build.',
    requirementLabel: 'Start 1 portfolio project',
    category: 'projects',
    tier: 'Bronze',
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
    tier: 'Obsidian',
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
    id: 'shell-operator',
    title: 'Shell Operator',
    description: 'Navigate hidden files, pipes, and dashed filenames to clear three wargame levels.',
    requirementLabel: 'Clear 3 wargame levels',
    category: 'shell',
    tier: 'Bronze',
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
    iconName: 'cpu',
    actionWorkspace: 'curriculum',
    actionSubTab: 'stages',
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
} {
  const persisted = snapshot.earnedBadges || {};
  const newlyUnlockedIds: string[] = [];

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
      iconName: def.iconName,
      actionWorkspace: def.actionWorkspace,
      actionSubTab: def.actionSubTab,
      actionLabel: def.actionLabel,
      current: unlocked ? safeTarget : clampedCurrent,
      target: safeTarget,
      progressPct: unlocked ? 100 : Math.round((clampedCurrent / safeTarget) * 100),
      unlocked,
      unlockedAt,
    };
  });

  return {
    badges,
    unlockedCount: badges.filter((b) => b.unlocked).length,
    totalCount: badges.length,
    newlyUnlockedIds,
  };
}
