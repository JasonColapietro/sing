/**
 * Spectral-envelope hold: whether the vocal tract shape stayed put across a
 * sustained note.
 *
 * This module deliberately does not measure formant frequencies and does not
 * name vowels. Estimating F1 and F2 from a consumer microphone on a sung note
 * is unreliable enough that a number would often be confidently wrong, and a
 * confidently wrong number is worse than no number. What is defensible from the
 * same data is a self-relative comparison: take the shape of the spectrum that
 * the tract imposes on the voice, and ask how far that shape moved while the
 * singer held one note. If the shape held, the tract held, which is as close to
 * "the vowel stayed the same" as this signal chain can honestly get. It is not
 * a vowel identity, it cannot be compared between two singers, and it cannot be
 * compared against a target, because a microphone, a distance and a room are
 * all inside the number.
 *
 * The envelope is sampled at the harmonics rather than smoothed out of the raw
 * spectrum. A sung note is a comb of harmonics spaced f0 apart, and everything
 * between the teeth is noise floor; averaging the floor in makes the result
 * depend mostly on the pitch. Reading the level of each harmonic and
 * interpolating between them samples the tract's filter where the voice
 * actually excites it, so the same vowel sung at two pitches lands on nearly
 * the same curve.
 *
 * That is also where the method runs out. The harmonics are the only places the
 * envelope can be read, so a high voice — where the harmonics are spaced wider
 * than the formants they are meant to reveal — gives too few samples to say
 * anything. Above `MAX_ENVELOPE_F0_HZ`, a shade under D5, this module abstains
 * rather than guesses, which means sopranos through most of their upper range,
 * tenors at the top of theirs, and anyone in high head voice or whistle
 * register get no reading at all.
 * That is the intended behaviour: `confident: false` is the honest output for a
 * signal this method cannot read, and callers must render it as "no reading"
 * rather than as a low score.
 *
 * Magnitudes arrive as the dB values from `AnalyserNode.getFloatFrequencyData`,
 * the same convention as lib/audio/spectrum.ts.
 *
 * Nothing calls this module yet. It is pure, it takes frames and returns a
 * number or a refusal, and the live meters and the offline take analysis are
 * both free to feed it; what it must never be wired into is a verdict on a
 * singer, because every number it produces is a comparison of a take against
 * itself.
 */

import { hzToBin } from "@/lib/audio/spectrum";

/**
 * Frequency range the envelope is read over. The first two formants, which
 * carry most of what distinguishes one tract shape from another, live inside
 * it; below 300 Hz the reading would be the fundamental's own level rather than
 * a tract shape, and above 3500 Hz a consumer microphone's own response starts
 * to dominate.
 */
export const ENVELOPE_LO_HZ = 300;
export const ENVELOPE_HI_HZ = 3500;

/** Probe points the envelope is resampled onto, spaced evenly in log frequency. */
export const ENVELOPE_PROBES = 24;

/**
 * Harmonics that must fall inside the envelope range before a frame counts as
 * readable. Six is the point below which the interpolation stops tracking a
 * formant peak and starts cutting the corner off it: F1 and F2 are around a
 * kilohertz apart, so fewer samples than this across three kilohertz can place
 * a peak anywhere.
 */
export const MIN_HARMONICS_IN_BAND = 6;

/**
 * The pitch ceiling `MIN_HARMONICS_IN_BAND` implies, which is the highest note
 * this module will read at all. A fundamental at or above `ENVELOPE_LO_HZ` puts
 * its own first harmonic in the range, so the count inside the range is
 * `ENVELOPE_HI_HZ / f0` and the ceiling is that ceiling frequency divided by
 * the required count — near 583 Hz, a shade under D5. Exported because a lesson
 * that asks for this measurement has to say which notes it can be taken on, and
 * a screen showing no reading has to be able to explain that the note was too
 * high rather than the singing too poor.
 */
export const MAX_ENVELOPE_F0_HZ = ENVELOPE_HI_HZ / MIN_HARMONICS_IN_BAND;

/**
 * How far the pitch may wander across the window before the comparison is
 * abandoned. Two frames a semitone apart are sampling the tract at different
 * frequencies, so a difference between their envelopes is partly the pitch
 * change and partly the singer; this module will not pretend to separate them.
 * A sustained note held deliberately sits well inside this.
 */
export const MAX_F0_DRIFT_CENTS = 100;

/** Readable frames needed before a drift figure is reported at all. */
export const MIN_ENVELOPE_FRAMES = 6;

/**
 * Level below which a harmonic is treated as absent rather than quiet. The
 * analyser's own floor sits near -100 dB, so anything under this is the floor
 * being read as if it were a voice.
 */
export const ENVELOPE_FLOOR_DB = -95;

