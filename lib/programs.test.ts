import { describe, expect, it } from "vitest";
import {
  FREE_WEEKS,
  PROGRAMS,
  addDays,
  cappedDaySeconds,
  dayMinutes,
  dayNeedsPro,
  isRestDay,
  itemDoneOn,
  itemsDoneOn,
  itemEvidence,
  itemHref,
  itemIsPro,
  itemLabel,
  markDayDone,
  programById,
  programMinutesRange,
  programToday,
  reconcileProgress,
  reviveProgress,
  sessionsForRun,
  startProgram,
  type Program,
  type ProgramDay,
  type ProgramItem,
} from "./programs";
import { routineById, isFreeExercise, stepExercise } from "@/components/warmups/routines";
import { ALL_EXERCISES } from "@/components/warmups/exercises";
import { breathRoutineById, isBreathDrillId } from "@/components/breath/routines";
import { SONGS } from "@/components/songs/data";
import { BAND_ORDER, bandForSong } from "@/components/songs/lib";
import type { SessionLog } from "./progress-shape";
import { BOOK_CONTENTS } from "./book-data";
import { FREE_DAILY_SEC } from "./free-cap";

const allItems = (p: Program) => p.days.flatMap((d) => d.items);

let n = 0;
function session(day: string, type: SessionLog["type"], detail?: string, time = "12:00:00"): SessionLog {
  n += 1;
  return { id: `s${n}`, type, date: `${day}T${time}.000Z`, day, durationSec: 60, detail, xp: 1 };
}

/** Every item's evidence, one session each, logged at `time` UTC on `day`. */
function sessionsForDay(d: ProgramDay, day: string, time = "12:00:00"): SessionLog[] {
  return d.items.flatMap((item) => itemEvidence(item).map((e) => session(day, e.type, e.details?.[0], time)));
}

/** The sessions that would make every item of a program day done on `day`. */
function sessionsFor(d: ProgramDay, day: string): SessionLog[] {
  return d.items.flatMap((item) =>
    itemEvidence(item).map((e) => session(day, e.type, e.details?.[0])),
  );
}

