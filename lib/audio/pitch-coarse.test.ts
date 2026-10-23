import { describe, expect, it } from "vitest";
import {
  detectPitch,
  LOWPASS_HZ,
  MAX_FREQ,
  MIN_FREQ,
  MIN_WINDOW_SAMPLES,
  PEAK_TOLERANCE,
  SILENCE_RMS,
  SUBRANGE_FLOOR_HZ,
  SUBRANGE_MARGIN,
  SUBRANGE_MIN_CLARITY,
  SUBRANGE_SEARCH_RATIO,
  TRIM_THRESHOLD,
  type PitchResult,
} from "./pitch";
import {
  makeRandom,
  midiToHz,
  synthVoice,
  WEAK_FUNDAMENTAL_HARMONICS,
  type VoiceSpec,
} from "./voice-fixture";

/**
 * The two-stage detector must read exactly what the full NSDF scan read: the
 * same chosen lag, the same three values under the parabola, the same
 * clarity. "Exactly" here is bitwise, `toBe` on both numbers, because the iOS
 * port compares its readings to this detector frame for frame and a reading
 * that is merely close would show up there as drift.
 *
 * The reference below is the detector as it stood before the coarse search
 * was added, copied verbatim. If it and `detectPitch` ever disagree, the
 * failure names the frame.
 *
 * Coverage: every third semitone from C2 to C6 (17 notes), two seeds, both
 * browser sample rates, over ten conditions (680 frames), plus every semitone
 * of the bottom octave at 0 dB (where the full scan's choice is a noise bump
 * on a shoulder, the case a fixed window missed in development) and as a
 * phone-mic bass (104 frames), plus the breath-detect path (2048-sample
 * frames at 22.05 and 24 kHz, scaled as `frameClarity` scales them, 68
 * frames), plus the rejection fixtures from pitch.test.ts (15 frames). 867
 * frames in all, about 5 s.
 */

// reference-begin
function lowpass(x: Float32Array, sampleRate: number, cornerHz: number): Float32Array {
  const w = (2 * Math.PI * cornerHz) / sampleRate;
  const alpha = Math.sin(w) / (2 * Math.SQRT1_2);
  const cos = Math.cos(w);
  const a0 = 1 + alpha;
  const b0 = (1 - cos) / 2 / a0;
  const b1 = (1 - cos) / a0;
  const a1 = (-2 * cos) / a0;
  const a2 = (1 - alpha) / a0;
  const y = new Float32Array(x.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = b0 * x[i] + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x[i];
    y2 = y1;
    y1 = v;
    y[i] = v;
  }
  return y;
}

