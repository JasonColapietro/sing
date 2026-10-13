import { describe, expect, it } from "vitest";
import { FREE_WEEKS, isRestDay, programById, startProgram, type ProgramToday } from "@/lib/programs";
import { programDayNeedsPro, programRangeTest } from "./program-day";

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
