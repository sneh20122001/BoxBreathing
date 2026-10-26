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

test('4-7-8 breathing calculates round and session durations accurately', () => {
  const durations = { inhale: 4, hold1: 7, exhale: 8, hold2: 0 };
  const roundSec = calculateRoundDuration(durations);
  assert.equal(roundSec, 19); // 4 + 7 + 8 = 19s
  const sessionSec = calculateTotalSessionSeconds(durations, 4);
  assert.equal(sessionSec, 76); // 19 * 4 = 76s
  assert.equal(formatTimeMinutesSeconds(sessionSec), '1m 16s');
});

test('4-7-8 breathing resolves timeline through 3 active phases and skips 0s hold2', () => {
  const durations = { inhale: 4, hold1: 7, exhale: 8, hold2: 0 };
  
  // At 2s into Inhale (4s duration)
  const t1 = resolveSessionTimeline(2000, durations, 3);
  assert.equal(t1.currentPhase, 'inhale');
  assert.equal(t1.secondsRemainingInPhase, 2);
  assert.equal(t1.completedRounds, 0);

  // At 5s (1s into Hold1, 7s duration)
  const t2 = resolveSessionTimeline(5000, durations, 3);
  assert.equal(t2.currentPhase, 'hold1');
  assert.equal(t2.secondsRemainingInPhase, 6);
  assert.equal(t2.completedRounds, 0);

  // At 14s (3s into Exhale, 8s duration: 4s inhale + 7s hold1 + 3s exhale = 14s)
  const t3 = resolveSessionTimeline(14000, durations, 3);
  assert.equal(t3.currentPhase, 'exhale');
  assert.equal(t3.secondsRemainingInPhase, 5);
  assert.equal(t3.completedRounds, 0);

  // At exactly 19s (round boundary), completes Round 1 and seamlessly starts Round 2 Inhale
  const t4 = resolveSessionTimeline(19000, durations, 3);
  assert.equal(t4.completedRounds, 1);
  assert.equal(t4.currentPhase, 'inhale');
  assert.equal(t4.secondsRemainingInPhase, 4);

  // At 57s (all 3 rounds completed: 19 * 3 = 57s)
  const t5 = resolveSessionTimeline(57000, durations, 3);
  assert.equal(t5.isSessionCompleted, true);
  assert.equal(t5.completedRounds, 3);
  assert.equal(t5.currentPhase, 'exhale'); // last active phase
  assert.equal(t5.secondsRemainingInPhase, 0);
});

test('Resonant breathing (5.5s in, 5.5s out) calculates round duration and handles fractional seconds', () => {
  const resonantDurations = { inhale: 5.5, hold1: 0, exhale: 5.5, hold2: 0 };
  const roundSec = calculateRoundDuration(resonantDurations);
  assert.equal(roundSec, 11); // 5.5 + 5.5 = 11s
  const sessionSec = calculateTotalSessionSeconds(resonantDurations, 5);
  assert.equal(sessionSec, 55); // 11 * 5 = 55s
  assert.equal(formatTimeMinutesSeconds(sessionSec), '55s');
});

test('Resonant breathing cycles smoothly between Inhale and Exhale with no holds', () => {
  const resonantDurations = { inhale: 5.5, hold1: 0, exhale: 5.5, hold2: 0 };

  // At start (0ms)
  const t0 = resolveSessionTimeline(0, resonantDurations, 5);
  assert.equal(t0.currentPhase, 'inhale');
  assert.equal(t0.secondsRemainingInPhase, 5.5);
  assert.equal(t0.completedRounds, 0);

  // At 3000ms (3.0s into 5.5s Inhale -> 2.5s remaining)
  const t1 = resolveSessionTimeline(3000, resonantDurations, 5);
  assert.equal(t1.currentPhase, 'inhale');
  assert.equal(t1.secondsRemainingInPhase, 2.5);
  assert.equal(t1.completedRounds, 0);

  // At 6000ms (5.5s inhale completed, 0.5s into 5.5s Exhale -> 5.0s remaining)
  const t2 = resolveSessionTimeline(6000, resonantDurations, 5);
  assert.equal(t2.currentPhase, 'exhale');
  assert.equal(t2.secondsRemainingInPhase, 5.0);
  assert.equal(t2.completedRounds, 0);

  // At exactly 11000ms (1 full round completed -> starts Round 2 Inhale)
  const t3 = resolveSessionTimeline(11000, resonantDurations, 5);
  assert.equal(t3.completedRounds, 1);
  assert.equal(t3.currentPhase, 'inhale');
  assert.equal(t3.secondsRemainingInPhase, 5.5);

  // At 55000ms (5 full rounds completed)
  const t4 = resolveSessionTimeline(55000, resonantDurations, 5);
  assert.equal(t4.isSessionCompleted, true);
  assert.equal(t4.completedRounds, 5);
  assert.equal(t4.currentPhase, 'exhale');
  assert.equal(t4.secondsRemainingInPhase, 0);
});

