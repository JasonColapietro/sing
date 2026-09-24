// Multi-week programs: named plans, days to weeks long, worked one day at a
// time.
//
// A routine answers "what do I sing now". A program answers "what do I sing
// this week, and the week after": a fixed calendar of days, each a handful of
// things that already exist elsewhere in the app — a warmup routine, a single
// exercise, a breath set or drill, the range test, a song — with rest days in
// between. Nothing here plays audio or scores anything. Every item is a link
// into the room that does, named by that room's own id, so a program can never
// drift from what the room actually runs.
//
// Progress is derived from the practice log wherever the log can say it: a
// warmup routine counts when every one of its exercises was logged that day, a
// breath set when each of its drills was, the range test when a range session
// was. What the log cannot see, the singer marks by hand.
//
// The one rule on the calendar is that it never runs ahead of the singer's
// week: at most one program day is completed per calendar day, so doing three
// days' work on a Sunday is still one day of the program.
//
// Pure and deterministic: every function takes the sessions and the local day
// it should reason about, so the tests can inject both.

import {
  STEP_INTRO_SEC,
  isFreeExercise,
  routineById,
  routineSeconds,
  stepExercise,
  stepSeconds,
} from "@/components/warmups/routines";
import { titlesFor } from "@/components/warmups/exercises";
import {
  BREATH_STEP_INTRO_SEC,
  breathDrillTitle,
  breathRoutineById,
  breathRoutineSeconds,
  breathStepSeconds,
  breathStepSummary,
  type BreathDrillId,
  type BreathStep,
} from "@/components/breath/routines";
import { SONGS } from "@/components/songs/data";
import { COUNT_IN_BEATS, secPerBeat, sessionSeconds } from "@/components/songs/lib";
import type { ActivityType, SessionLog } from "@/lib/progress-shape";

export type ProgramItem =
  /** A warmup routine, by its id in components/warmups/routines.ts. */
  | { kind: "routine"; id: string }
  /** One warmup exercise, sung for a set number of reps. */
  | { kind: "exercise"; id: string; reps: number }
  /** A breath set, by its id in components/breath/routines.ts. */
  | { kind: "breath"; id: string }
  /** A single breath drill. */
  | { kind: "drill"; id: BreathDrillId }
  /** The range test, as a check-in. */
  | { kind: "range" }
  /** A song from the free songbook, by slug. */
  | { kind: "song"; slug: string };

export interface ProgramDay {
  title: string;
  /** Empty on a rest day. */
  items: ProgramItem[];
}

export interface Program {
  id: string;
  name: string;
  /** One line, in the singer's terms, for the card. */
  tagline: string;
  /**
   * What the app measures along the way, stated only in terms of measurements
   * it actually takes. A program is practice; it promises no outcome.
   */
  measures: string;
  weeks: number;
  pro: boolean;
  days: ProgramDay[];
}

/**
 * The range test is self-paced — a slide down and a slide up, held two seconds
 * at each end — so its length is an estimate, like the sustain attempt's.
 */
export const RANGE_TEST_SEC = 120;

/** The preset a lone drill opens with, for its length on the card. */
const DRILL_PRESET: Record<BreathDrillId, BreathStep> = {
  box: { drill: "box", side: 4, minutes: 1 },
  farinelli: { drill: "farinelli", cap: 8 },
  sustain: { drill: "sustain", attempts: 1 },
};

const routine = (id: string): ProgramItem => ({ kind: "routine", id });
const exercise = (id: string, reps: number): ProgramItem => ({ kind: "exercise", id, reps });
const breath = (id: string): ProgramItem => ({ kind: "breath", id });
const drill = (id: BreathDrillId): ProgramItem => ({ kind: "drill", id });
const range: ProgramItem = { kind: "range" };
const song = (slug: string): ProgramItem => ({ kind: "song", slug });
const day = (title: string, ...items: ProgramItem[]): ProgramDay => ({ title, items });
const rest = (title = "Rest day"): ProgramDay => ({ title, items: [] });

/** Seven days from a pattern, with named days overriding by index (0-6). */
function week(pattern: ProgramDay[], overrides: Record<number, ProgramDay> = {}): ProgramDay[] {
  return pattern.map((d, i) => overrides[i] ?? d);
}

