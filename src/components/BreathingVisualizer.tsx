import React from 'react';
import { BreathingPhase, PHASE_DETAILS, SessionStatus } from '../types/breathing';

interface BreathingVisualizerProps {
  currentPhase: BreathingPhase;
  secondsRemaining: number;
  phaseProgress: number; // 0 to 1
  status: SessionStatus;
  currentRound: number;
  totalRounds: number;
  secondsPerPhase: number;
}

export const BreathingVisualizer: React.FC<BreathingVisualizerProps> = ({
  currentPhase,
  secondsRemaining,
  phaseProgress,
  status,
  currentRound,
  totalRounds,
  secondsPerPhase,
}) => {
  const phaseInfo = PHASE_DETAILS[currentPhase];
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';
  const isCompleted = status === 'completed';

  // Dynamic scale calculation
  let boxScale = 0.82;
  if (!isIdle && !isCompleted) {
    if (currentPhase === 'inhale') {
      boxScale = 0.72 + 0.28 * phaseProgress;
    } else if (currentPhase === 'hold1') {
      boxScale = 1.0;
    } else if (currentPhase === 'exhale') {
      boxScale = 1.0 - 0.28 * phaseProgress;
    } else if (currentPhase === 'hold2') {
      boxScale = 0.72;
    }
  }

  // Perimeter path progress (260x260 perimeter is 4 * 240 = 960)
  const totalPerimeter = 960;
  let strokeOffset = totalPerimeter;

  if (isRunning || isPaused) {
    const phaseIndex = currentPhase === 'inhale' ? 0 : currentPhase === 'hold1' ? 1 : currentPhase === 'exhale' ? 2 : 3;
    const completedPerimeter = phaseIndex * 240 + phaseProgress * 240;
    strokeOffset = Math.max(0, totalPerimeter - completedPerimeter);
  }

  // Phase color gradients & glows
  const themeGradients: Record<BreathingPhase, { ring: string; boxBg: string; text: string; glow: string }> = {
    inhale: {
      ring: '#2dd4bf', // Teal 400
      boxBg: 'from-teal-500/20 via-teal-950/40 to-slate-950/80',
      text: 'text-teal-300',
      glow: 'rgba(45, 212, 191, 0.3)',
    },
    hold1: {
      ring: '#818cf8', // Indigo 400
      boxBg: 'from-indigo-500/20 via-indigo-950/40 to-slate-950/80',
      text: 'text-indigo-300',
      glow: 'rgba(129, 140, 248, 0.3)',
    },
    exhale: {
      ring: '#fbbf24', // Amber 400
      boxBg: 'from-amber-500/20 via-amber-950/40 to-slate-950/80',
      text: 'text-amber-300',
      glow: 'rgba(251, 191, 36, 0.3)',
    },
    hold2: {
      ring: '#38bdf8', // Sky 400
      boxBg: 'from-sky-500/20 via-sky-950/40 to-slate-950/80',
      text: 'text-sky-300',
      glow: 'rgba(56, 189, 248, 0.3)',
    },
  };

  const activeTheme = themeGradients[currentPhase];

  return (
    <div className="relative w-full flex flex-col items-center justify-center py-1 sm:py-3 select-none">
      {/* Visualizer Frame Container */}
      <div
        className="relative w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] flex items-center justify-center"
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Outer Square Track SVG */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 280 280"
          aria-hidden="true"
        >
          {/* Background square track */}
          <rect
            x="20"
            y="20"
            width="240"
            height="240"
            rx="24"
            fill="none"
            stroke="rgba(30, 41, 59, 0.7)"
            strokeWidth="3"
            strokeDasharray="6 6"
          />

          {/* Active moving perimeter line */}
          {(isRunning || isPaused) && (
            <rect
              x="20"
              y="20"
              width="240"
              height="240"
              rx="24"
              fill="none"
              stroke={activeTheme.ring}
              strokeWidth="4"
              strokeDasharray={totalPerimeter}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-100 ease-linear"
              style={{
                filter: `drop-shadow(0 0 8px ${activeTheme.glow})`,
              }}
            />
          )}
        </svg>

        {/* Phase side labels around the box */}
        <div className="absolute top-0.5 text-[9px] sm:text-[11px] font-medium tracking-wider uppercase text-teal-400/90">
          Inhale ({secondsPerPhase}s)
        </div>
        <div className="absolute -right-0.5 sm:-right-1 top-1/2 -translate-y-1/2 rotate-90 text-[9px] sm:text-[11px] font-medium tracking-wider uppercase text-indigo-400/90 origin-center">
          Hold ({secondsPerPhase}s)
        </div>
        <div className="absolute bottom-0.5 text-[9px] sm:text-[11px] font-medium tracking-wider uppercase text-amber-400/90">
          Exhale ({secondsPerPhase}s)
        </div>
        <div className="absolute -left-0.5 sm:-left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] sm:text-[11px] font-medium tracking-wider uppercase text-sky-400/90 origin-center">
          Hold ({secondsPerPhase}s)
        </div>

        {/* The Central Breathing Animated Square */}
        <div
          className={`relative w-[165px] h-[165px] sm:w-[210px] sm:h-[210px] rounded-2xl sm:rounded-3xl bg-gradient-to-br ${activeTheme.boxBg} border border-slate-700/60 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-5 text-center transition-all ${
            isIdle ? 'opacity-90' : 'opacity-100'
          }`}
          style={{
            transform: `scale(${boxScale})`,
            boxShadow: isIdle
              ? '0 0 20px rgba(15, 23, 42, 0.8)'
              : `0 0 45px ${activeTheme.glow}, inset 0 0 25px ${activeTheme.glow}`,
            borderColor: isIdle ? 'rgba(71, 85, 105, 0.4)' : activeTheme.ring,
            transition: isPaused
              ? 'none'
              : 'transform 0.1s linear, box-shadow 0.4s ease, border-color 0.4s ease',
          }}
        >
          {/* Pause badge if paused */}
          {isPaused && (
            <div className="absolute top-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[9px] uppercase font-bold tracking-widest text-amber-300">
              Paused
            </div>
          )}

          {/* Current Phase Name */}
          <span
            className={`text-xs sm:text-sm font-semibold tracking-widest uppercase transition-colors duration-300 ${
              isIdle ? 'text-slate-400' : activeTheme.text
            }`}
          >
            {isIdle ? 'Ready' : isCompleted ? 'Finished' : phaseInfo.label}
          </span>

          {/* Big Countdown Number */}
          <div className="my-0.5 sm:my-1 font-mono tabular-nums font-bold text-3xl sm:text-5xl text-white tracking-tight drop-shadow-md">
            {isIdle ? secondsPerPhase : secondsRemaining}
          </div>

          {/* Seconds label */}
          <span className="text-[9px] sm:text-[11px] text-slate-400 uppercase tracking-wider mb-1">
            {isIdle ? 'sec / phase' : 'sec remaining'}
          </span>

          {/* Instruction prompt */}
          <p className="text-[11px] sm:text-xs text-slate-200 font-medium leading-tight px-1 line-clamp-2">
            {isIdle
              ? 'Press Start to begin your box breathing session'
              : phaseInfo.instruction}
          </p>
        </div>
      </div>

      {/* Progress pill indicator below box */}
      <div className="mt-2.5 flex items-center gap-2.5 text-xs text-slate-400">
        <span>
          Round{' '}
          <strong className="text-slate-200 font-mono tabular-nums">
            {isCompleted ? totalRounds : Math.min(totalRounds, currentRound + 1)}
          </strong>{' '}
          of{' '}
          <strong className="text-slate-200 font-mono tabular-nums">
            {totalRounds}
          </strong>
        </span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span className="capitalize">
          Phase:{' '}
          <strong className={isIdle ? 'text-slate-300' : activeTheme.text}>
            {phaseInfo.label}
          </strong>
        </span>
      </div>
    </div>
  );
};
