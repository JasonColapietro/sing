"use client";

import { useSyncExternalStore } from "react";
import { createLocalStore } from "@/components/songs/favorites";
import { reviveProgress, startProgram, type ProgramProgress } from "@/lib/programs";

/**
 * The singer's place in a program: which one, when it started, and which days
 * are done.
 *
 * Its own key rather than a field on the progress record, because that record
 * is a published contract (`contracts/suede-progress.ts`) and a program is
 * this browser's plan, not practice history. Everything a program derives from
 * the log is re-derived on every visit, so losing this key costs the singer
 * their place in the calendar and nothing they sang. Every read and write is
 * guarded by `createLocalStore`, so a blocked store reads as "no program".
 */
const KEY = "suede-sing:program:v1";

const store = createLocalStore<ProgramProgress | null>(KEY, null, reviveProgress);

export function useProgramProgress(): ProgramProgress | null {
  return useSyncExternalStore(store.subscribe, store.get, store.serverSnapshot);
}

/** Start (or restart, or switch to) a program today. One is active at a time. */
export function beginProgram(programId: string, today: string): void {
  store.set(startProgram(programId, today));
}

export function saveProgramProgress(next: ProgramProgress): void {
  store.set(next);
}

export function leaveProgram(): void {
  store.set(null);
}