const FOUNDATIONS: Program = {
  id: "foundations-2w",
  name: "Foundations in 2 weeks",
  tagline: "Breath first, then the basic warmups, every day for two weeks. A starting habit, not a test.",
  measures:
    "Day 1 and day 14 take a range test and a sustain test, so you can compare the lowest and highest notes the test found and the seconds you held.",
  weeks: 2,
  pro: false,
  days: [
    day("Where you start", range, drill("sustain"), breath("quick"), routine("quick")),
    day("Breath, then the easy four", breath("daily"), routine("quick")),
    day("The complete ten", breath("quick"), routine("daily")),
    day("A first song", breath("daily"), routine("quick"), song("silent-night")),
    day("The complete ten again", breath("quick"), routine("daily"), song("ode-to-joy")),
    day("Reach both ends", breath("daily"), routine("range")),
    rest(),
    day("A longer breath", breath("builder"), routine("quick")),
    day("Breath and the ten", breath("daily"), routine("daily")),
    day("Quick feet", breath("builder"), routine("agility"), song("home-on-the-range")),
    day("The full set", breath("daily"), routine("full")),
    day("Builder and the ten", breath("builder"), routine("daily")),
    rest(),
    day("Check in", range, drill("sustain"), breath("daily"), routine("daily")),
  ],
};

const VIBRATO_A = day("Holds after the easy four", breath("quick"), routine("quick"), routine("vibrato"));
const VIBRATO_B = day("Long holds", breath("daily"), routine("morning"), routine("vibrato"), exercise("vibrato-hold", 4));
const VIBRATO_C = day("The ten, then holds", routine("daily"), routine("vibrato"));

const VIBRATO: Program = {
  id: "vibrato-3w",
  name: "Vibrato in 3 weeks",
  tagline: "Three weeks of long, easy holds, with the rate and width of the wobble read after every one.",
  measures:
    "Every vibrato hold shows its rate in hertz and its width in cents against a 5–7 Hz band. It reads the wobble only, not how it sounds.",
  weeks: 3,
  pro: false,
  days: [
    ...week([VIBRATO_A, VIBRATO_B, VIBRATO_C, VIBRATO_A, VIBRATO_B, VIBRATO_C, rest()]),
    ...week([VIBRATO_B, VIBRATO_C, VIBRATO_A, VIBRATO_B, VIBRATO_C, VIBRATO_A, rest()]),
    ...week([VIBRATO_C, VIBRATO_A, VIBRATO_B, VIBRATO_C, VIBRATO_A, VIBRATO_B, rest()], {
      5: day("Last reading", breath("daily"), routine("morning"), routine("vibrato"), exercise("vibrato-hold", 4)),
    }),
  ],
};

const HIGH_A = day("Sirens and the tenth", routine("quick"), routine("range"), routine("high-notes"));
const HIGH_B = day("Breath, the ten, the tenth", breath("quick"), routine("daily"), routine("high-notes"));
const HIGH_C = day("The full set, then up", routine("full"), routine("high-notes"));
const HIGH_CHECK = day("Range check-in", range, routine("quick"), routine("high-notes"));
const HIGH_WEEK = [HIGH_A, HIGH_B, HIGH_C, rest(), HIGH_A, HIGH_B, rest()];

const HIGH_NOTES: Program = {
  id: "high-notes-6w",
  name: "High notes in 6 weeks",
  tagline: "Six weeks of light, gradual work above the octave, fitted to your measured range, with rest days every week.",
  measures:
    "A range test on day 1 and at the end of every second week (days 14, 28 and 42) records the lowest and highest notes the test found. Whether those move is up to your voice; the program only schedules the practice.",
  weeks: 6,
  pro: false,
  days: [
    ...week(HIGH_WEEK, { 0: day("Where you start", range, routine("quick"), routine("high-notes")) }),
    ...week(HIGH_WEEK, { 6: HIGH_CHECK }),
    ...week(HIGH_WEEK),
    ...week(HIGH_WEEK, { 6: HIGH_CHECK }),
    ...week(HIGH_WEEK),
    ...week(HIGH_WEEK, { 6: day("Final check-in", range, routine("daily"), routine("high-notes")) }),
  ],
};

