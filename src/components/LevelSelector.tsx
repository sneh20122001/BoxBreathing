import React from 'react';
import { BREATHING_LEVELS, LevelConfig } from '../types/breathing';

interface LevelSelectorProps {
  selectedLevel: LevelConfig;
  onSelectLevel: (level: LevelConfig) => void;
  isRunning: boolean;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  selectedLevel,
  onSelectLevel,
  isRunning,
}) => {
  return (
    <section aria-labelledby="level-heading" className="w-full">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <h2 id="level-heading" className="text-xs sm:text-sm font-semibold tracking-wider text-slate-300 uppercase">
          Breathing Levels
        </h2>
        <span className="text-xs text-slate-400">
          Active: <strong className="text-teal-300 font-semibold">{selectedLevel.name} ({selectedLevel.pattern})</strong>
        </span>
      </div>

      {/* Responsive 2-cols on mobile, 4-cols on tablet & desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {BREATHING_LEVELS.map((lvl) => {
          const isSelected = selectedLevel.id === lvl.id;
          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => onSelectLevel(lvl)}
              aria-pressed={isSelected}
              className={`relative text-left p-2.5 sm:p-3.5 rounded-xl border transition-all text-slate-200 min-h-[76px] sm:min-h-[92px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/80 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900/90 border-teal-500/70 shadow-[0_0_20px_rgba(45,212,191,0.18)]'
                  : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700/80 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-slate-400">
                    {lvl.name}
                  </span>
                  <kbd className="hidden sm:inline-block text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800/90 border border-slate-700/80 text-slate-400" title={`Press ${lvl.id} to select`}>
                    {lvl.id}
                  </kbd>
                </div>
                <span
                  className={`text-[10px] sm:text-[11px] font-medium px-1.5 py-0.2 rounded ${
                    isSelected
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'bg-slate-800/80 text-slate-400'
                  }`}
                >
                  {lvl.difficulty}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-white font-mono tabular-nums">
                  {lvl.pattern}
                </span>
                <span className="text-[11px] text-slate-400">
                  {lvl.secondsPerPhase}s
                </span>
              </div>

              <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-1 leading-normal">
                {lvl.tagline}
              </p>

              {isSelected && (
                <div
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