/** The detector before the coarse search: every lag scanned. Verbatim. */
function detectPitchFullScan(
  input: Float32Array,
  sampleRate: number,
): PitchResult | null {
  const SIZE = input.length;
  // The silence floor is judged on the raw frame, so filtering never changes
  // which frames count as quiet.
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += input[i] * input[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < SILENCE_RMS) return null;
  const buf =
    sampleRate > 2 * LOWPASS_HZ ? lowpass(input, sampleRate, LOWPASS_HZ) : input;

  // Trim leading/trailing low-energy samples so the correlation focuses on
  // the voiced middle of the frame.
  let r1 = 0;
  let r2 = SIZE - 1;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < TRIM_THRESHOLD) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < TRIM_THRESHOLD) {
      r2 = SIZE - i;
      break;
    }
  }
  const size = r2 - r1;
  if (size < MIN_WINDOW_SAMPLES) return null;

  // Cumulative energy, so each lag's overlap energy is two lookups rather than
  // its own inner loop: `energy[k]` is the sum of squares of the first k
  // samples of the trimmed window.
  const energy = new Float32Array(size + 1);
  for (let i = 0; i < size; i++) {
    const x = buf[r1 + i];
    energy[i + 1] = energy[i] + x * x;
  }
  const total = energy[size];
  if (total <= 0) return null;

  // Only lags that correspond to a singable pitch are candidates. Searching
  // every lag and rejecting the answer afterwards throws the whole frame away
  // whenever noise wins the peak at some implausible lag, which is what a
  // normal room, or the browser's own capture and resampling path, reliably
  // produces. The note is audible and on pitch; the detector was just looking
  // outside the range it was going to accept anyway.
  const minLag = Math.max(1, Math.floor(sampleRate / MAX_FREQ));
  const maxLag = Math.min(size - 1, Math.ceil(sampleRate / MIN_FREQ));
  const analysisMaxLag = Math.min(
    size - 1,
    Math.ceil(sampleRate / SUBRANGE_FLOOR_HZ),
  );
  if (maxLag <= minLag) return null;

  // The normalized square difference function over the candidate lags. It is
  // extended lazily below C2 only around an integer multiple that could expose
  // a hidden hum fundamental; a full extra scan would be needless per-frame
  // work for ordinary singing.
  const n = new Float32Array(analysisMaxLag + 2);
  const computed = new Uint8Array(analysisMaxLag + 2);
  const computeLag = (lag: number) => {
    if (lag < minLag || lag > analysisMaxLag + 1 || lag >= size) return;
    if (computed[lag]) return;
    let sum = 0;
    for (let j = 0; j < size - lag; j++) {
      sum += buf[r1 + j] * buf[r1 + j + lag];
    }
    // Energy under the two halves the lag actually overlaps.
    const m = energy[size - lag] + (total - energy[lag]);
    n[lag] = m > 0 ? (2 * sum) / m : 0;
    computed[lag] = 1;
  };
  for (let lag = minLag; lag <= maxLag + 1 && lag < size; lag++) {
    computeLag(lag);
  }

  // Walk off the correlation's initial descent from lag 0 so the trivial peak
  // at zero lag can't win, but never search below the shortest singable period.
  let d = minLag;
  while (d < maxLag && n[d] > n[d + 1]) d++;
  const from = Math.max(d, minLag);
  if (from >= maxLag) return null;

  // Every local maximum in range, and the best value among them. The first
  // peak within PEAK_TOLERANCE of the best is the answer: it is the shortest
  // period that explains the signal, which is the fundamental rather than one
  // of the octaves below it that score just as well.
  let best = -Infinity;
  for (let i = from + 1; i < maxLag; i++) {
    if (n[i] > n[i - 1] && n[i] >= n[i + 1] && n[i] > best) best = n[i];
  }
  if (best === -Infinity) return null;

  const cutoff = best * PEAK_TOLERANCE;
  let maxpos = -1;
  for (let i = from + 1; i < maxLag; i++) {
    if (n[i] > n[i - 1] && n[i] >= n[i + 1] && n[i] >= cutoff) {
      maxpos = i;
      break;
    }
  }
  if (maxpos <= 0) return null;

  // A periodic electrical source often has a weak 50/60 Hz fundamental and a
  // much louder 100/120 Hz rectifier harmonic. If a clean integer-multiple
  // peak below C2 is materially stronger than the reportable candidate, use
  // that as the period; the range check below will then reject the frame. An
  // equally good sub-octave peak is deliberately ignored so low sung notes do
  // not disappear merely because their waveform repeats across two periods.
  const initialPeak = n[maxpos];
  for (let multiple = 2; multiple <= 4; multiple++) {
    const expectedLag = maxpos * multiple;
    if (expectedLag > analysisMaxLag) break;
    if (expectedLag <= maxLag) continue;

    const searchRadius = Math.max(
      2,
      Math.ceil(expectedLag * SUBRANGE_SEARCH_RATIO),
    );
    const localFrom = Math.max(maxLag + 1, expectedLag - searchRadius);
    const localTo = Math.min(analysisMaxLag, expectedLag + searchRadius);
    let localLag = localFrom;
    for (let lag = localFrom; lag <= localTo; lag++) {
      computeLag(lag);
      if (n[lag] > n[localLag]) localLag = lag;
    }
    if (
      n[localLag] >= SUBRANGE_MIN_CLARITY &&
      n[localLag] > initialPeak + SUBRANGE_MARGIN
    ) {
      maxpos = localLag;
      break;
    }
  }

  let T0 = maxpos;
  // Parabolic interpolation around the peak for sub-sample precision.
  computeLag(T0 - 1);
  computeLag(T0 + 1);
  const x1 = n[T0 - 1];
  const x2 = n[T0];
  const x3 = n[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  const freq = sampleRate / T0;
  // Parabolic interpolation can nudge the period just past the search bounds.
  if (freq < MIN_FREQ || freq > MAX_FREQ) return null;

  return { freq, clarity: Math.max(0, Math.min(1, n[maxpos])) };
}
// reference-end

/** Every third semitone, C2 to C6. */
const MIDIS = Array.from({ length: 17 }, (_, i) => 36 + 3 * i);
/** The bottom octave, every semitone. */
const LOW_MIDIS = Array.from({ length: 13 }, (_, i) => 36 + i);
const SAMPLE_RATES = [44100, 48000] as const;
const SEEDS = [1, 2] as const;
const CLARITY_GATE = 0.75;

