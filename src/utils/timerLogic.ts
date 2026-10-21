import { BreathingPhase, LevelConfig } from '../types/breathing';

export const PHASE_SEQUENCE: readonly BreathingPhase[] = ['inhale', 'hold1', 'exhale', 'hold2'] as const;

export function getNextPhase(currentPhase: BreathingPhase): {
  nextPhase: BreathingPhase;
  isRoundComplete: boolean;
} {
  const currentIndex = PHASE_SEQUENCE.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex === PHASE_SEQUENCE.length - 1) {
    return {
      nextPhase: PHASE_SEQUENCE[0],
      isRoundComplete: true,
    };
  }
  return {
    nextPhase: PHASE_SEQUENCE[currentIndex + 1],
    isRoundComplete: false,
  };
}

export function calculateRoundDuration(secondsPerPhase: number): number {
  return secondsPerPhase * 4;
}

export function calculateTotalSessionSeconds(
  secondsPerPhase: number,
  totalRounds: number
): number {
  return secondsPerPhase * 4 * totalRounds;
}

export function formatTimeMinutesSeconds(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  if (mins === 0) {
    return `${secs}s`;
  }
  return `${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
}

export function formatDigitalClock(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export interface SessionTimelineState {
  completedRounds: number;
  currentPhase: BreathingPhase;
  secondsRemainingInPhase: number;
  phaseProgress: number; // 0 to 1
  totalProgress: number; // 0 to 1
  isSessionCompleted: boolean;
  totalElapsedSeconds: number;
}

/**
 * Pure calculation to resolve the session state from total elapsed milliseconds.
 * This guarantees absolute accuracy across tab throttling, background pauses, or tick drift.
 */
export function resolveSessionTimeline(
  elapsedMs: number,
  secondsPerPhase: number,
  totalRounds: number
): SessionTimelineState {
  const phaseDurationMs = secondsPerPhase * 1000;
  const roundDurationMs = phaseDurationMs * 4;
  const totalDurationMs = roundDurationMs * totalRounds;

  const boundedElapsedMs = Math.max(0, Math.min(elapsedMs, totalDurationMs));
  const isSessionCompleted = boundedElapsedMs >= totalDurationMs;

  if (isSessionCompleted) {
    return {
      completedRounds: totalRounds,
      currentPhase: 'hold2',
      secondsRemainingInPhase: 0,
      phaseProgress: 1,
      totalProgress: 1,
      isSessionCompleted: true,
      totalElapsedSeconds: Math.floor(totalDurationMs / 1000),
    };
  }

  const completedRounds = Math.min(
    totalRounds - 1,
    Math.floor(boundedElapsedMs / roundDurationMs)
  );
  const msIntoCurrentRound = boundedElapsedMs % roundDurationMs;
  const phaseIndex = Math.min(
    3,
    Math.floor(msIntoCurrentRound / phaseDurationMs)
  );
  const currentPhase = PHASE_SEQUENCE[phaseIndex];
  const msIntoPhase = msIntoCurrentRound % phaseDurationMs;
  const msRemainingInPhase = Math.max(0, phaseDurationMs - msIntoPhase);

  // Ceil so that at the beginning of a 5s phase, remaining shows 5, then 4, 3, 2, 1
  const secondsRemainingInPhase = Math.max(
    1,
    Math.ceil(msRemainingInPhase / 1000)
  );
  const phaseProgress = Math.min(1, Math.max(0, msIntoPhase / phaseDurationMs));
  const totalProgress = Math.min(
    1,
    Math.max(0, boundedElapsedMs / totalDurationMs)
  );

  return {
    completedRounds,
    currentPhase,
    secondsRemainingInPhase,
    phaseProgress,
    totalProgress,
    isSessionCompleted: false,
    totalElapsedSeconds: Math.floor(boundedElapsedMs / 1000),
  };
}
