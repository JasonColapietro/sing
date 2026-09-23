import { describe, expect, it } from "vitest";
import { median } from "./median";

describe("median", () => {
  it("takes the middle value of an odd count", () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it("averages the two middle values of an even count", () => {
    // The upper-middle shortcut returned 3 here: sharp, every time.
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it("does not lean toward either side of a symmetric swing", () => {
    // Four readings around 220 Hz, as usePitch sees mid-vibrato.
    expect(median([214, 226, 218, 222])).toBe(220);
  });

  it("returns NaN for no values and leaves its input alone", () => {
    expect(median([])).toBeNaN();
    const values = [3, 1, 2];
    median(values);
    expect(values).toEqual([3, 1, 2]);
  });
});
