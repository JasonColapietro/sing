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
// warmup routine counts when every one of its exercises was logged, a breath
// set when each of its drills was, the range test when a range session was.
// What the log cannot see, the singer marks by hand.
//
// A program day's items may be logged over several calendar days, from the
// day it opens: the free plan stops guided practice after three minutes a day
// (lib/free-cap.ts) and most program days run longer, so requiring one sitting
// would make a free program impossible to finish from the log.
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
  CUE_HOLD_SEC,
  CUE_REP_CHOICES,
  breathDrillTitle,
  breathRoutineById,
  breathRoutineSeconds,
  breathStepSeconds,
  breathStepSummary,
  SUSTAIN_LOG_MIN_SEC,
  type BreathDrillId,
  type BreathStep,
} from "@/components/breath/routines";
import { SONGS } from "@/components/songs/data";
import { COUNT_IN_BEATS, secPerBeat, sessionSeconds } from "@/components/songs/lib";
import type { ActivityType, SessionLog } from "@/lib/progress-shape";
import type { RangeEntry } from "@/lib/analytics";
import { CAPPED_TYPES } from "@/lib/free-cap";

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
  | { kind: "song"; slug: string }
  /** A recorded take in the Recorder, to compare against later. */
  | { kind: "recorder" };

export interface ProgramDay {
  title: string;
  /** Empty on a rest day. */
  items: ProgramItem[];
}

/** A stretch of weeks that a book chapter teaches. */
export interface ProgramChapter {
  /** 1-based, inclusive. */
  fromWeek: number;
  toWeek: number;
  /** A slug in lib/book-data.ts, opened at /book/<slug>. */
  slug: string;
  /**
   * The chapter's title, restated so the page need not ship the book's text
   * to the browser. A test holds it to lib/book-data.ts.
   */
  title: string;
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
  /**
   * Days after the first `FREE_WEEKS` weeks need Pro. Week 1 of a Pro program
   * is open to everyone and built only from free content, so a singer can try
   * the program before paying for the rest of it.
   */
  pro: boolean;
  /** The book chapters that teach its weeks, when it follows the book. */
  chapters?: ProgramChapter[];
  days: ProgramDay[];
}

/** Weeks of a Pro program that are free. */
export const FREE_WEEKS = 1;

/** True when this day of the program needs Pro: a Pro program past its free week. */
export function dayNeedsPro(program: Program, index: number): boolean {
  return program.pro && index >= FREE_WEEKS * 7;
}

/** A recorded take is a verse and a chorus, so its length is an estimate too. */
export const RECORDER_SEC = 120;

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
  // The rep picker's starting value, as the breath room opens the drill.
  cue: { drill: "cue", reps: CUE_REP_CHOICES[1], holdSec: CUE_HOLD_SEC },
};

const routine = (id: string): ProgramItem => ({ kind: "routine", id });
const exercise = (id: string, reps: number): ProgramItem => ({ kind: "exercise", id, reps });
const breath = (id: string): ProgramItem => ({ kind: "breath", id });
const drill = (id: BreathDrillId): ProgramItem => ({ kind: "drill", id });
const range: ProgramItem = { kind: "range" };
const song = (slug: string): ProgramItem => ({ kind: "song", slug });
const recorder: ProgramItem = { kind: "recorder" };
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

// Week 1 is the free week, so it uses free exercises only and each day fits
// the free plan's three guided minutes: short sirens and slides that find where
// the voice changes gear, before the Pro packs work across it.
const MIX_FREE_A = day(
  "Find the crossing",
  exercise("ng-siren-fifth", 5),
  exercise("octave-siren", 4),
  exercise("hoo-four-note", 5),
  exercise("descending-five", 4),
);
const MIX_FREE_B = day(
  "Quiet slides",
  exercise("morning-hum", 5),
  exercise("soft-trill-slide", 5),
  exercise("octave-siren", 4),
  exercise("morning-sigh", 5),
);
const MIX_FREE_C = day(
  "Light on top, then down",
  exercise("lip-trill-scale", 6),
  exercise("gee-octave", 4),
  exercise("reverse-arpeggio", 4),
  exercise("quiet-hum-descent", 5),
);
const MIX_FREE_WEEK = [MIX_FREE_A, MIX_FREE_B, MIX_FREE_C, rest(), MIX_FREE_A, MIX_FREE_B, rest()];

