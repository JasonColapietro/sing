import {
  dayNeedsPro,
  isRestDay,
  nextRangeTestDay,
  type Program,
  type ProgramProgress,
  type ProgramToday,
} from "@/lib/programs";
import type { ProgramRangeTest } from "./program-range-note";

// The range-note builders live in a module with no lib/programs import, so the
// /range pitch meter can use them without shipping every program; the coach
// and the tests still reach them here.
export {
  programRangeNote,
  recoveryRangeLine,
  recoveryRangeNote,
  staleRangeProgramNote,
  type ProgramRangeTest,
} from "./program-range-note";

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

/**
 * The running program's name while it is Recovery week and not yet finished,
 * else null. The week is for a voice that feels tired, and the book says not
 * to measure one: "rest, and retest after a night's sleep" (chapter 8), "start
 * measuring again when you are back to ordinary" (chapter 12). So while it
 * runs the coach leaves out its own range test, which would save a tired
 * reading over the range every warmup and song fits to, and its octave siren
 * at the top of the range, which none of the week's own warmup sets sings;
 * the /range pitch meter offers no range test either, and both say why in
 * the same words (./program-range-note.ts recoveryRangeNote). The week
 * schedules no range test of its own, so programRangeTest is null throughout
 * it, and its breath is single drills, with no sustain test (lib/programs.ts
 * RECOVERY_BREATH), so the coach's breathing step opens the week's box
 * breathing rather than the breath room, whose sets end on one.
 */
export function recoveryWeekOf(active: { program: Program; view: { status: string } }): string | null {
  return active.program.id === "recovery-week" && active.view.status !== "finished" ? active.program.name : null;
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
