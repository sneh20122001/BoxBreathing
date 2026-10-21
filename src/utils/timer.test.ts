import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PHASE_SEQUENCE,
  getNextPhase,
  calculateRoundDuration,
  calculateTotalSessionSeconds,
  formatTimeMinutesSeconds,
  formatDigitalClock,
  resolveSessionTimeline,
} from './timerLogic.js';

test('phase sequence consists of exactly 4 phases in order', () => {
  assert.deepEqual(PHASE_SEQUENCE, ['inhale', 'hold1', 'exhale', 'hold2']);
});

test('getNextPhase transitions correctly through all four phases and flags round completion', () => {
  const p1 = getNextPhase('inhale');
  assert.equal(p1.nextPhase, 'hold1');
  assert.equal(p1.isRoundComplete, false);

  const p2 = getNextPhase('hold1');
  assert.equal(p2.nextPhase, 'exhale');
  assert.equal(p2.isRoundComplete, false);

  const p3 = getNextPhase('exhale');
  assert.equal(p3.nextPhase, 'hold2');
  assert.equal(p3.isRoundComplete, false);

  const p4 = getNextPhase('hold2');
  assert.equal(p4.nextPhase, 'inhale');
  assert.equal(p4.isRoundComplete, true);
});

test('round and session duration calculations match required defaults', () => {
  // Level 1: 5s per phase -> 20s per round, 100s for 5 rounds (1m 40s)
  assert.equal(calculateRoundDuration(5), 20);
  assert.equal(calculateTotalSessionSeconds(5, 5), 100);
  assert.equal(formatTimeMinutesSeconds(100), '1m 40s');

  // Level 2: 7s per phase -> 28s per round, 140s for 5 rounds (2m 20s)
  assert.equal(calculateRoundDuration(7), 28);
  assert.equal(calculateTotalSessionSeconds(7, 5), 140);
  assert.equal(formatTimeMinutesSeconds(140), '2m 20s');

  // Level 3: 9s per phase -> 36s per round, 180s for 5 rounds (3m)
  assert.equal(calculateRoundDuration(9), 36);
  assert.equal(calculateTotalSessionSeconds(9, 5), 180);
  assert.equal(formatTimeMinutesSeconds(180), '3m');

  // Level 4: 11s per phase -> 44s per round, 220s for 5 rounds (3m 40s)
  assert.equal(calculateRoundDuration(11), 44);
  assert.equal(calculateTotalSessionSeconds(11, 5), 220);
  assert.equal(formatTimeMinutesSeconds(220), '3m 40s');
});

test('formatDigitalClock returns zero-padded mm:ss', () => {
  assert.equal(formatDigitalClock(0), '00:00');
  assert.equal(formatDigitalClock(5), '00:05');
  assert.equal(formatDigitalClock(65), '01:05');
  assert.equal(formatDigitalClock(220), '03:40');
});

test('resolveSessionTimeline resolves initial start correctly', () => {
  const initial = resolveSessionTimeline(0, 5, 5);
  assert.equal(initial.completedRounds, 0);
  assert.equal(initial.currentPhase, 'inhale');
  assert.equal(initial.secondsRemainingInPhase, 5);
  assert.equal(initial.phaseProgress, 0);
  assert.equal(initial.totalProgress, 0);
  assert.equal(initial.isSessionCompleted, false);
});

test('resolveSessionTimeline accurately advances across phases within a round', () => {
  // 3.5 seconds into 5s inhale
  const t1 = resolveSessionTimeline(3500, 5, 5);
  assert.equal(t1.currentPhase, 'inhale');
  assert.equal(t1.secondsRemainingInPhase, 2); // 5000 - 3500 = 1500ms -> ceil(1.5) = 2
  assert.equal(t1.completedRounds, 0);

  // 6 seconds in -> into hold1 (5s to 10s)
  const t2 = resolveSessionTimeline(6000, 5, 5);
  assert.equal(t2.currentPhase, 'hold1');
  assert.equal(t2.secondsRemainingInPhase, 4);
  assert.equal(t2.completedRounds, 0);

  // 12 seconds in -> into exhale (10s to 15s)
  const t3 = resolveSessionTimeline(12000, 5, 5);
  assert.equal(t3.currentPhase, 'exhale');
  assert.equal(t3.secondsRemainingInPhase, 3);
  assert.equal(t3.completedRounds, 0);

  // 17 seconds in -> into hold2 (15s to 20s)
  const t4 = resolveSessionTimeline(17000, 5, 5);
  assert.equal(t4.currentPhase, 'hold2');
  assert.equal(t4.secondsRemainingInPhase, 3);
  assert.equal(t4.completedRounds, 0);
});

test('resolveSessionTimeline accurately increments round only after full round completes', () => {
  // At 19.9 seconds, round 0 still in hold2
  const justBefore = resolveSessionTimeline(19900, 5, 5);
  assert.equal(justBefore.completedRounds, 0);
  assert.equal(justBefore.currentPhase, 'hold2');

  // At exactly 20.0 seconds (20000ms), 1 round has completed, into Round 2 Inhale
  const round1Start = resolveSessionTimeline(20000, 5, 5);
  assert.equal(round1Start.completedRounds, 1);
  assert.equal(round1Start.currentPhase, 'inhale');
  assert.equal(round1Start.secondsRemainingInPhase, 5);
});

test('resolveSessionTimeline marks completed at total duration without negative countdown', () => {
  // Total 100,000ms
  const completed = resolveSessionTimeline(100000, 5, 5);
  assert.equal(completed.isSessionCompleted, true);
  assert.equal(completed.completedRounds, 5);
  assert.equal(completed.secondsRemainingInPhase, 0);
  assert.equal(completed.totalProgress, 1);

  // Beyond total duration
  const overshoot = resolveSessionTimeline(150000, 5, 5);
  assert.equal(overshoot.isSessionCompleted, true);
  assert.equal(overshoot.completedRounds, 5);
  assert.equal(overshoot.secondsRemainingInPhase, 0);
});