const RECOVERY: Program = {
  id: "recovery-week",
  name: "Recovery week",
  tagline: "Seven quiet days for a voice that feels tired: small hums, soft trills and gentle breath, with a day off in the middle.",
  measures:
    "Only what every warmup measures: how close each note landed to its target. It is practice, not treatment. A voice that hurts or stays rough needs a doctor, not an app.",
  weeks: 1,
  pro: false,
  days: [
    day("Quiet start", breath("quick"), routine("morning"), routine("recovery")),
    day("Breath and hums", breath("daily"), routine("recovery"), routine("morning")),
    day("Soft and low", breath("quick"), routine("morning"), routine("recovery")),
    rest(),
    day("Breath and hums", breath("daily"), routine("recovery"), routine("morning")),
    day("A little more", breath("quick"), routine("recovery"), routine("quick")),
    day("Back to your usual", breath("quick"), routine("recovery"), routine("quick")),
  ],
};

const MIX_A = day("Head voice into the crossing", routine("quick"), routine("head-voice-builder"), routine("mix"));
const MIX_B = day("Chest voice into the crossing", routine("quick"), routine("belt-prep"), routine("mix"));
const MIX_C = day("The ten, then the crossing", routine("daily"), routine("mix"));
const MIX_WEEK = [MIX_A, MIX_B, MIX_C, rest(), MIX_A, MIX_B, rest()];

const MIX: Program = {
  id: "mix-4w",
  name: "Mix in 4 weeks",
  tagline: "Four weeks of carrying one sound across the octave where most voices change gear, from the head-voice side and the chest side in turn.",
  measures:
    "Every exercise scores how close each note landed. The app cannot hear which register you are in, so the blend itself is yours to judge. A range test opens and closes the four weeks.",
  weeks: 4,
  pro: true,
  days: [
    ...week(MIX_WEEK, { 0: day("Where you start", range, routine("quick"), routine("mix")) }),
    ...week(MIX_WEEK),
    ...week(MIX_WEEK),
    ...week(MIX_WEEK, { 6: day("Check in", range, routine("daily"), routine("mix")) }),
  ],
};

/** Shortest first, the Pro program last. */
export const PROGRAMS: Program[] = [RECOVERY, FOUNDATIONS, VIBRATO, HIGH_NOTES, MIX];

export function programById(id: string | null | undefined): Program | null {
  if (!id) return null;
  return PROGRAMS.find((p) => p.id === id) ?? null;
}

export function isRestDay(d: ProgramDay): boolean {
  return d.items.length === 0;
}

function songBySlug(slug: string) {
  return SONGS.find((s) => s.slug === slug) ?? null;
}

/** Wall-clock seconds for one item, from the same arithmetic its room uses. */
export function itemSeconds(item: ProgramItem): number {
  switch (item.kind) {
    case "routine": {
      const r = routineById(item.id);
      return r ? routineSeconds(r) : 0;
    }
    case "exercise":
      return stepSeconds({ exerciseId: item.id, reps: item.reps }) + STEP_INTRO_SEC;
    case "breath": {
      const r = breathRoutineById(item.id);
      return r ? breathRoutineSeconds(r) : 0;
    }
    case "drill":
      return breathStepSeconds(DRILL_PRESET[item.id]) + BREATH_STEP_INTRO_SEC;
    case "range":
      return RANGE_TEST_SEC;
    case "song": {
      const s = songBySlug(item.slug);
      return s ? sessionSeconds(s) + COUNT_IN_BEATS * secPerBeat(s.bpm, 1) : 0;
    }
  }
}

export function daySeconds(d: ProgramDay): number {
  return d.items.reduce((a, item) => a + itemSeconds(item), 0);
}

/** Rounded minutes for a day; zero on a rest day. */
export function dayMinutes(d: ProgramDay): number {
  return isRestDay(d) ? 0 : Math.max(1, Math.round(daySeconds(d) / 60));
}

/** The shortest and longest practice day, for "12–16 min a day". */
export function programMinutesRange(p: Program): { min: number; max: number } {
  const mins = p.days.filter((d) => !isRestDay(d)).map(dayMinutes);
  return { min: Math.min(...mins), max: Math.max(...mins) };
}

export function restDayCount(p: Program): number {
  return p.days.filter(isRestDay).length;
}

