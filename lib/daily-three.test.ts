import { describe, expect, it } from "vitest";
import { ALL_EXERCISES, EXERCISES, PRO_PACKS } from "@/components/warmups/exercises";
import type { SessionLog } from "@/lib/progress-shape";
import {
  dailyTempoFor,
  dailyThreeDone,
  exerciseKind,
  planDailyThree,
  seededUnit,
  tempoForScores,
} from "./daily-three";

const TODAY = "2026-09-23";

let seq = 0;
function warmup(detail: string, score: number | undefined, day: string): SessionLog {
  seq += 1;
  return {
    id: `s${seq}`,
    type: "warmup",
    date: `${day}T12:${String(seq % 60).padStart(2, "0")}:00.000Z`,
    day,
    durationSec: 90,
    score,
    detail,
    xp: 10,
  };
}

const title = (id: string) => EXERCISES.find((e) => e.id === id)!.title;
const ids = (plan: ReturnType<typeof planDailyThree>) => plan.picks.map((p) => p.exercise.id);

/** Every free exercise sung yesterday at a middling 80, so only overrides stand out. */
function baseline(day = "2026-09-22"): SessionLog[] {
  return EXERCISES.map((e) => warmup(e.title, 80, day));
}

describe("exerciseKind", () => {
  it("files the catalogue into its kinds", () => {
    const byId = (id: string) => exerciseKind(EXERCISES.find((e) => e.id === id)!);
    expect(byId("octave-siren")).toBe("sirens");
    expect(byId("sustained-hold")).toBe("holds");
    expect(byId("agility-run")).toBe("runs");
    expect(byId("sixth-leaps")).toBe("leaps");
    expect(byId("five-note-scale")).toBe("patterns");
    // The focus drills land in kinds by shape too.
    expect(byId("vibrato-hold")).toBe("holds");
    expect(byId("fry-onset")).toBe("holds");
    expect(byId("soft-trill-slide")).toBe("sirens");
    expect(byId("high-arpeggio-tenth")).toBe("patterns");
  });
});

describe("planDailyThree", () => {
  it("gives a new singer three foundation exercises of three kinds", () => {
    const plan = planDailyThree({ sessions: [], day: TODAY });
    expect(plan.picks).toHaveLength(3);
    expect(new Set(plan.picks.map((p) => p.kind)).size).toBe(3);
    expect(plan.picks.every((p) => p.exercise.tier !== "advanced")).toBe(true);
    expect(plan.picks[0].exercise.tier).toBe("beginner");
    expect(plan.picks.every((p) => p.recentAvg === null && p.role === "new")).toBe(true);
    expect(plan.picks.every((p) => p.tempo === 1)).toBe(true);
  });

  it("puts the weakest exercises in the set", () => {
    const sessions = [
      ...baseline(),
      warmup(title("octave-siren"), 30, "2026-09-22"),
      warmup(title("agility-run"), 35, "2026-09-22"),
    ];
    const plan = planDailyThree({ sessions, day: TODAY });
    expect(ids(plan)).toContain("octave-siren");
    expect(ids(plan)).toContain("agility-run");
    const siren = plan.picks.find((p) => p.exercise.id === "octave-siren")!;
    expect(siren.role).toBe("focus");
  });

  it("brings back an exercise that has gone stale", () => {
    // Two sung well long ago, everything else sung well yesterday: the stale
    // pair take the set — one as the warm-up, the other as a refresh.
    const stale = new Set(["sixth-leaps", "octave-siren"]);
    const sessions = [
      ...EXERCISES.filter((e) => !stale.has(e.id)).map((e) => warmup(e.title, 85, "2026-09-22")),
      ...[...stale].map((id) => warmup(title(id), 85, "2026-08-01")),
    ];
    const plan = planDailyThree({ sessions, day: TODAY });
    const picked = plan.picks.filter((p) => stale.has(p.exercise.id));
    expect(picked.map((p) => p.role).sort()).toEqual(["confidence", "refresh"]);
    expect(picked.find((p) => p.role === "refresh")?.why).toMatch(/53 days/);
  });

  it("keeps the three to different kinds even when one kind is weakest", () => {
    // Every siren scores badly; only one of them may take a focus slot.
    const sirens = EXERCISES.filter((e) => exerciseKind(e) === "sirens");
    expect(sirens.length).toBeGreaterThan(2);
    const sessions = [...baseline(), ...sirens.map((e) => warmup(e.title, 20, "2026-09-22"))];
    const plan = planDailyThree({ sessions, day: TODAY });
    expect(new Set(plan.picks.map((p) => p.kind)).size).toBe(3);
    expect(plan.picks.filter((p) => p.kind === "sirens")).toHaveLength(1);
  });

  it("includes one exercise the singer sings well, first", () => {
    const sessions = [
      ...EXERCISES.map((e) => warmup(e.title, 40, "2026-09-22")),
      warmup(title("humming-thirds"), 95, "2026-09-22"),
      warmup(title("humming-thirds"), 92, "2026-09-21"),
    ];
    const plan = planDailyThree({ sessions, day: TODAY });
    expect(plan.picks[0].exercise.id).toBe("humming-thirds");
    expect(plan.picks[0].role).toBe("confidence");
    expect(plan.picks.slice(1).every((p) => p.role === "focus")).toBe(true);
  });

  it("falls back to the best-scored exercise when nothing is confident yet", () => {
    const sessions = [
      warmup(title("five-note-scale"), 60, "2026-09-22"),
      warmup(title("octave-siren"), 30, "2026-09-22"),
    ];
    const plan = planDailyThree({ sessions, day: TODAY });
    expect(plan.picks[0].exercise.id).toBe("five-note-scale");
    expect(plan.picks[0].role).toBe("confidence");
  });

  it("is the same plan all day, and does not move when today's sessions land", () => {
    const sessions = baseline();
    const morning = planDailyThree({ sessions, day: TODAY });
    const again = planDailyThree({ sessions: [...sessions], day: TODAY });
    expect(ids(again)).toEqual(ids(morning));
    const afterSinging = [
      ...sessions,
      ...morning.picks.map((p) => warmup(p.exercise.title, 10, TODAY)),
    ];
    expect(ids(planDailyThree({ sessions: afterSinging, day: TODAY }))).toEqual(ids(morning));
  });

  it("rotates between days with an even history", () => {
    const sessions = baseline("2026-09-01");
    const days = ["2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27"];
    const plans = new Set(days.map((day) => ids(planDailyThree({ sessions, day })).join(",")));
    expect(plans.size).toBeGreaterThan(1);
  });

  it("never picks a Pro pack exercise, however weak its history", () => {
    const packIds = new Set(PRO_PACKS.flatMap((p) => p.exercises.map((e) => e.id)));
    const packSessions = PRO_PACKS.flatMap((p) => p.exercises).map((e) => warmup(e.title, 5, "2026-09-22"));
    for (const day of ["2026-09-23", "2026-09-24", "2026-09-25"]) {
      const plan = planDailyThree({ sessions: [...baseline(), ...packSessions], day, catalogue: ALL_EXERCISES });
      expect(plan.picks).toHaveLength(3);
      expect(plan.picks.some((p) => packIds.has(p.exercise.id))).toBe(false);
    }
    // And a catalogue of only pack exercises yields nothing at all.
    const packOnly = planDailyThree({
      sessions: [],
      day: TODAY,
      catalogue: PRO_PACKS.flatMap((p) => p.exercises),
    });
    expect(packOnly.picks).toHaveLength(0);
  });

  it("reads sessions logged under a retired title", () => {
    // The only history is under the arpeggio's old name, so the confidence
    // slot can only be filled by recognising it.
    const sessions = [
      warmup("Lip-trill scale", 90, "2026-09-21"),
      warmup("Lip-trill scale", 94, "2026-09-22"),
    ];
    const plan = planDailyThree({ sessions, day: TODAY });
    expect(plan.picks[0]).toMatchObject({ role: "confidence", recentAvg: 92, tempo: 1.25 });
    expect(plan.picks[0].exercise.id).toBe("lip-trill-scale");
  });

  it("ignores unscored listens", () => {
    const sessions = [...baseline(), warmup(title("octave-siren"), undefined, "2026-09-22")];
    const plan = planDailyThree({ sessions, day: TODAY });
    expect(plan.picks.every((p) => p.recentAvg !== null)).toBe(true);
  });
});