/** A phone's high-pass on a low voice: the fundamental 20 dB under H2. */
const PHONE_BASS_HARMONICS = [0.1, 1, 0.6, 0.35, 0.2];

function addClicks(frame: Float32Array, seed: number): Float32Array {
  const rand = makeRandom(seed * 7919);
  const out = Float32Array.from(frame);
  for (let c = 0; c < 4; c++) {
    const pos = Math.floor(((rand() + 1) / 2) * (out.length - 3));
    const sign = rand() < 0 ? -1 : 1;
    out[pos] += sign * 0.4;
    out[pos + 1] += sign * 0.24;
    out[pos + 2] += sign * 0.08;
  }
  return out;
}

function crescendo(frame: Float32Array): Float32Array {
  const out = Float32Array.from(frame);
  for (let i = 0; i < out.length; i++) out[i] *= 0.15 + (0.85 * i) / out.length;
  return out;
}

/** What `breathFeatures` hands the detector: sample pairs summed, scaled to 0.05 RMS. */
function halfRate(frame: Float32Array): Float32Array {
  let sum = 0;
  for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
  const k = 0.05 / Math.sqrt(sum / frame.length);
  const half = new Float32Array(frame.length >> 1);
  for (let i = 0; i < half.length; i++) half[i] = (frame[2 * i] + frame[2 * i + 1]) * k;
  return half;
}

interface Condition {
  name: string;
  midis?: readonly number[];
  spec: (freq: number, sampleRate: number, seed: number) => VoiceSpec;
  post?: (frame: Float32Array, seed: number) => Float32Array;
}

const CONDITIONS: Condition[] = [
  { name: "clean", spec: (freq, sampleRate, seed) => ({ freq, sampleRate, seed }) },
  {
    name: "weak fundamental",
    spec: (freq, sampleRate, seed) => ({ freq, sampleRate, seed, harmonics: WEAK_FUNDAMENTAL_HARMONICS }),
  },
  { name: "10 c jitter", spec: (freq, sampleRate, seed) => ({ freq, sampleRate, seed, jitterCents: 10 }) },
  {
    name: "vibrato",
    spec: (freq, sampleRate, seed) => ({ freq, sampleRate, seed, vibratoHz: 5.5, vibratoCents: 50 }),
  },
  { name: "20 dB SNR", spec: (freq, sampleRate, seed) => ({ freq, sampleRate, seed, snrDb: 20 }) },
  { name: "10 dB SNR", spec: (freq, sampleRate, seed) => ({ freq, sampleRate, seed, snrDb: 10 }) },
  { name: "5 dB SNR", spec: (freq, sampleRate, seed) => ({ freq, sampleRate, seed, snrDb: 5 }) },
  { name: "0 dB SNR", spec: (freq, sampleRate, seed) => ({ freq, sampleRate, seed, snrDb: 0 }) },
  {
    name: "0 dB SNR, bottom octave",
    midis: LOW_MIDIS,
    spec: (freq, sampleRate, seed) => ({ freq, sampleRate, seed, snrDb: 0 }),
  },
  {
    name: "phone-mic bass",
    midis: LOW_MIDIS,
    spec: (freq, sampleRate, seed) => ({ freq, sampleRate, seed, harmonics: PHONE_BASS_HARMONICS }),
  },
  { name: "clicks", spec: (freq, sampleRate, seed) => ({ freq, sampleRate, seed }), post: addClicks },
  { name: "crescendo", spec: (freq, sampleRate, seed) => ({ freq, sampleRate, seed }), post: crescendo },
];

interface Mismatch {
  label: string;
  fullScan: PitchResult | null;
  twoStage: PitchResult | null;
}

/** Bitwise: both null, or `toBe` on freq and clarity. */
function compare(label: string, frame: Float32Array, sampleRate: number, into: Mismatch[]): PitchResult | null {
  const fullScan = detectPitchFullScan(frame, sampleRate);
  const twoStage = detectPitch(frame, sampleRate);
  const same =
    (fullScan === null && twoStage === null) ||
    (fullScan !== null &&
      twoStage !== null &&
      Object.is(fullScan.freq, twoStage.freq) &&
      Object.is(fullScan.clarity, twoStage.clarity));
  if (!same) into.push({ label, fullScan, twoStage });
  return fullScan;
}

