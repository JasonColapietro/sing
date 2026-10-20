import { describe, expect, it } from "vitest";
import { breathRunSubtitle, starsForCompletion } from "./breath-runner";
import { stepHoldLabel } from "./sustain-test";

describe("a breath set carried on from a later step", () => {
  it("counts only this run's steps, so the ones sung before are not read as skipped", () => {
    // Daily breath (four steps) resumed on its sustain test, the common case
    // for a free singer: one step run, and done.
    expect(breathRunSubtitle(1, 3, 4)).toBe("Step 4 done");
    expect(breathRunSubtitle(2, 2, 4)).toBe("Steps 3–4 done");
    expect(breathRunSubtitle(1, 2, 4)).toBe("1 of 2 steps");
    expect(breathRunSubtitle(0, 3, 4)).toBe("0 of 1 step");
  });

  it("is unchanged for a run from the top", () => {
    expect(breathRunSubtitle(3, 0, 3)).toBe("Routine complete");
    expect(breathRunSubtitle(1, 0, 3)).toBe("1 of 3 steps");
  });

  it("gives a finished resumed run full completion stars", () => {
    expect(starsForCompletion(1, 4 - 3)).toBe(3);
    expect(starsForCompletion(1, 4)).toBe(1);
  });
});

describe("the line a sustain step reports", () => {
  it("says a hold under five seconds was not logged", () => {
    // A single 4.7 s sustain used to end on a score and +0 XP with no reason.
    expect(stepHoldLabel({ sec: 4.7, inhaleSec: null }, false)).toBe("4.7 s · under 5 s, not logged");
    expect(stepHoldLabel({ sec: 4.4, inhaleSec: 0.9 }, false)).toBe("4.4 s · 0.9 s breath in · under 5 s, not logged");
  });

  it("is the plain hold once an attempt was logged, and for no attempt at all", () => {
    expect(stepHoldLabel({ sec: 7, inhaleSec: null }, true)).toBe("7.0 s");
    expect(stepHoldLabel({ sec: 12.3, inhaleSec: 1.2 }, true)).toBe("12.3 s · 1.2 s breath in");
    expect(stepHoldLabel(null, false)).toBe("0.0 s");
    // Under a second is not an attempt; there is nothing to call unlogged.
    expect(stepHoldLabel({ sec: 0.6, inhaleSec: null }, false)).toBe("0.6 s");
  });
});
