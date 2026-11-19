'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  Binary,
  CheckCircle2,
  ChevronRight,
  Code2,
  Cpu,
  Crown,
  Flame,
  FolderGit2,
  GitBranch,
  Layers,
  Lock,
  Medal,
  Rocket,
  Shield,
  Sparkles,
  Target,
  Terminal,
  Trophy,
  X,
  Zap,
  ArrowRight,
} from 'lucide-react';
import type { BadgeCategory, BadgeDefinition, BadgeTier, EvaluatedBadge } from '@/lib/badges-data';
import type { PrimaryWorkspace } from './Navbar';

interface BadgesCollectionProps {
  badges: EvaluatedBadge[];
  unlockedCount: number;
  totalCount: number;
  totalLinesOfCode?: number;
  totalBadgeXp?: number;
  currentStreak?: number;
  completedProjectsCount?: number;
  recentlyUnlockedIds?: string[];
  onDismissCelebration?: (badgeId?: string) => void;
  onNavigate: (workspace: PrimaryWorkspace, subTab?: string, stageId?: string) => void;
}

export const BADGE_ICON_MAP: Record<
  BadgeDefinition['iconName'],
  React.ComponentType<{ className?: string }>
> = {
  cpu: Cpu,
  target: Target,
  award: Award,
  trophy: Trophy,
  'folder-git': FolderGit2,
  rocket: Rocket,
  layers: Layers,
  crown: Crown,
  terminal: Terminal,
  shield: Shield,
  flame: Flame,
  code: Code2,
  'git-branch': GitBranch,
  binary: Binary,
  zap: Zap,
  sparkles: Sparkles,
};

export const TIER_STYLES: Record<
  BadgeTier,
  {
    border: string;
    glow: string;
    iconBg: string;
    iconText: string;
    tag: string;
    ring: string;
    bar: string;
    ribbon: string;
    rim: string;
    core: string;
    progressHex: string;
  }
> = {
  Bronze: {
    border: 'border-amber-500/45',
    glow: 'shadow-[0_6px_22px_-8px_rgba(217,119,6,0.4)]',
    iconBg: 'bg-gradient-to-br from-amber-500/20 to-orange-600/10 border-amber-500/45',
    iconText: 'text-amber-900 dark:text-amber-100',
    tag: 'text-amber-800 dark:text-amber-300 bg-amber-500/12 border-amber-500/35',
    ring: 'ring-amber-500/40',
    bar: 'from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400',
    ribbon: 'from-rose-600 via-amber-600 to-orange-500',
    rim: 'from-amber-300 via-amber-500 to-orange-700',
    core: 'from-amber-200 via-amber-400 to-orange-500 dark:from-amber-500/90 dark:via-amber-600/90 dark:to-orange-700/95',
    progressHex: '#f59e0b',
  },
  Silver: {
    border: 'border-sky-500/45',
    glow: 'shadow-[0_6px_22px_-8px_rgba(14,165,233,0.4)]',
    iconBg: 'bg-gradient-to-br from-sky-500/20 to-cyan-500/10 border-sky-500/45',
    iconText: 'text-sky-950 dark:text-sky-50',
    tag: 'text-sky-800 dark:text-sky-300 bg-sky-500/12 border-sky-500/35',
    ring: 'ring-sky-500/40',
    bar: 'from-sky-500 to-cyan-500 dark:from-sky-400 dark:to-cyan-300',
    ribbon: 'from-sky-600 via-cyan-600 to-indigo-600',
    rim: 'from-slate-200 via-sky-300 to-slate-500',
    core: 'from-white via-sky-200 to-slate-300 dark:from-sky-400/85 dark:via-slate-500/90 dark:to-sky-700/95',
    progressHex: '#0ea5e9',
  },
  Gold: {
    border: 'border-emerald-500/45',
    glow: 'shadow-[0_8px_26px_-8px_rgba(234,179,8,0.45)]',
    iconBg: 'bg-gradient-to-br from-emerald-500/20 to-amber-400/15 border-emerald-500/50',
    iconText: 'text-amber-950 dark:text-amber-50',
    tag: 'text-emerald-800 dark:text-emerald-300 bg-emerald-500/12 border-emerald-500/35',
    ring: 'ring-emerald-500/40',
    bar: 'from-emerald-500 to-amber-500 dark:from-emerald-400 dark:to-amber-300',
    ribbon: 'from-emerald-600 via-teal-600 to-sky-600',
    rim: 'from-yellow-200 via-amber-400 to-yellow-600',
    core: 'from-yellow-100 via-amber-300 to-yellow-500 dark:from-amber-400/95 dark:via-yellow-500/90 dark:to-amber-700/95',
    progressHex: '#10b981',
  },
  Obsidian: {
    border: 'border-fuchsia-500/45',
    glow: 'shadow-[0_8px_28px_-8px_rgba(192,38,211,0.45)]',
    iconBg: 'bg-gradient-to-br from-fuchsia-500/20 to-violet-600/15 border-fuchsia-500/50',
    iconText: 'text-fuchsia-50',
    tag: 'text-fuchsia-800 dark:text-fuchsia-300 bg-fuchsia-500/12 border-fuchsia-500/35',
    ring: 'ring-fuchsia-500/40',
    bar: 'from-fuchsia-500 to-violet-500 dark:from-fuchsia-400 dark:to-violet-400',
    ribbon: 'from-fuchsia-600 via-violet-600 to-indigo-700',
    rim: 'from-fuchsia-400 via-violet-500 to-slate-800',
    core: 'from-slate-800 via-violet-900 to-fuchsia-950',
    progressHex: '#d946ef',
  },
};

