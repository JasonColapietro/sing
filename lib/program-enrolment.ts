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
  /** ISO time of the start, so a restart ignores practice earlier that day. */
  startedAt?: string;
  /** Program days recorded as done, in order (see programProgress). */
  done?: { from: string; to: string }[];
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

let cache: ProgramEnrolment | null | undefined;
const listeners = new Set<() => void>();
let storageBound = false;

/** Only a known program with a well-formed day is an enrolment. */
export function parseEnrolment(raw: unknown): ProgramEnrolment | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { programId, startedDay, startedAt, done } = raw as Record<string, unknown>;
  if (typeof programId !== "string" || !programById(programId)) return null;
  if (typeof startedDay !== "string" || !DAY.test(startedDay)) return null;
  const out: ProgramEnrolment = { programId, startedDay };
  if (typeof startedAt === "string" && !Number.isNaN(Date.parse(startedAt))) out.startedAt = startedAt;
  if (Array.isArray(done)) {
    const spans = done.filter(
      (d): d is { from: string; to: string } =>
        typeof d === "object" && d !== null &&
        typeof (d as { from?: unknown }).from === "string" && DAY.test((d as { from: string }).from) &&
        typeof (d as { to?: unknown }).to === "string" && DAY.test((d as { to: string }).to),
    );
    // Only a clean, ordered record is trusted; anything else is recomputed.
    const ordered = spans.length === done.length &&
      spans.every((s, i) => s.from <= s.to && (i === 0 || spans[i - 1].to < s.from));
    if (ordered && spans.length) out.done = spans.map(({ from, to }) => ({ from, to }));
  }
  return out;
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

/** Start (or restart) a program from now. Replaces any other enrolment. */
export function startProgram(programId: string, now = new Date()): void {
  if (!programById(programId)) return;
  write({ programId, startedDay: localDay(now), startedAt: now.toISOString() });
}

/**
 * Record program days as done once they are, so evidence that is later
 * trimmed from a room's own record can't undo them. Only ever extends.
 */
export function recordProgramDays(programId: string, done: { from: string; to: string }[]): void {
  const cur = read();
  if (!cur || cur.programId !== programId) return;
  if (done.length <= (cur.done?.length ?? 0)) return;
  write({ ...cur, done });
}

export function leaveProgram(): void {
  write(null);
}
