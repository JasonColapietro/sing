import { describe, expect, it } from "vitest";
import { singerBySlug, wikipediaUrl } from "@/lib/singers";

/**
 * sameAs is an identity assertion. These five display names are, as bare
 * Wikipedia titles, ordinary articles on a royal title, a colour, a spirit, a
 * letter and a wine, so each needs its person article named outright.
 */
describe("wikipediaUrl", () => {
  it.each([
    ["prince", "https://en.wikipedia.org/wiki/Prince_(musician)"],
    ["pink", "https://en.wikipedia.org/wiki/Pink_(singer)"],
    ["brandy", "https://en.wikipedia.org/wiki/Brandy_Norwood"],
    ["v", "https://en.wikipedia.org/wiki/V_(singer)"],
    ["rose", `https://en.wikipedia.org/wiki/${encodeURIComponent("Rosé_(singer)")}`],
  ])("%s points at the singer's article, not the bare-name article", (slug, url) => {
    const singer = singerBySlug(slug);
    expect(singer).toBeDefined();
    expect(wikipediaUrl(singer!)).toBe(url);
    expect(wikipediaUrl(singer!)).not.toBe(
      `https://en.wikipedia.org/wiki/${encodeURIComponent(singer!.name.replace(/ /g, "_"))}`,
    );
  });

  it("still derives the title from the name when no override applies", () => {
    const madonna = singerBySlug("madonna");
    expect(madonna).toBeDefined();
    expect(wikipediaUrl(madonna!)).toBe("https://en.wikipedia.org/wiki/Madonna");
  });
});
