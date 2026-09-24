// Multi-week programs: named plans worked day by day.
//
// A routine is one session. A program is the order sessions come in over
// weeks: what to do on day one, what day ten repeats so the two can be
// compared, and when to stop adding difficulty. Sing Sharp's plans (days to
// seven weeks) are the parity reference; the material here is sing's own free
// rooms, so a program invents no exercise and gates nothing.
//
// Progress is derived, never recorded. A program day counts as done on the
// first calendar day by which the practice logged since the previous program
// day (or since the start) covers every task on it. The tasks may be spread
// over several calendar days: free guided practice is capped at three minutes
// a day (lib/free-cap.ts) and most program days are longer, so requiring one
// sitting would make a free program unfinishable on a free account. At most
// one program day completes per calendar day. That reads the log the rooms
// already write (lib/progress.ts), so there is no new field in the progress
// record and nothing to sync.
//
// Honest claims. Each program names the measurements it compares, and each
// must be a `measurable: "yes"` row in contracts/suede-vocal.ts, together with
// what they do not show. lib/programs.test.ts holds every program to that, and
// every link to the rooms and parameters the contract publishes.

import { EXERCISES, titlesFor } from "@/components/warmups/exercises";
import { ROUTINES, routineById, routineSeconds, stepExercise, type Routine } from "@/components/warmups/routines";
import {
  SUSTAIN_ATTEMPT_SEC,
  boxSeconds,
  farinelliSeconds,
  type BreathDrillId,
} from "@/components/breath/routines";
import { EAR_GAME_SECONDS } from "@/components/ear/routines";
import type { GameId } from "@/components/ear/lib";
import type { SessionLog } from "@/lib/progress-shape";
import type { RangeEntry } from "@/lib/analytics";
import { midiToLabel } from "@/lib/audio/notes";

export type ProgramTask =
  | { kind: "routine"; id: string }
  | { kind: "exercise"; id: string }
  | { kind: "breath"; drill: BreathDrillId }
  | { kind: "ear"; game: GameId }
  | { kind: "range" };

export interface ProgramDay {
  /** What the day is for, in the singer's terms. */
  focus: string;
  tasks: ProgramTask[];
}

export interface Program {
  id: string;
  name: string;
  tagline: string;
  /** Calendar weeks the plan is paced for. Days can be done faster or slower. */
  weeks: number;
  days: ProgramDay[];
  /** What to compare at the end, in words. */
  compare: string;
  /** Contract measurement keys the comparison rests on. */
  measurements: string[];
  /** What finishing does not show. */
  doesNotShow: string;
}

const routine = (id: string): ProgramTask => ({ kind: "routine", id });
const ex = (id: string): ProgramTask => ({ kind: "exercise", id });
const breath = (drill: BreathDrillId): ProgramTask => ({ kind: "breath", drill });
const ear = (game: GameId): ProgramTask => ({ kind: "ear", game });
const range: ProgramTask = { kind: "range" };

