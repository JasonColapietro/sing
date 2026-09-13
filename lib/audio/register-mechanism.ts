/**
 * H1−H2: the amplitude difference between the first and second harmonics of a
 * voiced frame, in the analyser's own decibels.
 *
 * H1−H2 is a standard acoustic correlate of open quotient, the fraction of each
 * glottal cycle during which the vocal folds are apart. A larger value means a
 * longer open phase and a more nearly sinusoidal glottal flow, which is what
 * distinguishes the lighter laryngeal mechanism from the heavier one. That is
 * the whole of the claim. It is one number against one boundary.
 *
 * What this module does NOT do, stated here because the curriculum has asked
 * for it and must not be allowed to assume it: it does not classify chest,
 * head and falsetto. In the laryngeal-mechanism literature the pedagogical
 * "chest" and "head" voices both sit inside the heavier mechanism, M1, and
 * differ in resonance and in the balance of muscular effort rather than in the
 * open quotient this number reads. Falsetto is the lighter mechanism, M2. So a
 * single H1−H2 boundary can separate M1 from M2 and nothing else. A reading
 * saying "the heavier side of the M1/M2 boundary" is mute on whether the singer
 * is in chest or in head voice, and no amount of smoothing changes that.
 *
 * There is no native implementation to match. The `vocal-integration-spec.md`
 * claim that the iOS app "already has a single-boundary implementation" is
 * false: `guitarhub-ios` contains no spectral analysis at all — its pitch
 * estimator, `GuitarHubCore/Sources/GuitarHubCore/Audio/YINPitchEstimator.swift`,
 * is time-domain autocorrelation over vDSP, and the only vocal surface,
 * `GuitarHub/Practice/VocalRangeView.swift`, plots f0 and latches range
 * extremes. Accordingly the boundary below is chosen here, from the published
 * range rather than from a native constant, and is flagged as unvalidated.
 *
 * Magnitudes arrive as the dB values from `AnalyserNode.getFloatFrequencyData`,
 * the same convention `lib/audio/spectrum.ts` documents. H1−H2 is a difference
 * of two dB values, so it is invariant to the analyser's absolute scale and to
 * input gain, and no conversion to linear power is needed or wanted.
 *
 * The bin arithmetic is duplicated from `spectrum.ts` rather than imported on
 * purpose: this module is being written while that one is under concurrent
 * edit, and a measurement with its own two-line bin conversion is cheaper than
 * a coupling that has to be unpicked later.
 */

/**
 * Minimum number of FFT bins that must separate H1 from H2 before the pair is
 * treated as resolvable. The harmonics sit f0 apart, so this is a statement
 * about f0 against the analyser's bin spacing. Below four bins the two peaks
 * share a main lobe and their amplitudes are no longer separately readable,
 * which is an abstention rather than a small error.
 */
export const H1H2_MIN_HARMONIC_SEPARATION_BINS = 4;

/**
 * Half-width of the search window around each predicted harmonic, as a
 * fraction of that harmonic's frequency. Six percent is about a semitone, which
 * covers the f0 estimate's own error and any drift within the frame without
 * reaching the neighbouring harmonic.
 */
export const H1H2_PEAK_SEARCH_FRACTION = 0.06;

/**
 * How far a picked peak must stand above the spectrum immediately either side
 * of its search window to count as a resolved harmonic. A harmonic buried in
 * broadband noise fails this and the frame abstains, which is the behaviour we
 * want: a masked H2 produces no reading rather than a reading equal to the
 * noise floor.
 */
export const H1H2_MIN_PEAK_PROMINENCE_DB = 6;

/**
 * Absolute floor. A peak quieter than this is the analyser's own floor and not
 * a harmonic, however prominent it looks against its neighbours.
 */
export const H1H2_MIN_PEAK_LEVEL_DB = -90;

/**
 * The single boundary this module discriminates, in dB of H1−H2: below it the
 * reading sits on the heavier-mechanism side, above it on the lighter side.
 *
 * Six decibels is taken from the published spread, in which modal phonation
 * clusters low and falsetto an order of ten decibels higher, and it has not
 * been validated against any recorded Suede singer. It is exported so that a
 * later validation can move it in one place and so that tests can assert
 * against it rather than against a number copied into an assertion.
 */
export const M1_M2_BOUNDARY_DB = 6;

/**
 * Half-width of the indeterminate band centred on the boundary. A reading
 * inside it abstains instead of picking a side.
 *
 * This is the mechanism that keeps the boundary itself from flipping on
 * floating-point noise, and it is deliberately much wider than floating-point
 * error: two decibels of H1−H2 is well inside the frame-to-frame variation of a
 * steadily held note, so a reading that close to the boundary genuinely does
 * not establish a side.
 */
export const M1_M2_DEADBAND_DB = 2;

