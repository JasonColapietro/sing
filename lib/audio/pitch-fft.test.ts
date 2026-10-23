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
  nsdfDirectSums,
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
 * The detector must read exactly what the full NSDF scan read: the same
 * chosen lag, the same three values under the parabola, the same clarity.
 * "Exactly" here is bitwise, `toBe` on both numbers, because the iOS port
 * compares its readings to this detector frame for frame and a reading that
 * is merely close would show up there as drift.
 *
 * The detector now takes every lag's correlation from one FFT and sums a lag
 * directly only when the FFT value is too close to a Float32 rounding
 * boundary to settle the stored value. The reference below is the detector
 * as it stood when every lag was summed directly, copied verbatim. If it and
 * `detectPitch` ever disagree, the failure names the frame.
 *
 * Coverage: every third semitone from C2 to C6 (17 notes), two seeds, both
 * browser sample rates, over ten conditions (680 frames), plus every semitone
 * of the bottom octave at 0 dB and as a phone-mic bass (104 frames), plus the
 * breath-detect path (2048-sample frames at 22.05 and 24 kHz, scaled as
 * `frameClarity` scales them, 68 frames), plus the rejection fixtures from
 * pitch.test.ts (15 frames): 867 frames. Then 1,600 seeded random frames in
 * the shapes the app analyses, with missing and weak fundamentals, clicks,
 * DC, rumble, noise bursts, gaps, second tones and clipping, and a set of
 * frames whose correlation is exactly zero over a long stretch of lags, the
 * case the rounding guard exists for.
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

/** The detector when every lag was summed directly. Verbatim. */
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
  detected: PitchResult | null;
}

/** Bitwise: both null, or `toBe` on freq and clarity. */
function compare(label: string, frame: Float32Array, sampleRate: number, into: Mismatch[]): PitchResult | null {
  const fullScan = detectPitchFullScan(frame, sampleRate);
  const detected = detectPitch(frame, sampleRate);
  const same =
    (fullScan === null && detected === null) ||
    (fullScan !== null &&
      detected !== null &&
      Object.is(fullScan.freq, detected.freq) &&
      Object.is(fullScan.clarity, detected.clarity));
  if (!same) into.push({ label, fullScan, detected });
  return fullScan;
}

describe("the FFT detector reads exactly what the full scan read", () => {
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
    // detector must take the same path, not a cheaper one.
    expect(detectPitch(mainsHum(60, 0.005, 48000), 48000)).toBeNull();
  });
});

/** mulberry32: a small seeded generator, uniform on [0, 1). */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * One random frame: a harmonic tone from 60 Hz to 2 kHz (a range wider than
 * the detector reports, so rejections are covered too) with a random
 * spectrum, often a weak or missing fundamental, sometimes vibrato and noise,
 * then any mix of clicks, DC, 30 Hz rumble, a noise burst, a silent gap, a
 * second tone, a fade and clipping.
 */
function randomFrame(rand: () => number, sampleRate: number, length: number): Float32Array {
  const between = (lo: number, hi: number) => lo + rand() * (hi - lo);
  const logBetween = (lo: number, hi: number) => Math.exp(between(Math.log(lo), Math.log(hi)));
  const gauss = () => Math.sqrt(-2 * Math.log(Math.max(rand(), 1e-12))) * Math.cos(2 * Math.PI * rand());

  const f0 = logBetween(60, 2000);
  const harmonics = Array.from({ length: 1 + Math.floor(rand() * 6) }, () => rand());
  const fundamental = rand();
  if (fundamental < 0.15) harmonics[0] = 0;
  else if (fundamental < 0.45) harmonics[0] *= 0.05;
  else harmonics[0] = Math.max(harmonics[0], 0.5);
  const phases = harmonics.map(() => rand() * 2 * Math.PI);
  const vibratoHz = rand() < 0.5 ? between(4, 7) : 0;
  const vibratoCents = between(0, 60);
  const level = logBetween(0.005, 0.8);

  const out = new Float32Array(length);
  let phase = 0;
  let peak = 0;
  const raw = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    const cents = vibratoCents * Math.sin((2 * Math.PI * vibratoHz * i) / sampleRate);
    phase += (2 * Math.PI * f0 * 2 ** (cents / 1200)) / sampleRate;
    let v = 0;
    for (let h = 0; h < harmonics.length; h++) {
      if ((h + 1) * f0 < sampleRate / 2) v += harmonics[h] * Math.sin((h + 1) * phase + phases[h]);
    }
    raw[i] = v;
    peak = Math.max(peak, Math.abs(v));
  }
  const noise = rand() < 0.6 ? level * 10 ** (-between(-5, 30) / 20) : 0;
  for (let i = 0; i < length; i++) out[i] = (peak > 0 ? (raw[i] / peak) * level : 0) + noise * gauss() * 0.5;

  if (rand() < 0.2) {
    for (let c = 1 + Math.floor(rand() * 6); c > 0; c--) {
      const at = Math.floor(rand() * (length - 3));
      const a = (rand() < 0.5 ? -1 : 1) * logBetween(0.05, 1);
      out[at] += a;
      out[at + 1] += 0.6 * a;
      out[at + 2] += 0.2 * a;
    }
  }
  if (rand() < 0.15) {
    const dc = between(-0.5, 0.5);
    for (let i = 0; i < length; i++) out[i] += dc;
  }
  if (rand() < 0.15) {
    const a = logBetween(0.01, 0.5);
    const p = rand() * 2 * Math.PI;
    for (let i = 0; i < length; i++) out[i] += a * Math.sin((2 * Math.PI * 30 * i) / sampleRate + p);
  }
  if (rand() < 0.1) {
    const start = Math.floor(rand() * length);
    const end = Math.min(length, start + Math.floor(between(0.05, 0.4) * length));
    const a = logBetween(0.01, 0.5);
    for (let i = start; i < end; i++) out[i] += a * gauss();
  }
  if (rand() < 0.15) {
    const tone = f0 * logBetween(1.01, 3.2);
    const a = logBetween(0.05, 1) * level;
    const p = rand() * 2 * Math.PI;
    for (let i = 0; i < length; i++) out[i] += a * Math.sin((2 * Math.PI * tone * i) / sampleRate + p);
  }
  if (rand() < 0.15) {
    const up = rand() < 0.5;
    for (let i = 0; i < length; i++) out[i] *= 0.1 + 0.9 * (up ? i / length : 1 - i / length);
  }
  if (rand() < 0.2) {
    // A gap of exact zeros or a faint floor, at the start, the end or the middle.
    const gap = Math.floor(between(0.1, 0.6) * length);
    const floor = rand() < 0.5 ? 0 : logBetween(1e-4, 0.01);
    const where = rand();
    const start = where < 0.4 ? 0 : where < 0.7 ? length - gap : Math.floor((length - gap) / 2);
    for (let i = start; i < start + gap; i++) out[i] = floor * (2 * rand() - 1);
  }
  if (rand() < 0.1) {
    const limit = between(0.1, 0.6);
    for (let i = 0; i < length; i++) out[i] = Math.max(-limit, Math.min(limit, out[i]));
  }
  return out;
}

