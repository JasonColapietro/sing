import {
  type F0Frame,
  centsBetween,
  frameIntervalSec,
  isVoiced,
} from "@/lib/audio/f0-trace";
import { scoreLagSec } from "@/lib/audio/latency";
import { voicedRuns } from "@/lib/audio/voiced-run";

/**
 * Onset detection and signed onset timing error.
 *
 * An onset is the instant a note starts. Two things in the trace mark one: the
 * voice arriving after silence, and the pitch stepping to a new note while the
 * voice keeps sounding. A detector that only found the first would miss every
 * note inside a legato phrase, which is most of the notes in any phrase a
 * lesson asks about, so both are found and each onset says which it was.
 *
 * The timing error is the signed difference between when a note was sung and
 * when it was supposed to be sung, in milliseconds, negative for early and
 * positive for late. Signed is the point: a singer consistently 40 ms ahead of
 * the click and a singer scattering 40 ms either side of it have the same
 * absolute error and need opposite advice, and only the sign separates them.
 *
 * The correction is not optional and the reason is arithmetic rather than
 * taste. A detected onset sits in the analysis timeline, which trails reality by
 * the lag lib/audio/latency.ts computes: the analyser reports the midpoint of
 * its window and the median smoothing pushes the answer back further, about
 * 68 ms together at the frame size every room opens. A click or guide the singer
 * was following is heard later than it was scheduled by the output lag, which
 * Bluetooth routinely makes 150 to 300 ms. The two add, exactly as
 * `scoreLagSec` says they do. Uncorrected, every onset in this app lands a tenth
 * of a second or more after the beat it belongs to, which on a fast phrase is
 * past the next beat: the measurement would attribute each note's onset to the
 * note before it and report a singer who is dead on the beat as chronically
 * late. That number is worse than no number, so the functions that produce a
 * timing error take the lags as a required argument and return null rather than
 * a figure when they are not supplied.
 *
 * What the corrected number establishes: how far the detected start of a sung
 * note sat from a named target time, once the two modelled lags between the
 * singer's air and the trace are removed. What it does not establish: anything
 * finer than this app can resolve. Three terms bound the resolution — the frame
 * interval, since an onset can only be placed on a frame; the detector's own
 * behaviour at the start of a note, where clarity rises over a frame or two
 * before the gate opens; and the latency the model does not cover. The model
 * covers the analysis path and the output path. It does not cover the hardware
 * capture path from microphone to analyser, for which no browser exposes a
 * figure, and for an offline take it knows nothing about the lags in force when
 * that take was recorded — the caller has to have kept them. `ONSET_RESOLUTION_MS`
 * is the honest floor, and a reported error smaller than it should be read as
 * on time rather than as a direction.
 */

/**
 * The smallest timing error worth interpreting as early or late, in
 * milliseconds.
 *
 * One frame of the trace is about 17 ms and the voicing gate typically opens a
 * frame or two into a note, which puts the placement of a single onset at a few
 * tens of milliseconds before any unmodelled capture latency is counted. 30 ms
 * is also roughly where a listener stops hearing two attacks as separate, so
 * below it the measurement and the ear agree that nothing happened.
 */
export const ONSET_RESOLUTION_MS = 30;

/**
 * How far the pitch has to step, in cents, for a new note to be called inside a
 * continuously voiced stretch.
 *
 * Eighty cents is most of a semitone: wider than vibrato at its widest and
 * wider than the scoop of an ordinary entry, narrower than the smallest
 * interval any exercise here asks for. A glissando crosses it too, which is
 * correct — a slide through a semitone does start a new pitch — and is why the
 * step has to be held.
 */
export const ONSET_STEP_CENTS = 80;

/**
 * How long the new pitch has to hold for the step to count, in seconds. Short
 * enough to catch an agility run, long enough that one stray frame from the
 * detector is not a note.
 */
export const ONSET_STEP_HOLD_SEC = 0.06;

/**
 * The shortest gap between two reported onsets, in seconds. Without it a slide
 * reports an onset on every frame of its way up.
 */
export const ONSET_REFRACTORY_SEC = 0.1;

export interface Onset {
  /** Seconds into the analysis trace, uncorrected. */
  tSec: number;
  /** What marked it: the voice arriving, or the pitch stepping. */
  kind: "voiced-entry" | "pitch-step";
  /** The fundamental at the onset frame, in hertz. */
  f0: number;
}

/** The two lags lib/audio/latency.ts models, in seconds. */
export interface OnsetLags {
  /** `pitchReportLagSec(...)` — how late the analysis reports the voice. */
  pitchLag: number;
  /** `outputLagSec(ctx)` — how late the singer heard the click or guide. */
  outputLag: number;
}

export interface OnsetOptions {
  stepCents?: number;
  stepHoldSec?: number;
  refractorySec?: number;
}

function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Every onset in the trace, in time order and in trace time.
 *
 * Voiced entries come from the same run boundaries lib/audio/voiced-run.ts
 * finds, so a dropped frame in the middle of a held note does not invent an
 * onset. Pitch steps are found by comparing the median of the frames just
 * behind a frame with the median of the frames from it forward, which ignores
 * the single-frame excursions a detector produces while a note changes.
 */
