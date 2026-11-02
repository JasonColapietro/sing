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

  it("names the singers who share a first place", () => {
    const fact = (slug: string, id: string) =>
      catalogPositionFor(SINGERS.find((s) => s.slug === slug)!).find((f) => f.id === id)!.text;
    expect(fact("mike-patton", "library-rank")).toContain(
      `number 1 of ${SINGERS.length} by reported span, shared with Dimash Kudaibergen.`,
    );
    expect(fact("dimash-kudaibergen", "library-rank")).toContain("shared with Mike Patton");
    const reggae = fact("bob-marley", "genre-rank");
    expect(reggae).toContain("Dennis Brown");
    expect(reggae).toContain("Jimmy Cliff");
  });

  it("never prints a first place without every singer who shares it, across the whole catalog", () => {
    // Every singer, every rank fact: the group a fact ranks in is rebuilt
    // here from the data, and each tie at the top must be named.
    const span = (s: (typeof SINGERS)[number]) => s.highMidi - s.lowMidi;
    let sharedFirsts = 0;
    for (const s of SINGERS) {
      const groups: Array<[string, typeof SINGERS]> = [
        ["library-rank", SINGERS],
        ["type-rank", SINGERS.filter((o) => o.voiceType === s.voiceType)],
      ];
      if (s.genres[0]) groups.push(["genre-rank", SINGERS.filter((o) => o.genres.includes(s.genres[0]))]);
      const facts = catalogPositionFor(s);
      for (const [id, group] of groups) {
        const text = facts.find((f) => f.id === id)?.text;
        if (!text) continue;
        const first = !group.some((o) => span(o) > span(s));
        const tied = group.filter((o) => o.slug !== s.slug && span(o) === span(s));
        if (first && tied.length > 0) {
          sharedFirsts += 1;
          expect(text, `${s.slug} ${id}`).toContain("shared with");
          for (const o of tied) expect(text, `${s.slug} ${id}`).toContain(o.name);
        } else {
          expect(text, `${s.slug} ${id}`).not.toContain("shared with");
        }
      }
    }
    // Mike Patton and Dimash Kudaibergen at least, each naming the other.
    expect(sharedFirsts).toBeGreaterThanOrEqual(2);
  });
});

