import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionRecord } from '../types/stats';
import {
  DEFAULT_DAILY_GOAL_MINUTES,
  calculateDailyGoalStats,
  groupSessionsByDay,
} from './dailyGoals';

function makeSession(daysAgo: number, seconds: number, rounds: number = 3, baseDate: Date = new Date('2026-10-22T12:00:00Z')): SessionRecord {
  const d = new Date(baseDate);
  d.setDate(d.getDate() - daysAgo);
  return {
    id: `sess-${daysAgo}-${seconds}`,
    timestamp: d.getTime(),
    completedRounds: rounds,
    durationSeconds: seconds,
    levelId: 1,
    levelName: 'Level 1',
    secondsPerPhase: 4,
  };
}

test('calculateDailyGoalStats with empty sessions returns zero progress and clean defaults', () => {
  const refDate = new Date('2026-10-22T10:00:00');
  const stats = calculateDailyGoalStats([], 5, refDate);

  assert.equal(stats.targetMinutes, 5);
  assert.equal(stats.todayMinutes, 0);
  assert.equal(stats.todaySeconds, 0);
  assert.equal(stats.todayRounds, 0);
  assert.equal(stats.progressPct, 0);
  assert.equal(stats.isGoalMetToday, false);
  assert.equal(stats.remainingMinutes, 5);
  assert.equal(stats.remainingSeconds, 300);
  assert.equal(stats.currentStreak, 0);
  assert.equal(stats.longestStreak, 0);
  assert.equal(stats.totalDaysGoalMet, 0);
  assert.equal(stats.streakStatus, 'not_started');
  assert.equal(stats.last7Days.length, 7);
  assert.equal(stats.last7Days[stats.last7Days.length - 1].isToday, true);
});

test('calculateDailyGoalStats accurately computes partial progress today', () => {
  const refDate = new Date('2026-10-22T14:00:00');
  // 120 seconds = 2.0 minutes towards a 5-minute (300 seconds) goal
  const sessions: SessionRecord[] = [
    makeSession(0, 120, 4, refDate),
  ];

  const stats = calculateDailyGoalStats(sessions, 5, refDate);

  assert.equal(stats.todayMinutes, 2);
  assert.equal(stats.todaySeconds, 120);
  assert.equal(stats.todayRounds, 4);
  assert.equal(stats.progressPct, 40); // 120 / 300 = 40%
  assert.equal(stats.rawProgressPct, 40);
  assert.equal(stats.isGoalMetToday, false);
  assert.equal(stats.remainingMinutes, 3);
  assert.equal(stats.remainingSeconds, 180);
  assert.equal(stats.currentStreak, 0);
  assert.equal(stats.streakStatus, 'not_started');
});

test('calculateDailyGoalStats flags goal met and initiates 1-day streak when goal reached today', () => {
  const refDate = new Date('2026-10-22T15:30:00');
  // 300 seconds = 5 minutes = 100% of 5 min goal
  const sessions: SessionRecord[] = [
    makeSession(0, 180, 5, refDate),
    makeSession(0, 120, 3, refDate),
  ];

  const stats = calculateDailyGoalStats(sessions, 5, refDate);

  assert.equal(stats.todayMinutes, 5);
  assert.equal(stats.todaySeconds, 300);
  assert.equal(stats.todayRounds, 8);
  assert.equal(stats.progressPct, 100);
  assert.equal(stats.isGoalMetToday, true);
  assert.equal(stats.remainingMinutes, 0);
  assert.equal(stats.remainingSeconds, 0);
  assert.equal(stats.currentStreak, 1);
  assert.equal(stats.streakStatus, 'completed');
  assert.equal(stats.totalDaysGoalMet, 1);
  assert.equal(stats.longestStreak, 1);
});

test('calculateDailyGoalStats caps progressPct at 100 but preserves rawProgressPct when exceeded', () => {
  const refDate = new Date('2026-10-22T16:00:00');
  // 600 seconds = 10 minutes on a 5-minute goal = 200%
  const sessions: SessionRecord[] = [
    makeSession(0, 600, 12, refDate),
  ];

  const stats = calculateDailyGoalStats(sessions, 5, refDate);

  assert.equal(stats.progressPct, 100);
  assert.equal(stats.rawProgressPct, 200);
  assert.equal(stats.remainingMinutes, 0);
  assert.equal(stats.isGoalMetToday, true);
});

test('calculateDailyGoalStats preserves streak as "in_progress" if yesterday met goal but today is pending', () => {
  const refDate = new Date('2026-10-22T09:00:00');
  // Yesterday (1 day ago) and 2 days ago met the 5m goal; today has 0
  const sessions: SessionRecord[] = [
    makeSession(1, 320, 6, refDate),
    makeSession(2, 300, 5, refDate),
  ];

  const stats = calculateDailyGoalStats(sessions, 5, refDate);

  assert.equal(stats.isGoalMetToday, false);
  assert.equal(stats.currentStreak, 2);
  assert.equal(stats.streakStatus, 'in_progress');
  assert.equal(stats.longestStreak, 2);
  assert.equal(stats.totalDaysGoalMet, 2);
});

test('calculateDailyGoalStats increments streak when today is also completed on top of prior streak', () => {
  const refDate = new Date('2026-10-22T18:00:00');
  // Consecutive days: 3 days ago, 2 days ago, yesterday, and today
  const sessions: SessionRecord[] = [
    makeSession(0, 310, 6, refDate),
    makeSession(1, 340, 7, refDate),
    makeSession(2, 300, 5, refDate),
    makeSession(3, 400, 8, refDate),
  ];

  const stats = calculateDailyGoalStats(sessions, 5, refDate);

  assert.equal(stats.isGoalMetToday, true);
  assert.equal(stats.currentStreak, 4);
  assert.equal(stats.longestStreak, 4);
  assert.equal(stats.streakStatus, 'completed');
  assert.equal(stats.totalDaysGoalMet, 4);
});

test('calculateDailyGoalStats breaks streak if yesterday was missed', () => {
  const refDate = new Date('2026-10-22T10:00:00');
  // 2 days ago met goal, but yesterday (1 day ago) only did 30 seconds (goal not met), today 0
  const sessions: SessionRecord[] = [
    makeSession(1, 30, 1, refDate), // missed
    makeSession(2, 350, 6, refDate), // met
  ];

  const stats = calculateDailyGoalStats(sessions, 5, refDate);

  assert.equal(stats.isGoalMetToday, false);
  assert.equal(stats.currentStreak, 0);
  assert.equal(stats.streakStatus, 'not_started');
  assert.equal(stats.longestStreak, 1);
});

test('groupSessionsByDay accurately sums multiple sessions on the same date', () => {
  const refDate = new Date('2026-10-22T10:00:00');
  const sessions: SessionRecord[] = [
    makeSession(0, 60, 2, refDate),
    makeSession(0, 120, 3, refDate),
    makeSession(1, 200, 4, refDate),
  ];

  const grouped = groupSessionsByDay(sessions);
  assert.equal(grouped.size, 2);
  const todayEntry = grouped.get('2026-10-22');
  assert.ok(todayEntry);
  assert.equal(todayEntry.seconds, 180);
  assert.equal(todayEntry.rounds, 5);
  assert.equal(todayEntry.sessionCount, 2);
});
