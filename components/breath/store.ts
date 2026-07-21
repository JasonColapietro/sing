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
