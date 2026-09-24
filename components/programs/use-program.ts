"use client";

import { useEffect, useState } from "react";
import { localDay, useProgress } from "@/lib/progress";
import {
  itemsDoneOn,
  programById,
  programToday,
  reconcileProgress,
  sessionsForRun,
  type Program,
  type ProgramProgress,
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
  /** Per item of the day the card shows, in order: done on today's log. */
  itemsDone: boolean[];
}

/**
 * The active program as of today, with the record brought up to date from the
 * practice log. Null before mount, with no program, or with storage blocked.
 */
export function useActiveProgram(): ActiveProgram | null {
  const stored = useProgramProgress();
  const { sessions } = useProgress();
  const today = useLocalDay();
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
  const itemsDone =
    view.status === "todo"
      ? itemsDoneOn(program.days[view.index], sessionsForRun(progress, sessions), today)
      : [];
  return { program, progress, today, view, itemsDone };
}
