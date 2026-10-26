import React from 'react';
import { BreathingPhase, LevelConfig } from '../types/breathing';
import { ArrowUpRight, PauseCircle, ArrowDownRight, Coffee, Heart, Moon } from 'lucide-react';

interface InstructionsProps {
  currentPhase: BreathingPhase;
  isRunning: boolean;
  level?: LevelConfig;
}

export const Instructions: React.FC<InstructionsProps> = ({
  currentPhase,
  isRunning,
  level,
}) => {
  const category = level?.category || 'box';

  const getSteps = () => {
    if (category === 'resonant') {
      return [
        {
          phase: 'inhale' as BreathingPhase,
          icon: <ArrowUpRight className="w-4 h-4 text-teal-400" aria-hidden="true" />,
          title: '1. Inhale (5.5s)',
          description: 'Breathe in smoothly through the nose deep into the lower abdomen.',
          phaseBadge: '5.5s',
        },
        {
          phase: 'exhale' as BreathingPhase,
          icon: <ArrowDownRight className="w-4 h-4 text-amber-400" aria-hidden="true" />,
          title: '2. Exhale (5.5s)',
          description: 'Release gently without pause or breath-holding, like an uninterrupted ocean wave.',
          phaseBadge: '5.5s',
        },
        {
          phase: 'inhale' as BreathingPhase,
          icon: <Heart className="w-4 h-4 text-emerald-400" aria-hidden="true" />,
          title: 'HRV Coherence',
          description: '5.5 breaths per minute matches the natural resonance frequency of your baroreceptors.',
          phaseBadge: '6 bpm',
        },
        {
          phase: 'exhale' as BreathingPhase,
          icon: <Coffee className="w-4 h-4 text-sky-400" aria-hidden="true" />,
          title: 'Equilibrium',
          description: 'Synchronizes your heart rhythm, blood pressure, and mental calmness.',
          phaseBadge: 'Balance',
        },
      ];
    }

    if (category === '4-7-8') {
      return [
        {
          phase: 'inhale' as BreathingPhase,
          icon: <ArrowUpRight className="w-4 h-4 text-teal-400" aria-hidden="true" />,
          title: '1. Inhale (4s)',
          description: 'Quietly breathe in through your nose for a count of four.',
          phaseBadge: '4s In',
        },
        {
          phase: 'hold1' as BreathingPhase,
          icon: <PauseCircle className="w-4 h-4 text-indigo-400" aria-hidden="true" />,
          title: '2. Hold (7s)',
          description: 'Hold your breath gently for seven seconds, letting oxygen saturate your cells.',
          phaseBadge: '7s Hold',
        },
        {
          phase: 'exhale' as BreathingPhase,
          icon: <ArrowDownRight className="w-4 h-4 text-amber-400" aria-hidden="true" />,
          title: '3. Exhale (8s)',
          description: 'Make a soft whoosh sound exhaling completely through the mouth for eight seconds.',
          phaseBadge: '8s Out',
        },
        {
          phase: 'inhale' as BreathingPhase,
          icon: <Moon className="w-4 h-4 text-purple-400" aria-hidden="true" />,
          title: 'Natural Tranquilizer',
          description: 'Stimulates the vagus nerve and activates deep parasympathetic relaxation.',
          phaseBadge: 'Sleep',
        },
      ];
    }

    if (category === 'viloma') {
      return [
        {
          phase: 'inhale' as BreathingPhase,
          icon: <ArrowUpRight className="w-4 h-4 text-teal-400" aria-hidden="true" />,
          title: '1. Inhale (4s)',
          description: 'Draw breath smoothly into the lower lungs with focused diaphragmatic expansion.',
          phaseBadge: '4s In',
        },
        {
          phase: 'hold1' as BreathingPhase,
          icon: <PauseCircle className="w-4 h-4 text-indigo-400" aria-hidden="true" />,
          title: '2. Pause (2s)',
          description: 'Hold softly at full lung volume, keeping throat, shoulders, and jaw relaxed.',
          phaseBadge: '2s Hold',
        },
        {
          phase: 'exhale' as BreathingPhase,
          icon: <ArrowDownRight className="w-4 h-4 text-amber-400" aria-hidden="true" />,
          title: '3. Exhale (6s)',
          description: 'Elongate the outbreath slowly and steadily, emptying completely without tension.',
          phaseBadge: '6s Out',
        },
        {
          phase: 'hold2' as BreathingPhase,
          icon: <Coffee className="w-4 h-4 text-sky-400" aria-hidden="true" />,
          title: '4. Rest Empty (2s)',
          description: 'Rest in tranquil stillness at empty lung volume before the next cycle begins.',
          phaseBadge: '2s Pause',
        },
      ];
    }

    if (category === 'ujjayi') {
      return [
        {
          phase: 'inhale' as BreathingPhase,
          icon: <ArrowUpRight className="w-4 h-4 text-teal-400" aria-hidden="true" />,
          title: '1. Inhale (6s)',
          description: 'Breathe in slowly through the nose with a gentle constriction at the back of the throat.',
          phaseBadge: '6s In',
        },
        {
          phase: 'exhale' as BreathingPhase,
          icon: <ArrowDownRight className="w-4 h-4 text-amber-400" aria-hidden="true" />,
          title: '2. Exhale (6s)',
          description: 'Release steadily through the nose while sustaining the soothing whisper of ocean waves.',
          phaseBadge: '6s Out',
        },
        {
          phase: 'inhale' as BreathingPhase,
          icon: <Heart className="w-4 h-4 text-cyan-400" aria-hidden="true" />,
          title: 'Oceanic Resonance',
          description: 'Glottic friction creates internal warmth and directly stimulates the calming vagus nerve.',
          phaseBadge: 'Vagus Tone',
        },
        {
          phase: 'exhale' as BreathingPhase,
          icon: <Coffee className="w-4 h-4 text-emerald-400" aria-hidden="true" />,
          title: 'Meditative Anchor',
          description: 'The whispering ocean sound anchors mental focus and stabilizes psychic clarity.',
          phaseBadge: 'Presence',
        },
      ];
    }

    // Default Box Breathing
    return [
      {
        phase: 'inhale' as BreathingPhase,
        icon: <ArrowUpRight className="w-4 h-4 text-teal-400" aria-hidden="true" />,
        title: '1. Inhale',
        description: 'Breathe in gently through your nose, expanding your diaphragm.',
        phaseBadge: 'Phase 1',
      },
      {
        phase: 'hold1' as BreathingPhase,
        icon: <PauseCircle className="w-4 h-4 text-indigo-400" aria-hidden="true" />,
        title: '2. Hold',
        description: 'Pause comfortably at full capacity without straining your throat.',
        phaseBadge: 'Phase 2',
      },
      {
        phase: 'exhale' as BreathingPhase,
        icon: <ArrowDownRight className="w-4 h-4 text-amber-400" aria-hidden="true" />,
        title: '3. Exhale',
        description: 'Breathe out slowly and gently through nose or lips, releasing tension.',
        phaseBadge: 'Phase 3',
      },
      {
        phase: 'hold2' as BreathingPhase,
        icon: <Coffee className="w-4 h-4 text-sky-400" aria-hidden="true" />,
        title: '4. Hold',
        description: 'Rest comfortably empty before the next breath begins.',
        phaseBadge: 'Phase 4',
      },
    ];
  };

  const steps = getSteps();

  const getHeadingSubtitle = () => {
    if (category === 'resonant') return 'Resonant Frequency (5.5s In · 5.5s Out)';
    if (category === '4-7-8') return '4-7-8 Relaxing Breath (In 4 · Hold 7 · Out 8)';
    if (category === 'viloma') return 'Viloma Stepped Breath (In 4 · Hold 2 · Out 6 · Pause 2)';
    if (category === 'ujjayi') return 'Ujjayi Ocean Breath (6s In · 6s Out)';
    return 'The 4 Sides of the Box';
  };

  return (
    <section aria-labelledby="guide-heading" className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 id="guide-heading" className="text-sm font-semibold tracking-wide text-slate-300 uppercase">
          Technique Guide
        </h2>
        <span className="text-xs text-slate-400 font-medium">
          {getHeadingSubtitle()}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step) => {
          const isActive = isRunning && currentPhase === step.phase;
          return (
            <div
              key={step.title}
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
