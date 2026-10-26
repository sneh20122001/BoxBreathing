import { SessionRecord } from '../types/stats';
import { formatDateKey } from './statsStorage';

export const DEFAULT_DAILY_GOAL_MINUTES = 5;
export const DAILY_GOAL_STORAGE_KEY = 'box_breathing_daily_goal_minutes';
export const DAILY_GOAL_PRESETS = [3, 5, 10, 15, 20] as const;

export interface DailyDayActivity {
  dateStr: string; // YYYY-MM-DD
  dayName: string; // Mon, Tue, etc.
  dayShort: string; // M, T, W...
  minutes: number;
  seconds: number;
  rounds: number;
  isGoalMet: boolean;
  isToday: boolean;
}

export interface DailyGoalStats {
  targetMinutes: number;
  todayMinutes: number;
  todaySeconds: number;
  todayRounds: number;
  todaySessionCount: number;
  progressPct: number; // 0 - 100 clamped
  rawProgressPct: number; // can exceed 100%
  isGoalMetToday: boolean;
  remainingMinutes: number;
  remainingSeconds: number;
  currentStreak: number;
  longestStreak: number;
  totalDaysGoalMet: number;
  streakStatus: 'completed' | 'in_progress' | 'not_started';
  last7Days: DailyDayActivity[];
}

/**
 * Get daily goal in minutes from localStorage safely
 */
export function getStoredDailyGoal(): number {
  if (typeof window === 'undefined') return DEFAULT_DAILY_GOAL_MINUTES;
  try {
    const raw = localStorage.getItem(DAILY_GOAL_STORAGE_KEY);
    if (!raw) return DEFAULT_DAILY_GOAL_MINUTES;
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 120) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to read daily goal from localStorage', err);
  }
  return DEFAULT_DAILY_GOAL_MINUTES;
}

/**
 * Persist daily goal in minutes to localStorage
 */
export function setStoredDailyGoal(minutes: number): void {
  if (typeof window === 'undefined') return;
  try {
    const clamped = Math.max(1, Math.min(120, Math.round(minutes)));
    localStorage.setItem(DAILY_GOAL_STORAGE_KEY, clamped.toString());
  } catch (err) {
    console.error('Failed to save daily goal to localStorage', err);
  }
}

/**
 * Group sessions by day string (YYYY-MM-DD)
 */
export function groupSessionsByDay(
  sessions: SessionRecord[]
): Map<string, { seconds: number; rounds: number; sessionCount: number }> {
  const map = new Map<string, { seconds: number; rounds: number; sessionCount: number }>();
  for (const s of sessions) {
    const dateStr = formatDateKey(new Date(s.timestamp));
    const curr = map.get(dateStr) || { seconds: 0, rounds: 0, sessionCount: 0 };
    curr.seconds += s.durationSeconds;
    curr.rounds += s.completedRounds;
    curr.sessionCount += 1;
    map.set(dateStr, curr);
  }
  return map;
}

/**
 * Compute daily goal progress, streaks, and rolling 7-day cadence
 */
