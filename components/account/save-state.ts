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

/** How far practice must run past the last backup file before a fresh one is offered. */
export const BACKUP_REFRESH_MS = 14 * 86_400_000;

/**
 * Where the singer's backup file stands against the record, for the file
 * backup the save prompt offers while accounts are off.
 *
 * A download is not a dismissal. A file saved on day 3 restores day 3, so once
 * the singer has practised more than BACKUP_REFRESH_MS past it the file is
 * stale and the card asks again, naming how many sessions the file is
 * missing. `fileAt` is the stored ISO time of the last download; null or an
 * unreadable value means no file, which is always worth offering.
 */
export function backupFileStatus(
  sessions: ProgressState["sessions"],
  fileAt: string | null,
): { hasFile: boolean; stale: boolean; sessionsSince: number } {
  const at = fileAt ? Date.parse(fileAt) : NaN;
  if (!Number.isFinite(at)) {
    return { hasFile: false, stale: true, sessionsSince: sessions.length };
  }
  let sessionsSince = 0;
  let stale = false;
  for (const s of sessions) {
    const when = Date.parse(s.date);
    if (!(when > at)) continue;
    sessionsSince++;
    if (when - at > BACKUP_REFRESH_MS) stale = true;
  }
  return { hasFile: true, stale, sessionsSince };
}