/**
 * A frame that is exact zeros, then a tone riding a DC ramp. The trim keeps
 * the zeros and only the first `burst` or so samples of the ramp, so in the
 * window the correlation is exactly zero at every lag past the burst. The
 * full scan sees a flat run of zeros there; an unguarded FFT sees round-off
 * near 1e-16 with peaks in it.
 */
function zeroPlateau(sampleRate: number, length: number, zeros: number, burst: number, toneHz: number): Float32Array {
  const out = new Float32Array(length);
  const ramp = burst / 0.4;
  for (let i = zeros; i < length; i++) {
    const t = i - zeros;
    out[i] = 0.5 * Math.min(1, t / ramp) + 0.03 * Math.sin((2 * Math.PI * toneHz * t) / sampleRate);
  }
  return out;
}

describe("the FFT detector on random and degenerate frames", () => {
  // 1,600 frames in eight seeded batches, so each batch stays well inside the
  // default test timeout. Batches run in order and the last test checks what
  // the corpus held.
  const BATCHES = 8;
  const PER_BATCH = 200;
  const corpus = { voiced: 0, high: 0, rejected: 0 };
  it.each(Array.from({ length: BATCHES }, (_, i) => i + 1))("seeded random frames, batch %i of 8", (batch) => {
    const rand = seeded(20261023 + batch);
    const mismatches: Mismatch[] = [];
    for (let k = 0; k < PER_BATCH; k++) {
      // 2048 and 4096 samples at 44.1 or 48 kHz, and the breath path: a
      // 4096-sample frame halved in rate.
      const shape = k % 5;
      const sampleRate = rand() < 0.5 ? 44100 : 48000;
      let frame: Float32Array;
      let rate = sampleRate;
      if (shape === 4) {
        frame = halfRate(randomFrame(rand, sampleRate, 4096));
        rate = sampleRate / 2;
      } else {
        frame = randomFrame(rand, sampleRate, shape < 2 ? 2048 : 4096);
      }
      const r = compare(`batch ${batch} frame ${k} @ ${rate}, ${frame.length} samples`, frame, rate, mismatches);
      if (r === null) corpus.rejected++;
      else if (r.clarity >= CLARITY_GATE) {
        corpus.voiced++;
        if (r.freq > 800) corpus.high++;
      }
    }
    expect(mismatches).toEqual([]);
  });

  it("the random corpus held voiced frames, high voiced frames and rejections", () => {
    const frames = BATCHES * PER_BATCH;
    expect(corpus.voiced).toBeGreaterThan(frames * 0.3);
    expect(corpus.high).toBeGreaterThan(50);
    expect(corpus.rejected).toBeGreaterThan(frames * 0.05);
  });

  it("frames whose correlation is exactly zero past a short burst", () => {
    const mismatches: Mismatch[] = [];
    for (const sampleRate of SAMPLE_RATES) {
      for (const length of [2048, 4096]) {
        for (const burst of [150, 200, 400, 650]) {
          for (const toneHz of [220, 1363]) {
            const frame = zeroPlateau(sampleRate, length, length >> 1, burst, toneHz);
            compare(`zero plateau ${burst} @ ${sampleRate}, ${length} samples, ${toneHz} Hz`, frame, sampleRate, mismatches);
          }
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it("sums a lag directly when its FFT value cannot settle the Float32", () => {
    // On a zero plateau every lag past the burst straddles zero, so each one
    // the full scan reads has to be summed directly.
    const before = nsdfDirectSums();
    detectPitch(zeroPlateau(48000, 4096, 2048, 200, 220), 48000);
    expect(nsdfDirectSums() - before).toBeGreaterThan(500);

    // On an ordinary frame almost every lag settles from the FFT value alone.
    const voice = synthVoice({ freq: midiToHz(57), sampleRate: 48000, seed: 1 });
    const start = nsdfDirectSums();
    detectPitch(voice, 48000);
    expect(nsdfDirectSums() - start).toBeLessThan(10);
  });
});
