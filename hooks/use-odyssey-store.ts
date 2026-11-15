'use client';

import { useState, useCallback, useMemo, useSyncExternalStore, useEffect, useRef } from 'react';
import { STAGES_DATA, PORTFOLIO_PROJECTS } from '@/lib/curriculum-data';
import { sanitizeOdysseyStoreState } from '@/lib/client-security';
import { evaluateBadges, type EvaluatedBadge } from '@/lib/badges-data';

export interface StudyLogEntry {
  id: string;
  date: string;
  minutes: number;
  stageId: string;
  notes: string;
}

export interface WeeklyReviewEntry {
  id: string;
  weekNum: number;
  date: string;
  built: string;
  explained: string;
  stuck: string;
  evidence: string;
  weakest: string;
  topTasks: string;
}

export interface UserMilestone {
  id: string;
  title: string;
  category: 'basics' | 'algorithms' | 'systems' | 'bandit' | 'projects' | 'custom';
  targetDate?: string;
  completed: boolean;
  completedAt?: string;
  stageId?: string;
  xpReward: number;
}

export interface SavedCodeSnippet {
  id: string;
  title: string;
  language: 'python' | 'c';
  code: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface StageProgressSummary {
  stageId: string;
  stageNumber: number;
  title: string;
  shortTitle: string;
  sprintMonth: string;
  topicsDone: number;
  topicsTotal: number;
  topicPercent: number;
  exitDone: number;
  exitTotal: number;
  exitPercent: number;
  targetDate?: string;
  isComplete: boolean;
  nextTopicId?: string;
  nextTopicTitle?: string;
}

export interface CadenceDayCell {
  dateStr: string;
  minutes: number;
  isToday: boolean;
  goalMet: boolean;
}

export interface OdysseyStoreData {
  completedTopics: Record<string, boolean>;
  completedExitChecks: Record<string, boolean>;
  solvedBanditLevels: number[];
  banditPasswords?: Record<number, string>;
  completedDailyChallenges?: Record<string, boolean>;
  projectStatuses: Record<string, 'not_started' | 'in_progress' | 'completed'>;
  projectNotes: Record<string, string>;
  stageNotes: Record<string, string>;
  studyLogs: StudyLogEntry[];
  weeklyReviews: WeeklyReviewEntry[];
  startDate: string;
  dailyGoalMinutes: number;
  userMilestones: UserMilestone[];
  savedSnippets: SavedCodeSnippet[];
  earnedBadges?: Record<string, string>;
  stageTargetDates?: Record<string, string>;
  autoLogTopicPractice?: boolean;
}

const STORAGE_KEY = 'cs_odyssey_state_v1';
const STORAGE_META_KEY = 'cs_odyssey_meta_v1';

const getTodayKey = () => new Date().toISOString().split('T')[0];

const getYesterdayKey = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
};

function computeStudyStreak(studyLogs: StudyLogEntry[]): number {
  const todayStr = getTodayKey();
  const yesterdayStr = getYesterdayKey();
  const dates = Array.from(new Set(studyLogs.map((l) => l.date)))
    .filter(Boolean)
    .sort()
    .reverse();
  if (dates.length === 0 || (dates[0] !== todayStr && dates[0] !== yesterdayStr)) {
    return 0;
  }
  let streak = 1;
  let checkDate = new Date(`${dates[0]}T00:00:00Z`);
  for (let i = 1; i < dates.length; i++) {
    const expectedPrev = new Date(checkDate.getTime() - 86400000).toISOString().split('T')[0];
    if (dates[i] === expectedPrev) {
      streak++;
      checkDate = new Date(`${expectedPrev}T00:00:00Z`);
    } else {
      break;
    }
  }
  return streak;
}

