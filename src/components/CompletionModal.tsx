import React, { useEffect } from 'react';
import { RotateCcw, Sliders, Sparkles } from 'lucide-react';
import { LevelConfig } from '../types/breathing';
import { formatTimeMinutesSeconds } from '../utils/timerLogic';

interface CompletionModalProps {
  isOpen: boolean;
  totalRounds: number;
  totalDurationSeconds: number;
  level: LevelConfig;
  onRestart: () => void;
  onSelectAnotherLevel: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  totalRounds,
  totalDurationSeconds,
  level,
  onRestart,
  onSelectAnotherLevel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSelectAnotherLevel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onSelectAnotherLevel]);

  if (!isOpen) return null;

  const formattedTime = formatTimeMinutesSeconds(totalDurationSeconds);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-teal-500/30 p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(45,212,191,0.2)]">
        {/* Serene Icon */}
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shadow-[0_0_20px_rgba(45,212,191,0.3)]">
          <Sparkles className="w-7 h-7" aria-hidden="true" />
        </div>

        <h3
          id="completion-title"
          className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2"
        >
          Session Complete
        </h3>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          Notice the stillness in your body and mind. You have completed your guided box breathing practice.
        </p>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-left">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
              Completed
            </span>
            <span className="text-lg font-bold text-white font-mono tabular-nums">
              {totalRounds} Rounds
            </span>
            <span className="text-xs text-teal-300/80 block mt-0.5">
              {level.name} ({level.pattern})
            </span>
          </div>

          <div className="text-left">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
              Mindful Time
            </span>
            <span className="text-lg font-bold text-white font-mono tabular-nums">
              {formattedTime}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              {level.secondsPerPhase}s per phase
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-[0.98] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(45,212,191,0.25)] transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Breathe Again</span>
          </button>

          <button
            type="button"
            onClick={onSelectAnotherLevel}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-850 active:scale-[0.98] text-slate-200 font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-slate-400" aria-hidden="true" />
            <span>Change Level</span>
          </button>
        </div>
      </div>
    </div>
  );
};