const CATEGORY_LABELS: Record<'all' | BadgeCategory, string> = {
  all: 'All Medals',
  streaks: 'Study Streaks',
  projects: 'Projects',
  milestones: 'Milestones',
  coding: 'Coding & Algos',
  shell: 'Shell',
  curriculum: 'Curriculum',
};

/**
 * Renders a layered metallic circular visual medal with top silk ribbons, concentric
 * stamped coin bezel, and radial progress arc when still locked.
 */
export function VisualMedalEmblem({
  iconName,
  tier,
  unlocked,
  progressPct = 0,
  size = 'md',
}: {
  iconName: BadgeDefinition['iconName'];
  tier: BadgeTier;
  unlocked: boolean;
  progressPct?: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const Icon = BADGE_ICON_MAP[iconName] || Award;
  const tierStyle = TIER_STYLES[tier];

  const dims =
    size === 'sm'
      ? { wrap: 'w-11 h-12', coin: 'h-9 w-9', inner: 'h-7 w-7', icon: 'h-4 w-4', ribbon: 'w-5 h-3.5' }
      : size === 'lg'
        ? { wrap: 'w-16 h-[70px]', coin: 'h-14 w-14', inner: 'h-11 w-11', icon: 'h-6 w-6', ribbon: 'w-8 h-5' }
        : { wrap: 'w-12 h-14', coin: 'h-11 w-11', inner: 'h-8 w-8', icon: 'h-[18px] w-[18px]', ribbon: 'w-6 h-4' };

  const clampedPct = Math.max(0, Math.min(100, progressPct));

  return (
    <div className={`relative flex flex-col items-center justify-end shrink-0 select-none ${dims.wrap}`}>
      {/* Top Medal Ribbon Drape */}
      <div
        aria-hidden="true"
        className={`absolute top-0 left-1/2 -translate-x-1/2 ${dims.ribbon} rounded-t-sm overflow-hidden flex shadow-xs transition-opacity ${
          unlocked ? 'opacity-100' : 'opacity-30 grayscale'
        }`}
      >
        <div className={`flex-1 bg-gradient-to-b ${tierStyle.ribbon}`} />
        <div className="w-[22%] bg-white/75 dark:bg-white/60" />
        <div className={`flex-1 bg-gradient-to-b ${tierStyle.ribbon}`} />
      </div>

      {/* Circular Medal Coin + Radial Progress Ring */}
      <div
        className={`relative z-10 flex items-center justify-center rounded-full p-[2.5px] transition-all ${dims.coin} ${
          unlocked
            ? `bg-gradient-to-br ${tierStyle.rim} ${tierStyle.glow}`
            : 'bg-slate-200 dark:bg-white/10'
        }`}
        style={
          !unlocked && clampedPct > 0
            ? {
                background: `conic-gradient(${tierStyle.progressHex} ${clampedPct * 3.6}deg, rgba(148,163,184,0.28) 0deg)`,
              }
            : undefined
        }
      >
        <div
          className={`flex items-center justify-center rounded-full w-full h-full border ${
            unlocked
              ? `bg-gradient-to-br ${tierStyle.core} border-white/70 dark:border-white/25`
              : 'bg-slate-100 dark:bg-[#0b1120] border-slate-300 dark:border-white/[0.08]'
          }`}
        >
          <div
            className={`relative flex items-center justify-center rounded-full border ${dims.inner} ${
              unlocked
                ? `border-white/55 dark:border-white/20 ${tierStyle.iconText}`
                : 'border-slate-200 dark:border-white/[0.06] text-slate-400 dark:text-slate-500'
            }`}
          >
            <Icon className={dims.icon} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BadgesCollection({
  badges,
  unlockedCount,
  totalCount,
  totalLinesOfCode = 0,
  totalBadgeXp = 0,
  currentStreak = 0,
  completedProjectsCount = 0,
  recentlyUnlockedIds = [],
  onDismissCelebration,
  onNavigate,
}: BadgesCollectionProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'earned' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | BadgeCategory>('all');
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);

  const earnedBadges = useMemo(() => badges.filter((b) => b.unlocked), [badges]);

  const recentlyUnlockedBadges = useMemo(() => {
    if (!recentlyUnlockedIds.length) return [];
    const idSet = new Set(recentlyUnlockedIds);
    return badges.filter((b) => idSet.has(b.id) && b.unlocked);
  }, [badges, recentlyUnlockedIds]);

  const spotlightBadge = useMemo(() => {
    if (selectedBadgeId) {
      const explicit = badges.find((b) => b.id === selectedBadgeId);
      if (explicit) return explicit;
    }
    if (recentlyUnlockedBadges.length > 0) {
      return recentlyUnlockedBadges[0];
    }
    const closestLocked = [...badges]
      .filter((b) => !b.unlocked)
      .sort((a, b) => b.progressPct - a.progressPct)[0];
    return closestLocked || earnedBadges[0] || badges[0];
  }, [badges, selectedBadgeId, recentlyUnlockedBadges, earnedBadges]);

  const filteredBadges = useMemo(() => {
    const filtered = badges.filter((badge) => {
      if (statusFilter === 'earned' && !badge.unlocked) return false;
      if (statusFilter === 'locked' && badge.unlocked) return false;
      if (categoryFilter !== 'all' && badge.category !== categoryFilter) return false;
      return true;
    });

    // Show unlocked medals first when viewing 'all', then high-progress locked ones
    return [...filtered].sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return b.progressPct - a.progressPct;
    });
  }, [badges, statusFilter, categoryFilter]);

  const streakTrackBadges = useMemo(
    () =>
      ['streak-3', 'streak-7', 'streak-14', 'habit-centurion']
        .map((id) => badges.find((b) => b.id === id))
        .filter((b): b is EvaluatedBadge => Boolean(b)),
    [badges]
  );

  const projectTrackBadges = useMemo(
    () =>
      ['shipping-engineer', 'portfolio-builder', 'capstone-master', 'capstone-legend']
        .map((id) => badges.find((b) => b.id === id))
        .filter((b): b is EvaluatedBadge => Boolean(b)),
    [badges]
  );

  const collectionPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <section
      id="badges-showcase"
      className="optical-panel rounded-2xl p-5 sm:p-6 space-y-5 relative overflow-hidden"
    >
      {/* Dynamic Unlock Celebration Toast Banner */}
      <AnimatePresence>
        {recentlyUnlockedBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border border-emerald-400/45 bg-gradient-to-r from-emerald-500/15 via-sky-500/10 to-amber-500/15 p-3.5 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <VisualMedalEmblem
                iconName={recentlyUnlockedBadges[0].iconName}
                tier={recentlyUnlockedBadges[0].tier}
                unlocked
                size="sm"
              />
              <div className="min-w-0">
                <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Visual Medal Unlocked!</span>
                </div>
                <div className="text-xs font-medium text-slate-900 dark:text-white truncate">
                  {recentlyUnlockedBadges.map((b) => `${b.title} (+${b.xpBonus} XP)`).join(' · ')}
                </div>
              </div>
            </div>

            {onDismissCelebration && (
              <button
                type="button"
                onClick={() => onDismissCelebration()}
                className="rounded-lg border border-slate-300 dark:border-white/10 bg-white/80 dark:bg-black/30 px-2.5 py-1 text-[11px] font-mono text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer inline-flex items-center gap-1"
                aria-label="Dismiss badge unlock celebration"
              >
                <X className="h-3 w-3" />
                <span>Dismiss</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Overall Mastery Strip */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-fuchsia-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 shrink-0 shadow-[0_0_24px_-6px_rgba(251,191,36,0.35)]">
            <Medal className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                Badges &amp; Visual Medals
              </h2>
              <span className="rounded-md border border-amber-500/35 bg-amber-500/12 px-2 py-0.5 text-[11px] font-mono font-semibold text-amber-800 dark:text-amber-300 tabular-nums">
                {unlockedCount} / {totalCount} Earned ({collectionPct}%)
              </span>
              <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-mono text-sky-800 dark:text-sky-300 tabular-nums">
                {totalLinesOfCode.toLocaleString()} LoC Logged
              </span>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-mono text-emerald-800 dark:text-emerald-300 tabular-nums">
                +{totalBadgeXp.toLocaleString()} Medal XP
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Unlock Bronze, Silver, Gold, and Obsidian visual medals by hitting study streak thresholds, shipping portfolio projects, and mastering systems challenges.
            </p>
          </div>
        </div>

        {/* Status + Category Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="optical-subnav flex rounded-xl p-1 text-[11px] font-medium">
            {(['all', 'earned', 'locked'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-lg transition-colors capitalize cursor-pointer border whitespace-nowrap shrink-0 ${
                  statusFilter === status
                    ? 'bg-sky-500/15 text-sky-800 dark:text-sky-200 border-sky-500/35 font-semibold'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="optical-inset flex flex-wrap rounded-xl p-1 text-[11px] font-medium">
            {(['all', 'streaks', 'projects', 'milestones', 'coding', 'shell', 'curriculum'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white dark:bg-white/12 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Master Collection Progress Bar */}
      <div className="space-y-1.5">
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden border border-slate-300/60 dark:border-white/[0.05]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${collectionPct}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-500 dark:from-amber-400 dark:via-sky-400 dark:to-emerald-400"
          />
        </div>
      </div>

      {/* Study Streak Thresholds & Project Milestone Tracks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <div className="optical-inset rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300">
              <Flame className="h-3.5 w-3.5" />
              <span>Study Streak Medal Ladder</span>
            </span>
            <span className="text-slate-600 dark:text-slate-400 tabular-nums">
              Current Streak: <strong className="text-slate-900 dark:text-white">{currentStreak}d</strong>
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {streakTrackBadges.map((b) => (
              <button
                key={`streak-step-${b.id}`}
                type="button"
                onClick={() => setSelectedBadgeId(b.id)}
                className={`rounded-lg border px-2 py-2 flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                  b.unlocked
                    ? 'bg-white dark:bg-white/[0.05] border-amber-500/40 shadow-xs'
                    : 'bg-slate-100/70 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.07] opacity-85 hover:opacity-100'
                }`}
              >
                <VisualMedalEmblem
                  iconName={b.iconName}
                  tier={b.tier}
                  unlocked={b.unlocked}
                  progressPct={b.progressPct}
                  size="sm"
                />
                <span className="text-[10px] font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  {b.target}d Streak
                </span>
                <span className="text-[9px] font-mono text-slate-500 tabular-nums">
                  {b.unlocked ? `+${b.xpBonus} XP` : `${b.progressPct}%`}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="optical-inset rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
              <Rocket className="h-3.5 w-3.5" />
              <span>Project Milestone Medal Ladder</span>
            </span>
            <span className="text-slate-600 dark:text-slate-400 tabular-nums">
              Shipped Builds: <strong className="text-slate-900 dark:text-white">{completedProjectsCount}</strong>
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {projectTrackBadges.map((b) => (
              <button
                key={`proj-step-${b.id}`}
                type="button"
                onClick={() => setSelectedBadgeId(b.id)}
                className={`rounded-lg border px-2 py-2 flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                  b.unlocked
                    ? 'bg-white dark:bg-white/[0.05] border-emerald-500/40 shadow-xs'
                    : 'bg-slate-100/70 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.07] opacity-85 hover:opacity-100'
                }`}
              >
                <VisualMedalEmblem
                  iconName={b.iconName}
                  tier={b.tier}
                  unlocked={b.unlocked}
                  progressPct={b.progressPct}
                  size="sm"
                />
                <span className="text-[10px] font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  {b.target} Build{b.target === 1 ? '' : 's'}
                </span>
                <span className="text-[9px] font-mono text-slate-500 tabular-nums">
                  {b.unlocked ? `+${b.xpBonus} XP` : `${b.progressPct}%`}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Trophy Ribbon + Spotlight Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Trophy Cabinet Ribbon (7 cols) */}
        <div className="lg:col-span-7 optical-inset rounded-xl p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Visual Medal Cabinet
            </span>
            <span className="text-slate-600 dark:text-slate-400 tabular-nums">
              {earnedBadges.length} active medal{earnedBadges.length === 1 ? '' : 's'} · click any medal to inspect
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {badges.map((badge) => {
              const isSelected = spotlightBadge?.id === badge.id;
              return (
                <motion.button
                  key={`shelf-${badge.id}`}
                  type="button"
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedBadgeId(badge.id)}
                  title={`${badge.title} (${badge.tier}) — ${
                    badge.unlocked ? 'Unlocked' : `${badge.current}/${badge.target}`
                  }`}
                  className={`relative rounded-xl p-1 transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-sky-500 dark:ring-sky-400 bg-sky-500/10'
                      : 'hover:bg-white/60 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <VisualMedalEmblem
                    iconName={badge.iconName}
                    tier={badge.tier}
                    unlocked={badge.unlocked}
                    progressPct={badge.progressPct}
                    size="sm"
                  />
                  {badge.unlocked ? (
                    <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white dark:text-slate-950 shadow z-20">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                    </span>
                  ) : (
                    badge.progressPct > 0 && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-white dark:bg-[#070b14] border border-slate-300 dark:border-white/15 px-1 text-[8px] font-mono text-sky-700 dark:text-sky-300 tabular-nums z-20">
                        {badge.progressPct}%
                      </span>
                    )
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Selected / Next Up Milestone Spotlight (5 cols) */}
        {spotlightBadge && (
          <div className="lg:col-span-5 optical-card rounded-xl p-4 flex flex-col justify-between gap-3">
            {(() => {
              const tierStyle = TIER_STYLES[spotlightBadge.tier];
              return (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <VisualMedalEmblem
                        iconName={spotlightBadge.iconName}
                        tier={spotlightBadge.tier}
                        unlocked={spotlightBadge.unlocked}
                        progressPct={spotlightBadge.progressPct}
                        size="lg"
                      />
                      <div className="min-w-0 pt-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-sky-700 dark:text-sky-400 font-semibold">
                            {spotlightBadge.unlocked ? 'Earned Medal' : 'Next Medal Target'}
                          </span>
                          <span className={`rounded border px-1.5 py-0.5 text-[9px] font-mono uppercase ${tierStyle.tag}`}>
                            {spotlightBadge.tier} · +{spotlightBadge.xpBonus} XP
                          </span>
                        </div>
                        <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                          {spotlightBadge.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {spotlightBadge.description}
                  </p>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-600 dark:text-slate-400">{spotlightBadge.requirementLabel}</span>
                      <span
                        className={`tabular-nums font-semibold ${
                          spotlightBadge.unlocked ? 'text-emerald-700 dark:text-emerald-300' : 'text-sky-700 dark:text-sky-300'
                        }`}
                      >
                        {spotlightBadge.current.toLocaleString()} / {spotlightBadge.target.toLocaleString()} ({spotlightBadge.progressPct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${tierStyle.bar} transition-all duration-500`}
                        style={{ width: `${spotlightBadge.progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono uppercase text-slate-500">
                      Category: {CATEGORY_LABELS[spotlightBadge.category]}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate(
                          spotlightBadge.actionWorkspace,
                          spotlightBadge.actionSubTab,
                          spotlightBadge.actionStageId
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-sky-500/35 bg-sky-500/15 hover:bg-sky-500/25 px-3 py-1 text-[11px] font-mono font-semibold text-sky-800 dark:text-sky-200 cursor-pointer transition-colors"
                    >
                      <span>{spotlightBadge.actionLabel}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Badge Grid */}
      {filteredBadges.length === 0 ? (
        <div className="optical-inset rounded-xl py-10 text-center text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <div>No medals match the active filter combination.</div>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setCategoryFilter('all');
            }}
            className="text-sky-700 dark:text-sky-400 hover:underline font-mono cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredBadges.map((badge) => {
            const tierStyle = TIER_STYLES[badge.tier];
            const isRecent = recentlyUnlockedIds.includes(badge.id);
            const isSelected = spotlightBadge?.id === badge.id;
            const unlockedDate = badge.unlockedAt
              ? new Date(badge.unlockedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : null;

            return (
              <motion.div
                key={badge.id}
                layout
                whileHover={{ y: -2 }}
                transition={{ duration: 0.16 }}
                onClick={() => setSelectedBadgeId(badge.id)}
                className={`rounded-2xl border p-4 flex flex-col justify-between gap-3.5 transition-all cursor-pointer ${
                  badge.unlocked
                    ? `optical-card ${tierStyle.border} ${tierStyle.glow}`
                    : 'optical-inset opacity-90 hover:opacity-100'
                } ${isRecent ? 'ring-1 ring-emerald-500/60' : isSelected ? 'ring-1 ring-sky-500/50' : ''}`}
              >
                <div className="space-y-3">
                  {/* Top Row: Visual Medal Emblem + Tier */}
                  <div className="flex items-start justify-between gap-2">
                    <VisualMedalEmblem
                      iconName={badge.iconName}
                      tier={badge.tier}
                      unlocked={badge.unlocked}
                      progressPct={badge.progressPct}
                      size="md"
                    />

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                          badge.unlocked
                            ? tierStyle.tag
                            : 'border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-white/[0.03] text-slate-500'
                        }`}
                      >
                        {badge.tier}
                      </span>
                      {badge.unlocked ? (
                        <CheckCircle2
                          className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                          aria-label="Earned"
                        />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" aria-label="Locked" />
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`font-display text-sm font-semibold ${
                          badge.unlocked ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {badge.title}
                      </h3>
                      <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300/90 tabular-nums shrink-0 font-semibold">
                        +{badge.xpBonus} XP
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                </div>

                {/* Footer Progress / Action */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/[0.07]">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-600 dark:text-slate-400 truncate pr-2">{badge.requirementLabel}</span>
                    <span
                      className={`tabular-nums font-semibold shrink-0 ${
                        badge.unlocked ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {badge.current.toLocaleString()}/{badge.target.toLocaleString()}
                    </span>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${
                        badge.unlocked ? tierStyle.bar : 'from-sky-500/80 to-cyan-500/70'
                      }`}
                      style={{ width: `${badge.progressPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-0.5 text-[10px] font-mono">
                    {badge.unlocked ? (
                      <span className="text-emerald-700 dark:text-emerald-400/90">
                        {unlockedDate ? `Earned ${unlockedDate}` : 'Unlocked'}
                      </span>
                    ) : (
                      <span className="text-slate-500 uppercase">
                        {CATEGORY_LABELS[badge.category]}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(badge.actionWorkspace, badge.actionSubTab, badge.actionStageId);
                      }}
                      className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300 cursor-pointer font-semibold"
                    >
                      <span>{badge.actionLabel}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
