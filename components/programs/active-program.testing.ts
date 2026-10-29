/**
 * An ActiveProgram built the way the app builds it (useActiveProgram): the
 * stored record brought up to date by reconcileProgress, then programToday.
 * Tests that hand-build a view can pass states the app never produces; a rest
 * day, for one, is completed the day it is reached, so it reads "done-today",
 * never "todo".
 */
import {
  addDays,
  markDayDone,
  programById,
  programToday,
  reconcileProgress,
  type ProgramProgress,
} from "@/lib/programs";
import type { ActiveProgram } from "./use-program";

/**
 * `id`'s run with its first `daysBefore` days done on the days before `today`,
 * one a day, and, with `doneToday`, the next day marked done today.
 */
export function reconciledProgram(
  id: string,
  daysBefore: number,
  { today = "2026-10-12", doneToday = false }: { today?: string; doneToday?: boolean } = {},
): ActiveProgram {
  const program = programById(id);
  if (!program) throw new Error(`No program ${id}`);
  const startedDay = addDays(today, -daysBefore);
  let progress: ProgramProgress = {
    programId: id,
    startedDay,
    startedAt: `${startedDay}T08:00:00.000Z`,
    done: Array.from({ length: daysBefore }, (_, index) => ({ index, day: addDays(startedDay, index), manual: true })),
  };
  if (doneToday) progress = markDayDone(program, progress, today);
  progress = reconcileProgress(program, progress, [], today);
  const view = programToday(program, progress, today);
  return {
    program,
    progress,
    today,
    view,
    itemsDone: [],
    stepsDone: [],
    stepsWaived: [],
    countsFrom: today,
    readings: [],
  };
}
