import React, { useEffect } from 'react';
import { ShieldAlert, X, Heart, AlertCircle, Sparkles } from 'lucide-react';

interface SafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyModal: React.FC<SafetyModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="safety-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 p-6 sm:p-7 text-slate-200 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close safety guidance modal"
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3
              id="safety-modal-title"
              className="text-lg font-bold tracking-tight text-white"
            >
              Safety & Comfort Guidelines
            </h3>
            <span className="text-xs text-slate-400">
              Wellness & Relaxation Tool
            </span>
          </div>
        </div>

        <div className="space-y-3.5 text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong className="text-white">Listen to your body:</strong> Never force your breath or strain to hold beyond your comfort level. If you experience dizziness, lightheadedness, breathlessness, or chest discomfort, stop immediately and return to your natural breathing rhythm.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
            <Heart className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong className="text-white">Holds are optional:</strong> If an extended hold feels strenuous, simply breathe gently in and out without holding. You are always in control and can stop or pause at any moment.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong className="text-white">Non-medical disclaimer:</strong> This application is intended solely for general mindfulness, relaxation, and wellness. It is not a medical device and is not designed to diagnose, treat, prevent, or cure any medical or mental health condition.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[44px] py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors cursor-pointer"
        >
          Understood & Return to Practice
        </button>
      </div>
    </div>
  );
};

export const SafetyBanner: React.FC<{ onOpenModal: () => void }> = ({ onOpenModal }) => {
  return (
    <aside
      aria-label="Safety advice"
      className="w-full rounded-xl bg-slate-900/40 border border-slate-800/80 p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 text-xs text-slate-400"
    >
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-400/90 shrink-0" aria-hidden="true" />
        <span>
          <strong className="text-slate-300">Comfort first:</strong> Stop and breathe normally if you feel lightheaded. Breath holds are always optional.
        </span>
      </div>
      <button
        type="button"
        onClick={onOpenModal}
        className="text-xs text-teal-300 hover:text-teal-200 underline underline-offset-4 shrink-0 transition-colors cursor-pointer"
      >
        Read Full Safety Note
      </button>
    </aside>
  );
};
