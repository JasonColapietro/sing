import { describe, expect, it } from "vitest";
import { ALL_EXERCISES, EXERCISES } from "@/components/warmups/exercises";
import { breathDrillTitle } from "@/components/breath/routines";
import type { SessionLog } from "@/lib/progress-shape";
import {
  BOOK_SLUGS,
  FREE_DAY_BUDGET_SEC,
  FREE_WEEKS,
  PROGRAMS,
  PROGRAM_ROUTINE_IDS,
  WEEK_DAYS,
  activityIsFree,
  activityRoutine,
  cappedDaySeconds,
  dayNeedsPro,
  isRestDay,
  lastSessionDay,
  nextDayKey,
  phaseForDay,
  programById,
  programProgress,
  warmupSteps,
  type Program,
  type ProgramActivity,
} from "./programs";
import { routineById } from "@/components/warmups/routines";

let seq = 0;
function log(type: SessionLog["type"], day: string, detail?: string): SessionLog {
  seq += 1;
  return { id: `s${seq}`, type, date: `${day}T12:00:00.000Z`, day, durationSec: 60, detail, xp: 10 };
}

/** Every session a day's activities would log, on `day`. */
function sessionsFor(program: Program, dayIndex: number, day: string): SessionLog[] {
  return program.days[dayIndex].activities.flatMap((a): SessionLog[] => {
    switch (a.kind) {
      case "warmup":
        return warmupSteps(a).map((s) => log("warmup", day, ALL_EXERCISES.find((e) => e.id === s.exerciseId)!.title));
      case "breath":
        return [log("breath", day, breathDrillTitle(a.drill))];
      case "ear":
        return [log("ear", day)];
      case "studio":
        return [log("pitch", day)];
      case "range":
        return [log("range", day)];
      case "songs":
        return [log("song", day)];
      case "recorder":
        return [log("recording", day)];
    }
  });
}

function addDays(day: string, n: number): string {
  let d = day;
  for (let i = 0; i < n; i++) d = nextDayKey(d);
  return d;
}

const START = "2026-09-01";

describe("programme data", () => {
  it("has the four programmes with unique ids", () => {
    expect(PROGRAMS.map((p) => p.id)).toEqual(["high-notes", "mix", "vibrato", "measured-voice"]);
    expect(programById("mix")?.weeks).toBe(6);
    expect(programById("nope")).toBeNull();
    expect(programById(null)).toBeNull();
  });

  for (const p of PROGRAMS) {
    describe(p.id, () => {
      it("has one day per calendar day of its weeks", () => {
        expect(p.days).toHaveLength(p.weeks * WEEK_DAYS);
      });

      it("names only routines and exercises that exist", () => {
        for (const d of p.days) {
          for (const a of d.activities) {
            if (a.kind !== "warmup") continue;
            if ("routineId" in a) expect(PROGRAM_ROUTINE_IDS.has(a.routineId), a.routineId).toBe(true);
            for (const s of warmupSteps(a)) {
              expect(ALL_EXERCISES.some((e) => e.id === s.exerciseId), s.exerciseId).toBe(true);
              expect(s.reps).toBeGreaterThan(0);
            }
          }
        }
      });

      it("covers every week with a phase, and cites only real chapters", () => {
        for (let i = 0; i < p.days.length; i++) expect(phaseForDay(p, i), `day ${i}`).toBeDefined();
        for (const ph of p.phases) {
          if (ph.chapter) expect(BOOK_SLUGS.has(ph.chapter), ph.chapter).toBe(true);
        }
      });

      it("practises at least three days every week and rests at least once", () => {
        for (let w = 0; w < p.weeks; w++) {
          const days = p.days.slice(w * WEEK_DAYS, (w + 1) * WEEK_DAYS);
          const sessions = days.filter((d) => !isRestDay(d)).length;
          expect(sessions, `week ${w + 1}`).toBeGreaterThanOrEqual(3);
          expect(sessions, `week ${w + 1}`).toBeLessThan(WEEK_DAYS);
        }
      });

      it("keeps week 1 free: free exercises only, inside the daily allowance", () => {
        for (let i = 0; i < FREE_WEEKS * WEEK_DAYS; i++) {
          const d = p.days[i];
          expect(dayNeedsPro(i)).toBe(false);
          for (const a of d.activities) {
            expect(activityIsFree(a), `day ${i + 1}`).toBe(true);
            if (a.kind === "warmup" && "routineId" in a) expect(routineById(a.routineId)!.pro).toBe(false);
          }
          expect(cappedDaySeconds(d), `day ${i + 1}`).toBeLessThanOrEqual(FREE_DAY_BUDGET_SEC);
        }
        expect(dayNeedsPro(FREE_WEEKS * WEEK_DAYS)).toBe(true);
      });

      it("has its last session in its last week", () => {
        expect(lastSessionDay(p)).toBeGreaterThanOrEqual(p.days.length - WEEK_DAYS);
      });

      it("finishes the day its last session is done, not after the rest days behind it", () => {
        const sessions: SessionLog[] = [];
        let day = START;
        for (let i = 0; i <= lastSessionDay(p); i++) {
          if (!isRestDay(p.days[i])) sessions.push(...sessionsFor(p, i, day));
          if (i < lastSessionDay(p)) day = nextDayKey(day);
        }
        const r = programProgress(p, START, sessions, day);
        expect(r.finished).toBe(true);
        expect(r.doneOn.at(-1)).toBe(day);
      });
    });
  }

  it("the book programme follows the book's six phases", () => {
    const p = programById("measured-voice")!;
    expect(p.phases.map((ph) => ph.chapter)).toEqual([
      "weeks-1-2-baseline",
      "weeks-3-4-middle",
      "weeks-5-6-passaggio",
      "weeks-7-8-top",
      "weeks-9-10-bottom",
      "weeks-11-12-songs",
    ]);
  });
});

