// Multi-week programmes: named plans worked day by day.
//
// A routine is one session. Singers who want a particular result — more top,
// a mix, a steadier vibrato — are really asking for a sequence of sessions,
// with rest in between, that points at that result for several weeks. Sing
// Sharp sells exactly that ("Mix Mastery", "Sing High Notes"), and the book in
// this repo already writes one out in prose (The Measured Voice, chapters
// 13–19). This module is those plans as data.
//
// A programme day names rooms that already exist — a warmup routine, a breath
// drill, the range test — and nothing else. There is no new exercise here and
// no new mechanic, only a schedule.
//
// Progress is derived, not stored. Every room already logs a session when
// something was sung, so a day is done when the log shows each of its
// activities on one calendar day. The only thing kept anywhere is which
// programme a singer started and on which day, which the programmes room keeps
// on the device, so nothing here touches the progress record or its contract.
//
// Honest claims. A programme promises practice, never an outcome: no copy here
// says what a singer will be able to do at the end, because nothing measures
// whether they can. The book programme's phases point at the exit tests in
// lib/programme-exit-tests.ts, which say how to find out.

import { BOOK_CONTENTS } from "@/lib/book-data";
import type { ActivityType, SessionLog } from "@/lib/progress-shape";
import {
  ALL_ROUTINES,
  STEP_INTRO_SEC,
  isFreeExercise,
  routineById,
  routineSeconds,
  stepExercise,
  stepSeconds,
  type Routine,
  type RoutineStep,
} from "@/components/warmups/routines";
import { titlesFor } from "@/components/warmups/exercises";
import {
  BREATH_STEP_INTRO_SEC,
  breathDrillTitle,
  breathRoutineById,
  breathStepSeconds,
  type BreathDrillId,
  type BreathStep,
} from "@/components/breath/routines";
import { FREE_DAILY_SEC } from "@/lib/free-cap";

/** Days in a programme week. */
export const WEEK_DAYS = 7;

/**
 * Week 1 is open to everyone; later weeks need Pro. A free singer can find out
 * whether a programme suits them before paying for the rest of it.
 */
export const FREE_WEEKS = 1;

/**
 * One thing to do on a programme day, in a room that already exists.
 *
 * - `warmup` runs a routine by id, or — for the short week-1 days that have to
 *   fit the free allowance — its own list of steps.
 * - `breath` runs one breath drill with the room's defaults.
 * - The rest open a room; any session logged there that day counts.
 */
export type ProgramActivity =
  | { kind: "warmup"; routineId: string }
  | { kind: "warmup"; name: string; steps: RoutineStep[] }
  | { kind: "breath"; drill: BreathDrillId }
  | { kind: "ear" }
  | { kind: "studio" }
  | { kind: "range" }
  | { kind: "songs" }
  | { kind: "recorder" };

export type ProgramActivityKind = ProgramActivity["kind"];

/** A day with nothing to do is a rest day. Voices adapt in the gaps. */
export interface ProgramDay {
  activities: ProgramActivity[];
}

/** A stretch of weeks with one job, e.g. "Weeks 3–4: the middle voice". */
export interface ProgramPhase {
  /** 1-based, inclusive. */
  fromWeek: number;
  toWeek: number;
  title: string;
  /** A book chapter slug that teaches this phase, when there is one. */
  chapter?: string;
}

