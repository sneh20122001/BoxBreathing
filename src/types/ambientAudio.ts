export type AmbientSoundType = 'none' | 'rain' | 'forest' | 'ocean';

export interface AmbientPreset {
  id: AmbientSoundType;
  name: string;
  description: string;
  icon: 'none' | 'rain' | 'forest' | 'ocean';
}

export const AMBIENT_PRESETS: AmbientPreset[] = [
  {
    id: 'none',
    name: 'Ambient: Off',
    description: 'No background nature audio',
    icon: 'none',
  },
  {
    id: 'rain',
    name: 'Gentle Rain',
    description: 'Soothing rainfall and soft droplets',
    icon: 'rain',
  },
  {
    id: 'forest',
    name: 'Forest Breeze',
    description: 'Whispering pine trees & woodland air',
    icon: 'forest',
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    description: 'Rhythmic ocean surf and rolling tides',
    icon: 'ocean',
  },
];