export const PROGRAMS: Program[] = [
  {
    id: "first-two-weeks",
    name: "Your first two weeks",
    tagline:
      "Ten short practice days over two weeks: measure on day one, build the basics, measure again on day ten.",
    weeks: 2,
    days: [
      { focus: "Take your baseline", tasks: [range, breath("sustain"), ex("five-note-scale")] },
      { focus: "Wake the voice gently", tasks: [routine("morning"), ear("pitch-match")] },
      { focus: "The easy warmup", tasks: [routine("quick"), breath("box")] },
      { focus: "Hold a note", tasks: [ex("sustained-hold"), ex("humming-thirds"), ear("higher-lower")] },
      { focus: "Breath and warmup", tasks: [routine("quick"), breath("farinelli"), breath("sustain")] },
      { focus: "Connect the notes", tasks: [ex("legato-triad"), ex("descending-five"), ear("pitch-match")] },
      { focus: "A full daily set", tasks: [routine("daily")] },
      { focus: "Slide through the middle", tasks: [ex("ng-siren-fifth"), breath("box"), ear("interval")] },
      { focus: "Small steps, heard and sung", tasks: [routine("quick"), ex("chromatic-neighbor"), ear("melody-echo")] },
      { focus: "Measure again", tasks: [range, breath("sustain"), ex("five-note-scale")] },
    ],
    compare:
      "Day ten repeats day one's range test, sustain test and five-note scale. Compare the two days' range, sustain seconds and scale score.",
    measurements: ["rangeExtremes", "sustainSeconds", "scorePercent"],
    doesNotShow:
      "Breath support, tone or vocal health. The sustain timer reads loudness, so a steady hiss counts; a range test records the notes you reached that day, not a permanent change.",
  },
  {
    id: "through-the-middle",
    name: "Through the middle",
    tagline:
      "Four weeks, three days a week, of sirens and connected patterns across the middle of your voice, where most singers hear a shift.",
    weeks: 4,
    days: [
      { focus: "Baseline across the middle", tasks: [ex("lip-trill-scale"), ex("ng-siren-fifth"), ex("legato-triad")] },
      { focus: "Hum through it", tasks: [ex("straw-scale"), ex("humming-thirds"), ex("hung-ee-mm")] },
      { focus: "Slide, then land", tasks: [ex("ng-siren-fifth"), ex("sustained-hold"), ex("hoo-four-note")] },
      { focus: "Wider sirens", tasks: [ex("lip-trill-scale"), ex("octave-siren"), ex("legato-triad")] },
      { focus: "Vowels through the shift", tasks: [ex("straw-scale"), ex("hung-ee-mm"), ex("descending-five")] },
      { focus: "Down from the top", tasks: [ex("hoo-four-note"), ex("reverse-arpeggio"), ex("ng-siren-fifth")] },
      { focus: "The daily set", tasks: [routine("daily")] },
      { focus: "Connected arpeggios", tasks: [ex("lip-trill-scale"), ex("legato-triad"), ex("octave-arpeggio")] },
      { focus: "Sirens both ways", tasks: [ex("ng-siren-fifth"), ex("octave-siren"), ex("hoo-four-note")] },
      { focus: "Hold across the shift", tasks: [ex("straw-scale"), ex("sustained-hold"), ex("hung-ee-mm")] },
      { focus: "The daily set, again", tasks: [routine("daily")] },
      { focus: "Compare with day one", tasks: [ex("lip-trill-scale"), ex("ng-siren-fifth"), ex("legato-triad")] },
    ],
    compare:
      "The last day repeats the first day's three exercises. Compare your scores on Ng siren to the fifth and Legato triad between the two days.",
    measurements: ["scorePercent", "inTuneHoldTime"],
    doesNotShow:
      "Whether your registers blended or a break went away. Nothing in Suede Sing classifies register or detects a crack; the scores show pitch accuracy on the exercise, and your ear and recordings judge the rest.",
  },
  {
    id: "toward-the-top",
    name: "Toward the top",
    tagline:
      "Four weeks, three days a week, of sirens and leaps that visit the top of your range without pushing it, with a range test at each end.",
    weeks: 4,
    days: [
      { focus: "Measure where you are", tasks: [range, ex("lip-trill-scale"), ex("octave-siren")] },
      { focus: "Easy sirens", tasks: [ex("lip-trill-scale"), ex("ng-siren-fifth"), ex("hoo-four-note")] },
      { focus: "Arpeggios up and back", tasks: [ex("straw-scale"), ex("octave-arpeggio"), ex("reverse-arpeggio")] },
      { focus: "The range set", tasks: [routine("range")] },
      { focus: "Leaps, lightly", tasks: [ex("lip-trill-scale"), ex("sixth-leaps"), ex("hoo-four-note")] },
      { focus: "Octave slides", tasks: [ex("ng-siren-fifth"), ex("octave-siren"), ex("gee-octave")] },
      { focus: "Down from the top", tasks: [ex("straw-scale"), ex("reverse-arpeggio"), ex("descending-five")] },
      { focus: "The range set, again", tasks: [routine("range")] },
      { focus: "Light at the top", tasks: [ex("lip-trill-scale"), ex("gee-octave"), ex("hoo-four-note")] },
      { focus: "Leaps and landings", tasks: [ex("octave-arpeggio"), ex("sixth-leaps"), ex("sustained-hold")] },
      { focus: "Sirens, easy and wide", tasks: [ex("straw-scale"), ex("octave-siren"), ex("ng-siren-fifth")] },
      { focus: "Measure again", tasks: [range, ex("lip-trill-scale"), ex("octave-siren")] },
    ],
    compare:
      "The last day repeats the first day's range test. Compare the highest comfortable note between the two scans, and treat a single new note as a reading, not a result.",
    measurements: ["rangeExtremes", "scorePercent"],
    doesNotShow:
      "Freedom from strain or a permanent range gain. Nothing detects strain: stop for pain, pushing or hoarseness, and a note you reached once is not a note you own.",
  },
];

