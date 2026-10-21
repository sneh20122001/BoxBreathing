import React, { useState, useRef, useEffect } from 'react';
import { CloudRain, Trees, Waves, Wind, VolumeX, ChevronDown, Check, Volume2 } from 'lucide-react';
import { AMBIENT_PRESETS, AmbientSoundType } from '../types/ambientAudio';

interface AmbientSoundToggleProps {
  currentSound: AmbientSoundType;
  onSelectSound: (sound: AmbientSoundType) => void;
  volume: number;
  onChangeVolume: (volume: number) => void;
  isPlaying: boolean;
}

export const AmbientSoundToggle: React.FC<AmbientSoundToggleProps> = ({
  currentSound,
  onSelectSound,
  volume,
  onChangeVolume,
  isPlaying,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activePreset =
    AMBIENT_PRESETS.find((p) => p.id === currentSound) || AMBIENT_PRESETS[0];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const renderIcon = (type: AmbientSoundType, className = 'w-3.5 h-3.5') => {
    switch (type) {
      case 'rain':
        return <CloudRain className={className} aria-hidden="true" />;
      case 'forest':
        return <Trees className={className} aria-hidden="true" />;
      case 'ocean':
        return <Waves className={className} aria-hidden="true" />;
      default:
        return <Wind className={className} aria-hidden="true" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Dropdown Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Ambient nature sound: ${activePreset.name}. Click to change ambient audio`}
        className={`min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
          currentSound !== 'none'
            ? 'bg-slate-900 border-teal-500/40 text-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.12)]'
            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
        }`}
      >
        <span className="relative flex items-center justify-center">
          {renderIcon(currentSound)}
          {isPlaying && (
            <span
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_6px_rgba(45,212,191,0.9)]"
              aria-hidden="true"
            />
          )}
        </span>
        <span className="hidden md:inline whitespace-nowrap">
          {currentSound === 'none' ? 'Ambient' : activePreset.name}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Menu & Volume Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Ambient nature sound options"
          className="absolute right-0 mt-2 w-60 sm:w-64 rounded-xl bg-slate-900/95 border border-slate-800 backdrop-blur-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3.5 py-1 border-b border-slate-800/80 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Ambient Nature Sounds
            </span>
            {isPlaying && (
              <span className="text-[10px] text-teal-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                Playing
              </span>
            )}
          </div>

          {AMBIENT_PRESETS.map((preset) => {
            const isSelected = preset.id === currentSound;
            return (
              <button
                key={preset.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelectSound(preset.id);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/80 text-white'
                    : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {renderIcon(preset.id, 'w-4 h-4')}
                  </div>
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

          {/* Volume Slider Section */}
          {currentSound !== 'none' && (
            <div className="mt-2 pt-2 px-3.5 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-slate-400" />
                  Volume
                </span>
                <span className="font-mono tabular-nums text-slate-300">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.01"
                value={volume}
                onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                aria-label="Ambient nature sound volume"
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