export function detectOnsets(
  frames: F0Frame[],
  options: OnsetOptions = {},
): Onset[] {
  const stepCents = options.stepCents ?? ONSET_STEP_CENTS;
  const stepHoldSec = options.stepHoldSec ?? ONSET_STEP_HOLD_SEC;
  const refractorySec = options.refractorySec ?? ONSET_REFRACTORY_SEC;
  const frameSec = frameIntervalSec(frames);
  const hold = Math.max(2, Math.round(stepHoldSec / frameSec));

  const onsets: Onset[] = [];
  const pushed = (t: number) =>
    onsets.length === 0 || t - onsets[onsets.length - 1].tSec >= refractorySec;

  for (const run of voicedRuns(frames)) {
    const voiced = frames.filter(
      (frame) =>
        isVoiced(frame) && frame.t >= run.startSec && frame.t <= run.endSec,
    ) as Array<{ t: number; f0: number }>;
    if (voiced.length === 0) continue;

    onsets.push({ tSec: voiced[0].t, kind: "voiced-entry", f0: voiced[0].f0 });

    for (let i = hold; i + hold <= voiced.length; i++) {
      const before = medianOf(
        voiced.slice(i - hold, i).map((frame) => frame.f0),
      );
      const after = medianOf(voiced.slice(i, i + hold).map((frame) => frame.f0));
      if (Math.abs(centsBetween(after, before)) < stepCents) continue;
      if (!pushed(voiced[i].t)) continue;
      onsets.push({ tSec: voiced[i].t, kind: "pitch-step", f0: voiced[i].f0 });
    }
  }

  onsets.sort((a, b) => a.tSec - b.tSec);
  return onsets;
}

/**
 * Signed milliseconds between a detected onset and the target time it belongs
 * to, negative when the singer was early.
 *
 * The arithmetic is the one lib/audio/latency.ts documents, written out: the
 * singer made the sound at `tSec - pitchLag`, and heard the target at
 * `targetSec + outputLag`, so the error is `tSec - targetSec` less the sum of
 * the two. Returns null when either lag is missing or nonsensical, because a
 * number produced without the correction is biased late by the whole of it.
 */
export function signedOnsetErrorMs(
  onsetSec: number,
  targetSec: number,
  lags: OnsetLags,
): number | null {
  if (!Number.isFinite(onsetSec) || !Number.isFinite(targetSec)) return null;
  if (!Number.isFinite(lags?.pitchLag) || !Number.isFinite(lags?.outputLag)) {
    return null;
  }
  const correction = scoreLagSec(lags.pitchLag, lags.outputLag);
  return (onsetSec - targetSec - correction) * 1000;
}

export interface MatchedOnset {
  /** The target time, in the same timeline the targets were scheduled on. */
  targetSec: number;
  /** The onset matched to it, or null when nothing was sung near it. */
  onset: Onset | null;
  /** Signed error in milliseconds, negative for early. Null when unmatched. */
  errorMs: number | null;
}

export interface OnsetTimingSummary {
  matches: MatchedOnset[];
  /**
   * Mean signed error over the matched targets — the singer's bias. Null when
   * nothing matched or the correction was unavailable.
   */
  meanErrorMs: number | null;
  /** Mean of the absolute errors: how scattered, regardless of direction. */
  meanAbsErrorMs: number | null;
  /** Targets with no onset inside the window. */
  missed: number;
  /** Onsets that matched no target at all. */
  extra: number;
}

export interface MatchOptions extends OnsetOptions {
  /**
   * How far from a target an onset may sit and still be that target's, in
   * milliseconds. Default is half the shortest gap between targets, which is
   * the only bound that cannot assign one onset to the wrong note.
   */
  windowMs?: number;
}

/**
 * Match detected onsets to target times and reduce them to signed errors.
 *
 * Matching is nearest-first on the corrected times, each onset used once. The
 * correction is applied before matching and not after: matching on uncorrected
 * times is precisely the failure the lag causes, since the nearest target to an
 * onset reported 70 ms late is frequently the next one.
 */
export function onsetTimingErrors(
  frames: F0Frame[],
  targetsSec: number[],
  lags: OnsetLags,
  options: MatchOptions = {},
): OnsetTimingSummary {
  const onsets = detectOnsets(frames, options);
  const targets = [...targetsSec].filter(Number.isFinite).sort((a, b) => a - b);

  let gapMs = Infinity;
  for (let i = 1; i < targets.length; i++) {
    gapMs = Math.min(gapMs, (targets[i] - targets[i - 1]) * 1000);
  }
  const windowMs =
    options.windowMs ?? (Number.isFinite(gapMs) ? gapMs / 2 : 250);

  const taken = new Set<number>();
  const matches: MatchedOnset[] = targets.map((targetSec) => {
    let bestIndex = -1;
    let bestAbs = Infinity;
    let bestError: number | null = null;
    for (let i = 0; i < onsets.length; i++) {
      if (taken.has(i)) continue;
      const errorMs = signedOnsetErrorMs(onsets[i].tSec, targetSec, lags);
      if (errorMs === null) return { targetSec, onset: null, errorMs: null };
      const abs = Math.abs(errorMs);
      if (abs <= windowMs && abs < bestAbs) {
        bestAbs = abs;
        bestIndex = i;
        bestError = errorMs;
      }
    }
    if (bestIndex < 0) return { targetSec, onset: null, errorMs: null };
    taken.add(bestIndex);
    return { targetSec, onset: onsets[bestIndex], errorMs: bestError };
  });

  const errors = matches
    .map((match) => match.errorMs)
    .filter((error): error is number => error !== null);

  return {
    matches,
    meanErrorMs:
      errors.length > 0
        ? errors.reduce((a, b) => a + b, 0) / errors.length
        : null,
    meanAbsErrorMs:
      errors.length > 0
        ? errors.reduce((a, b) => a + Math.abs(b), 0) / errors.length
        : null,
    missed: matches.filter((match) => match.onset === null).length,
    extra: onsets.length - taken.size,
  };
}
