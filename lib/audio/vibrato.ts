import {
  type F0Frame,
  centsBetween,
  frameIntervalSec,
  isVoiced,
} from "@/lib/audio/f0-trace";
import { summarizeVoicedRuns } from "@/lib/audio/voiced-run";

/**
 * Vibrato rate and extent from the fundamental-frequency contour.
 *
 * Vibrato is a periodic modulation of pitch. Two numbers describe it and they
 * are independent: the rate, in hertz, is how many times a second the pitch
 * goes up and back down, and the extent is how far it travels, as a musical
 * interval. A fast narrow vibrato and a slow wide one are both vibrato and
 * neither number implies the other, so they are reported separately and never
 * combined into a single score.
 *
 * Onset is the third thing, and keeping it out of the first two is most of the
 * care in this file. A singer landing on a note overshoots and settles, which
 * in the contour looks like one large slow excursion at the start of the run.
 * Counted as vibrato it inflates extent and drags rate toward the bottom of the
 * band, so a straight tone sung with an ordinary scooped entry would be
 * reported as having vibrato. The analysis therefore skips the first
 * `VIBRATO_ONSET_SKIP_SEC` of the run outright and reports the excursion inside
 * that window as its own number, `onsetSettleCents`, which is an onset
 * measurement and is not part of the extent.
 *
 * The method, in order. The contour is expressed in cents against the run's own
 * geometric mean, because the same wobble is twice as many hertz an octave up
 * and a singer comparing two notes would read that as vibrato having widened. A
 * centred moving average is subtracted to remove the slide: a window one
 * vibrato period long averages a full cycle of the modulation to zero, so what
 * the subtraction leaves behind is the modulation and what it removes is the
 * drift the singer was modulating around. Since the period is what is being
 * looked for, this is done twice — once with a window in the middle of the
 * plausible band to get a first rate, then again with a window of exactly that
 * period, which is the pass the reported numbers come from. Rate is the
 * strongest peak of the normalized autocorrelation of the detrended contour
 * within the band, interpolated parabolically, exactly as lib/audio/pitch.ts
 * finds a period. Extent is the median over one-period windows of the distance
 * from the highest to the lowest point inside that window, which is the
 * peak-to-peak excursion of one cycle.
 *
 * What the numbers establish: that the voiced contour of this run carried a
 * periodic modulation at the reported rate, of the reported width, after its
 * onset and its drift were removed, to the precision a 60 frame per second
 * contour allows — at the top of the band a cycle is only eight frames, so the
 * highest and lowest points of it are sampled rather than seen and the extent
 * can under-read a real excursion by a few percent. What they do not establish:
 * that the modulation came from the larynx. A tremulous microphone stand, an
 * unsteady
 * breath, or an amplitude wobble the detector reads as pitch would all measure
 * as vibrato here, and nothing distinguishes healthy vibrato from a wobble
 * caused by strain — that is the strain measurement, which does not exist.
 */

/**
 * The band a pitch modulation has to fall inside to be called vibrato, in
 * hertz. Singing vibrato is conventionally 4 to 7 Hz; the band is opened a
 * little at both ends so a real 4 Hz vibrato is not thrown away for landing
 * just outside, while still excluding a slow drift below and a jittery contour
 * above.
 */
export const VIBRATO_MIN_RATE_HZ = 3.5;
export const VIBRATO_MAX_RATE_HZ = 9;

/**
 * Seconds at the start of a voiced run that are excluded from the analysis
 * because they belong to the onset rather than to the note.
 *
 * A quarter of a second covers the scoop, overshoot and settle of an ordinary
 * sung entry at any tempo this app asks for, and costs roughly one vibrato
 * cycle of analysis length out of the second and a half the gate below demands
 * anyway.
 */
export const VIBRATO_ONSET_SKIP_SEC = 0.25;

/**
 * The shortest detrended stretch from which a rate may be reported, in seconds.
 *
 * The autocorrelation needs several cycles before its peak means anything, and
 * at the bottom of the band a cycle is 0.29 s. One second is between three and
 * nine cycles depending on rate, which is the least that distinguishes vibrato
 * from a single wobble.
 */
export const VIBRATO_MIN_ANALYSIS_SEC = 1;

/**
 * The narrowest peak-to-peak excursion reported as vibrato, in cents.
 *
 * Ordinary pitch jitter on a held note runs to a few cents and the detector's
 * own frame-to-frame noise adds more. Twenty cents peak-to-peak is a fifth of a
 * semitone and audible as movement; below it, calling the contour vibrato would
 * mean every straight tone in the app has some.
 */
export const VIBRATO_MIN_EXTENT_CENTS = 20;

