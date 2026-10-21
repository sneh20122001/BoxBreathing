import React from 'react';
import { Play, Pause, RotateCcw, Clock, Target } from 'lucide-react';
import { SessionStatus } from '../types/breathing';
import { formatTimeMinutesSeconds } from '../utils/timerLogic';

interface ControlsProps {
  status: SessionStatus;
  totalRounds: number;
  secondsPerPhase: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onChangeTotalRounds: (rounds: number) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  status,
  totalRounds,
  secondsPerPhase,
  onStart,
  onPause,
  onResume,
  onReset,
  onChangeTotalRounds,
}) => {
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';
  const isCompleted = status === 'completed';

  const totalSessionSeconds = secondsPerPhase * 4 * totalRounds;
  const formattedDuration = formatTimeMinutesSeconds(totalSessionSeconds);

  const roundPresets = [1, 3, 5, 8, 10];

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-4">
      {/* Target Rounds and Estimated Duration bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-teal-400" aria-hidden="true" />
          <span className="font-medium text-slate-300">Goal:</span>
          <div className="flex items-center gap-1">
            {roundPresets.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChangeTotalRounds(r)}
                disabled={isRunning || isPaused}
                aria-pressed={totalRounds === r}
                className={`min-h-[30px] min-w-[30px] px-2 py-0.5 rounded text-xs font-semibold font-mono transition-colors cursor-pointer ${
                  totalRounds === r
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:hover:text-slate-400'
                }`}
              >
                {r}
              </button>
            ))}
            <span className="text-slate-400 ml-1">rounds</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
          <span>Total:</span>
          <strong className="text-slate-200 font-mono tabular-nums">{formattedDuration}</strong>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex items-center justify-center gap-3 w-full">
        {isIdle && (
          <button
            type="button"
            onClick={onStart}
            className="flex-1 max-w-xs min-h-[48px] px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-[0.98] text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(45,212,191,0.3)] transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" aria-hidden="true" />
            <span>Start Breathing</span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-teal-600/40 border border-teal-700/50 text-slate-950">
              Space
            </kbd>
          </button>
        )}

        {isRunning && (
          <button
            type="button"
            onClick={onPause}
            className="flex-1 max-w-xs min-h-[48px] px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(251,191,36,0.25)] transition-all cursor-pointer"
          >
            <Pause className="w-5 h-5 fill-current" aria-hidden="true" />
            <span>Pause</span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-600/40 border border-amber-700/50 text-slate-950">
              Space
            </kbd>
          </button>
        )}

        {isPaused && (
          <button
            type="button"
            onClick={onResume}
            className="flex-1 max-w-xs min-h-[48px] px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-[0.98] text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(45,212,191,0.25)] transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" aria-hidden="true" />
            <span>Resume</span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-teal-600/40 border border-teal-700/50 text-slate-950">
              Space
            </kbd>
          </button>
        )}

        {isCompleted && (
          <button
            type="button"
            onClick={onStart}
            className="flex-1 max-w-xs min-h-[48px] px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-[0.98] text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(45,212,191,0.3)] transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" aria-hidden="true" />
            <span>Start Fresh Session</span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-teal-600/40 border border-teal-700/50 text-slate-950">
              Space
            </kbd>
          </button>
        )}

        {/* Reset button */}
        {!isIdle && (
          <button
            type="button"
            onClick={onReset}
            className="min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 active:scale-[0.98] text-slate-300 hover:text-white font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            aria-label="Reset session to beginning (R)"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Reset</span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
              R
            </kbd>
          </button>
        )}
      </div>
    </div>
  );
};