export function programById(id: string | null | undefined): Program | undefined {
  return PROGRAMS.find((p) => p.id === id);
}

/* ------------------------------------------------------------------ labels */

/**
 * The ear room's game names, as it logs them. Restated because
 * components/ear/lib.ts is a client module; lib/programs.test.ts pins this to
 * its GAME_NAMES so a renamed game fails there.
 */
export const EAR_GAME_LABELS: Record<GameId, string> = {
  interval: "Interval ID",
  "pitch-match": "Pitch match",
  "melody-echo": "Melody echo",
  "higher-lower": "Higher or lower",
  "note-catcher": "Note catcher",
};

const BREATH_LABELS: Record<BreathDrillId, string> = {
  box: "Box breathing",
  farinelli: "Farinelli drill",
  sustain: "Sustain test",
};

/** What the singer sees for a task. */
export function taskLabel(t: ProgramTask): string {
  switch (t.kind) {
    case "routine":
      return routineById(t.id)?.name ?? t.id;
    case "exercise":
      return EXERCISES.find((e) => e.id === t.id)?.title ?? t.id;
    case "breath":
      return BREATH_LABELS[t.drill];
    case "ear":
      return EAR_GAME_LABELS[t.game];
    case "range":
      return "Range test";
  }
}

/** Where the task is done. Relative, and only the contract's rooms and params. */
export function taskHref(t: ProgramTask): string {
  switch (t.kind) {
    case "routine":
      return `/warmups?routine=${t.id}`;
    case "exercise":
      return `/warmups?exercise=${t.id}`;
    case "breath":
      return `/breath?drill=${t.drill}`;
    case "ear":
      // The ear room takes no parameters; the task names the game to pick.
      return "/ear-training";
    case "range":
      return "/range";
  }
}

/* ---------------------------------------------------------------- lengths */

/** Reps the warmup room gives an exercise opened on its own. */
const SINGLE_EXERCISE_REPS = 8;
/** A range test at an unhurried pace. */
const RANGE_TEST_SEC = 90;

export function taskSeconds(t: ProgramTask): number {
  switch (t.kind) {
    case "routine": {
      const r = routineById(t.id);
      return r ? routineSeconds(r) : 0;
    }
    case "exercise":
      return routineSeconds({
        id: t.id,
        name: "",
        tagline: "",
        pro: false,
        steps: [{ exerciseId: t.id, reps: SINGLE_EXERCISE_REPS }],
      } satisfies Routine);
    case "breath":
      return t.drill === "box"
        ? boxSeconds({ side: 4, minutes: 1 })
        : t.drill === "farinelli"
          ? farinelliSeconds({ cap: 8 })
          : SUSTAIN_ATTEMPT_SEC * 2;
    case "ear":
      return EAR_GAME_SECONDS[t.game];
    case "range":
      return RANGE_TEST_SEC;
  }
}

