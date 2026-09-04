// Warmup routines: fixed sequences of exercises with a bounded rep count each,
// so a session has a beginning, a length the singer can read before starting,
// and an end it reaches on its own.
//
// Before these existed the room was a 17-card grid of single exercises, each an
// endless ladder that only stopped when the singer gave up or went silent. That
// is the shape of a reference library, not a practice session: nothing told a
// singer which exercise to do first, how many to do, or when they were done.
// Every structured singing course (Singeo's warmup workouts, Yousician's
// technique drills, Vanido's daily set) presents practice the other way round:
// a routine you start, steps that advance themselves, a summary at the end.

import {
  ALL_EXERCISES,
  EXERCISES,
  PRO_PACKS,
  buildSegments,
  type WarmupExercise,
} from "./exercises";
import { planRep } from "./timeline";

export interface RoutineStep {
  exerciseId: string;
  /** Reps to sing before the step completes itself. */
  reps: number;
}

export interface Routine {
  id: string;
  name: string;
  /** One line, in the singer's terms, for the card and the session header. */
  tagline: string;
  steps: RoutineStep[];
  /** Every step draws on a Pro pack; the whole routine sits behind the paywall. */
  pro: boolean;
}

const step = (exerciseId: string, reps: number): RoutineStep => ({ exerciseId, reps });

/**
 * The free routines, quickest first. The first two follow Singeo's two
 * published warmups exercise for exercise — the "Easy 7-minute" (bubble, straw,
 * N, V) and the "Complete 10-minute" (sirens, bubble, raspberries, hung-ee-mm,
 * hoo, gug, then a melody) — because those are the two sequences the singer
 * we are matching can be checked against. The rest extend the same order into
 * a longer set, a range set and an agility set.
 */
export const ROUTINES: Routine[] = [
  {
    id: "quick",
    name: "Quick warmup",
    tagline: "The easy warmup: the bubble, the straw, an N-hum and a V. Gentle all the way through.",
    pro: false,
    steps: [
      step("lip-trill-scale", 15),
      step("straw-scale", 17),
      step("n-hum-scale", 13),
      step("v-double-arpeggio", 14),
    ],
  },
  {
    id: "daily",
    name: "Daily warmup",
    tagline: "The complete ten: sirens, bubble, raspberries, hung-ee-mm, hoo, staccato gug, then a slow descent.",
    pro: false,
    steps: [
      step("ng-siren-fifth", 6),
      step("octave-siren", 5),
      step("lip-trill-scale", 22),
      step("tongue-trill-descent", 7),
      step("hung-ee-mm", 11),
      step("hoo-four-note", 7),
      step("gug-staccato", 11),
      step("descending-five", 7),
    ],
  },
  {
    id: "full",
    name: "Full warmup",
    tagline: "The complete ten, then arpeggios, a reverse arpeggio and a run.",
    pro: false,
    steps: [
      step("ng-siren-fifth", 6),
      step("lip-trill-scale", 15),
      step("tongue-trill-descent", 7),
      step("straw-scale", 12),
      step("hung-ee-mm", 9),
      step("hoo-four-note", 7),
      step("gug-staccato", 11),
      step("v-double-arpeggio", 10),
      step("octave-arpeggio", 10),
      step("reverse-arpeggio", 10),
      step("octave-siren", 5),
      step("agility-run", 8),
      step("descending-five", 8),
      step("sustained-hold", 4),
    ],
  },
  {
    id: "morning",
    name: "Morning reset",
    tagline: "Half awake is fine. Six tiny exercises that ask nothing of a cold voice.",
    pro: false,
    steps: [
      step("morning-hum", 8),
      step("morning-lip-trill", 8),
      step("morning-three-note", 8),
      step("morning-siren", 8),
      step("morning-sigh", 8),
      step("morning-sustain", 5),
    ],
  },
  {
    id: "range",
    name: "Range builder",
    tagline: "Sirens and arpeggios that reach for the octave from both ends, light on top.",
    pro: false,
    steps: [
      step("lip-trill-scale", 8),
      step("ng-siren-fifth", 6),
      step("octave-siren", 6),
      step("hoo-four-note", 8),
      step("reverse-arpeggio", 9),
      step("gee-octave", 8),
      step("octave-arpeggio", 8),
    ],
  },
  {
    id: "agility",
    name: "Agility and runs",
    tagline: "The speed challenge: staccato, fast five-note runs and a pentatonic riff shape.",
    pro: false,
    steps: [
      step("lip-trill-scale", 8),
      step("chromatic-neighbor", 8),
      step("gug-staccato", 9),
      step("agility-run", 10),
      step("pentatonic-run", 12),
      step("straw-scale", 8),
    ],
  },
];