const MIX: Program = {
  id: "mix-4w",
  name: "Mix in 4 weeks",
  tagline: "Four weeks of carrying one sound across the octave where most voices change gear, from the head-voice side and the chest side in turn.",
  measures:
    "Every exercise scores how close each note landed. The app cannot hear which register you are in, so the blend itself is yours to judge. A range test opens and closes the four weeks.",
  weeks: 4,
  pro: true,
  days: [
    ...week(MIX_FREE_WEEK, {
      0: day(
        "Where you start",
        range,
        exercise("ng-siren-fifth", 5),
        exercise("octave-siren", 4),
        exercise("hoo-four-note", 5),
        exercise("descending-five", 4),
      ),
    }),
    ...week(MIX_WEEK, { 0: day("Into the mix pack", routine("quick"), routine("mix")) }),
    ...week(MIX_WEEK),
    ...week(MIX_WEEK, { 6: day("Check in", range, routine("daily"), routine("mix")) }),
  ],
};

/** Four sessions a week, spread out, as the book asks: "three is the floor, four is better". */
function bookWeek(a: ProgramDay, b: ProgramDay, c: ProgramDay, d: ProgramDay): ProgramDay[] {
  return [a, b, rest(), c, d, rest(), rest()];
}

/**
 * The Measured Voice, chapters 13–19: twelve weeks in six fortnights, each
 * taught by its chapter. The three range tests fall where the book puts them —
 * week 1, the end of week 6 and the start of week 12 — and the recorded take
 * from day 1 is sung again at the start of week 12 to compare.
 *
 * Week 1 is free, so it is short breath drills and single free exercises, each
 * day inside the free plan's three guided minutes. The later weeks follow the
 * book's twenty-minute session: breath, a warmup, the fortnight's work.
 */
