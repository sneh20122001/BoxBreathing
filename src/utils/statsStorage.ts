import { AllTimeStats, DayActivity, SessionRecord, WeeklyStat } from '../types/stats';

export const STATS_STORAGE_KEY = 'box_breathing_history';

/**
 * Format Date as YYYY-MM-DD in local time
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get the Monday start of week for any date
 */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get ISO week key (e.g. "2026-W43") from a Monday date
 */
export function getWeekKey(monday: Date): string {
  const d = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Human-readable week range label: e.g. "Oct 19 – Oct 25"
 */
export function getWeekLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startMonth = monday.toLocaleDateString('en-US', { month: 'short' });
  const startDay = monday.getDate();
  const endMonth = sunday.toLocaleDateString('en-US', { month: 'short' });
  const endDay = sunday.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
}

/**
 * Aggregates a list of session records into a list of weekly statistics.
 * Guarantees that at least the current week is present even if empty.
 * Sorted chronologically descending (most recent week first).
 */
export function aggregateWeeklyStats(
  sessions: SessionRecord[],
  referenceDate: Date = new Date()
): WeeklyStat[] {
  const currentMonday = getMondayOfWeek(referenceDate);
  const currentWeekKey = getWeekKey(currentMonday);

  // Map to collect data keyed by monday.getTime()
  const weekMap = new Map<
    number,
    {
      monday: Date;
      weekKey: string;
      sessions: SessionRecord[];
    }
  >();

  // Ensure current week is initialized
  const currentMondayTime = currentMonday.getTime();
  weekMap.set(currentMondayTime, {
    monday: currentMonday,
    weekKey: currentWeekKey,
    sessions: [],
  });

  // Group each session by its Monday
  for (const session of sessions) {
    const sessionDate = new Date(session.timestamp);
    const sessionMonday = getMondayOfWeek(sessionDate);
    const mondayTime = sessionMonday.getTime();

    if (!weekMap.has(mondayTime)) {
      weekMap.set(mondayTime, {
        monday: sessionMonday,
        weekKey: getWeekKey(sessionMonday),
        sessions: [],
      });
    }
    weekMap.get(mondayTime)!.sessions.push(session);
  }

  // Convert map to array sorted by monday descending
  const sortedMondays = Array.from(weekMap.entries()).sort((a, b) => b[0] - a[0]);

  return sortedMondays.map(([_, { monday, weekKey, sessions: weekSessions }]) => {
    let totalRounds = 0;
    let totalDurationSeconds = 0;

    // Daily breakdown for Monday through Sunday
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyBreakdown: DayActivity[] = dayNames.map((name, idx) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + idx);
      return {
        dateStr: formatDateKey(dayDate),
        dayName: name,
        dayShort: name[0],
        rounds: 0,
        seconds: 0,
      };
    });

    const dayMap = new Map<string, DayActivity>();
    for (const day of dailyBreakdown) {
      dayMap.set(day.dateStr, day);
    }

    for (const s of weekSessions) {
      totalRounds += s.completedRounds;
      totalDurationSeconds += s.durationSeconds;

      const dateStr = formatDateKey(new Date(s.timestamp));
      const dayEntry = dayMap.get(dateStr);
      if (dayEntry) {
        dayEntry.rounds += s.completedRounds;
        dayEntry.seconds += s.durationSeconds;
      }
    }

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const isCurrentWeek = weekKey === currentWeekKey;
    const totalMinutes = Math.round((totalDurationSeconds / 60) * 10) / 10;

    return {
      weekKey,
      weekStartDate: formatDateKey(monday),
      weekEndDate: formatDateKey(sunday),
      label: isCurrentWeek ? `This Week (${getWeekLabel(monday)})` : getWeekLabel(monday),
      isCurrentWeek,
      totalRounds,
      totalDurationSeconds,
      totalMinutes,
      sessionCount: weekSessions.length,
      dailyBreakdown,
    };
  });
}

/**
 * Calculates all-time statistics across all recorded sessions.
 */
export function calculateAllTimeStats(
  sessions: SessionRecord[],
  referenceDate: Date = new Date()
): AllTimeStats {
  let totalRounds = 0;
  let totalDurationSeconds = 0;
  const dayRoundsMap = new Map<string, number>();

  for (const s of sessions) {
    totalRounds += s.completedRounds;
    totalDurationSeconds += s.durationSeconds;

    const dateStr = formatDateKey(new Date(s.timestamp));
    dayRoundsMap.set(dateStr, (dayRoundsMap.get(dateStr) || 0) + s.completedRounds);
  }

  // Find best day
  let bestDay: { dateStr: string; rounds: number } | null = null;
  for (const [dateStr, rounds] of dayRoundsMap.entries()) {
    if (!bestDay || rounds > bestDay.rounds) {
      bestDay = { dateStr, rounds };
    }
  }

  const currentStreakDays = calculateStreak(sessions, referenceDate);
  const totalMinutes = Math.round((totalDurationSeconds / 60) * 10) / 10;

  return {
    totalRounds,
    totalDurationSeconds,
    totalMinutes,
    totalSessions: sessions.length,
    currentStreakDays,
    bestDay,
  };
}