/**
 * The Pro packs as routines, built from the packs rather than restated, so a
 * pack that gains or loses an exercise changes its routine in the same commit.
 */
export const PRO_ROUTINES: Routine[] = PRO_PACKS.map((pack) => ({
  id: pack.id,
  name: pack.name,
  tagline: pack.desc,
  pro: true,
  steps: pack.exercises.map((ex) => step(ex.id, 8)),
}));

export const ALL_ROUTINES: Routine[] = [...ROUTINES, ...PRO_ROUTINES];

export function routineById(id: string | null | undefined): Routine | null {
  if (!id) return null;
  return ALL_ROUTINES.find((r) => r.id === id) ?? null;
}

/** The exercise a step names. Throws on a bad id: every id is checked in tests. */
export function stepExercise(s: RoutineStep): WarmupExercise {
  const ex = ALL_EXERCISES.find((e) => e.id === s.exerciseId);
  if (!ex) throw new Error(`Routine step names unknown exercise "${s.exerciseId}"`);
  return ex;
}

/** True when this exercise is in the free catalogue rather than a pack. */
export function isFreeExercise(id: string): boolean {
  return EXERCISES.some((e) => e.id === id);
}

/**
 * Seconds the intro card holds before a step starts itself. Long enough to
 * read the title and the tip, short enough that a singer who has done this
 * routine before is never waiting on the app.
 */
export const STEP_INTRO_SEC = 4;

/**
 * Wall-clock length of one step at 1x in sing-along: the teach rep, then the
 * steady reps, straight from the same planner the player schedules with, so
 * the estimate on the card and the session the singer gets are the same
 * arithmetic. Root 60 is arbitrary — the plan's timing does not depend on it.
 */
export function stepSeconds(s: RoutineStep): number {
  const ex = stepExercise(s);
  const { totalSec, noteDur } = buildSegments(ex, 60, 1);
  let t = 0;
  for (let i = 0; i < s.reps; i++) {
    t += planRep({ mode: "sing-along", repIndex: i, t0: 0, patternSec: totalSec, noteDur }).repDur;
  }
  return t;
}

export function routineSeconds(r: Routine): number {
  return r.steps.reduce((a, s) => a + stepSeconds(s) + STEP_INTRO_SEC, 0);
}

export function routineMinutes(r: Routine): number {
  return Math.max(1, Math.round(routineSeconds(r) / 60));
}

/**
 * Which routine to put at the top of the room right now.
 *
 * Someone who has already practised today gets the quick one — a second
 * session is a top-up, not another full warmup. Before ten in the morning a
 * cold voice gets the morning reset. Everyone else gets the daily. Nothing
 * here reads scores: the coach on /progress owns "what you are weak at", and
 * this only answers "what fits this moment".
 */
export function recommendRoutine(opts: { practicedToday: boolean; hour: number }): Routine {
  const pick = opts.practicedToday ? "quick" : opts.hour < 10 ? "morning" : "daily";
  return ROUTINES.find((r) => r.id === pick) ?? ROUTINES[0];
}
