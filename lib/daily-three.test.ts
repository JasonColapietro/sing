import { describe, expect, it } from "vitest";
import { ALL_EXERCISES, EXERCISES, PRO_PACKS, buildSegments } from "@/components/warmups/exercises";
import type { SessionLog } from "@/lib/progress-shape";
import {
  KIND_SESSION_ORDER,
  MAX_ONE_BREATH_SEC,
  dailyTempoFor,
  dailyThreeDone,
  exerciseKind,
  planDailyThree,
  seededUnit,
  slowestOneBreathTempo,
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
    const stale = new Set(["humming-thirds", "octave-siren"]);
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

  it("never opens on a run, a leap or an advanced exercise, however well it is sung", () => {
    // A singer who sings every free exercise well: the warm-up slot used to
    // land on a sixth leap or a pentatonic run at 1.25x on about one day in six.
    for (let i = 0; i < 60; i++) {
      const day = new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10);
      const back = (n: number) => new Date(Date.UTC(2026, 9, 1 + i - n)).toISOString().slice(0, 10);
      const sessions = EXERCISES.flatMap((e) => [warmup(e.title, 88, back(1)), warmup(e.title, 88, back(2))]);
      const first = planDailyThree({ sessions, day }).picks[0];
      expect(first.role, day).toBe("confidence");
      expect(first.exercise.tier, `${day} ${first.exercise.id}`).toBe("beginner");
      expect(["runs", "leaps"], `${day} ${first.exercise.id}`).not.toContain(first.kind);
    }
  });

  it("does not hand the warm-up slot to a run the singer sings best", () => {
    const sessions = [
      ...EXERCISES.map((e) => warmup(e.title, 40, "2026-09-22")),
      warmup(title("pentatonic-run"), 95, "2026-09-22"),
      warmup(title("pentatonic-run"), 95, "2026-09-21"),
      warmup(title("humming-thirds"), 70, "2026-09-21"),
    ];
    const plan = planDailyThree({ sessions, day: TODAY });
    expect(plan.picks[0].exercise.id).not.toBe("pentatonic-run");
    expect(plan.picks[0].exercise.tier).toBe("beginner");
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

  it("never slows a one-breath pattern past one comfortable breath", () => {
    // Hung-ee-mm is three passes on one breath: 9.4s at 1x, 18.8s at 0.5x.
    const hung = EXERCISES.find((e) => e.id === "hung-ee-mm")!;
    const rep = (t: number) => buildSegments(hung, 60, t).totalSec;
    expect(rep(0.5)).toBeGreaterThan(MAX_ONE_BREATH_SEC);
    expect(slowestOneBreathTempo(hung)).toBe(1);
    const sessions = [
      ...baseline(),
      warmup(title("hung-ee-mm"), 30, "2026-09-22"),
      warmup(title("hung-ee-mm"), 35, "2026-09-21"),
    ];
    const plan = planDailyThree({ sessions, day: TODAY });
    const p = plan.picks.find((x) => x.exercise.id === "hung-ee-mm")!;
    expect(p.role).toBe("focus");
    expect(p).toMatchObject({ tempo: 1, step: "hold" });
    expect(rep(p.tempo)).toBeLessThanOrEqual(MAX_ONE_BREATH_SEC);
    // Every free exercise's floor fits one breath.
    for (const e of EXERCISES) {
      expect(buildSegments(e, 60, slowestOneBreathTempo(e)).totalSec, e.id).toBeLessThanOrEqual(MAX_ONE_BREATH_SEC);
    }
    // Shorter patterns still step down as far as their scores ask.
    expect(slowestOneBreathTempo(EXERCISES.find((e) => e.id === "octave-siren")!)).toBe(0.5);
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

describe("the order of today's three", () => {
  it("keeps the warm-up pick first and sings the other two gentlest kind first", () => {
    // Weak at a fast run and a siren: both are picked on need, and the siren,
    // which prepares the voice, is sung before the run whatever their scores.
    for (const [run, siren] of [[20, 40], [40, 20]]) {
      const sessions = [
        ...baseline(),
        warmup(title("agility-run"), run, "2026-09-22"),
        warmup(title("octave-siren"), siren, "2026-09-22"),
        warmup(title("humming-thirds"), 98, "2026-09-22"),
      ];
      const plan = planDailyThree({ sessions, day: TODAY });
      expect(plan.picks[0].role).toBe("confidence");
      expect(ids(plan).slice(1)).toEqual(["octave-siren", "agility-run"]);
    }
  });

  it("puts every pick after the first in session order, on any day", () => {
    for (let d = 1; d <= 28; d++) {
      const day = `2026-10-${String(d).padStart(2, "0")}`;
      const plan = planDailyThree({ sessions: baseline("2026-09-22"), day });
      const ranks = plan.picks.slice(1).map((p) => KIND_SESSION_ORDER.indexOf(p.kind));
      expect(ranks.every((r) => r >= 0), day).toBe(true);
      expect(ranks, day).toEqual([...ranks].sort((a, b) => a - b));
    }
  });
});

describe("today's three and the saved range", () => {
  /** `n` consecutive local days from 2026-09-23. */
  const days = (n: number) =>
    Array.from({ length: n }, (_, i) => new Date(Date.UTC(2026, 8, 23 + i)).toISOString().slice(0, 10));
  const tooWide = ["n-hum-scale", "gug-staccato"];
  // A2–D4, 17 semitones: the twelfth runs span 19, so the routines skip them.
  const narrow = { lowMidi: 45, highMidi: 62 };

  it("never hands out a pattern too wide for the saved range, new or weak", () => {
    // Weak at both runs, the way a run sung under the measured low scores:
    // without the range they come back as weak spots.
    const weak = [
      ...baseline(),
      warmup(title("n-hum-scale"), 35, "2026-09-22"),
      warmup(title("gug-staccato"), 35, "2026-09-22"),
    ];
    const unranged = days(60).filter((day) =>
      ids(planDailyThree({ sessions: weak, day })).some((id) => tooWide.includes(id)),
    );
    expect(unranged.length).toBeGreaterThan(0);
    for (const sessions of [weak, baseline(), []]) {
      for (const day of days(60)) {
        const plan = planDailyThree({ sessions, day, range: narrow });
        expect(plan.picks, day).toHaveLength(3);
        expect(ids(plan).filter((id) => tooWide.includes(id)), day).toEqual([]);
      }
    }
  });

  it("is unchanged for a range that holds them, or no saved range", () => {
    const sessions = [...baseline(), warmup(title("n-hum-scale"), 35, "2026-09-22")];
    for (const day of days(60)) {
      const plain = ids(planDailyThree({ sessions, day }));
      expect(ids(planDailyThree({ sessions, day, range: { lowMidi: 48, highMidi: 72 } })), day).toEqual(plain);
      expect(ids(planDailyThree({ sessions, day, range: {} })), day).toEqual(plain);
    }
  });
});
