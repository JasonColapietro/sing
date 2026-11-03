"use client";

import { useActiveProgram } from "./use-program";

/**
 * Reads the running program on every page so its scheduled rest days bridge
 * the streak before anything names it (useActiveProgram calls
 * lib/progress.ts applyRestDayBridge). It draws nothing. The header loads it
 * as its own chunk, and only when this browser holds a program, because
 * lib/programs carries every program and the song catalog.
 */
export default function ProgramStreakBridge() {
  useActiveProgram();
  return null;
}
