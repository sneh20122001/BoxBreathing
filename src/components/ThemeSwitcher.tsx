import React, { useState, useRef, useEffect } from 'react';
import { Palette, ChevronDown, Check } from 'lucide-react';
import { THEME_PRESETS, ThemeId, ThemePreset } from '../types/theme';

interface ThemeSwitcherProps {
  currentThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  currentThemeId,
  onSelectTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeTheme =
    THEME_PRESETS.find((t) => t.id === currentThemeId) || THEME_PRESETS[0];

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Dropdown Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Theme: ${activeTheme.name}. Click to change background theme`}
        className="min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 flex items-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
          style={{ backgroundColor: activeTheme.accentColor }}
          aria-hidden="true"
        />
        <Palette className="w-3.5 h-3.5 text-slate-400 hidden xs:inline" aria-hidden="true" />
        <span className="hidden sm:inline whitespace-nowrap">{activeTheme.name}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Preset color palettes"
          className="absolute right-0 mt-2 w-56 sm:w-64 rounded-xl bg-slate-900/95 border border-slate-800 backdrop-blur-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-1.5 border-b border-slate-800/80 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Color Palette
            </span>
          </div>

          {THEME_PRESETS.map((preset) => {
            const isSelected = preset.id === currentThemeId;
            return (
              <button
                key={preset.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelectTheme(preset.id);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/80 text-white'
                    : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20 shadow-sm"
                    style={{ backgroundColor: preset.accentColor }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold block truncate">
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {preset.description}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <Check
                    className="w-4 h-4 text-teal-400 shrink-0 ml-2"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
