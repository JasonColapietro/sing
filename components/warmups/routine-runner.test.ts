import { describe, expect, it } from "vitest";
import { introClockLabel, remainingSeconds } from "./routine-runner";
import { routineById } from "./routines";

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
