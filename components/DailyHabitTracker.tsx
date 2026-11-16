'use client';

import React, { useState, useMemo } from 'react';
import { Flame, CheckCircle2, Plus, Trophy, Calendar } from 'lucide-react';
import type { CadenceDayCell } from '@/hooks/use-odyssey-store';

interface DailyHabitTrackerProps {
  last30Days: CadenceDayCell[];
  currentStreak: number;
  longestStreak30: number;
  goalDays30: number;
  dailyGoalMinutes: number;
  todayMinutesLogged: number;
  currentStageId: string;
  onQuickLog: (minutes: number, stageId: string, notes: string) => void;
}

export function DailyHabitTracker({
  last30Days,
  currentStreak,
  longestStreak30,
  goalDays30,
  dailyGoalMinutes,
  todayMinutesLogged,
  currentStageId,
  onQuickLog,
}: DailyHabitTrackerProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxMinutes = useMemo(() => {
    const peak = Math.max(dailyGoalMinutes, ...last30Days.map((d) => d.minutes));
    return Math.max(30, peak);
  }, [last30Days, dailyGoalMinutes]);

  const activeDays30 = useMemo(
    () => last30Days.filter((d) => d.minutes > 0).length,
    [last30Days]
  );

  const totalMinutes30 = useMemo(
    () => last30Days.reduce((acc, d) => acc + d.minutes, 0),
    [last30Days]
  );

  const consistencyPct = Math.round((activeDays30 / 30) * 100);
  const goalPctToday = Math.min(
    100,
    Math.round((todayMinutesLogged / Math.max(1, dailyGoalMinutes)) * 100)
  );

  const focusedCell =
    hoveredIdx !== null && last30Days[hoveredIdx]
      ? last30Days[hoveredIdx]
      : last30Days[last30Days.length - 1];

  const goalLineBottomPct = Math.min(92, Math.round((dailyGoalMinutes / maxMinutes) * 100));

  return (
    <section
      className="optical-panel rounded-2xl p-5 space-y-4"
      aria-label="Daily Habit Tracker - 30-Day Streak Chart"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
        <div className="flex items-center gap-2.5">
          <Flame className="h-4 w-4 text-amber-400 shrink-0" />
          <div>
            <h2 className="font-display text-sm font-semibold text-white">
              Daily Habit Tracker · 30-Day Streak Chart
            </h2>
            <p className="text-[11px] text-slate-400">
              Visual 30-day momentum against your {dailyGoalMinutes}m daily study target
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <button
            type="button"
            onClick={() => onQuickLog(15, currentStageId, 'Daily Habit Check-In (+15m)')}
            className="optical-card inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-slate-200 hover:text-white cursor-pointer whitespace-nowrap tabular-nums"
          >
            <Plus className="h-3 w-3 text-emerald-400" />
            <span>15m Check-In</span>
          </button>
          <button
            type="button"
            onClick={() => onQuickLog(30, currentStageId, 'Deep Habit Block (+30m)')}
            className="optical-card inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-cyan-300 hover:text-white cursor-pointer whitespace-nowrap tabular-nums"
          >
            <Plus className="h-3 w-3 text-cyan-400" />
            <span>30m Deep Work</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono tabular-nums">
        <div className="optical-inset rounded-xl px-3 py-2.5">
          <div className="text-[10px] text-slate-500 uppercase">Current Streak</div>
          <div className="text-base font-bold text-amber-400 mt-0.5 flex items-center gap-1.5">
            <span>{currentStreak}d</span>
            <span className="text-[10px] font-normal text-slate-400">active</span>
          </div>
        </div>

        <div className="optical-inset rounded-xl px-3 py-2.5">
          <div className="text-[10px] text-slate-500 uppercase">Best 30d Run</div>
          <div className="text-base font-bold text-white mt-0.5 flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-sky-400" />
            <span>{longestStreak30}d</span>
          </div>
        </div>

        <div className="optical-inset rounded-xl px-3 py-2.5">
          <div className="text-[10px] text-slate-500 uppercase">30d Consistency</div>
          <div className="text-base font-bold text-emerald-400 mt-0.5">
            {consistencyPct}%{' '}
            <span className="text-[10px] font-normal text-slate-400">
              ({activeDays30}/30d)
            </span>
          </div>
        </div>

        <div className="optical-inset rounded-xl px-3 py-2.5">
          <div className="text-[10px] text-slate-500 uppercase">Goal Hit / Today</div>
          <div className="text-base font-bold text-cyan-300 mt-0.5">
            {goalDays30}d{' '}
            <span className="text-[10px] font-normal text-slate-400">
              · {goalPctToday}% today
            </span>
          </div>
        </div>
      </div>

      {/* 30-Day Vertical Streak Bar Chart */}
      <div className="optical-inset rounded-xl p-4 space-y-2.5">
        <div className="relative h-32 flex items-end gap-1 pt-4">
          {/* Daily Goal Dashed Reference Line */}
          <div
            className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-sky-400/45 z-10 flex justify-end"
            style={{ bottom: `${goalLineBottomPct}%` }}
          >
            <span className="text-[9px] font-mono text-sky-300 bg-[#050812]/90 px-1.5 -translate-y-2.5 rounded">
              Goal {dailyGoalMinutes}m
            </span>
          </div>

          {last30Days.map((day, idx) => {
            const heightPct =
              day.minutes > 0 ? Math.max(10, Math.round((day.minutes / maxMinutes) * 100)) : 5;
            const barTone =
              day.minutes === 0
                ? 'bg-white/[0.06] hover:bg-white/[0.14]'
                : day.goalMet
                ? 'bg-emerald-400/85 hover:bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.28)]'
                : 'bg-sky-400/75 hover:bg-sky-300';

            return (
              <button
                key={day.dateStr}
                type="button"
                onMouseEnter={() => setHoveredIdx(idx)}
                onFocus={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                aria-label={`${day.dateStr}: ${day.minutes} minutes`}
                className="group flex-1 h-full flex flex-col justify-end items-center cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-full rounded-t-sm transition-all duration-200 ${barTone} ${
                    day.isToday ? 'ring-1 ring-amber-300' : ''
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </button>
            );
          })}
        </div>

        {/* X-Axis Labels + Active Day Inspector */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06] text-[11px] font-mono">
          <div className="flex items-center gap-2 text-slate-400 tabular-nums">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>{last30Days[0]?.dateStr}</span>
            <span>to</span>
            <span className="text-slate-200">{last30Days[last30Days.length - 1]?.dateStr}</span>
          </div>

          {focusedCell && (
            <div className="flex items-center gap-2 text-slate-200 tabular-nums">
              <span className="text-slate-400">{focusedCell.dateStr}:</span>
              <span className="font-semibold text-white">{focusedCell.minutes}m</span>
              {focusedCell.goalMet ? (
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Goal met
                </span>
              ) : focusedCell.minutes > 0 ? (
                <span className="text-sky-400">Partial</span>
              ) : (
                <span className="text-slate-500">Rest day</span>
              )}
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">
                30d Total: {(totalMinutes30 / 60).toFixed(1)}h
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
