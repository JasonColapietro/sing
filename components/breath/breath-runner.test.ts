import { describe, expect, it } from "vitest";
import { breathRunSubtitle, starsForCompletion } from "./breath-runner";

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
