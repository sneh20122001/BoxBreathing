import React from 'react';
import { BreathingPhase, PHASE_DETAILS } from '../types/breathing';
import { ArrowUpRight, PauseCircle, ArrowDownRight, Coffee } from 'lucide-react';

interface InstructionsProps {
  currentPhase: BreathingPhase;
  isRunning: boolean;
}

export const Instructions: React.FC<InstructionsProps> = ({
  currentPhase,
  isRunning,
}) => {
  const steps: Array<{
    phase: BreathingPhase;
    icon: React.ReactNode;
    title: string;
    description: string;
    phaseBadge: string;
  }> = [
    {
      phase: 'inhale',
      icon: <ArrowUpRight className="w-4 h-4 text-teal-400" aria-hidden="true" />,
      title: '1. Inhale',
      description: 'Breathe in gently through your nose, expanding your diaphragm.',
      phaseBadge: 'Phase 1',
    },
    {
      phase: 'hold1',
      icon: <PauseCircle className="w-4 h-4 text-indigo-400" aria-hidden="true" />,
      title: '2. Hold',
      description: 'Pause comfortably at full capacity without straining your throat.',
      phaseBadge: 'Phase 2',
    },
    {
      phase: 'exhale',
      icon: <ArrowDownRight className="w-4 h-4 text-amber-400" aria-hidden="true" />,
      title: '3. Exhale',
      description: 'Breathe out slowly and gently through nose or lips, releasing tension.',
      phaseBadge: 'Phase 3',
    },
    {
      phase: 'hold2',
      icon: <Coffee className="w-4 h-4 text-sky-400" aria-hidden="true" />,
      title: '4. Hold',
      description: 'Rest comfortably empty before the next breath begins.',
      phaseBadge: 'Phase 4',
    },
  ];

  return (
    <section aria-labelledby="guide-heading" className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 id="guide-heading" className="text-sm font-semibold tracking-wide text-slate-300 uppercase">
          Technique Guide
        </h2>
        <span className="text-xs text-slate-400">
          The 4 Sides of the Box
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step) => {
          const isActive = isRunning && currentPhase === step.phase;
          return (
            <div
              key={step.phase}
              className={`p-3.5 rounded-xl border transition-all ${
                isActive
                  ? 'bg-slate-900/90 border-teal-500/60 shadow-[0_0_20px_rgba(45,212,191,0.15)] ring-1 ring-teal-500/30'
                  : 'bg-slate-900/40 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                    {step.icon}
                  </div>
                  <h3 className="text-xs font-semibold text-slate-100">
                    {step.title}
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {step.phaseBadge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
