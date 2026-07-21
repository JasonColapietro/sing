"use client";

import type { Segment, WarmupExercise } from "./exercises";
import { buildSegments } from "./exercises";
import { playSequence, playTone } from "@/lib/audio/synth";
import type { Achievement } from "@/lib/progress";

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
 */
export function playGuide(
  ex: WarmupExercise,
  rootMidi: number,
  tempo: number,
): { segs: Segment[]; totalSec: number } {
  const { segs, totalSec, noteDur, gap } = buildSegments(ex, rootMidi, tempo);
  if (ex.glide) {
    for (const seg of segs) {
      playTone(seg.startMidi, {
        dur: seg.dur,
        at: seg.t0,
        gain: 0.22,
        glideToMidi: seg.endMidi !== seg.startMidi ? seg.endMidi : undefined,
      });
    }
  } else {
    playSequence(
      segs.map((s) => s.startMidi),
      { noteDur, gap, gain: 0.22 },
    );
  }
  return { segs, totalSec };
}

export interface RepResult {
  root: number;
  score: number;
  avgCentsErr: number;
  skipped: boolean;
}

export function repAvgScore(results: RepResult[]): number {
  if (results.length === 0) return 0;
  return Math.round(results.reduce((a, r) => a + r.score, 0) / results.length);
}

export function bestRep(results: RepResult[]): RepResult | null {
  if (results.length === 0) return null;
  return results.reduce((b, r) => (r.score > b.score ? r : b), results[0]);
}

export interface SessionSummaryData {
  ex: WarmupExercise;
  results: RepResult[];
  avgScore: number;
  best: RepResult | null;
  xpGained: number;
  newAchievements: Achievement[];
}