/** Where the item is practised. Relative, so it works on any origin. */
export function itemHref(item: ProgramItem): string {
  switch (item.kind) {
    case "routine":
      return `/warmups?routine=${encodeURIComponent(item.id)}`;
    case "exercise":
      return `/warmups?exercise=${encodeURIComponent(item.id)}`;
    case "breath":
      return `/breath?routine=${encodeURIComponent(item.id)}`;
    case "drill":
      return `/breath?drill=${encodeURIComponent(item.id)}`;
    case "range":
      return "/range";
    case "song":
      return `/songs?song=${encodeURIComponent(item.slug)}`;
  }
}

/** The item's title and a short meta line, for a row on the day card. */
export function itemLabel(item: ProgramItem): { title: string; meta: string } {
  const min = `${Math.max(1, Math.round(itemSeconds(item) / 60))} min`;
  switch (item.kind) {
    case "routine": {
      const r = routineById(item.id);
      return { title: r?.name ?? item.id, meta: `Warmup · ${min}` };
    }
    case "exercise": {
      const title = stepExercise({ exerciseId: item.id, reps: item.reps }).title;
      return { title, meta: `Exercise · ${item.reps} reps · ${min}` };
    }
    case "breath": {
      const r = breathRoutineById(item.id);
      return { title: r?.name ?? item.id, meta: `Breath · ${min}` };
    }
    case "drill":
      return {
        title: breathDrillTitle(item.id),
        meta: `Breath · ${breathStepSummary(DRILL_PRESET[item.id])}`,
      };
    case "range":
      return { title: "Range test", meta: `Check-in · about ${min}` };
    case "song":
      return { title: songBySlug(item.slug)?.title ?? item.slug, meta: "Song · one run" };
  }
}

/** True when the item needs Pro to start. */
export function itemIsPro(item: ProgramItem): boolean {
  if (item.kind === "routine") return routineById(item.id)?.pro ?? false;
  if (item.kind === "exercise") return !isFreeExercise(item.id);
  return false;
}

/**
 * The logged sessions that make an item done: every entry has to be matched by
 * a session of that type on the day, and an entry with several details is
 * matched by any one of them (a retired exercise title still counts).
 */
export interface Evidence {
  type: ActivityType;
  details: readonly string[] | null;
}

export function itemEvidence(item: ProgramItem): Evidence[] {
  switch (item.kind) {
    case "routine": {
      const r = routineById(item.id);
      if (!r) return [];
      return r.steps.map((s) => ({ type: "warmup", details: titlesFor(stepExercise(s).title) }));
    }
    case "exercise":
      return [
        {
          type: "warmup",
          details: titlesFor(stepExercise({ exerciseId: item.id, reps: item.reps }).title),
        },
      ];
    case "breath": {
      const r = breathRoutineById(item.id);
      if (!r) return [];
      return r.steps.map((s) => ({ type: "breath", details: [breathDrillTitle(s.drill)] }));
    }
    case "drill":
      return [{ type: "breath", details: [breathDrillTitle(item.id)] }];
    case "range":
      return [{ type: "range", details: null }];
    case "song": {
      const s = songBySlug(item.slug);
      return s ? [{ type: "song", details: [s.title] }] : [];
    }
  }
}

/** Whether the log shows the item done on `day`. */
export function itemDoneOn(item: ProgramItem, sessions: readonly SessionLog[], day: string): boolean {
  const evidence = itemEvidence(item);
  if (evidence.length === 0) return false;
  return evidence.every((e) =>
    sessions.some(
      (s) =>
        s.day === day &&
        s.type === e.type &&
        (e.details === null || (s.detail !== undefined && e.details.includes(s.detail))),
    ),
  );
}

export function itemsDoneOn(d: ProgramDay, sessions: readonly SessionLog[], day: string): boolean[] {
  return d.items.map((item) => itemDoneOn(item, sessions, day));
}

/* ------------------------------------------------------------------ *
 * Progress through a program.
 * ------------------------------------------------------------------ */

export interface DayDone {
  /** Index into the program's days. */
  index: number;
  /** The local calendar day it was completed on, YYYY-MM-DD. */
  day: string;
  /** Marked by hand rather than read off the practice log. */
  manual?: boolean;
}

