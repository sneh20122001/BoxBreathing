export type ThemeId = 'ocean-calm' | 'deep-forest' | 'sunset-glow' | 'midnight-slate';

export interface ThemePreset {
  id: ThemeId;
  name: string;
  description: string;
  accentColor: string;
  gradientClass: string;
  ambientGlow: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'ocean-calm',
    name: 'Ocean Calm',
    description: 'Serene midnight navy & deep oceanic blue',
    accentColor: '#38bdf8', // Sky 400
    gradientClass: 'bg-gradient-to-b from-slate-950 via-[#0a1329] to-slate-950',
    ambientGlow: 'rgba(56, 189, 248, 0.07)',
  },
  {
    id: 'deep-forest',
    name: 'Deep Forest',
    description: 'Grounding evergreen & dark botanical pine',
    accentColor: '#34d399', // Emerald 400
    gradientClass: 'bg-gradient-to-b from-[#040e0a] via-[#071f16] to-[#030906]',
    ambientGlow: 'rgba(52, 211, 153, 0.07)',
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    description: 'Warm dusk twilight & subtle rose-amber',
    accentColor: '#fb923c', // Orange 400
    gradientClass: 'bg-gradient-to-b from-[#140b18] via-[#1f1026] to-[#0c0511]',
    ambientGlow: 'rgba(251, 146, 60, 0.07)',
  },
  {
    id: 'midnight-slate',
    name: 'Midnight Slate',
    description: 'Cosmic obsidian & pure minimal charcoal',
    accentColor: '#94a3b8', // Slate 400
    gradientClass: 'bg-gradient-to-b from-slate-950 via-slate-900 to-black',
    ambientGlow: 'rgba(148, 163, 184, 0.05)',
  },
];