/**
 * How periodic the detrended contour has to be, as a normalized
 * autocorrelation peak from 0 to 1.
 *
 * A clean sinusoid scores close to 1 and a random contour scores near 0. The
 * gate is what keeps a sustained note with an uneven wobble from being reported
 * as vibrato at whatever rate happened to win the peak; sung vibrato is not a
 * perfect sinusoid, so it is set well below 1.
 */
export const VIBRATO_MIN_PERIODICITY = 0.6;

/**
 * Frames per cycle the trace has to supply across the whole band before any
 * rate is reported.
 *
 * A modulation sampled four times a cycle is the least from which a period can
 * be read and its excursion approached; three is already closer to the alias
 * than to the signal. The whole band has to be supported rather than just the
 * part a particular take happens to sit in, because a contour sampled too
 * coarsely to see 9 Hz cannot be used to rule out that the modulation was up
 * there — the autocorrelation would find its strongest peak inside whatever
 * band it was given and report a rate that is an artefact of the limit. At
 * `VIBRATO_MAX_RATE_HZ` this asks for 36 frames a second, which the live loop
 * supplies at roughly 60 and the offline take pass, hopping 2048 samples, does
 * not.
 */
export const VIBRATO_MIN_FRAMES_PER_CYCLE = 4;

/** The detrend window used on the first pass, before a rate is known. */
const FIRST_PASS_DETREND_SEC = 1 / 5.5;

export interface VibratoAnalysis {
  /** True only when every gate below was met. */
  present: boolean;
  /** Modulations per second, or null when no vibrato was found. */
  rateHz: number | null;
  /**
   * Peak-to-peak width of one cycle in cents — the full distance from the
   * bottom of the excursion to the top, not the deviation either side of
   * centre. A vibrato described elsewhere as "±50 cents" is 100 here.
   */
  extentCents: number | null;
  /** Normalized autocorrelation peak of the detrended contour, 0 to 1. */
  periodicity: number;
  /** Seconds of contour the rate and extent were measured over. */
  analyzedSec: number;
  /** Where in the trace that stretch began. */
  startSec: number | null;
  /** Seconds dropped from the front of the run as onset. */
  onsetSkippedSec: number;
  /**
   * Peak-to-peak excursion inside the skipped onset window, in cents. This is
   * an onset measurement: a large value means the entry scooped or overshot,
   * and it is deliberately not folded into `extentCents`.
   */
  onsetSettleCents: number | null;
  /**
   * The fastest rate this trace's frame rate can carry, in hertz. Below
   * `VIBRATO_MAX_RATE_HZ` it means the trace was too coarse and no rate was
   * reported at all.
   */
  maxReportableRateHz: number;
  /** Why no vibrato is reported, for a surface that wants to say so. */
  reason:
    | null
    | "no-voiced-run"
    | "frame-rate-too-low"
    | "too-short"
    | "no-periodic-peak"
    | "rate-out-of-band"
    | "too-narrow"
    | "not-periodic";
}

export interface VibratoOptions {
  onsetSkipSec?: number;
  minAnalysisSec?: number;
  minExtentCents?: number;
  minPeriodicity?: number;
  minRateHz?: number;
  maxRateHz?: number;
}

function absent(
  reason: NonNullable<VibratoAnalysis["reason"]>,
  partial: Partial<VibratoAnalysis> = {},
): VibratoAnalysis {
  return {
    present: false,
    rateHz: null,
    extentCents: null,
    periodicity: 0,
    analyzedSec: 0,
    startSec: null,
    onsetSkippedSec: 0,
    onsetSettleCents: null,
    maxReportableRateHz: 0,
    reason,
    ...partial,
  };
}

/**
 * Subtract a centred moving average exactly `windowFrames` long, where the
 * window length is a real number of frames rather than a whole one.
 *
 * The exactness earns its keep. A moving average whose length is one full
 * vibrato period averages the modulation to nothing and so removes only the
 * drift, but a period is 8.2 frames at the top of the band and rounding the
 * window to 9 leaves a tenth of the modulation behind in the trend, which the
 * subtraction then adds to the residual and the extent over-reads by that much.
 * Each frame is treated as covering the half-frame either side of its
 * timestamp and weighted by how much of it the window overlaps, which gives a
 * window of the requested length whatever the fraction.
 *
 * Only indices with a complete window are returned. An edge frame averaged over
 * a partial window keeps some of the modulation in its own trend, and that
 * shrinks the excursion exactly where an array is most tempting to read off.
 */
