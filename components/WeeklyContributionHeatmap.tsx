'use client';

import React, { useState, useMemo } from 'react';
import { Grid3X3, Flame, Clock } from 'lucide-react';
import type { StudyLogEntry, CadenceDayCell } from '@/hooks/use-odyssey-store';

interface WeeklyContributionHeatmapProps {
  studyLogs: StudyLogEntry[];
  last84Days: CadenceDayCell[];
  dailyGoalMinutes: number;
}

interface DayBreakdown {
  dateStr: string;
  shortDay: string;
  dayNum: string;
  isToday: boolean;
  totalMinutes: number;
  sessionsCount: number;
  topicsLogged: number;
  challengesOrLabs: number;
  directPractice: number;
  intensityLevel: 0 | 1 | 2 | 3 | 4;
}

function getIntensityLevel(minutes: number, goalMinutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  const goal = Math.max(15, goalMinutes);
  const ratio = minutes / goal;
  if (ratio >= 1.5) return 4;
  if (ratio >= 1.0) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

function getIntensityClasses(level: 0 | 1 | 2 | 3 | 4): string {
  switch (level) {
    case 4:
      return 'border-emerald-300/70 bg-emerald-400/50 text-white shadow-[0_0_12px_rgba(52,211,153,0.28)]';
    case 3:
      return 'border-emerald-400/50 bg-emerald-500/32 text-emerald-100';
    case 2:
      return 'border-cyan-400/45 bg-cyan-500/24 text-cyan-100';
    case 1:
      return 'border-sky-500/35 bg-sky-500/14 text-sky-200';
    default:
      return 'border-white/[0.07] bg-[#04070f] text-slate-600';
  }
}

export function WeeklyContributionHeatmap({
  studyLogs,
  last84Days,
  dailyGoalMinutes,
}: WeeklyContributionHeatmapProps) {
  const [viewMode, setViewMode] = useState<'weekly' | 'calendar'>('weekly');
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);

  const weeklyBreakdown = useMemo<DayBreakdown[]>(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      const dayLogs = studyLogs.filter((l) => l.date === dateStr);

      let totalMinutes = 0;
      let topicsLogged = 0;
      let challengesOrLabs = 0;
      let directPractice = 0;

      for (const entry of dayLogs) {
        const mins = entry.minutes || 0;
        totalMinutes += mins;
        const lower = (entry.notes || '').toLowerCase();
        if (lower.includes('mastered topic') || lower.includes('topic')) {
          topicsLogged += mins;
        } else if (
          lower.includes('challenge') ||
          lower.includes('quiz') ||
          lower.includes('lab') ||
          lower.includes('kernel') ||
          lower.includes('milestone')
        ) {
          challengesOrLabs += mins;
        } else {
          directPractice += mins;
        }
      }

      return {
        dateStr,
        shortDay: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
        dayNum: dateStr.slice(8, 10),
        isToday: dateStr === todayStr,
        totalMinutes,
        sessionsCount: dayLogs.length,
        topicsLogged,
        challengesOrLabs,
        directPractice,
        intensityLevel: getIntensityLevel(totalMinutes, dailyGoalMinutes),
      };
    });
  }, [studyLogs, dailyGoalMinutes]);

  const weeklyTotals = useMemo(() => {
    return weeklyBreakdown.reduce(
      (acc, d) => {
        acc.minutes += d.totalMinutes;
        acc.sessions += d.sessionsCount;
        if (d.totalMinutes > 0) acc.activeDays += 1;
        return acc;
      },
      { minutes: 0, sessions: 0, activeDays: 0 }
    );
  }, [weeklyBreakdown]);

  // Group 84 days into 12 columns x 7 rows for the full Contribution Heatmap calendar
  const calendarWeeks = useMemo(() => {
    const cols: CadenceDayCell[][] = [];
    for (let i = 0; i < last84Days.length; i += 7) {
      cols.push(last84Days.slice(i, i + 7));
    }
    return cols;
  }, [last84Days]);

  const activeDayDetail = useMemo(() => {
    const targetDate = selectedDayStr || weeklyBreakdown[weeklyBreakdown.length - 1]?.dateStr;
    const matchedWeekDay = weeklyBreakdown.find((d) => d.dateStr === targetDate);
    const logsForDate = studyLogs.filter((l) => l.date === targetDate);
    const totalMins = logsForDate.reduce((s, l) => s + (l.minutes || 0), 0);
    return {
      dateStr: targetDate,
      totalMinutes: totalMins,
      sessions: logsForDate,
      matchedWeekDay,
    };
  }, [selectedDayStr, weeklyBreakdown, studyLogs]);

  const channelRows: Array<{
    key: 'topicsLogged' | 'challengesOrLabs' | 'directPractice';
    label: string;
  }> = [
    { key: 'topicsLogged', label: 'Topics' },
    { key: 'challengesOrLabs', label: 'Labs / Quiz' },
    { key: 'directPractice', label: 'Study Log' },
  ];

  return (
    <section
      className="optical-panel rounded-2xl p-5 space-y-4"
      aria-label="Weekly Contribution Heatmap"
    >
      {/* Header + View Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
        <div className="flex items-center gap-2.5">
          <Grid3X3 className="h-4 w-4 text-emerald-400 shrink-0" />
          <div>
            <h2 className="font-display text-sm font-semibold text-white">
              Weekly Contribution Heatmap
            </h2>
            <p className="text-[11px] text-slate-400">
              7-day granular activity intensity &amp; 12-week contribution cadence
            </p>
          </div>
        </div>

        <div className="optical-subnav flex items-center gap-1 p-1 rounded-xl text-[11px] font-mono">
          <button
            type="button"
            onClick={() => setViewMode('weekly')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap border ${
              viewMode === 'weekly'
                ? 'bg-emerald-500/18 border-emerald-400/35 text-emerald-200 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            7-Day Intensity
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap border ${
              viewMode === 'calendar'
                ? 'bg-emerald-500/18 border-emerald-400/35 text-emerald-200 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            12-Week Heatmap
          </button>
        </div>
      </div>

      {viewMode === 'weekly' ? (
        <div className="space-y-4">
          {/* 7-Day Overall Intensity Tiles */}
          <div className="grid grid-cols-7 gap-2">
            {weeklyBreakdown.map((day) => {
              const isSelected = activeDayDetail.dateStr === day.dateStr;
              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => setSelectedDayStr(day.dateStr)}
                  className={`rounded-xl border p-2.5 text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${getIntensityClasses(
                    day.intensityLevel
                  )} ${isSelected ? 'ring-2 ring-sky-400/80' : ''}`}
                  title={`${day.dateStr}: ${day.totalMinutes}m across ${day.sessionsCount} session(s)`}
                >
                  <span className="text-[10px] font-mono uppercase opacity-80">
                    {day.shortDay}
                  </span>
                  <span className="font-mono text-sm font-bold tabular-nums">
                    {day.totalMinutes > 0 ? `${day.totalMinutes}m` : '0m'}
                  </span>
                  <span className="text-[9px] font-mono opacity-75 tabular-nums">
                    {day.sessionsCount} {day.sessionsCount === 1 ? 'log' : 'logs'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Granular Category x Day Heatmap Matrix */}
          <div className="optical-inset rounded-xl p-3.5 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Channel Breakdown · Past 7 Days
            </div>

            <div className="space-y-1.5">
              {channelRows.map((row) => (
                <div key={row.key} className="grid grid-cols-8 gap-1.5 items-center">
                  <span className="text-[10px] font-mono text-slate-400 truncate pr-1">
                    {row.label}
                  </span>
                  {weeklyBreakdown.map((day) => {
                    const val = day[row.key];
                    const lvl = getIntensityLevel(val, Math.round(dailyGoalMinutes * 0.6));
                    return (
                      <button
                        key={`${row.key}-${day.dateStr}`}
                        type="button"
                        onClick={() => setSelectedDayStr(day.dateStr)}
                        title={`${row.label} on ${day.dateStr}: ${val}m`}
                        className={`h-6 rounded-md border font-mono text-[10px] tabular-nums flex items-center justify-center transition-colors cursor-pointer ${getIntensityClasses(
                          lvl
                        )}`}
                      >
                        {val > 0 ? `${val}m` : '·'}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* 12-Week (84-Day) Contribution Calendar Grid */
        <div className="optical-inset rounded-xl p-4 space-y-3 overflow-x-auto">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Rolling 12-Week Study Contribution Grid</span>
            <span>{last84Days.filter((c) => c.minutes > 0).length} / 84 active days</span>
          </div>

          <div className="grid grid-cols-12 gap-1.5 min-w-[340px]">
            {calendarWeeks.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-rows-7 gap-1.5">
                {week.map((cell) => {
                  const lvl = getIntensityLevel(cell.minutes, dailyGoalMinutes);
                  const isSelected = activeDayDetail.dateStr === cell.dateStr;
                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      onClick={() => setSelectedDayStr(cell.dateStr)}
                      title={`${cell.dateStr}: ${cell.minutes} minutes`}
                      aria-label={`${cell.dateStr}: ${cell.minutes} minutes`}
                      className={`h-4 w-full rounded-sm border transition-all cursor-pointer ${getIntensityClasses(
                        lvl
                      )} ${cell.isToday ? 'ring-1 ring-amber-300' : ''} ${
                        isSelected ? 'ring-2 ring-sky-400' : ''
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Day Granular Inspector + Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[11px] font-mono">
        <div className="flex items-center gap-3 text-slate-300 tabular-nums">
          <span className="inline-flex items-center gap-1 text-emerald-400">
            <Flame className="h-3.5 w-3.5" />
            <span>{weeklyTotals.activeDays}/7 active</span>
          </span>
          <span className="inline-flex items-center gap-1 text-slate-300">
            <Clock className="h-3.5 w-3.5 text-sky-400" />
            <span>
              {(weeklyTotals.minutes / 60).toFixed(1)}h ({weeklyTotals.sessions} sessions)
            </span>
          </span>
        </div>

        {/* Heat Intensity Legend */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span>Less</span>
          {([0, 1, 2, 3, 4] as const).map((lvl) => (
            <span
              key={lvl}
              className={`h-3 w-3 rounded-sm border inline-block ${getIntensityClasses(lvl)}`}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {activeDayDetail.dateStr && (
        <div className="optical-inset rounded-xl px-3.5 py-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="font-mono text-[11px] text-slate-300 tabular-nums">
            <span className="text-sky-400 font-semibold">{activeDayDetail.dateStr}</span>
            <span className="text-slate-600 mx-1.5">·</span>
            <span>{activeDayDetail.totalMinutes}m logged</span>
          </div>
          <div className="text-[11px] text-slate-400 truncate max-w-md">
            {activeDayDetail.sessions.length > 0
              ? activeDayDetail.sessions
                  .slice(0, 2)
                  .map((s) => s.notes)
                  .join(' · ')
              : 'No study sessions recorded on this date.'}
          </div>
        </div>
      )}
    </section>
  );
}