export function dayMinutes(day: ProgramDay): number {
  return Math.max(1, Math.round(day.tasks.reduce((n, t) => n + taskSeconds(t), 0) / 60));
}

/* --------------------------------------------------------------- progress */

/** True when these sessions include this task. */
export function taskDone(t: ProgramTask, sessions: readonly SessionLog[]): boolean {
  const has = (type: SessionLog["type"], detail?: (d: string) => boolean) =>
    sessions.some((s) => s.type === type && (!detail || detail(s.detail ?? "")));
  switch (t.kind) {
    case "routine": {
      // The routine runner logs each step under its exercise's title.
      const r = routineById(t.id);
      if (!r) return false;
      return r.steps.every((st) => {
        const titles = titlesFor(stepExercise(st).title);
        return has("warmup", (d) => titles.includes(d));
      });
    }
    case "exercise": {
      const title = EXERCISES.find((e) => e.id === t.id)?.title;
      if (!title) return false;
      const titles = titlesFor(title);
      return has("warmup", (d) => titles.includes(d));
    }
    case "breath":
      return has("breath", (d) => d === BREATH_LABELS[t.drill]);
    case "ear":
      // Ear sessions are logged as "<game>" or "<game> · <variant>".
      return has("ear", (d) => d === EAR_GAME_LABELS[t.game] || d.startsWith(`${EAR_GAME_LABELS[t.game]} · `));
    case "range":
      return has("range");
  }
}

export interface ProgramProgress {
  /** For each program day, the calendar day it was completed on, or null. */
  doneOn: (string | null)[];
  /** Index of the next day to do; equals days.length when finished. */
  current: number;
  /**
   * First calendar day whose practice counts toward the current program day:
   * the start, or the day after the previous program day was done.
   */
  countsFrom: string;
  /** For each done program day, the calendar days its practice was gathered over. */
  spans: ({ from: string; to: string } | null)[];
}

/** The calendar day after a YYYY-MM-DD day. */
function nextDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().slice(0, 10);
}

/**
 * Walk the calendar days from the start, in order, gathering practice toward
 * the next program day due. Each calendar day can complete at most one program
 * day, which is what "worked day by day" means: doing day three's tasks early
 * doesn't skip day two, and practice on the day a program day was done starts
 * nothing toward the next one.
 */
export function programProgress(
  program: Program,
  sessions: readonly SessionLog[],
  startedDay: string,
  opts: {
    /** ISO time the program was (re)started; earlier sessions that day don't count. */
    startedAt?: string;
    /**
     * Program days already recorded as done, in order. Kept because some
     * evidence is not durable (the sustain room keeps only its last ten
     * attempts), and a day once done must not come undone when it is evicted.
     */
    done?: readonly { from: string; to: string }[];
  } = {},
): ProgramProgress {
  const doneOn: (string | null)[] = program.days.map(() => null);
  const spans: ProgramProgress["spans"] = program.days.map(() => null);
  let current = 0;
  let countsFrom = startedDay;
  for (const span of (opts.done ?? []).slice(0, program.days.length)) {
    doneOn[current] = span.to;
    spans[current] = span;
    current += 1;
    countsFrom = nextDay(span.to);
  }
  const byDay = new Map<string, SessionLog[]>();
  for (const s of sessions) {
    if (s.day < countsFrom) continue;
    if (opts.startedAt && s.date < opts.startedAt) continue;
    const list = byDay.get(s.day);
    if (list) list.push(s);
    else byDay.set(s.day, [s]);
  }
  let gathered: SessionLog[] = [];
  for (const day of [...byDay.keys()].sort()) {
    if (current >= program.days.length) break;
    gathered = gathered.concat(byDay.get(day)!);
    if (program.days[current].tasks.every((t) => taskDone(t, gathered))) {
      doneOn[current] = day;
      spans[current] = { from: countsFrom, to: day };
      current += 1;
      countsFrom = nextDay(day);
      gathered = [];
    }
  }
  return { doneOn, current, countsFrom, spans };
}