const DEFAULT_STATE: OdysseyStoreData = {
  completedTopics: {
    's0-t1': true,
    's0-t2': true,
  },
  completedExitChecks: {},
  solvedBanditLevels: [0],
  banditPasswords: {
    0: 'bandit0',
  },
  completedDailyChallenges: {},
  projectStatuses: {
    'proj-1': 'in_progress',
  },
  projectNotes: {},
  dailyGoalMinutes: 45,
  userMilestones: [
    {
      id: 'm-1',
      title: 'Master Binary, Hex & 8-Bit Registers (Stage 0)',
      category: 'basics',
      completed: true,
      completedAt: new Date().toISOString(),
      stageId: 'stage-0',
      xpReward: 75,
    },
    {
      id: 'm-2',
      title: 'Run First Python & C Programs in Playground',
      category: 'basics',
      completed: false,
      stageId: 'stage-1',
      xpReward: 75,
    },
    {
      id: 'm-3',
      title: 'Solve Wargame Levels 0 through 5 in Shell',
      category: 'bandit',
      completed: false,
      stageId: 'stage-3',
      xpReward: 100,
    },
    {
      id: 'm-4',
      title: 'Master Big-O Asymptotics & Sorting Algorithms',
      category: 'algorithms',
      completed: false,
      stageId: 'stage-12',
      xpReward: 100,
    },
  ],
  savedSnippets: [],
  earnedBadges: {
    'first-blueprint': new Date().toISOString(),
  },
  stageTargetDates: {},
  autoLogTopicPractice: true,
  stageNotes: {
    'stage-0': `# Stage 0 Engineering Notes
- Configured local Python 3 and GCC toolchain.
- Initialized Git global identity and SSH keys.
- Memorized powers of 2 through 2^16 (65536).
- Cadence: 10-12 hours per week across 6 months.`,
  },
  studyLogs: [
    {
      id: 'log-1',
      date: getTodayKey(),
      minutes: 60,
      stageId: 'stage-0',
      notes: 'Completed initial workstation setup, verified Git identity, and practiced binary conversions.',
    },
  ],
  weeklyReviews: [],
  startDate: new Date().toISOString(),
};

const emptySubscribe = () => () => {};

