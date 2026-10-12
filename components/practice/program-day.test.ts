import { describe, expect, it } from "vitest";
import { FREE_WEEKS, isRestDay, programById } from "@/lib/programs";
import { programDayNeedsPro } from "./program-day";

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
