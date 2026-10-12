import { localDay, type ProgressState } from "@/lib/progress";

/**
 * Clerk-free account helpers, shared by the header (components/nav.tsx) and
 * the in-page save prompt. They live apart from save-prompt.tsx so the nav,
 * which renders on every page, does not import a module that pulls in Clerk.
 *
 * liveStreak is also the streak every practice room shows (warmups, ear
 * training, breath, the free-cap wall), so this module must keep importing
 * nothing but lib/progress.
 */

/**
 * The streak a singer still has today: `streak.current` while the last
 * practice day is today or yesterday, and 0 once it has lapsed.
 *
 * `streak.current` is only recomputed when a session is logged, so it keeps
 * its old value for days after the streak has actually died, and the next
 * session resets it to 1. Anything that names the streak to a returning singer
 * has to read it through this, or a long-dead streak is presented as live.
 * The header chip's "none" state (streakChipState in nav.tsx) is defined by
 * this too, so the two cannot disagree.
 */
export function liveStreak(
  streak: { current: number; lastDay: string | null },
  now: Date = new Date(),
): number {
  if (streak.current <= 0 || !streak.lastDay) return 0;
  const previousDay = new Date(now);
  previousDay.setDate(previousDay.getDate() - 1);
  return streak.lastDay === localDay(now) ||
    streak.lastDay === localDay(previousDay)
    ? streak.current
    : 0;
}

/**
 * True once the visitor has practice worth losing.
 *
 * Deliberately independent of the caller's own trigger. A wiring mistake that
 * drops this on a cold page is a wall in disguise on a site whose entire funnel
 * is organic search, so the save prompt refuses on its own evidence as well as
 * on the caller's. Recorded takes are covered by `sessions`: they land there
 * as type "recording" (lib/progress.ts ActivityType).
 */
export function hasSomethingToSave(s: ProgressState, now: Date = new Date()): boolean {
  return (
    s.sessions.length > 0 ||
    liveStreak(s.streak, now) >= 2 ||
    s.range.lowMidi !== undefined
  );
}
