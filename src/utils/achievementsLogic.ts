import { SessionRecord } from '../types/stats';
import {
  AchievementBadge,
  AchievementBadgeDefinition,
  AchievementCategory,
  AchievementsOverview,
} from '../types/achievements';
import { formatDateKey } from './statsStorage';

export const ACHIEVEMENT_DEFINITIONS: AchievementBadgeDefinition[] = [
  // Lifetime Time-based Milestones
  {
    id: 'time-5m',
    title: 'First Breath',
    description: 'Log your first 5 minutes of mindful breathwork practice.',
    category: 'time',
    target: 5,
    unit: 'min',
    tier: 'bronze',
    iconName: 'wind',
  },
  {
    id: 'time-15m',
    title: 'Inner Stillness',
    description: 'Accumulate 15 mindful minutes finding peaceful center.',
    category: 'time',
    target: 15,
    unit: 'min',
    tier: 'bronze',
    iconName: 'feather',
  },
  {
    id: 'time-30m',
    title: 'Deep Diver',
    description: 'Reach 30 total minutes of conscious respiratory training.',
    category: 'time',
    target: 30,
    unit: 'min',
    tier: 'silver',
    iconName: 'compass',
  },
  {
    id: 'time-60m',
    title: 'Hour of Serenity',
    description: 'Complete one full cumulative hour of mindful breathing.',
    category: 'time',
    target: 60,
    unit: 'min',
    tier: 'silver',
    iconName: 'clock',
  },
  {
    id: 'time-120m',
    title: 'Flow State',
    description: 'Accumulate 2 hours (120 minutes) of nervous system regulation.',
    category: 'time',
    target: 120,
    unit: 'min',
    tier: 'gold',
    iconName: 'waves',
  },
  {
    id: 'time-300m',
    title: 'Zen Journey',
    description: 'Log 5 hours (300 minutes) dedicated to stillness and balance.',
    category: 'time',
    target: 300,
    unit: 'min',
    tier: 'gold',
    iconName: 'sparkles',
  },
  {
    id: 'time-600m',
    title: 'Breath Master',
    description: 'Reach 10 hours (600 minutes) of lifetime breath practice.',
    category: 'time',
    target: 600,
    unit: 'min',
    tier: 'platinum',
    iconName: 'crown',
  },
  {
    id: 'time-1200m',
    title: 'Breath Alchemist',
    description: 'Attain 20 hours (1,200 minutes) of supreme mindful mastery.',
    category: 'time',
    target: 1200,
    unit: 'min',
    tier: 'diamond',
    iconName: 'gem',
  },

  // Active Streak Milestones (Consecutive Days)
  {
    id: 'streak-1d',
    title: 'Spark of Habit',
    description: 'Complete your first active day of mindful breathing.',
    category: 'streak',
    target: 1,
    unit: 'days',
    tier: 'bronze',
    iconName: 'sun',
  },
  {
    id: 'streak-3d',
    title: 'Building Momentum',
    description: 'Maintain an active breathing streak for 3 consecutive days.',
    category: 'streak',
    target: 3,
    unit: 'days',
    tier: 'bronze',
    iconName: 'zap',
  },
  {
    id: 'streak-7d',
    title: 'Week of Harmony',
    description: 'Complete a full 7-day uninterrupted streak of practice.',
    category: 'streak',
    target: 7,
    unit: 'days',
    tier: 'silver',
    iconName: 'flame',
  },
  {
    id: 'streak-14d',
    title: 'Fortnight of Calm',
    description: 'Sustain 14 consecutive days of daily mindful respiration.',
    category: 'streak',
    target: 14,
    unit: 'days',
    tier: 'silver',
    iconName: 'shield',
  },
  {
    id: 'streak-21d',
    title: 'Habit Cemented',
    description: 'Reach 21 consecutive days, solidifying a lasting neural habit.',
    category: 'streak',
    target: 21,
    unit: 'days',
    tier: 'gold',
    iconName: 'calendar',
  },
  {
    id: 'streak-30d',
    title: 'Unshakable Mind',
    description: 'Achieve a 30-day streak of unwavering daily breathwork.',
    category: 'streak',
    target: 30,
    unit: 'days',
    tier: 'platinum',
    iconName: 'mountain',
  },
  {
    id: 'streak-60d',
    title: 'Centurion Streak',
    description: 'Legendary dedication: 60 consecutive days of mindful breathing.',
    category: 'streak',
    target: 60,
    unit: 'days',
    tier: 'diamond',
    iconName: 'award',
  },
];