describe("program data", () => {
  it("has unique ids and four to six programs", () => {
    expect(PROGRAMS.length).toBeGreaterThanOrEqual(4);
    expect(PROGRAMS.length).toBeLessThanOrEqual(6);
    expect(new Set(PROGRAMS.map((p) => p.id)).size).toBe(PROGRAMS.length);
    for (const p of PROGRAMS) expect(programById(p.id)).toBe(p);
    expect(programById("nope")).toBeNull();
  });

  it("spans days to weeks, and each program's weeks match its calendar", () => {
    for (const p of PROGRAMS) {
      expect(p.days.length, p.id).toBe(p.weeks * 7);
    }
    const lengths = PROGRAMS.map((p) => p.weeks);
    expect(Math.min(...lengths)).toBe(1);
    expect(Math.max(...lengths)).toBeGreaterThanOrEqual(6);
    // The book's plan is the longest: twelve weeks.
    expect(Math.max(...lengths)).toBe(12);
  });

  it("resolves every id it names", () => {
    for (const p of PROGRAMS) {
      for (const item of allItems(p)) {
        switch (item.kind) {
          case "routine":
            expect(routineById(item.id), `${p.id}: routine ${item.id}`).not.toBeNull();
            break;
          case "exercise":
            expect(ALL_EXERCISES.some((e) => e.id === item.id), `${p.id}: exercise ${item.id}`).toBe(true);
            expect(item.reps).toBeGreaterThan(0);
            break;
          case "breath":
            expect(breathRoutineById(item.id), `${p.id}: breath ${item.id}`).not.toBeNull();
            break;
          case "drill":
            expect(isBreathDrillId(item.id)).toBe(true);
            break;
          case "song":
            expect(SONGS.some((s) => s.slug === item.slug), `${p.id}: song ${item.slug}`).toBe(true);
            break;
        }
        // Every item has something in the log that can mark it done.
        expect(itemEvidence(item).length, JSON.stringify(item)).toBeGreaterThan(0);
        expect(itemLabel(item).title).not.toBe("");
      }
    }
  });

  it("names the focus routines the S9b slice added", () => {
    const named = new Set(PROGRAMS.flatMap((p) => allItems(p).flatMap((i) => (i.kind === "routine" ? [i.id] : []))));
    for (const id of ["vibrato", "recovery", "high-notes", "mix"]) expect(named.has(id), id).toBe(true);
  });

  it("keeps each practice day at about 10 to 20 minutes, except a Pro program's free week", () => {
    for (const p of PROGRAMS) {
      p.days.forEach((d, i) => {
        if (isRestDay(d)) {
          expect(dayMinutes(d)).toBe(0);
          return;
        }
        // A Pro program's free week is sized to the free plan's three guided
        // minutes instead; the next test holds it to that.
        if (p.pro && !dayNeedsPro(p, i)) return;
        const m = dayMinutes(d);
        expect(m, `${p.id} day ${i + 1} "${d.title}"`).toBeGreaterThanOrEqual(10);
        expect(m, `${p.id} day ${i + 1} "${d.title}"`).toBeLessThanOrEqual(20);
      });
      const { min, max } = programMinutesRange(p);
      expect(min).toBeLessThanOrEqual(max);
    }
  });

  it("has a rest day in every week of the longer programs and none on day 1", () => {
    for (const p of PROGRAMS) {
      expect(isRestDay(p.days[0])).toBe(false);
      if (p.weeks < 2) continue;
      for (let w = 0; w < p.weeks; w++) {
        expect(p.days.slice(w * 7, w * 7 + 7).some(isRestDay), `${p.id} week ${w + 1}`).toBe(true);
      }
    }
  });

  it("opens week 1 of a Pro program to everyone: free content only, inside the free cap", () => {
    for (const p of PROGRAMS.filter((p) => p.pro)) {
      for (let i = 0; i < FREE_WEEKS * 7; i++) {
        const d = p.days[i];
        expect(dayNeedsPro(p, i), `${p.id} day ${i + 1}`).toBe(false);
        for (const item of d.items) expect(itemIsPro(item), `${p.id} day ${i + 1}: ${JSON.stringify(item)}`).toBe(false);
        expect(cappedDaySeconds(d), `${p.id} day ${i + 1}`).toBeLessThanOrEqual(FREE_DAILY_SEC);
        if (!isRestDay(d)) expect(cappedDaySeconds(d), `${p.id} day ${i + 1}`).toBeGreaterThanOrEqual(90);
      }
      expect(dayNeedsPro(p, FREE_WEEKS * 7)).toBe(true);
      expect(p.days.slice(FREE_WEEKS * 7).flatMap((d) => d.items).some(itemIsPro), p.id).toBe(true);
    }
    for (const p of PROGRAMS.filter((p) => !p.pro)) {
      p.days.forEach((_, i) => expect(dayNeedsPro(p, i)).toBe(false));
    }
  });

  it("counts only warmups, breath, ear and songs against the free cap", () => {
    const d: ProgramDay = { title: "", items: [{ kind: "range" }, { kind: "recorder" }] };
    expect(cappedDaySeconds(d)).toBe(0);
    const w: ProgramDay = { title: "", items: [{ kind: "drill", id: "sustain" }, { kind: "range" }] };
    expect(cappedDaySeconds(w)).toBeGreaterThan(0);
    expect(cappedDaySeconds(w)).toBeLessThan(dayMinutes(w) * 60);
  });

  it("follows the book: its chapters, three range tests where the book puts them, two recorded takes", () => {
    const p = programById("measured-voice-12w")!;
    expect(p.weeks).toBe(12);
    expect(p.pro).toBe(true);
    const chapters = p.chapters!;
    expect(chapters.map((c) => c.slug)).toEqual([
      "weeks-1-2-baseline",
      "weeks-3-4-middle",
      "weeks-5-6-passaggio",
      "weeks-7-8-top",
      "weeks-9-10-bottom",
      "weeks-11-12-songs",
    ]);
    for (const c of chapters) {
      const book = BOOK_CONTENTS.find((b) => b.slug === c.slug);
      expect(book?.title, c.slug).toBe(c.title);
    }
    // Every week has exactly one chapter.
    for (let w = 1; w <= p.weeks; w++) {
      expect(chapters.filter((c) => w >= c.fromWeek && w <= c.toWeek), `week ${w}`).toHaveLength(1);
    }
    const on = (kind: ProgramItem["kind"]) =>
      p.days.flatMap((d, i) => (d.items.some((x) => x.kind === kind) ? [i + 1] : []));
    // Week 1, the end of week 6, the start of week 12.
    expect(on("range")).toEqual([1, 42, 78]);
    expect(on("recorder")).toEqual([1, 78]);
    // Three or four sessions a week, and five only where a check-in is added.
    for (let w = 0; w < p.weeks; w++) {
      const sessions = p.days.slice(w * 7, w * 7 + 7).filter((d) => !isRestDay(d)).length;
      expect(sessions, `week ${w + 1}`).toBeGreaterThanOrEqual(3);
      expect(sessions, `week ${w + 1}`).toBeLessThanOrEqual(5);
    }
    expect(isRestDay(p.days.at(-1)!)).toBe(false);
  });

  it("gates Pro content: a free program starts nothing behind the paywall", () => {
    for (const p of PROGRAMS) {
      const pro = allItems(p).some(itemIsPro);
      if (!p.pro) expect(pro, p.id).toBe(false);
    }
    const mix = programById("mix-4w")!;
    expect(mix.pro).toBe(true);
    expect(allItems(mix).some((i) => i.kind === "routine" && i.id === "mix")).toBe(true);
    // Free exercises named directly must be in the free catalogue.
    for (const p of PROGRAMS.filter((p) => !p.pro)) {
      for (const i of allItems(p)) if (i.kind === "exercise") expect(isFreeExercise(i.id)).toBe(true);
    }
  });

  it("only names songs a new singer can open: free and in the first band", () => {
    for (const p of PROGRAMS) {
      for (const i of allItems(p)) {
        if (i.kind !== "song") continue;
        const s = SONGS.find((x) => x.slug === i.slug)!;
        expect(bandForSong(s), s.slug).toBe(BAND_ORDER[0]);
      }
    }
  });

  it("puts a range test at day 1 and at the end of each two weeks of the high-notes program", () => {
    const p = programById("high-notes-6w")!;
    const withRange = p.days.flatMap((d, i) => (d.items.some((x) => x.kind === "range") ? [i + 1] : []));
    expect(withRange).toEqual([1, 14, 28, 42]);
  });

  it("promises practice, not outcomes the app cannot measure", () => {
    const forbidden =
      /\badd(?:s|ing)?\s+(?:\w+\s+)?(?:notes?|semitones?|range)\b|\bfix(?:es|ed)?\b|\bheal|\bcure|\bguarantee|\bno strain|strain[- ]free|\bsafe\b|\bunlock your\b|\bextend your range\b/i;
    for (const p of PROGRAMS) {
      const copy = [p.name, p.tagline, p.measures, ...p.days.map((d) => d.title)].join(" \n ");
      expect(copy, p.id).not.toMatch(forbidden);
    }
  });

  it("deep-links every item with a relative URL into its room", () => {
    const hrefs = PROGRAMS.flatMap((p) => allItems(p).map(itemHref));
    for (const h of hrefs) expect(h).toMatch(/^\/(warmups|breath|range|songs|recorder)(\?|$)/);
    expect(itemHref({ kind: "routine", id: "quick" })).toBe("/warmups?routine=quick");
    expect(itemHref({ kind: "exercise", id: "vibrato-hold", reps: 4 })).toBe("/warmups?exercise=vibrato-hold");
    expect(itemHref({ kind: "breath", id: "daily" })).toBe("/breath?routine=daily");
    expect(itemHref({ kind: "drill", id: "sustain" })).toBe("/breath?drill=sustain");
    expect(itemHref({ kind: "range" })).toBe("/range");
    expect(itemHref({ kind: "recorder" })).toBe("/recorder");
    expect(itemHref({ kind: "song", slug: "ode-to-joy" })).toBe("/songs?song=ode-to-joy");
  });
});

