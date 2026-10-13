"use client";

import { freqToMidiFloat } from "@/lib/audio/notes";
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
 * When either octave counts, how many whole octaves either side of the written
 * pattern a rep is tried in. Two covers a higher voice singing the nominal
 * ladder an octave up and a tracker reading a low voice an octave out, with
 * room to spare.
 */
export const MAX_OCTAVE_SHIFT = 2;

/**
 * When either octave counts, the credited time an octave needs before the lane
 * draws the voice in it, and the lead another octave needs over it to take its
 * place. Display only: the score always uses the rep's best octave. Long
 * enough to outlast a single pitch-tracker octave error at an onset, and the
 * lead keeps the drawing from flipping on near-ties between notes.
 */
export const OCTAVE_LEAD_SEC = 0.1;

/**
 * Seconds at the front of every target note in which a frame off the target is
 * forgiven rather than counted against the singer.
 *
 * The player rewinds each frame by `scoreLagSec`, but a real singer still
 * lands a fast note a little late: input-chain latency the rewind cannot see
 * on every device, plus the onset of the note itself. On a 0.25 s note,
 * 100 ms of that is two fifths of the note scored against a singer who sang it
 * on time. This is an onset *tolerance*, sized from UNMODELLED_INPUT_LAG_SEC
 * (lib/audio/latency). That figure came from a probe whose synthetic take
 * started late, so treat it as an allowance to re-measure on real hardware,
 * not a measured constant. It is in seconds rather than a share of the note
 * because latency does not change with tempo.
 *
 * Inside the grace nothing counts for or against the singer: an off-target
 * frame adds no error and no voiced frame, and an in-tune frame adds no
 * credit (it still counts as voiced). Credit starts at the end of the grace,
 * and the note's possible time is its length less the grace, so a note held
 * on pitch from there to its end scores in full and a half-sung fast note
 * does not. A wrong note is still wrong everywhere past the grace.
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
 * How far either side of the guide's straight-line ramp a glide may run, as a
 * share of the glide's length. A siren is taught as one unbroken slide (see
 * the tips on the siren drills), and a natural one eases out of the bottom and
 * into the top rather than moving at constant speed; scored against the bare
 * ramp, an eased octave siren with exact endpoints scored 24 and a perfect
 * ramp sung ~100 ms late scored 0. So a glide frame is measured against the
 * nearest pitch the ramp passes through within this share of the glide on
 * either side, plus the onset grace on the late side for input latency.
 * A singer stuck on the start pitch or stepping instead of sliding still
 * scores low: the window follows the ramp, it does not cover the whole sweep.
 */
export const GLIDE_TIME_SLACK = 0.1;

/**
 * The pitch a frame sung at `sungMidi`, at pattern time `t`, is measured
 * against: a plain note's own pitch, or, inside a glide, the nearest pitch the
 * guide's ramp passes through from (GLIDE_TIME_SLACK of the glide + the onset
 * grace) before `t` to GLIDE_TIME_SLACK after it, the ramp held at its
 * endpoints outside the glide. Null between notes, where nothing is scored.
 * The scorer and the player's live "Cents off" readout both use this, so the
 * readout judges a glide the same way the score does.
 */
export function referenceMidiAt(
  segs: Segment[],
  t: number,
  sungMidi: number,
  graceSec: number = ONSET_GRACE_SEC,
): number | null {
  const idx = segmentIndexAt(segs, t);
  if (idx < 0) return null;
  const seg = segs[idx];
  if (seg.startMidi === seg.endMidi || !(seg.dur > 0)) return seg.startMidi;
  const w = GLIDE_TIME_SLACK * seg.dur;
  const ramp = (at: number) =>
    seg.startMidi +
    (seg.endMidi - seg.startMidi) * Math.min(1, Math.max(0, (at - seg.t0) / seg.dur));
  const a = ramp(t - w - graceSec);
  const b = ramp(t + w);
  return Math.min(Math.max(sungMidi, Math.min(a, b)), Math.max(a, b));
}

