"use client";

// Which program this browser is following, and since when.
//
// Kept under its own key rather than in the progress record: the record's
// shape is a published contract (contracts/suede-progress.ts) and every field
// in it syncs to an account. An enrolment is a local preference with a start
// date, and everything a program shows beyond it is derived from the sessions
// the record already holds (lib/programs.ts programProgress).

import { useSyncExternalStore } from "react";
import { localDay } from "@/lib/progress";
import { programById } from "@/lib/programs";

export const PROGRAM_ENROLMENT_KEY = "suede-sing:program:v1";

export interface ProgramEnrolment {
  programId: string;
  /** Local calendar day the singer started, YYYY-MM-DD. */
  startedDay: string;
}

let cache: ProgramEnrolment | null | undefined;
const listeners = new Set<() => void>();
let storageBound = false;

/** Only a known program with a well-formed day is an enrolment. */
export function parseEnrolment(raw: unknown): ProgramEnrolment | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { programId, startedDay } = raw as Record<string, unknown>;
  if (typeof programId !== "string" || !programById(programId)) return null;
  if (typeof startedDay !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(startedDay)) return null;
  return { programId, startedDay };
}

function read(): ProgramEnrolment | null {
  if (cache !== undefined) return cache;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROGRAM_ENROLMENT_KEY);
    cache = parseEnrolment(raw ? JSON.parse(raw) : null);
  } catch {
    cache = null;
  }
  return cache;
}

function write(next: ProgramEnrolment | null) {
  cache = next;
  try {
    if (next) window.localStorage.setItem(PROGRAM_ENROLMENT_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(PROGRAM_ENROLMENT_KEY);
  } catch {
    // storage full or unavailable: keep it for this tab
  }
  for (const l of listeners) l();
}

function subscribe(cb: () => void): () => void {
  if (!storageBound && typeof window !== "undefined") {
    storageBound = true;
    window.addEventListener("storage", (e) => {
      if (e.key === PROGRAM_ENROLMENT_KEY) {
        cache = undefined;
        for (const l of listeners) l();
      }
    });
  }
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useProgramEnrolment(): ProgramEnrolment | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

/** Start (or restart) a program from today. Replaces any other enrolment. */
export function startProgram(programId: string, today = localDay()): void {
  if (!programById(programId)) return;
  write({ programId, startedDay: today });
}

export function leaveProgram(): void {
  write(null);
}