/**
 * Calculates current consecutive days streak leading up to today (or yesterday).
 */
export function calculateStreak(
  sessions: SessionRecord[],
  referenceDate: Date = new Date()
): number {
  if (sessions.length === 0) return 0;

  const datesWithActivity = new Set<string>();
  for (const s of sessions) {
    if (s.completedRounds > 0 || s.durationSeconds >= 20) {
      datesWithActivity.add(formatDateKey(new Date(s.timestamp)));
    }
  }

  const checkDate = new Date(referenceDate);
  checkDate.setHours(0, 0, 0, 0);

  const todayStr = formatDateKey(checkDate);
  let streak = 0;

  // Check if today has activity
  if (datesWithActivity.has(todayStr)) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Check if yesterday had activity; if so, streak is still active
    checkDate.setDate(checkDate.getDate() - 1);
    if (!datesWithActivity.has(formatDateKey(checkDate))) {
      return 0;
    }
  }

  // Continue counting backwards
  while (datesWithActivity.has(formatDateKey(checkDate))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

/**
 * Format total seconds into a clean "Xm Ys" or "X min" display
 */
export function formatMinutesDisplay(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return `${Math.round(totalSeconds)}s`;
  }
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  if (secs === 0) {
    return `${mins}m`;
  }
  return `${mins}m ${secs}s`;
}

/**
 * LocalStorage Helpers
 */
export function getStoredHistory(): SessionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to parse breathing history from localStorage', err);
  }
  return [];
}

export function saveHistoryRecord(record: SessionRecord): SessionRecord[] {
  if (typeof window === 'undefined') return [record];
  try {
    const existing = getStoredHistory();
    const updated = [record, ...existing];
    // Keep max 200 sessions to avoid bloat
    const trimmed = updated.slice(0, 200);
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch (err) {
    console.error('Failed to save breathing session to localStorage', err);
    return [];
  }
}

export function clearStoredHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STATS_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear breathing history from localStorage', err);
  }
}

/**
 * Generate rich, realistic sample history across the last 3 weeks
 * to allow instant preview and exploration.
 */
export function generateSampleHistory(referenceDate: Date = new Date()): SessionRecord[] {
  const sample: SessionRecord[] = [];
  const base = new Date(referenceDate);

  // 14 days of realistic sessions across 3 calendar weeks
  const offsets = [
    { daysAgo: 0, rounds: 5, secs: 100, levelId: 1, levelName: 'Level 1', phaseSec: 5 },
    { daysAgo: 0, rounds: 3, secs: 84, levelId: 2, levelName: 'Level 2', phaseSec: 7 },
    { daysAgo: 1, rounds: 5, secs: 140, levelId: 2, levelName: 'Level 2', phaseSec: 7 },
    { daysAgo: 2, rounds: 8, secs: 160, levelId: 1, levelName: 'Level 1', phaseSec: 5 },
    { daysAgo: 3, rounds: 5, secs: 180, levelId: 3, levelName: 'Level 3', phaseSec: 9 },
    { daysAgo: 5, rounds: 5, secs: 100, levelId: 1, levelName: 'Level 1', phaseSec: 5 },
    { daysAgo: 7, rounds: 5, secs: 140, levelId: 2, levelName: 'Level 2', phaseSec: 7 },
    { daysAgo: 8, rounds: 10, secs: 200, levelId: 1, levelName: 'Level 1', phaseSec: 5 },
    { daysAgo: 10, rounds: 5, secs: 180, levelId: 3, levelName: 'Level 3', phaseSec: 9 },
    { daysAgo: 12, rounds: 5, secs: 100, levelId: 1, levelName: 'Level 1', phaseSec: 5 },
    { daysAgo: 15, rounds: 5, secs: 140, levelId: 2, levelName: 'Level 2', phaseSec: 7 },
    { daysAgo: 18, rounds: 8, secs: 160, levelId: 1, levelName: 'Level 1', phaseSec: 5 },
  ];

  offsets.forEach((item, idx) => {
    const d = new Date(base);
    d.setDate(base.getDate() - item.daysAgo);
    d.setHours(9 + (idx % 8), 15 + (idx * 3) % 40, 0, 0);

    sample.push({
      id: `sample-${idx}-${d.getTime()}`,
      timestamp: d.getTime(),
      completedRounds: item.rounds,
      durationSeconds: item.secs,
      levelId: item.levelId,
      levelName: item.levelName,
      secondsPerPhase: item.phaseSec,
    });
  });

  return sample;
}
