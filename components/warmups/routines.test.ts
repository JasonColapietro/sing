import { describe, expect, it } from "vitest";
import { ALL_EXERCISES, EXERCISES, PRO_PACKS } from "./exercises";
import {
  ALL_ROUTINES,
  PRO_ROUTINES,
  ROUTINES,
  STEP_INTRO_SEC,
  recommendRoutine,
  recentWarmupResults,
  routineStartingTempo,
  routineById,
  routineMinutes,
  routineSeconds,
  stepExercise,
  stepSeconds,
} from "./routines";

describe("routine catalogue", () => {
  it("names only exercises that exist", () => {
    for (const r of ALL_ROUTINES) {
      for (const s of r.steps) {
        expect(ALL_EXERCISES.some((e) => e.id === s.exerciseId), `${r.id}: ${s.exerciseId}`).toBe(true);
        expect(() => stepExercise(s)).not.toThrow();
      }
    }
  });

  it("keeps every free routine on free exercises — a routine cannot leak a pack", () => {
    for (const r of ROUTINES) {
      expect(r.pro).toBe(false);
      for (const s of r.steps) {
        expect(EXERCISES.some((e) => e.id === s.exerciseId), `${r.id}: ${s.exerciseId}`).toBe(true);
      }
    }
  });

  it("builds one Pro routine per pack, covering the pack's exercises in order", () => {
    expect(PRO_ROUTINES).toHaveLength(PRO_PACKS.length);
    PRO_PACKS.forEach((pack, i) => {
      expect(PRO_ROUTINES[i].id).toBe(pack.id);
      expect(PRO_ROUTINES[i].pro).toBe(true);
      expect(PRO_ROUTINES[i].steps.map((s) => s.exerciseId)).toEqual(pack.exercises.map((e) => e.id));
    });
  });

  it("has unique ids and at least one rep per step", () => {
    const ids = ALL_ROUTINES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of ALL_ROUTINES) {
      expect(r.steps.length).toBeGreaterThan(0);
      for (const s of r.steps) expect(s.reps).toBeGreaterThanOrEqual(1);
    }
  });

  it("finds a routine by id and returns null for anything else", () => {
    expect(routineById("daily")?.name).toBe("Daily warmup");
    expect(routineById("belt-prep")?.pro).toBe(true);
    expect(routineById("nope")).toBeNull();
    expect(routineById(null)).toBeNull();
    expect(routineById(undefined)).toBeNull();
  });
});

describe("routine length", () => {
  it("counts the teach rep once and the steady reps after it", () => {
    const one = stepSeconds({ exerciseId: "five-note-scale", reps: 1 });
    const two = stepSeconds({ exerciseId: "five-note-scale", reps: 2 });
    const three = stepSeconds({ exerciseId: "five-note-scale", reps: 3 });
    // The steady rep is shorter than the teaching rep, and constant after it.
    expect(two - one).toBeLessThan(one);
    expect(three - two).toBeCloseTo(two - one, 6);
  });

  it("adds the intro hold once per step", () => {
    const r = ROUTINES[0];
    const steps = r.steps.reduce((a, s) => a + stepSeconds(s), 0);
    expect(routineSeconds(r)).toBeCloseTo(steps + STEP_INTRO_SEC * r.steps.length, 6);
  });

  it("keeps the three lengths in order and near the recordings they mirror", () => {
    const minutes = Object.fromEntries(ROUTINES.map((r) => [r.id, routineMinutes(r)]));
    // Quick is Singeo's 7-minute warmup with the talking removed (its piano
    // runs about six minutes); Daily is the 10-minute one the same way. The
    // rep counts are the recordings', so the minutes follow from them rather
    // than the other way round — see docs/research/singeo-warmup-parameters.md.
    expect(minutes.quick).toBeGreaterThanOrEqual(5);
    expect(minutes.quick).toBeLessThanOrEqual(7);
    expect(minutes.daily).toBeGreaterThanOrEqual(8);
    expect(minutes.daily).toBeLessThanOrEqual(11);
    expect(minutes.full).toBeGreaterThanOrEqual(13);
    expect(minutes.full).toBeLessThanOrEqual(16);
    expect(minutes.quick).toBeLessThan(minutes.daily);
    expect(minutes.daily).toBeLessThan(minutes.full);
    expect(minutes.morning).toBeGreaterThanOrEqual(4);
    expect(minutes.morning).toBeLessThanOrEqual(7);
  });
});

describe("recommendRoutine", () => {
  it("tops up with the quick routine once today already has a session", () => {
    expect(recommendRoutine({ practicedToday: true, hour: 8 }).id).toBe("quick");
    expect(recommendRoutine({ practicedToday: true, hour: 19 }).id).toBe("quick");
  });

  it("offers the morning reset to a cold early voice", () => {
    expect(recommendRoutine({ practicedToday: false, hour: 7 }).id).toBe("morning");
    expect(recommendRoutine({ practicedToday: false, hour: 9 }).id).toBe("morning");
  });

  it("defaults to the daily warmup the rest of the day", () => {
    expect(recommendRoutine({ practicedToday: false, hour: 10 }).id).toBe("daily");
    expect(recommendRoutine({ practicedToday: false, hour: 22 }).id).toBe("daily");
  });
});

describe("adaptive warmups", () => {
  const strong = { count: 3, averageScore: 95, averageStars: 3 };
  const weak = { count: 3, averageScore: 35, averageStars: 0 };
  it("offers a longer and faster set after three strong sessions, and a gentle one after weak sessions", () => {
    const context = { hour: 12, practicedToday: false };
    expect(recommendRoutine({ ...context, recent: strong }).id).toBe("full");
    expect(routineStartingTempo({ ...context, recent: strong })).toBe(1.25);
    expect(recommendRoutine({ ...context, recent: weak }).id).toBe("quick");
    expect(routineStartingTempo({ ...context, recent: weak })).toBe(0.75);
    expect(recommendRoutine({ ...context, recent: { ...strong, count: 2 } }).id).toBe("daily");
  });
  it("keeps the morning reset and same-day top-up even after strong scores", () => {
    expect(recommendRoutine({ hour: 8, practicedToday: false, recent: strong }).id).toBe("morning");
    expect(routineStartingTempo({ hour: 8, practicedToday: false, recent: strong })).toBe(1);
    expect(recommendRoutine({ hour: 12, practicedToday: true, recent: strong }).id).toBe("quick");
  });
  it("uses only the newest three scored warmups, including unsorted imported records", () => {
    const session = (day: string, score?: number) => ({ id: day, day, date: day, type: "warmup" as const, durationSec: 30, xp: 0, score });
    expect(recentWarmupResults([session("2026-09-01", 0), session("2026-09-04", 90),
      session("2026-09-03", 90), session("2026-09-02", 90), session("2026-09-05"),
      { ...session("2026-09-06", 0), type: "song" as const },
    ])).toEqual({ count: 3, averageScore: 90, averageStars: 3 });
    expect(recentWarmupResults([])).toBeNull();
  });
});
