import React from 'react';
import { Bell, BellOff, ShieldAlert, BarChart3, Sparkles } from 'lucide-react';
import { ThemeId } from '../types/theme';
import { AmbientSoundType } from '../types/ambientAudio';
import { ThemeSwitcher } from './ThemeSwitcher';
import { AmbientSoundToggle } from './AmbientSoundToggle';

interface HeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSafety: () => void;
  onScrollToStats?: () => void;
  onScrollToInsights?: () => void;
  currentThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
  ambientSound: AmbientSoundType;
  onSelectAmbientSound: (sound: AmbientSoundType) => void;
  ambientVolume: number;
  onChangeAmbientVolume: (vol: number) => void;
  isAmbientPlaying: boolean;
  is3DMode?: boolean;
  onToggle3DMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  soundEnabled,
  onToggleSound,
  onOpenSafety,
  onScrollToStats,
  onScrollToInsights,
  currentThemeId,
  onSelectTheme,
  ambientSound,
  onSelectAmbientSound,
  ambientVolume,
  onChangeAmbientVolume,
  isAmbientPlaying,
  is3DMode = false,
  onToggle3DMode,
}) => {
  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-teal-500/20 via-indigo-500/20 to-sky-400/20 border border-teal-500/30 flex items-center justify-center text-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.15)]">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-teal-300 transition-transform duration-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3c-1.5 3-4.5 6-7 7 2.5 1 5.5 4 7 7 1.5-3 4.5-6 7-7-2.5-1-5.5-4-7-7z" />
              <path d="M12 10v4" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm sm:text-base md:text-lg font-semibold tracking-tight text-slate-100 flex items-center gap-2">
              <span>Box Breathing</span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden lg:block">
              Breathe Better · Calm Your Mind · Improve Your Focus
            </p>
          </div>
        </div>

        {/* Action Controls: Ambient Sound, Theme, Chime Bell, Safety */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Ambient Nature Sound Dropdown */}
          <AmbientSoundToggle
            currentSound={ambientSound}
            onSelectSound={onSelectAmbientSound}
            volume={ambientVolume}
            onChangeVolume={onChangeAmbientVolume}
            isPlaying={isAmbientPlaying}
          />

          {/* Theme Switcher Dropdown */}
          <ThemeSwitcher
            currentThemeId={currentThemeId}
            onSelectTheme={onSelectTheme}
          />

          {/* Phase Chime Bell Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute phase transition bell chimes' : 'Enable phase transition bell chimes'}
            title={soundEnabled ? 'Bell Chimes On' : 'Bell Chimes Muted'}
            className={`min-h-[40px] px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-slate-900 border-teal-500/40 text-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.12)]'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {soundEnabled ? (
              <Bell className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <BellOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            )}
            <span className="hidden xl:inline">
              {soundEnabled ? 'Bell On' : 'Bell Off'}
            </span>
          </button>

          {/* Safety Guide */}
          <button
            type="button"
            onClick={onOpenSafety}
            aria-label="View safety and comfort guidelines"
            title="Safety Guidelines"
            className="min-h-[40px] px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400/80 shrink-0" aria-hidden="true" />
            <span className="hidden xl:inline">Safety</span>
          </button>

          {/* Stats quick jump button */}
          {onScrollToStats && (
            <button
              type="button"
              onClick={onScrollToStats}
              aria-label="Jump to Breath Stats dashboard"
              title="View Breath Stats"
              className="min-h-[40px] px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-800 bg-slate-900/60 text-teal-300 hover:text-teal-200 hover:border-teal-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-teal-400 shrink-0" aria-hidden="true" />
              <span className="hidden xl:inline">Stats</span>
            </button>
          )}

          {/* Insights quick jump button */}
          {onScrollToInsights && (
            <button
              type="button"
              onClick={onScrollToInsights}
              aria-label="Jump to Breath Insights section"
              title="View Breath Insights"
              className="min-h-[40px] px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-800 bg-slate-900/60 text-cyan-300 hover:text-cyan-200 hover:border-cyan-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
              <span className="hidden xl:inline">Insights</span>
            </button>
          )}

          {/* 3D Sanctuary Mode Toggle Button */}
          {onToggle3DMode && (
            <button
              type="button"
              onClick={onToggle3DMode}
              aria-label={is3DMode ? 'Return to 2D Dashboard' : 'Open Immersive Three.js 3D Breath Sanctuary'}
              title={is3DMode ? 'Return to 2D Dashboard' : 'Enter 3D Breath Sanctuary'}
              className={`min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                is3DMode
                  ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.4)]'
                  : 'bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-indigo-500/20 hover:from-teal-500/30 hover:to-indigo-500/30 border-teal-500/40 text-teal-200 hover:text-white hover:border-teal-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-300 shrink-0" aria-hidden="true" />
              <span>{is3DMode ? '2D View' : '✨ 3D Sanctuary'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
