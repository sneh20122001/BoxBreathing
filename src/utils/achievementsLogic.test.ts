import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionRecord } from '../types/stats';
import {
  calculateAchievements,
  filterBadges,
  formatUnlockDate,
  ACHIEVEMENT_DEFINITIONS,
} from './achievementsLogic';

test('calculateAchievements with empty history returns all locked badges and 0% completion', () => {
  const result = calculateAchievements([]);
  assert.equal(result.totalBadges, ACHIEVEMENT_DEFINITIONS.length);
  assert.equal(result.unlockedCount, 0);
  assert.equal(result.completionPct, 0);
  assert.equal(result.timeUnlockedCount, 0);
  assert.equal(result.streakUnlockedCount, 0);
  assert.ok(result.nextBadge !== null);
  // All badges should be locked with 0 progress
  result.badges.forEach((b) => {
    assert.equal(b.unlocked, false);
    assert.equal(b.currentValue, 0);
    assert.equal(b.progressPct, 0);
    assert.equal(b.unlockedAt, null);
  });
});

test('calculateAchievements unlocks First Breath (5 min) and Spark of Habit (1 day) after single 5-min session', () => {
  const refDate = new Date(2026, 9, 22, 10, 0, 0); // Oct 22, 2026
  const sessions: SessionRecord[] = [
    {
      id: 's-1',
      timestamp: refDate.getTime(),
      completedRounds: 5,
      durationSeconds: 300, // 5 minutes
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    },
  ];

  const result = calculateAchievements(sessions, refDate);

  const firstBreath = result.badges.find((b) => b.id === 'time-5m');
  assert.ok(firstBreath);
  assert.equal(firstBreath.unlocked, true);
  assert.equal(firstBreath.currentValue, 5);
  assert.equal(firstBreath.progressPct, 100);
  assert.equal(firstBreath.remaining, 0);
  assert.equal(firstBreath.unlockedAt, refDate.getTime());

  const sparkOfHabit = result.badges.find((b) => b.id === 'streak-1d');
  assert.ok(sparkOfHabit);
  assert.equal(sparkOfHabit.unlocked, true);
  assert.equal(sparkOfHabit.currentValue, 1);
  assert.equal(sparkOfHabit.progressPct, 100);

  // Next badge should be Inner Stillness (15m, progress = 5/15 = 33%) or Building Momentum (3d, progress = 1/3 = 33%)
  assert.ok(result.nextBadge);
  assert.equal(result.nextBadge.unlocked, false);
  assert.ok(result.nextBadge.progressPct > 0);
});

test('calculateAchievements accurately tracks time progression across multiple sessions', () => {
  const baseTime = new Date(2026, 9, 20, 10, 0, 0).getTime();
  const sessions: SessionRecord[] = [
    {
      id: 's-1',
      timestamp: baseTime,
      completedRounds: 5,
      durationSeconds: 300, // 5 min -> unlocks time-5m
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    },
    {
      id: 's-2',
      timestamp: baseTime + 3600000,
      completedRounds: 10,
      durationSeconds: 600, // 10 min -> cumulative 15 min -> unlocks time-15m
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    },
  ];

  const result = calculateAchievements(sessions);
  const badge5m = result.badges.find((b) => b.id === 'time-5m')!;
  const badge15m = result.badges.find((b) => b.id === 'time-15m')!;
  const badge30m = result.badges.find((b) => b.id === 'time-30m')!;

  assert.equal(badge5m.unlocked, true);
  assert.equal(badge5m.unlockedAt, baseTime);

  assert.equal(badge15m.unlocked, true);
  assert.equal(badge15m.unlockedAt, baseTime + 3600000);

  assert.equal(badge30m.unlocked, false);
  assert.equal(badge30m.currentValue, 15);
  assert.equal(badge30m.progressPct, 50); // 15 / 30 = 50%
  assert.equal(badge30m.remaining, 15);
});

test('calculateAchievements unlocks streak badges on consecutive calendar days', () => {
  const refDate = new Date(2026, 9, 22, 12, 0, 0);
  const sessions: SessionRecord[] = [];

  // Create 7 consecutive days of sessions leading up to refDate
  for (let i = 6; i >= 0; i--) {
    const d = new Date(refDate);
    d.setDate(refDate.getDate() - i);
    sessions.push({
      id: `streak-s-${i}`,
      timestamp: d.getTime(),
      completedRounds: 3,
      durationSeconds: 120, // 2 minutes each
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    });
  }

  const result = calculateAchievements(sessions, refDate);
  const streak1d = result.badges.find((b) => b.id === 'streak-1d')!;
  const streak3d = result.badges.find((b) => b.id === 'streak-3d')!;
  const streak7d = result.badges.find((b) => b.id === 'streak-7d')!;
  const streak14d = result.badges.find((b) => b.id === 'streak-14d')!;

  assert.equal(streak1d.unlocked, true);
  assert.equal(streak3d.unlocked, true);
  assert.equal(streak7d.unlocked, true);
  assert.equal(streak14d.unlocked, false);
  assert.equal(streak14d.progressPct, 50); // 7 / 14 = 50%
  assert.equal(streak14d.remaining, 7);
});

test('calculateAchievements preserves historical streak achievements even if current streak broke', () => {
  const refDate = new Date(2026, 9, 22, 12, 0, 0);
  const sessions: SessionRecord[] = [];

  // 3 consecutive days 10 days ago (so current streak is 0 today)
  for (let i = 12; i >= 10; i--) {
    const d = new Date(refDate);
    d.setDate(refDate.getDate() - i);
    sessions.push({
      id: `old-s-${i}`,
      timestamp: d.getTime(),
      completedRounds: 5,
      durationSeconds: 180,
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    });
  }

  const result = calculateAchievements(sessions, refDate);
  const streak1d = result.badges.find((b) => b.id === 'streak-1d')!;
  const streak3d = result.badges.find((b) => b.id === 'streak-3d')!;

  assert.equal(streak1d.unlocked, true);
  assert.equal(streak3d.unlocked, true); // historical 3-day streak preserves badge!
});

test('filterBadges correctly filters by category and unlocked state', () => {
  const refDate = new Date(2026, 9, 22, 10, 0, 0);
  const sessions: SessionRecord[] = [
    {
      id: 's-1',
      timestamp: refDate.getTime(),
      completedRounds: 5,
      durationSeconds: 300, // 5 min
      levelId: 1,
      levelName: 'Level 1',
      secondsPerPhase: 5,
    },
  ];

  const result = calculateAchievements(sessions, refDate);

  const all = filterBadges(result.badges, 'all');
  assert.equal(all.length, result.badges.length);

  const timeOnly = filterBadges(result.badges, 'time');
  assert.ok(timeOnly.every((b) => b.category === 'time'));

  const streakOnly = filterBadges(result.badges, 'streak');
  assert.ok(streakOnly.every((b) => b.category === 'streak'));

  const unlockedOnly = filterBadges(result.badges, 'unlocked');
  assert.ok(unlockedOnly.length >= 2);
  assert.ok(unlockedOnly.every((b) => b.unlocked));

  const lockedOnly = filterBadges(result.badges, 'locked');
  assert.ok(lockedOnly.every((b) => !b.unlocked));
});

test('formatUnlockDate formats timestamps cleanly', () => {
  const ts = new Date(2026, 9, 22).getTime();
  const formatted = formatUnlockDate(ts);
  assert.ok(formatted.includes('Oct 22, 2026') || formatted.includes('Oct') && formatted.includes('2026'));
});
