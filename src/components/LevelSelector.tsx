import React, { useState } from 'react';
import { BREATHING_LEVELS, BreathingCategory, LevelConfig } from '../types/breathing';

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
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<BreathingCategory | 'all'>('all');

  const filteredLevels = activeCategoryFilter === 'all'
    ? BREATHING_LEVELS
    : BREATHING_LEVELS.filter((lvl) => lvl.category === activeCategoryFilter);

  const getCategoryBadgeStyle = (category: BreathingCategory, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
    }
    switch (category) {
      case '4-7-8':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'resonant':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'viloma':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'ujjayi':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      case 'box':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700/60';
    }
  };

  const formatPatternDurationLabel = (lvl: LevelConfig): string => {
    if (lvl.category === '4-7-8') {
      return '4s · 7s · 8s';
    }
    if (lvl.category === 'resonant') {
      return '5.5s in · 5.5s out';
    }
    if (lvl.category === 'viloma') {
      return '4s · 2s · 6s · 2s';
    }
    if (lvl.category === 'ujjayi') {
      return '6s in · 6s out';
    }
    return `${lvl.secondsPerPhase}s / phase`;
  };

  return (
    <section aria-labelledby="level-heading" className="w-full">
      {/* Header and Active Technique Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5 sm:mb-3">
        <div className="flex items-center gap-2">
          <h2 id="level-heading" className="text-xs sm:text-sm font-semibold tracking-wider text-slate-300 uppercase">
            Breathing Techniques & Levels
          </h2>
          <span className="text-[11px] text-slate-400">
            ({BREATHING_LEVELS.length} patterns)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Active:</span>
          <span className="px-2 py-0.5 rounded-md bg-teal-500/15 border border-teal-500/30 text-teal-300 font-semibold flex items-center gap-1.5">
            <span>{selectedLevel.name}</span>
            <span className="font-mono tabular-nums text-teal-200">({selectedLevel.pattern})</span>
          </span>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 mb-2.5 text-xs no-scrollbar" role="tablist" aria-label="Breathing technique categories">
        <button
          type="button"
          role="tab"
          aria-selected={activeCategoryFilter === 'all'}
          onClick={() => setActiveCategoryFilter('all')}
          className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
            activeCategoryFilter === 'all'
              ? 'bg-slate-800 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
          }`}
        >
          All Techniques ({BREATHING_LEVELS.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeCategoryFilter === 'box'}
          onClick={() => setActiveCategoryFilter('box')}
          className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
            activeCategoryFilter === 'box'
              ? 'bg-slate-800 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
          }`}
        >
          Box Breathing (4)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeCategoryFilter === '4-7-8'}
          onClick={() => setActiveCategoryFilter('4-7-8')}
          className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
            activeCategoryFilter === '4-7-8'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 hover:text-amber-200 hover:bg-slate-800/80 border border-slate-800'
          }`}
        >
          4-7-8 Relax
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeCategoryFilter === 'resonant'}
          onClick={() => setActiveCategoryFilter('resonant')}
          className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
            activeCategoryFilter === 'resonant'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 hover:text-emerald-200 hover:bg-slate-800/80 border border-slate-800'
          }`}
        >
          Resonant (5.5s)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeCategoryFilter === 'viloma'}
          onClick={() => setActiveCategoryFilter('viloma')}
          className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
            activeCategoryFilter === 'viloma'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 hover:text-purple-200 hover:bg-slate-800/80 border border-slate-800'
          }`}
        >
          Viloma (Pause)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeCategoryFilter === 'ujjayi'}
          onClick={() => setActiveCategoryFilter('ujjayi')}
          className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
            activeCategoryFilter === 'ujjayi'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 hover:text-cyan-200 hover:bg-slate-800/80 border border-slate-800'
          }`}
        >
          Ujjayi (Ocean)
        </button>
      </div>

      {/* Grid of Technique / Level Cards */}
      <div
        className={`grid gap-2.5 sm:gap-3 ${
          filteredLevels.length === 1
            ? 'grid-cols-1 sm:grid-cols-2 max-w-xl'
            : filteredLevels.length <= 4
            ? 'grid-cols-2 sm:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-4'
        }`}
      >
        {filteredLevels.map((lvl) => {
          const isSelected = selectedLevel.id === lvl.id;
          const badgeStyle = getCategoryBadgeStyle(lvl.category, isSelected);

          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => onSelectLevel(lvl)}
              aria-pressed={isSelected}
              className={`relative text-left p-2.5 sm:p-3 rounded-xl border transition-all text-slate-200 min-h-[104px] sm:min-h-[114px] flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/80 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900/95 border-teal-500/80 shadow-[0_0_20px_rgba(45,212,191,0.2)] ring-1 ring-teal-500/40'
                  : 'bg-slate-900/45 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700/80 text-slate-300'
              }`}
            >
              {/* Card top row */}
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[11px] sm:text-xs font-bold tracking-tight text-white whitespace-nowrap">
                      {lvl.name}
                    </span>
                    <kbd
                      className="hidden sm:inline-block text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800/90 border border-slate-700/80 text-slate-400 shrink-0"
                      title={`Press ${lvl.id} to select`}
                    >
                      {lvl.id}
                    </kbd>
                  </div>

                  <span
                    className={`text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${badgeStyle}`}
                  >
                    {lvl.badge || lvl.difficulty}
                  </span>
                </div>

                {/* Pattern and timing */}
                <div className="flex items-baseline gap-1.5 mb-1 flex-wrap">
                  <span className="text-sm sm:text-base font-bold tracking-tight text-white font-mono tabular-nums whitespace-nowrap">
                    {lvl.pattern}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    {formatPatternDurationLabel(lvl)}
                  </span>
                </div>
              </div>

              {/* Tagline benefit */}
              <p className="text-[10px] sm:text-[10.5px] text-slate-400 line-clamp-2 leading-snug">
                {lvl.tagline}
              </p>

              {/* Active selection dot */}
              {isSelected && (
                <div
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.85)]"
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