export function useOdysseyStore() {
  const isLoaded = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [data, setData] = useState<OdysseyStoreData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const sanitized = sanitizeOdysseyStoreState(parsed);
          return {
            ...DEFAULT_STATE,
            ...sanitized,
          };
        }
      } catch (e) {
        console.error('Failed to load odyssey state', e);
      }
    }
    return DEFAULT_STATE;
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const diskSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushToDisk = useCallback((payload: OdysseyStoreData) => {
    if (typeof window === 'undefined') return;
    if (diskSyncTimerRef.current) clearTimeout(diskSyncTimerRef.current);
    diskSyncTimerRef.current = setTimeout(() => {
      fetch('/api/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: payload }),
      }).catch(() => {});
    }, 600);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const controller = new AbortController();

    let localHasSaved = false;
    let localUpdatedAtMs = 0;
    try {
      localHasSaved = Boolean(localStorage.getItem(STORAGE_KEY));
      const metaRaw = localStorage.getItem(STORAGE_META_KEY);
      if (metaRaw) {
        const meta = JSON.parse(metaRaw) as { updatedAt?: string };
        if (meta.updatedAt) {
          localUpdatedAtMs = Date.parse(meta.updatedAt) || 0;
        }
      }
    } catch {
      // Ignore storage inspection issues
    }

    fetch('/api/progress', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!payload || !payload.exists || !payload.state) return;
        const diskUpdatedAtMs = payload.updatedAt ? Date.parse(payload.updatedAt) || 0 : 0;
        if (!localHasSaved || diskUpdatedAtMs > localUpdatedAtMs) {
          const sanitized = sanitizeOdysseyStoreState(payload.state);
          const merged: OdysseyStoreData = {
            ...DEFAULT_STATE,
            ...sanitized,
          };
          setData(merged);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            localStorage.setItem(
              STORAGE_META_KEY,
              JSON.stringify({ updatedAt: payload.updatedAt || new Date().toISOString() })
            );
          } catch {
            // Ignore localStorage quota issues
          }
        }
      })
      .catch(() => {});

    return () => {
      controller.abort();
      if (diskSyncTimerRef.current) clearTimeout(diskSyncTimerRef.current);
    };
  }, []);

  const saveState = useCallback(
    (newData: OdysseyStoreData) => {
      const now = new Date();
      const nowIso = now.toISOString();
      const streak = computeStudyStreak(newData.studyLogs || []);
      const evaluation = evaluateBadges({
        completedTopics: newData.completedTopics || {},
        solvedBanditLevels: newData.solvedBanditLevels || [],
        projectStatuses: newData.projectStatuses || {},
        userMilestones: newData.userMilestones || [],
        savedSnippets: newData.savedSnippets || [],
        completedDailyChallenges: newData.completedDailyChallenges,
        studyLogs: newData.studyLogs || [],
        earnedBadges: newData.earnedBadges,
        currentStreak: streak,
      });

      const finalData: OdysseyStoreData =
        evaluation.newlyUnlockedIds.length > 0
          ? {
              ...newData,
              earnedBadges: {
                ...(newData.earnedBadges || {}),
                ...Object.fromEntries(evaluation.newlyUnlockedIds.map((id) => [id, nowIso])),
              },
            }
          : newData;

      setData(finalData);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalData));
        localStorage.setItem(STORAGE_META_KEY, JSON.stringify({ updatedAt: nowIso }));
        setLastSaved(now);
      } catch (e) {
        console.error('Failed to save state to localStorage', e);
      }
      pushToDisk(finalData);
    },
    [pushToDisk]
  );

  const toggleTopic = useCallback(
    (topicId: string) => {
      const nextChecked = !data.completedTopics[topicId];
      let nextLogs = data.studyLogs;

      if (nextChecked && data.autoLogTopicPractice !== false) {
        const matchedStage = STAGES_DATA.find((s) => s.topics.some((t) => t.id === topicId));
        const matchedTopic = matchedStage?.topics.find((t) => t.id === topicId);
        if (matchedStage && matchedTopic) {
          nextLogs = [
            {
              id: 'log-topic-' + Date.now(),
              date: getTodayKey(),
              minutes: 15,
              stageId: matchedStage.id,
              notes: `Mastered topic: "${matchedTopic.title}" (Stage ${matchedStage.number})`,
            },
            ...data.studyLogs,
          ];
        }
      }

      saveState({
        ...data,
        completedTopics: {
          ...data.completedTopics,
          [topicId]: nextChecked,
        },
        studyLogs: nextLogs,
      });
    },
    [data, saveState]
  );

  const completeTopicWithHabit = useCallback(
    (topicId: string, stageId: string, logMinutes = 15) => {
      const stage = STAGES_DATA.find((s) => s.id === stageId);
      const topic = stage?.topics.find((t) => t.id === topicId);
      const validMinutes = Math.max(0, Math.min(240, Math.floor(logMinutes)));
      const nextLogs =
        validMinutes > 0 && stage && topic
          ? [
              {
                id: 'log-habit-' + Date.now(),
                date: getTodayKey(),
                minutes: validMinutes,
                stageId: stage.id,
                notes: `Completed topic "${topic.title}" with ${validMinutes}m deliberate practice`,
              },
              ...data.studyLogs,
            ]
          : data.studyLogs;

      saveState({
        ...data,
        completedTopics: {
          ...data.completedTopics,
          [topicId]: true,
        },
        studyLogs: nextLogs,
      });
    },
    [data, saveState]
  );

  const setStageTargetDate = useCallback(
    (stageId: string, targetDate: string) => {
      if (!/^stage-([0-9]|1[0-5])$/.test(stageId)) return;
      const clean = targetDate.trim();
      const nextDates = { ...(data.stageTargetDates || {}) };
      if (!clean) {
        delete nextDates[stageId];
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
        nextDates[stageId] = clean;
      } else {
        return;
      }

      // Sync target date onto matching open stage milestones if present
      const nextMilestones = (data.userMilestones || []).map((m) =>
        m.stageId === stageId && !m.completed && m.title.startsWith('Complete Stage ')
          ? { ...m, targetDate: clean || undefined }
          : m
      );

      saveState({
        ...data,
        stageTargetDates: nextDates,
        userMilestones: nextMilestones,
      });
    },
    [data, saveState]
  );

  const setAutoLogTopicPractice = useCallback(
    (enabled: boolean) => {
      saveState({
        ...data,
        autoLogTopicPractice: Boolean(enabled),
      });
    },
    [data, saveState]
  );

  const generatePersonalizedPlan = useCallback(
    (horizonWeeks: 12 | 24 | 36 = 24) => {
      const remainingStages = STAGES_DATA.filter((stage) =>
        stage.topics.some((t) => !data.completedTopics[t.id])
      );
      if (remainingStages.length === 0) {
        return { datesUpdated: 0, milestonesAdded: 0 };
      }

      const totalDays = horizonWeeks * 7;
      const totalTopicWeight = remainingStages.reduce((sum, st) => {
        const unchecked = st.topics.filter((t) => !data.completedTopics[t.id]).length;
        return sum + Math.max(2, unchecked);
      }, 0);

      const now = new Date();
      let accumulatedDays = 0;
      const nextDates: Record<string, string> = { ...(data.stageTargetDates || {}) };
      const existingStageMilestones = new Set(
        (data.userMilestones || []).filter((m) => m.stageId && !m.completed).map((m) => m.stageId as string)
      );

      const categoryForStage = (num: number): UserMilestone['category'] => {
        if (num <= 2) return 'basics';
        if (num === 3 || num === 9 || num === 10) return 'bandit';
        if (num === 11) return 'projects';
        if (num === 12) return 'algorithms';
        return 'systems';
      };

      const newMilestones: UserMilestone[] = [];
      let datesUpdated = 0;

      remainingStages.forEach((stage, idx) => {
        const unchecked = stage.topics.filter((t) => !data.completedTopics[t.id]).length;
        const shareDays = Math.max(
          3,
          Math.round((Math.max(2, unchecked) / totalTopicWeight) * totalDays)
        );
        accumulatedDays += shareDays;
        const targetObj = new Date(now.getTime() + Math.min(totalDays, accumulatedDays) * 86400000);
        const targetDate = targetObj.toISOString().split('T')[0];
        nextDates[stage.id] = targetDate;
        datesUpdated++;

        if (!existingStageMilestones.has(stage.id)) {
          newMilestones.push({
            id: `ms-plan-${stage.number}-${Date.now() + idx}`,
            title: `Complete Stage ${stage.number}: ${stage.title.split(':')[0]}`,
            category: categoryForStage(stage.number),
            targetDate,
            completed: false,
            stageId: stage.id,
            xpReward: stage.number >= 10 ? 125 : 90,
          });
        }
      });

      saveState({
        ...data,
        stageTargetDates: nextDates,
        userMilestones: [...newMilestones, ...(data.userMilestones || [])],
      });

      return { datesUpdated, milestonesAdded: newMilestones.length };
    },
    [data, saveState]
  );

  const markStageTopicsComplete = useCallback(
    (stageId: string, completed: boolean) => {
      const stage = STAGES_DATA.find((s) => s.id === stageId);
      if (!stage) return;
      const nextTopics = { ...data.completedTopics };
      for (const t of stage.topics) {
        nextTopics[t.id] = completed;
      }
      saveState({
        ...data,
        completedTopics: nextTopics,
      });
    },
    [data, saveState]
  );

  const toggleExitCheck = useCallback(
    (key: string) => {
      saveState({
        ...data,
        completedExitChecks: {
          ...data.completedExitChecks,
          [key]: !data.completedExitChecks[key],
        },
      });
    },
    [data, saveState]
  );

  const toggleBanditLevel = useCallback(
    (level: number) => {
      const cleanLevel = Math.floor(Number(level));
      if (isNaN(cleanLevel) || cleanLevel < 0 || cleanLevel > 50) return;
      const exists = data.solvedBanditLevels.includes(cleanLevel);
      const nextLevels = exists
        ? data.solvedBanditLevels.filter((l) => l !== cleanLevel)
        : [...data.solvedBanditLevels, cleanLevel];
      saveState({
        ...data,
        solvedBanditLevels: nextLevels,
      });
    },
    [data, saveState]
  );

  const updateProjectStatus = useCallback(
    (projId: string, status: 'not_started' | 'in_progress' | 'completed') => {
      saveState({
        ...data,
        projectStatuses: {
          ...data.projectStatuses,
          [projId]: status,
        },
      });
    },
    [data, saveState]
  );

  const updateProjectNotes = useCallback(
    (projId: string, notes: string) => {
      saveState({
        ...data,
        projectNotes: {
          ...data.projectNotes,
          [projId]: notes,
        },
      });
    },
    [data, saveState]
  );

  const updateStageNotes = useCallback(
    (stageId: string, notes: string) => {
      saveState({
        ...data,
        stageNotes: {
          ...data.stageNotes,
          [stageId]: notes,
        },
      });
    },
    [data, saveState]
  );

  const addStudyLog = useCallback(
    (minutes: number, stageId: string, notes: string) => {
      const validMinutes = Math.max(1, Math.min(1440, Math.floor(Number(minutes) || 30)));
      const cleanNotes = (notes || '').slice(0, 1000);
      const newEntry: StudyLogEntry = {
        id: 'log-' + Date.now(),
        date: getTodayKey(),
        minutes: validMinutes,
        stageId,
        notes: cleanNotes,
      };
      saveState({
        ...data,
        studyLogs: [newEntry, ...data.studyLogs],
      });
    },
    [data, saveState]
  );

  const addWeeklyReview = useCallback(
    (review: Omit<WeeklyReviewEntry, 'id' | 'date'>) => {
      const newEntry: WeeklyReviewEntry = {
        ...review,
        id: 'rev-' + Date.now(),
        date: getTodayKey(),
      };
      saveState({
        ...data,
        weeklyReviews: [newEntry, ...data.weeklyReviews],
      });
    },
    [data, saveState]
  );

  const saveBanditPassword = useCallback(
    (level: number, password: string) => {
      const cleanLevel = Math.floor(Number(level));
      if (isNaN(cleanLevel) || cleanLevel < 0 || cleanLevel > 50) return;
      const cleanPassword = (password || '').trim().slice(0, 100);
      const currentPasswords = data.banditPasswords || {};
      const nextSolved = Array.from(new Set([...data.solvedBanditLevels, cleanLevel]));
      saveState({
        ...data,
        solvedBanditLevels: nextSolved,
        banditPasswords: {
          ...currentPasswords,
          [cleanLevel]: cleanPassword,
        },
      });
    },
    [data, saveState]
  );

  const completeDailyChallenge = useCallback(
    (dateKey: string, xpReward: number, taskTitle: string, stageId: string) => {
      const currentChallenges = data.completedDailyChallenges || {};
      if (currentChallenges[dateKey]) return;

      const newLog: StudyLogEntry = {
        id: 'log-daily-' + Date.now(),
        date: dateKey,
        minutes: 10,
        stageId,
        notes: `Completed Daily Challenge: "${taskTitle}" (+${xpReward} XP)`,
      };

      saveState({
        ...data,
        completedDailyChallenges: {
          ...currentChallenges,
          [dateKey]: true,
        },
        studyLogs: [newLog, ...data.studyLogs],
      });
    },
    [data, saveState]
  );

  const addMilestone = useCallback(
    (
      title: string,
      category: UserMilestone['category'] = 'custom',
      targetDate?: string,
      stageId?: string,
      xpReward: number = 75
    ) => {
      const newMilestone: UserMilestone = {
        id: 'ms-' + Date.now(),
        title: title.trim(),
        category,
        targetDate,
        stageId,
        completed: false,
        xpReward,
      };
      saveState({
        ...data,
        userMilestones: [newMilestone, ...(data.userMilestones || [])],
      });
    },
    [data, saveState]
  );

  const toggleMilestone = useCallback(
    (id: string) => {
      const milestones = data.userMilestones || [];
      const target = milestones.find((m) => m.id === id);
      const isNowCompleted = target ? !target.completed : false;

      const updated = milestones.map((m) =>
        m.id === id
          ? {
              ...m,
              completed: isNowCompleted,
              completedAt: isNowCompleted ? new Date().toISOString() : undefined,
            }
          : m
      );

      let nextStudyLogs = data.studyLogs;
      if (isNowCompleted && target) {
        nextStudyLogs = [
          {
            id: 'log-ms-' + Date.now(),
            date: getTodayKey(),
            minutes: 15,
            stageId: target.stageId || 'stage-0',
            notes: `Reached Milestone: "${target.title}" (+${target.xpReward} XP)`,
          },
          ...data.studyLogs,
        ];
      }

      saveState({
        ...data,
        userMilestones: updated,
        studyLogs: nextStudyLogs,
      });
    },
    [data, saveState]
  );

  const deleteMilestone = useCallback(
    (id: string) => {
      const updated = (data.userMilestones || []).filter((m) => m.id !== id);
      saveState({
        ...data,
        userMilestones: updated,
      });
    },
    [data, saveState]
  );

  const setDailyGoalMinutes = useCallback(
    (minutes: number) => {
      saveState({
        ...data,
        dailyGoalMinutes: Math.max(10, Math.min(240, minutes)),
      });
    },
    [data, saveState]
  );

  const saveCodeSnippet = useCallback(
    (snippet: Omit<SavedCodeSnippet, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const snippets = data.savedSnippets || [];
      const now = new Date().toISOString();
      let updated: SavedCodeSnippet[];

      if (snippet.id) {
        updated = snippets.map((s) =>
          s.id === snippet.id ? { ...s, ...snippet, updatedAt: now } : s
        );
      } else {
        const newSnippet: SavedCodeSnippet = {
          id: 'snip-' + Date.now(),
          title: snippet.title || `${snippet.language.toUpperCase()} Snippet`,
          language: snippet.language,
          code: snippet.code,
          createdAt: now,
          updatedAt: now,
          tags: snippet.tags || [],
        };
        updated = [newSnippet, ...snippets];
      }

      saveState({
        ...data,
        savedSnippets: updated,
      });
    },
    [data, saveState]
  );

  const deleteCodeSnippet = useCallback(
    (id: string) => {
      const updated = (data.savedSnippets || []).filter((s) => s.id !== id);
      saveState({
        ...data,
        savedSnippets: updated,
      });
    },
    [data, saveState]
  );

  const stats = useMemo(() => {
    let totalTopicsCount = 0;
    let completedTopicsCount = 0;

    STAGES_DATA.forEach((s) => {
      s.topics.forEach((t) => {
        totalTopicsCount++;
        if (data.completedTopics[t.id]) completedTopicsCount++;
      });
    });

    const topicPercent =
      totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;

    const completedProjectsCount = Object.values(data.projectStatuses).filter(
      (s) => s === 'completed'
    ).length;
    const banditCount = data.solvedBanditLevels.length;

    const todayStr = getTodayKey();
    const yesterdayStr = getYesterdayKey();
    const todayMinutesLogged = data.studyLogs
      .filter((l) => l.date === todayStr)
      .reduce((acc, curr) => acc + (curr.minutes || 0), 0);

    const dailyGoalMinutes = data.dailyGoalMinutes || 30;
    const dailyGoalPercent = Math.min(
      100,
      Math.round((todayMinutesLogged / dailyGoalMinutes) * 100)
    );

    const userMilestones = data.userMilestones || [];
    const completedMilestonesCount = userMilestones.filter((m) => m.completed).length;
    const totalMilestonesCount = userMilestones.length;

    const totalMinutesLogged = data.studyLogs.reduce((acc, curr) => acc + (curr.minutes || 0), 0);
    const xp =
      completedTopicsCount * 50 +
      banditCount * 100 +
      completedProjectsCount * 300 +
      completedMilestonesCount * 75 +
      Math.floor(totalMinutesLogged / 30) * 25;

    const levelNumber = Math.min(20, Math.max(1, Math.floor(xp / 300) + 1));

    const levelTitles = [
      'Digital Novice',
      'Terminal Apprentice',
      'Scripting Cadet',
      'Byte Operator',
      'Logic Explorer',
      'Citadel Initiate',
      'Shell Craftsman',
      'Packet Inspector',
      'Network Voyager',
      'Database Architect',
      'Memory Navigator',
      'C Pointer Specialist',
      'Systems Builder',
      'Binary Detective',
      'Assembly Analyst',
      'Reverse Engineer',
      'Security Guardian',
      'Defense Strategist',
      'Systems Architect',
      'Principal Systems Engineer',
    ];
    const heroTitle = levelTitles[levelNumber - 1] || 'Principal Systems Engineer';

    // Accurate streak: only active if latest study log is today or yesterday
    const currentStreak = computeStudyStreak(data.studyLogs);

    return {
      totalTopicsCount,
      completedTopicsCount,
      topicPercent,
      completedProjectsCount,
      totalProjectsCount: PORTFOLIO_PROJECTS.length,
      banditCount,
      totalMinutesLogged,
      todayMinutesLogged,
      dailyGoalMinutes,
      dailyGoalPercent,
      completedMilestonesCount,
      totalMilestonesCount,
      xp,
      levelNumber,
      heroTitle,
      currentStreak,
    };
  }, [data]);

  const stageProgressList = useMemo<StageProgressSummary[]>(() => {
    const targetDates = data.stageTargetDates || {};
    return STAGES_DATA.map((stage) => {
      const topicsTotal = stage.topics.length;
      const topicsDone = stage.topics.filter((t) => data.completedTopics[t.id]).length;
      const topicPercent = topicsTotal > 0 ? Math.round((topicsDone / topicsTotal) * 100) : 0;

      const exitTotal = stage.exitChecklist.length;
      const exitDone = stage.exitChecklist.filter(
        (_, idx) => Boolean(data.completedExitChecks[`${stage.id}-${idx}`])
      ).length;
      const exitPercent = exitTotal > 0 ? Math.round((exitDone / exitTotal) * 100) : 0;

      const nextTopic = stage.topics.find((t) => !data.completedTopics[t.id]);

      return {
        stageId: stage.id,
        stageNumber: stage.number,
        title: stage.title,
        shortTitle: stage.title.split(':')[0],
        sprintMonth: stage.sprintMonth,
        topicsDone,
        topicsTotal,
        topicPercent,
        exitDone,
        exitTotal,
        exitPercent,
        targetDate: targetDates[stage.id],
        isComplete: topicsDone === topicsTotal && topicsTotal > 0,
        nextTopicId: nextTopic?.id,
        nextTopicTitle: nextTopic?.title,
      };
    });
  }, [data.completedTopics, data.completedExitChecks, data.stageTargetDates]);

  const cadenceMetrics = useMemo(() => {
    const todayStr = getTodayKey();
    const goalMins = data.dailyGoalMinutes || 30;
    const dayMap = new Map<string, number>();

    for (const entry of data.studyLogs) {
      if (!entry.date) continue;
      dayMap.set(entry.date, (dayMap.get(entry.date) || 0) + (entry.minutes || 0));
    }

    const last28Days: CadenceDayCell[] = Array.from({ length: 28 }, (_, i) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - (27 - i));
      const dateStr = d.toISOString().split('T')[0];
      const minutes = dayMap.get(dateStr) || 0;
      return {
        dateStr,
        minutes,
        isToday: dateStr === todayStr,
        goalMet: minutes >= goalMins,
      };
    });

    const last7 = last28Days.slice(-7);
    const weeklyMinutes = last7.reduce((sum, c) => sum + c.minutes, 0);
    const daysGoalMet7 = last7.filter((c) => c.goalMet).length;
    const activeDays28 = last28Days.filter((c) => c.minutes > 0).length;

    return {
      last28Days,
      weeklyMinutes,
      daysGoalMet7,
      activeDays28,
    };
  }, [data.studyLogs, data.dailyGoalMinutes]);

  const badgesSummary = useMemo<{
    badges: EvaluatedBadge[];
    unlockedCount: number;
    totalCount: number;
  }>(() => {
    const evaluated = evaluateBadges({
      completedTopics: data.completedTopics || {},
      solvedBanditLevels: data.solvedBanditLevels || [],
      projectStatuses: data.projectStatuses || {},
      userMilestones: data.userMilestones || [],
      savedSnippets: data.savedSnippets || [],
      completedDailyChallenges: data.completedDailyChallenges,
      studyLogs: data.studyLogs || [],
      earnedBadges: data.earnedBadges,
      currentStreak: stats.currentStreak,
    });
    return {
      badges: evaluated.badges,
      unlockedCount: evaluated.unlockedCount,
      totalCount: evaluated.totalCount,
    };
  }, [data, stats.currentStreak]);

  const exportBackup = useCallback(() => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cs-odyssey-backup-${getTodayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const importBackup = useCallback(
    (jsonString: string) => {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed && typeof parsed === 'object') {
          const sanitized = sanitizeOdysseyStoreState(parsed);
          saveState({
            ...DEFAULT_STATE,
            ...sanitized,
          });
          return true;
        }
      } catch (e) {
        console.error('Import failed', e);
      }
      return false;
    },
    [saveState]
  );

  // Pure state reset; UI handles user confirmation dialog before invoking
  const resetAll = useCallback(() => {
    if (diskSyncTimerRef.current) clearTimeout(diskSyncTimerRef.current);
    fetch('/api/progress', { method: 'DELETE' }).catch(() => {});
    saveState(DEFAULT_STATE);
  }, [saveState]);

  return {
    data,
    isLoaded,
    lastSaved,
    stats,
    stageProgressList,
    cadenceMetrics,
    badgesSummary,
    toggleTopic,
    completeTopicWithHabit,
    markStageTopicsComplete,
    toggleExitCheck,
    toggleBanditLevel,
    saveBanditPassword,
    completeDailyChallenge,
    updateProjectStatus,
    updateProjectNotes,
    updateStageNotes,
    addStudyLog,
    addWeeklyReview,
    addMilestone,
    toggleMilestone,
    deleteMilestone,
    setDailyGoalMinutes,
    setStageTargetDate,
    setAutoLogTopicPractice,
    generatePersonalizedPlan,
    saveCodeSnippet,
    deleteCodeSnippet,
    exportBackup,
    importBackup,
    resetAll,
  };
}
