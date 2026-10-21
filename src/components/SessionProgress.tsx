import React from 'react';
import { BreathingPhase, LevelConfig, SessionStatus } from '../types/breathing';
import { formatDigitalClock, formatTimeMinutesSeconds } from '../utils/timerLogic';

interface SessionProgressProps {
  status: SessionStatus;
  currentRound: number;
  totalRounds: number;
  currentPhase: BreathingPhase;
  totalElapsedSeconds: number;
  totalSessionSeconds: number;
  selectedLevel: LevelConfig;
}

export const SessionProgress: React.FC<SessionProgressProps> = ({
  status,
  currentRound,
  totalRounds,
  currentPhase,
  totalElapsedSeconds,
  totalSessionSeconds,
  selectedLevel,
}) => {
  const isIdle = status === 'idle';
  const isCompleted = status === 'completed';

  const progressFraction = Math.min(
    1,
    Math.max(0, totalElapsedSeconds / Math.max(1, totalSessionSeconds))
  );
  const progressPercent = Math.round(progressFraction * 100);

  const remainingSeconds = Math.max(0, totalSessionSeconds - totalElapsedSeconds);

  return (
    <div className="w-full rounded-2xl bg-slate-900/50 border border-slate-800/80 p-4 sm:p-5 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Session Progress
          </span>
          <span className="text-xs text-slate-400">
            {isCompleted ? (
              <span className="text-teal-300 font-medium">Completed</span>
            ) : isIdle ? (
              <span>Not Started</span>
            ) : (
              <span>
                Round <strong className="text-white font-mono tabular-nums">{currentRound + 1}</strong> of{' '}
                <strong className="text-white font-mono tabular-nums">{totalRounds}</strong>
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-slate-400">
          <span>
            Elapsed: <strong className="text-slate-200">{formatDigitalClock(totalElapsedSeconds)}</strong>
          </span>
          <span aria-hidden="true" className="text-slate-700">|</span>
          <span>
            Remaining: <strong className="text-slate-200">{formatDigitalClock(remainingSeconds)}</strong>
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative mb-3">
        <div
          className="h-full bg-gradient-to-r from-teal-500 via-indigo-500 to-sky-400 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${isCompleted ? 100 : progressPercent}%` }}
          role="progressbar"
          aria-valuenow={isCompleted ? 100 : progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Round dots indicator */}
      <div className="flex items-center justify-between gap-1 pt-1">
        <span className="text-[11px] text-slate-400">Rounds:</span>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {Array.from({ length: totalRounds }).map((_, idx) => {
            const isFinished = idx < currentRound || isCompleted;
            const isCurrent = idx === currentRound && !isIdle && !isCompleted;

            return (
              <div
                key={idx}
                className={`flex items-center justify-center text-[10px] font-mono tabular-nums rounded px-1.5 py-0.5 border transition-all ${
                  isFinished
                    ? 'bg-teal-500/20 border-teal-500/40 text-teal-300 font-bold'
                    : isCurrent
                    ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200 ring-1 ring-indigo-400/40 font-bold animate-pulse'
                    : 'bg-slate-800/40 border-slate-800 text-slate-400'
                }`}
              >
                R{idx + 1}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