describe("item completion from the log", () => {
  const today = "2026-09-24";

  it("counts a warmup routine only when every one of its exercises was sung that day", () => {
    const item: ProgramItem = { kind: "routine", id: "quick" };
    const titles = routineById("quick")!.steps.map((s) => stepExercise(s).title);
    const all = titles.map((t) => session(today, "warmup", t));
    expect(itemDoneOn(item, all, today)).toBe(true);
    expect(itemDoneOn(item, all.slice(1), today)).toBe(false);
    // Yesterday's work does not count for today.
    expect(itemDoneOn(item, titles.map((t) => session("2026-09-23", "warmup", t)), today)).toBe(false);
    // Same titles under another activity type do not count.
    expect(itemDoneOn(item, titles.map((t) => session(today, "song", t)), today)).toBe(false);
  });

  it("counts a breath set by its drills, a drill by its title, and the range test by type", () => {
    const set: ProgramItem = { kind: "breath", id: "quick" };
    const drills = ["Box breathing", "Farinelli drill", "Sustain test"].map((d) => session(today, "breath", d));
    expect(itemDoneOn(set, drills, today)).toBe(true);
    expect(itemDoneOn(set, drills.slice(0, 2), today)).toBe(false);
    expect(itemDoneOn({ kind: "drill", id: "sustain" }, [drills[2]], today)).toBe(true);
    expect(itemDoneOn({ kind: "drill", id: "sustain" }, [drills[0]], today)).toBe(false);
    expect(itemDoneOn({ kind: "range" }, [session(today, "range", "Range test")], today)).toBe(true);
    expect(itemDoneOn({ kind: "range" }, [], today)).toBe(false);
  });

  it("counts a song by its title", () => {
    const s = SONGS.find((x) => x.slug === "ode-to-joy")!;
    expect(itemDoneOn({ kind: "song", slug: s.slug }, [session(today, "song", s.title)], today)).toBe(true);
    expect(itemDoneOn({ kind: "song", slug: s.slug }, [session(today, "song", "Other")], today)).toBe(false);
  });
});

