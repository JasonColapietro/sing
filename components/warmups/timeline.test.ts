import { describe, expect, it } from "vitest";
import {
  COUNT_IN_CLICKS,
  GRACE_SEC,
  MIN_LEAD_SEC,
  clickTimes,
  leadSec,
  planRep,
} from "./timeline";

const PATTERN = 5.14; // the five-note scale at 1x
const NOTE_DUR = 0.5;

const rep = (mode: "sing-along" | "call-response", repIndex: number, t0 = 0) =>
  planRep({ mode, repIndex, t0, patternSec: PATTERN, noteDur: NOTE_DUR });

describe("planRep", () => {
  it("teaches the pattern before sing-along's first scored window", () => {
    const plan = rep("sing-along", 0);
    expect(plan.guideAt).toBe(0);
    expect(plan.leadAt).toBe(PATTERN);
  });

  it("teaches exactly once — rep 1 goes straight to the count-in", () => {
    const plan = rep("sing-along", 1);
    expect(plan.guideAt).toBeNull();
    expect(plan.leadAt).toBe(0);
  });

  it("makes the steady-state rep shorter than the teaching rep, which is the point", () => {
    expect(rep("sing-along", 1).repDur).toBeLessThan(rep("sing-along", 0).repDur);
  });

  it("re-teaches before every call-and-response rep", () => {
    const plan = rep("call-response", 5);
    expect(plan.guideAt).toBe(0);
    expect(plan.leadAt).toBe(PATTERN);
  });

  it("sounds the guide under the voice in sing-along only, from rep 0", () => {
    expect(rep("sing-along", 0).guideUnderVoice).toBe(true);
    expect(rep("sing-along", 3).guideUnderVoice).toBe(true);
    expect(rep("call-response", 0).guideUnderVoice).toBe(false);
    expect(rep("call-response", 3).guideUnderVoice).toBe(false);
  });

  it("always leaves a breath — singAt is strictly past leadAt in every shape", () => {
    for (const mode of ["sing-along", "call-response"] as const) {
      for (const i of [0, 1, 2, 7]) {
        const plan = rep(mode, i);
        expect(plan.singAt).toBeGreaterThan(plan.leadAt);
      }
    }
  });

  it("keeps the grace inside the window it belongs to", () => {
    const plan = rep("sing-along", 1);
    expect(plan.singDur).toBeCloseTo(PATTERN + GRACE_SEC, 6);
    expect(plan.repDur).toBeCloseTo(plan.singAt + plan.singDur, 6);
  });
});

describe("leadSec", () => {
  it("breathes at the exercise's own pulse, floored for fast patterns", () => {
    expect(leadSec(0.5)).toBe(1.0);
    expect(leadSec(0.3)).toBe(MIN_LEAD_SEC);
  });
});

describe("clickTimes", () => {
  it("lands every count-in click before the scored window opens", () => {
    const plan = rep("sing-along", 1, 3.25);
    const clicks = clickTimes(plan, NOTE_DUR);
    expect(clicks).toHaveLength(COUNT_IN_CLICKS);
    expect(clicks[0]).toBeCloseTo(plan.t0 + plan.leadAt, 6);
    expect(clicks[clicks.length - 1]).toBeLessThan(plan.t0 + plan.singAt);
  });
});

describe("chained reps", () => {
  it("never overlaps one rep's scored window with the next rep's lead-in", () => {
    let t0 = 1.5;
    let prevSingEnd = -Infinity;
    for (let i = 0; i < 5; i++) {
      const plan = rep("sing-along", i, t0);
      const singStart = plan.t0 + plan.singAt;
      const singEnd = singStart + plan.singDur;
      expect(singStart).toBeGreaterThan(prevSingEnd);
      // The next rep's first event starts at or after this window closes.
      expect(plan.t0 + plan.repDur).toBeGreaterThanOrEqual(singEnd);
      prevSingEnd = singEnd;
      t0 = plan.t0 + plan.repDur;
    }
  });
});
