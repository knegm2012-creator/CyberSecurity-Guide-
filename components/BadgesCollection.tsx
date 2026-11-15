'use client';

import React, { useState, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  Code2,
  Cpu,
  Crown,
  Flame,
  FolderGit2,
  Layers,
  Lock,
  Rocket,
  Shield,
  Target,
  Terminal,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import type { BadgeCategory, BadgeDefinition, BadgeTier, EvaluatedBadge } from '@/lib/badges-data';
import type { PrimaryWorkspace } from './Navbar';

interface BadgesCollectionProps {
  badges: EvaluatedBadge[];
  unlockedCount: number;
  totalCount: number;
  onNavigate: (workspace: PrimaryWorkspace, subTab?: string, stageId?: string) => void;
}

const BADGE_ICON_MAP: Record<BadgeDefinition['iconName'], React.ComponentType<{ className?: string }>> = {
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
};

const TIER_STYLES: Record<
  BadgeTier,
  { border: string; iconBg: string; iconText: string; tag: string }
> = {
  Bronze: {
    border: 'border-amber-500/35',
    iconBg: 'bg-amber-500/15 border-amber-400/35',
    iconText: 'text-amber-300',
    tag: 'text-amber-300 bg-amber-500/12 border-amber-400/30',
  },
  Silver: {
    border: 'border-sky-400/35',
    iconBg: 'bg-sky-500/15 border-sky-400/35',
    iconText: 'text-sky-300',
    tag: 'text-sky-300 bg-sky-500/12 border-sky-400/30',
  },
  Gold: {
    border: 'border-emerald-400/40',
    iconBg: 'bg-emerald-500/15 border-emerald-400/35',
    iconText: 'text-emerald-300',
    tag: 'text-emerald-300 bg-emerald-500/12 border-emerald-400/30',
  },
  Obsidian: {
    border: 'border-fuchsia-400/40',
    iconBg: 'bg-fuchsia-500/15 border-fuchsia-400/35',
    iconText: 'text-fuchsia-300',
    tag: 'text-fuchsia-300 bg-fuchsia-500/12 border-fuchsia-400/30',
  },
};

const CATEGORY_LABELS: Record<'all' | BadgeCategory, string> = {
  all: 'All',
  milestones: 'Milestones',
  projects: 'Projects',
  shell: 'Shell',
  curriculum: 'Curriculum',
};

export function BadgesCollection({
  badges,
  unlockedCount,
  totalCount,
  onNavigate,
}: BadgesCollectionProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'earned' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | BadgeCategory>('all');

  const filteredBadges = useMemo(() => {
    return badges.filter((badge) => {
      if (statusFilter === 'earned' && !badge.unlocked) return false;
      if (statusFilter === 'locked' && badge.unlocked) return false;
      if (categoryFilter !== 'all' && badge.category !== categoryFilter) return false;
      return true;
    });
  }, [badges, statusFilter, categoryFilter]);

  const collectionPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <section className="optical-panel rounded-2xl p-5 sm:p-6 space-y-5">
      {/* Header & Overall Mastery Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300 shrink-0 shadow-[0_0_20px_-6px_rgba(251,191,36,0.4)]">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-display text-base font-semibold text-white">
                Engineering Badges Collection
              </h2>
              <span className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-mono font-semibold text-amber-300 tabular-nums">
                {unlockedCount} / {totalCount} Earned ({collectionPct}%)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automatically awarded as you complete engineering milestones, ship portfolio builds, and clear wargame levels.
            </p>
          </div>
        </div>

        {/* Status + Category Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="optical-subnav flex rounded-xl p-1 text-[11px] font-medium">
            {(['all', 'earned', 'locked'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-lg transition-colors capitalize cursor-pointer border ${
                  statusFilter === status
                    ? 'bg-sky-500/18 text-sky-200 border-sky-400/35 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="optical-inset flex rounded-xl p-1 text-[11px] font-medium">
            {(['all', 'milestones', 'projects', 'shell', 'curriculum'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-sky-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${collectionPct}%` }}
          />
        </div>
      </div>

      {/* Badge Grid */}
      {filteredBadges.length === 0 ? (
        <div className="optical-inset rounded-xl py-10 text-center text-xs text-slate-400 space-y-2">
          <div>No badges match the active filter combination.</div>
          <button
            onClick={() => {
              setStatusFilter('all');
              setCategoryFilter('all');
            }}
            className="text-sky-400 hover:underline font-mono cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredBadges.map((badge) => {
            const Icon = BADGE_ICON_MAP[badge.iconName] || Award;
            const tierStyle = TIER_STYLES[badge.tier];
            const unlockedDate = badge.unlockedAt
              ? new Date(badge.unlockedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : null;

            return (
              <div
                key={badge.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between gap-3.5 transition-all ${
                  badge.unlocked
                    ? `optical-card ${tierStyle.border} bg-gradient-to-b from-white/[0.05] to-[#050811]/90`
                    : 'optical-inset border-white/[0.07] opacity-80 hover:opacity-100'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Row: Medallion + Tier */}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                        badge.unlocked
                          ? `${tierStyle.iconBg} ${tierStyle.iconText}`
                          : 'bg-white/[0.03] border-white/[0.08] text-slate-500'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                          badge.unlocked
                            ? tierStyle.tag
                            : 'border-white/[0.08] bg-white/[0.03] text-slate-500'
                        }`}
                      >
                        {badge.tier}
                      </span>
                      {badge.unlocked ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-label="Earned" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" aria-label="Locked" />
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3
                      className={`font-display text-sm font-semibold ${
                        badge.unlocked ? 'text-white' : 'text-slate-300'
                      }`}
                    >
                      {badge.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                </div>

                {/* Footer Progress / Action */}
                <div className="space-y-2 pt-2 border-t border-white/[0.07]">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400 truncate pr-2">{badge.requirementLabel}</span>
                    <span
                      className={`tabular-nums font-semibold shrink-0 ${
                        badge.unlocked ? 'text-emerald-400' : 'text-slate-300'
                      }`}
                    >
                      {badge.current}/{badge.target}
                    </span>
                  </div>

                  <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        badge.unlocked ? 'bg-emerald-400' : 'bg-sky-400/70'
                      }`}
                      style={{ width: `${badge.progressPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-0.5 text-[10px] font-mono">
                    {badge.unlocked ? (
                      <span className="text-emerald-400/90">
                        {unlockedDate ? `Earned ${unlockedDate}` : 'Unlocked'}
                      </span>
                    ) : (
                      <span className="text-slate-500 uppercase">{badge.category}</span>
                    )}

                    <button
                      onClick={() => onNavigate(badge.actionWorkspace, badge.actionSubTab)}
                      className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 cursor-pointer"
                    >
                      <span>{badge.actionLabel}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
