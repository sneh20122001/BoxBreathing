/**
 * Organic meditation bell tone synthesizer using Web Audio API.
 * Synthesizes a soothing Tibetan singing bowl chime with subtle harmonic overtones.
 * Fully client-side, zero-latency, zero external network assets.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playChime(enabled: boolean, phaseType: 'inhale' | 'hold1' | 'exhale' | 'hold2' | 'complete') {
  if (!enabled || typeof window === 'undefined') return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Frequencies tailored to the phases: gentle, grounding, harmonic
    let baseFreq = 432; // A=432Hz healing pitch
    let duration = 1.4;

    if (phaseType === 'inhale') {
      baseFreq = 384; // G
    } else if (phaseType === 'hold1') {
      baseFreq = 432; // A
    } else if (phaseType === 'exhale') {
      baseFreq = 324; // E
    } else if (phaseType === 'hold2') {
      baseFreq = 288; // D
    } else if (phaseType === 'complete') {
      baseFreq = 528; // Solfeggio 528Hz completion tone
      duration = 2.4;
    }

    const now = ctx.currentTime;

    // Master gain for this chime
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Warm low-pass filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);

    // Primary fundamental tone (sine)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);

    // Subtle singing bowl overtone (frequency * 2.756)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 2.01, now);

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.03, now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);

    osc1.connect(masterGain);
    osc2.connect(overtoneGain);
    overtoneGain.connect(masterGain);
    masterGain.connect(filter);
    filter.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  } catch {
    // Gracefully ignore audio failures (e.g. autoplay policies before interaction)
  }
}
