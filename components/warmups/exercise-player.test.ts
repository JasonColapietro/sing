import { describe, expect, it } from "vitest";
import {
  ladderHeightPct,
  practicedDurationSec,
  repAscending,
  unsungRepAction,
} from "./exercise-player";
import { EXERCISES, computeRootLadder, ladderWalk } from "./exercises";
import { repAvgScore, type RepResult } from "./lib";

const fiveNote = EXERCISES.find((e) => e.id === "five-note-scale")!;

const sungRep = (score: number): RepResult => ({
  root: 52,
  score,
  avgCentsErr: 18,
  skipped: false,
});

describe("unsungRepAction", () => {
  it("keeps walking through a single silent rep — that's a breath, not an exit", () => {
    expect(unsungRepAction(1, 8)).toBe("continue");
  });

  it("ends and logs once the silence outlasts the threshold", () => {
    expect(unsungRepAction(2, 8)).toBe("finish");
    expect(unsungRepAction(9, 8)).toBe("finish");
  });

  it("exits without logging when nothing was ever sung", () => {
    expect(unsungRepAction(2, 0)).toBe("exit");
    expect(unsungRepAction(40, 0)).toBe("exit");
  });

  it("never ends a rep the singer actually sang (streak resets to 0)", () => {
    expect(unsungRepAction(0, 0)).toBe("continue");
    expect(unsungRepAction(0, 8)).toBe("continue");
  });

  it("logs the sung reps only, so an abandoned tab can't drag the average down", () => {
    // Eight reps at 85%, then the singer puts the phone down. The endless
    // walk would otherwise pour ~48 score-0 reps into the same average.
    const recorded = Array.from({ length: 8 }, () => sungRep(85));
    let streak = 0;
    let action = unsungRepAction(streak, recorded.length);
    let silentReps = 0;
    while (action === "continue" && silentReps < 48) {
      silentReps += 1;
      streak += 1;
      action = unsungRepAction(streak, recorded.length);
      // The walk records nothing for an unsung rep.
    }
    expect(action).toBe("finish");
    expect(silentReps).toBe(2);
    expect(recorded).toHaveLength(8);
    expect(repAvgScore(recorded)).toBe(85);
  });

  it("would have logged 12% if silent reps were scored — the bug this guards", () => {
    const withZeros = [
      ...Array.from({ length: 8 }, () => sungRep(85)),
      ...Array.from({ length: 48 }, () => sungRep(0)),
    ];
    expect(repAvgScore(withZeros)).toBe(12);
  });
});

describe("practicedDurationSec", () => {
  it("measures mount → the last scored rep, not mount → now", () => {
    const start = 1_000;
    // Sang for 95 s, then left the tab open for two hours.
    expect(practicedDurationSec(start, start + 95_000)).toBe(95);
  });

  it("ignores idle time entirely — the same session, ended much later", () => {
    const start = 1_000;
    const lastScored = start + 95_000;
    const wallClockNow = start + 2 * 60 * 60 * 1000;
    expect(practicedDurationSec(start, lastScored)).toBe(95);
    expect(practicedDurationSec(start, wallClockNow)).not.toBe(95);
  });

  it("stays under the coach's heavy-day trip wire when nothing was sung", () => {
    // coach.tsx treats >= 25 min as a heavy day; an idle tab must not qualify.
    const start = 0;
    expect(practicedDurationSec(start, null)).toBeLessThan(25 * 60);
  });

  it("floors at one second, never zero or negative", () => {
    expect(practicedDurationSec(1_000, null)).toBe(1);
    expect(practicedDurationSec(1_000, 1_000)).toBe(1);
    expect(practicedDurationSec(1_000, 1_400)).toBe(1);
    expect(practicedDurationSec(1_000, 500)).toBe(1);
  });

  it("rounds to the nearest second", () => {
    expect(practicedDurationSec(0, 12_400)).toBe(12);
    expect(practicedDurationSec(0, 12_600)).toBe(13);
  });
});

describe("ladderHeightPct", () => {
  it("puts the bottom rung at 0 and the top rung at 100", () => {
    const roots = computeRootLadder(fiveNote, 48, 72); // nine rungs
    expect(roots).toHaveLength(9);
    expect(ladderHeightPct(0, roots.length)).toBe(0);
    expect(ladderHeightPct(8, roots.length)).toBe(100);
    expect(ladderHeightPct(4, roots.length)).toBe(50);
  });

  it("reports 0, not a permanently complete 100, on a one-rung ladder", () => {
    // A real case: a narrow saved range collapses the ladder to a single root.
    const roots = computeRootLadder(fiveNote, 48, 55);
    expect(roots).toEqual([52]);
    expect(ladderHeightPct(0, roots.length)).toBe(0);
    expect(ladderHeightPct(0, 0)).toBe(0);
  });

  it("tracks the walk up and back down without ever reading complete mid-climb", () => {
    const ladder = [48, 49, 50, 51];
    // Rounded the way ProgressBar's aria-valuenow reports it.
    const heights = Array.from({ length: 7 }, (_, rep) =>
      Math.round(ladderHeightPct(ladderWalk(ladder, rep).index, ladder.length)),
    );
    expect(heights).toEqual([0, 33, 67, 100, 67, 33, 0]);
  });
});

describe("repAscending", () => {
  const ladder = [48, 49, 50, 51];

  it("labels the direction that produced the rep being sung now", () => {
    const dirs = Array.from({ length: 8 }, (_, rep) => repAscending(ladder, rep));
    // Reps 0-3 were all reached by climbing — rep 3 is the top note, arrived
    // at from below. Reps 4-6 were reached by descending, rep 6 being the
    // bottom note. Rep 7 climbs again.
    expect(dirs).toEqual([true, true, true, true, false, false, false, true]);
  });

  it("differs from LadderStep.ascending by one rep, at both turns", () => {
    // ladderWalk's flag says where the walk heads *next*, which is why the
    // pill used to read "Descending" on a top note nobody had descended from.
    expect(ladderWalk(ladder, 3).ascending).toBe(false);
    expect(repAscending(ladder, 3)).toBe(true);
    expect(ladderWalk(ladder, 6).ascending).toBe(true);
    expect(repAscending(ladder, 6)).toBe(false);
  });

  it("starts the first rep climbing", () => {
    expect(repAscending(ladder, 0)).toBe(true);
    expect(repAscending([52], 0)).toBe(true);
  });

  it("keeps a one-rung ladder on its starting label, never flipping", () => {
    for (let rep = 0; rep < 6; rep++) {
      expect(repAscending([52], rep)).toBe(true);
    }
  });

  it("stays consistent with the rung it is labelling, cycle after cycle", () => {
    const period = 2 * ladder.length - 2;
    for (let rep = 1; rep < period * 4; rep++) {
      const prev = ladderWalk(ladder, rep - 1).index;
      const current = ladderWalk(ladder, rep).index;
      expect(repAscending(ladder, rep)).toBe(current > prev);
    }
  });
});
