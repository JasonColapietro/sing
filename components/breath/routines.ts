// Breath routines: fixed sequences of the three breath drills, so the room has
// something a singer can start rather than three tabs to choose between.
//
// The room used to be a tab strip — Sustain test / Box breathing / Farinelli
// drill — with a setup card behind each one. That is a reference shelf: it
// tells a singer what exists and nothing about what to do, in what order, for
// how long. Every structured course answers the second question instead, and
// the warmups room already does (`components/warmups/routines.ts`). This is the
// same idea for breath, with the same shape: a routine you start, steps that
// advance themselves, a results screen at the end.
//
// The one rule here is that the length on the card is arithmetic, not a guess.
// `breathRoutineSeconds` runs the same sums the drills themselves run — box's
// whole-cycle rounding, Farinelli's 3n counts per round plus its lead-in — so a
// preset that changes moves the estimate in the same commit.

import type { LogResult } from "@/lib/progress";

export type BreathStep =
  | { drill: "box"; side: number; minutes: 1 | 3 | 5 }
  | { drill: "farinelli"; cap: number }
  | { drill: "sustain"; attempts: number };

export type BreathDrillId = BreathStep["drill"];

export interface BreathRoutine {
  id: string;
  name: string;
  /** One line, in the singer's terms, for the card and the session header. */
  tagline: string;
  steps: BreathStep[];
}

/** What a drill hands back when it finishes, however it finished. */
export interface BreathDrillResult {
  durationSec: number;
  /** Only the sustain test scores; the guided drills are pass/fail by doing them. */
  score: number | null;
  /** Null when the run was too short to log — see each drill's MIN_LOG_SEC. */
  logged: LogResult | null;
  /** The one line the results screen puts next to the step, e.g. "18.4 s". */
  label: string;
}

/**
 * Seconds the intro card holds before a step starts itself. Same as the warmups
 * runner: long enough to read the title and the preset, short enough that a
 * singer who has done this before is never waiting on the app.
 */
export const BREATH_STEP_INTRO_SEC = 4;

/** Farinelli's lead-in before the first count, from `farinelli-drill.tsx`. */
export const FARINELLI_LEAD_SEC = 1.5;

/** Farinelli climbs from four counts to the cap. */
export const FARINELLI_START_N = 4;

/**
 * What one sustain attempt costs in wall-clock time.
 *
 * There is no arithmetic for this one — the attempt is over when the singer
 * runs out of air. Twenty-five seconds is the middle of our own benchmark table
 * (10s fair, 20s good, 30s strong, 45s excellent) plus the couple of seconds
 * between arming and the first sound, which is close enough for a "~7 min" on a
 * card and honest about being an estimate.
 */
export const SUSTAIN_ATTEMPT_SEC = 25;

export const BREATH_ROUTINES: BreathRoutine[] = [
  {
    id: "quick",
    name: "Quick breath",
    tagline:
      "Three minutes to settle: one round of the square, the climbing count, and a single sustain.",
    steps: [
      { drill: "box", side: 4, minutes: 1 },
      { drill: "farinelli", cap: 8 },
      { drill: "sustain", attempts: 1 },
    ],
  },
  {
    id: "daily",
    name: "Daily breath",
    tagline:
      "The everyday set: three minutes around the square, the four-to-eight climb, then two measured sustains.",
    steps: [
      { drill: "box", side: 4, minutes: 3 },
      { drill: "farinelli", cap: 8 },
      { drill: "sustain", attempts: 2 },
    ],
  },
  {
    id: "builder",
    name: "Breath builder",
    tagline:
      "Longer sides, a higher count and three sustains — the set that grows the air supply rather than steadying it.",
    steps: [
      { drill: "box", side: 5, minutes: 3 },
      { drill: "farinelli", cap: 10 },
      { drill: "sustain", attempts: 3 },
    ],
  },
];

export function breathRoutineById(id: string | null | undefined): BreathRoutine | null {
  if (!id) return null;
  return BREATH_ROUTINES.find((r) => r.id === id) ?? null;
}

/**
 * Box finishes on a completed cycle at or after the chosen length — the same
 * rounding `BoxBreathing.begin` does, because a singer left mid-exhale by a
 * timer that expired is a worse ending than eight extra seconds.
 */