/**
 * A routine's steps as separate exercise tasks. A free account's allowance
 * can stop a routine between steps, and the routine room starts again from
 * step one, so a program lists the steps too: the rest can be sung one at a
 * time on a later day. taskDone already counts a routine by its steps.
 */
export function routineStepTasks(id: string): ProgramTask[] {
  const r = routineById(id);
  return r ? r.steps.map((s) => ex(stepExercise(s).id)) : [];
}

/** Local calendar day of an ISO timestamp, as lib/progress.ts localDay files it. */
export function localDayOf(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Sustain attempts as session rows. The sustain room keeps every attempt of a
 * second or more in its own record but logs a session only from five
 * seconds, so a beginner's shorter attempts would otherwise never complete a
 * program's sustain task.
 */
export function sustainAttemptLogs(attempts: readonly { sec: number; date: string }[]): SessionLog[] {
  return attempts.map((a, i) => ({
    id: `sustain-attempt-${i}-${a.date}`,
    type: "breath",
    date: a.date,
    day: localDayOf(a.date),
    durationSec: a.sec,
    detail: BREATH_LABELS.sustain,
    xp: 0,
  }));
}

export interface ComparisonRow {
  label: string;
  first: string | null;
  last: string | null;
}

/**
 * The first and last program days side by side, for the tasks they share:
 * best exercise score, longest sustain, and the range test's notes. Read from
 * the full session log and range history, so a baseline that has scrolled off
 * /progress or been replaced as the latest range still shows. A value the
 * record no longer holds is null, and the page says so rather than guessing.
 */
export function programComparison(
  program: Program,
  progress: ProgramProgress,
  sessions: readonly SessionLog[],
  rangeHistory: readonly RangeEntry[],
): ComparisonRow[] {
  const firstSpan = progress.spans[0];
  const lastSpan = progress.spans[program.days.length - 1];
  if (!firstSpan || !lastSpan) return [];
  const within = (day: string, span: { from: string; to: string }) => day >= span.from && day <= span.to;
  const lastTasks = program.days[program.days.length - 1].tasks;
  const shared = program.days[0].tasks.filter((t) =>
    lastTasks.some((u) => JSON.stringify(u) === JSON.stringify(t)),
  );

  const value = (t: ProgramTask, span: { from: string; to: string }): string | null => {
    const inSpan = sessions.filter((s) => within(s.day, span) && taskDone(t, [s]));
    switch (t.kind) {
      case "exercise": {
        const scores = inSpan.map((s) => s.score).filter((n): n is number => typeof n === "number");
        return scores.length ? `${Math.round(Math.max(...scores))}%` : null;
      }
      case "breath": {
        if (t.drill !== "sustain" || !inSpan.length) return null;
        return `${Math.max(...inSpan.map((s) => s.durationSec)).toFixed(1)} s`;
      }
      case "range": {
        const tests = rangeHistory.filter((r) => within(localDayOf(r.testedAt), span));
        const r = tests[tests.length - 1];
        return r ? `${midiToLabel(r.lowMidi)}–${midiToLabel(r.highMidi)}` : null;
      }
      default:
        return null;
    }
  };

  return shared
    .filter((t) => t.kind === "exercise" || t.kind === "range" || (t.kind === "breath" && t.drill === "sustain"))
    .map((t) => ({ label: taskLabel(t), first: value(t, firstSpan), last: value(t, lastSpan) }));
}

/** Every free routine a program may name, for the tests. */
export const PROGRAM_ROUTINE_IDS = new Set(ROUTINES.filter((r) => !r.pro).map((r) => r.id));