const MEASURED_VOICE: Program = {
  id: "measured-voice-12w",
  name: "The Measured Voice: 12 weeks",
  tagline:
    "The book's twelve-week plan, four sessions a week: baseline and breath, the middle, the break, the top, the bottom, then songs.",
  measures:
    "Range tests on day 1, at the end of week 6 and at the start of week 12 record the lowest and highest notes the test found, and a sustain test records the seconds you held. A recorded take on day 1 and in week 12 is for you to compare by ear.",
  weeks: 12,
  pro: true,
  chapters: [
    { fromWeek: 1, toWeek: 2, slug: "weeks-1-2-baseline", title: "Weeks 1 and 2: baseline and breath" },
    { fromWeek: 3, toWeek: 4, slug: "weeks-3-4-middle", title: "Weeks 3 and 4: the middle voice" },
    { fromWeek: 5, toWeek: 6, slug: "weeks-5-6-passaggio", title: "Weeks 5 and 6: through the break" },
    { fromWeek: 7, toWeek: 8, slug: "weeks-7-8-top", title: "Weeks 7 and 8: extending the top" },
    { fromWeek: 9, toWeek: 10, slug: "weeks-9-10-bottom", title: "Weeks 9 and 10: the bottom and the long phrase" },
    { fromWeek: 11, toWeek: 12, slug: "weeks-11-12-songs", title: "Weeks 11 and 12: putting it in a song" },
  ],
  days: [
    // Weeks 1–2: baseline and breath.
    ...bookWeek(
      day("Your baseline", range, recorder, drill("sustain"), exercise("morning-hum", 5), exercise("lip-trill-scale", 6)),
      day("Box breath, a gentle middle", drill("box"), exercise("morning-hum", 5), exercise("hoo-four-note", 5), exercise("descending-five", 4)),
      day("The climb to eight", drill("farinelli"), exercise("lip-trill-scale", 6), exercise("morning-sustain", 4)),
      day("Box breath, a held note", drill("box"), exercise("morning-sigh", 5), exercise("sustained-hold", 3), exercise("descending-five", 4)),
    ),
    ...bookWeek(
      day("Breath and a morning set", breath("daily"), routine("morning")),
      day("Breath and the easy four", breath("daily"), routine("quick")),
      day("The long breath set", breath("builder"), routine("morning")),
      day("A sustain, then the easy four", drill("sustain"), breath("quick"), routine("quick")),
    ),
    // Weeks 3–4: the middle voice.
    ...[3, 4].flatMap(() =>
      bookWeek(
        day("The complete ten", breath("quick"), routine("daily")),
        day("The easy four and a song", breath("daily"), routine("quick"), song("silent-night")),
        day("The complete ten again", breath("quick"), routine("daily")),
        day("The easy four and a song", breath("quick"), routine("quick"), song("ode-to-joy")),
      ),
    ),
    // Weeks 5–6: through the break, quietly. The block closes with a retest.
    ...bookWeek(
      day("Slides across the break", routine("quick"), routine("mix")),
      day("Reach both ends", breath("daily"), routine("range")),
      day("Slides across the break", routine("quick"), routine("mix")),
      day("Quiet and low", breath("quick"), routine("morning"), routine("recovery")),
    ),
    ...week(
      bookWeek(
        day("Slides across the break", routine("quick"), routine("mix")),
        day("Reach both ends", breath("daily"), routine("range")),
        day("Slides across the break", routine("quick"), routine("mix")),
        day("Quiet and low", breath("quick"), routine("morning"), routine("recovery")),
      ),
      { 6: day("Halfway check-in", range, drill("sustain"), breath("quick"), routine("quick")) },
    ),
    // Weeks 7–8: height without weight, head voice before belt.
    ...[7, 8].flatMap(() =>
      bookWeek(
        day("Light and high", routine("quick"), routine("high-notes")),
        day("Head voice", routine("quick"), routine("head-voice-builder")),
        day("The ten, then the tenth", routine("daily"), routine("high-notes")),
        day("Quiet and low", breath("quick"), routine("morning"), routine("recovery")),
      ),
    ),
    // Weeks 9–10: the bottom, and long phrases rather than long notes.
    ...[9, 10].flatMap(() =>
      bookWeek(
        day("Breath for a long phrase", breath("builder"), routine("daily")),
        day("Down low, gently", breath("daily"), routine("recovery"), routine("morning"), drill("sustain")),
        day("Breath for a long phrase", breath("builder"), routine("quick"), drill("sustain")),
        day("Quiet and low", breath("daily"), routine("recovery"), routine("morning")),
      ),
    ),
    // Weeks 11–12: songs. Week 12 opens on the last retest and the second take.
    ...bookWeek(
      day("A song, warmed up", breath("daily"), routine("quick"), song("silent-night")),
      day("A song, warmed up", breath("daily"), routine("quick"), song("ode-to-joy")),
      day("A song, warmed up", breath("daily"), routine("quick"), song("home-on-the-range")),
      day("Two songs", breath("daily"), routine("morning"), song("silent-night"), song("ode-to-joy")),
    ),
    ...week(
      bookWeek(
        day("Where you are now", range, recorder, drill("sustain"), routine("quick")),
        day("A song, warmed up", breath("daily"), routine("quick"), song("home-on-the-range")),
        day("A song, warmed up", breath("daily"), routine("quick"), song("silent-night")),
        day("Two songs", breath("daily"), routine("morning"), song("ode-to-joy"), song("home-on-the-range")),
      ),
      { 6: day("The last session", breath("quick"), routine("daily"), song("silent-night")) },
    ),
  ],
};