export function boxSeconds(step: { side: number; minutes: number }): number {
  const cycle = step.side * 4;
  return Math.ceil((step.minutes * 60) / cycle) * cycle;
}

/** One beat per second: rounds of inhale N / hold N / exhale N for N = 4..cap. */
export function farinelliSeconds(step: { cap: number }): number {
  let beats = 0;
  for (let n = FARINELLI_START_N; n <= step.cap; n++) beats += 3 * n;
  return beats + FARINELLI_LEAD_SEC;
}

/**
 * How high the climb actually got, given the seconds of counts that elapsed.
 *
 * The inverse of `farinelliSeconds`, and the reason it exists: a drill stopped
 * early reports the seconds it ran, and a results screen that hands out three
 * stars for three seconds of an eight-count climb is lying to the singer. The
 * lead-in is not counted here because the drill measures from the first beat.
 */
export function farinelliCapReached(sec: number, cap = 12): number {
  let left = sec;
  let reached = 0;
  for (let n = FARINELLI_START_N; n <= cap; n++) {
    if (left < 3 * n) break;
    left -= 3 * n;
    reached = n;
  }
  return reached;
}

export function breathStepSeconds(step: BreathStep): number {
  switch (step.drill) {
    case "box":
      return boxSeconds(step);
    case "farinelli":
      return farinelliSeconds(step);
    default:
      return step.attempts * SUSTAIN_ATTEMPT_SEC;
  }
}

export function breathRoutineSeconds(r: BreathRoutine): number {
  return r.steps.reduce(
    (a, s) => a + breathStepSeconds(s) + BREATH_STEP_INTRO_SEC,
    0,
  );
}

export function breathRoutineMinutes(r: BreathRoutine): number {
  return Math.max(1, Math.round(breathRoutineSeconds(r) / 60));
}

/** The drill's own name, as it appears everywhere in the room. */
export function breathDrillTitle(drill: BreathDrillId): string {
  switch (drill) {
    case "box":
      return "Box breathing";
    case "farinelli":
      return "Farinelli drill";
    default:
      return "Sustain test";
  }
}

export function breathStepTitle(step: BreathStep): string {
  return breathDrillTitle(step.drill);
}

/**
 * The preset in one line. This is the session shell's subtitle, the intro
 * card's meta line, and — for the two unscored drills — the label the results
 * screen shows against the step, so all three say the same thing.
 */
export function breathStepSummary(step: BreathStep): string {
  switch (step.drill) {
    case "box":
      return `${step.minutes} min · ${step.side}s sides`;
    case "farinelli":
      return `Top count ${step.cap}`;
    default:
      return step.attempts === 1 ? "1 attempt" : `${step.attempts} attempts`;
  }
}

/** What the drill is for, in a sentence, for the intro card. */
export function breathDrillDesc(drill: BreathDrillId): string {
  switch (drill) {
    case "box":
      return "Breathe around the square — inhale, hold, exhale, hold, equal counts on every side. It settles the nerves and evens out the airflow before you sing.";
    case "farinelli":
      return "Inhale, hold and exhale for the same count, then add one count each round. The breath gets longer as you go, which is the whole point.";
    default:
      return "One steady note, held for as long as your air lasts. The mic times it and scores how even you kept the level.";
  }
}

/** True when the drill needs the microphone. */
export function breathStepNeedsMic(step: BreathStep): boolean {
  return step.drill === "sustain";
}

export function routineNeedsMic(r: BreathRoutine): boolean {
  return r.steps.some(breathStepNeedsMic);
}

/**
 * Which breath routine to put at the top of the room right now.
 *
 * Someone who has already done breath work today gets the quick one — a second
 * visit is a top-up, not another full set. Everyone else gets the daily. The
 * builder is a choice, never a recommendation: it is the one that asks for more
 * air than the singer has, which is a fine thing to opt into and a bad thing to
 * be handed.
 */
export function recommendBreathRoutine(opts: { practicedToday: boolean }): BreathRoutine {
  const pick = opts.practicedToday ? "quick" : "daily";
  return BREATH_ROUTINES.find((r) => r.id === pick) ?? BREATH_ROUTINES[0];
}