export interface ProgramProgress {
  programId: string;
  /** The local day the program was started, YYYY-MM-DD. */
  startedDay: string;
  /**
   * Completed days, in order: `done[i].index === i`, and each on a later
   * calendar day than the one before.
   */
  done: DayDone[];
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** `day` plus `n` calendar days. Date-only arithmetic, so no clock or DST. */
export function addDays(day: string, n: number): string {
  const t = Date.parse(`${day}T00:00:00Z`) + n * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

export function startProgram(programId: string, today: string): ProgramProgress {
  return { programId, startedDay: today, done: [] };
}

/**
 * Repair a stored record. Anything that is not a known program returns null;
 * a bad `done` list keeps its longest valid prefix, so a hand-edited or
 * half-written record loses the days it cannot vouch for rather than all of
 * them.
 */
export function reviveProgress(raw: unknown): ProgramProgress | null {
  if (typeof raw !== "object" || raw === null) return null;
  const v = raw as Partial<ProgramProgress>;
  const program = programById(typeof v.programId === "string" ? v.programId : null);
  if (!program || typeof v.startedDay !== "string" || !DAY_RE.test(v.startedDay)) return null;
  const done: DayDone[] = [];
  let prev = "";
  for (const d of Array.isArray(v.done) ? v.done : []) {
    if (typeof d !== "object" || d === null) break;
    const { index, day, manual } = d as Partial<DayDone>;
    if (index !== done.length || index >= program.days.length) break;
    if (typeof day !== "string" || !DAY_RE.test(day) || day <= prev) break;
    done.push(manual === true ? { index, day, manual: true } : { index, day });
    prev = day;
  }
  return { programId: program.id, startedDay: v.startedDay, done };
}

/** The first calendar day the next program day may be completed on. */
function earliestNext(progress: ProgramProgress): string {
  const last = progress.done.at(-1);
  return last ? addDays(last.day, 1) : progress.startedDay;
}

/**
 * Bring the record up to date with the practice log, as of `today`.
 *
 * Walks forward one program day at a time. The next day is completed on the
 * earliest calendar day after the previous completion on which the log shows
 * every one of its items; a rest day is completed on the first calendar day
 * it is reached. A day's work never completes two program days, and nothing
 * completes on a day later than `today`. Returns the same object when nothing
 * changed, so a caller can compare by identity before writing.
 */
export function reconcileProgress(
  program: Program,
  progress: ProgramProgress,
  sessions: readonly SessionLog[],
  today: string,
): ProgramProgress {
  let done = progress.done;
  for (;;) {
    const index = done.length;
    if (index >= program.days.length) break;
    const from = earliestNext({ ...progress, done });
    if (from > today) break;
    const d = program.days[index];
    let on: string | null = null;
    if (isRestDay(d)) {
      on = from;
    } else {
      const candidates = [...new Set(sessions.map((s) => s.day))]
        .filter((x) => x >= from && x <= today)
        .sort();
      on = candidates.find((x) => itemsDoneOn(d, sessions, x).every(Boolean)) ?? null;
    }
    if (on === null) break;
    done = [...done, { index, day: on }];
  }
  return done === progress.done ? progress : { ...progress, done };
}

/**
 * Mark the current day done by hand, for items the log cannot see — a song
 * sung elsewhere, a drill stopped before it logged. Refused when today already
 * completed a day, which is the same one-a-day rule the log follows.
 */
export function markDayDone(program: Program, progress: ProgramProgress, today: string): ProgramProgress {
  const index = progress.done.length;
  if (index >= program.days.length) return progress;
  if (earliestNext(progress) > today) return progress;
  return { ...progress, done: [...progress.done, { index, day: today, manual: true }] };
}

export type TodayStatus =
  /** `index` is the day to work today. */
  | "todo"
  /** `index` was completed today; the next opens tomorrow. */
  | "done-today"
  /** Every day is done. */
  | "finished";

export interface ProgramToday {
  status: TodayStatus;
  /** The program day the card shows: today's work, or what today completed. */
  index: number;
  /** Days completed so far. */
  completed: number;
}

/**
 * Today's program day: the next incomplete one, unless today already
 * completed a day, in which case the card shows that one and the next waits
 * for tomorrow. Call after `reconcileProgress`.
 */
export function programToday(program: Program, progress: ProgramProgress, today: string): ProgramToday {
  const completed = progress.done.length;
  const last = progress.done.at(-1);
  if (completed >= program.days.length) {
    return { status: "finished", index: program.days.length - 1, completed };
  }
  if (last && last.day >= today) return { status: "done-today", index: last.index, completed };
  return { status: "todo", index: completed, completed };
}