/** Shortest first, the Pro programs last. */
export const PROGRAMS: Program[] = [RECOVERY, FOUNDATIONS, VIBRATO, HIGH_NOTES, MIX, MEASURED_VOICE];

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
    case "recorder":
      return RECORDER_SEC;
    case "song": {
      const s = songBySlug(item.slug);
      return s ? sessionSeconds(s) + COUNT_IN_BEATS * secPerBeat(s.bpm, 1) : 0;
    }
  }
}

export function daySeconds(d: ProgramDay): number {
  return d.items.reduce((a, item) => a + itemSeconds(item), 0);
}

/** The kind of session an item logs, which is what the free plan's cap counts. */
function itemType(item: ProgramItem): ActivityType {
  switch (item.kind) {
    case "routine":
    case "exercise":
      return "warmup";
    case "breath":
    case "drill":
      return "breath";
    case "range":
      return "range";
    case "song":
      return "song";
    case "recorder":
      return "recording";
  }
}

/**
 * Seconds of a day the free plan's daily allowance counts (lib/free-cap
 * `CAPPED_TYPES`). The range test and the Recorder sit outside it.
 */
export function cappedDaySeconds(d: ProgramDay): number {
  return d.items.reduce((a, item) => a + (CAPPED_TYPES.has(itemType(item)) ? itemSeconds(item) : 0), 0);
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
    case "recorder":
      return "/recorder";
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
    case "recorder":
      return { title: "Record a take", meta: `Recorder · a verse and a chorus · about ${min}` };
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
    case "recorder":
      return [{ type: "recording", details: null }];
    case "song": {
      const s = songBySlug(item.slug);
      return s ? [{ type: "song", details: [s.title] }] : [];
    }
  }
}

function satisfies(s: SessionLog, e: Evidence): boolean {
  return s.type === e.type && (e.details === null || (s.detail !== undefined && e.details.includes(s.detail)));
}

/**
 * Which items of a day the log shows done from `from` through `day`, in
 * order. `from` defaults to `day`, one calendar day's log.
 *
 * Each logged session pays for at most one requirement across the whole day:
 * a routine of N exercises needs N sessions, and a lone Sustain test beside a
 * breath set that also contains one needs a second sustain. Items are added in
 * order to a bipartite matching of requirements to sessions, each by
 * augmenting paths so an earlier item can give up a session it does not need;
 * an item that cannot be fully matched is rolled back and left unticked. When
 * the whole day can be matched at all, every item is.
 */
export function itemsDoneOn(
  d: ProgramDay,
  sessions: readonly SessionLog[],
  day: string,
  from: string = day,
): boolean[] {
  return matchDay(d, sessions, day, from).items;
}

/**
 * The matching behind itemsDoneOn, with the requirement-level result too:
 * `steps[i][k]` is whether requirement k of item i (a routine's k-th exercise,
 * a set's k-th drill; see itemSteps) is paid for by a session. Unfinished
 * items get partial credit afterwards, one requirement at a time, from the
 * sessions the finished ones left, so a step tick never spends a session
 * another row already uses.
 */
export function matchDay(
  d: ProgramDay,
  sessions: readonly SessionLog[],
  day: string,
  from: string = day,
): { items: boolean[]; steps: boolean[][] } {
  const pool = sessions.filter((s) => s.day >= from && s.day <= day);
  const reqs: Evidence[] = [];
  /** reqOf[r] = [item index, requirement index within the item]. */
  const reqOf: [number, number][] = [];
  /** owner[sessionIndex] = the requirement it pays for. */
  let owner: (number | undefined)[] = [];
  const assign = (r: number, seen: Set<number>): boolean => {
    for (let i = 0; i < pool.length; i++) {
      if (seen.has(i) || !satisfies(pool[i], reqs[r])) continue;
      seen.add(i);
      const held = owner[i];
      if (held === undefined || assign(held, seen)) {
        owner[i] = r;
        return true;
      }
    }
    return false;
  };
  const items = d.items.map((item, idx) => {
    const evidence = itemEvidence(item);
    if (evidence.length === 0) return false;
    const before = owner.slice();
    const start = reqs.length;
    reqs.push(...evidence);
    reqOf.push(...evidence.map((_, k): [number, number] => [idx, k]));
    for (let r = start; r < reqs.length; r++) {
      if (!assign(r, new Set())) {
        owner = before;
        reqs.length = start;
        reqOf.length = start;
        return false;
      }
    }
    return true;
  });
  d.items.forEach((item, idx) => {
    if (items[idx]) return;
    itemEvidence(item).forEach((e, k) => {
      const before = owner.slice();
      reqs.push(e);
      reqOf.push([idx, k]);
      if (!assign(reqs.length - 1, new Set())) {
        owner = before;
        reqs.pop();
        reqOf.pop();
      }
    });
  });
  const steps = d.items.map((item) => itemEvidence(item).map(() => false));
  for (const r of owner) {
    if (r === undefined) continue;
    const [i, k] = reqOf[r];
    steps[i][k] = true;
  }
  return { items, steps };
}

