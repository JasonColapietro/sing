"use client";

import { centsOff } from "@/lib/audio/notes";
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
 * The accumulation behind one rep's score, pulled out of the player's
 * animation-frame callback so a test can drive it frame by frame.
 *
 * The arithmetic is the number the whole warmup room is judged on, and it
 * lived inline in an effect where no test at any level could reach it. It
 * moved here unchanged: score is the share of target time held within
 * TOLERANCE_CENTS, cents error is the mean over voiced frames, and a glide
 * segment credits each of its endpoints with half the segment.
 */
export interface RepScorer {
  /**
   * Fold one pitch frame in.
   *
   * `patternSec` is the position in the *pattern* the frame describes, which the
   * caller has already rewound by `scoreLagSec` — this module never guesses at
   * latency. `freq` is null for an unvoiced frame. `dt` is the frame's duration.
   */
  feed(patternSec: number, freq: number | null, dt: number): void;
  /** Voiced frames that landed on a target so far. Zero means nobody sang. */
  readonly voicedFrames: number;
  /** The finished rep, or null when nothing voiced ever landed on a target. */
  result(root: number): RepResult | null;
  /** Per-segment in-tolerance seconds, for the note lane's fill. */
  hitSec(): number[];
}

export function createRepScorer(segs: Segment[]): RepScorer {
  const hitAccum = segs.map(() => 0);
  const segCentsSum = segs.map(() => 0);
  const segCentsFrames = segs.map(() => 0);
  let centsSum = 0;
  let centsCount = 0;

  return {
    feed(patternSec, freq, dt) {
      if (freq === null) return;
      const target = targetMidiAt(segs, patternSec);
      if (target === null) return;
      const cents = centsOff(freq, target);
      centsSum += Math.abs(cents);
      centsCount += 1;
      // Attribute every voiced frame to its segment, in tune or not — an
      // out-of-tune frame is exactly the signal weak-note detection needs,
      // so the index has to be resolved before the tolerance check.
      const idx = segmentIndexAt(segs, patternSec);
      if (idx >= 0) {
        segCentsSum[idx] += Math.abs(cents);
        segCentsFrames[idx] += 1;
        if (Math.abs(cents) <= TOLERANCE_CENTS) {
          hitAccum[idx] += dt;
        }
      }
    },

    get voicedFrames() {
      return centsCount;
    },

    result(root) {
      if (centsCount === 0) return null;
      const denom = totalTargetDur(segs);
      const hitTotal = hitAccum.reduce((a, b) => a + b, 0);
      const score =
        denom > 0 ? Math.round(Math.min(100, (hitTotal / denom) * 100)) : 0;
      const avgCentsErr = Math.round(centsSum / centsCount);
      return {
        root,
        score,
        avgCentsErr,
        skipped: false,
        notes: segs.flatMap((seg, i) => {
          const hitSec = hitAccum[i] ?? 0;
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
            possibleSec: seg.dur * share,
            centsSum: centsSumSeg * share,
            centsFrames: Math.round(centsFrames * share),
          }));
        }),
      };
    },

    hitSec() {
      return [...hitAccum];
    },
  };
}
