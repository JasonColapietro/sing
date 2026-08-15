import { describe, expect, it } from "vitest";
import {
  GRADE_SCORE_FLOOR,
  STAR_MAX,
  TIEBREAK_SCORE_MARGIN,
  computeGrade,
  gradeForScore,
} from "./grade";
import { emptyTally } from "./lib";

describe("gradeForScore", () => {
  it("grades a warmup off the score alone", () => {
    expect(gradeForScore(GRADE_SCORE_FLOOR.A)?.grade).toBe("A");
    expect(gradeForScore(GRADE_SCORE_FLOOR.S)?.grade).toBe("S");
    expect(gradeForScore(0)?.grade).toBe("D");
  });

  it("never fires the combo tiebreak — a warmup has no judgments to earn it", () => {
    // Right under the A floor and inside the margin: a song with a long
    // combo would be bumped here, a warmup must not be.
    const justUnder = GRADE_SCORE_FLOOR.A - TIEBREAK_SCORE_MARGIN;
    expect(gradeForScore(justUnder)?.grade).toBe("B");
    expect(computeGrade(justUnder, 100, { perfect: 100, great: 0, good: 0, miss: 0 })?.grade).toBe(
      "A",
    );
  });

  it("returns null for an unscored session rather than a D", () => {
    expect(gradeForScore(undefined)).toBeNull();
  });

  it("rounds stars from the raw score", () => {
    expect(gradeForScore(100)?.stars).toBe(STAR_MAX);
    expect(gradeForScore(0)?.stars).toBe(0);
    expect(gradeForScore(50)?.stars).toBe(3); // 2.5 rounds up
  });

  it("matches computeGrade called with an empty tally", () => {
    for (const score of [0, 49, 50, 64, 65, 79, 80, 94, 95, 100]) {
      expect(gradeForScore(score)).toEqual(computeGrade(score, 0, emptyTally()));
    }
  });
});
