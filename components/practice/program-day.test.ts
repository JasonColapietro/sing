import { describe, expect, it } from "vitest";
import { FREE_WEEKS, isRestDay, programById, programToday, startProgram, type ProgramToday } from "@/lib/programs";
import {
  programDayNeedsPro,
  programRangeNote,
  programRangeTest,
  recoveryRangeLine,
  recoveryRangeNote,
  recoveryWeekOf,
  staleRangeProgramNote,
} from "./program-day";

describe("programDayNeedsPro", () => {
  const mix = programById("mix-4w")!;
  const at = (index: number, status = "todo") => ({ program: mix, view: { index, status } });
  const firstPaid = FREE_WEEKS * 7;
  const paidPractice = mix.days.findIndex((d, i) => i >= firstPaid && !isRestDay(d));
  const paidRest = mix.days.findIndex((d, i) => i >= firstPaid && isRestDay(d));

  it("is true for a free singer on a Pro day still to do", () => {
    expect(paidPractice).toBeGreaterThanOrEqual(firstPaid);
    expect(programDayNeedsPro(at(paidPractice), false)).toBe(true);
  });

  it("is false on Pro, in the free week, on a rest day, and once the day is done", () => {
    expect(programDayNeedsPro(at(paidPractice), true)).toBe(false);
    expect(programDayNeedsPro(at(0), false)).toBe(false);
    if (paidRest >= 0) expect(programDayNeedsPro(at(paidRest), false)).toBe(false);
    expect(programDayNeedsPro(at(paidPractice, "done-today"), false)).toBe(false);
    expect(programDayNeedsPro(at(paidPractice, "finished"), false)).toBe(false);
  });

  it("is false for every day of a free program", () => {
    const program = programById("foundations-2w")!;
    expect(program.pro).toBe(false);
    for (let i = 0; i < program.days.length; i++) {
      expect(programDayNeedsPro({ program, view: { index: i, status: "todo" } }, false)).toBe(false);
    }
  });
});

describe("programRangeTest", () => {
  const mv = programById("measured-voice-12w")!;
  const done = (n: number) => Array.from({ length: n }, (_, index) => ({ index, day: `2026-06-${String(index + 1).padStart(2, "0")}` }));
  const at = (completed: number, view: ProgramToday) => ({
    program: mv,
    progress: { ...startProgram(mv.id, "2026-06-01"), done: done(Math.min(completed, 30)) },
    view,
  });

  it("names the program's next scheduled test for a Pro singer", () => {
    expect(programRangeTest(at(36, { status: "todo", index: 36, completed: 36 }), true)).toEqual({
      name: mv.name,
      day: 42,
      today: false,
    });
    // Today's own day.
    expect(programRangeTest(at(41, { status: "todo", index: 41, completed: 41 }), true)).toMatchObject({ day: 42, today: true });
    // Done today: the next one, not today's.
    expect(programRangeTest(at(42, { status: "done-today", index: 41, completed: 42 }), true)).toMatchObject({ day: 78, today: false });
  });

  it("leaves the coach's retest to a free singer whose next test needs Pro", () => {
    // Day 37 is past the free week, and so is day 42.
    expect(programRangeTest(at(36, { status: "todo", index: 36, completed: 36 }), false)).toBeNull();
    // Still in the free week, but the next test is day 42.
    expect(programRangeTest(at(3, { status: "todo", index: 3, completed: 3 }), false)).toBeNull();
    // A free program's test is the program's to give.
    const f = programById("foundations-2w")!;
    const run = { program: f, progress: { ...startProgram(f.id, "2026-06-01"), done: done(5) }, view: { status: "todo", index: 5, completed: 5 } as ProgramToday };
    expect(programRangeTest(run, false)).toEqual({ name: f.name, day: 14, today: false });
  });

  it("is null on a finished run", () => {
    expect(programRangeTest(at(84, { status: "finished", index: 83, completed: 84 }), true)).toBeNull();
  });
});