/**
 * Format a timestamp into a user-friendly date string (e.g. "Oct 22, 2026")
 */
export function formatUnlockDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Analyzes chronological sessions to find the exact unlock timestamps for time milestones
 */
export function computeTimeUnlockMoments(
  chronologicalSessions: SessionRecord[]
): Map<string, number> {
  const unlockMoments = new Map<string, number>();
  const timeDefs = ACHIEVEMENT_DEFINITIONS.filter((d) => d.category === 'time');

  let accumulatedSeconds = 0;

  for (const session of chronologicalSessions) {
    accumulatedSeconds += session.durationSeconds;
    const accumulatedMinutes = accumulatedSeconds / 60;

    for (const def of timeDefs) {
      if (!unlockMoments.has(def.id) && accumulatedMinutes >= def.target) {
        unlockMoments.set(def.id, session.timestamp);
      }
    }
  }

  return unlockMoments;
}

/**
 * Analyzes historical active dates to determine both max streak, current streak,
 * and exact unlock timestamps for streak milestones.
 */
export function computeStreakMilestoneDetails(
  sessions: SessionRecord[],
  referenceDate: Date = new Date()
): {
  currentStreak: number;
  longestStreak: number;
  unlockMoments: Map<string, number>;
} {
  const unlockMoments = new Map<string, number>();
  const streakDefs = ACHIEVEMENT_DEFINITIONS.filter((d) => d.category === 'streak');

  if (sessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, unlockMoments };
  }

  // Group latest timestamp by date
  const dayLatestTimestampMap = new Map<string, number>();
  for (const s of sessions) {
    if (s.completedRounds > 0 || s.durationSeconds >= 20) {
      const dateKey = formatDateKey(new Date(s.timestamp));
      const prev = dayLatestTimestampMap.get(dateKey) || 0;
      if (s.timestamp > prev) {
        dayLatestTimestampMap.set(dateKey, s.timestamp);
      }
    }
  }

  // Sort distinct active dates in ascending chronological order
  const sortedDates = Array.from(dayLatestTimestampMap.keys()).sort();

  let longestStreak = 0;
  let tempStreak = 0;
  let prevTime: number | null = null;

  for (const dateKey of sortedDates) {
    const [y, m, d] = dateKey.split('-').map(Number);
    const currMidnight = new Date(y, m - 1, d).getTime();
    const dayTimestamp = dayLatestTimestampMap.get(dateKey)!;

    if (prevTime === null) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((currMidnight - prevTime) / 86400000);
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    prevTime = currMidnight;

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    // Check if any streak badges unlocked on this day
    for (const def of streakDefs) {
      if (!unlockMoments.has(def.id) && tempStreak >= def.target) {
        unlockMoments.set(def.id, dayTimestamp);
      }
    }
  }

  // Compute current active streak leading up to today
  const checkDate = new Date(referenceDate);
  checkDate.setHours(0, 0, 0, 0);
  const todayStr = formatDateKey(checkDate);

  let currentStreak = 0;
  if (dayLatestTimestampMap.has(todayStr)) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
    if (!dayLatestTimestampMap.has(formatDateKey(checkDate))) {
      currentStreak = 0;
    }
  }

  if (currentStreak > 0 || dayLatestTimestampMap.has(formatDateKey(checkDate))) {
    if (currentStreak === 0) {
      currentStreak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (dayLatestTimestampMap.has(formatDateKey(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    unlockMoments,
  };
}

/**
 * Calculate full achievements and milestone progression based on session history
 */
export function calculateAchievements(
  sessions: SessionRecord[],
  referenceDate: Date = new Date()
): AchievementsOverview {
  // Sort sessions chronologically ascending to track unlock history
  const chronologicalSessions = [...sessions].sort((a, b) => a.timestamp - b.timestamp);

  // Total lifetime minutes
  const totalLifetimeSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalLifetimeMinutes = Math.round((totalLifetimeSeconds / 60) * 10) / 10;

  // Streak metrics
  const { currentStreak, longestStreak, unlockMoments: streakUnlocks } =
    computeStreakMilestoneDetails(sessions, referenceDate);

  // Time unlocks
  const timeUnlocks = computeTimeUnlockMoments(chronologicalSessions);

  // Effective streak for milestones is max achieved streak so earned badges persist
  const effectiveStreak = Math.max(currentStreak, longestStreak);

  const badges: AchievementBadge[] = ACHIEVEMENT_DEFINITIONS.map((def) => {
    const isTime = def.category === 'time';
    const currentValue = isTime ? totalLifetimeMinutes : effectiveStreak;
    const unlocked = currentValue >= def.target;

    const rawPct = def.target > 0 ? (currentValue / def.target) * 100 : 0;
    const progressPct = Math.min(100, Math.max(0, Math.round(rawPct)));
    const remaining = Math.max(0, Math.round((def.target - currentValue) * 10) / 10);

    const unlockedAt = unlocked
      ? isTime
        ? timeUnlocks.get(def.id) || null
        : streakUnlocks.get(def.id) || null
      : null;

    const unlockedDateStr = unlockedAt ? formatUnlockDate(unlockedAt) : null;

    return {
      ...def,
      unlocked,
      currentValue,
      progressPct,
      remaining,
      unlockedAt,
      unlockedDateStr,
    };
  });

  const totalBadges = badges.length;
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const unlockedCount = unlockedBadges.length;
  const completionPct = totalBadges > 0 ? Math.round((unlockedCount / totalBadges) * 100) : 0;

  const timeBadges = badges.filter((b) => b.category === 'time');
  const streakBadges = badges.filter((b) => b.category === 'streak');

  const timeBadgesCount = timeBadges.length;
  const timeUnlockedCount = timeBadges.filter((b) => b.unlocked).length;

  const streakBadgesCount = streakBadges.length;
  const streakUnlockedCount = streakBadges.filter((b) => b.unlocked).length;

  // Find next closest badge to unlock (locked with highest progress percentage)
  const lockedBadges = badges.filter((b) => !b.unlocked);
  let nextBadge: AchievementBadge | null = null;
  if (lockedBadges.length > 0) {
    // Sort locked badges by progressPct descending, then by target ascending
    const sortedLocked = [...lockedBadges].sort((a, b) => {
      if (b.progressPct !== a.progressPct) {
        return b.progressPct - a.progressPct;
      }
      return a.target - b.target;
    });
    nextBadge = sortedLocked[0];
  }

  // Recently unlocked badges (sorted by unlockedAt desc if available, fallback to tier)
  const recentlyUnlocked = [...unlockedBadges].sort((a, b) => {
    if (a.unlockedAt && b.unlockedAt) {
      return b.unlockedAt - a.unlockedAt;
    }
    if (a.unlockedAt) return -1;
    if (b.unlockedAt) return 1;
    return b.target - a.target;
  });

  return {
    badges,
    totalBadges,
    unlockedCount,
    completionPct,
    timeBadgesCount,
    timeUnlockedCount,
    streakBadgesCount,
    streakUnlockedCount,
    nextBadge,
    recentlyUnlocked,
  };
}

/**
 * Filter badges according to user selection ('all', 'time', 'streak', 'unlocked', 'locked')
 */
export function filterBadges(
  badges: AchievementBadge[],
  filter: 'all' | AchievementCategory | 'unlocked' | 'locked'
): AchievementBadge[] {
  switch (filter) {
    case 'time':
      return badges.filter((b) => b.category === 'time');
    case 'streak':
      return badges.filter((b) => b.category === 'streak');
    case 'unlocked':
      return badges.filter((b) => b.unlocked);
    case 'locked':
      return badges.filter((b) => !b.unlocked);
    case 'all':
    default:
      return badges;
  }
}
