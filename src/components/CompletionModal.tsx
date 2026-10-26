import React, { useState, useEffect } from 'react';
import { RotateCcw, Sliders, Sparkles, PenLine, Check } from 'lucide-react';
import { LevelConfig } from '../types/breathing';
import { formatTimeMinutesSeconds } from '../utils/timerLogic';

interface CompletionModalProps {
  isOpen: boolean;
  totalRounds: number;
  totalDurationSeconds: number;
  level: LevelConfig;
  sessionId?: string | null;
  initialNote?: string;
  onSaveNote?: (note: string) => void;
  onRestart: () => void;
  onSelectAnotherLevel: () => void;
}

const QUICK_REFLECTION_PROMPTS = [
  '🌿 Calm & Centered',
  '⚡ Focused & Clear',
  '😌 Tension Released',
  '🌙 Ready for Sleep',
  '❤️ Heart Slowed',
];

export const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  totalRounds,
  totalDurationSeconds,
  level,
  initialNote = '',
  onSaveNote,
  onRestart,
  onSelectAnotherLevel,
}) => {
  const [noteText, setNoteText] = useState<string>(initialNote);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Sync initial note when modal opens
  useEffect(() => {
    if (isOpen) {
      setNoteText(initialNote);
      setIsSaved(false);
    }
  }, [isOpen, initialNote]);

  const handleSaveNote = () => {
    if (onSaveNote) {
      onSaveNote(noteText.trim());
      setIsSaved(true);
    }
  };

  const handleRestartWithSave = () => {
    if (noteText.trim() && noteText.trim() !== initialNote.trim()) {
      onSaveNote?.(noteText.trim());
    }
    onRestart();
  };

  const handleSelectAnotherWithSave = () => {
    if (noteText.trim() && noteText.trim() !== initialNote.trim()) {
      onSaveNote?.(noteText.trim());
    }
    onSelectAnotherLevel();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept Escape if user is typing or if they want to exit
      if (e.key === 'Escape') {
        if (noteText.trim() && noteText.trim() !== initialNote.trim()) {
          onSaveNote?.(noteText.trim());
        }
        onSelectAnotherLevel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, noteText, initialNote, onSaveNote, onSelectAnotherLevel]);

  if (!isOpen) return null;

  const formattedTime = formatTimeMinutesSeconds(totalDurationSeconds);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-teal-500/30 p-5 sm:p-7 text-center shadow-[0_0_50px_rgba(45,212,191,0.2)] flex flex-col gap-4">
        {/* Serene Icon */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shadow-[0_0_20px_rgba(45,212,191,0.3)]">
          <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
        </div>

        <div>
          <h3
            id="completion-title"
            className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1"
          >
            Session Complete
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Notice the stillness in your body and mind. You have completed your guided practice.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-left">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Completed
            </span>
            <span className="text-base sm:text-lg font-bold text-white font-mono tabular-nums">
              {totalRounds} Rounds
            </span>
            <span className="text-xs text-teal-300/80 block mt-0.5 truncate">
              {level.name} ({level.pattern})
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Mindful Time
            </span>
            <span className="text-base sm:text-lg font-bold text-white font-mono tabular-nums">
              {formattedTime}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5 truncate">
              {level.category === '4-7-8'
                ? '4s · 7s · 8s'
                : level.category === 'resonant'
                ? '5.5s In · 5.5s Out'
                : level.category === 'viloma'
                ? '4s · 2s · 6s · 2s'
                : level.category === 'ujjayi'
                ? '6s In · 6s Out'
                : `${level.secondsPerPhase}s per phase`}
            </span>
          </div>
        </div>

        {/* Breath Notes Reflection Card */}
        <div className="rounded-xl bg-slate-950/70 border border-slate-800/90 p-3.5 text-left flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="breath-note-input"
              className="text-xs font-semibold text-slate-200 flex items-center gap-1.5"
            >
              <PenLine className="w-3.5 h-3.5 text-teal-400" />
              <span>Breath Note (Reflection)</span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              {noteText.length}/240
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-tight">
            How are you feeling right now? Tap a reflection or type your thoughts:
          </p>

          {/* Quick reflection prompt chips */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {QUICK_REFLECTION_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  setNoteText((prev) => {
                    const trimmed = prev.trim();
                    if (!trimmed) return prompt;
                    if (trimmed.includes(prompt)) return prev;
                    return `${trimmed} · ${prompt}`;
                  });
                  setIsSaved(false);
                }}
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800/90 border border-slate-700/80 text-slate-300 hover:text-teal-300 transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          <textarea
            id="breath-note-input"
            rows={2}
            maxLength={240}
            value={noteText}
            onChange={(e) => {
              setNoteText(e.target.value);
              setIsSaved(false);
            }}
            placeholder="e.g., Felt shoulders drop, heart rate slowed, calm clarity..."
            className="w-full rounded-lg bg-slate-900 border border-slate-700/70 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 p-2 text-xs text-slate-100 placeholder:text-slate-500 resize-none outline-none transition-all"
          />

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[10px] text-slate-400">
              Saved automatically to session history
            </span>
            {noteText.trim() && (
              <button
                type="button"
                onClick={handleSaveNote}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  isSaved
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40'
                }`}
              >
                {isSaved ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Saved</span>
                  </>
                ) : (
                  <span>Save Note</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleRestartWithSave}
            className="flex-1 min-h-[42px] px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-[0.98] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(45,212,191,0.25)] transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Breathe Again</span>
          </button>

          <button
            type="button"
            onClick={handleSelectAnotherWithSave}
            className="flex-1 min-h-[42px] px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-850 active:scale-[0.98] text-slate-200 font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-slate-400" aria-hidden="true" />
            <span>Change Level</span>
          </button>
        </div>
      </div>
    </div>
  );
};
