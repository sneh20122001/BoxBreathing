import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDateKey,
  getMondayOfWeek,
  getWeekKey,
  getWeekLabel,
  aggregateWeeklyStats,
  calculateAllTimeStats,
  calculateStreak,
  formatMinutesDisplay,
} from './statsStorage';
import { SessionRecord } from '../types/stats';

test('getMondayOfWeek finds correct Monday for various days of the week', () => {
  // 2026-10-21 is Wednesday
  const wed = new Date(2026, 9, 21, 10, 0, 0); // Month is 0-indexed: 9 = Oct
  const monday = getMondayOfWeek(wed);
  assert.equal(monday.getFullYear(), 2026);
  assert.equal(monday.getMonth(), 9);
  assert.equal(monday.getDate(), 19); // Monday is Oct 19

  // Sunday 2026-10-25 should resolve to Monday Oct 19
  const sun = new Date(2026, 9, 25, 23, 59, 59);
  const sunMonday = getMondayOfWeek(sun);
  assert.equal(sunMonday.getDate(), 19);

  // Monday 2026-10-19 should resolve to itself
  const mon = new Date(2026, 9, 19, 0, 0, 0);
  assert.equal(getMondayOfWeek(mon).getDate(), 19);
});

test('getWeekKey generates valid week identifier', () => {
  const mon = new Date(2026, 9, 19);
  const key = getWeekKey(mon);
  assert.match(key, /^2026-W\d{2}$/);
});

test('aggregateWeeklyStats groups sessions by week and tallies rounds and minutes', () => {
  const refDate = new Date(2026, 9, 21); // Wed Oct 21, 2026
  const sessions: SessionRecord[] = [
    {
      id: 's1',
      timestamp: new Date(2026, 9, 21, 10, 0).getTime(), // Wed this week
      completedRounds: 5,
      durationSeconds: 100,
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    },
    {
      id: 's2',
      timestamp: new Date(2026, 9, 20, 14, 0).getTime(), // Tue this week
      completedRounds: 3,
      durationSeconds: 84,
      levelId: 2,
      levelName: 'Level 2',
      secondsPerPhase: 7,
    },
    {
      id: 's3',
      timestamp: new Date(2026, 9, 14, 9, 0).getTime(), // Wed last week (Oct 14)
      completedRounds: 10,
      durationSeconds: 200,
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    },
  ];

  const weeks = aggregateWeeklyStats(sessions, refDate);

  // Must have at least 2 weeks: current week and previous week
  assert.ok(weeks.length >= 2);
  const currentWeek = weeks.find((w) => w.isCurrentWeek);
  assert.ok(currentWeek);
  assert.equal(currentWeek.totalRounds, 8); // 5 + 3
  assert.equal(currentWeek.totalDurationSeconds, 184); // 100 + 84
  assert.equal(currentWeek.totalMinutes, 3.1); // round(184/60, 1) = 3.1
  assert.equal(currentWeek.sessionCount, 2);

  // Check last week
  const lastWeek = weeks.find((w) => !w.isCurrentWeek);
  assert.ok(lastWeek);
  assert.equal(lastWeek.totalRounds, 10);
  assert.equal(lastWeek.totalDurationSeconds, 200);
});

test('aggregateWeeklyStats always includes current week even if sessions array is empty', () => {
  const refDate = new Date(2026, 9, 21);
  const weeks = aggregateWeeklyStats([], refDate);
  assert.equal(weeks.length, 1);
  assert.equal(weeks[0].isCurrentWeek, true);
  assert.equal(weeks[0].totalRounds, 0);
  assert.equal(weeks[0].totalMinutes, 0);
  assert.equal(weeks[0].sessionCount, 0);
  assert.equal(weeks[0].dailyBreakdown.length, 7);
});

test('calculateAllTimeStats computes lifetime aggregates and best day', () => {
  const refDate = new Date(2026, 9, 21);
  const sessions: SessionRecord[] = [
    {
      id: '1',
      timestamp: new Date(2026, 9, 20, 10, 0).getTime(),
      completedRounds: 5,
      durationSeconds: 100,
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    },
    {
      id: '2',
      timestamp: new Date(2026, 9, 20, 18, 0).getTime(), // Same day!
      completedRounds: 8,
      durationSeconds: 160,
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    },
    {
      id: '3',
      timestamp: new Date(2026, 9, 21, 9, 0).getTime(), // Today
      completedRounds: 4,
      durationSeconds: 80,
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    },
  ];

  const stats = calculateAllTimeStats(sessions, refDate);
  assert.equal(stats.totalRounds, 17); // 5 + 8 + 4
  assert.equal(stats.totalDurationSeconds, 340);
  assert.equal(stats.totalSessions, 3);
  assert.equal(stats.bestDay?.rounds, 13); // Oct 20 had 5 + 8 = 13 rounds
  assert.equal(stats.bestDay?.dateStr, '2026-10-20');
  assert.equal(stats.currentStreakDays, 2); // yesterday (20th) and today (21st)
});

test('calculateStreak counts consecutive active days correctly', () => {
  const refDate = new Date(2026, 9, 21); // Wed Oct 21
  const sessions: SessionRecord[] = [
    {
      id: '1',
      timestamp: new Date(2026, 9, 21).getTime(), // today
      completedRounds: 5,
      durationSeconds: 100,
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    },
    {
      id: '2',
      timestamp: new Date(2026, 9, 20).getTime(), // yesterday
      completedRounds: 5,
      durationSeconds: 100,
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    },
    {
      id: '3',
      timestamp: new Date(2026, 9, 19).getTime(), // 2 days ago
      completedRounds: 5,
      durationSeconds: 100,
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    },
  ];

  assert.equal(calculateStreak(sessions, refDate), 3);

  // If there's a gap on Oct 20
  const gappedSessions = [sessions[0], sessions[2]];
  assert.equal(calculateStreak(gappedSessions, refDate), 1);
});

test('formatMinutesDisplay outputs readable strings', () => {
  assert.equal(formatMinutesDisplay(45), '45s');
  assert.equal(formatMinutesDisplay(60), '1m');
  assert.equal(formatMinutesDisplay(150), '2m 30s');
  assert.equal(formatMinutesDisplay(300), '5m');
});
