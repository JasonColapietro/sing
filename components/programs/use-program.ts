"use client";

import { useEffect, useMemo, useState } from "react";
import { localDay, useProgress } from "@/lib/progress";
import { loadBreath, type SustainAttempt } from "@/components/breath/store";
import {
  earliestNext,
  itemDoneOn,
  itemSteps,
  itemsDoneOn,
  programReadings,
  programById,
  programToday,
  reconcileProgress,
  sessionsForRun,
  sustainAttemptSessions,
  type Program,
  type ProgramProgress,
  type ProgramReading,
  type ProgramToday,
} from "@/lib/programs";
import { saveProgramProgress, useProgramProgress } from "./store";

/**
 * The singer's local day, read after mount and kept current across midnight.
 *
 * The server has no idea what day it is where the singer sits, so this is null
 * until the client reads it — the same shape as the warmups room's hour and
 * today's-three day. A page left open overnight re-reads it when the tab comes
 * back and once a minute; the setter bails out when nothing changed.
 */
export function useLocalDay(): string | null {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const refresh = () => setToday(localDay());
    refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const id = window.setInterval(refresh, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(id);
    };
  }, []);
  return today;
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
  const { sessions: logged, rangeHistory } = useProgress();
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
  const progress =
    stored && program && today ? reconcileProgress(program, stored, sessions, today) : stored;

  // Persist what the log completed, so the calendar keeps the day it happened
  // on even after the sessions age out of the capped log.
  useEffect(() => {
    if (progress && stored && progress !== stored) saveProgramProgress(progress);
  }, [progress, stored]);

  if (!program || !progress || !today) return null;
  const view = programToday(program, progress, today);
  const counted = sessionsForRun(progress, sessions);
  const countsFrom = earliestNext(progress);
  const day = program.days[view.index];
  const todo = view.status === "todo";
  const itemsDone = todo ? itemsDoneOn(day, counted, today, countsFrom) : [];
  const stepsDone = todo
    ? day.items.map((item) => itemSteps(item).map((st) => itemDoneOn(st, counted, today, countsFrom)))
    : [];
  const readings = programReadings(program, progress, sessions, rangeHistory);
  return { program, progress, today, view, itemsDone, stepsDone, countsFrom, readings };
}
