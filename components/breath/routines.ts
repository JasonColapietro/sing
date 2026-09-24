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
  | { drill: "sustain"; attempts: number }
  /** Breathe and sing: `reps` notes of `holdSec`, each opened by a breath the mic heard. */
  | { drill: "cue"; reps: number; holdSec: number };

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
  /** The sustain test's longest single hold; the guided drills have none. */
  best?: number;
  /** Breathe and sing's finished reps; the other drills have none. */
  reps?: number;
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
/**
 * The sustain ladder, in one place.
 *
 * These were inline literals in `sustain-test.tsx` (the benchmark words and the
 * printed "10s fair · 20s ..." line) and again in `store.ts` (the star cuts),
 * and `contracts/suede-vocal.ts` restated them a third time. A contract that
 * copies its values instead of importing them regenerates byte-for-byte while
 * publishing stale numbers to its consumers, which is the drift it exists to
 * detect — the same defect the star thresholds had before `lib/stars.ts`.
 *
 * They live here rather than beside the drill because this module is pure, so
 * the contract builder can import it without pulling a client component in.
 */
export const SUSTAIN_BENCHMARKS_SEC = { fair: 10, good: 20, strong: 30, excellent: 45 } as const;

/** Star cuts for a sustain attempt. 45s is deliberately not the three-star bar. */
export const SUSTAIN_STAR_SEC = { one: 10, two: 20, three: 30 } as const;

export const SUSTAIN_ATTEMPT_SEC = 25;

/**
 * How long a mic drill listens for a breath before it offers to start without
 * one. Long enough for two unhurried breaths, which is what a singer tries
 * before deciding the app is broken; some mics never carry a breath at all,
 * and a drill that waits on one forever is a drill that cannot be done.
 */
export const BREATH_FALLBACK_SEC = 8;

/**
 * What one breathe-and-sing rep costs beyond its note: the breath itself, the
 * moment between hearing it and the voice starting, and the pause after. An
 * estimate, like SUSTAIN_ATTEMPT_SEC, since the singer sets the pace.
 */
export const CUE_BREATH_SEC = 3;

/** The rep counts the standalone drill offers; the routine uses the first. */
export const CUE_REP_CHOICES = [4, 6, 8] as const;

/** One breathe-and-sing note: long enough to be a phrase, short enough to repeat. */
export const CUE_HOLD_SEC = 4;

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
      "The everyday set: three minutes around the square, the four-to-eight climb, four notes each started on a breath, then two measured sustains.",
    steps: [
      { drill: "box", side: 4, minutes: 3 },
      { drill: "farinelli", cap: 8 },
      { drill: "cue", reps: CUE_REP_CHOICES[0], holdSec: CUE_HOLD_SEC },
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
    case "cue":
      return step.reps * (step.holdSec + CUE_BREATH_SEC);
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
    case "cue":
      return "Breathe and sing";
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
    case "cue":
      return `${step.reps} reps · ${step.holdSec}s notes`;
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
    case "cue":
      return "Breathe in, then sing one easy note. The mic listens for the breath before each note counts, so every rep starts the way a phrase should.";
    default:
      return "One steady note, held for as long as your air lasts. The mic times it and scores how even you kept the level.";
  }
}

/** The drill ids, so an untrusted string from a URL can be narrowed safely. */
export const BREATH_DRILL_IDS: BreathDrillId[] = ["sustain", "cue", "box", "farinelli"];

/**
 * Guards a `?drill=` value from a deep link. A curriculum on another origin
 * builds these URLs, so an unknown or stale id has to fall through to the
 * room's front page rather than render a drill that does not exist.
 */
export function isBreathDrillId(value: string | null | undefined): value is BreathDrillId {
  return !!value && (BREATH_DRILL_IDS as string[]).includes(value);
}

/** True when the drill needs the microphone. */
export function breathDrillNeedsMic(drill: BreathDrillId): boolean {
  return drill === "sustain" || drill === "cue";
}

export function breathStepNeedsMic(step: BreathStep): boolean {
  return breathDrillNeedsMic(step.drill);
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
