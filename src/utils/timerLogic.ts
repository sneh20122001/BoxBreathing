import { BreathingPhase, LevelConfig, PhaseDurations } from '../types/breathing';

export const PHASE_SEQUENCE: readonly BreathingPhase[] = ['inhale', 'hold1', 'exhale', 'hold2'] as const;

export function getPhaseDurations(
  configOrDurationsOrSeconds: LevelConfig | PhaseDurations | number
): PhaseDurations {
  if (typeof configOrDurationsOrSeconds === 'number') {
    return {
      inhale: configOrDurationsOrSeconds,
      hold1: configOrDurationsOrSeconds,
      exhale: configOrDurationsOrSeconds,
      hold2: configOrDurationsOrSeconds,
    };
  }
  if ('phaseDurations' in configOrDurationsOrSeconds) {
    return configOrDurationsOrSeconds.phaseDurations;
  }
  return configOrDurationsOrSeconds;
}

export function getActivePhases(
  configOrDurationsOrSeconds?: LevelConfig | PhaseDurations | number
): BreathingPhase[] {
  if (!configOrDurationsOrSeconds) {
    return ['inhale', 'hold1', 'exhale', 'hold2'];
  }
  const durations = getPhaseDurations(configOrDurationsOrSeconds);
  const active: BreathingPhase[] = [];
  if (durations.inhale > 0) active.push('inhale');
  if (durations.hold1 > 0) active.push('hold1');
  if (durations.exhale > 0) active.push('exhale');
  if (durations.hold2 > 0) active.push('hold2');
  return active.length > 0 ? active : ['inhale', 'exhale'];
}

export function getNextPhase(
  currentPhase: BreathingPhase,
  configOrDurationsOrSeconds?: LevelConfig | PhaseDurations | number
): {
  nextPhase: BreathingPhase;
  isRoundComplete: boolean;
} {
  const sequence = getActivePhases(configOrDurationsOrSeconds);
  const currentIndex = sequence.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex === sequence.length - 1) {
    return {
      nextPhase: sequence[0],
      isRoundComplete: true,
    };
  }
  return {
    nextPhase: sequence[currentIndex + 1],
    isRoundComplete: false,
  };
}

export function calculateRoundDuration(
  configOrDurationsOrSeconds: LevelConfig | PhaseDurations | number
): number {
  if (typeof configOrDurationsOrSeconds === 'number') {
    return configOrDurationsOrSeconds * 4;
  }
  const durations = getPhaseDurations(configOrDurationsOrSeconds);
  return durations.inhale + durations.hold1 + durations.exhale + durations.hold2;
}

export function calculateTotalSessionSeconds(
  configOrDurationsOrSeconds: LevelConfig | PhaseDurations | number,
  totalRounds: number
): number {
  return calculateRoundDuration(configOrDurationsOrSeconds) * totalRounds;
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
 * Accurately supports uniform 4-phase, 3-phase (4-7-8), and 2-phase (resonant 5.5s) cycles.
 */
export function resolveSessionTimeline(
  elapsedMs: number,
  configOrDurationsOrSeconds: LevelConfig | PhaseDurations | number,
  totalRounds: number
): SessionTimelineState {
  const durations = getPhaseDurations(configOrDurationsOrSeconds);
  const dInhaleMs = Math.round(durations.inhale * 1000);
  const dHold1Ms = Math.round(durations.hold1 * 1000);
  const dExhaleMs = Math.round(durations.exhale * 1000);
  const dHold2Ms = Math.round(durations.hold2 * 1000);

  const roundDurationMs = dInhaleMs + dHold1Ms + dExhaleMs + dHold2Ms;
  const totalDurationMs = roundDurationMs * totalRounds;

  const boundedElapsedMs = Math.max(0, Math.min(elapsedMs, totalDurationMs));
  const isSessionCompleted = totalDurationMs > 0 && boundedElapsedMs >= totalDurationMs;

  const activePhases = getActivePhases(configOrDurationsOrSeconds);
  const lastActivePhase = activePhases[activePhases.length - 1] || 'hold2';

  if (isSessionCompleted) {
    return {
      completedRounds: totalRounds,
      currentPhase: lastActivePhase,
      secondsRemainingInPhase: 0,
      phaseProgress: 1,
      totalProgress: 1,
      isSessionCompleted: true,
      totalElapsedSeconds: Math.round(totalDurationMs / 1000),
    };
  }

  const completedRounds = Math.min(
    totalRounds - 1,
    Math.floor(boundedElapsedMs / roundDurationMs)
  );
  const msIntoCurrentRound = boundedElapsedMs % roundDurationMs;

  const inhaleEnd = dInhaleMs;
  const hold1End = inhaleEnd + dHold1Ms;
  const exhaleEnd = hold1End + dExhaleMs;

  let currentPhase: BreathingPhase = 'inhale';
  let msIntoPhase = msIntoCurrentRound;
  let phaseDurationMs = dInhaleMs;

  if (msIntoCurrentRound < inhaleEnd || (dHold1Ms === 0 && dExhaleMs === 0 && dHold2Ms === 0)) {
    currentPhase = 'inhale';
    msIntoPhase = msIntoCurrentRound;
    phaseDurationMs = dInhaleMs;
  } else if (dHold1Ms > 0 && msIntoCurrentRound < hold1End) {
    currentPhase = 'hold1';
    msIntoPhase = msIntoCurrentRound - inhaleEnd;
    phaseDurationMs = dHold1Ms;
  } else if (dExhaleMs > 0 && msIntoCurrentRound < exhaleEnd) {
    currentPhase = 'exhale';
    msIntoPhase = msIntoCurrentRound - hold1End;
    phaseDurationMs = dExhaleMs;
  } else {
    currentPhase = 'hold2';
    msIntoPhase = msIntoCurrentRound - exhaleEnd;
    phaseDurationMs = dHold2Ms;
  }

  const msRemainingInPhase = Math.max(0, phaseDurationMs - msIntoPhase);

  // For whole-second phases (e.g. 4s, 5s, 7s, 8s): integer ceil (5, 4, 3, 2, 1)
  // For fractional phases (e.g. 5.5s): 1 decimal place (5.5, 5.4, ..., 0.1)
  let secondsRemainingInPhase: number;
  if (phaseDurationMs % 1000 !== 0) {
    secondsRemainingInPhase = Math.max(0.1, Number((msRemainingInPhase / 1000).toFixed(1)));
  } else {
    secondsRemainingInPhase = Math.max(1, Math.ceil(msRemainingInPhase / 1000));
  }

  const phaseProgress = phaseDurationMs > 0
    ? Math.min(1, Math.max(0, msIntoPhase / phaseDurationMs))
    : 1;

  const totalProgress = totalDurationMs > 0
    ? Math.min(1, Math.max(0, boundedElapsedMs / totalDurationMs))
    : 0;

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
