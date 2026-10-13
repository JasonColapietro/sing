import { describe, expect, it } from "vitest";
import { introClockLabel, outOfRangeNote, remainingSeconds } from "./routine-runner";
import { ALL_EXERCISES } from "./exercises";
import { SKIP_INTRO_SEC, STEP_INTRO_SEC, routineById, stepSeconds } from "./routines";

describe("the clock on a routine's step intro", () => {
  const quick = routineById("quick")!;

  it("counts the routine when the free minutes outlast it, and on Pro", () => {
    const left = remainingSeconds(quick, 0);
    expect(introClockLabel(left, null)).toBe(`~${Math.round(left / 60)} min left`);
    expect(introClockLabel(left, left + 30)).toBe(`~${Math.round(left / 60)} min left`);
  });

  it("counts the free minutes when they run out first, so it never promises minutes the cap takes", () => {
    // 3:00 left against a ~6-minute set: the set stops after the step that uses them up.
    expect(introClockLabel(remainingSeconds(quick, 0), 180)).toBe("3:00 free left today");
    expect(introClockLabel(remainingSeconds(quick, 0), 57)).toBe("0:57 free left today");
  });
});

describe("the step intro's note for a step the saved range cannot hold", () => {
  const nRun = ALL_EXERCISES.find((e) => e.id === "n-hum-scale")!;

  it("says why the routine moves past a twelfth run in a narrow range", () => {
    // The run peaks in its middle and comes back to its root: every rep
    // reaches the measured top, it does not end there.
    expect(outOfRangeNote(nRun, { lowMidi: 45, highMidi: 62 })).toBe(
      "N run spans 19 semitones and your saved range spans 17, so every rep would reach the highest note your range test found and start below the lowest. This routine skips it for your range.",
    );
    // A range exactly as wide as the run puts the root on the measured low.
    expect(outOfRangeNote(nRun, { lowMidi: 45, highMidi: 64 })).toBe(
      "N run spans 19 semitones and your saved range spans 19, so every rep would reach the highest note your range test found and start on the lowest. This routine skips it for your range.",
    );
    expect(outOfRangeNote(nRun, { lowMidi: 45, highMidi: 62 })).not.toMatch(/end on/);
  });

  it("leaves a skipped step's minutes off the intro clock", () => {
    // Quick's third step is the N run. In A2–D4 it is never sung, so the clock
    // counts only the slide that says so, not its ~2½ minutes of reps.
    const quick = routineById("quick")!;
    const nRunStep = quick.steps[2];
    expect(nRunStep.exerciseId).toBe("n-hum-scale");
    const narrow = { lowMidi: 45, highMidi: 62 };
    expect(remainingSeconds(quick, 0, narrow)).toBeCloseTo(
      remainingSeconds(quick, 0) - stepSeconds(nRunStep) - STEP_INTRO_SEC + SKIP_INTRO_SEC,
    );
    // A range that holds the run, or none saved, counts it as before.
    expect(remainingSeconds(quick, 0, { lowMidi: 45, highMidi: 69 })).toBe(remainingSeconds(quick, 0));
    expect(remainingSeconds(quick, 0, {})).toBe(remainingSeconds(quick, 0));
    expect(SKIP_INTRO_SEC).toBeGreaterThan(STEP_INTRO_SEC);
  });

  it("is null when the range holds the step, or no range is saved", () => {
    expect(outOfRangeNote(nRun, { lowMidi: 45, highMidi: 65 })).toBeNull();
    expect(outOfRangeNote(nRun, {})).toBeNull();
  });
});
