import { SessionRecord } from './stats';

export type TimeOfDayBucket = 'morning' | 'afternoon' | 'evening' | 'night';

export interface TimeOfDayStat {
  bucket: TimeOfDayBucket;
  label: string;
  timeRange: string;
  iconName: 'sunrise' | 'sun' | 'sunset' | 'moon';
  sessionsCount: number;
  roundsCount: number;
  durationSeconds: number;
  durationMinutes: number;
  percentage: number; // percentage of total sessions
}

export interface BestTimeOfDayResult {
  bestBucket: TimeOfDayStat | null;
  allBuckets: TimeOfDayStat[];
  peakHour: number | null; // 0-23
  peakHourLabel: string;
  summary: string;
}

export interface WeekStreakItem {
  weekKey: string;
  label: string;
  isCurrent: boolean;
  hasActivity: boolean;
  rounds: number;
  minutes: number;
  sessions: number;
}

export interface WeeklyStreakResult {
  currentWeeklyStreak: number;
  longestWeeklyStreak: number;
  currentDailyStreak: number;
  recentWeeks: WeekStreakItem[];
  weeklyConsistencyRate: number; // e.g. 85%
  streakMessage: string;
}

export interface MonthlyConsistencyStat {
  monthKey: string; // YYYY-MM
  monthLabel: string; // "Oct 2026"
  monthShort: string; // "Oct"
  year: number;
  monthIndex: number; // 0-11
  totalRounds: number;
  totalDurationSeconds: number;
  totalMinutes: number;
  sessionCount: number;
  activeDays: number;
  daysInMonth: number;
  consistencyRate: number; // activeDays / daysInMonth percentage (0-100)
}

export interface InsightsData {
  weeklyStreaks: WeeklyStreakResult;
  bestTimeOfDay: BestTimeOfDayResult;
  monthlyConsistency: MonthlyConsistencyStat[];
  totalSessions: number;
  totalRounds: number;
  totalMinutes: number;
  overallConsistencyScore: number; // 0-100
}