/**
 * How many consecutive confident frames must agree before a side is reported to
 * anything a singer can see. One frame is not evidence; the same convention and
 * the same count are used for range latching in the iOS app, at
 * `GuitarHub/Practice/VocalRangeView.swift:19`.
 */
export const M1_M2_FRAMES_TO_LATCH = 3;

/** Why a frame produced no H1−H2 reading. */
export type H1H2Abstention =
  /** The caller's pitch detector did not call the frame voiced. */
  | "unvoiced"
  /** No usable f0 was supplied, so there is nowhere to look for the harmonics. */
  | "no-f0"
  /** f0 is too low for this analyser window to separate H1 from H2. */
  | "f0-below-window-resolution"
  /** H2 lies at or above Nyquist, so it was never captured. */
  | "second-harmonic-above-nyquist"
  /** One of the two harmonics could not be told apart from its neighbourhood. */
  | "harmonic-not-resolved";

/** A frame in which both harmonics were resolved. */
export interface H1H2Reading {
  confident: true;
  /** Peak level found around f0, in the analyser's dB. */
  h1Db: number;
  /** Peak level found around 2·f0, in the analyser's dB. */
  h2Db: number;
  /** h1Db − h2Db. Positive means the fundamental dominates. */
  h1MinusH2Db: number;
}

/** A frame that declined to produce a number, and why. */
export interface H1H2Abstained {
  confident: false;
  reason: H1H2Abstention;
}

export type H1H2Result = H1H2Reading | H1H2Abstained;

export interface H1H2Input {
  /** One analyser frame, dB per bin, as `getFloatFrequencyData` fills it. */
  freqDb: Float32Array | number[];
  sampleRate: number;
  /** The analyser's `fftSize`, not the bin count. */
  fftSize: number;
  /** Fundamental in Hz, from the pitch detector. */
  f0Hz: number;
  /**
   * Whether the frame is voiced. Voicing is the pitch detector's decision and
   * not something a spectrum slice should re-litigate, so it is passed in; it
   * defaults to true only so that callers holding an f0 they already trust are
   * not forced to restate it.
   */
  voiced?: boolean;
}

/** Centre frequency of FFT bin `bin`. */
function binToHz(bin: number, sampleRate: number, fftSize: number): number {
  return (bin * sampleRate) / fftSize;
}

/** Fractional bin index holding `hz`. */
function hzToBin(hz: number, sampleRate: number, fftSize: number): number {
  return (hz * fftSize) / sampleRate;
}

/**
 * Highest finite dB value among bins whose centres fall in [loHz, hiHz], with
 * the bin index, or null when the range holds no finite bin.
 */
function peakIn(
  freqDb: Float32Array | number[],
  sampleRate: number,
  fftSize: number,
  loHz: number,
  hiHz: number,
): { db: number; bin: number } | null {
  const first = Math.max(0, Math.ceil(hzToBin(loHz, sampleRate, fftSize)));
  const last = Math.min(freqDb.length - 1, Math.floor(hzToBin(hiHz, sampleRate, fftSize)));
  let best: { db: number; bin: number } | null = null;
  for (let i = first; i <= last; i++) {
    const db = freqDb[i];
    if (!Number.isFinite(db)) continue;
    if (best === null || db > best.db) best = { db, bin: i };
  }
  return best;
}

/**
 * Median finite dB among bins whose centres fall in [loHz, hiHz], or null when
 * the range holds no finite bin. Median rather than mean so that one stray
 * neighbouring harmonic inside the shoulder does not raise the local floor.
 */
function medianIn(
  freqDb: Float32Array | number[],
  sampleRate: number,
  fftSize: number,
  loHz: number,
  hiHz: number,
): number | null {
  const first = Math.max(0, Math.ceil(hzToBin(loHz, sampleRate, fftSize)));
  const last = Math.min(freqDb.length - 1, Math.floor(hzToBin(hiHz, sampleRate, fftSize)));
  const vals: number[] = [];
  for (let i = first; i <= last; i++) {
    const db = freqDb[i];
    if (Number.isFinite(db)) vals.push(db);
  }
  if (vals.length === 0) return null;
  vals.sort((a, b) => a - b);
  const mid = vals.length >> 1;
  return vals.length % 2 === 1 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
}

/**
 * Level of the harmonic at `centreHz`, or null when it cannot be told apart
 * from the spectrum on either side of it.
 *
 * The shoulders are the two stretches of spectrum just outside the search
 * window, out to three times its half-width. A resolved harmonic stands proud
 * of both; a harmonic masked by noise does not stand proud of either, and one
 * whose window has been placed over a noise floor fails the absolute level
 * check instead.
 */
