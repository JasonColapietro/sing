import { describe, expect, it } from "vitest";
import {
  HUB_GENRES,
  HUB_GENRE_MINIMUM,
  PUBLISHED_GENRE_HUBS,
  SINGERS,
  genreSlug,
  hubGenresFor,
  singerBySlug,
  singersByGenre,
  wikipediaUrl,
} from "@/lib/singers";

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

/**
 * A published hub keeps its URL whatever happens to its singer count, so the
 * profiles, neighbour hubs, sitemap and llms.txt that link it never 404.
 */
describe("hubGenresFor", () => {
  /** SINGERS with `genre` stripped from all but `keep` of its singers. */
  function shrink(genre: string, keep: number) {
    let seen = 0;
    return SINGERS.map((s) =>
      s.genres.includes(genre) && ++seen > keep
        ? { genres: s.genres.filter((g) => g !== genre) }
        : { genres: s.genres },
    );
  }

  it("is exactly the published hubs today", () => {
    expect(HUB_GENRES.map(genreSlug).sort()).toEqual([...PUBLISHED_GENRE_HUBS].sort());
  });

  it.each(["J-Pop", "Reggae", "Afrobeats", "Punk"])(
    "keeps the published %s hub when it drops to one singer",
    (genre) => {
      expect(PUBLISHED_GENRE_HUBS.has(genreSlug(genre))).toBe(true);
      expect(hubGenresFor(shrink(genre, HUB_GENRE_MINIMUM - 1))).toContain(genre);
      expect(hubGenresFor(shrink(genre, 1))).toContain(genre);
    },
  );

  it("drops a published hub only when no singer is left to chart", () => {
    expect(hubGenresFor(shrink("J-Pop", 0))).not.toContain("J-Pop");
  });

  it("still gives a hub to a new genre that reaches the floor, and not before", () => {
    const fresh = (n: number) => [
      ...SINGERS.map((s) => ({ genres: s.genres })),
      ...Array.from({ length: n }, () => ({ genres: ["Zouk"] })),
    ];
    expect(PUBLISHED_GENRE_HUBS.has("zouk")).toBe(false);
    expect(hubGenresFor(fresh(HUB_GENRE_MINIMUM - 1))).not.toContain("Zouk");
    expect(hubGenresFor(fresh(HUB_GENRE_MINIMUM))).toContain("Zouk");
  });

  it("charts at least one singer on every hub", () => {
    for (const g of HUB_GENRES) expect(singersByGenre(g).length, g).toBeGreaterThan(0);
  });
});
