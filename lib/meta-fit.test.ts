import { describe, expect, it } from "vitest";
import { MAX_TITLE_BODY, firstFit } from "@/lib/meta-fit";

describe("firstFit", () => {
  it("keeps the most specific candidate that fits whole", () => {
    expect(
      firstFit(["Drift Correction · In Tune, All the Way Voice Lesson", "Drift Correction · Voice Lesson", "Drift Correction"]),
    ).toBe("Drift Correction · Voice Lesson");
  });

  it("returns the first candidate when it already fits", () => {
    expect(firstFit(["Hold It · Stage 2 Voice Lessons", "Hold It"])).toBe("Hold It · Stage 2 Voice Lessons");
  });

  it("fits the last candidate by words when none fits whole", () => {
    const out = firstFit(["x".repeat(80), "A very long lesson title that keeps going well past the budget"]);
    expect(out.length).toBeLessThanOrEqual(MAX_TITLE_BODY);
    expect(out).toBe("A very long lesson title that keeps going well");
  });

  it("honours an explicit budget", () => {
    expect(firstFit(["Twelve chars", "Six"], 6)).toBe("Six");
  });
});