describe("activityRoutine", () => {
  const p = programById("high-notes")!;
  it("returns a named routine as itself", () => {
    const a: ProgramActivity = { kind: "warmup", routineId: "high-notes" };
    expect(activityRoutine(p, 7, a)).toBe(routineById("high-notes"));
  });

  it("turns a step list into a one-off routine keyed to its programme day", () => {
    const a = p.days[0].activities[0] as Extract<ProgramActivity, { kind: "warmup" }>;
    const r = activityRoutine(p, 0, a);
    expect(r.id).toBe("program:high-notes:0");
    expect(r.pro).toBe(false);
    expect(r.steps).toEqual(warmupSteps(a));
  });

  it("marks a step list with a pack exercise as Pro", () => {
    const packOnly = ALL_EXERCISES.find((e) => !EXERCISES.some((f) => f.id === e.id))!;
    const r = activityRoutine(p, 9, { kind: "warmup", name: "x", steps: [{ exerciseId: packOnly.id, reps: 2 }] });
    expect(r.pro).toBe(true);
  });
});

describe("nextDayKey", () => {
  it("crosses month and year ends", () => {
    expect(nextDayKey("2026-09-30")).toBe("2026-10-01");
    expect(nextDayKey("2026-12-31")).toBe("2027-01-01");
    expect(nextDayKey("2028-02-28")).toBe("2028-02-29");
  });
});

