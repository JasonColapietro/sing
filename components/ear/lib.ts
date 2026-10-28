"use client";

import { median } from "@/lib/audio/median";

export type Difficulty = "easy" | "medium" | "hard";
export type GameId =
  | "interval"
  | "pitch-match"
  | "melody-echo"
  | "higher-lower"
  | "note-catcher";

export const ROUNDS = 10;
export const POINTS_PER_ROUND = 10;

export const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

export const GAME_NAMES: Record<GameId, string> = {
  interval: "Interval ID",
  "pitch-match": "Pitch match",
  "melody-echo": "Melody echo",
  "higher-lower": "Higher or lower",
  "note-catcher": "Note catcher",
};

/* ---------------- high scores ---------------- */

const BEST_KEY = "suede-sing:ear-best:v1";

export function readBests(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, number>)
      : {};
  } catch {
    return {};
  }
}

/**
 * The key a best is stored under. `variant` separates runs of one game that
 * are not comparable — Note catcher chasing a song keeps a best per song, apart
 * from its random-target levels — and is absent for everything else, so every
 * key written before it existed still reads back.
 */
export function bestKey(game: GameId, diff: Difficulty, variant?: string): string {
  return variant ? `${game}:${diff}:${variant}` : `${game}:${diff}`;
}

/** Persist a finished score. Returns true when it's a new personal best. */
export function saveBest(
  game: GameId,
  diff: Difficulty,
  score: number,
  variant?: string,
): boolean {
  const bests = readBests();
  const key = bestKey(game, diff, variant);
  const prev = bests[key];
  if (typeof prev === "number" && prev >= score) return false;
  bests[key] = score;
  try {
    window.localStorage.setItem(BEST_KEY, JSON.stringify(bests));
  } catch {
    // storage unavailable — best simply isn't remembered
  }
  return true;
}

/* ---------------- randomness ---------------- */

