import { SessionRecord } from '../types/stats';
import {
  BestTimeOfDayResult,
  InsightsData,
  MonthlyConsistencyStat,
  TimeOfDayBucket,
  TimeOfDayStat,
  WeeklyStreakResult,
  WeekStreakItem,
} from '../types/insights';
import { formatDateKey, getMondayOfWeek, getWeekKey, getWeekLabel } from './statsStorage';

/**
 * Categorize a timestamp into one of 4 daily windows:
 * - Morning: 5:00 AM – 11:59 AM
 * - Afternoon: 12:00 PM – 4:59 PM
 * - Evening: 5:00 PM – 8:59 PM
 * - Night: 9:00 PM – 4:59 AM
 */
export function getTimeOfDayBucket(timestamp: number): TimeOfDayBucket {
  const d = new Date(timestamp);
  const hour = d.getHours();

  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Format hour into 12-hour AM/PM label (e.g. "9 AM" or "9:00 AM – 10:00 AM")
 */
export function formatHourRangeLabel(hour: number): string {
  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:00 ${period}`;
  };

  const nextHour = (hour + 1) % 24;
  return `${formatHour(hour)} – ${formatHour(nextHour)}`;
}

/**
 * Calculate the Best Time of Day for breathing sessions
 */
export function calculateBestTimeOfDay(sessions: SessionRecord[]): BestTimeOfDayResult {
  const buckets: Record<TimeOfDayBucket, {
    label: string;
    timeRange: string;
    iconName: 'sunrise' | 'sun' | 'sunset' | 'moon';
    sessionsCount: number;
    roundsCount: number;
    durationSeconds: number;
  }> = {
    morning: {
      label: 'Morning',
      timeRange: '5:00 AM – 11:59 AM',
      iconName: 'sunrise',
      sessionsCount: 0,
      roundsCount: 0,
      durationSeconds: 0,
    },
    afternoon: {
      label: 'Afternoon',
      timeRange: '12:00 PM – 4:59 PM',
      iconName: 'sun',
      sessionsCount: 0,
      roundsCount: 0,
      durationSeconds: 0,
    },
    evening: {
      label: 'Evening',
      timeRange: '5:00 PM – 8:59 PM',
      iconName: 'sunset',
      sessionsCount: 0,
      roundsCount: 0,
      durationSeconds: 0,
    },
    night: {
      label: 'Night',
      timeRange: '9:00 PM – 4:59 AM',
      iconName: 'moon',
      sessionsCount: 0,
      roundsCount: 0,
      durationSeconds: 0,
    },
  };

  // Hourly count (0-23)
  const hourCounts = new Array(24).fill(0);
  let totalSessions = 0;

  for (const s of sessions) {
    const bucket = getTimeOfDayBucket(s.timestamp);
    buckets[bucket].sessionsCount += 1;
    buckets[bucket].roundsCount += s.completedRounds;
    buckets[bucket].durationSeconds += s.durationSeconds;
    totalSessions += 1;

    const hour = new Date(s.timestamp).getHours();
    hourCounts[hour] += s.completedRounds > 0 ? s.completedRounds : 1;
  }

  // Find peak hour
  let peakHour: number | null = null;
  let maxHourScore = 0;
  for (let h = 0; h < 24; h++) {
    if (hourCounts[h] > maxHourScore) {
      maxHourScore = hourCounts[h];
      peakHour = h;
    }
  }

  // Format array
  const bucketKeys: TimeOfDayBucket[] = ['morning', 'afternoon', 'evening', 'night'];
  const allBuckets: TimeOfDayStat[] = bucketKeys.map((key) => {
    const b = buckets[key];
    const percentage = totalSessions > 0 ? Math.round((b.sessionsCount / totalSessions) * 100) : 0;
    return {
      bucket: key,
      label: b.label,
      timeRange: b.timeRange,
      iconName: b.iconName,
      sessionsCount: b.sessionsCount,
      roundsCount: b.roundsCount,
      durationSeconds: b.durationSeconds,
      durationMinutes: Math.round((b.durationSeconds / 60) * 10) / 10,
      percentage,
    };
  });

  // Determine best bucket (by rounds first, then sessions)
  let bestBucket: TimeOfDayStat | null = null;
  if (totalSessions > 0) {
    bestBucket = [...allBuckets].sort((a, b) => {
      if (b.roundsCount !== a.roundsCount) return b.roundsCount - a.roundsCount;
      return b.sessionsCount - a.sessionsCount;
    })[0];
  }

  let summary = 'Start a session to discover your most productive breathing window.';
  if (bestBucket && bestBucket.sessionsCount > 0) {
    const pct = bestBucket.percentage;
    const name = bestBucket.label.toLowerCase();
    summary = `You achieve maximum focus during the ${name}. ${pct}% of your mindful sessions take place in this window.`;
  }

  return {
    bestBucket,
    allBuckets,
    peakHour,
    peakHourLabel: peakHour !== null ? formatHourRangeLabel(peakHour) : 'No data yet',
    summary,
  };
}

/**
 * Calculate weekly streaks and recent weekly consistency status
 */
export function calculateWeeklyStreaks(
  sessions: SessionRecord[],
  referenceDate: Date = new Date(),
  weeksCount: number = 8
): WeeklyStreakResult {
  const currentMonday = getMondayOfWeek(referenceDate);
  const currentWeekKey = getWeekKey(currentMonday);

  // Group sessions by weekKey
  const weekSessionsMap = new Map<string, { rounds: number; seconds: number; count: number }>();
  for (const s of sessions) {
    const sDate = new Date(s.timestamp);
    const sMonday = getMondayOfWeek(sDate);
    const wKey = getWeekKey(sMonday);

    const prev = weekSessionsMap.get(wKey) || { rounds: 0, seconds: 0, count: 0 };
    prev.rounds += s.completedRounds;
    prev.seconds += s.durationSeconds;
    prev.count += 1;
    weekSessionsMap.set(wKey, prev);
  }

  // Generate sequence of recent weeks from earliest to latest
  const recentWeeks: WeekStreakItem[] = [];
  for (let i = weeksCount - 1; i >= 0; i--) {
    const monday = new Date(currentMonday);
    monday.setDate(currentMonday.getDate() - i * 7);
    const wKey = getWeekKey(monday);
    const isCurrent = wKey === currentWeekKey;
    const stat = weekSessionsMap.get(wKey);
    const hasActivity = !!stat && (stat.rounds > 0 || stat.seconds >= 20);

    recentWeeks.push({
      weekKey: wKey,
      label: getWeekLabel(monday),
      isCurrent,
      hasActivity,
      rounds: stat ? stat.rounds : 0,
      minutes: stat ? Math.round((stat.seconds / 60) * 10) / 10 : 0,
      sessions: stat ? stat.count : 0,
    });
  }

  // Calculate current weekly streak
  // A streak is continuous consecutive weeks with activity.
  // If current week has activity, streak includes it and goes back.
  // If current week does not yet have activity (e.g. Monday morning), check if previous week had activity;
  // if so, streak from previous week is active.
  let currentWeeklyStreak = 0;
  const currentWeekData = recentWeeks.find((w) => w.isCurrent);
  let checkMonday = new Date(currentMonday);

  if (currentWeekData && currentWeekData.hasActivity) {
    currentWeeklyStreak++;
    checkMonday.setDate(checkMonday.getDate() - 7);
  } else {
    // Current week not yet active, test last week
    checkMonday.setDate(checkMonday.getDate() - 7);
    const lastWeekKey = getWeekKey(checkMonday);
    const lastWeekStat = weekSessionsMap.get(lastWeekKey);
    const lastWeekActive = !!lastWeekStat && (lastWeekStat.rounds > 0 || lastWeekStat.seconds >= 20);
    if (!lastWeekActive) {
      currentWeeklyStreak = 0;
    }
  }

  // Count backwards while each week was active
  while (true) {
    const wKey = getWeekKey(checkMonday);
    const stat = weekSessionsMap.get(wKey);
    const active = !!stat && (stat.rounds > 0 || stat.seconds >= 20);
    if (active) {
      currentWeeklyStreak++;
      checkMonday.setDate(checkMonday.getDate() - 7);
    } else {
      break;
    }
  }

  // Calculate longest weekly streak across all available recorded weeks
  let longestWeeklyStreak = currentWeeklyStreak;
  if (weekSessionsMap.size > 0) {
    // Get all Mondays from sessions
    const sessionMondays = sessions.map((s) => getMondayOfWeek(new Date(s.timestamp)).getTime());
    const minMonday = new Date(Math.min(...sessionMondays, currentMonday.getTime()));
    let runner = new Date(minMonday);
    let tempStreak = 0;

    while (runner <= currentMonday) {
      const wKey = getWeekKey(runner);
      const stat = weekSessionsMap.get(wKey);
      if (stat && (stat.rounds > 0 || stat.seconds >= 20)) {
        tempStreak++;
        if (tempStreak > longestWeeklyStreak) {
          longestWeeklyStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
      runner.setDate(runner.getDate() + 7);
    }
  }

  // Calculate weekly consistency rate across the tracked window
  const activeCount = recentWeeks.filter((w) => w.hasActivity).length;
  const weeklyConsistencyRate = Math.round((activeCount / recentWeeks.length) * 100);

  let streakMessage = 'Complete a session this week to build your weekly streak!';
  if (currentWeeklyStreak > 1) {
    streakMessage = `Incredible dedication! You are on an active ${currentWeeklyStreak}-week streak.`;
  } else if (currentWeeklyStreak === 1) {
    streakMessage = 'Week 1 streak active! Keep breathing next week to extend your streak.';
  }

  return {
    currentWeeklyStreak,
    longestWeeklyStreak: Math.max(longestWeeklyStreak, currentWeeklyStreak),
    currentDailyStreak: 0, // Handled by calculateStreak from statsStorage
    recentWeeks,
    weeklyConsistencyRate,
    streakMessage,
  };
}

/**
 * Calculate monthly breathing consistency over the last N months
 * for display in Recharts Area/Bar charts.
 */
export function calculateMonthlyConsistency(
  sessions: SessionRecord[],
  referenceDate: Date = new Date(),
  monthsCount: number = 6
): MonthlyConsistencyStat[] {
  const result: MonthlyConsistencyStat[] = [];
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();

  // Create list of N months leading up to referenceDate
  for (let i = monthsCount - 1; i >= 0; i--) {
    const targetDate = new Date(refYear, refMonth - i, 1);
    const year = targetDate.getFullYear();
    const monthIndex = targetDate.getMonth();
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const monthLabel = targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const monthShort = targetDate.toLocaleDateString('en-US', { month: 'short' });

    // Days in this month
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    result.push({
      monthKey,
      monthLabel,
      monthShort,
      year,
      monthIndex,
      totalRounds: 0,
      totalDurationSeconds: 0,
      totalMinutes: 0,
      sessionCount: 0,
      activeDays: 0,
      daysInMonth,
      consistencyRate: 0,
    });
  }

  // Map for fast indexing
  const monthMap = new Map<string, MonthlyConsistencyStat>();
  const activeDaysMap = new Map<string, Set<string>>(); // monthKey -> set of dateStrs

  for (const m of result) {
    monthMap.set(m.monthKey, m);
    activeDaysMap.set(m.monthKey, new Set<string>());
  }

  for (const s of sessions) {
    const d = new Date(s.timestamp);
    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthEntry = monthMap.get(mKey);

    if (monthEntry) {
      monthEntry.totalRounds += s.completedRounds;
      monthEntry.totalDurationSeconds += s.durationSeconds;
      monthEntry.sessionCount += 1;

      const dateStr = formatDateKey(d);
      activeDaysMap.get(mKey)?.add(dateStr);
    }
  }

  // Finalize statistics
  for (const m of result) {
    const activeDaysSet = activeDaysMap.get(m.monthKey);
    m.activeDays = activeDaysSet ? activeDaysSet.size : 0;
    m.totalMinutes = Math.round((m.totalDurationSeconds / 60) * 10) / 10;
    // Consistency rate: active days relative to days passed in month
    // If it's the current month, compare to days elapsed so far so the rate isn't artificially deflated
    const isCurrentMonth = m.year === refYear && m.monthIndex === refMonth;
    const comparisonDays = isCurrentMonth ? Math.max(1, referenceDate.getDate()) : m.daysInMonth;
    m.consistencyRate = Math.min(100, Math.round((m.activeDays / comparisonDays) * 100));
  }

  return result;
}

/**
 * Aggregates all insights into a comprehensive object
 */
export function calculateInsights(
  sessions: SessionRecord[],
  referenceDate: Date = new Date()
): InsightsData {
  let totalRounds = 0;
  let totalDurationSeconds = 0;
  for (const s of sessions) {
    totalRounds += s.completedRounds;
    totalDurationSeconds += s.durationSeconds;
  }

  const weeklyStreaks = calculateWeeklyStreaks(sessions, referenceDate, 8);
  const bestTimeOfDay = calculateBestTimeOfDay(sessions);
  const monthlyConsistency = calculateMonthlyConsistency(sessions, referenceDate, 6);

  // Overall mindful consistency score (0 - 100) combining weekly consistency, streak, and monthly activity
  const activeWeeksScore = weeklyStreaks.weeklyConsistencyRate * 0.5;
  const streakBonus = Math.min(30, weeklyStreaks.currentWeeklyStreak * 10);
  const monthlyScore = (monthlyConsistency[monthlyConsistency.length - 1]?.consistencyRate || 0) * 0.2;
  const overallConsistencyScore = Math.min(100, Math.round(activeWeeksScore + streakBonus + monthlyScore));

  return {
    weeklyStreaks,
    bestTimeOfDay,
    monthlyConsistency,
    totalSessions: sessions.length,
    totalRounds,
    totalMinutes: Math.round((totalDurationSeconds / 60) * 10) / 10,
    overallConsistencyScore: sessions.length > 0 ? Math.max(12, overallConsistencyScore) : 0,
  };
}