describe("programProgress", () => {
  const p = programById("high-notes")!;
  // Week 1 is THREE: sessions on days 0, 2 and 4, rests on 1, 3, 5 and 6.

  it("starts at day 1 with nothing done", () => {
    const r = programProgress(p, START, [], START);
    expect(r.currentDay).toBe(0);
    expect(r.finished).toBe(false);
    expect(r.doneOn.every((d) => d === null)).toBe(true);
  });

  it("marks a day done when every activity is in the log that day", () => {
    const r = programProgress(p, START, sessionsFor(p, 0, START), START);
    expect(r.doneOn[0]).toBe(START);
    expect(r.currentDay).toBe(1);
  });

  it("does not mark a day done on part of it", () => {
    const partial = sessionsFor(p, 0, START).slice(1);
    expect(programProgress(p, START, partial, START).currentDay).toBe(0);
  });

  it("does not count activities split across two calendar days", () => {
    const [first, ...rest] = sessionsFor(p, 0, START);
    const next = addDays(START, 1);
    const split = [first, ...rest.map((s) => ({ ...s, day: next }))];
    expect(programProgress(p, START, split, next).currentDay).toBe(0);
  });

  it("ignores sessions from before the enrolment", () => {
    const before = sessionsFor(p, 0, "2026-08-31");
    expect(programProgress(p, START, before, START).currentDay).toBe(0);
  });

  it("works at most one programme day per calendar day", () => {
    // Day 0 done today; the rest day after it needs tomorrow to arrive.
    const r = programProgress(p, START, sessionsFor(p, 0, START), START);
    expect(r.doneOn[1]).toBeNull();
    const tomorrow = addDays(START, 1);
    const r2 = programProgress(p, START, sessionsFor(p, 0, START), tomorrow);
    expect(r2.doneOn[1]).toBe(tomorrow);
    expect(r2.currentDay).toBe(2);
  });

  it("waits for a missed day rather than skipping it", () => {
    const later = addDays(START, 5);
    const r = programProgress(p, START, sessionsFor(p, 0, later), addDays(START, 10));
    expect(r.doneOn[0]).toBe(later);
    // Rest day 1 falls on the day after, and day 2 waits for its sessions.
    expect(r.doneOn[1]).toBe(addDays(START, 6));
    expect(r.currentDay).toBe(2);
  });

  it("does not let today's session also count for a later day", () => {
    // Day 2's sessions logged on the same day as day 0's.
    const both = [...sessionsFor(p, 0, START), ...sessionsFor(p, 2, START)];
    const r = programProgress(p, START, both, addDays(START, 3));
    expect(r.doneOn[0]).toBe(START);
    expect(r.doneOn[2]).toBeNull();
  });

  it("finishes when every day is done in order", () => {
    const sessions: SessionLog[] = [];
    let day = START;
    for (let i = 0; i < p.days.length; i++) {
      sessions.push(...sessionsFor(p, i, day));
      day = nextDayKey(day);
    }
    const r = programProgress(p, START, sessions, day);
    expect(r.finished).toBe(true);
    expect(r.currentDay).toBeNull();
    expect(r.doneOn[lastSessionDay(p)]).toBe(addDays(START, lastSessionDay(p)));
  });

  it("keeps checkpointed days when their sessions have left the capped log", () => {
    const today = addDays(START, 3);
    const full = [...sessionsFor(p, 0, START), ...sessionsFor(p, 2, addDays(START, 2))];
    const before = programProgress(p, START, full, today);
    expect(before.currentDay).toBe(4);
    // Day 0's sessions are evicted; the checkpoint still carries it.
    const evicted = sessionsFor(p, 2, addDays(START, 2));
    expect(programProgress(p, START, evicted, today).currentDay).toBe(0);
    const after = programProgress(p, START, evicted, today, before.doneOn);
    expect(after.doneOn).toEqual(before.doneOn);
  });

  it("does not trust a checkpoint out of order or in the future", () => {
    const today = addDays(START, 1);
    expect(programProgress(p, START, [], today, [addDays(START, 5)]).currentDay).toBe(0);
    expect(programProgress(p, START, [], today, ["2026-08-01"]).currentDay).toBe(0);
  });

  it("reads a warmup exercise under a title it used to carry", () => {
    // Completion goes through titlesFor, so a renamed exercise still counts.
    const v = programById("vibrato")!;
    const r = programProgress(v, START, sessionsFor(v, 0, START), START);
    expect(r.doneOn[0]).toBe(START);
  });

  it("counts a breath drill only under its own title", () => {
    const mv = programById("measured-voice")!;
    const wrongDrill = sessionsFor(mv, 0, START).map((s) =>
      s.type === "breath" ? { ...s, detail: breathDrillTitle("box") } : s,
    );
    expect(programProgress(mv, START, wrongDrill, START).currentDay).toBe(0);
    expect(programProgress(mv, START, sessionsFor(mv, 0, START), START).currentDay).toBe(1);
  });
});
