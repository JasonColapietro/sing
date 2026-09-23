// Note Catcher: the rules, with no React, no canvas and no microphone in them.
//
// The game is one continuous clock. Ten targets ride in from the right, one at
// a time, each reaching the catch line at its own `arriveMs` and staying on it
// for the level's `windowMs`. While a target sits on the line the singer's
// voice is the marker: hold within tolerance of the target for `dwellMs` and it
// is caught; let the window run out and it is missed. Every target is one round
// of the shared ear session, so ten targets score out of 100 on the same
// POINTS_PER_ROUND, streak and star thresholds as the other four games.
//
// Tolerance is the ear games' own, deliberately the same as pitch match's: 50
// cents on easy and medium (which is also the songbook's TOLERANCE_CENTS, so a
// note caught here is a note the song player would score), 35 on hard. Easy is
// octave-agnostic, again like pitch match, so a singer with no saved range can
// still catch notes pitched for someone else's voice.
//
// A catch is a *hold*, not a touch. The dwell accumulates while the voice is in
// tolerance and survives a short lapse (a dropped detector frame, a consonant),
// but a real miss longer than GRACE_MS starts the hold again — otherwise sliding
// through the target on the way somewhere else would add up to a catch.

import { ROUNDS, centsToTarget, randInt, singableRegister, type Difficulty } from "./lib";
import type { Song, SongBand } from "@/components/songs/types";
import { SONGS, isProSong } from "@/components/songs/data";
import { bandForSong } from "@/components/songs/lib";

export interface CatcherLevel {
  /** Cents either side of the target that count as on it. */
  tolerance: number;
  /** Continuous in-tolerance time that catches a target. */
  dwellMs: number;
  /** How long a target sits on the catch line before it is gone. */
  windowMs: number;
  /** Quiet time on the line between one target leaving and the next arriving. */
  gapMs: number;
  /** Largest move, in semitones, from one random target to the next. */
  maxStep: number;
  /** Any octave of the target counts, as in pitch match's easy level. */
  octaveAgnostic: boolean;
}

export const CATCHER_LEVELS: Record<Difficulty, CatcherLevel> = {
  easy: { tolerance: 50, dwellMs: 400, windowMs: 2600, gapMs: 900, maxStep: 2, octaveAgnostic: true },
  medium: { tolerance: 50, dwellMs: 500, windowMs: 2000, gapMs: 700, maxStep: 4, octaveAgnostic: false },
  hard: { tolerance: 35, dwellMs: 600, windowMs: 1500, gapMs: 500, maxStep: 7, octaveAgnostic: false },
};

/**
 * How long a lapse out of tolerance may last before the hold starts again.
 * About three analysis frames at 60fps plus the median smoothing's settle.
 */
export const GRACE_MS = 120;

/** Silence before the first target reaches the line, so the singer can find it. */
export const LEAD_IN_MS = 2500;

export interface CatcherTarget {
  midi: number;
  /** Game-clock ms at which this target reaches the catch line. */
  arriveMs: number;
  /** The syllable, when the target came from a song. */
  lyric?: string;
}

/** Register for song targets: the singer's saved range, two semitones in from each edge. */
export function songRegister(range: { lowMidi?: number; highMidi?: number }): {
  lo: number;
  hi: number;
} {
  if (range.lowMidi !== undefined && range.highMidi !== undefined) {
    const lo = range.lowMidi + 2;
    const hi = range.highMidi - 2;
    // A range too narrow to give up four semitones is used whole.
    return hi - lo >= 7 ? { lo, hi } : { lo: range.lowMidi, hi: range.highMidi };
  }
  return { lo: 48, hi: 64 }; // C3–E4: the same floor as singableRegister's fallback
}

/** Arrival times for `n` targets at a level, back to back with the level's gap. */
export function arrivalTimes(n: number, level: CatcherLevel): number[] {
  const spacing = level.windowMs + level.gapMs;
  return Array.from({ length: n }, (_, i) => LEAD_IN_MS + i * spacing);
}