/** Random integer in [lo, hi], inclusive. */
export function randInt(lo: number, hi: number): number {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ---------------- intervals ---------------- */

export const INTERVAL_NAMES: Record<number, string> = {
  0: "Unison",
  1: "Minor second",
  2: "Major second",
  3: "Minor third",
  4: "Major third",
  5: "Perfect fourth",
  6: "Tritone",
  7: "Perfect fifth",
  8: "Minor sixth",
  9: "Major sixth",
  10: "Minor seventh",
  11: "Major seventh",
  12: "Octave",
};

/**
 * The interval's name in lower case with its article, for feedback lines:
 * "an octave", "a perfect fifth". Only "octave" opens on a vowel sound;
 * "unison" starts with a "yoo" and keeps "a".
 */
export function intervalWithArticle(semi: number): string {
  const name = INTERVAL_NAMES[semi].toLowerCase();
  return `${name.startsWith("o") ? "an" : "a"} ${name}`;
}

export const INTERVAL_SETS: Record<Difficulty, number[]> = {
  easy: [0, 4, 7, 12],
  medium: [0, 3, 4, 5, 7, 9, 12],
  hard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

/** Shortcut keys for answer buttons, in display order. */
export const SHORTCUT_KEYS = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=",
];

/* ---------------- register ---------------- */

/**
 * A comfortable register for the notes the games ask a singer to sing: saved
 * range midpoint ±5 semitones, kept inside the measured range, else C3–C4.
 *
 * With a range saved, medium and hard score the exact octave, so a target
 * outside a narrow range fails the singer for being out of range rather than
 * out of tune.
 */
export function singableRegister(range: {
  lowMidi?: number;
  highMidi?: number;
}): { lo: number; hi: number } {
  if (range.lowMidi !== undefined && range.highMidi !== undefined) {
    const mid = Math.round((range.lowMidi + range.highMidi) / 2);
    // Kept inside a narrow measured range, as songRegister does. A span under
    // five semitones (saved before the range test's minimum) is not a
    // measurement, so it keeps the ±5 band instead of a register too small
    // to hold a melody.
    const lo = Math.max(range.lowMidi, mid - 5);
    const hi = Math.min(range.highMidi, mid + 5);
    return hi - lo >= 5 ? { lo, hi } : { lo: mid - 5, hi: mid + 5 };
  }
  return { lo: 48, hi: 60 }; // C3–C4
}

/**
 * Whether a range test result is saved. Without one the games pitch their
 * notes for a C3–C4 register that many voices cannot reach, so every sung
 * game counts any octave until there is a range to place the notes in.
 */
export function hasSavedRange(range: { lowMidi?: number; highMidi?: number }): boolean {
  return range.lowMidi !== undefined && range.highMidi !== undefined;
}

/* ---------------- melody generation ---------------- */

/** Semitones of the major scale's seven degrees above its tonic. */
const MAJOR = [0, 2, 4, 5, 7, 9, 11];

/**
 * A short melody to echo, inside one major key and inside `register`.
 *
 * Beginner ear training starts from diatonic shapes (do-re-mi, sol-fa-mi), so
 * every melody stays in a key: easy and medium move by scale step, hard leaps
 * up to a fifth. Random semitone moves with no key gave clusters like D3 D#3
 * E3, which are hard to hear and to sing back and carry over to no song.
 * Each next note is drawn only from degrees inside the register and never
 * repeats the last one, so nothing has to bounce off the edges.
 */
export function generateMelody(
  difficulty: Difficulty,
  register: { lo: number; hi: number },
): number[] {
  const len = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5;
  // In scale degrees: neighbours only, or up to four degrees (a fifth) on hard.
  const maxStep = difficulty === "hard" ? 4 : 1;
  const { lo, hi } = register;
  // Low enough that the first five degrees, do to sol, all fit.
  const tonic = randInt(lo, Math.max(lo, hi - 7));
  const toMidi = (d: number) => tonic + 12 * Math.floor(d / 7) + MAJOR[((d % 7) + 7) % 7];
  const inRange: number[] = [];
  for (let d = -7; d <= 14; d++) {
    const m = toMidi(d);
    if (m >= lo && m <= hi) inRange.push(d);
  }
  // Starts on do to sol, as far as the register holds them: a five- or
  // six-semitone register has no room for sol above the tonic.
  let deg = pick(inRange.filter((d) => d >= 0 && d <= 4));
  const notes = [toMidi(deg)];
  while (notes.length < len) {
    const prev = deg;
    deg = pick(inRange.filter((d) => d !== prev && Math.abs(d - prev) <= maxStep));
    notes.push(toMidi(deg));
  }
  return notes;
}

/* ---------------- pitch comparison ---------------- */

/**
 * Signed cents from a sung frequency to a target midi. When octaveAgnostic,
 * the distance is folded to the nearest octave of the target (range -600..600).
 */
export function centsToTarget(
  midiFloat: number,
  targetMidi: number,
  octaveAgnostic: boolean,
): number {
  let d = midiFloat - targetMidi;
  if (octaveAgnostic) {
    d = ((d % 12) + 12) % 12;
    if (d > 6) d -= 12;
  }
  return d * 100;
}

/**
 * How far from the target, in cents, a pitch-match note may sit and still
 * count as held. A practice window, far wider than the ±15-cent in-tune zone
 * (IN_TUNE_CENTS in lib/audio/notes.ts), so copy names the band rather than
 * calling a held note "in tune".
 */
export function pitchMatchTolerance(difficulty: Difficulty): number {
  return difficulty === "hard" ? 35 : 50;
}

/* ---------------- holding a note ---------------- */

/** A sung hold under way: ms in the band so far, and ms out of it since the voice was last in. */
export interface HoldState {
  readonly held: number;
  readonly lapse: number;
}

/** Where every hold starts. Shared, so frozen: advanceHold returns new states. */
export const NO_HOLD: HoldState = Object.freeze({ held: 0, lapse: 0 });

/**
 * Advance a hold by one frame of `dt` ms (already capped, lib/audio/frame-clock).
 *
 * A hold is continuous. Time in the band adds up and survives a lapse of up to
 * `graceMs` (a dropped detector frame, a consonant, a vibrato swing past the
 * band's edge), but a real miss longer than that starts it again. Without the
 * reset, a voice hunting around the target added its passes through the band
 * into a "held" note it never sang steadily. Note catcher's dwell keeps the
 * same rule with the same grace (note-catcher.ts GRACE_MS), which callers
 * pass in. Returns a new state; the input is never mutated.
 */
export function advanceHold(
  state: HoldState,
  dt: number,
  inBand: boolean,
  graceMs: number,
): HoldState {
  if (inBand) return { held: state.held + dt, lapse: 0 };
  const lapse = state.lapse + dt;
  return { held: lapse > graceMs ? 0 : state.held, lapse };
}

/** Whether a detected midi matches a target, octave-agnostic or exact. */
export function midiMatches(
  detected: number,
  target: number,
  octaveAgnostic: boolean,
): boolean {
  return octaveAgnostic
    ? ((detected - target) % 12 + 12) % 12 === 0
    : detected === target;
}

/* ---------------- sung-note segmentation ---------------- */

export interface VoicedFrame {
  t: number; // ms
  midi: number; // float
}

/**
 * Segment a stream of voiced pitch frames into discrete sung notes.
 * A new note starts after an unvoiced gap or a sustained pitch jump; only
 * stretches lasting >= minMs survive. Returns rounded median midi per note.
 */
export function segmentNotes(frames: VoicedFrame[], minMs = 250): number[] {
  const notes: number[] = [];
  let seg: VoicedFrame[] = [];

  const close = () => {
    if (seg.length >= 2 && seg[seg.length - 1].t - seg[0].t >= minMs) {
      notes.push(Math.round(median(seg.map((f) => f.midi))));
    }
    seg = [];
  };

  for (const f of frames) {
    if (seg.length === 0) {
      seg.push(f);
      continue;
    }
    const last = seg[seg.length - 1];
    const gap = f.t - last.t;
    const drift = Math.abs(f.midi - median(seg.map((x) => x.midi)));
    if (gap > 180 || drift > 0.75) {
      close();
      seg.push(f);
    } else {
      seg.push(f);
    }
  }
  close();
  return notes;
}
