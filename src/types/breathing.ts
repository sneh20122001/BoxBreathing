export type BreathingPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

export interface LevelConfig {
  id: number;
  name: string;
  pattern: string;
  secondsPerPhase: number;
  tagline: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export const BREATHING_LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Level 1',
    pattern: '5-5-5-5',
    secondsPerPhase: 5,
    tagline: 'Gentle cadence ideal for starting out and daily stress relief',
    difficulty: 'Beginner',
  },
  {
    id: 2,
    name: 'Level 2',
    pattern: '7-7-7-7',
    secondsPerPhase: 7,
    tagline: 'Deepening rhythm to slow the heart rate and ground awareness',
    difficulty: 'Intermediate',
  },
  {
    id: 3,
    name: 'Level 3',
    pattern: '9-9-9-9',
    secondsPerPhase: 9,
    tagline: 'Expansive breath holds for seasoned practitioners and focus',
    difficulty: 'Advanced',
  },
  {
    id: 4,
    name: 'Level 4',
    pattern: '11-11-11-11',
    secondsPerPhase: 11,
    tagline: 'High-capacity lung control and profound meditative stillness',
    difficulty: 'Expert',
  },
];

export interface PhaseInfo {
  phase: BreathingPhase;
  label: string;
  instruction: string;
  action: 'expand' | 'hold-full' | 'contract' | 'hold-empty';
  colorName: string;
  accentClass: string;
  glowClass: string;
  borderClass: string;
  bgTintClass: string;
}

export const PHASE_DETAILS: Record<BreathingPhase, PhaseInfo> = {
  inhale: {
    phase: 'inhale',
    label: 'Inhale',
    instruction: 'Breathe in gently through your nose',
    action: 'expand',
    colorName: 'Teal',
    accentClass: 'text-teal-400',
    glowClass: 'shadow-[0_0_50px_rgba(45,212,191,0.35)]',
    borderClass: 'border-teal-400',
    bgTintClass: 'bg-teal-500/10',
  },
  hold1: {
    phase: 'hold1',
    label: 'Hold',
    instruction: 'Pause comfortably without straining',
    action: 'hold-full',
    colorName: 'Indigo',
    accentClass: 'text-indigo-400',
    glowClass: 'shadow-[0_0_50px_rgba(129,140,248,0.35)]',
    borderClass: 'border-indigo-400',
    bgTintClass: 'bg-indigo-500/10',
  },
  exhale: {
    phase: 'exhale',
    label: 'Exhale',
    instruction: 'Breathe out slowly and gently',
    action: 'contract',
    colorName: 'Amber',
    accentClass: 'text-amber-400',
    glowClass: 'shadow-[0_0_50px_rgba(251,191,36,0.35)]',
    borderClass: 'border-amber-400',
    bgTintClass: 'bg-amber-500/10',
  },
  hold2: {
    phase: 'hold2',
    label: 'Hold',
    instruction: 'Rest comfortably before the next inhale',
    action: 'hold-empty',
    colorName: 'Sky',
    accentClass: 'text-sky-400',
    glowClass: 'shadow-[0_0_50px_rgba(56,189,248,0.35)]',
    borderClass: 'border-sky-400',
    bgTintClass: 'bg-sky-500/10',
  },
};

export type SessionStatus = 'idle' | 'running' | 'paused' | 'completed';