/**
 * `midi` moved by whole octaves to the octave nearest `target`. Used when
 * either octave of a target counts, so a higher voice singing the ladder an
 * octave up is scored, and drawn, on the note she is actually matching.
 */
export function foldToOctaveOf(midi: number, target: number): number {
  return midi - 12 * Math.round((midi - target) / 12);
}

/**
 * The accumulation behind one rep's score, pulled out of the player's
 * animation-frame callback so a test can drive it frame by frame.
 *
 * Score is the share of each note's possible time held within TOLERANCE_CENTS,
 * where a note's possible time is its length less its onset grace. Cents error
 * is the mean over the voiced frames that count, and a glide segment credits
 * each of its endpoints with half the segment. A glide frame is measured
 * against the ramp's pitch window (GLIDE_TIME_SLACK), not one instant of it.
 *
 * `octaveAgnostic` counts any octave of the target as the target. The player
 * sets it when no range is saved: the ladder is then a nominal one, and a
 * higher voice singing it an octave up is singing it right. But it is one
 * octave per rep, not per frame: the rep is scored as if every frame were
 * moved by each whole-octave shift in turn (up to MAX_OCTAVE_SHIFT either
 * way), and the shift that scores best is the rep's octave. A whole take an
 * octave up still scores in full; the leap to the octave and the top of an
 * arpeggio still have to be sung; and a descent whose first note dropped an
 * octave scores what the written octave gives, rather than losing every note
 * after the slip.
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
  /**
   * The whole-octave shift the lane draws the voice in while either octave
   * counts: the octave leading the rep so far, once it has OCTAVE_LEAD_SEC of
   * credit (and, to replace another, that much more credit than it). Null
   * before that, and always null for exact-octave scoring.
   */
  readonly octaveShift: number | null;
  /**
   * The finished rep, or null when nothing voiced ever landed on a target.
   * Its root and every note are moved (when either octave counts) by the
   * rep's octave, so the summary names the rung in the same octave as the
   * per-note results beside it.
   */
  result(root: number): RepResult | null;
  /**
   * Per-segment fill for the note lane, in seconds of the segment's own length:
   * a note held for all of its possible time reads as the whole segment.
   */
  hitSec(): number[];
}

/** One whole-octave shift's running tallies inside a rep. */
interface OctaveTally {
  shift: number;
  /** In-tolerance seconds past the onset grace, per segment. */
  hit: number[];
  centsSum: number[];
  centsFrames: number[];
  centsTotal: number;
  frames: number;
}