function detrend(
  values: number[],
  windowFrames: number,
): { residual: number[]; offset: number } {
  const half = Math.max(1, windowFrames) / 2;
  const reach = Math.ceil(half - 0.5);
  if (values.length <= 2 * reach + 1) return { residual: [], offset: 0 };

  const weights: number[] = [];
  let totalWeight = 0;
  for (let k = -reach; k <= reach; k++) {
    const overlap =
      Math.min(k + 0.5, half) - Math.max(k - 0.5, -half);
    const weight = Math.max(0, overlap);
    weights.push(weight);
    totalWeight += weight;
  }

  const residual: number[] = [];
  for (let centre = reach; centre < values.length - reach; centre++) {
    let sum = 0;
    for (let k = -reach; k <= reach; k++) {
      sum += weights[k + reach] * values[centre + k];
    }
    residual.push(values[centre] - sum / totalWeight);
  }
  return { residual, offset: reach };
}

/**
 * The strongest normalized autocorrelation peak within the vibrato band, with
 * the lag interpolated parabolically for a rate that is not quantized to the
 * frame grid.
 */
function estimateRate(
  residual: number[],
  frameSec: number,
  minRateHz: number,
  maxRateHz: number,
): { rateHz: number; periodicity: number } | null {
  const minLag = Math.max(1, Math.round(1 / (maxRateHz * frameSec)));
  const maxLag = Math.floor(1 / (minRateHz * frameSec));
  if (maxLag <= minLag || residual.length < maxLag + minLag) return null;

  const r = new Float64Array(maxLag + 2);
  for (let lag = minLag - 1; lag <= maxLag + 1 && lag < residual.length; lag++) {
    if (lag < 1) continue;
    let sum = 0;
    let a = 0;
    let b = 0;
    for (let i = 0; i + lag < residual.length; i++) {
      sum += residual[i] * residual[i + lag];
      a += residual[i] * residual[i];
      b += residual[i + lag] * residual[i + lag];
    }
    const norm = Math.sqrt(a * b);
    r[lag] = norm > 0 ? sum / norm : 0;
  }

  let peak = -1;
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (r[lag] > (peak < 0 ? -Infinity : r[peak])) peak = lag;
  }
  if (peak < 0 || r[peak] <= 0) return null;

  let lag = peak;
  const x1 = r[peak - 1] ?? r[peak];
  const x2 = r[peak];
  const x3 = r[peak + 1] ?? r[peak];
  const curvature = (x1 + x3 - 2 * x2) / 2;
  if (curvature) lag = peak - (x3 - x1) / (4 * curvature);
  if (!(lag > 0)) return null;

  return { rateHz: 1 / (lag * frameSec), periodicity: Math.min(1, r[peak]) };
}

/**
 * Median peak-to-peak excursion over one-period windows. One cycle of a
 * modulation spans its full width whatever phase the window starts on, so every
 * window of exactly one period answers the same question and the median across
 * them discards the windows a stray frame landed in.
 */
function medianCycleExtent(residual: number[], periodFrames: number): number | null {
  const span = Math.max(2, Math.round(periodFrames));
  if (residual.length < span) return null;
  const widths: number[] = [];
  for (let start = 0; start + span <= residual.length; start++) {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = start; i < start + span; i++) {
      if (residual[i] < lo) lo = residual[i];
      if (residual[i] > hi) hi = residual[i];
    }
    widths.push(hi - lo);
  }
  widths.sort((a, b) => a - b);
  const mid = Math.floor(widths.length / 2);
  return widths.length % 2 === 1
    ? widths[mid]
    : (widths[mid - 1] + widths[mid]) / 2;
}

/** Peak-to-peak cents inside a stretch of voiced frames, undetrended. */
function spanExtentCents(
  frames: Array<{ t: number; f0: number }>,
  reference: number,
): number | null {
  if (frames.length < 2) return null;
  let lo = Infinity;
  let hi = -Infinity;
  for (const frame of frames) {
    const cents = centsBetween(frame.f0, reference);
    if (cents < lo) lo = cents;
    if (cents > hi) hi = cents;
  }
  return hi - lo;
}

/**
 * Vibrato over one run of consecutive voiced frames. The frames must already be
 * contiguous in time; `analyzeVibrato` below is what picks such a run out of a
 * whole trace.
 */
