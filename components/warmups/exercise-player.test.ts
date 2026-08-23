import { describe, expect, it } from "vitest";
import {
  isScorableFrame,
  ladderHeightPct,
  practicedDurationSec,
  repAscending,
  unsungRepAction,
} from "./exercise-player";
import { MAX_FRAME_MS, STALE_FRAME_MS, frameDelta } from "@/lib/audio/frame-clock";
import { EXERCISES, computeRootLadder, ladderWalk } from "./exercises";
import { bestRep, repAvgScore, sungReps, type RepResult } from "./lib";

const fiveNote = EXERCISES.find((e) => e.id === "five-note-scale")!;

const sungRep = (score: number, root = 52): RepResult => ({
  root,
  score,
  avgCentsErr: 18,
  skipped: false,
});

/** A skipped rung carries score 0 by convention — it was never sung. */
const skippedRep = (root = 52): RepResult => ({
  root,
  score: 0,
  avgCentsErr: 0,
  skipped: true,
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

describe("skipped reps are abstentions, not zeros", () => {
  it("keeps a skip out of the average instead of scoring it 0", () => {
    const results = [sungRep(90), skippedRep(), sungRep(80)];
    expect(repAvgScore(results)).toBe(85);
  });

  it("pins the old behavior it replaces, so the regression cannot return", () => {
    // Averaging every result, skips included, is what turned two good reps
    // into a 57% session: (90 + 0 + 80) / 3.
    const results = [sungRep(90), skippedRep(), sungRep(80)];
    const naive = Math.round(
      results.reduce((a, r) => a + r.score, 0) / results.length,
    );
    expect(naive).toBe(57);
    expect(repAvgScore(results)).not.toBe(naive);
  });

  it("does not let a heavily skipped ladder drag a steady voice down", () => {
    // The endless ladder spans the whole range, so stepping over rungs that
    // sit too high or too low is ordinary use.
    const results = [
      sungRep(88),
      ...Array.from({ length: 9 }, () => skippedRep()),
      sungRep(92),
    ];
    expect(repAvgScore(results)).toBe(90);
  });

  it("reports 0 only when nothing was sung at all", () => {
    expect(repAvgScore([skippedRep(), skippedRep()])).toBe(0);
    expect(repAvgScore([])).toBe(0);
  });

  it("never calls a skipped rung the best rep", () => {
    // Every sung rep scored under the skip's conventional 0.
    const results = [skippedRep(60), sungRep(0, 52), sungRep(0, 53)];
    const best = bestRep(results);
    expect(best?.skipped).toBe(false);
    expect(best?.root).toBe(52);
  });

  it("has no best rep when every rung was skipped", () => {
    expect(bestRep([skippedRep(), skippedRep()])).toBeNull();
  });

  it("keeps skips in the results so the summary can still list them", () => {
    const results = [sungRep(90), skippedRep(), sungRep(80)];
    expect(results).toHaveLength(3);
    expect(sungReps(results)).toHaveLength(2);
  });
});

describe("a session of nothing but skips is not a session", () => {
  it("leaves without logging, the way an all-silent session does", () => {
    // endExercise routes on the sung count, so an all-skipped ladder exits
    // rather than writing a 0% warmup for singing that never happened.
    const allSkipped = [skippedRep(), skippedRep(), skippedRep()];
    expect(sungReps(allSkipped)).toHaveLength(0);
    expect(unsungRepAction(2, sungReps(allSkipped).length)).toBe("exit");
  });

  it("still finishes a session that mixed skips with real singing", () => {
    const mixed = [skippedRep(), sungRep(84), skippedRep()];
    expect(unsungRepAction(2, sungReps(mixed).length)).toBe("finish");
    expect(repAvgScore(mixed)).toBe(84);
  });
});

describe("a hidden tab cannot score the rep it was away for", () => {
  // rAF stops while a tab is hidden; performance.now() does not. usePitch
  // publishes through a ref it only clears on stop, so the frame from before
  // the tab hid sits there looking current. See lib/audio/frame-clock.
  const now = 10_000;
  const singing = { freq: 220, volume: 0.05, t: now - 16 };

  it("scores a fresh, voiced, loud-enough frame", () => {
    expect(isScorableFrame(singing, now)).toBe(true);
  });

  it("refuses the frame left behind by a hidden tab", () => {
    const stale = { ...singing, t: now - 5_000 };
    expect(isScorableFrame(stale, now)).toBe(false);
  });

  it("draws the line at the shared staleness threshold", () => {
    expect(isScorableFrame({ ...singing, t: now - (STALE_FRAME_MS - 1) }, now)).toBe(true);
    expect(isScorableFrame({ ...singing, t: now - STALE_FRAME_MS }, now)).toBe(false);
  });

  it("refuses a frame with no timestamp at all", () => {
    // EMPTY_FRAME carries t: 0 — the state before the first analysis lands.
    expect(isScorableFrame({ ...singing, t: 0 }, now)).toBe(false);
  });

  it("still refuses silence and unvoiced frames", () => {
    expect(isScorableFrame({ ...singing, freq: null }, now)).toBe(false);
    expect(isScorableFrame({ ...singing, volume: 0.0001 }, now)).toBe(false);
  });

  it("keeps an unsung rep unsung, which is what the guard depends on", () => {
    // The singer tabs away mid-rep. Every frame the loop sees on return is the
    // stale one, so no frame is scorable, the rep records nothing, and the
    // walk ends itself rather than logging reps nobody sang.
    const stale = { ...singing, t: now - 30_000 };
    const scoredFrames = [stale, stale, stale].filter((f) => isScorableFrame(f, now));
    expect(scoredFrames).toHaveLength(0);
    expect(unsungRepAction(2, 0)).toBe("exit");
  });

  it("caps the returning frame's delta instead of banking the whole absence", () => {
    // Ten seconds away must not become ten seconds of credited hold time.
    expect(frameDelta(now, now - 10_000)).toBe(MAX_FRAME_MS);
    expect(frameDelta(now, now - 16)).toBe(16);
    // A clock that goes backwards contributes nothing rather than negative time.
    expect(frameDelta(now, now + 500)).toBe(0);
  });
});
