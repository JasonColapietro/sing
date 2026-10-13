"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { localDay, useProgress } from "@/lib/progress";
import { subscribePracticeDay } from "@/lib/free-cap";
import { loadBreath, type SustainAttempt } from "@/components/breath/store";
import {
  countsFromDay,
  earliestNext,
  matchDay,
  programReadings,
  programById,
  programToday,
  reconcileProgress,
  sessionsForRun,
  sustainAttemptSessions,
  withReadings,
  type Program,
  type ProgramProgress,
  type ProgramReading,
  type ProgramToday,
} from "@/lib/programs";
import { saveProgramProgress, useProgramProgress } from "./store";

const noDayOnServer = () => null;

/**
 * The singer's local day, kept current across midnight.
 *
 * The server has no idea what day it is where the singer sits, so this is null
 * while the page is server-rendered and hydrated. It is read in the first
 * render after hydration, the same render in which the progress and program
 * stores switch to what this browser holds, so a program card mounts in the
 * same commit that takes the pre-paint slot away (components/prepaint.tsx)
 * rather than one effect later. A page left open overnight re-reads it at
 * midnight, once a minute and when the tab comes back (subscribePracticeDay).
 */
export function useLocalDay(): string | null {
  return useSyncExternalStore(subscribePracticeDay, localDay, noDayOnServer);
}

export interface ActiveProgram {
  program: Program;
  progress: ProgramProgress;
  today: string;
  view: ProgramToday;
  /** Per item of the day the card shows, in order: done on the log since the day opened. */
  itemsDone: boolean[];
  /** Per item, its steps done (routines and breath sets; empty for the rest). */
  stepsDone: boolean[][];
  /**
   * Per item, which of those ticks are steps the routine runner skips for the
   * saved range (Evidence.waived) rather than steps sung.
   */
  stepsWaived: boolean[][];
  /** The first calendar day whose practice counts toward today's program day. */
  countsFrom: string;
  /** Range and sustain readings of the completed check-in days. */
  readings: ProgramReading[];
}

/**
 * The active program as of today, with the record brought up to date from the
 * practice log. Null before mount, with no program, or with storage blocked.
 */
export function useActiveProgram(): ActiveProgram | null {
  const stored = useProgramProgress();
  const { sessions: logged, rangeHistory, range } = useProgress();
  const today = useLocalDay();
  // The sustain room's own attempt record: holds under five seconds are kept
  // there but never logged, and a program still counts them. localStorage, so
  // read after mount, and again whenever the log moves.
  const [attempts, setAttempts] = useState<SustainAttempt[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAttempts(loadBreath().attempts);
  }, [logged]);
  const sessions = useMemo(() => [...logged, ...sustainAttemptSessions(attempts)], [logged, attempts]);
  const program = programById(stored?.programId);
  const reconciled =
    stored && program && today ? reconcileProgress(program, stored, sessions, today, range) : stored;
  const readings = program && reconciled ? programReadings(program, reconciled, sessions, rangeHistory, attempts) : [];
  // Keep each check-in reading on its day: a short sustain hold is only in the
  // sustain room's ten-attempt record, and must still show on the last day.
  const progress = reconciled ? withReadings(reconciled, readings) : reconciled;

  // Persist what the log completed, so the calendar keeps the day it happened
  // on even after the sessions age out of the capped log.
  useEffect(() => {
    if (progress && stored && progress !== stored) saveProgramProgress(progress);
  }, [progress, stored]);

  if (!program || !progress || !today) return null;
  const view = programToday(program, progress, today);
  const counted = sessionsForRun(progress, sessions);
  // What the card names as counting. After a go-back (repeatFrom) the run's
  // clock restarts today, so practice from the days in between does not
  // count, however far back the last completed day is.
  const countsFrom = countsFromDay(progress);
  const day = program.days[view.index];
  // One matching for the rows and their steps, so a session ticks one thing.
  // With the saved range, so a step the routine runner skips for it (and never
  // logs) does not hold the day open.
  const match = view.status === "todo" ? matchDay(day, counted, today, earliestNext(progress), range) : null;
  const itemsDone = match?.items ?? [];
  const stepsDone = match?.steps ?? [];
  const stepsWaived = match?.waived ?? [];
  return { program, progress, today, view, itemsDone, stepsDone, stepsWaived, countsFrom, readings };
}
