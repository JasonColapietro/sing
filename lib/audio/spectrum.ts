/**
 * Frequency-domain helpers for the /analyze instruments.
 *
 * Everything here is pure and unit-tested. The canvases stay dumb: they ask
 * this module where a frequency lands and what colour a magnitude is, and do
 * nothing but paint the answer.
 *
 * Magnitudes arrive as the dB values from `AnalyserNode.getFloatFrequencyData`
 * (roughly -100..0), not the 0..255 byte form. Byte data is already dB-scaled
 * and log-quantised, so summing it produces a number that is neither energy nor
 * amplitude — fine for a pretty picture, useless for the band ratio the ring
 * meter reports.
 */

/** Lowest frequency the instruments plot. Below this a vocal mic is mostly room. */
export const MIN_HZ = 80;
/** Highest frequency plotted. Sibilance lives here; nothing sung does. */
export const MAX_HZ = 8000;

/**
 * The singer's formant: a cluster of energy that trained voices show around
 * 3 kHz, and the reason one can be heard over an orchestra playing louder.
 */
export const RING_LO_HZ = 2800;
export const RING_HI_HZ = 3200;

/** Centre frequency of FFT bin `bin`. */
export function binToHz(bin: number, sampleRate: number, fftSize: number): number {
  return (bin * sampleRate) / fftSize;
}

/** Fractional bin index holding `hz`. */
export function hzToBin(hz: number, sampleRate: number, fftSize: number): number {
  return (hz * fftSize) / sampleRate;
}

/**
 * Position of `hz` on a log axis running min..max, clamped to 0..1.
 *
 * Log rather than linear because pitch is logarithmic: on a linear axis every
 * note a singer can actually reach is crushed into the leftmost eighth.
 */
export function logPos(hz: number, minHz = MIN_HZ, maxHz = MAX_HZ): number {
  if (hz <= 0) return 0;
  const p = Math.log(hz / minHz) / Math.log(maxHz / minHz);
  return Math.min(1, Math.max(0, p));
}

/** Inverse of `logPos`. */
export function posToHz(pos: number, minHz = MIN_HZ, maxHz = MAX_HZ): number {
  return minHz * Math.pow(maxHz / minHz, pos);
}

/** dB (as reported by the analyser) to linear power. */
export function dbToPower(db: number): number {
  return Math.pow(10, db / 10);
}

/**
 * Summed linear power of every bin whose centre falls in [loHz, hiHz).
 *
 * Half-open so adjacent bands tile without double-counting the shared edge bin.
 */
export function bandPower(
  freqDb: Float32Array,
  sampleRate: number,
  fftSize: number,
  loHz: number,
  hiHz: number,
): number {
  const first = Math.max(0, Math.ceil(hzToBin(loHz, sampleRate, fftSize)));
  const last = Math.min(freqDb.length - 1, Math.ceil(hzToBin(hiHz, sampleRate, fftSize)) - 1);
  let sum = 0;
  for (let i = first; i <= last; i++) sum += dbToPower(freqDb[i]);
  return sum;
}

/**
 * Power in [loHz, hiHz) as a fraction of power across the whole plotted range,
 * 0..1. Returns 0 rather than NaN on silence.
 */
export function bandRatio(
  freqDb: Float32Array,
  sampleRate: number,
  fftSize: number,
  loHz: number,
  hiHz: number,
): number {
  const total = bandPower(freqDb, sampleRate, fftSize, MIN_HZ, MAX_HZ);
  if (total <= 0) return 0;
  return Math.min(1, bandPower(freqDb, sampleRate, fftSize, loHz, hiHz) / total);
}

/** Fraction of plotted power sitting in the ring band. */
export function ringRatio(
  freqDb: Float32Array,
  sampleRate: number,
  fftSize: number,
): number {
  return bandRatio(freqDb, sampleRate, fftSize, RING_LO_HZ, RING_HI_HZ);
}

/** Analyser dB to a 0..1 paint intensity, floored and ceilinged. */
export function intensity(db: number, floorDb = -90, ceilDb = -20): number {
  if (!Number.isFinite(db)) return 0;
  const t = (db - floorDb) / (ceilDb - floorDb);
  return Math.min(1, Math.max(0, t));
}

/**
 * Heat colour for a 0..1 intensity, in the app's paper-and-gold palette:
 * parchment through gold to near-black, so a loud harmonic reads as ink on
 * paper rather than as a neon streak from some other application.
 */
export function heatColor(t: number): [number, number, number] {
  const c = Math.min(1, Math.max(0, t));
  // paper -> gold -> ink, interpolated through one waypoint
  const stops: Array<[number, [number, number, number]]> = [
    [0, [255, 250, 242]],
    [0.55, [197, 150, 66]],
    [1, [32, 32, 29]],
  ];
  let i = 1;
  while (i < stops.length - 1 && c > stops[i][0]) i++;
  const [p0, a] = stops[i - 1];
  const [p1, b] = stops[i];
  const k = p1 === p0 ? 0 : (c - p0) / (p1 - p0);
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ];
}

/** Harmonic frequencies of `f0` that fall below `maxHz`, fundamental included. */
export function harmonics(f0: number, maxHz = MAX_HZ): number[] {
  if (!(f0 > 0)) return [];
  const out: number[] = [];
  for (let n = 1; n * f0 <= maxHz && n <= 64; n++) out.push(n * f0);
  return out;
}
