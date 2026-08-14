"use client";

import { useSyncExternalStore } from "react";

/**
 * Vocal dose accumulation.
 *
 * The two measures here come from the vocal-dosimetry literature (Titze &
 * Hunter) and are computed from pitch and time alone:
 *
 * - **Phonation time** — seconds the voice was actually sounding.
 * - **Cycle dose** — the number of times the vocal folds have opened and
 *   closed, which is just fundamental frequency integrated over phonation
 *   time. An hour of practice at A4 is roughly six times the folds' work of an
 *   hour at A2, and neither a stopwatch nor a level meter shows that.
 *
 * Everything below is pure except `load`/`save`, which are the only functions
 * that touch storage.
 */

/** One local calendar day of accumulated dose. */
export interface DoseDay {
  /** YYYY-MM-DD, local. */
  day: string;
  /** Seconds of confidently voiced audio. */
  phonationSec: number;
  /** Vocal-fold vibration cycles. */
  cycles: number;
}

export interface DoseState {
  days: DoseDay[];
}

export const EMPTY_DOSE: DoseState = { days: [] };

/** Days retained. Enough for the 7-day strip plus context, bounded so the key can't grow forever. */
const KEEP_DAYS = 30;

const KEY = "suede-sing:dose:v1";

/** Local calendar day key. Mirrors `localDay` in lib/progress.ts. */
export function doseDay(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Fold one analysis frame into the state.
 *
 * `f0` null means the frame was unvoiced — breath, silence, room noise — and
 * contributes nothing. That is the whole reason the dose is trustworthy: it
 * counts singing, not sitting with the page open.
 */
export function accumulate(
  state: DoseState,
  input: { day: string; f0: number | null; dtSec: number },
): DoseState {
  const { day, f0, dtSec } = input;
  if (f0 === null || !(f0 > 0) || !(dtSec > 0)) return state;

  const days = state.days.slice();
  const i = days.findIndex((d) => d.day === day);
  const prev = i >= 0 ? days[i] : { day, phonationSec: 0, cycles: 0 };
  const next: DoseDay = {
    day,
    phonationSec: prev.phonationSec + dtSec,
    cycles: prev.cycles + f0 * dtSec,
  };
  if (i >= 0) days[i] = next;
  else days.push(next);

  days.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
  return { days: days.slice(-KEEP_DAYS) };
}

/** Today's totals, zeroed if nothing has been sung yet. */
export function today(state: DoseState, day: string = doseDay()): DoseDay {
  return state.days.find((d) => d.day === day) ?? { day, phonationSec: 0, cycles: 0 };
}

/**
 * The last `n` calendar days ending at `endDay`, oldest first, with silent days
 * present as zeroes so a chart shows the gaps instead of closing them up.
 */
export function recentDays(
  state: DoseState,
  n: number,
  endDay: string = doseDay(),
): DoseDay[] {
  const end = new Date(`${endDay}T12:00:00`);
  const out: DoseDay[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 24 * 3600 * 1000);
    out.push(today(state, doseDay(d)));
  }
  return out;
}

/** "1.2M cycles", "84k cycles", "310 cycles". */
export function fmtCycles(cycles: number): string {
  const c = Math.round(cycles);
  if (c >= 1_000_000) return `${(c / 1_000_000).toFixed(c < 10_000_000 ? 1 : 0)}M`;
  if (c >= 1_000) return `${(c / 1_000).toFixed(c < 10_000 ? 1 : 0)}k`;
  return String(c);
}

let cache: DoseState | null = null;
const listeners = new Set<() => void>();
let storageBound = false;

export function load(): DoseState {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY_DOSE;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<DoseState>) : null;
    cache = Array.isArray(parsed?.days)
      ? { days: parsed.days.filter((d) => typeof d?.day === "string") }
      : EMPTY_DOSE;
  } catch {
    cache = EMPTY_DOSE;
  }
  return cache;
}

export function save(state: DoseState): void {
  cache = state;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable (private mode, quota). The session keeps its
      // in-memory total; only the history is lost, which is the right half to
      // drop.
    }
  }
  for (const l of listeners) l();
}

function subscribe(cb: () => void): () => void {
  if (!storageBound && typeof window !== "undefined") {
    storageBound = true;
    // Another tab practising writes the same key; drop the cache so this tab
    // re-reads instead of showing a total that stopped growing.
    window.addEventListener("storage", (e) => {
      if (e.key === KEY) {
        cache = null;
        for (const l of listeners) l();
      }
    });
  }
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Subscribe a component to the dose history. */
export function useDose(): DoseState {
  return useSyncExternalStore(subscribe, load, () => EMPTY_DOSE);
}