/**
 * Ten random targets inside the comfortable register, moving at most the
 * level's step each time and never repeating a pitch back to back — a repeat
 * would be caught by a singer who simply had not moved.
 */
export function randomTargets(
  difficulty: Difficulty,
  range: { lowMidi?: number; highMidi?: number },
  rand: (lo: number, hi: number) => number = randInt,
): CatcherTarget[] {
  const level = CATCHER_LEVELS[difficulty];
  const { lo, hi } = singableRegister(range);
  const times = arrivalTimes(ROUNDS, level);
  const midis: number[] = [rand(lo, hi)];
  while (midis.length < ROUNDS) {
    const prev = midis[midis.length - 1];
    let step = rand(-level.maxStep, level.maxStep - 1);
    if (step >= 0) step += 1; // skip zero: [-max, -1] ∪ [1, max]
    let next = prev + step;
    if (next < lo || next > hi) next = prev - step; // bounce off the edge
    next = Math.min(hi, Math.max(lo, next));
    if (next === prev) next = prev + (prev >= hi ? -1 : 1);
    midis.push(next);
  }
  return midis.map((midi, i) => ({ midi, arriveMs: times[i] }));
}

/**
 * The semitone shift that centres a melody inside a register. Unlike the song
 * player's transpose this is not clamped to an octave: the catcher's register
 * is a place on the singer's voice, and a song written two octaves away should
 * still land there.
 */
export function centreShift(midis: readonly number[], register: { lo: number; hi: number }): number {
  if (midis.length === 0) return 0;
  const songCentre = (Math.min(...midis) + Math.max(...midis)) / 2;
  return Math.round((register.lo + register.hi) / 2 - songCentre);
}

/**
 * Targets from the opening of a song: its first ten notes in order (the phrase
 * again from the top if it is shorter), transposed as a whole so the melody sits
 * in the middle of the singer's range. The contour is kept exactly; nothing is
 * folded note by note, because a melody with one note an octave off is not the
 * song any more.
 */
export function songTargets(song: Song, register: { lo: number; hi: number }, difficulty: Difficulty): CatcherTarget[] {
  const level = CATCHER_LEVELS[difficulty];
  const notes = song.notes;
  if (notes.length === 0) return [];
  const shift = centreShift(
    notes.map((n) => n.midi),
    register,
  );
  const times = arrivalTimes(ROUNDS, level);
  return times.map((arriveMs, i) => {
    const n = notes[i % notes.length];
    return { midi: n.midi + shift, arriveMs, lyric: n.lyric };
  });
}

/**
 * The songs Note catcher can chase: the free book's short phrases from the
 * songbook's first two bands, easiest band first. The same songs a singer
 * meets first in the songs room, so chasing one is a step toward singing it.
 * Pro songs are never offered — the ear room has no paywall to route through.
 */
export const CHASE_BANDS: readonly SongBand[] = ["first", "easy"];

export function chaseSongs(songs: readonly Song[] = SONGS): Song[] {
  const rank = (s: Song) => CHASE_BANDS.indexOf(bandForSong(s));
  return songs
    .filter((s) => !isProSong(s.id) && s.form === "phrase" && rank(s) >= 0)
    .map((s, i) => ({ s, i }))
    .sort((a, b) => rank(a.s) - rank(b.s) || a.i - b.i)
    .map(({ s }) => s);
}

/** The difficulty a song chase plays at: easy's timing, and any octave counts. */
export const CHASE_DIFFICULTY: Difficulty = "easy";

/* ---------------- the clock ---------------- */

export interface CatcherState {
  /** Game-clock ms: accumulated capped frame deltas, paused time excluded. */
  elapsed: number;
  /** The next unresolved target; equals targets.length once all are resolved. */
  index: number;
  /** In-tolerance ms towards the current target's dwell. */
  heldMs: number;
  /** Out-of-tolerance ms since the voice was last on the current target. */
  lapseMs: number;
  /** One per resolved target, in order: true caught, false missed. */
  results: boolean[];
}