export function calculateDailyGoalStats(
  sessions: SessionRecord[],
  targetMinutes: number,
  referenceDate: Date = new Date()
): DailyGoalStats {
  const validTargetMinutes = Math.max(1, Math.min(120, Math.round(targetMinutes || DEFAULT_DAILY_GOAL_MINUTES)));
  const targetSeconds = validTargetMinutes * 60;

  const todayStr = formatDateKey(referenceDate);
  const dayGroupMap = groupSessionsByDay(sessions);

  // Today's numbers
  const todayEntry = dayGroupMap.get(todayStr) || { seconds: 0, rounds: 0, sessionCount: 0 };
  const todaySeconds = todayEntry.seconds;
  const todayMinutes = Math.round((todaySeconds / 60) * 10) / 10;
  const todayRounds = todayEntry.rounds;
  const todaySessionCount = todayEntry.sessionCount;

  // Progress calculations
  const rawProgressPct = targetSeconds > 0 ? (todaySeconds / targetSeconds) * 100 : 0;
  const progressPct = Math.min(100, Math.max(0, Math.round(rawProgressPct)));
  const isGoalMetToday = todaySeconds >= targetSeconds;

  const remainingSeconds = Math.max(0, targetSeconds - todaySeconds);
  const remainingMinutes = Math.max(0, Math.round((remainingSeconds / 60) * 10) / 10);

  // Streak calculations
  const checkDate = new Date(referenceDate);
  checkDate.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  let streakStatus: 'completed' | 'in_progress' | 'not_started' = 'not_started';

  if (isGoalMetToday) {
    currentStreak++;
    streakStatus = 'completed';
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Check if yesterday met the goal - if so, streak is still alive ("in progress" today)
    const yesterday = new Date(checkDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateKey(yesterday);
    const yestData = dayGroupMap.get(yesterdayStr);

    if (yestData && yestData.seconds >= targetSeconds) {
      streakStatus = 'in_progress';
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      streakStatus = 'not_started';
    }
  }

  // Count backwards while each consecutive day met target
  if (streakStatus !== 'not_started') {
    while (true) {
      const dateKey = formatDateKey(checkDate);
      const dayData = dayGroupMap.get(dateKey);
      if (dayData && dayData.seconds >= targetSeconds) {
        // If today was not met, we only count the previous consecutive days
        if (!isGoalMetToday && currentStreak === 0) {
          currentStreak = 1;
        } else if (isGoalMetToday || currentStreak > 0) {
          if (!isGoalMetToday && checkDate.getTime() === new Date(referenceDate).setHours(0,0,0,0) - 86400000) {
            // Already counted above as base
          } else {
            currentStreak++;
          }
        }
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate total days goal met & longest streak across all recorded history
  let totalDaysGoalMet = 0;
  const daysMeetingGoal = new Set<string>();

  for (const [dateKey, dayData] of dayGroupMap.entries()) {
    if (dayData.seconds >= targetSeconds) {
      totalDaysGoalMet++;
      daysMeetingGoal.add(dateKey);
    }
  }

  // Longest streak calculation across sorted dates
  let longestStreak = 0;
  if (daysMeetingGoal.size > 0) {
    const sortedDates = Array.from(daysMeetingGoal).sort();
    let tempStreak = 0;
    let prevTime: number | null = null;

    for (const dStr of sortedDates) {
      const [year, month, day] = dStr.split('-').map(Number);
      const currTime = new Date(year, month - 1, day).getTime();

      if (prevTime === null) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((currTime - prevTime) / 86400000);
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      prevTime = currTime;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  // Rolling 7 Days Activity (today and the 6 preceding days)
  const last7Days: DailyDayActivity[] = [];
  const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(referenceDate.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const dStr = formatDateKey(d);
    const dayData = dayGroupMap.get(dStr);
    const secs = dayData ? dayData.seconds : 0;
    const rnds = dayData ? dayData.rounds : 0;
    const mins = Math.round((secs / 60) * 10) / 10;
    const met = secs >= targetSeconds;
    const isToday = dStr === todayStr;

    last7Days.push({
      dateStr: dStr,
      dayName: dayNamesShort[d.getDay()],
      dayShort: dayNamesShort[d.getDay()][0],
      minutes: mins,
      seconds: secs,
      rounds: rnds,
      isGoalMet: met,
      isToday,
    });
  }

  return {
    targetMinutes: validTargetMinutes,
    todayMinutes,
    todaySeconds,
    todayRounds,
    todaySessionCount,
    progressPct,
    rawProgressPct: Math.round(rawProgressPct * 10) / 10,
    isGoalMetToday,
    remainingMinutes,
    remainingSeconds,
    currentStreak,
    longestStreak,
    totalDaysGoalMet,
    streakStatus,
    last7Days,
  };
}
