/**
 * Deterministic synthetic singing voice, for measuring how precisely the pitch
 * detector reads a note rather than only whether it reads one.
 *
 * Used twice: by the unit precision suite, which feeds frames straight into
 * `detectPitch`, and by `e2e/pitch-precision.mjs`, which writes the same signal
 * to a WAV and plays it into a real browser as the fake microphone. Keeping one
 * generator means a regression shows up in both places as the same numbers.
 *
 * Dependency-free and written in erasable TypeScript only, so Node can import
 * it directly from the e2e runner without a build step.
 */

export interface VoiceSpec {
  /** Fundamental in Hz before detune and vibrato. */
  freq: number;
  /** Fixed offset from `freq`, in cents. */
  detuneCents?: number;
  sampleRate?: number;
  /** Signal length in samples. */
  length?: number;
  /** Peak level of the voiced signal before noise. */
  level?: number;
  /** Vibrato rate in Hz; 0 disables it. */
  vibratoHz?: number;
  /** Vibrato half-depth in cents (±). */
  vibratoCents?: number;
  /** Cycle-to-cycle random pitch wobble, in cents (standard deviation). */
  jitterCents?: number;
  /**
   * Signal-to-noise ratio in dB for added white noise. Omit or pass Infinity
   * for a clean signal.
   */
  snrDb?: number;
  /**
   * Relative amplitudes of harmonics 1..n. The default is a bright sung vowel
   * with a strong second harmonic, which is what makes octave errors likely.
   */
  harmonics?: readonly number[];
  seed?: number;
}

export const VOWEL_HARMONICS = [1, 0.7, 0.45, 0.3, 0.2, 0.12, 0.08] as const;

/** A fundamental so weak the second harmonic dominates — the octave trap. */
export const WEAK_FUNDAMENTAL_HARMONICS = [0.25, 1, 0.5, 0.3, 0.15] as const;

/** Deterministic LCG in [-1, 1): a flaky precision test is worse than none. */
export function makeRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return (s / 4294967296) * 2 - 1;
  };
}

/** Frequency after a detune in cents. */
export function detune(freq: number, cents: number): number {
  return freq * Math.pow(2, cents / 1200);
}

/** Signed distance from `expected` to `measured`, in cents. */
export function centsBetween(measured: number, expected: number): number {
  return 1200 * Math.log2(measured / expected);
}

export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function synthVoice(spec: VoiceSpec): Float32Array {
  const {
    freq,
    detuneCents = 0,
    sampleRate = 48000,
    length = 4096,
    level = 0.2,
    vibratoHz = 0,
    vibratoCents = 0,
    jitterCents = 0,
    snrDb = Infinity,
    harmonics = VOWEL_HARMONICS,
    seed = 1,
  } = spec;
  const rand = makeRandom(seed);
  const base = detune(freq, detuneCents);
  const norm = harmonics.reduce((sum, a) => sum + Math.abs(a), 0) || 1;
  const out = new Float32Array(length);

  let phase = 0;
  let jitter = 0;
  let lastCycle = 0;
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    // Jitter is a new random offset once per glottal cycle, not per sample.
    const cycle = Math.floor(phase / (2 * Math.PI));
    if (jitterCents > 0 && cycle !== lastCycle) {
      jitter = rand() * jitterCents * Math.sqrt(3);
      lastCycle = cycle;
    }
    const vib = vibratoHz > 0 ? vibratoCents * Math.sin(2 * Math.PI * vibratoHz * t) : 0;
    const f = detune(base, vib + jitter);
    phase += (2 * Math.PI * f) / sampleRate;
    let s = 0;
    for (let h = 0; h < harmonics.length; h++) {
      if (base * (h + 1) >= sampleRate / 2) break;
      s += harmonics[h] * Math.sin((h + 1) * phase);
    }
    out[i] = (s / norm) * level;
  }

  if (Number.isFinite(snrDb)) {
    let power = 0;
    for (let i = 0; i < length; i++) power += out[i] * out[i];
    power /= length;
    // Uniform noise in [-a, a) has power a²/3.
    const amp = Math.sqrt((3 * power) / Math.pow(10, snrDb / 10));
    for (let i = 0; i < length; i++) out[i] += rand() * amp;
  }
  return out;
}

/**
 * The pitch a detector should report for samples `[from, to)`: the mean of the
 * voice's pitch in cents across that window, ignoring jitter.
 *
 * Not the pitch at the window's centre. A 4096-sample frame spans 85 ms, about
 * half a vibrato cycle, and a period-based detector reports what the whole
 * frame averages to; scoring it against the centre sample charged it ~16 cents
 * of error for measuring correctly.
 */
export function expectedHz(spec: VoiceSpec, from = 0, to = spec.length ?? 4096): number {
  const sampleRate = spec.sampleRate ?? 48000;
  const rate = spec.vibratoHz ?? 0;
  const depth = spec.vibratoCents ?? 0;
  let vib = 0;
  if (rate > 0 && depth !== 0 && to > from) {
    for (let i = from; i < to; i++) {
      vib += depth * Math.sin((2 * Math.PI * rate * i) / sampleRate);
    }
    vib /= to - from;
  }
  return detune(spec.freq, (spec.detuneCents ?? 0) + vib);
}

/** 16-bit mono PCM WAV, for Chrome's `--use-file-for-fake-audio-capture`. */
export function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const bytes = new Uint8Array(44 + samples.length * 2);
  const view = new DataView(bytes.buffer);
  const ascii = (at: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(at + i, text.charCodeAt(i));
  };
  ascii(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, Math.round(v * 32767), true);
  }
  return bytes;
}
