"use client";

import type { Segment, WarmupExercise } from "./exercises";
import { buildSegments } from "./exercises";
import { playSequence, playTone } from "@/lib/audio/synth";
import type { Achievement, WarmupMode } from "@/lib/progress";
import type { NoteScore } from "@/lib/analytics";

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
    // playSequence starts at `at`, so an unscored lead delays it to the first
    // segment, and the guide comes in where the scored note does.
    playSequence(
      segs.map((s) => s.startMidi),
      { noteDur, gap, gain, at: at + (segs[0]?.t0 ?? 0), out },
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
  /** How the session was sung — the two modes are scored as different things. */
  mode: WarmupMode;
  /**
   * Whether the guide the slider governs was heard during the scored reps
   * (GuideHeard). Absent on a summary the player did not build; the summary
   * then reads the slider as it stands.
   */
  guide?: GuideHeard;
}

/* ------------------------------------------------------------ the guide */

/**
 * What the singer heard of the guide the level slider governs, over a
 * session's scored reps: on for all of them, off for all of them, or on for
 * part of that time and off for the rest, whether the level changed between
 * reps or during one. In sing-along that guide sounds under the voice;
 * in call-and-response it is the reference before each rep (exercise-player).
 * The summary's "what this score measured" line used to read the slider as
 * it stood at End, so a session sung with the guide off and turned up just
 * before End said the guide had been sounding, and the reverse.
 */
export type GuideHeard = "on" | "off" | "partly";

/** Whether the governed guide was heard on any frame of a stretch, and silent on any. */
export interface GuideTrace {
  on: boolean;
  off: boolean;
}

export const EMPTY_GUIDE_TRACE: GuideTrace = { on: false, off: false };

/**
 * Whether the governed guide is sounding at this point of a rep, or null
 * outside the stretch it plays in: the scored window in sing-along (the
 * guide under the voice; rep 0's teach pass plays at full level whatever the
 * slider says), the teach pass in call-and-response. The pass is scheduled
 * only when the level is above Off as the rep is laid out (`scheduled`), and
 * the slider carries its gain from there, so it sounds while both hold.
 */
export function governedGuideAudible(opts: {
  underVoice: boolean;
  stage: "teach" | "lead" | "sing";
  scheduled: boolean;
  pct: number;
}): boolean | null {
  if (opts.stage !== (opts.underVoice ? "sing" : "teach")) return null;
  return opts.scheduled && opts.pct > 0;
}

/** `t` with one more frame folded in. Unchanged (the same object) when it adds nothing. */
export function traceGuide(t: GuideTrace, audible: boolean): GuideTrace {
  if (audible ? t.on : t.off) return t;
  return audible ? { ...t, on: true } : { ...t, off: true };
}

/** Two traces as one: a scored rep folded into the session's. */
export function mergeGuide(a: GuideTrace, b: GuideTrace): GuideTrace {
  return { on: a.on || b.on, off: a.off || b.off };
}

/** The trace as the summary words it, or undefined when nothing was traced. */
export function guideHeard(t: GuideTrace): GuideHeard | undefined {
  if (t.on && t.off) return "partly";
  if (t.on) return "on";
  if (t.off) return "off";
  return undefined;
}