test('getNextPhase respects active phases for 4-7-8 and Resonant breathing', () => {
  const resonantDurations = { inhale: 5.5, hold1: 0, exhale: 5.5, hold2: 0 };
  const p1 = getNextPhase('inhale', resonantDurations);
  assert.equal(p1.nextPhase, 'exhale');
  assert.equal(p1.isRoundComplete, false);

  const p2 = getNextPhase('exhale', resonantDurations);
  assert.equal(p2.nextPhase, 'inhale');
  assert.equal(p2.isRoundComplete, true);

  const durations478 = { inhale: 4, hold1: 7, exhale: 8, hold2: 0 };
  const a1 = getNextPhase('inhale', durations478);
  assert.equal(a1.nextPhase, 'hold1');
  assert.equal(a1.isRoundComplete, false);

  const a2 = getNextPhase('hold1', durations478);
  assert.equal(a2.nextPhase, 'exhale');
  assert.equal(a2.isRoundComplete, false);

  const a3 = getNextPhase('exhale', durations478);
  assert.equal(a3.nextPhase, 'inhale');
  assert.equal(a3.isRoundComplete, true);
});

test('Viloma interrupted breathing calculates round and session durations accurately', () => {
  const vilomaDurations = { inhale: 4, hold1: 2, exhale: 6, hold2: 2 };
  const roundSec = calculateRoundDuration(vilomaDurations);
  assert.equal(roundSec, 14); // 4 + 2 + 6 + 2 = 14s
  const sessionSec = calculateTotalSessionSeconds(vilomaDurations, 5);
  assert.equal(sessionSec, 70); // 14 * 5 = 70s
  assert.equal(formatTimeMinutesSeconds(sessionSec), '1m 10s');
});

test('Viloma interrupted breathing resolves timeline across all 4 stepped phases', () => {
  const vilomaDurations = { inhale: 4, hold1: 2, exhale: 6, hold2: 2 };

  // At 2s (Inhale 4s)
  const t1 = resolveSessionTimeline(2000, vilomaDurations, 5);
  assert.equal(t1.currentPhase, 'inhale');
  assert.equal(t1.secondsRemainingInPhase, 2);

  // At 5s (Hold1 2s: from 4s to 6s)
  const t2 = resolveSessionTimeline(5000, vilomaDurations, 5);
  assert.equal(t2.currentPhase, 'hold1');
  assert.equal(t2.secondsRemainingInPhase, 1);

  // At 9s (Exhale 6s: from 6s to 12s)
  const t3 = resolveSessionTimeline(9000, vilomaDurations, 5);
  assert.equal(t3.currentPhase, 'exhale');
  assert.equal(t3.secondsRemainingInPhase, 3);

  // At 13s (Hold2 2s: from 12s to 14s)
  const t4 = resolveSessionTimeline(13000, vilomaDurations, 5);
  assert.equal(t4.currentPhase, 'hold2');
  assert.equal(t4.secondsRemainingInPhase, 1);

  // At exactly 14000ms (1 full round completed -> starts Round 2 Inhale)
  const t5 = resolveSessionTimeline(14000, vilomaDurations, 5);
  assert.equal(t5.completedRounds, 1);
  assert.equal(t5.currentPhase, 'inhale');
  assert.equal(t5.secondsRemainingInPhase, 4);
});

test('Ujjayi ocean breath calculates round and session durations accurately', () => {
  const ujjayiDurations = { inhale: 6, hold1: 0, exhale: 6, hold2: 0 };
  const roundSec = calculateRoundDuration(ujjayiDurations);
  assert.equal(roundSec, 12); // 6 + 6 = 12s
  const sessionSec = calculateTotalSessionSeconds(ujjayiDurations, 5);
  assert.equal(sessionSec, 60); // 12 * 5 = 60s
  assert.equal(formatTimeMinutesSeconds(sessionSec), '1m');
});

test('Ujjayi ocean breath cycles smoothly between Inhale and Exhale', () => {
  const ujjayiDurations = { inhale: 6, hold1: 0, exhale: 6, hold2: 0 };

  // Inhale transition to Exhale
  const p1 = getNextPhase('inhale', ujjayiDurations);
  assert.equal(p1.nextPhase, 'exhale');
  assert.equal(p1.isRoundComplete, false);

  // Exhale transition back to Inhale with round complete
  const p2 = getNextPhase('exhale', ujjayiDurations);
  assert.equal(p2.nextPhase, 'inhale');
  assert.equal(p2.isRoundComplete, true);

  // At 3s into Inhale
  const t1 = resolveSessionTimeline(3000, ujjayiDurations, 5);
  assert.equal(t1.currentPhase, 'inhale');
  assert.equal(t1.secondsRemainingInPhase, 3);

  // At 9s into Exhale (from 6s to 12s)
  const t2 = resolveSessionTimeline(9000, ujjayiDurations, 5);
  assert.equal(t2.currentPhase, 'exhale');
  assert.equal(t2.secondsRemainingInPhase, 3);
});
