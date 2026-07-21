"use client";

export type Difficulty = "easy" | "medium" | "hard";
export type GameId = "interval" | "pitch-match" | "melody-echo" | "higher-lower";

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

export function bestFor(game: GameId, diff: Difficulty): number | null {
  const v = readBests()[`${game}:${diff}`];
  return typeof v === "number" ? v : null;
}

/** Persist a finished score. Returns true when it's a new personal best. */
export function saveBest(game: GameId, diff: Difficulty, score: number): boolean {
  const bests = readBests();
  const key = `${game}:${diff}`;
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
 * A comfortable register for reference tones: saved range midpoint ±5
 * semitones, else C3–C4.
 */
export function singableRegister(range: {
  lowMidi?: number;
  highMidi?: number;
}): { lo: number; hi: number } {
  if (range.lowMidi !== undefined && range.highMidi !== undefined) {
    const mid = Math.round((range.lowMidi + range.highMidi) / 2);
    return { lo: mid - 5, hi: mid + 5 };
  }
  return { lo: 48, hi: 60 }; // C3–C4
}

/* ---------------- melody generation ---------------- */

const STEPS = [-2, -1, 1, 2];
const LEAPS = [-7, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 7];

export function generateMelody(
  difficulty: Difficulty,
  register: { lo: number; hi: number },
): number[] {
  const len = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5;
  const moves = difficulty === "hard" ? LEAPS : STEPS;
  const { lo, hi } = register;
  const notes: number[] = [randInt(lo + 2, Math.max(lo + 2, hi - 2))];
  while (notes.length < len) {
    const prev = notes[notes.length - 1];
    let next = prev + pick(moves);
    if (next < lo || next > hi) next = prev - (next - prev); // bounce back
    next = Math.min(hi, Math.max(lo, next));
    if (next === prev) next = prev + (prev >= hi ? -1 : 1);
    notes.push(next);
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

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
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