/** Start a program at midnight UTC of `day`, so that day's fixtures count. */
const begin = (id: string, day: string) => startProgram(id, day, new Date(`${day}T00:00:00Z`));

describe("advancing through a program", () => {
  const program = programById("foundations-2w")!;
  const d0 = "2026-09-21";

  it("starts on day 1 with nothing done", () => {
    const p = begin(program.id, d0);
    const r = reconcileProgress(program, p, [], d0);
    expect(r).toBe(p);
    expect(programToday(program, r, d0)).toEqual({ status: "todo", index: 0, completed: 0 });
  });

  it("completes a day from the log, then holds the next until tomorrow", () => {
    const p = begin(program.id, d0);
    const sessions = sessionsFor(program.days[0], d0);
    const r = reconcileProgress(program, p, sessions, d0);
    expect(r.done).toEqual([{ index: 0, day: d0 }]);
    expect(programToday(program, r, d0)).toEqual({ status: "done-today", index: 0, completed: 1 });
    // Idempotent: nothing new, same object back.
    expect(reconcileProgress(program, r, sessions, d0)).toBe(r);
  });

  it("never completes two days on one calendar day, however much was sung", () => {
    const p = begin(program.id, d0);
    const sessions = [...sessionsFor(program.days[0], d0), ...sessionsFor(program.days[1], d0), ...sessionsFor(program.days[2], d0)];
    const r = reconcileProgress(program, p, sessions, d0);
    expect(r.done.map((d) => d.index)).toEqual([0]);
    // And a manual mark on the same day is refused too.
    expect(markDayDone(program, r, d0)).toBe(r);
  });

  it("rolls over at midnight: the next day opens on the next local day", () => {
    const p = begin(program.id, d0);
    const r = reconcileProgress(program, p, sessionsFor(program.days[0], d0), d0);
    const tomorrow = addDays(d0, 1);
    expect(programToday(program, r, tomorrow)).toEqual({ status: "todo", index: 1, completed: 1 });
    const r2 = reconcileProgress(program, r, [...sessionsFor(program.days[0], d0), ...sessionsFor(program.days[1], tomorrow)], tomorrow);
    expect(r2.done).toEqual([{ index: 0, day: d0 }, { index: 1, day: tomorrow }]);
  });

  it("catches up on work logged on days the page was not open, one day per calendar day", () => {
    const p = begin(program.id, d0);
    const sessions = [
      ...sessionsFor(program.days[0], d0),
      ...sessionsFor(program.days[1], addDays(d0, 1)),
      // Day 3's work sung on the same calendar day as day 2's does not count twice.
      ...sessionsFor(program.days[2], addDays(d0, 1)),
      ...sessionsFor(program.days[2], addDays(d0, 3)),
    ];
    const r = reconcileProgress(program, p, sessions, addDays(d0, 4));
    expect(r.done).toEqual([
      { index: 0, day: d0 },
      { index: 1, day: addDays(d0, 1) },
      { index: 2, day: addDays(d0, 3) },
    ]);
    expect(programToday(program, r, addDays(d0, 4)).status).toBe("todo");
  });

  it("does not count work logged before the program started", () => {
    const p = begin(program.id, d0);
    const r = reconcileProgress(program, p, sessionsFor(program.days[0], addDays(d0, -1)), d0);
    expect(r.done).toEqual([]);
  });

  it("does not complete a day from a log dated after today", () => {
    const p = begin(program.id, d0);
    const r = reconcileProgress(program, p, sessionsFor(program.days[0], addDays(d0, 1)), d0);
    expect(r.done).toEqual([]);
  });

  it("takes a rest day on the first calendar day it is reached", () => {
    const restIndex = program.days.findIndex(isRestDay);
    expect(restIndex).toBe(6);
    const done = Array.from({ length: restIndex }, (_, i) => ({ index: i, day: addDays(d0, i) }));
    const p = { programId: program.id, startedDay: d0, done };
    const yesterdayDone = addDays(d0, restIndex - 1);
    // Still the day the last one was done: the rest day waits.
    expect(reconcileProgress(program, p, [], yesterdayDone)).toBe(p);
    const next = addDays(d0, restIndex);
    const r = reconcileProgress(program, p, [], next);
    expect(r.done.at(-1)).toEqual({ index: restIndex, day: next });
    expect(programToday(program, r, next)).toEqual({ status: "done-today", index: restIndex, completed: restIndex + 1 });
  });

  it("lets the singer mark a day done by hand, once per calendar day", () => {
    const p = begin(program.id, d0);
    const r = markDayDone(program, p, d0);
    expect(r.done).toEqual([{ index: 0, day: d0, manual: true }]);
    expect(markDayDone(program, r, d0)).toBe(r);
    const r2 = markDayDone(program, r, addDays(d0, 1));
    expect(r2.done.map((d) => d.index)).toEqual([0, 1]);
  });

  it("finishes after the last day, and a restart begins again from day 1", () => {
    const short = programById("recovery-week")!;
    const done = short.days.map((_, i) => ({ index: i, day: addDays(d0, i) }));
    const p = { programId: short.id, startedDay: d0, done };
    const last = addDays(d0, short.days.length);
    expect(programToday(short, p, last)).toEqual({ status: "finished", index: short.days.length - 1, completed: short.days.length });
    expect(markDayDone(short, p, last)).toBe(p);
    expect(reconcileProgress(short, p, [], last)).toBe(p);
    const again = begin(short.id, last);
    expect(programToday(short, again, last)).toEqual({ status: "todo", index: 0, completed: 0 });
  });
});

