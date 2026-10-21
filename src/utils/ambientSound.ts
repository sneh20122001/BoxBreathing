import { AmbientSoundType } from '../types/ambientAudio';
import { SessionStatus } from '../types/breathing';

/**
 * Pure decision function to determine if ambient sound should be active.
 * Nature sounds loop during active breathing sessions to create immersive focus.
 */
export function shouldPlayAmbient(
  soundType: AmbientSoundType,
  status: SessionStatus
): boolean {
  return soundType !== 'none' && status === 'running';
}

interface ActiveAmbientGraph {
  ctx: AudioContext;
  masterGain: GainNode;
  nodesToStop: Array<{ stop: (when?: number) => void }>;
  currentType: AmbientSoundType;
}

let activeGraph: ActiveAmbientGraph | null = null;
let ambientAudioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ambientAudioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AudioContextClass) {
      ambientAudioCtx = new AudioContextClass();
    }
  }
  if (ambientAudioCtx && ambientAudioCtx.state === 'suspended') {
    ambientAudioCtx.resume().catch(() => {});
  }
  return ambientAudioCtx;
}

/**
 * Generates a 4-second looping buffer of brown/pink noise.
 */
function createNoiseBuffer(ctx: AudioContext, type: 'pink' | 'brown'): AudioBuffer {
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let lastOut = 0.0;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'brown') {
        // Brown noise (integrated white noise)
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      } else {
        // Pink noise (Paul Kellet's filter method)
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
  }
  return buffer;
}

/**
 * Procedural synthesizers for nature sounds using Web Audio API:
 * - Rain: filtered pink/brown noise with soft droplet frequencies
 * - Forest: gentle brown wind breeze modulated with slow LFO
 * - Ocean: rhythmic rolling tides swelling via 0.12Hz LFO
 */
export function updateAmbientSound(
  soundType: AmbientSoundType,
  status: SessionStatus,
  targetVolume: number = 0.22
) {
  if (typeof window === 'undefined') return;

  const shouldPlay = shouldPlayAmbient(soundType, status);

  // If active graph matches current state
  if (!shouldPlay) {
    if (activeGraph) {
      const now = activeGraph.ctx.currentTime;
      activeGraph.masterGain.gain.setValueAtTime(activeGraph.masterGain.gain.value, now);
      activeGraph.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.8);
      const graphToClean = activeGraph;
      activeGraph = null;
      setTimeout(() => {
        graphToClean.nodesToStop.forEach((n) => {
          try {
            n.stop();
          } catch {}
        });
      }, 900);
    }
    return;
  }

  // If already playing this sound type, just ensure volume
  if (activeGraph && activeGraph.currentType === soundType) {
    const now = activeGraph.ctx.currentTime;
    activeGraph.masterGain.gain.setValueAtTime(activeGraph.masterGain.gain.value, now);
    activeGraph.masterGain.gain.linearRampToValueAtTime(targetVolume, now + 0.5);
    return;
  }

  // If changing sound type, stop existing
  if (activeGraph) {
    const now = activeGraph.ctx.currentTime;
    activeGraph.masterGain.gain.setValueAtTime(activeGraph.masterGain.gain.value, now);
    activeGraph.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
    const prevGraph = activeGraph;
    setTimeout(() => {
      prevGraph.nodesToStop.forEach((n) => {
        try {
          n.stop();
        } catch {}
      });
    }, 500);
    activeGraph = null;
  }

  try {
    const ctx = getContext();
    if (!ctx) return;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + 1.2);
    masterGain.connect(ctx.destination);

    const nodesToStop: Array<{ stop: (when?: number) => void }> = [];

    if (soundType === 'rain') {
      // 1. Gentle continuous rainfall bed
      const rainBuffer = createNoiseBuffer(ctx, 'pink');
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = rainBuffer;
      noiseSource.loop = true;

      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.setValueAtTime(1000, ctx.currentTime);

      noiseSource.connect(rainFilter);
      rainFilter.connect(masterGain);
      noiseSource.start();
      nodesToStop.push(noiseSource);

      // 2. High-frequency light patter
      const patterFilter = ctx.createBiquadFilter();
      patterFilter.type = 'bandpass';
      patterFilter.frequency.setValueAtTime(2400, ctx.currentTime);
      patterFilter.Q.setValueAtTime(1.5, ctx.currentTime);

      const patterGain = ctx.createGain();
      patterGain.gain.setValueAtTime(0.18, ctx.currentTime);

      noiseSource.connect(patterFilter);
      patterFilter.connect(patterGain);
      patterGain.connect(masterGain);
    } else if (soundType === 'forest') {
      // 1. Soft woodland wind breeze
      const windBuffer = createNoiseBuffer(ctx, 'brown');
      const windSource = ctx.createBufferSource();
      windSource.buffer = windBuffer;
      windSource.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'lowpass';
      windFilter.frequency.setValueAtTime(450, ctx.currentTime);

      // Slow LFO for breeze swelling
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.18, ctx.currentTime); // ~5.5s cycle

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(120, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(windFilter.frequency);

      windSource.connect(windFilter);
      windFilter.connect(masterGain);

      windSource.start();
      lfo.start();
      nodesToStop.push(windSource, lfo);
    } else if (soundType === 'ocean') {
      // 1. Low rumbling surf
      const oceanBuffer = createNoiseBuffer(ctx, 'brown');
      const oceanSource = ctx.createBufferSource();
      oceanSource.buffer = oceanBuffer;
      oceanSource.loop = true;

      const oceanFilter = ctx.createBiquadFilter();
      oceanFilter.type = 'lowpass';
      oceanFilter.frequency.setValueAtTime(650, ctx.currentTime);

      // Slow sinusoidal tidal swell (0.12 Hz = ~8.3s wave rhythm)
      const tideLfo = ctx.createOscillator();
      tideLfo.type = 'sine';
      tideLfo.frequency.setValueAtTime(0.12, ctx.currentTime);

      const waveGain = ctx.createGain();
      waveGain.gain.setValueAtTime(0.5, ctx.currentTime);

      const lfoDepth = ctx.createGain();
      lfoDepth.gain.setValueAtTime(0.4, ctx.currentTime);

      tideLfo.connect(lfoDepth);
      lfoDepth.connect(waveGain.gain);

      oceanSource.connect(oceanFilter);
      oceanFilter.connect(waveGain);
      waveGain.connect(masterGain);

      oceanSource.start();
      tideLfo.start();
      nodesToStop.push(oceanSource, tideLfo);
    }

    activeGraph = {
      ctx,
      masterGain,
      nodesToStop,
      currentType: soundType,
    };
  } catch {
    // Autoplay or audio disabled gracefully handled
  }
}
