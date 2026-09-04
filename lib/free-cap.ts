"use client";

import { useMemo } from "react";
import { localDay, useProgress, type ActivityType, type ProgressState } from "./progress";
import { useIsPro } from "./pro";

/**
 * The free tier's daily allowance of guided practice.
 *
 * Free accounts get three minutes a day across the rooms that run a scored
 * session — warmups, ear training, breath and song practice. The pitch
 * studio, the range test, the recorder and the tools stay free without a
 * clock: they are the front door, and the range test is what fits every
 * exercise to a voice in the first place. Pro removes the cap.
 *
 * The allowance is measured from the practice log, so it counts what was
 * actually sung and logged, resets with the local calendar day the way the
 * streak does, and needs no second store. A step already under way is never
 * cut off: the check runs where a session or a step starts.
 */
export const FREE_DAILY_SEC = 180;

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

/**
 * The cap as the rooms read it. The server snapshot has no sessions and no
 * entitlement, so it renders uncapped and the client corrects once — the
 * same shape as every other progress read on the site.
 */
export function useFreeCap(): FreeCap {
  const progress = useProgress();
  const isPro = useIsPro();
  return useMemo(() => {
    const usedSec = guidedSecondsToday(progress);
    return {
      isPro,
      usedSec,
      leftSec: isPro ? Number.POSITIVE_INFINITY : Math.max(0, FREE_DAILY_SEC - usedSec),
      capped: !isPro && usedSec >= FREE_DAILY_SEC,
      capSec: FREE_DAILY_SEC,
    };
  }, [progress, isPro]);
}
