'use client';

import { useState, useCallback, useMemo, useSyncExternalStore } from 'react';
import { STAGES_DATA, PORTFOLIO_PROJECTS } from '@/lib/curriculum-data';

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
}

const STORAGE_KEY = 'cs_odyssey_state_v1';

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
  stageNotes: {
    'stage-0': `# Stage 0 Learning Notes
- Installed VS Code and Python 3.12.
- Configured git global user.name and user.email.
- Memorized powers of 2 up to 2^10 (1024).
- Target: 6-month intensive sprint at 10-12 hours per week!`,
  },
  studyLogs: [
    {
      id: 'log-1',
      date: new Date().toISOString().split('T')[0],
      minutes: 90,
      stageId: 'stage-0',
      notes: 'Completed terminal setup, initialized first git repo, and practiced touch typing.',
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
          return {
            ...DEFAULT_STATE,
            ...parsed,
          };
        }
      } catch (e) {
        console.error('Failed to load odyssey state', e);
      }
    }
    return DEFAULT_STATE;
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Save to local storage on changes
  const saveState = useCallback((newData: OdysseyStoreData) => {
    setData(newData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setLastSaved(new Date());
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }, []);

  const toggleTopic = useCallback(
    (topicId: string) => {
      const next = {
        ...data,
        completedTopics: {
          ...data.completedTopics,
          [topicId]: !data.completedTopics[topicId],
        },
      };
      saveState(next);
    },
    [data, saveState]
  );

  const toggleExitCheck = useCallback(
    (key: string) => {
      const next = {
        ...data,
        completedExitChecks: {
          ...data.completedExitChecks,
          [key]: !data.completedExitChecks[key],
        },
      };
      saveState(next);
    },
    [data, saveState]
  );

  const toggleBanditLevel = useCallback(
    (level: number) => {
      const exists = data.solvedBanditLevels.includes(level);
      const nextLevels = exists
        ? data.solvedBanditLevels.filter((l) => l !== level)
        : [...data.solvedBanditLevels, level];
      const next = {
        ...data,
        solvedBanditLevels: nextLevels,
      };
      saveState(next);
    },
    [data, saveState]
  );

  const updateProjectStatus = useCallback(
    (projId: string, status: 'not_started' | 'in_progress' | 'completed') => {
      const next = {
        ...data,
        projectStatuses: {
          ...data.projectStatuses,
          [projId]: status,
        },
      };
      saveState(next);
    },
    [data, saveState]
  );

  const updateProjectNotes = useCallback(
    (projId: string, notes: string) => {
      const next = {
        ...data,
        projectNotes: {
          ...data.projectNotes,
          [projId]: notes,
        },
      };
      saveState(next);
    },
    [data, saveState]
  );

  const updateStageNotes = useCallback(
    (stageId: string, notes: string) => {
      const next = {
        ...data,
        stageNotes: {
          ...data.stageNotes,
          [stageId]: notes,
        },
      };
      saveState(next);
    },
    [data, saveState]
  );

  const addStudyLog = useCallback(
    (minutes: number, stageId: string, notes: string) => {
      const newEntry: StudyLogEntry = {
        id: 'log-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        minutes,
        stageId,
        notes,
      };
      const next = {
        ...data,
        studyLogs: [newEntry, ...data.studyLogs],
      };
      saveState(next);
    },
    [data, saveState]
  );

  const addWeeklyReview = useCallback(
    (review: Omit<WeeklyReviewEntry, 'id' | 'date'>) => {
      const newEntry: WeeklyReviewEntry = {
        ...review,
        id: 'rev-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
      };
      const next = {
        ...data,
        weeklyReviews: [newEntry, ...data.weeklyReviews],
      };
      saveState(next);
    },
    [data, saveState]
  );

  const saveBanditPassword = useCallback(
    (level: number, password: string) => {
      const currentPasswords = data.banditPasswords || {};
      const nextSolved = Array.from(new Set([...data.solvedBanditLevels, level]));
      const next = {
        ...data,
        solvedBanditLevels: nextSolved,
        banditPasswords: {
          ...currentPasswords,
          [level]: password.trim(),
        },
      };
      saveState(next);
    },
    [data, saveState]
  );

  const completeDailyChallenge = useCallback(
    (dateKey: string, xpReward: number, taskTitle: string, stageId: string) => {
      const currentChallenges = data.completedDailyChallenges || {};
      if (currentChallenges[dateKey]) return; // already completed

      const newLog: StudyLogEntry = {
        id: 'log-daily-' + Date.now(),
        date: dateKey,
        minutes: 10,
        stageId,
        notes: `🎯 Completed Daily Challenge: "${taskTitle}" (+${xpReward} XP)`,
      };

      const next = {
        ...data,
        completedDailyChallenges: {
          ...currentChallenges,
          [dateKey]: true,
        },
        studyLogs: [newLog, ...data.studyLogs],
      };
      saveState(next);
    },
    [data, saveState]
  );

  // Compute overall progress stats
  const stats = useMemo(() => {
    let totalTopicsCount = 0;
    let completedTopicsCount = 0;

    STAGES_DATA.forEach((s) => {
      s.topics.forEach((t) => {
        totalTopicsCount++;
        if (data.completedTopics[t.id]) completedTopicsCount++;
      });
    });

    const topicPercent = totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;

    const completedProjectsCount = Object.values(data.projectStatuses).filter((s) => s === 'completed').length;
    const banditCount = data.solvedBanditLevels.length;

    // XP calculation: 50 XP per topic, 100 XP per Bandit level, 300 XP per Project, 25 XP per 30m study log
    const totalMinutesLogged = data.studyLogs.reduce((acc, curr) => acc + (curr.minutes || 0), 0);
    const xp =
      completedTopicsCount * 50 +
      banditCount * 100 +
      completedProjectsCount * 300 +
      Math.floor(totalMinutesLogged / 30) * 25;

    // Level: Level 1 (0 XP) up to Level 20 (6000 XP)
    const levelNumber = Math.min(20, Math.max(1, Math.floor(xp / 300) + 1));

    const levelTitles = [
      'Digital Novice',
      'Terminal Apprentice',
      'Scripting Cadet',
      'Byte Operator',
      'Logic Explorer',
      'Bandit Infiltrator',
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
      'Cybersecurity Hero',
    ];
    const heroTitle = levelTitles[levelNumber - 1] || 'Cybersecurity Hero';

    // Calculate streak from log dates sequence
    const dates = Array.from(new Set(data.studyLogs.map((l) => l.date))).sort().reverse();
    let currentStreak = 0;

    if (dates.length > 0) {
      currentStreak = 1;
      let checkDate = new Date(dates[0]);
      for (let i = 1; i < dates.length; i++) {
        const expectedPrev = new Date(checkDate.getTime() - 86400000).toISOString().split('T')[0];
        if (dates[i] === expectedPrev) {
          currentStreak++;
          checkDate = new Date(expectedPrev);
        } else {
          break;
        }
      }
    }

    return {
      totalTopicsCount,
      completedTopicsCount,
      topicPercent,
      completedProjectsCount,
      totalProjectsCount: PORTFOLIO_PROJECTS.length,
      banditCount,
      totalMinutesLogged,
      xp,
      levelNumber,
      heroTitle,
      currentStreak,
    };
  }, [data]);

  const exportBackup = useCallback(() => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cs-odyssey-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const importBackup = useCallback(
    (jsonString: string) => {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed && typeof parsed === 'object') {
          saveState(parsed);
          return true;
        }
      } catch (e) {
        console.error('Import failed', e);
      }
      return false;
    },
    [saveState]
  );

  const resetAll = useCallback(() => {
    if (confirm('Are you sure you want to reset your study progress? This cannot be undone unless you export a backup.')) {
      saveState(DEFAULT_STATE);
    }
  }, [saveState]);

  return {
    data,
    isLoaded,
    lastSaved,
    stats,
    toggleTopic,
    toggleExitCheck,
    toggleBanditLevel,
    saveBanditPassword,
    completeDailyChallenge,
    updateProjectStatus,
    updateProjectNotes,
    updateStageNotes,
    addStudyLog,
    addWeeklyReview,
    exportBackup,
    importBackup,
    resetAll,
  };
}