/**
 * Drift at or below this counts as the shape having held. Chosen from the
 * measured gap between the two cases the synthetic tests in
 * lib/audio/spectral-envelope.test.ts establish: one vowel resampled at
 * different pitches sits under a decibel and a half, and two genuinely
 * different vowels sit far above it. It is a threshold on a self-relative
 * quantity, so it is a reasonable default and not a calibrated constant.
 */
export const ENVELOPE_HELD_DB = 1.5;

/**
 * Drift at or above this counts as the shape having changed during the note.
 * The gap between the two thresholds is deliberate: a window landing inside it
 * is neither a clean hold nor a clear change, and a caller should say so rather
 * than round to the nearer verdict.
 */
export const ENVELOPE_CHANGED_DB = 3;

/** One frame of analyser output, with the pitch the detector found in it. */
export interface EnvelopeFrame {
  /** `AnalyserNode.getFloatFrequencyData` output, dB per bin. */
  freqDb: Float32Array;
  /** Detected fundamental, or null for a frame the detector called unvoiced. */
  f0Hz: number | null;
}

/** The tract shape of one frame, as dB offsets from its own mean. */
export interface EnvelopeShape {
  /** Probe frequencies, ascending. Identical for every shape this module makes. */
  probesHz: number[];
  /**
   * Level at each probe in dB, with the frame's mean removed. The subtraction
   * is what makes the shape independent of how loud the singer was and how
   * close to the microphone, so only the shape survives to be compared.
   */
  levelsDb: number[];
}

/** Why a window produced no reading. Each of these is a refusal, not a zero. */
export type EnvelopeAbstention =
  /** No frame carried a pitch, or every frame was at the analyser's floor. */
  | "unvoiced"
  /** The note sits above `MAX_ENVELOPE_F0_HZ`, where the harmonics are too sparse to read. */
  | "pitch-too-high"
  /** The pitch moved more than `MAX_F0_DRIFT_CENTS`, so tract and pitch cannot be separated. */
  | "pitch-not-held"
  /** Fewer than `MIN_ENVELOPE_FRAMES` readable frames in the window. */
  | "too-few-frames";

export interface EnvelopeHold {
  /**
   * RMS deviation of the per-frame shapes from their own mean shape, in dB, or
   * null whenever the method abstained. This is the whole measurement: how far
   * the spectral envelope moved away from itself during the note. It is not a
   * vowel, not a formant frequency, and not a score out of anything.
   */
  driftDb: number | null;
  /** False when `abstained` is set, in which case there is no number to show. */
  confident: boolean;
  abstained: EnvelopeAbstention | null;
  /** Frames that yielded a shape and were used in the figure. */
  framesUsed: number;
  /** Median fundamental of the used frames, for context on where the note sat. */
  medianF0Hz: number | null;
}

/** Probe frequencies, evenly spaced in log frequency across the envelope range. */
export function envelopeProbes(): number[] {
  const out: number[] = [];
  for (let i = 0; i < ENVELOPE_PROBES; i++) {
    const t = i / (ENVELOPE_PROBES - 1);
    out.push(ENVELOPE_LO_HZ * Math.pow(ENVELOPE_HI_HZ / ENVELOPE_LO_HZ, t));
  }
  return out;
}

/** Peak dB within half a harmonic spacing of `hz`, which absorbs small f0 error. */
function harmonicLevelDb(
  freqDb: Float32Array,
  sampleRate: number,
  fftSize: number,
  hz: number,
  f0Hz: number,
): number {
  const halfWindowHz = Math.max(f0Hz / 4, (2 * sampleRate) / fftSize);
  const first = Math.max(0, Math.round(hzToBin(hz - halfWindowHz, sampleRate, fftSize)));
  const last = Math.min(
    freqDb.length - 1,
    Math.round(hzToBin(hz + halfWindowHz, sampleRate, fftSize)),
  );
  let peak = -Infinity;
  for (let i = first; i <= last; i++) {
    const db = freqDb[i];
    if (Number.isFinite(db) && db > peak) peak = db;
  }
  return peak;
}

/**
 * The tract shape of one frame, or null when the frame cannot be read.
 *
 * Null is returned for an unvoiced frame, for a fundamental so high that the
 * harmonics no longer sample the formants, and for a frame whose harmonics are
 * all at the analyser's floor. Every one of those is a case where a shape could
 * be computed and would be meaningless.
 */
