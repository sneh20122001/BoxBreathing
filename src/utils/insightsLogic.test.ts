import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getTimeOfDayBucket,
  formatHourRangeLabel,
  calculateBestTimeOfDay,
  calculateWeeklyStreaks,
  calculateMonthlyConsistency,
  calculateInsights,
} from './insightsLogic';
import { SessionRecord } from '../types/stats';

test('getTimeOfDayBucket categorizes hours correctly', () => {
  // Morning: 5am - 11am
  const morningDate = new Date('2026-10-21T08:30:00');
  assert.equal(getTimeOfDayBucket(morningDate.getTime()), 'morning');

  // Afternoon: 12pm - 4pm
  const afternoonDate = new Date('2026-10-21T14:15:00');
  assert.equal(getTimeOfDayBucket(afternoonDate.getTime()), 'afternoon');

  // Evening: 5pm - 8pm
  const eveningDate = new Date('2026-10-21T18:45:00');
  assert.equal(getTimeOfDayBucket(eveningDate.getTime()), 'evening');

  // Night: 9pm - 4am
  const lateNightDate = new Date('2026-10-21T23:10:00');
  assert.equal(getTimeOfDayBucket(lateNightDate.getTime()), 'night');
  const earlyNightDate = new Date('2026-10-21T02:00:00');
  assert.equal(getTimeOfDayBucket(earlyNightDate.getTime()), 'night');
});

test('formatHourRangeLabel outputs clean 12-hour labels', () => {
  assert.equal(formatHourRangeLabel(9), '9:00 AM – 10:00 AM');
  assert.equal(formatHourRangeLabel(12), '12:00 PM – 1:00 PM');
  assert.equal(formatHourRangeLabel(21), '9:00 PM – 10:00 PM');
  assert.equal(formatHourRangeLabel(0), '12:00 AM – 1:00 AM');
});

test('calculateBestTimeOfDay handles empty sessions gracefully', () => {
  const result = calculateBestTimeOfDay([]);
  assert.equal(result.bestBucket, null);
  assert.equal(result.peakHour, null);
  assert.equal(result.allBuckets.length, 4);
});

test('calculateBestTimeOfDay detects predominant time window and peak hour', () => {
  const sessions: SessionRecord[] = [
    {
      id: '1',
      timestamp: new Date('2026-10-21T08:15:00').getTime(),
      completedRounds: 5,
      durationSeconds: 100,
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    },
    {
      id: '2',
      timestamp: new Date('2026-10-21T08:45:00').getTime(),
      completedRounds: 7,
      durationSeconds: 140,
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    },
    {
      id: '3',
      timestamp: new Date('2026-10-21T14:00:00').getTime(),
      completedRounds: 3,
      durationSeconds: 60,
      levelId: 2,
      levelName: 'Level 2',
      secondsPerPhase: 7,
    },
  ];

  const result = calculateBestTimeOfDay(sessions);
  assert.equal(result.bestBucket?.bucket, 'morning');
  assert.equal(result.peakHour, 8);
  assert.equal(result.peakHourLabel, '8:00 AM – 9:00 AM');
  assert.equal(result.bestBucket?.roundsCount, 12);
  assert.ok(result.summary.includes('morning'));
});

test('calculateWeeklyStreaks tracks consecutive active weeks', () => {
  // Reference date: Wednesday Oct 21, 2026
  const refDate = new Date('2026-10-21T10:00:00');

  // Create sessions across 3 consecutive weeks
  const sessions: SessionRecord[] = [
    // This week (Oct 21)
    {
      id: 'w0',
      timestamp: new Date('2026-10-21T10:00:00').getTime(),
      completedRounds: 5,
      durationSeconds: 100,
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    },
    // Last week (Oct 14)
    {
      id: 'w1',
      timestamp: new Date('2026-10-14T10:00:00').getTime(),
      completedRounds: 5,
      durationSeconds: 100,
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    },
    // 2 weeks ago (Oct 7)
    {
      id: 'w2',
      timestamp: new Date('2026-10-07T10:00:00').getTime(),
      completedRounds: 5,
      durationSeconds: 100,
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    },
  ];

  const streakResult = calculateWeeklyStreaks(sessions, refDate, 6);
  assert.equal(streakResult.currentWeeklyStreak, 3);
  assert.equal(streakResult.longestWeeklyStreak, 3);
  assert.equal(streakResult.recentWeeks.length, 6);
  assert.ok(streakResult.streakMessage.includes('3-week streak'));
});

test('calculateMonthlyConsistency generates correct series and consistency rates', () => {
  const refDate = new Date('2026-10-21T10:00:00');
  const sessions: SessionRecord[] = [
    {
      id: 'm1',
      timestamp: new Date('2026-10-05T10:00:00').getTime(),
      completedRounds: 10,
      durationSeconds: 200,
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    },
    {
      id: 'm2',
      timestamp: new Date('2026-10-15T10:00:00').getTime(),
      completedRounds: 8,
      durationSeconds: 160,
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    },
    {
      id: 'm3',
      timestamp: new Date('2026-09-20T10:00:00').getTime(),
      completedRounds: 15,
      durationSeconds: 300,
      levelId: 2,
      levelName: 'Level 2',
      secondsPerPhase: 7,
    },
  ];

  const months = calculateMonthlyConsistency(sessions, refDate, 4);
  assert.equal(months.length, 4);

  // Oct 2026 is last
  const oct = months[3];
  assert.equal(oct.monthKey, '2026-10');
  assert.equal(oct.totalRounds, 18);
  assert.equal(oct.activeDays, 2);
  assert.equal(oct.sessionCount, 2);

  // Sept 2026 is 2nd to last
  const sept = months[2];
  assert.equal(sept.monthKey, '2026-09');
  assert.equal(sept.totalRounds, 15);
  assert.equal(sept.activeDays, 1);
});

test('calculateInsights compiles full stats smoothly', () => {
  const sessions: SessionRecord[] = [
    {
      id: 's1',
      timestamp: new Date('2026-10-21T09:00:00').getTime(),
      completedRounds: 5,
      durationSeconds: 100,
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    },
  ];

  const insights = calculateInsights(sessions);
  assert.equal(insights.totalSessions, 1);
  assert.equal(insights.totalRounds, 5);
  assert.ok(insights.overallConsistencyScore > 0);
  assert.equal(insights.bestTimeOfDay.bestBucket?.bucket, 'morning');
});
