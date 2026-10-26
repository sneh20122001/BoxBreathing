export type BreathingPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

export type BreathingCategory = 'box' | '4-7-8' | 'resonant' | 'viloma' | 'ujjayi';

export interface PhaseDurations {
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  pattern: string;
  category: BreathingCategory;
  secondsPerPhase: number;
  phaseDurations: PhaseDurations;
  tagline: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  badge?: string;
  description?: string;
  recommendedRounds?: number;
}

export const BREATHING_LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Level 1',
    pattern: '5-5-5-5',
    category: 'box',
    secondsPerPhase: 5,
    phaseDurations: { inhale: 5, hold1: 5, exhale: 5, hold2: 5 },
    tagline: 'Gentle cadence ideal for starting out and daily stress relief',
    difficulty: 'Beginner',
    badge: 'Box',
    description: 'Classic equal-ratio box breathing to reset your nervous system.',
    recommendedRounds: 5,
  },
  {
    id: 2,
    name: 'Level 2',
    pattern: '7-7-7-7',
    category: 'box',
    secondsPerPhase: 7,
    phaseDurations: { inhale: 7, hold1: 7, exhale: 7, hold2: 7 },
    tagline: 'Deepening rhythm to slow the heart rate and ground awareness',
    difficulty: 'Intermediate',
    badge: 'Box',
    description: 'Extended holds for mental stillness and composure under pressure.',
    recommendedRounds: 5,
  },
  {
    id: 3,
    name: 'Level 3',
    pattern: '9-9-9-9',
    category: 'box',
    secondsPerPhase: 9,
    phaseDurations: { inhale: 9, hold1: 9, exhale: 9, hold2: 9 },
    tagline: 'Expansive breath holds for seasoned practitioners and focus',
    difficulty: 'Advanced',
    badge: 'Box',
    description: 'Challenging 36s cycles designed to expand lung capacity.',
    recommendedRounds: 4,
  },
  {
    id: 4,
    name: 'Level 4',
    pattern: '11-11-11-11',
    category: 'box',
    secondsPerPhase: 11,
    phaseDurations: { inhale: 11, hold1: 11, exhale: 11, hold2: 11 },
    tagline: 'High-capacity lung control and profound meditative stillness',
    difficulty: 'Expert',
    badge: 'Box',
    description: 'Profound breath retention for master-level autonomic control.',
    recommendedRounds: 3,
  },
  {
    id: 5,
    name: '4-7-8 Relax',
    pattern: '4-7-8',
    category: '4-7-8',
    secondsPerPhase: 4,
    phaseDurations: { inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
    tagline: 'In 4s · Hold 7s · Out 8s: natural tranquilizer for sleep & stress',
    difficulty: 'Intermediate',
    badge: '4-7-8',
    description: 'Dr. Andrew Weil’s relaxing breath pattern that stimulates the vagus nerve and quiets racing thoughts.',
    recommendedRounds: 4,
  },
  {
    id: 6,
    name: 'Resonant',
    pattern: '5.5-5.5',
    category: 'resonant',
    secondsPerPhase: 5.5,
    phaseDurations: { inhale: 5.5, hold1: 0, exhale: 5.5, hold2: 0 },
    tagline: 'In 5.5s · Out 5.5s (6 bpm): maximizes Heart Rate Variability (HRV)',
    difficulty: 'Beginner',
    badge: 'Resonant',
    description: 'Coherent breathing at resonant frequency to synchronize heart, lungs, and autonomic rhythm.',
    recommendedRounds: 5,
  },
  {
    id: 7,
    name: 'Viloma',
    pattern: '4-2-6-2',
    category: 'viloma',
    secondsPerPhase: 4,
    phaseDurations: { inhale: 4, hold1: 2, exhale: 6, hold2: 2 },
    tagline: 'In 4s · Hold 2s · Out 6s · Pause 2s: stepped pause breath to expand capacity & calm',
    difficulty: 'Intermediate',
    badge: 'Viloma',
    description: 'Interrupted breath (Viloma Pranayama). Stepped pauses train conscious respiratory control and dissolve anxious tension.',
    recommendedRounds: 5,
  },
  {
    id: 8,
    name: 'Ujjayi',
    pattern: '6-6',
    category: 'ujjayi',
    secondsPerPhase: 6,
    phaseDurations: { inhale: 6, hold1: 0, exhale: 6, hold2: 0 },
    tagline: 'In 6s · Out 6s: oceanic throat whisper to cultivate heat, rhythm & focus',
    difficulty: 'Beginner',
    badge: 'Ujjayi',
    description: 'Victorious Ocean Breath (Ujjayi Pranayama). Gentle constriction of the glottis creates a calming wave sound that anchors meditative presence.',
    recommendedRounds: 5,
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