/** Whether the log shows the item done from `from` through `day`, on its own. */
export function itemDoneOn(
  item: ProgramItem,
  sessions: readonly SessionLog[],
  day: string,
  from: string = day,
): boolean {
  return itemsDoneOn({ title: "", items: [item] }, sessions, day, from)[0];
}

/**
 * A routine's exercises or a breath set's drills as items of their own. The
 * rooms run a routine or set from its first step, and the free plan can stop
 * one between steps, so the day card also links each step: the rest can be
 * sung one at a time on a later day, and they count toward the routine the
 * same way (its evidence is one session per step).
 */
export function itemSteps(item: ProgramItem): ProgramItem[] {
  if (item.kind === "routine") {
    const r = routineById(item.id);
    return r ? r.steps.map((s) => ({ kind: "exercise", id: s.exerciseId, reps: s.reps })) : [];
  }
  if (item.kind === "breath") {
    const r = breathRoutineById(item.id);
    return r ? r.steps.map((s) => ({ kind: "drill", id: s.drill })) : [];
  }
  return [];
}

/**
 * Where step `k` of a routine or breath set is sung. Both open the routine or
 * set at that step (1-based `step`), so the step keeps its preset (a
 * routine's rep count, a one-minute square, a cap of ten) rather than the
 * standalone defaults of the lone exercise or drill.
 */
export function itemStepHref(item: ProgramItem, k: number): string {
  if (item.kind === "breath" || item.kind === "routine") {
    return `${itemHref(item)}&step=${k + 1}`;
  }
  return itemHref(item);
}

