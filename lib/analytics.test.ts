import { describe, expect, it } from "vitest";
import { MIN_LADDER_DROP, ladderBreak, type LadderRep } from "./analytics";

/** A ladder of reps at rising roots, scores given in order from C4. */
function ladder(scores: number[], skipped: number[] = []): LadderRep[] {
  return scores.map((score, i) => ({
    root: 60 + i,
    score,
    skipped: skipped.includes(i),
  }));
}

describe("ladderBreak", () => {
  it("names the rep the ladder fell apart on", () => {
    const broke = ladderBreak(ladder([88, 90, 55, 60]));
    expect(broke).toEqual({ root: 62, heldAt: 90, score: 55, drop: 35 });
  });

  it("measures the fall from the best reached earlier, not the previous rep", () => {
    const broke = ladderBreak(ladder([95, 88, 70]));
    expect(broke).toEqual({ root: 62, heldAt: 95, score: 70, drop: 25 });
  });

  it("returns null when the ladder held", () => {
    expect(ladderBreak(ladder([80, 76, 84, 79]))).toBeNull();
  });

  it("ignores a dip smaller than the minimum drop", () => {
    const scores = [80, 80 - (MIN_LADDER_DROP - 1)];
    expect(ladderBreak(ladder(scores))).toBeNull();
    expect(ladderBreak(ladder([80, 80 - MIN_LADDER_DROP]))).not.toBeNull();
  });

  it("skips skipped reps at both ends of the comparison", () => {
    // Rep 1 was skipped (scores 0 by convention) — it is neither the break
    // nor allowed to reset the best held so far.
    const broke = ladderBreak(ladder([90, 0, 88], [1]));
    expect(broke).toBeNull();
  });

  it("never reports a break before there is anything to fall from", () => {
    expect(ladderBreak(ladder([20]))).toBeNull();
    expect(ladderBreak([])).toBeNull();
  });

  it("reports the first break, not the biggest one after it", () => {
    // The voice gives out at 61 and every root above it scores worse; the
    // note worth naming is where it gave out, not the lowest number after.
    const broke = ladderBreak(ladder([90, 70, 40]));
    expect(broke?.root).toBe(61);
    expect(broke?.drop).toBe(20);
  });
});
