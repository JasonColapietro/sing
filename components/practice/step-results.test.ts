import { describe, expect, it } from "vitest";
import { denseStepResults, withStepResult } from "./step-results";

describe("a run's per-step results", () => {
  it("stays dense when a run opens part-way and closes several steps", () => {
    // A six-step routine resumed at step 4 (index 3): the old copy-and-assign
    // left holes at 0–2, and the next spread turned them into undefined.
    let results: (string | null)[] = [];
    results = withStepResult(results, 3, "four", 6);
    results = withStepResult(results, 4, "five", 6);
    results = withStepResult(results, 5, null, 6);
    expect(results).toEqual([null, null, null, "four", "five", null]);
    expect(results).toHaveLength(6);
    expect(results.some((r) => r === undefined)).toBe(false);
    // What the summaries do with it: every kept entry is a real result.
    expect(results.filter((r) => r !== null)).toEqual(["four", "five"]);
  });

  it("keeps earlier steps and replaces only the one that closed", () => {
    const results = withStepResult(["a", null, "c"], 1, "b", 3);
    expect(results).toEqual(["a", "b", "c"]);
  });

  it("fills a quit's holes with null", () => {
    const sparse: (string | null | undefined)[] = [, , "three"];
    expect(denseStepResults(sparse, 4)).toEqual([null, null, "three", null]);
    expect(denseStepResults([undefined, "two"], 2)).toEqual([null, "two"]);
  });
});