export const INITIAL_CATCHER: CatcherState = {
  elapsed: 0,
  index: 0,
  heldMs: 0,
  lapseMs: 0,
  results: [],
};

/** Whether target `t`'s window is open at game time `elapsed`. */
export function onLine(t: CatcherTarget, elapsed: number, level: CatcherLevel): boolean {
  return elapsed >= t.arriveMs && elapsed < t.arriveMs + level.windowMs;
}

/**
 * Advance the game by one frame.
 *
 * `midiFloat` is the singer's pitch this frame, or null when nothing fresh and
 * voiced was heard. `dtMs` must already be capped (lib/audio/frame-clock): an
 * uncapped delta after a hidden tab would be credited as dwell in one go.
 * Returns a new state; the input is never mutated.
 */
export function tickCatcher(
  state: CatcherState,
  dtMs: number,
  midiFloat: number | null,
  targets: readonly CatcherTarget[],
  level: CatcherLevel,
): CatcherState {
  const elapsed = state.elapsed + dtMs;
  const t = targets[state.index];
  if (!t) return { ...state, elapsed };

  // Gone past the line: missed. Checked before the dwell so a frame landing
  // after the window closes cannot catch it late.
  if (elapsed >= t.arriveMs + level.windowMs) {
    return {
      elapsed,
      index: state.index + 1,
      heldMs: 0,
      lapseMs: 0,
      results: [...state.results, false],
    };
  }
  // Not on the line yet: nothing to hold, and nothing carries over into it.
  if (elapsed < t.arriveMs) return { ...state, elapsed, heldMs: 0, lapseMs: 0 };

  // Only the part of this frame after the target arrived counts.
  const dt = Math.min(dtMs, elapsed - t.arriveMs);
  const inTune =
    midiFloat !== null &&
    Math.abs(centsToTarget(midiFloat, t.midi, level.octaveAgnostic)) <= level.tolerance;

  let heldMs = state.heldMs;
  let lapseMs = state.lapseMs;
  if (inTune) {
    heldMs += dt;
    lapseMs = 0;
  } else {
    lapseMs += dt;
    if (lapseMs > GRACE_MS) heldMs = 0;
  }

  if (heldMs >= level.dwellMs) {
    return {
      elapsed,
      index: state.index + 1,
      heldMs: 0,
      lapseMs: 0,
      results: [...state.results, true],
    };
  }
  return { elapsed, index: state.index, heldMs, lapseMs, results: state.results };
}

/** Whether every target has been caught or missed. */
export function catcherDone(state: CatcherState, targets: readonly CatcherTarget[]): boolean {
  return state.index >= targets.length;
}

/* ---------------- display ---------------- */

/**
 * Where the marker should be drawn for a sung pitch. On an octave-agnostic
 * level the voice is shifted by whole octaves to sit nearest `anchor` (the
 * current target), so a singer an octave below the lanes still sees their
 * marker on the target they are catching rather than pinned off the bottom.
 */
export function markerMidi(midiFloat: number, anchor: number, octaveAgnostic: boolean): number {
  if (!octaveAgnostic) return midiFloat;
  return anchor + centsToTarget(midiFloat, anchor, true) / 100;
}

/** "18 cents sharp", "in tune", "2 semitones flat" — the screen-reader readout's distance. */
export function describeOffset(cents: number, tolerance: number): string {
  const abs = Math.abs(cents);
  if (abs <= tolerance) return "on the note";
  const dir = cents > 0 ? "sharp" : "flat";
  if (abs < 150) return `${Math.round(abs)} cents ${dir}`;
  const semis = Math.round(abs / 100);
  return `${semis} semitones ${dir}`;
}
