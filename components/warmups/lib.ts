"use client";

import type { Segment, WarmupExercise } from "./exercises";
import { buildSegments } from "./exercises";
import { playSequence, playTone } from "@/lib/audio/synth";
import type { Achievement } from "@/lib/progress";
import type { NoteScore } from "@/lib/analytics";

/** Sing window = melody length + 20%, per the classic warmup ladder. */
export function singWindowSec(totalSec: number): number {
  return totalSec * 1.2;
}

/**
 * Target midi (possibly fractional, for glide segments) at time `t` seconds
 * from the melody's start. Returns null when `t` falls in a gap between
 * segments (nothing to score against).
 */
export function targetMidiAt(segs: Segment[], t: number): number | null {
  for (const seg of segs) {
    if (t >= seg.t0 && t <= seg.t0 + seg.dur) {
      if (seg.startMidi === seg.endMidi) return seg.startMidi;
      const frac = seg.dur > 0 ? (t - seg.t0) / seg.dur : 0;
      return seg.startMidi + (seg.endMidi - seg.startMidi) * frac;
    }
  }
  return null;
}

/** Index of the segment active at time `t`, or -1 between/after segments. */
export function segmentIndexAt(segs: Segment[], t: number): number {
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    if (t >= seg.t0 && t <= seg.t0 + seg.dur) return i;
  }
  return -1;
}

export function totalTargetDur(segs: Segment[]): number {
  return segs.reduce((a, s) => a + s.dur, 0);
}

/**
 * Play the guide melody for one rep: discrete-note exercises use
 * playSequence (spacing matches buildSegments exactly), glide exercises
 * schedule per-segment pitch glides with playTone.
 *
 * `at` delays the whole pattern (seconds from now), `gain` scales it — the
 * under-voice pass plays quieter than a teach pass — and `out` routes every
 * tone through a cancellable group, which is what lets a transpose or an exit
 * take a scheduled guide back.
 */
export function playGuide(
  ex: WarmupExercise,
  rootMidi: number,
  tempo: number,
  opts: { at?: number; gain?: number; out?: AudioNode } = {},
): { segs: Segment[]; totalSec: number } {
  const { at = 0, gain = 0.22, out } = opts;
  const { segs, totalSec, noteDur, gap } = buildSegments(ex, rootMidi, tempo);
  if (ex.glide) {
    for (const seg of segs) {
      playTone(seg.startMidi, {
        dur: seg.dur,
        at: at + seg.t0,
        gain,
        out,
        glideToMidi: seg.endMidi !== seg.startMidi ? seg.endMidi : undefined,
      });
    }
  } else {
    playSequence(
      segs.map((s) => s.startMidi),
      { noteDur, gap, gain, at, out },
    );
  }
  return { segs, totalSec };
}

export interface RepResult {
  root: number;
  score: number;
  avgCentsErr: number;
  skipped: boolean;
  /**
   * Per-note scoring for the Pro analytics. A glide segment contributes to
   * both of its endpoints, since the singer had to land each one.
   */
  notes?: NoteScore[];
}

/**
 * The reps the singer actually sang. A skip is an abstention, not a
 * performance: the ladder now spans the whole range and keeps walking, so
 * stepping over a rung that sits too high or too low is ordinary use, and
 * every number derived from "how well did this go" has to ignore it. The
 * skipped reps stay in `results` — the summary still lists them, and they
 * are still part of what happened.
 */
export function sungReps(results: RepResult[]): RepResult[] {
  return results.filter((r) => !r.skipped);
}

/** Mean score across the sung reps. 0 when nothing was sung. */
export function repAvgScore(results: RepResult[]): number {
  const sung = sungReps(results);
  if (sung.length === 0) return 0;
  return Math.round(sung.reduce((a, r) => a + r.score, 0) / sung.length);
}

/** Highest-scoring sung rep, or null when nothing was sung. */
export function bestRep(results: RepResult[]): RepResult | null {
  const sung = sungReps(results);
  if (sung.length === 0) return null;
  return sung.reduce((b, r) => (r.score > b.score ? r : b), sung[0]);
}

export interface SessionSummaryData {
  ex: WarmupExercise;
  results: RepResult[];
  avgScore: number;
  best: RepResult | null;
  xpGained: number;
  newAchievements: Achievement[];
}