describe("one session pays for one item", () => {
  const today = "2026-09-24";

  it("does not let a single sustain test tick both the lone drill and the breath set", () => {
    const day1 = programById("foundations-2w")!.days[0];
    const sustainAt = day1.items.findIndex((i) => i.kind === "drill" && i.id === "sustain");
    const setAt = day1.items.findIndex((i) => i.kind === "breath");
    expect(sustainAt).toBeGreaterThanOrEqual(0);
    expect(setAt).toBeGreaterThanOrEqual(0);
    const one = ["Box breathing", "Farinelli drill", "Sustain test"].map((d) => session(today, "breath", d));
    const done = itemsDoneOn(day1, one, today);
    // One sustain session: the drill takes it, and the set is left a sustain short.
    expect(done[sustainAt]).toBe(true);
    expect(done[setAt]).toBe(false);
    // A second sustain completes both.
    const both = itemsDoneOn(day1, [...one, session(today, "breath", "Sustain test")], today);
    expect(both[sustainAt] && both[setAt]).toBe(true);
  });

  it("does not let the vibrato routine's hold also count as the lone vibrato hold", () => {
    const d: ProgramDay = {
      title: "",
      items: [
        { kind: "routine", id: "vibrato" },
        { kind: "exercise", id: "vibrato-hold", reps: 4 },
      ],
    };
    const titles = routineById("vibrato")!.steps.map((s) => stepExercise(s).title);
    const routineOnly = titles.map((t) => session(today, "warmup", t));
    expect(itemsDoneOn(d, routineOnly, today)).toEqual([true, false]);
    const hold = stepExercise({ exerciseId: "vibrato-hold", reps: 1 }).title;
    expect(itemsDoneOn(d, [...routineOnly, session(today, "warmup", hold)], today)).toEqual([true, true]);
  });

  it("lets a later item take a session an earlier one can do without, in any log order", () => {
    const d: ProgramDay = { title: "", items: [{ kind: "drill", id: "sustain" }, { kind: "breath", id: "quick" }] };
    const log = ["Sustain test", "Box breathing", "Farinelli drill", "Sustain test"].map((x) => session(today, "breath", x));
    expect(itemsDoneOn(d, log, today)).toEqual([true, true]);
    expect(itemsDoneOn(d, [...log].reverse(), today)).toEqual([true, true]);
  });

  it("never completes a day from a session that has to tick two items", () => {
    const program = programById("foundations-2w")!;
    const d0 = "2026-09-21";
    const p = begin(program.id, d0);
    const quick = routineById("quick")!.steps.map((s) => session(d0, "warmup", stepExercise(s).title));
    const log = [
      session(d0, "range", "Range test"),
      ...["Box breathing", "Farinelli drill", "Sustain test"].map((x) => session(d0, "breath", x)),
      ...quick,
    ];
    expect(reconcileProgress(program, p, log, d0).done).toEqual([]);
    const r = reconcileProgress(program, p, [...log, session(d0, "breath", "Sustain test")], d0);
    expect(r.done).toEqual([{ index: 0, day: d0 }]);
  });
});