export interface Program {
  /** Stable: an enrolment stores it. */
  id: string;
  name: string;
  /** One line, in the singer's terms. Practice, never a promised outcome. */
  tagline: string;
  weeks: number;
  phases: ProgramPhase[];
  /** Exactly `weeks * WEEK_DAYS` entries. */
  days: ProgramDay[];
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

const REST: ProgramDay = { activities: [] };
const routine = (routineId: string): ProgramActivity => ({ kind: "warmup", routineId });
const steps = (name: string, list: Array<[string, number]>): ProgramActivity => ({
  kind: "warmup",
  name,
  steps: list.map(([exerciseId, reps]) => ({ exerciseId, reps })),
});
const breath = (drill: BreathDrillId): ProgramActivity => ({ kind: "breath", drill });
const day = (...activities: ProgramActivity[]): ProgramDay => ({ activities });

/**
 * A week laid out on the singer's own calendar: `on` holds the sessions for
 * the days listed in `pattern` (0-based within the week), in order, and every
 * other day rests.
 */
function week(pattern: readonly number[], on: readonly ProgramDay[]): ProgramDay[] {
  if (pattern.length !== on.length) {
    throw new Error(`week(): ${pattern.length} session days but ${on.length} sessions`);
  }
  const days: ProgramDay[] = Array.from({ length: WEEK_DAYS }, () => REST);
  pattern.forEach((d, i) => {
    days[d] = on[i];
  });
  return days;
}

/** Four sessions a week, spread out: the book's "three is the floor, four is better". */
const FOUR = [0, 2, 4, 5] as const;
/** Five sessions, two rest days, for the shorter focused programmes. */
const FIVE = [0, 1, 3, 4, 5] as const;
/** Three sessions: week 1, where the point is turning up, not load. */
const THREE = [0, 2, 4] as const;

// ---------------------------------------------------------------------------
// The programmes
// ---------------------------------------------------------------------------

/**
 * Four weeks above the transition, on the free high-notes routine. Week 1 is
 * short days that go no higher than the octave; the tenth arrives in week 2; each
 * week ends on the quiet recovery set; the last session retakes the range test.
 */
const HIGH_NOTES: Program = {
  id: "high-notes",
  name: "High notes",
  tagline: "Four weeks of light, repeated work above your transition, never past your measured range, with a range retest at the end.",
  weeks: 4,
  phases: [
    { fromWeek: 1, toWeek: 1, title: "Week 1: sirens to the octave" },
    { fromWeek: 2, toWeek: 3, title: "Weeks 2–3: to the tenth", chapter: "weeks-7-8-top" },
    { fromWeek: 4, toWeek: 4, title: "Week 4: consolidate and retest" },
  ],
  days: [
    ...week(THREE, [
      day(steps("Sirens to the octave", [["lip-trill-scale", 6], ["octave-siren", 5], ["descending-five", 5]])),
      day(steps("Fifths and sirens", [["ng-siren-fifth", 6], ["octave-siren", 5], ["hoo-four-note", 5]])),
      day(steps("Octave arpeggios", [["lip-trill-scale", 6], ["octave-arpeggio", 5], ["descending-five", 5]])),
    ]),
    ...week(FIVE, [
      day(routine("high-notes")),
      day(routine("range")),
      day(routine("high-notes")),
      day(routine("high-notes")),
      day(routine("recovery")),
    ]),
    ...week(FIVE, [
      day(routine("high-notes")),
      day(routine("range")),
      day(routine("high-notes")),
      day(routine("high-notes")),
      day(routine("recovery")),
    ]),
    ...week(FOUR, [
      day(routine("high-notes")),
      day(routine("range")),
      day(routine("high-notes")),
      day(routine("morning"), { kind: "range" }),
    ]),
  ],
};

/**
 * Six weeks through the break on the Pro mix routine. Week 1 prepares on free
 * exercises (sirens, the ng, the hoo); from week 2 the mix pack carries the
 * work, alternating with head-voice days so the blend is built from a light top
 * down rather than by dragging chest up.
 */
const MIX: Program = {
  id: "mix",
  name: "Mix",
  tagline: "Six weeks of quiet slides and blends across your break, built from the light top down, with a range retest at the end.",
  weeks: 6,
  phases: [
    { fromWeek: 1, toWeek: 1, title: "Week 1: find the transition" },
    { fromWeek: 2, toWeek: 3, title: "Weeks 2–3: slides through the break", chapter: "weeks-5-6-passaggio" },
    { fromWeek: 4, toWeek: 5, title: "Weeks 4–5: blend from the top down", chapter: "weeks-7-8-top" },
    { fromWeek: 6, toWeek: 6, title: "Week 6: consolidate and retest" },
  ],
  days: [
    ...week(THREE, [
      day(steps("Find the transition", [["ng-siren-fifth", 6], ["octave-siren", 5], ["hoo-four-note", 5]])),
      day(steps("Hums through it", [["morning-hum", 6], ["ng-siren-fifth", 6], ["descending-five", 5]])),
      day(steps("Easy slides", [["morning-sigh", 6], ["octave-siren", 5], ["hoo-four-note", 5]])),
    ]),
    ...week(FOUR, [
      day(routine("morning"), routine("mix")),
      day(routine("range")),
      day(routine("morning"), routine("mix")),
      day(routine("recovery")),
    ]),
    ...week(FOUR, [
      day(routine("morning"), routine("mix")),
      day(routine("range")),
      day(routine("morning"), routine("mix")),
      day(routine("recovery")),
    ]),
    ...week(FOUR, [
      day(routine("head-voice-builder")),
      day(routine("morning"), routine("mix")),
      day(routine("head-voice-builder")),
      day(routine("morning"), routine("mix")),
    ]),
    ...week(FOUR, [
      day(routine("head-voice-builder")),
      day(routine("morning"), routine("mix")),
      day(routine("head-voice-builder")),
      day(routine("morning"), routine("mix")),
    ]),
    ...week(FOUR, [
      day(routine("morning"), routine("mix")),
      day(routine("range")),
      day(routine("morning"), routine("mix")),
      day(routine("morning"), { kind: "range" }),
    ]),
  ],
};

/**
 * Three weeks of long, easy holds on the vibrato routine, which measures rate
 * and width after each hold. A breath sustain opens the later sessions,
 * because a wobble that comes and goes with the air is not yet a vibrato.
 */
const VIBRATO: Program = {
  id: "vibrato",
  name: "Vibrato",
  tagline: "Three weeks of long, easy holds, with the rate and width of each one read back to you afterwards.",
  weeks: 3,
  phases: [
    { fromWeek: 1, toWeek: 1, title: "Week 1: easy holds" },
    { fromWeek: 2, toWeek: 3, title: "Weeks 2–3: holds on the vibrato routine" },
  ],
  days: [
    ...week(THREE, [
      day(steps("Easy holds", [["hoo-four-note", 5], ["vibrato-hold", 4], ["descending-five", 4]])),
      day(steps("Higher holds", [["lip-trill-scale", 5], ["vibrato-float-high", 4], ["descending-five", 4]])),
      day(steps("Holds, twice", [["vibrato-hold", 4], ["vibrato-float-high", 3], ["descending-five", 4]])),
    ]),
    ...week(FIVE, [
      day(breath("sustain"), routine("vibrato")),
      day(routine("vibrato")),
      day(breath("sustain"), routine("vibrato")),
      day(routine("vibrato")),
      day(routine("recovery")),
    ]),
    ...week(FIVE, [
      day(breath("sustain"), routine("vibrato")),
      day(routine("vibrato")),
      day(breath("sustain"), routine("vibrato")),
      day(routine("vibrato")),
      day(routine("recovery")),
    ]),
  ],
};

/**
 * The Measured Voice's twelve weeks (chapters 13–19), four sessions a week,
 * each phase pointing at its chapter and, through it, its exit test.
 *
 * The book's sessions are twenty minutes: a few of breath, a warmup pack, the
 * week's specific work, and something quieter to finish. Week 1 is the book's
 * baseline — a range test, a recorded take and a sustain — then short breath
 * and warmup sessions that fit the free allowance.
 */
const MEASURED_VOICE: Program = {
  id: "measured-voice",
  name: "The Measured Voice: twelve weeks",
  tagline: "The book's twelve-week plan, four short sessions a week: baseline, the middle, the break, the top, the bottom, then songs.",
  weeks: 12,
  phases: [
    { fromWeek: 1, toWeek: 2, title: "Weeks 1–2: baseline and breath", chapter: "weeks-1-2-baseline" },
    { fromWeek: 3, toWeek: 4, title: "Weeks 3–4: the middle voice", chapter: "weeks-3-4-middle" },
    { fromWeek: 5, toWeek: 6, title: "Weeks 5–6: through the break", chapter: "weeks-5-6-passaggio" },
    { fromWeek: 7, toWeek: 8, title: "Weeks 7–8: extending the top", chapter: "weeks-7-8-top" },
    { fromWeek: 9, toWeek: 10, title: "Weeks 9–10: the bottom and the long phrase", chapter: "weeks-9-10-bottom" },
    { fromWeek: 11, toWeek: 12, title: "Weeks 11–12: putting it in a song", chapter: "weeks-11-12-songs" },
  ],
  days: [
    // Week 1: the baseline session, then short breath-and-gentle-warmup days.
    ...week(FOUR, [
      day({ kind: "range" }, { kind: "recorder" }, breath("sustain")),
      day(breath("box"), steps("Gentle middle", [["morning-hum", 6], ["morning-lip-trill", 6], ["morning-sustain", 4]])),
      day(breath("farinelli"), steps("Gentle middle", [["morning-hum", 5], ["morning-three-note", 4], ["morning-sigh", 4]])),
      day(breath("box"), steps("Gentle middle", [["morning-hum", 6], ["morning-lip-trill", 6], ["morning-sustain", 4]])),
    ]),
    ...week(FOUR, [
      day(breath("box"), routine("morning"), { kind: "ear" }),
      day(breath("farinelli"), routine("quick")),
      day(breath("box"), routine("morning"), { kind: "ear" }),
      day(breath("sustain"), routine("quick")),
    ]),
    // Weeks 3–4: the middle. Warmups in the middle, pitch-match, a sustain.
    ...[3, 4].flatMap(() =>
      week(FOUR, [
        day(breath("box"), routine("daily"), { kind: "studio" }),
        day(breath("farinelli"), routine("daily"), { kind: "ear" }),
        day(breath("box"), routine("daily"), { kind: "studio" }),
        day(breath("sustain"), routine("daily")),
      ]),
    ),
    // Weeks 5–6: through the break, quietly. The block closes with a retest.
    ...week(FOUR, [
      day(breath("box"), routine("range")),
      day(breath("farinelli"), routine("morning"), routine("range")),
      day(breath("box"), routine("range")),
      day(routine("recovery")),
    ]),
    ...week(FOUR, [
      day(breath("box"), routine("range")),
      day(breath("farinelli"), routine("morning"), routine("range")),
      day(breath("box"), routine("range")),
      day(routine("morning"), { kind: "range" }),
    ]),
    // Weeks 7–8: height without weight. Head voice before belt.
    ...[7, 8].flatMap(() =>
      week(FOUR, [
        day(breath("box"), routine("high-notes")),
        day(breath("farinelli"), routine("head-voice-builder")),
        day(breath("box"), routine("high-notes")),
        day(routine("recovery")),
      ]),
    ),
    // Weeks 9–10: the bottom, and phrases rather than sustains.
    ...[9, 10].flatMap(() =>
      week(FOUR, [
        day(breath("farinelli"), routine("daily"), breath("sustain")),
        day(breath("box"), routine("recovery")),
        day(breath("farinelli"), routine("daily"), breath("sustain")),
        day(routine("recovery")),
      ]),
    ),
    // Weeks 11–12: songs. Warmups shrink; week 12 opens on the retest.
    ...week(FOUR, [
      day(routine("quick"), { kind: "songs" }),
      day(routine("quick"), { kind: "songs" }),
      day(routine("quick"), { kind: "songs" }),
      day(routine("quick"), { kind: "songs" }),
    ]),
    ...week(FOUR, [
      day(routine("morning"), { kind: "range" }, { kind: "recorder" }),
      day(routine("quick"), { kind: "songs" }),
      day(routine("quick"), { kind: "songs" }),
      day(routine("quick"), { kind: "songs" }),
    ]),
  ],
};

export const PROGRAMS: readonly Program[] = [HIGH_NOTES, MIX, VIBRATO, MEASURED_VOICE];

export function programById(id: string | null | undefined): Program | null {
  if (!id) return null;
  return PROGRAMS.find((p) => p.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Reading a programme
// ---------------------------------------------------------------------------

/** 0-based week of a 0-based day index. */
export function weekOf(dayIndex: number): number {
  return Math.floor(dayIndex / WEEK_DAYS);
}

export function isRestDay(d: ProgramDay): boolean {
  return d.activities.length === 0;
}

/** Days after `FREE_WEEKS` need Pro. */
export function dayNeedsPro(dayIndex: number): boolean {
  return weekOf(dayIndex) >= FREE_WEEKS;
}

export function phaseForDay(program: Program, dayIndex: number): ProgramPhase | undefined {
  const w = weekOf(dayIndex) + 1;
  return program.phases.find((p) => w >= p.fromWeek && w <= p.toWeek);
}

/** The steps a warmup activity sings. Throws on an unknown routine id: every id is tested. */
export function warmupSteps(a: Extract<ProgramActivity, { kind: "warmup" }>): RoutineStep[] {
  if ("steps" in a) return a.steps;
  const r = routineById(a.routineId);
  if (!r) throw new Error(`Programme names unknown routine "${a.routineId}"`);
  return r.steps;
}

/**
 * A warmup activity as a routine the warmup room can run. Named routines come
 * back as themselves; a step list becomes a one-off routine whose id says which
 * programme day it belongs to.
 */
export function activityRoutine(
  program: Program,
  dayIndex: number,
  a: Extract<ProgramActivity, { kind: "warmup" }>,
): Routine {
  if (!("steps" in a)) {
    const r = routineById(a.routineId);
    if (!r) throw new Error(`Programme names unknown routine "${a.routineId}"`);
    return r;
  }
  return {
    id: `program:${program.id}:${dayIndex}`,
    name: a.name,
    tagline: `${program.name}, day ${dayIndex + 1}.`,
    steps: a.steps,
    pro: a.steps.some((s) => !isFreeExercise(s.exerciseId)),
  };
}

/** True when every exercise the activity asks for is in the free catalogue. */
export function activityIsFree(a: ProgramActivity): boolean {
  if (a.kind !== "warmup") return true;
  return warmupSteps(a).every((s) => isFreeExercise(s.exerciseId));
}

/**
 * Seconds an activity takes, from the same planners the rooms schedule with.
 * Rooms that are open-ended (a song, the studio) count a nominal session.
 */
export const OPEN_ROOM_SEC: Record<"ear" | "studio" | "range" | "songs" | "recorder", number> = {
  ear: 240,
  studio: 240,
  range: 180,
  songs: 300,
  recorder: 120,
};

export function activitySeconds(a: ProgramActivity): number {
  switch (a.kind) {
    case "warmup": {
      if (!("steps" in a)) {
        const r = routineById(a.routineId);
        if (!r) throw new Error(`Programme names unknown routine "${a.routineId}"`);
        return routineSeconds(r);
      }
      return a.steps.reduce((t, s) => t + stepSeconds(s) + STEP_INTRO_SEC, 0);
    }
    case "breath":
      return breathStepSeconds(defaultBreathStep(a.drill)) + BREATH_STEP_INTRO_SEC;
    default:
      return OPEN_ROOM_SEC[a.kind];
  }
}

/**
 * Seconds of a day that the free allowance counts. The range test, the
 * studio and the recorder sit outside the cap (lib/free-cap `CAPPED_TYPES`).
 */
export function cappedDaySeconds(d: ProgramDay): number {
  return d.activities.reduce((t, a) => {
    const type = activityType(a);
    return t + (type === "warmup" || type === "ear" || type === "breath" || type === "song" ? activitySeconds(a) : 0);
  }, 0);
}

export function daySeconds(d: ProgramDay): number {
  return d.activities.reduce((t, a) => t + activitySeconds(a), 0);
}

/**
 * The breath room's own default for a single drill, the one `?drill=` opens:
 * one minute of the square, the climb to eight, one sustain.
 */
export function defaultBreathStep(drill: BreathDrillId): BreathStep {
  const quick = breathRoutineById("quick");
  const fromQuick = quick?.steps.find((s) => s.drill === drill);
  if (fromQuick) return fromQuick;
  switch (drill) {
    case "box":
      return { drill: "box", side: 4, minutes: 1 };
    case "farinelli":
      return { drill: "farinelli", cap: 8 };
    default:
      return { drill: "sustain", attempts: 1 };
  }
}

/** The session type a room logs, which is what completion reads. */
export function activityType(a: ProgramActivity): ActivityType {
  switch (a.kind) {
    case "warmup":
      return "warmup";
    case "breath":
      return "breath";
    case "ear":
      return "ear";
    case "studio":
      return "pitch";
    case "range":
      return "range";
    case "songs":
      return "song";
    case "recorder":
      return "recording";
  }
}

// ---------------------------------------------------------------------------
// Completion, derived from the practice log
// ---------------------------------------------------------------------------

/** True when `sessions` show this activity done on `day`. */
export function activityDoneOn(a: ProgramActivity, sessions: readonly SessionLog[], dayKey: string): boolean {
  const today = sessions.filter((s) => s.day === dayKey);
  switch (a.kind) {
    case "warmup":
      // Every step's exercise sung that day, under any title it has carried.
      return warmupSteps(a).every((s) => {
        const titles = titlesFor(stepExercise(s).title);
        return today.some((t) => t.type === "warmup" && t.detail !== undefined && titles.includes(t.detail));
      });
    case "breath": {
      const title = breathDrillTitle(a.drill);
      return today.some((t) => t.type === "breath" && t.detail === title);
    }
    default: {
      const type = activityType(a);
      return today.some((t) => t.type === type);
    }
  }
}

export function dayDoneOn(d: ProgramDay, sessions: readonly SessionLog[], dayKey: string): boolean {
  return d.activities.every((a) => activityDoneOn(a, sessions, dayKey));
}

/** The calendar day after `dayKey` (YYYY-MM-DD), in the same local calendar. */
export function nextDayKey(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().slice(0, 10);
}

export interface ProgramProgress {
  /** Per programme day: the calendar day it was done on, or null. */
  doneOn: Array<string | null>;
  /** The first programme day not yet done, or null when the programme is finished. */
  currentDay: number | null;
  finished: boolean;
}

/** The last programme day with something to do. The rest days after it are not waited for. */
export function lastSessionDay(program: Program): number {
  return program.days.findLastIndex((d) => !isRestDay(d));
}

/**
 * Where a singer is in a programme.
 *
 * Days are worked in order, one per calendar day at most. Walking from the
 * enrolment day, each programme day is done on the earliest calendar day on or
 * after the one following the previous day's, where the log shows all of its
 * activities. A rest day is done simply by that next calendar day arriving.
 * A missed day does not expire: the programme waits. The programme is
 * finished the day its last session is done; any rest days after that are
 * marked done on the same day rather than waited out.
 *
 * `recorded` is a checkpoint: a `doneOn` this function returned earlier, kept
 * with the enrolment. The practice log is capped (`MAX_SESSIONS` in
 * lib/progress.ts), so the sessions that finished an early day can be evicted
 * before the programme ends. Days the checkpoint already has are taken as
 * done without re-reading the log, so progress never moves backwards. Only a
 * leading run of days in order is trusted, and never a day after `today`.
 *
 * Pure: the same log, enrolment, checkpoint and `today` always give the same
 * answer.
 */
export function programProgress(
  program: Program,
  startedDay: string,
  sessions: readonly SessionLog[],
  today: string,
  recorded: ReadonlyArray<string | null> = [],
): ProgramProgress {
  const logged = [...new Set(sessions.filter((s) => s.day >= startedDay && s.day <= today).map((s) => s.day))].sort();
  const last = lastSessionDay(program);
  const doneOn: Array<string | null> = program.days.map(() => null);
  let cursor = startedDay;
  for (let i = 0; i <= last; i++) {
    const kept = recorded[i];
    if (typeof kept === "string" && kept >= cursor && kept <= today) {
      doneOn[i] = kept;
      cursor = nextDayKey(kept);
      continue;
    }
    if (cursor > today) break;
    const d = program.days[i];
    if (isRestDay(d)) {
      doneOn[i] = cursor;
      cursor = nextDayKey(cursor);
      continue;
    }
    const when = logged.find((k) => k >= cursor && dayDoneOn(d, sessions, k));
    if (!when) break;
    doneOn[i] = when;
    cursor = nextDayKey(when);
  }
  const finishedOn = last >= 0 ? doneOn[last] : startedDay;
  if (finishedOn) for (let i = last + 1; i < doneOn.length; i++) doneOn[i] = finishedOn;
  const current = doneOn.findIndex((d) => d === null);
  return { doneOn, currentDay: current === -1 ? null : current, finished: current === -1 };
}

// ---------------------------------------------------------------------------
// Invariants the tests hold the data to
// ---------------------------------------------------------------------------

/** Every routine id programmes may name, for the tests. */
export const PROGRAM_ROUTINE_IDS: ReadonlySet<string> = new Set(ALL_ROUTINES.map((r) => r.id));

/** Book chapter slugs programmes may cite, for the tests. */
export const BOOK_SLUGS: ReadonlySet<string> = new Set(BOOK_CONTENTS.map((c) => c.slug));

/** The free allowance a week-1 day must fit inside. */
export const FREE_DAY_BUDGET_SEC = FREE_DAILY_SEC;
