import { describe, expect, it } from "vitest";
import { SINGERS } from "@/lib/singers";
import { catalogPositionFor } from "./singer-catalog-position";

describe("catalogPositionFor", () => {
  it("is data-backed and gives every singer page its own text", () => {
    const texts = SINGERS.map((s) =>
      catalogPositionFor(s).map((f) => f.text).join("|"),
    );
    // Singers with identical figures can legitimately match; the point is that
    // the section is not one string repeated across the catalog.
    expect(new Set(texts).size).toBeGreaterThan(SINGERS.length * 0.9);
  });

  it("ranks the widest singer first", () => {
    const widest = [...SINGERS].sort(
      (a, b) => b.highMidi - b.lowMidi - (a.highMidi - a.lowMidi),
    )[0];
    const rank = catalogPositionFor(widest).find((f) => f.id === "library-rank");
    expect(rank?.text).toContain(`number 1 of ${SINGERS.length}`);
  });
});
