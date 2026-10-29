"use client";

import { useEffect } from "react";
import { useActiveProgram } from "@/components/programs/use-program";
import { programViewHref } from "@/lib/program-ids";
import { programRangeTest, recoveryWeekOf } from "./program-day";
import type { ProgramRangeTest } from "./program-range-note";

/** The running program's next range test, with the address of its own view. */
export interface ProgramRangeLink extends ProgramRangeTest {
  /**
   * The program's view, where today's day and its range test are. A plain
   * document load (lib/program-ids.ts programViewHref), never next/link.
   */
  href: string;
}

/**
 * Reads the running program for a room that needs it only now and then, and
 * reports its next range test, and whether it is Recovery week (lib/programs
 * via useActiveProgram, the same read /progress makes). It draws nothing.
 *
 * Its own module so the room loads it as a separate chunk with next/dynamic,
 * and only for a singer whose saved range is stale, or who has no saved range
 * and a program in this browser: lib/programs carries every program and the
 * song catalog, and the /range pitch meter is where the homepage's "Start
 * singing" and the Sing tab land, for singers with no program at all.
 */
export default function ProgramRangeProbe({
  isPro,
  onProgramRange,
  onRecovering,
}: {
  isPro: boolean;
  /** Called with the program's next range test, or null when there is none. */
  onProgramRange: (next: ProgramRangeLink | null) => void;
  /**
   * Called with the program's name while it is Recovery week and not yet
   * finished (./program-day.ts recoveryWeekOf), else null: the week asks for
   * no range test, as the /progress coach says.
   */
  onRecovering?: (name: string | null) => void;
}) {
  const active = useActiveProgram();
  const next = active ? programRangeTest(active, isPro) : null;
  const recovering = active ? recoveryWeekOf(active) : null;
  const id = active?.program.id;
  const name = next?.name;
  const day = next?.day;
  const today = next?.today;
  useEffect(() => {
    onProgramRange(
      id !== undefined && name !== undefined && day !== undefined && today !== undefined
        ? { name, day, today, href: programViewHref(id) }
        : null,
    );
  }, [onProgramRange, id, name, day, today]);
  useEffect(() => {
    onRecovering?.(recovering);
  }, [onRecovering, recovering]);
  return null;
}
