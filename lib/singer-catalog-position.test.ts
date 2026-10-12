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

  it("reads as finished sentences for every singer", () => {
    for (const s of SINGERS) {
      const text = catalogPositionFor(s).map((f) => f.text).join(" ");
      // "3 semitones wider it." and "catalog basss" both shipped on indexable pages.
      expect(text, s.slug).not.toMatch(/(wider|narrower) it\.|exactly on it\b|basss/);
    }
    const bass = SINGERS.find((s) => s.voiceType === "Bass")!;
    const typeRank = catalogPositionFor(bass).find((f) => f.id === "type-rank")!;
    expect(typeRank.text).toMatch(/catalog bass(es)?;/);
    expect(typeRank.text).toMatch(/(than that median|the same as that median)\.$/);
  });

  it("ranks the widest singer first", () => {
    const widest = [...SINGERS].sort(
      (a, b) => b.highMidi - b.lowMidi - (a.highMidi - a.lowMidi),
    )[0];
    const rank = catalogPositionFor(widest).find((f) => f.id === "library-rank");
    expect(rank?.text).toContain(`number 1 of ${SINGERS.length}`);
  });
});