/** The local calendar day of an ISO timestamp, as lib/progress.ts files a session. */
export function localDayOf(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Sustain attempts too short to be logged as sessions, as session rows. The
 * sustain room keeps every attempt of a second or more in its own record
 * (components/breath/store.ts) but logs a session only from
 * SUSTAIN_LOG_MIN_SEC, so a beginner's first holds would otherwise never
 * complete a program's sustain test. Longer attempts are left out: they are
 * already in the log, and counting them twice would let one hold pay for two
 * sustain requirements.
 */
export function sustainAttemptSessions(
  attempts: readonly { sec: number; date: string }[],
): SessionLog[] {
  return attempts
    .filter((a) => a.sec < SUSTAIN_LOG_MIN_SEC && Number.isFinite(Date.parse(a.date)))
    .map((a) => ({
      id: `sustain-attempt:${a.date}`,
      type: "breath" as const,
      date: a.date,
      day: localDayOf(a.date),
      durationSec: a.sec,
      detail: breathDrillTitle("sustain"),
      xp: 0,
    }));
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
  /**
   * A check-in day's readings, kept once seen. A sustain hold under five
   * seconds lives only in the sustain room's ten-attempt record, so the
   * reading has to be kept here to still be there on the last day.
   */
  range?: { lowMidi: number; highMidi: number };
  sustainSec?: number;
}

export interface ProgramProgress {
  programId: string;
  /** The local day the program was started, YYYY-MM-DD. */
  startedDay: string;
  /**
   * The moment it was started, as an ISO timestamp. Sessions logged before it
   * belong to an earlier run, so a restart on the same day starts clean.
   * Absent on records written before it existed; those fall back to
   * `startedDay`.
   */
  startedAt?: string;
  /**
   * Completed days, in order: `done[i].index === i`, and each on a later
   * calendar day than the one before.
   */
  done: DayDone[];
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A YYYY-MM-DD string naming a real calendar date. The shape alone lets
 * "2026-99-99" through, and addDays on that throws.
 */
export function isCalendarDay(value: unknown): value is string {
  if (typeof value !== "string" || !DAY_RE.test(value)) return false;
  const t = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === value;
}

/** `day` plus `n` calendar days. Date-only arithmetic, so no clock or DST. */
export function addDays(day: string, n: number): string {
  const t = Date.parse(`${day}T00:00:00Z`) + n * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

export function startProgram(programId: string, today: string, now: Date = new Date()): ProgramProgress {
  return { programId, startedDay: today, startedAt: now.toISOString(), done: [] };
}

/** The sessions that can count toward this run: none from before it started. */
export function sessionsForRun(progress: ProgramProgress, sessions: readonly SessionLog[]): readonly SessionLog[] {
  const since = progress.startedAt ? Date.parse(progress.startedAt) : NaN;
  if (!Number.isFinite(since)) return sessions;
  return sessions.filter((s) => {
    const t = Date.parse(s.date);
    return !Number.isFinite(t) || t >= since;
  });
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
  if (!program || !isCalendarDay(v.startedDay)) return null;
  const done: DayDone[] = [];
  let prev = "";
  for (const d of Array.isArray(v.done) ? v.done : []) {
    if (typeof d !== "object" || d === null) break;
    const { index, day, manual, range, sustainSec } = d as Partial<DayDone>;
    if (index !== done.length || index >= program.days.length) break;
    if (!isCalendarDay(day) || day <= prev || day < v.startedDay) break;
    const entry: DayDone = manual === true ? { index, day, manual: true } : { index, day };
    if (
      typeof range === "object" && range !== null &&
      Number.isFinite(range.lowMidi) && Number.isFinite(range.highMidi) && range.lowMidi <= range.highMidi
    ) {
      entry.range = { lowMidi: range.lowMidi, highMidi: range.highMidi };
    }
    if (typeof sustainSec === "number" && Number.isFinite(sustainSec) && sustainSec > 0) entry.sustainSec = sustainSec;
    done.push(entry);
    prev = day;
  }
  const startedAt =
    typeof v.startedAt === "string" && Number.isFinite(Date.parse(v.startedAt)) ? v.startedAt : undefined;
  return { programId: program.id, startedDay: v.startedDay, ...(startedAt ? { startedAt } : {}), done };
}

/**
 * The first calendar day the next program day may be completed on, which is
 * also the first day whose practice counts toward it.
 */
export function earliestNext(progress: ProgramProgress): string {
  const last = progress.done.at(-1);
  return last ? addDays(last.day, 1) : progress.startedDay;
}

/**
 * Bring the record up to date with the practice log, as of `today`.
 *
 * Walks forward one program day at a time. The next day is completed on the
 * earliest calendar day after the previous completion by which the log, from
 * the day after that completion, shows every one of its items; a rest day is
 * completed on the first calendar day it is reached. A day's work never completes two program days, and nothing
 * completes on a day later than `today`. Returns the same object when nothing
 * changed, so a caller can compare by identity before writing.
 */
export function reconcileProgress(
  program: Program,
  progress: ProgramProgress,
  sessions: readonly SessionLog[],
  today: string,
): ProgramProgress {
  const counted = sessionsForRun(progress, sessions);
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
      const candidates = [...new Set(counted.map((s) => s.day))]
        .filter((x) => x >= from && x <= today)
        .sort();
      on = candidates.find((x) => itemsDoneOn(d, counted, x, from).every(Boolean)) ?? null;
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

/* ------------------------------------------------------------------ *
 * Readings: what the check-in days measured.
 * ------------------------------------------------------------------ */

export interface ProgramReading {
  /** Index into the program's days. */
  index: number;
  /** The calendar day that program day was completed on. */
  day: string;
  /** The last range test logged toward that day; null when none is on record. */
  range: { lowMidi: number; highMidi: number } | null;
  /** The longest sustain logged toward that day, in seconds; undefined when the day has no sustain test. */
  sustainSec?: number | null;
}

/**
 * The range and sustain readings of every completed program day that takes
 * them, oldest first, so a program's "compare day 1 with day 14" can be done
 * on the page. /progress shows only the latest range and a short session list,
 * so by the last day of a program the first day's readings are off both. Read
 * from the full log and range history, over the calendar days each program day
 * gathered its practice from, and only from this run.
 */
export function programReadings(
  program: Program,
  progress: ProgramProgress,
  sessions: readonly SessionLog[],
  rangeHistory: readonly RangeEntry[],
  /**
   * The sustain room's attempt record, every length. The log rounds a
   * session to whole seconds; the attempts keep the timer's tenths.
   */
  holds: readonly { sec: number; date: string }[] = [],
): ProgramReading[] {
  const counted = sessionsForRun(progress, sessions);
  const since = progress.startedAt ? Date.parse(progress.startedAt) : NaN;
  const out: ProgramReading[] = [];
  progress.done.forEach((done, i) => {
    const items = program.days[done.index]?.items ?? [];
    const hasRange = items.some((it) => it.kind === "range");
    const hasSustain = items.some((it) => it.kind === "drill" && it.id === "sustain");
    if (!hasRange && !hasSustain) return;
    const from = i === 0 ? progress.startedDay : addDays(progress.done[i - 1].day, 1);
    const within = (day: string) => day >= from && day <= done.day;
    const reading: ProgramReading = { index: done.index, day: done.day, range: null };
    if (hasRange) {
      const tests = rangeHistory.filter((r) => {
        const t = Date.parse(r.testedAt);
        return within(localDayOf(r.testedAt)) && (!Number.isFinite(since) || t >= since);
      });
      const last = tests.at(-1);
      reading.range = last ? { lowMidi: last.lowMidi, highMidi: last.highMidi } : (done.range ?? null);
    }
    if (hasSustain) {
      const secs = [
        ...counted
          .filter((s) => within(s.day) && s.type === "breath" && s.detail === breathDrillTitle("sustain"))
          .map((s) => s.durationSec),
        ...holds
          .filter((h) => {
            const t = Date.parse(h.date);
            return Number.isFinite(t) && within(localDayOf(h.date)) && (!Number.isFinite(since) || t >= since);
          })
          .map((h) => h.sec),
      ];
      reading.sustainSec = secs.length ? Math.max(...secs, done.sustainSec ?? 0) : (done.sustainSec ?? null);
    }
    out.push(reading);
  });
  return out;
}

/**
 * The record with each check-in reading kept on its day, so programReadings
 * can still show it after the evidence ages out. Returns the same object when
 * nothing new was read, so a caller can compare by identity before writing.
 */
export function withReadings(progress: ProgramProgress, readings: readonly ProgramReading[]): ProgramProgress {
  let done = progress.done;
  for (const r of readings) {
    const cur = done[r.index];
    if (!cur) continue;
    const next: DayDone = { ...cur };
    let changed = false;
    if (r.range && (cur.range?.lowMidi !== r.range.lowMidi || cur.range?.highMidi !== r.range.highMidi)) {
      next.range = { ...r.range };
      changed = true;
    }
    if (typeof r.sustainSec === "number" && r.sustainSec !== cur.sustainSec) {
      next.sustainSec = r.sustainSec;
      changed = true;
    }
    if (!changed) continue;
    if (done === progress.done) done = [...done];
    done[r.index] = next;
  }
  return done === progress.done ? progress : { ...progress, done };
}