describe("a restart on the same day", () => {
  const program = programById("recovery-week")!;
  const today = "2026-09-24";

  it("ignores sessions from before the restart", () => {
    const first = begin(program.id, today);
    const log = sessionsForDay(program.days[0], today, "09:00:00");
    expect(reconcileProgress(program, first, log, today).done.map((d) => d.index)).toEqual([0]);
    // Restarted at 10:00: the 09:00 work belongs to the earlier run.
    const again = startProgram(program.id, today, new Date(`${today}T10:00:00Z`));
    expect(reconcileProgress(program, again, log, today)).toBe(again);
    expect(programToday(program, again, today)).toEqual({ status: "todo", index: 0, completed: 0 });
    // Work after the restart counts.
    const later = sessionsForDay(program.days[0], today, "11:00:00");
    expect(reconcileProgress(program, again, [...log, ...later], today).done).toEqual([{ index: 0, day: today }]);
    expect(sessionsForRun(again, [...log, ...later])).toHaveLength(later.length);
  });

  it("falls back to the start day for records without a start time", () => {
    const legacy = { programId: program.id, startedDay: today, done: [] };
    const log = sessionsForDay(program.days[0], today, "09:00:00");
    expect(reconcileProgress(program, legacy, log, today).done).toEqual([{ index: 0, day: today }]);
    expect(reconcileProgress(program, legacy, sessionsForDay(program.days[0], "2026-09-23"), today).done).toEqual([]);
  });
});

