export interface SessionRecord {
  id: string;
  timestamp: number; // Date.now()
  completedRounds: number;
  durationSeconds: number;
  levelId: number;
  levelName: string;
  secondsPerPhase: number;
}

export interface DayActivity {
  dateStr: string; // YYYY-MM-DD
  dayName: string; // Mon, Tue, etc.
  dayShort: string;
  rounds: number;
  seconds: number;
}

export interface WeeklyStat {
  weekKey: string; // e.g., '2026-W43'
  weekStartDate: string; // YYYY-MM-DD
  weekEndDate: string; // YYYY-MM-DD
  label: string; // e.g., 'Oct 19 – Oct 25'
  isCurrentWeek: boolean;
  totalRounds: number;
  totalDurationSeconds: number;
  totalMinutes: number; // rounded to 1 decimal place or whole
  sessionCount: number;
  dailyBreakdown: DayActivity[];
}

export interface AllTimeStats {
  totalRounds: number;
  totalDurationSeconds: number;
  totalMinutes: number;
  totalSessions: number;
  currentStreakDays: number;
  bestDay: { dateStr: string; rounds: number } | null;
}