describe("the two-stage detector reads exactly what the full scan read", () => {
  it.each(CONDITIONS)("$name, 4096 samples at 44.1 and 48 kHz", (condition) => {
    const mismatches: Mismatch[] = [];
    let frames = 0;
    let voiced = 0;
    for (const midi of condition.midis ?? MIDIS) {
      for (const sampleRate of SAMPLE_RATES) {
        for (const seed of SEEDS) {
          let frame = synthVoice(condition.spec(midiToHz(midi), sampleRate, seed));
          if (condition.post) frame = condition.post(frame, seed);
          const r = compare(`${condition.name} midi ${midi} @ ${sampleRate} seed ${seed}`, frame, sampleRate, mismatches);
          frames++;
          if (r && r.clarity >= CLARITY_GATE) voiced++;
        }
      }
    }
    expect(mismatches).toEqual([]);
    expect(frames).toBe((condition.midis ?? MIDIS).length * SAMPLE_RATES.length * SEEDS.length);
    // The comparison must not pass because nothing was voiced.
    expect(voiced).toBeGreaterThan(frames * 0.9);
  });

  it("the breath-detect path: 2048-sample frames at 22.05 and 24 kHz", () => {
    const mismatches: Mismatch[] = [];
    let frames = 0;
    let voiced = 0;
    for (const snrDb of [Infinity, 10]) {
      for (const midi of MIDIS) {
        for (const sampleRate of SAMPLE_RATES) {
          const frame = halfRate(synthVoice({ freq: midiToHz(midi), sampleRate, seed: 1, snrDb }));
          const r = compare(`half-rate ${snrDb} dB midi ${midi} @ ${sampleRate / 2}`, frame, sampleRate / 2, mismatches);
          frames++;
          if (r && r.clarity >= CLARITY_GATE) voiced++;
        }
      }
    }
    expect(mismatches).toEqual([]);
    expect(frames).toBe(2 * MIDIS.length * SAMPLE_RATES.length);
    expect(voiced).toBeGreaterThan(frames * 0.9);
  });

  it("the rejection fixtures: room tone, mains hum, noise, a noisy voice", () => {
    const mismatches: Mismatch[] = [];
    const lcg = (seed: number) => {
      let s = seed;
      return () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return (s / 4294967296) * 2 - 1;
      };
    };
    const voiceFrame = (freq: number, level: number, noise: number, sampleRate: number, size: number, seed = 1) => {
      const rand = lcg(seed);
      const out = new Float32Array(size);
      let phase = 0;
      for (let i = 0; i < size; i++) {
        phase += (2 * Math.PI * freq) / sampleRate;
        out[i] = (Math.sin(phase) + 0.4 * Math.sin(2 * phase) + 0.22 * Math.sin(3 * phase)) * level + rand() * noise;
      }
      return out;
    };
    const mainsHum = (fundamentalHz: number, noise: number, sampleRate: number) => {
      const random = lcg(1);
      return Float32Array.from({ length: 4096 }, (_, index) => {
        const phase = (2 * Math.PI * fundamentalHz * index) / sampleRate;
        return (
          0.02 * (0.1 * Math.sin(phase) + 0.7 * Math.sin(2 * phase) + 0.25 * Math.sin(4 * phase) + 0.08 * Math.sin(6 * phase)) +
          noise * random()
        );
      });
    };
    const roomTone = Float32Array.from({ length: 4096 }, (_, index) => 0.01 * Math.sin((2 * Math.PI * 220 * index) / 44100));
    compare("room tone", roomTone, 44100, mismatches);
    for (const hz of [50, 60]) {
      compare(`${hz} Hz hum`, mainsHum(hz, 0, 44100), 44100, mismatches);
      for (const sampleRate of SAMPLE_RATES) {
        compare(`${hz} Hz hum with noise @ ${sampleRate}`, mainsHum(hz, 0.005, sampleRate), sampleRate, mismatches);
      }
    }
    compare("noise only", voiceFrame(220, 0, 0.05, 44100, 2048), 44100, mismatches);
    for (let seed = 1; seed <= 5; seed++) {
      compare(`noisy A3 seed ${seed}`, voiceFrame(220, 0.03, 0.02, 44100, 2048, seed), 44100, mismatches);
    }
    for (const sampleRate of SAMPLE_RATES) {
      compare(`noisy E2 @ ${sampleRate}`, voiceFrame(82.41, 0.02, 0.005, sampleRate, 4096), sampleRate, mismatches);
    }
    expect(mismatches).toEqual([]);
    // The full scan rejects hum by reading its sub-range fundamental; the
    // two-stage detector must take the same path, not a cheaper one.
    expect(detectPitch(mainsHum(60, 0.005, 48000), 48000)).toBeNull();
  });
});
