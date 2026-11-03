import { FREE_WEEKS, PROGRAMS, isRestDay, type ProgramItem } from "./programs";
import { FREE_DAILY_SEC } from "./practice-limits";
import { MAX_SESSIONS } from "./progress-shape";
import { PREPAINT_CAPPED_TYPES, PREPAINT_KEYS, prepaintScript, type PrepaintConfig } from "./prepaint";
import { BREATH_DRILL_IDS, BREATH_ROUTINES } from "@/components/breath/routines";
import { ALL_ROUTINES } from "@/components/warmups/routines";
import { ALL_EXERCISES, EXERCISES } from "@/components/warmups/exercises";

/**
 * The ear room's workouts, restated rather than imported: components/ear/routines.ts
 * builds them from components/ear/lib.ts, a client module, whose values a
 * server import gets as client references. lib/prepaint.test.ts holds the list
 * to EAR_ROUTINES.
 */
export const PREPAINT_EAR_ROUTINE_IDS = ["quick", "daily", "full", "intervals", "pitch"] as const;

const ids = <T extends { id: string }>(list: readonly T[]) => list.map((x) => x.id);

/**
 * The activity each kind of program row logs (lib/programs.ts itemType),
 * restated because lib/programs.ts itemIsCapped reads lib/free-cap.ts, a
 * client module, whose values a server import gets as client references.
 * A row whose activity the free cap does not count (PREPAINT_CAPPED_TYPES) is
 * open once the cap is reached: the range test and the Recorder.
 * lib/prepaint.test.ts holds the rows this picks to itemIsCapped.
 */
const ROW_TYPE: Record<ProgramItem["kind"], string> = {
  routine: "warmup",
  exercise: "warmup",
  breath: "breath",
  drill: "breath",
  range: "range",
  recorder: "recording",
  ear: "ear",
  song: "song",
};
const CAPPED: readonly string[] = PREPAINT_CAPPED_TYPES;

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
      [
        p.pro ? 1 : 0,
        p.days.length,
        p.days.flatMap((d, i) => (isRestDay(d) ? [i] : [])),
        p.chapters ? "book" : p.id,
        // Per day, the rows outside the cap, for the "waits-open" token.
        Object.fromEntries(
          p.days.flatMap((d, i) => {
            const types = d.items.map((item) => ROW_TYPE[item.kind]).filter((type) => !CAPPED.includes(type));
            return types.length ? [[String(i), types]] : [];
          }),
        ),
      ],
    ]),
  ),
  // What each room opens from its address once hydrated, for the
  // data-sing-deeplink token: the breath room a drill, else a set
  // (components/breath/breath-studio.tsx, its deep-link effect), the warmups
  // room the gate for a routine or an exercise, Pro's only for Pro
  // (components/warmups/warmups-client.tsx canStartRoutine and canStart), the
  // ear room a workout (components/ear/ear-training-client.tsx).
  // lib/prepaint.test.ts holds each list to the room's own.
  deepLinks: {
    "/breath": {
      room: "breath",
      params: { drill: [BREATH_DRILL_IDS, []], routine: [ids(BREATH_ROUTINES), []] },
    },
    "/warmups": {
      room: "warmups",
      params: {
        routine: [ids(ALL_ROUTINES.filter((r) => !r.pro)), ids(ALL_ROUTINES.filter((r) => r.pro))],
        exercise: [ids(EXERCISES), ids(ALL_EXERCISES.filter((e) => !EXERCISES.includes(e)))],
      },
    },
    "/ear-training": {
      room: "ear",
      params: { routine: [PREPAINT_EAR_ROUTINE_IDS, []] },
    },
  },
};

/** The root layout's inline <head> script. */
export const PREPAINT_SCRIPT = prepaintScript(PREPAINT_CONFIG);
