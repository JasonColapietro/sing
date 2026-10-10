"use client";

import { centsOff } from "@/lib/audio/notes";
import { UNMODELLED_INPUT_LAG_SEC } from "@/lib/audio/latency";
import type { Segment } from "./exercises";
import {
  segmentIndexAt,
  targetMidiAt,
  totalTargetDur,
  type RepResult,
} from "./lib";

/** In-tune window a rep is scored against. */
export const TOLERANCE_CENTS = 50;

/**
 * Seconds at the front of every target note in which a frame off the target is
 * forgiven rather than counted against the singer.
 *
 * The player rewinds each frame by `scoreLagSec`, but the timing audit measured
 * an aligned voice still reading about 105 ms late at every note change
 * (UNMODELLED_INPUT_LAG_SEC in lib/audio/latency). On a 0.25 s note that is
 * two fifths of the note scored against a singer who sang it on time: the
 * staccato gug, the agility run and the N run lost that share of every note.
 * So the grace is that measured residual, not a tuned number, and it is in
 * seconds rather than a share of the note because latency does not change
 * with tempo.
 *
 * Inside the grace an in-tune frame is credited like any other and an
 * off-target frame is dropped entirely: it adds no error and no voiced frame.
 * The note's possible time shrinks by the grace, so a note sung on pitch from
 * the end of its grace to its end scores in full. A wrong note is still wrong
 * everywhere past the grace, so it still scores nothing.
 */
export const ONSET_GRACE_SEC = UNMODELLED_INPUT_LAG_SEC;

/**
 * The most of any one note the grace may cover. A note at 1.25x of the 0.25 s
 * runs lasts 0.2 s; forgiving more than half of it would leave too little of
 * the note to judge, so the grace stops at half and the note keeps the rest.
 */
export const ONSET_GRACE_MAX_SHARE = 0.5;

/**
 * The onset grace a segment of `dur` seconds gets. Long notes lose a sliver
 * (105 ms of a 3.5 s hold is 3%); fast ones get the whole residual or half the
 * note, whichever is less.
 */
export function onsetGraceFor(dur: number, graceSec: number = ONSET_GRACE_SEC): number {
  if (!(dur > 0) || !(graceSec > 0)) return 0;
  return Math.min(graceSec, dur * ONSET_GRACE_MAX_SHARE);
}

/**
 * The accumulation behind one rep's score, pulled out of the player's
 * animation-frame callback so a test can drive it frame by frame.
 *
 * Score is the share of each note's possible time held within TOLERANCE_CENTS,
 * where a note's possible time is its length less its onset grace. Cents error
 * is the mean over the voiced frames that count, and a glide segment credits
 * each of its endpoints with half the segment.
 */
export interface RepScorer {
  /**
   * Fold one pitch frame in.
   *
   * `patternSec` is the position in the *pattern* the frame describes, which the
   * caller has already rewound by `scoreLagSec` — this module never guesses at
   * latency beyond the onset grace. `freq` is null for an unvoiced frame. `dt`
   * is the frame's duration.
   */
  feed(patternSec: number, freq: number | null, dt: number): void;
  /** Voiced frames that landed on a target so far. Zero means nobody sang. */
  readonly voicedFrames: number;
  /** The finished rep, or null when nothing voiced ever landed on a target. */
  result(root: number): RepResult | null;
  /**
   * Per-segment fill for the note lane, in seconds of the segment's own length:
   * a note held for all of its possible time reads as the whole segment.
   */
  hitSec(): number[];
}

export function createRepScorer(
  segs: Segment[],
  opts: { onsetGraceSec?: number } = {},
): RepScorer {
  const graceSec = opts.onsetGraceSec ?? ONSET_GRACE_SEC;
  const grace = segs.map((s) => onsetGraceFor(s.dur, graceSec));
  const possible = segs.map((s, i) => s.dur - grace[i]);
  const hitAccum = segs.map(() => 0);
  const segCentsSum = segs.map(() => 0);
  const segCentsFrames = segs.map(() => 0);
  let centsSum = 0;
  let centsCount = 0;

  /** In-tolerance seconds a segment can be credited with: never more than possible. */
  const credited = (i: number) => Math.min(hitAccum[i] ?? 0, possible[i] ?? 0);

  return {
    feed(patternSec, freq, dt) {
      if (freq === null) return;
      const target = targetMidiAt(segs, patternSec);
      if (target === null) return;
      const cents = centsOff(freq, target);
      const inTune = Math.abs(cents) <= TOLERANCE_CENTS;
      // Resolve the segment before the tolerance check: an out-of-tune frame
      // is exactly the signal weak-note detection needs, unless it sits in the
      // note's onset grace, where it is most likely the previous note still
      // arriving through the input chain.
      const idx = segmentIndexAt(segs, patternSec);
      if (!inTune && idx >= 0 && patternSec - segs[idx].t0 < grace[idx]) return;
      centsSum += Math.abs(cents);
      centsCount += 1;
      if (idx >= 0) {
        segCentsSum[idx] += Math.abs(cents);
        segCentsFrames[idx] += 1;
        if (inTune) hitAccum[idx] += dt;
      }
    },

    get voicedFrames() {
      return centsCount;
    },

    result(root) {
      if (centsCount === 0) return null;
      const denom = totalTargetDur(segs) - grace.reduce((a, b) => a + b, 0);
      const hitTotal = segs.reduce((a, _, i) => a + credited(i), 0);
      const score =
        denom > 0 ? Math.round(Math.min(100, (hitTotal / denom) * 100)) : 0;
      const avgCentsErr = Math.round(centsSum / centsCount);
      return {
        root,
        score,
        avgCentsErr,
        skipped: false,
        notes: segs.flatMap((seg, i) => {
          const hitSec = credited(i);
          const centsSumSeg = segCentsSum[i] ?? 0;
          const centsFrames = segCentsFrames[i] ?? 0;
          // A glide sweeps between two pitches, so credit each endpoint
          // with half the segment rather than pinning it to one note.
          const endpoints =
            seg.startMidi === seg.endMidi
              ? [seg.startMidi]
              : [seg.startMidi, seg.endMidi];
          const share = 1 / endpoints.length;
          return endpoints.map((midi) => ({
            midi,
            hitSec: hitSec * share,
            possibleSec: possible[i] * share,
            centsSum: centsSumSeg * share,
            centsFrames: Math.round(centsFrames * share),
          }));
        }),
      };
    },

    hitSec() {
      return segs.map((seg, i) =>
        possible[i] > 0 ? (credited(i) / possible[i]) * seg.dur : 0,
      );
    },
  };
}