describe("difficulty steps", () => {
  it("steps tempo up after two clean takes and down after rough ones", () => {
    expect(tempoForScores([92, 88], "intermediate")).toBe(1.25);
    expect(tempoForScores([92], "intermediate")).toBe(1);
    expect(tempoForScores([80, 70, 75], "beginner")).toBe(1);
    expect(tempoForScores([60, 55], "beginner")).toBe(0.75);
    expect(tempoForScores([30, 40], "beginner")).toBe(0.5);
    expect(tempoForScores([], "beginner")).toBe(1);
    expect(tempoForScores([], "advanced")).toBe(0.75);
  });

  it("carries the step into each pick", () => {
    const sessions = [
      ...EXERCISES.filter((e) => e.id !== "octave-siren").map((e) => warmup(e.title, 72, "2026-09-20")),
      warmup(title("humming-thirds"), 95, "2026-09-22"),
      warmup(title("humming-thirds"), 90, "2026-09-21"),
      warmup(title("octave-siren"), 30, "2026-09-22"),
    ];
    const plan = planDailyThree({ sessions, day: TODAY });
    const confident = plan.picks.find((p) => p.exercise.id === "humming-thirds")!;
    expect(confident).toMatchObject({ tempo: 1.25, step: "up" });
    const siren = plan.picks.find((p) => p.exercise.id === "octave-siren")!;
    expect(siren).toMatchObject({ tempo: 0.5, step: "down" });
    expect(dailyTempoFor(plan, "octave-siren")).toBe(0.5);
    expect(dailyTempoFor(plan, "not-in-plan")).toBeNull();
    expect(dailyTempoFor(null, "octave-siren")).toBeNull();
  });
});

describe("dailyThreeDone", () => {
  it("ticks the picks sung today and nothing from earlier days", () => {
    const plan = planDailyThree({ sessions: [], day: TODAY });
    const [a, b] = plan.picks;
    const sessions = [
      warmup(a.exercise.title, 70, TODAY),
      warmup(b.exercise.title, 70, "2026-09-22"),
    ];
    expect(dailyThreeDone(plan, sessions)).toEqual([true, false, false]);
  });
});

describe("seededUnit", () => {
  it("is stable and in range", () => {
    expect(seededUnit("2026-09-23:x")).toBe(seededUnit("2026-09-23:x"));
    for (const k of ["a", "b", "2026-01-01:five-note-scale"]) {
      const v = seededUnit(k);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
