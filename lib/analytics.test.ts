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

/** Reps in the order they were sung, as [root, score] pairs. */
function walk(pairs: readonly (readonly [number, number])[]): LadderRep[] {
  return pairs.map(([root, score]) => ({ root, score, skipped: false }));
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

  /* The warmup walks the ladder endlessly: up to the top of the range, back
     down, and again until the singer ends it. Only a rising run can break. */

  it("does not name a break on the way back down", () => {
    // Straight off the review: the 74 at the bottom is 16 under the peak of
    // the climb, but every root under it was already sung fine on the way up.
    const broke = ladderBreak(
      walk([
        [60, 70],
        [61, 75],
        [62, 80],
        [63, 88],
        [64, 90],
        [63, 86],
        [62, 84],
        [61, 80],
        [60, 74],
      ]),
    );
    expect(broke).toBeNull();
  });

  it("does not count the turn at the top as a break", () => {
    // The rep after the top is the same ladder heading down, one root lower —
    // a soft one there is a descent, not the ladder coming apart.
    expect(ladderBreak(walk([[64, 92], [65, 90], [64, 60]]))).toBeNull();
  });

  it("holds through a long walk that only sags on the descents", () => {
    // Five full up-and-down rounds, climbs 72..88 and descents 71..77. The
    // running maximum over the whole session clears the threshold within the
    // first round; no single climb ever does.
    const reps: LadderRep[] = [];
    for (let round = 0; round < 5; round++) {
      for (let i = 0; i <= 8; i++) reps.push({ root: 60 + i, score: 72 + i * 2 });
      for (let i = 7; i >= 1; i--) reps.push({ root: 60 + i, score: 70 + i });
    }
    expect(reps).toHaveLength(80);
    expect(ladderBreak(reps)).toBeNull();
  });

  it("measures the fall from the current climb, not the session's best", () => {
    // 95 belongs to the first climb. Naming it as what the second climb held
    // at would report a drop the singer never took.
    const broke = ladderBreak(walk([[60, 95], [61, 96], [60, 80], [61, 66]]));
    expect(broke).toEqual({ root: 61, heldAt: 80, score: 66, drop: 14 });
  });

  it("finds a break on a later climb, when the voice tires", () => {
    // The first climb holds; the ladder gives out on the second. An endless
    // walk is long enough for that to be the whole story of the session.
    const broke = ladderBreak(
      walk([
        [60, 88],
        [61, 90],
        [62, 91],
        [61, 87],
        [60, 86],
        [60, 84],
        [61, 86],
        [62, 68],
      ]),
    );
    expect(broke).toEqual({ root: 62, heldAt: 86, score: 68, drop: 18 });
  });

  it("keeps a climb intact across a skipped rep", () => {
    // The skip is not a break and does not end the climb either: 62 is still
    // above 60, so the drop from 90 is real.
    const broke = ladderBreak([
      { root: 60, score: 90 },
      { root: 61, score: 0, skipped: true },
      { root: 62, score: 70 },
    ]);
    expect(broke).toEqual({ root: 62, heldAt: 90, score: 70, drop: 20 });
  });

  it("never breaks when the walk sits on one root", () => {
    // A one-root ladder has no climb to come apart, however the scores move.
    expect(ladderBreak(walk([[60, 90], [60, 88], [60, 60], [60, 91]]))).toBeNull();
  });
});