export function analyzeVibratoRun(
  voiced: Array<{ t: number; f0: number }>,
  frameSec: number,
  options: VibratoOptions = {},
): VibratoAnalysis {
  const onsetSkipSec = options.onsetSkipSec ?? VIBRATO_ONSET_SKIP_SEC;
  const minAnalysisSec = options.minAnalysisSec ?? VIBRATO_MIN_ANALYSIS_SEC;
  const minExtentCents = options.minExtentCents ?? VIBRATO_MIN_EXTENT_CENTS;
  const minPeriodicity = options.minPeriodicity ?? VIBRATO_MIN_PERIODICITY;
  const minRateHz = options.minRateHz ?? VIBRATO_MIN_RATE_HZ;
  const maxRateHz = options.maxRateHz ?? VIBRATO_MAX_RATE_HZ;

  if (voiced.length < 2) return absent("no-voiced-run");

  const maxReportableRateHz = 1 / (frameSec * VIBRATO_MIN_FRAMES_PER_CYCLE);
  if (maxReportableRateHz < maxRateHz) {
    return absent("frame-rate-too-low", { maxReportableRateHz });
  }

  const runStart = voiced[0].t;
  const onsetWindow = voiced.filter((f) => f.t - runStart < onsetSkipSec);
  const body = voiced.filter((f) => f.t - runStart >= onsetSkipSec);
  const onsetReference =
    onsetWindow.length > 0 ? onsetWindow[onsetWindow.length - 1].f0 : 0;
  const onsetSettleCents =
    onsetWindow.length > 1 ? spanExtentCents(onsetWindow, onsetReference) : null;
  const skipped = onsetWindow.length * frameSec;

  const partial: Partial<VibratoAnalysis> = {
    maxReportableRateHz,
    onsetSkippedSec: skipped,
    onsetSettleCents,
    startSec: body.length > 0 ? body[0].t : null,
  };

  if (body.length * frameSec < minAnalysisSec) return absent("too-short", partial);

  // Cents against the body's own geometric mean. Any reference cancels in the
  // detrending that follows; the geometric mean keeps the numbers small enough
  // to read while debugging.
  let logSum = 0;
  for (const frame of body) logSum += Math.log(frame.f0);
  const reference = Math.exp(logSum / body.length);
  const cents = body.map((frame) => centsBetween(frame.f0, reference));

  const first = detrend(cents, FIRST_PASS_DETREND_SEC / frameSec);
  const firstRate = estimateRate(first.residual, frameSec, minRateHz, maxRateHz);
  if (firstRate === null) return absent("no-periodic-peak", partial);

  // Second pass with a window of exactly one estimated period, which is the
  // window that removes the drift and leaves the modulation untouched.
  const periodFrames = 1 / (firstRate.rateHz * frameSec);
  const second = detrend(cents, periodFrames);
  const rate =
    estimateRate(second.residual, frameSec, minRateHz, maxRateHz) ?? firstRate;
  const residual = second.residual.length > 0 ? second.residual : first.residual;
  const analyzedSec = residual.length * frameSec;
  const startSec = body[second.residual.length > 0 ? second.offset : first.offset]?.t ?? null;
  const extentCents = medianCycleExtent(residual, 1 / (rate.rateHz * frameSec));

  const measured: Partial<VibratoAnalysis> = {
    ...partial,
    rateHz: rate.rateHz,
    extentCents,
    periodicity: rate.periodicity,
    analyzedSec,
    startSec,
  };

  if (analyzedSec < minAnalysisSec) return absent("too-short", measured);
  if (rate.rateHz < minRateHz || rate.rateHz > maxRateHz) {
    return absent("rate-out-of-band", measured);
  }
  if (rate.periodicity < minPeriodicity) return absent("not-periodic", measured);
  if (extentCents === null || extentCents < minExtentCents) {
    return absent("too-narrow", measured);
  }

  return {
    present: true,
    rateHz: rate.rateHz,
    extentCents,
    periodicity: rate.periodicity,
    analyzedSec,
    startSec,
    onsetSkippedSec: skipped,
    onsetSettleCents,
    maxReportableRateHz,
    reason: null,
  };
}

/**
 * Vibrato over a whole trace, measured on its longest unbroken voiced run.
 *
 * One run, not the whole trace: vibrato is a property of a held note, and
 * concatenating the voiced frames either side of a breath would put a
 * discontinuity in the middle of the contour and read it as modulation.
 */
export function analyzeVibrato(
  frames: F0Frame[],
  options: VibratoOptions = {},
): VibratoAnalysis {
  const frameSec = frameIntervalSec(frames);
  const longest = summarizeVoicedRuns(frames).longest;
  if (longest === null) return absent("no-voiced-run");
  const voiced: Array<{ t: number; f0: number }> = [];
  for (const frame of frames) {
    if (frame.t < longest.startSec || frame.t > longest.endSec) continue;
    if (isVoiced(frame)) voiced.push({ t: frame.t, f0: frame.f0 });
  }
  return analyzeVibratoRun(voiced, frameSec, options);
}