describe("the stored record", () => {
  it("revives a good record and drops junk", () => {
    const good = { programId: "vibrato-3w", startedDay: "2026-09-01", done: [{ index: 0, day: "2026-09-01" }] };
    expect(reviveProgress(good)).toEqual(good);
    expect(reviveProgress(null)).toBeNull();
    expect(reviveProgress("x")).toBeNull();
    expect(reviveProgress({ programId: "gone", startedDay: "2026-09-01", done: [] })).toBeNull();
    expect(reviveProgress({ programId: "vibrato-3w", startedDay: "yesterday", done: [] })).toBeNull();
  });

  it("keeps the longest valid prefix of completed days", () => {
    const r = reviveProgress({
      programId: "vibrato-3w",
      startedDay: "2026-09-01",
      done: [
        { index: 0, day: "2026-09-01", manual: true },
        { index: 1, day: "2026-09-02" },
        // Same calendar day as the one before: two days in one is not allowed.
        { index: 2, day: "2026-09-02" },
        { index: 3, day: "2026-09-04" },
      ],
    });
    expect(r?.done).toEqual([
      { index: 0, day: "2026-09-01", manual: true },
      { index: 1, day: "2026-09-02" },
    ]);
    expect(reviveProgress({ programId: "vibrato-3w", startedDay: "2026-09-01", done: "x" })?.done).toEqual([]);
  });

  it("drops impossible dates instead of crashing on them", () => {
    expect(reviveProgress({ programId: "vibrato-3w", startedDay: "2026-99-99", done: [] })).toBeNull();
    expect(reviveProgress({ programId: "vibrato-3w", startedDay: "2026-02-30", done: [] })).toBeNull();
    const r = reviveProgress({
      programId: "vibrato-3w",
      startedDay: "2026-09-01",
      startedAt: "not a time",
      done: [
        { index: 0, day: "2026-09-01" },
        { index: 1, day: "2026-99-99" },
        { index: 2, day: "2026-09-03" },
      ],
    });
    expect(r).toEqual({ programId: "vibrato-3w", startedDay: "2026-09-01", done: [{ index: 0, day: "2026-09-01" }] });
    // The repaired record reconciles and reports without throwing.
    const program = programById("vibrato-3w")!;
    expect(() => programToday(program, reconcileProgress(program, r!, [], "2026-09-24"), "2026-09-24")).not.toThrow();
  });

  it("keeps a valid start time", () => {
    const at = "2026-09-01T08:30:00.000Z";
    expect(reviveProgress({ programId: "vibrato-3w", startedDay: "2026-09-01", startedAt: at, done: [] })?.startedAt).toBe(at);
  });

  it("adds calendar days across month ends and DST changes", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
    expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
});
