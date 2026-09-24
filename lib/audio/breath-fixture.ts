/**
 * Deterministic synthetic room sounds for the inhale classifier: an audible
 * inhale, a fan, mains hum, and the pieces to stitch them to a sung vowel.
 *
 * Used by `breath-detect.test.ts`, which slides the live frame over these
 * signals, and by `e2e/breath-gate.mjs`, which writes the same scenes to WAV
 * and plays them into a real browser as the fake microphone. Like
 * `voice-fixture.ts` it is dependency-free and erasable TypeScript only, so
 * Node imports it straight from the e2e runner.
 *
 * An inhale here is band-limited noise with a rise and a fall, which is what a
 * breath through an open mouth is acoustically: turbulent air, no vocal-fold
 * vibration, its energy spread across roughly 1 to 8 kHz. It is a model, not a
 * recording, and the tests say so where it matters.
 */

/** Deterministic LCG in [-1, 1). A copy of voice-fixture's, kept import-free. */
function makeRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return (s / 4294967296) * 2 - 1;
  };
}

type Biquad = { b0: number; b1: number; b2: number; a1: number; a2: number };

/** RBJ cookbook low- or high-pass at Q = 1/√2. */
function biquad(kind: "lowpass" | "highpass", hz: number, sampleRate: number): Biquad {
  const w = (2 * Math.PI * hz) / sampleRate;
  const alpha = Math.sin(w) / (2 * Math.SQRT1_2);
  const cos = Math.cos(w);
  const a0 = 1 + alpha;
  const b1 = kind === "lowpass" ? (1 - cos) / a0 : -(1 + cos) / a0;
  const b0 = kind === "lowpass" ? (1 - cos) / 2 / a0 : (1 + cos) / 2 / a0;
  return { b0, b1, b2: b0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 };
}

function filterInPlace(x: Float32Array, f: Biquad): void {
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = f.b0 * x[i] + f.b1 * x1 + f.b2 * x2 - f.a1 * y1 - f.a2 * y2;
    x2 = x1;
    x1 = x[i];
    y2 = y1;
    y1 = v;
    x[i] = v;
  }
}

export function rms(x: Float32Array, from = 0, to = x.length): number {
  let sum = 0;
  for (let i = from; i < to; i++) sum += x[i] * x[i];
  return to > from ? Math.sqrt(sum / (to - from)) : 0;
}

/** Scales `x` in place so its RMS is `level`. */
export function scaleToRms(x: Float32Array, level: number): Float32Array {
  const r = rms(x);
  if (r > 0) for (let i = 0; i < x.length; i++) x[i] *= level / r;
  return x;
}

/** White noise through two high-passes at `loHz` and two low-passes at `hiHz`. */
export function bandNoise(opts: {
  sampleRate: number;
  length: number;
  loHz: number;
  hiHz: number;
  level: number;
  seed?: number;
}): Float32Array {
  const rand = makeRandom(opts.seed ?? 7);
  const out = new Float32Array(opts.length);
  for (let i = 0; i < out.length; i++) out[i] = rand();
  if (opts.loHz > 0) {
    const hp = biquad("highpass", opts.loHz, opts.sampleRate);
    filterInPlace(out, hp);
    filterInPlace(out, hp);
  }
  if (opts.hiHz < opts.sampleRate / 2) {
    const lp = biquad("lowpass", opts.hiHz, opts.sampleRate);
    filterInPlace(out, lp);
    filterInPlace(out, lp);
  }
  return scaleToRms(out, opts.level);
}

export interface InhaleSpec {
  sampleRate: number;
  /** Length of the breath itself, rise to fall. */
  durationSec: number;
  /** RMS across the plateau. */
  level: number;
  /** Rise and fall, each, as raised-cosine ramps. */
  rampSec?: number;
  loHz?: number;
  hiHz?: number;
  seed?: number;
}

/** An audible inhale: 1–8 kHz noise swelling in and dying away. */
export function inhale(spec: InhaleSpec): Float32Array {
  const { sampleRate, durationSec, level, rampSec = 0.12, loHz = 1000, hiHz = 8000 } = spec;
  const length = Math.round(durationSec * sampleRate);
  const out = bandNoise({ sampleRate, length, loHz, hiHz, level, seed: spec.seed ?? 11 });
  const ramp = Math.min(Math.round(rampSec * sampleRate), Math.floor(length / 2));
  for (let i = 0; i < ramp; i++) {
    const g = 0.5 - 0.5 * Math.cos((Math.PI * i) / ramp);
    out[i] *= g;
    out[length - 1 - i] *= g;
  }
  return out;
}

/**
 * A fan or air conditioner: steady broadband noise, rolled off above a few kHz
 * the way a motor and moving air are. `loHz` defaults to 0, so it overlaps the
 * inhale band completely — the hard case, since nothing about its spectrum
 * separates it from a breath. Only its steadiness does.
 */
export function fan(opts: {
  sampleRate: number;
  length: number;
  level: number;
  hiHz?: number;
  seed?: number;
}): Float32Array {
  return bandNoise({
    sampleRate: opts.sampleRate,
    length: opts.length,
    loHz: 0,
    hiHz: opts.hiHz ?? 5000,
    level: opts.level,
    seed: opts.seed ?? 23,
  });
}

/** Mains hum at 50 or 60 Hz with its first few harmonics, as a cheap interface picks it up. */
export function hum(opts: {
  sampleRate: number;
  length: number;
  level: number;
  hz?: 50 | 60;
}): Float32Array {
  const hz = opts.hz ?? 60;
  const amps = [1, 0.6, 0.35, 0.2, 0.1];
  const out = new Float32Array(opts.length);
  for (let i = 0; i < out.length; i++) {
    const t = i / opts.sampleRate;
    let s = 0;
    for (let h = 0; h < amps.length; h++) s += amps[h] * Math.sin(2 * Math.PI * hz * (h + 1) * t);
    out[i] = s;
  }
  return scaleToRms(out, opts.level);
}

/** `n` samples of nothing. */
export function silence(sampleRate: number, sec: number): Float32Array {
  return new Float32Array(Math.round(sampleRate * sec));
}

/** Pieces end to end. */
export function concat(...parts: Float32Array[]): Float32Array {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** Sums `b` into a copy of `a`, from sample `at`, truncated to `a`'s length. */
export function mixAt(a: Float32Array, b: Float32Array, at = 0): Float32Array {
  const out = Float32Array.from(a);
  for (let i = 0; i < b.length && at + i < out.length; i++) out[at + i] += b[i];
  return out;
}
