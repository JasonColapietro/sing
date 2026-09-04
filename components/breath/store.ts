"use client";

export interface SustainAttempt {
  /** Sustained duration in seconds. */
  sec: number;
  /** Steadiness 0..100 (volume consistency while sustaining). */
  steadiness: number;
  /** ISO timestamp. */
  date: string;
}

export interface BreathData {
  bestSec: number;
  /** Newest first, max 10. */
  attempts: SustainAttempt[];
}

const KEY = "suede-sing:breath:v1";

export const EMPTY_BREATH: BreathData = { bestSec: 0, attempts: [] };

export function loadBreath(): BreathData {
  if (typeof window === "undefined") return EMPTY_BREATH;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY_BREATH;
    const p = JSON.parse(raw) as Partial<BreathData>;
    return {
      bestSec: typeof p.bestSec === "number" ? p.bestSec : 0,
      attempts: Array.isArray(p.attempts) ? p.attempts.slice(0, 10) : [],
    };
  } catch {
    return EMPTY_BREATH;
  }
}

export function recordAttempt(sec: number, steadiness: number): BreathData {
  const cur = loadBreath();
  const next: BreathData = {
    bestSec: Math.max(cur.bestSec, sec),
    attempts: [
      { sec, steadiness, date: new Date().toISOString() },
      ...cur.attempts,
    ].slice(0, 10),
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable — keep in-memory result
  }
  return next;
}

/* ------------------------------------------------------------------ *
 * Bests — what the learning path draws its stars from.
 *
 * `BreathData` above is the sustain test's own history: the last ten attempts
 * and a best, for its chart. The path needs one thing that record never kept —
 * how far the two unscored drills have actually been taken — because a row
 * showing no stars for a drill someone has finished twice is telling them they
 * haven't started.
 *
 * A separate key rather than a new field on `BreathData`: that record belongs
 * to the chart, is trimmed to ten attempts, and has shipped. Bests are
 * monotonic and tiny, and none of them should ever fall out of a window.
 * ------------------------------------------------------------------ */

export interface BreathBests {
  /** Longest sustain ever held, in seconds. */
  sustainSec: number;
  /** Longest box-breathing session run to its end, in minutes. */
  boxMinutes: number;
  /** Highest Farinelli top count reached by finishing the drill. */
  farinelliCap: number;
}

const BESTS_KEY = "suede-sing:breath-bests:v1";

export const EMPTY_BREATH_BESTS: BreathBests = {
  sustainSec: 0,
  boxMinutes: 0,
  farinelliCap: 0,
};

function positive(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0;
}

export function loadBreathBests(): BreathBests {
  if (typeof window === "undefined") return EMPTY_BREATH_BESTS;
  try {
    const raw = window.localStorage.getItem(BESTS_KEY);
    if (!raw) return EMPTY_BREATH_BESTS;
    const p = JSON.parse(raw) as Partial<BreathBests>;
    return {
      sustainSec: positive(p.sustainSec),
      boxMinutes: positive(p.boxMinutes),
      farinelliCap: positive(p.farinelliCap),
    };
  } catch {
    return EMPTY_BREATH_BESTS;
  }
}

/** Raise any of the three bests. Never lowers one: a best is a high-water mark. */
export function recordBreathBest(patch: Partial<BreathBests>): BreathBests {
  const cur = loadBreathBests();
  const next: BreathBests = {
    sustainSec: Math.max(cur.sustainSec, positive(patch.sustainSec)),
    boxMinutes: Math.max(cur.boxMinutes, positive(patch.boxMinutes)),
    farinelliCap: Math.max(cur.farinelliCap, positive(patch.farinelliCap)),
  };
  try {
    window.localStorage.setItem(BESTS_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable — the caller still gets the raised figures
  }
  return next;
}

export type Stars = 0 | 1 | 2 | 3;

/**
 * Stars for a sustain, against the benchmarks the test already prints under its
 * own chart: 10s fair, 20s good, 30s strong. Three stars is "strong", not
 * "excellent" — 45 seconds is a lifetime-goal number, and a path row only a
 * professional can fill is a locked door with no key.
 */
export function starsForSustain(sec: number): Stars {
  if (sec >= 30) return 3;
  if (sec >= 20) return 2;
  if (sec >= 10) return 1;
  return 0;
}

/** Box breathing is scored by sitting through it: a minute earns a star, the five-minute set earns all three. */
export function starsForBox(minutes: number): Stars {
  if (minutes >= 5) return 3;
  if (minutes >= 3) return 2;
  if (minutes >= 1) return 1;
  return 0;
}

/** Farinelli is scored by how high the count climbed: the drill starts at 8 and caps at 12. */
export function starsForFarinelli(cap: number): Stars {
  if (cap >= 12) return 3;
  if (cap >= 10) return 2;
  if (cap >= 1) return 1;
  return 0;
}
