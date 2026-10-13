import {
  dayNeedsPro,
  isRestDay,
  nextRangeTestDay,
  type Program,
  type ProgramProgress,
  type ProgramToday,
} from "@/lib/programs";

/**
 * True when today's program day is one this singer cannot open: a free singer
 * past the free week of a Pro program, on a practice day still to do. Their
 * place is kept, so this holds every day until they upgrade or stop the
 * program, which is why the rooms must not lead with that day as "today's
 * plan": its only way forward is the paywall.
 */
export function programDayNeedsPro(
  active: { program: Program; view: { index: number; status: string } },
  isPro: boolean,
): boolean {
  if (isPro || active.view.status !== "todo") return false;
  const day = active.program.days[active.view.index];
  return day !== undefined && !isRestDay(day) && dayNeedsPro(active.program, active.view.index);
}

/** The running program's next scheduled range test, as the coach names it. */
export interface ProgramRangeTest {
  /** The program's name. */
  name: string;
  /** Its 1-based program day. */
  day: number;
  /** That day is today's, still to do. */
  today: boolean;
}

/**
 * The range test the running program schedules next, which the coach leaves
 * to it rather than asking for one of its own (chapter 13: "do not retest
 * more than the plan asks"). Null when the run has none left, and for a free
 * singer when that day needs Pro: a test they cannot reach without paying is
 * not one to wait for, so the coach's own retest stays.
 */
export function programRangeTest(
  active: { program: Program; progress: ProgramProgress; view: ProgramToday },
  isPro: boolean,
): ProgramRangeTest | null {
  const day = nextRangeTestDay(active.program, active.progress, active.view);
  if (day === null || (!isPro && dayNeedsPro(active.program, day - 1))) return null;
  return {
    name: active.program.name,
    day,
    today: active.view.status === "todo" && active.view.index === day - 1,
  };
}
