import { describe, expect, it } from "vitest";
import {
  BREATH_DRILL_IDS,
  BREATH_ROUTINES,
  BREATH_STEP_INTRO_SEC,
  CUE_BREATH_SEC,
  CUE_REP_CHOICES,
  FARINELLI_LEAD_SEC,
  SUSTAIN_ATTEMPT_SEC,
  boxSeconds,
  breathDrillDesc,
  breathDrillTitle,
  breathRoutineById,
  breathRoutineMinutes,
  breathRoutineSeconds,
  breathStepNeedsMic,
  breathStepSeconds,
  breathStepSummary,
  breathStepTitle,
  farinelliCapReached,
  farinelliSeconds,
  isBreathDrillId,
  recommendBreathRoutine,
  routineNeedsMic,
  type BreathStep,
} from "./routines";
import {
  starsForBox,
  starsForCue,
  starsForFarinelli,
  starsForSustain,
} from "./store";

describe("breath routine catalogue", () => {
  it("has unique ids, a name, a tagline and at least one step each", () => {
    const ids = BREATH_ROUTINES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of BREATH_ROUTINES) {
      expect(r.name.length).toBeGreaterThan(0);
      expect(r.tagline.length).toBeGreaterThan(0);
      expect(r.steps.length).toBeGreaterThan(0);
    }
  });

  it("keeps every step inside the range its drill's own control allows", () => {
    for (const r of BREATH_ROUTINES) {
      for (const s of r.steps) {
        if (s.drill === "box") {
          // the setup slider is 3..8 seconds a side, and the length buttons 1/3/5
          expect(s.side).toBeGreaterThanOrEqual(3);
          expect(s.side).toBeLessThanOrEqual(8);
          expect([1, 3, 5]).toContain(s.minutes);
        } else if (s.drill === "farinelli") {
          // the setup slider is 8..12
          expect(s.cap).toBeGreaterThanOrEqual(8);
          expect(s.cap).toBeLessThanOrEqual(12);
        } else if (s.drill === "cue") {
          // the rep picker's own choices, and a note a singer can repeat
          expect(CUE_REP_CHOICES).toContain(s.reps);
          expect(s.holdSec).toBeGreaterThanOrEqual(2);
          expect(s.holdSec).toBeLessThanOrEqual(8);
        } else {
          expect(s.attempts).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it("accepts every drill id as a deep link, and nothing else", () => {
    // /breath?drill= is built by a curriculum on another origin.
    expect(BREATH_DRILL_IDS).toEqual(["sustain", "cue", "box", "farinelli"]);
    for (const id of BREATH_DRILL_IDS) expect(isBreathDrillId(id)).toBe(true);
    expect(isBreathDrillId("breath")).toBe(false);
    expect(isBreathDrillId(null)).toBe(false);
    // Every drill a routine uses can also be linked on its own.
    for (const r of BREATH_ROUTINES) {
      for (const s of r.steps) expect(isBreathDrillId(s.drill)).toBe(true);
    }
  });

  it("finds a routine by id and returns null for anything else", () => {
    expect(breathRoutineById("daily")?.name).toBe("Daily breath");
    expect(breathRoutineById("nope")).toBeNull();
    expect(breathRoutineById(null)).toBeNull();
    expect(breathRoutineById(undefined)).toBeNull();
  });

  it("recommends the quick set to someone who already breathed today", () => {
    expect(recommendBreathRoutine({ practicedToday: true }).id).toBe("quick");
    expect(recommendBreathRoutine({ practicedToday: false }).id).toBe("daily");
  });
});

describe("breath step arithmetic", () => {
  it("rounds box up to a whole cycle, the way the drill itself does", () => {
    // 1 minute of 4-second sides: 16s a cycle, so four cycles and 64 seconds.
    expect(boxSeconds({ side: 4, minutes: 1 })).toBe(64);
    // 3 minutes of 5-second sides: 20s a cycle divides 180 exactly.
    expect(boxSeconds({ side: 5, minutes: 3 })).toBe(180);
    // never short of the promised length
    for (const side of [3, 4, 5, 6, 7, 8]) {
      for (const minutes of [1, 3, 5]) {
        const sec = boxSeconds({ side, minutes });
        expect(sec).toBeGreaterThanOrEqual(minutes * 60);
        expect(sec % (side * 4)).toBe(0);
      }
    }
  });

  it("counts Farinelli as 3n beats a round from four to the cap, plus the lead-in", () => {
    // n = 4..8 → 3 × (4+5+6+7+8) = 90 beats at one a second
    expect(farinelliSeconds({ cap: 8 })).toBeCloseTo(90 + FARINELLI_LEAD_SEC, 6);
    expect(farinelliSeconds({ cap: 10 })).toBeCloseTo(147 + FARINELLI_LEAD_SEC, 6);
    expect(farinelliSeconds({ cap: 12 })).toBeCloseTo(216 + FARINELLI_LEAD_SEC, 6);
    // one more round always costs 3n more seconds
    expect(farinelliSeconds({ cap: 9 }) - farinelliSeconds({ cap: 8 })).toBeCloseTo(27, 6);
  });

  it("reads the climb back out of the seconds it ran", () => {
    expect(farinelliCapReached(0)).toBe(0);
    expect(farinelliCapReached(11)).toBe(0); // the first round is 12 beats
    expect(farinelliCapReached(12)).toBe(4);
    expect(farinelliCapReached(26)).toBe(4); // round 5 needs 15 more
    expect(farinelliCapReached(27)).toBe(5);
    expect(farinelliCapReached(90)).toBe(8);
    expect(farinelliCapReached(1000)).toBe(12); // never past the drill's own cap
  });

  it("is the exact inverse of the length of a finished drill", () => {
    for (const cap of [8, 9, 10, 11, 12]) {
      expect(farinelliCapReached(farinelliSeconds({ cap }) - FARINELLI_LEAD_SEC)).toBe(cap);
    }
  });

  it("prices a breathe-and-sing step per rep, breath included", () => {
    expect(breathStepSeconds({ drill: "cue", reps: 4, holdSec: 4 })).toBe(4 * (4 + CUE_BREATH_SEC));
  });

  it("prices a sustain step per attempt", () => {
    expect(breathStepSeconds({ drill: "sustain", attempts: 1 })).toBe(SUSTAIN_ATTEMPT_SEC);
    expect(breathStepSeconds({ drill: "sustain", attempts: 3 })).toBe(SUSTAIN_ATTEMPT_SEC * 3);
  });

  it("adds the intro hold once per step", () => {
    for (const r of BREATH_ROUTINES) {
      const steps = r.steps.reduce((a, s) => a + breathStepSeconds(s), 0);
      expect(breathRoutineSeconds(r)).toBeCloseTo(
        steps + BREATH_STEP_INTRO_SEC * r.steps.length,
        6,
      );
    }
  });

  it("orders the three routines shortest to longest and keeps them under a quarter hour", () => {
    const [quick, daily, builder] = BREATH_ROUTINES;
    expect(quick.id).toBe("quick");
    expect(breathRoutineSeconds(quick)).toBeLessThan(breathRoutineSeconds(daily));
    expect(breathRoutineSeconds(daily)).toBeLessThan(breathRoutineSeconds(builder));
    expect(breathRoutineMinutes(quick)).toBeGreaterThanOrEqual(3);
    expect(breathRoutineMinutes(builder)).toBeLessThanOrEqual(15);
  });
});

describe("breath step copy", () => {
  const cases: BreathStep[] = [
    { drill: "box", side: 4, minutes: 3 },
    { drill: "farinelli", cap: 8 },
    { drill: "sustain", attempts: 2 },
    { drill: "cue", reps: 4, holdSec: 4 },
  ];

  it("titles every drill and describes it in a sentence", () => {
    expect(cases.map(breathStepTitle)).toEqual([
      "Box breathing",
      "Farinelli drill",
      "Sustain test",
      "Breathe and sing",
    ]);
    for (const d of BREATH_DRILL_IDS) {
      expect(breathDrillTitle(d).length).toBeGreaterThan(0);
      expect(breathDrillDesc(d).length).toBeGreaterThan(20);
    }
  });

  it("summarises a preset in the words the drill reports back", () => {
    expect(breathStepSummary(cases[0])).toBe("3 min · 4s sides");
    expect(breathStepSummary(cases[1])).toBe("Top count 8");
    expect(breathStepSummary(cases[2])).toBe("2 attempts");
    expect(breathStepSummary({ drill: "sustain", attempts: 1 })).toBe("1 attempt");
    expect(breathStepSummary(cases[3])).toBe("4 reps · 4s notes");
  });

  /**
   * The mic hears a breath; it measures nothing about one. Copy that drifted
   * into "support", "lung capacity" or "the diaphragm" would be claiming an
   * instrument that does not exist — see contracts/suede-vocal.ts.
   */
  it("describes breathe-and-sing as hearing the breath, never measuring it", () => {
    const copy = breathDrillDesc("cue");
    expect(copy).toMatch(/mic listens for the breath/i);
    expect(copy).not.toMatch(/support|lung|capacity|diaphragm|measur/i);
  });

  it("flags the sustain test and breathe-and-sing as needing the microphone", () => {
    expect(cases.map(breathStepNeedsMic)).toEqual([false, false, true, true]);
    for (const r of BREATH_ROUTINES) {
      expect(routineNeedsMic(r)).toBe(
        r.steps.some((s) => s.drill === "sustain" || s.drill === "cue"),
      );
    }
  });
});

describe("stars", () => {
  it("scores a sustain against the printed benchmarks", () => {
    expect(starsForSustain(0)).toBe(0);
    expect(starsForSustain(9.9)).toBe(0);
    expect(starsForSustain(10)).toBe(1);
    expect(starsForSustain(20)).toBe(2);
    expect(starsForSustain(30)).toBe(3);
    expect(starsForSustain(60)).toBe(3);
  });

  it("scores the unscored drills by how far they were taken", () => {
    expect(starsForBox(0)).toBe(0);
    expect(starsForBox(1)).toBe(1);
    expect(starsForBox(3)).toBe(2);
    expect(starsForBox(5)).toBe(3);
    expect(starsForFarinelli(0)).toBe(0);
    expect(starsForFarinelli(8)).toBe(1);
    expect(starsForFarinelli(10)).toBe(2);
    expect(starsForFarinelli(12)).toBe(3);
    // on the three run lengths the rep picker offers
    expect(starsForCue(0)).toBe(0);
    expect(starsForCue(3)).toBe(0);
    expect(starsForCue(CUE_REP_CHOICES[0])).toBe(1);
    expect(starsForCue(CUE_REP_CHOICES[1])).toBe(2);
    expect(starsForCue(CUE_REP_CHOICES[2])).toBe(3);
  });

  it("gives every routine's own presets at least one star on each drill", () => {
    for (const r of BREATH_ROUTINES) {
      for (const s of r.steps) {
        if (s.drill === "box") expect(starsForBox(s.minutes)).toBeGreaterThanOrEqual(1);
        if (s.drill === "farinelli") expect(starsForFarinelli(s.cap)).toBeGreaterThanOrEqual(1);
        if (s.drill === "cue") expect(starsForCue(s.reps)).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