export function harmonicEnvelope(
  freqDb: Float32Array,
  sampleRate: number,
  fftSize: number,
  f0Hz: number | null,
): EnvelopeShape | null {
  if (f0Hz === null || !Number.isFinite(f0Hz) || f0Hz <= 0) return null;

  // Harmonics are collected one step past each end of the range so that the
  // first and last probe are interpolated between samples rather than
  // extrapolated from the nearest one.
  const samples: Array<{ hz: number; db: number }> = [];
  let inBand = 0;
  for (let n = 1; n * f0Hz <= ENVELOPE_HI_HZ + f0Hz; n++) {
    const hz = n * f0Hz;
    if (hz < ENVELOPE_LO_HZ - f0Hz) continue;
    const db = harmonicLevelDb(freqDb, sampleRate, fftSize, hz, f0Hz);
    if (!Number.isFinite(db)) continue;
    samples.push({ hz, db });
    if (hz >= ENVELOPE_LO_HZ && hz <= ENVELOPE_HI_HZ) inBand++;
  }
  if (inBand < MIN_HARMONICS_IN_BAND) return null;
  if (samples.length < 2) return null;
  if (!samples.some((s) => s.db > ENVELOPE_FLOOR_DB)) return null;

  const probesHz = envelopeProbes();
  const levelsDb = probesHz.map((hz) => {
    if (hz <= samples[0].hz) return samples[0].db;
    const last = samples[samples.length - 1];
    if (hz >= last.hz) return last.db;
    let i = 1;
    while (i < samples.length - 1 && samples[i].hz < hz) i++;
    const a = samples[i - 1];
    const b = samples[i];
    // Linear in dB against log frequency, which is the axis a formant looks
    // roughly symmetric on. The choice is a judgement rather than a result: at
    // these thresholds the tests pass either way, so nothing here pins it.
    const k = Math.log(hz / a.hz) / Math.log(b.hz / a.hz);
    return a.db + (b.db - a.db) * k;
  });

  const mean = levelsDb.reduce((s, v) => s + v, 0) / levelsDb.length;
  return { probesHz, levelsDb: levelsDb.map((v) => v - mean) };
}

/**
 * RMS difference between two shapes in dB: how far apart two tract shapes are.
 *
 * Because both shapes have had their own mean removed, a singer who simply got
 * louder or moved closer to the microphone scores zero here. A singer who
 * changed vowel does not.
 */
export function envelopeDistanceDb(a: EnvelopeShape, b: EnvelopeShape): number {
  const n = Math.min(a.levelsDb.length, b.levelsDb.length);
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const d = a.levelsDb[i] - b.levelsDb[i];
    sum += d * d;
  }
  return Math.sqrt(sum / n);
}

/**
 * How far the spectral envelope moved across a window of frames.
 *
 * The figure is the RMS deviation of the individual frame shapes from their
 * mean shape, so it answers "did the tract hold still" and nothing else. It
 * abstains rather than reporting whenever the window cannot support the
 * comparison: too high to read, too few readable frames, or a pitch that moved
 * far enough that a change in the envelope could just as well be the change in
 * where the harmonics sampled it.
 */
export function measureEnvelopeHold(
  frames: EnvelopeFrame[],
  { sampleRate, fftSize }: { sampleRate: number; fftSize: number },
): EnvelopeHold {
  const shapes: EnvelopeShape[] = [];
  const f0s: number[] = [];
  let tooHigh = 0;
  for (const frame of frames) {
    const shape = harmonicEnvelope(frame.freqDb, sampleRate, fftSize, frame.f0Hz);
    if (shape) {
      shapes.push(shape);
      f0s.push(frame.f0Hz as number);
      continue;
    }
    if (frame.f0Hz !== null && frame.f0Hz > MAX_ENVELOPE_F0_HZ) tooHigh++;
  }

  const none = (abstained: EnvelopeAbstention): EnvelopeHold => ({
    driftDb: null,
    confident: false,
    abstained,
    framesUsed: shapes.length,
    medianF0Hz: null,
  });

  if (shapes.length === 0) return none(tooHigh > 0 ? "pitch-too-high" : "unvoiced");
  // A window where most frames were too high to read is reported as the pitch
  // problem it is, even if a few low frames at the edges happened to survive.
  if (tooHigh > shapes.length) return none("pitch-too-high");
  if (shapes.length < MIN_ENVELOPE_FRAMES) return none("too-few-frames");

  const lo = Math.min(...f0s);
  const hi = Math.max(...f0s);
  if (1200 * Math.log2(hi / lo) > MAX_F0_DRIFT_CENTS) return none("pitch-not-held");

  const probes = shapes[0].levelsDb.length;
  const mean = new Array<number>(probes).fill(0);
  for (const shape of shapes) {
    for (let i = 0; i < probes; i++) mean[i] += shape.levelsDb[i] / shapes.length;
  }
  let sum = 0;
  for (const shape of shapes) {
    for (let i = 0; i < probes; i++) {
      const d = shape.levelsDb[i] - mean[i];
      sum += d * d;
    }
  }
  const driftDb = Math.sqrt(sum / (shapes.length * probes));

  const sorted = f0s.slice().sort((a, b) => a - b);
  const medianF0Hz = sorted[Math.floor(sorted.length / 2)];

  return { driftDb, confident: true, abstained: null, framesUsed: shapes.length, medianF0Hz };
}
