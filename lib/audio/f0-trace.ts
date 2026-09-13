import { midiToFreq } from "@/lib/audio/notes";

/**
 * The fundamental-frequency and voicing trace, and the few things every
 * analysis over it needs.
 *
 * Both of this app's pitch paths already produce this shape. The live loop in
 * lib/audio/use-pitch.ts publishes one frame per animation frame, roughly 60 a
 * second, with `freq` null whenever the detector found no confident voiced
 * pitch. The offline pass in lib/audio/analyze-take.ts walks a stored take in
 * overlapping windows and emits the same alternation of a pitch and a null.
 * Vibrato, voiced runs and onset timing are three readings of that one trace
 * rather than three separate captures, so they share a frame type here instead
 * of each inventing one.
 *
 * A null frame means "no confident pitch at this instant", which is breath, a
 * consonant, silence, room noise, or a voiced note the detector lost. Nothing
 * downstream may treat it as a measured silence: the distinction between a
 * singer stopping and a detector failing is not in this data, and every
 * analysis that depends on it says so where it makes its claim.
 */
export interface F0Frame {
  /** Seconds from the start of the trace. Monotonically non-decreasing. */
  t: number;
  /** Fundamental in hertz, or null when the frame was not confidently voiced. */
  f0: number | null;
}

/** A frame the detector reported a pitch for. */
export interface VoicedFrame {
  t: number;
  f0: number;
}

/**
 * The frame rate both capture paths aim at: one analysis frame per animation
 * frame. Used only as the fallback when a trace is too short for its own
 * interval to be measured, because a single-frame run still covers some time
 * and reporting it as zero seconds would be wrong in the flattering direction.
 */
export const NOMINAL_FRAME_SEC = 1 / 60;

/** Whether a frame carries a usable pitch, narrowing the type when it does. */
export function isVoiced(frame: F0Frame): frame is VoicedFrame {
  return frame.f0 !== null && Number.isFinite(frame.f0) && frame.f0 > 0;
}

/**
 * The trace's own frame interval, taken as the median of successive timestamp
 * gaps rather than the mean.
 *
 * A dropped animation frame or a garbage-collection pause leaves one long gap
 * in an otherwise even trace, and a mean would spread that over every frame.
 * The median ignores it, which is what a nominal frame period should do.
 */
export function frameIntervalSec(frames: F0Frame[]): number {
  const gaps: number[] = [];
  for (let i = 1; i < frames.length; i++) {
    const gap = frames[i].t - frames[i - 1].t;
    if (gap > 0 && Number.isFinite(gap)) gaps.push(gap);
  }
  if (gaps.length === 0) return NOMINAL_FRAME_SEC;
  gaps.sort((a, b) => a - b);
  const mid = Math.floor(gaps.length / 2);
  return gaps.length % 2 === 1 ? gaps[mid] : (gaps[mid - 1] + gaps[mid]) / 2;
}

/**
 * Interval in cents between two frequencies, positive when `f0` is the higher
 * of the two. Vibrato extent is a musical interval rather than a number of
 * hertz: the same wobble measured in hertz doubles an octave up, and a singer
 * comparing two notes would be reading their own vibrato as having grown.
 */
export function centsBetween(f0: number, reference: number): number {
  if (!(f0 > 0) || !(reference > 0)) return 0;
  return 1200 * Math.log2(f0 / reference);
}

/**
 * Adapt the offline take trace, which carries floating-point MIDI, to the
 * hertz the analyses take. The conversion is exact in both directions, so this
 * is a unit change and not a re-estimate.
 */
export function traceFromMidiPoints(
  points: Array<{ t: number; midi: number | null }>,
): F0Frame[] {
  return points.map(({ t, midi }) => ({
    t,
    f0: midi === null || !Number.isFinite(midi) ? null : midiToFreq(midi),
  }));
}