function harmonicLevelDb(
  freqDb: Float32Array | number[],
  sampleRate: number,
  fftSize: number,
  centreHz: number,
): number | null {
  const half = centreHz * H1H2_PEAK_SEARCH_FRACTION;
  const peak = peakIn(freqDb, sampleRate, fftSize, centreHz - half, centreHz + half);
  if (peak === null || peak.db < H1H2_MIN_PEAK_LEVEL_DB) return null;

  const below = medianIn(freqDb, sampleRate, fftSize, centreHz - 3 * half, centreHz - half);
  const above = medianIn(freqDb, sampleRate, fftSize, centreHz + half, centreHz + 3 * half);
  const shoulders = [below, above].filter((v): v is number => v !== null);
  if (shoulders.length === 0) return null;
  const floorDb = Math.max(...shoulders);
  if (peak.db - floorDb < H1H2_MIN_PEAK_PROMINENCE_DB) return null;

  return peak.db;
}

/**
 * Measure H1−H2 on one analyser frame, or abstain.
 *
 * Abstention is the point of the signature: every path that cannot produce an
 * honest difference of two resolved harmonic amplitudes returns a reason rather
 * than a number, and callers cannot read a number without first checking
 * `confident`.
 */
export function measureH1H2(input: H1H2Input): H1H2Result {
  const { freqDb, sampleRate, fftSize, f0Hz, voiced = true } = input;

  if (!voiced) return { confident: false, reason: "unvoiced" };
  if (!Number.isFinite(f0Hz) || f0Hz <= 0) return { confident: false, reason: "no-f0" };

  const binHz = binToHz(1, sampleRate, fftSize);
  if (!(binHz > 0)) return { confident: false, reason: "no-f0" };
  if (f0Hz < H1H2_MIN_HARMONIC_SEPARATION_BINS * binHz) {
    return { confident: false, reason: "f0-below-window-resolution" };
  }

  const nyquist = sampleRate / 2;
  if (2 * f0Hz * (1 + H1H2_PEAK_SEARCH_FRACTION) >= nyquist) {
    return { confident: false, reason: "second-harmonic-above-nyquist" };
  }

  const h1Db = harmonicLevelDb(freqDb, sampleRate, fftSize, f0Hz);
  const h2Db = harmonicLevelDb(freqDb, sampleRate, fftSize, 2 * f0Hz);
  if (h1Db === null || h2Db === null) {
    return { confident: false, reason: "harmonic-not-resolved" };
  }

  return { confident: true, h1Db, h2Db, h1MinusH2Db: h1Db - h2Db };
}

/**
 * Which side of the one boundary a reading falls on.
 *
 * The names say what is established and no more. `heavierSide` is the
 * modal/M1 side of the open-quotient boundary and covers both of the
 * curriculum's "chest" and "head"; `lighterSide` is the falsetto/M2 side.
 */
export type M1M2Side = "heavierSide" | "lighterSide";

/** Reason a side was not picked: any H1−H2 abstention, or the deadband. */
export type M1M2Abstention = H1H2Abstention | "within-boundary-deadband";

export interface M1M2Reading {
  confident: true;
  side: M1M2Side;
  h1MinusH2Db: number;
}

export interface M1M2Abstained {
  confident: false;
  reason: M1M2Abstention;
}

export type M1M2Result = M1M2Reading | M1M2Abstained;

/**
 * Place an H1−H2 reading on the one boundary, abstaining inside the deadband.
 *
 * A reading is only given a side when it is clear of the boundary by more than
 * the deadband, so the comparison is never made on values where it could turn
 * on the last bit of a float.
 */
export function classifyM1M2Boundary(reading: H1H2Result): M1M2Result {
  if (!reading.confident) return { confident: false, reason: reading.reason };
  const { h1MinusH2Db } = reading;
  if (h1MinusH2Db <= M1_M2_BOUNDARY_DB - M1_M2_DEADBAND_DB) {
    return { confident: true, side: "heavierSide", h1MinusH2Db };
  }
  if (h1MinusH2Db >= M1_M2_BOUNDARY_DB + M1_M2_DEADBAND_DB) {
    return { confident: true, side: "lighterSide", h1MinusH2Db };
  }
  return { confident: false, reason: "within-boundary-deadband" };
}

/**
 * The side established by a sequence of frames in time order, or null.
 *
 * Only the trailing run counts, and it must be `M1_M2_FRAMES_TO_LATCH` frames
 * of confident agreement. Any abstention or disagreement inside that run drops
 * the latch back to null rather than holding the previous answer, because
 * during a deliberate switch between mechanisms the honest report is that
 * nothing is established yet.
 */
export function latchM1M2Side(frames: readonly M1M2Result[]): M1M2Side | null {
  if (frames.length < M1_M2_FRAMES_TO_LATCH) return null;
  const run = frames.slice(frames.length - M1_M2_FRAMES_TO_LATCH);
  const first = run[0];
  if (!first.confident) return null;
  for (const frame of run) {
    if (!frame.confident || frame.side !== first.side) return null;
  }
  return first.side;
}
