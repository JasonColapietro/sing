"use client";

import { useMemo, useSyncExternalStore } from "react";
import { localDay, useProgress, type ActivityType, type ProgressState } from "./progress";
import { useIsPro } from "./pro";
import { FREE_DAILY_SEC } from "./practice-limits";

// The free tier's daily allowance of guided practice (warmups, ear, breath,
// songs), measured from the practice log and reset with the local day; the
// check runs where a session or a step starts, never mid-step.
export { FREE_DAILY_SEC } from "./practice-limits";

export const CAPPED_TYPES: ReadonlySet<ActivityType> = new Set<ActivityType>([
  "warmup",
  "ear",
  "breath",
  "song",
]);

/** Seconds of guided practice logged on `day` (local calendar day). */
export function guidedSecondsToday(state: ProgressState, day: string = localDay()): number {
  let total = 0;
  for (const s of state.sessions) {
    if (s.day === day && CAPPED_TYPES.has(s.type)) total += s.durationSec;
  }
  return total;
}

/** Seconds of free guided practice still available today. Infinity on Pro. */
export function freeSecondsLeft(
  state: ProgressState,
  isPro: boolean,
  day: string = localDay(),
): number {
  if (isPro) return Number.POSITIVE_INFINITY;
  return Math.max(0, FREE_DAILY_SEC - guidedSecondsToday(state, day));
}

export function isCapped(state: ProgressState, isPro: boolean, day: string = localDay()): boolean {
  return freeSecondsLeft(state, isPro, day) <= 0;
}

/**
 * A room's recommended routine, sized to the free minutes left today: a run
 * that outlasts them stops on the cap slide, so a shorter one from
 * `fallbacks` (shortest first) stands in when it fits. Nothing fits: the
 * pick stands. Pro passes Infinity and always gets `preferred`.
 */
export function sizeToAllowance<T>(
  preferred: T,
  fallbacks: readonly (T | null | undefined)[],
  secondsOf: (routine: T) => number,
  leftSec: number,
): T {
  if (secondsOf(preferred) <= leftSec) return preferred;
  for (const r of fallbacks) {
    if (r != null && secondsOf(r) <= leftSec) return r;
  }
  return preferred;
}

/** "2:10" — for the allowance readouts. */
export function formatClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export interface FreeCap {
  isPro: boolean;
  usedSec: number;
  leftSec: number;
  capped: boolean;
  capSec: number;
}

/** Recheck the local day at midnight and after a suspended tab wakes up. */
export function subscribePracticeDay(onChange: () => void): () => void {
  let timer: number;
  const schedule = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    // Check at least once a minute for clock/time-zone changes, but do not
    // make a singer wait a full minute when midnight falls between ticks.
    timer = window.setTimeout(() => {
      onChange();
      schedule();
    }, Math.min(60_000, midnight.getTime() - now.getTime()));
  };
  const onVisibility = () => {
    if (document.visibilityState === "visible") onChange();
  };
  schedule();
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

const serverDay = () => "";

/**
 * The cap as the rooms read it. The server snapshot has no sessions and no
 * entitlement, so it renders uncapped and the client corrects once — the
 * same shape as every other progress read on the site.
 */
export function useFreeCap(): FreeCap {
  const progress = useProgress();
  const isPro = useIsPro();
  const day = useSyncExternalStore(subscribePracticeDay, localDay, serverDay);
  return useMemo(() => {
    const usedSec = guidedSecondsToday(progress, day);
    return {
      isPro,
      usedSec,
      leftSec: isPro ? Number.POSITIVE_INFINITY : Math.max(0, FREE_DAILY_SEC - usedSec),
      capped: !isPro && usedSec >= FREE_DAILY_SEC,
      capSec: FREE_DAILY_SEC,
    };
  }, [progress, isPro, day]);
}
