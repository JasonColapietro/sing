import { FREE_WEEKS, PROGRAMS, isRestDay } from "./programs";
import { FREE_DAILY_SEC } from "./practice-limits";
import { MAX_SESSIONS } from "./progress-shape";
import { PREPAINT_CAPPED_TYPES, PREPAINT_KEYS, prepaintScript, type PrepaintConfig } from "./prepaint";

/**
 * What the pre-paint script needs to know about the app, derived from the
 * same constants the pages use, so it cannot drift from them. Kept apart from
 * lib/prepaint.ts because the programs module is large and only the server
 * (the root layout) needs this.
 */
export const PREPAINT_CONFIG: PrepaintConfig = {
  keys: PREPAINT_KEYS,
  capSec: FREE_DAILY_SEC,
  cappedTypes: PREPAINT_CAPPED_TYPES,
  maxSessions: MAX_SESSIONS,
  freeDays: FREE_WEEKS * 7,
  programs: Object.fromEntries(
    PROGRAMS.map((p) => [
      p.id,
      [p.pro ? 1 : 0, p.days.length, p.days.flatMap((d, i) => (isRestDay(d) ? [i] : [])), p.chapters ? 1 : 0],
    ]),
  ),
};

/** The root layout's inline <head> script. */
export const PREPAINT_SCRIPT = prepaintScript(PREPAINT_CONFIG);