export function createRepScorer(
  segs: Segment[],
  opts: { onsetGraceSec?: number; octaveAgnostic?: boolean } = {},
): RepScorer {
  const graceSec = opts.onsetGraceSec ?? ONSET_GRACE_SEC;
  const octaveAgnostic = opts.octaveAgnostic === true;
  const grace = segs.map((s) => onsetGraceFor(s.dur, graceSec));
  const possible = segs.map((s, i) => s.dur - grace[i]);
  // One tally per whole-octave shift the rep is tried in: just the written
  // octave unless either octave counts. Ordered nearest the written octave
  // first, the lower before the higher, which is how a full tie is settled.
  const shifts = octaveAgnostic
    ? [0, ...Array.from({ length: MAX_OCTAVE_SHIFT }, (_, k) => [-(k + 1), k + 1]).flat()]
    : [0];
  const tallies: OctaveTally[] = shifts.map((shift) => ({
    shift,
    hit: segs.map(() => 0),
    centsSum: segs.map(() => 0),
    centsFrames: segs.map(() => 0),
    centsTotal: 0,
    frames: 0,
  }));
  let voiced = 0;
  let shown: OctaveTally | null = null;

  /** In-tolerance seconds a segment can be credited with: never more than possible. */
  const credited = (t: OctaveTally, i: number) => Math.min(t.hit[i] ?? 0, possible[i] ?? 0);
  const creditTotal = (t: OctaveTally) => segs.reduce((a, _, i) => a + credited(t, i), 0);
  const meanCents = (t: OctaveTally) => (t.frames > 0 ? t.centsTotal / t.frames : Infinity);
  /**
   * The rep's octave: the most credited time (its score before rounding),
   * then the least mean cents error, then the earlier tally.
   */
  const best = (): OctaveTally => {
    let b = tallies[0];
    let bCredit = creditTotal(b);
    for (const t of tallies.slice(1)) {
      const credit = creditTotal(t);
      if (credit > bCredit + 1e-9 || (credit > bCredit - 1e-9 && meanCents(t) < meanCents(b))) {
        b = t;
        bCredit = credit;
      }
    }
    return b;
  };

  return {
    feed(patternSec, freq, dt) {
      if (freq === null) return;
      const target = targetMidiAt(segs, patternSec);
      if (target === null) return;
      // Resolve the segment before the tolerance check: an out-of-tune frame
      // is exactly the signal weak-note detection needs, unless it sits in the
      // note's onset grace, where it is most likely the previous note still
      // arriving through the input chain.
      const idx = segmentIndexAt(segs, patternSec);
      const inGrace = idx >= 0 && patternSec - segs[idx].t0 < grace[idx];
      const raw = freqToMidiFloat(freq);
      let counted = false;
      for (const t of tallies) {
        // Moved by this tally's whole octaves, then measured against the
        // glide window (or the note) like any other frame.
        const sung = raw - 12 * t.shift;
        const reference = referenceMidiAt(segs, patternSec, sung, graceSec) ?? target;
        const cents = Math.round((sung - reference) * 100);
        const inTune = Math.abs(cents) <= TOLERANCE_CENTS;
        if (!inTune && inGrace) continue;
        counted = true;
        t.centsTotal += Math.abs(cents);
        t.frames += 1;
        if (idx >= 0) {
          t.centsSum[idx] += Math.abs(cents);
          t.centsFrames[idx] += 1;
          if (inTune && !inGrace) t.hit[idx] += dt;
        }
      }
      if (counted) voiced += 1;
      if (octaveAgnostic) {
        // The lane's octave: the leader once it has OCTAVE_LEAD_SEC of
        // credit, replaced only by one that leads it by as much again.
        const lead = best();
        const need = (shown === null ? 0 : creditTotal(shown)) + OCTAVE_LEAD_SEC;
        if (lead !== shown && creditTotal(lead) >= need - 1e-9) shown = lead;
      }
    },

    get voicedFrames() {
      return voiced;
    },

    get octaveShift() {
      return shown === null ? null : shown.shift;
    },

    result(root) {
      if (voiced === 0) return null;
      // A shift with no counted frames has no credit and an infinite mean
      // error, so once anything was counted the rep's octave has frames.
      const b = best();
      const denom = totalTargetDur(segs) - grace.reduce((a, g) => a + g, 0);
      const score =
        denom > 0 ? Math.round(Math.min(100, (creditTotal(b) / denom) * 100)) : 0;
      const avgCentsErr = b.frames > 0 ? Math.round(b.centsTotal / b.frames) : 0;
      return {
        root: root + 12 * b.shift,
        score,
        avgCentsErr,
        skipped: false,
        notes: segs.flatMap((seg, i) => {
          const hitSec = credited(b, i);
          const centsSumSeg = b.centsSum[i] ?? 0;
          const centsFrames = b.centsFrames[i] ?? 0;
          // A glide sweeps between two pitches, so credit each endpoint
          // with half the segment rather than pinning it to one note.
          const endpoints =
            seg.startMidi === seg.endMidi
              ? [seg.startMidi]
              : [seg.startMidi, seg.endMidi];
          const share = 1 / endpoints.length;
          return endpoints.map((midi) => ({
            // Always the written note unless either octave counts; then the
            // note moved by the rep's octave.
            midi: midi + 12 * b.shift,
            hitSec: hitSec * share,
            possibleSec: possible[i] * share,
            centsSum: centsSumSeg * share,
            centsFrames: Math.round(centsFrames * share),
          }));
        }),
      };
    },

    hitSec() {
      const b = best();
      return segs.map((seg, i) =>
        possible[i] > 0 ? (credited(b, i) / possible[i]) * seg.dur : 0,
      );
    },
  };
}