describe("recoveryWeekOf", () => {
  const rw = programById("recovery-week")!;
  const at = (program = rw, status = "todo", index = 2) => ({ program, view: { index, status } });

  it("names Recovery week on every day it runs, its rest day included", () => {
    expect(rw.days.some((d) => d.items.some((it) => it.kind === "range"))).toBe(false);
    for (let i = 0; i < rw.days.length; i++) {
      expect(recoveryWeekOf(at(rw, "todo", i))).toBe(rw.name);
      expect(recoveryWeekOf(at(rw, "done-today", i))).toBe(rw.name);
    }
  });

  it("is null once the week is finished, and for every other program", () => {
    expect(recoveryWeekOf(at(rw, "finished", rw.days.length - 1))).toBeNull();
    for (const id of ["foundations-2w", "measured-voice-12w"]) {
      expect(recoveryWeekOf(at(programById(id)!))).toBeNull();
    }
  });

  it("holds through day 6 done today and lets go as day 7 is done", () => {
    // Through the real day view: a run whose last day was done today reads
    // "finished", not "done-today", so the coach's own retest comes back with
    // the finished card rather than a day later.
    const dayOf = (index: number) => `2026-06-${String(index + 1).padStart(2, "0")}`;
    // n days done, one a day from 1 June, the last of them today.
    const run = (n: number) => {
      const done = Array.from({ length: n }, (_, index) => ({ index, day: dayOf(index) }));
      const progress = { ...startProgram(rw.id, dayOf(0)), done };
      return { program: rw, progress, view: programToday(rw, progress, dayOf(n - 1)) };
    };
    const six = run(rw.days.length - 1);
    expect(six.view.status).toBe("done-today");
    expect(recoveryWeekOf(six)).toBe(rw.name);
    const seven = run(rw.days.length);
    expect(seven.view.status).toBe("finished");
    expect(recoveryWeekOf(seven)).toBeNull();
  });
});

describe("programRangeNote", () => {
  const name = "Foundations in 2 weeks";

  it("says when the program's own test falls, and that an earlier one does not count", () => {
    expect(programRangeNote(50, { name, day: 14, today: false })).toBe(
      "Your range was last measured 50 days ago. Your next range test is on day 14 of Foundations in 2 weeks. Wait for that day: a test taken earlier does not count toward it.",
    );
  });

  it("sends a singer whose program day is today to take it there, after its warm-up", () => {
    expect(programRangeNote(50, { name, day: 14, today: true })).toBe(
      "Your range was last measured 50 days ago. Today's program day is day 14 of Foundations in 2 weeks. It takes your next range test after its warm-up, so take the test there.",
    );
  });

  it("never says a retest is due", () => {
    for (const today of [false, true]) {
      expect(programRangeNote(60, { name, day: 14, today })).not.toMatch(/retest is due/);
    }
  });
});

describe("staleRangeProgramNote", () => {
  const DAY = 86_400_000;
  const NOW = Date.parse("2026-10-13T12:00:00Z");
  const scheduled = { name: "Foundations in 2 weeks", day: 14, today: false };
  const range = (ageDays: number | null) => ({
    lowMidi: 45,
    highMidi: 67,
    ...(ageDays === null ? {} : { testedAt: new Date(NOW - ageDays * DAY).toISOString() }),
  });

  it("gives the coach's note for a range six weeks old while the program schedules the next test", () => {
    expect(staleRangeProgramNote(range(50), scheduled, NOW)).toBe(programRangeNote(50, scheduled));
  });

  it("is null for a current or undated range, with no program test, and with no saved range", () => {
    expect(staleRangeProgramNote(range(10), scheduled, NOW)).toBeNull();
    expect(staleRangeProgramNote(range(null), scheduled, NOW)).toBeNull();
    expect(staleRangeProgramNote(range(50), null, NOW)).toBeNull();
    // A singer with no range still takes the range test first.
    expect(staleRangeProgramNote({}, scheduled, NOW)).toBeNull();
  });
});

describe("recoveryRangeNote", () => {
  const DAY = 86_400_000;
  const NOW = Date.parse("2026-10-13T12:00:00Z");
  const name = "Recovery week";
  const line = `${name} is for a voice that feels tired, so leave the range test until the week is over and your voice feels back to ordinary.`;
  const range = (ageDays: number | null) => ({
    lowMidi: 45,
    highMidi: 67,
    ...(ageDays === null ? {} : { testedAt: new Date(NOW - ageDays * DAY).toISOString() }),
  });

  it("says why to leave the test, for a stale range and for none", () => {
    expect(recoveryRangeLine(name)).toBe(line);
    expect(recoveryRangeNote(range(60), name, NOW)).toBe(`Your range was last measured 60 days ago. ${line}`);
    expect(recoveryRangeNote({}, name, NOW)).toBe(`You haven't measured your range yet. ${line}`);
    // Half a range is not a saved one.
    expect(recoveryRangeNote({ lowMidi: 45 }, name, NOW)).toBe(`You haven't measured your range yet. ${line}`);
  });

  it("is null for a current or undated range, which nothing asks to retest", () => {
    expect(recoveryRangeNote(range(10), name, NOW)).toBeNull();
    expect(recoveryRangeNote(range(null), name, NOW)).toBeNull();
  });

  it("never offers the test or calls a retest due", () => {
    for (const r of [range(60), {}]) expect(recoveryRangeNote(r, name, NOW)).not.toMatch(/retest is due|take the (2-minute )?range test/i);
  });
});
