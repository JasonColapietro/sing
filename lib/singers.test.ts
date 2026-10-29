import { describe, expect, it } from "vitest";
import {
  HUB_GENRES,
  HUB_GENRE_MINIMUM,
  PUBLISHED_GENRE_HUBS,
  SINGERS,
  genreSlug,
  hubGenresFor,
  relatedSingers,
  singerBySlug,
  singersByGenre,
  type Singer,
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

/**
 * The "Voices with a similar catalog range" cards. Ranked by range center
 * alone, Akon's C3–A#4 listed CeeLo Green's A#1–C6, and 828 of the catalog's
 * 3,816 cards were an octave or more off in span: the cards must sit near
 * both of the page singer's endpoints.
 */
describe("relatedSingers", () => {
  const span = (s: { lowMidi: number; highMidi: number }) => s.highMidi - s.lowMidi;

  it("lists voices near both of Akon's endpoints, not a wider voice with the same center", () => {
    const akon = singerBySlug("akon")!;
    const related = relatedSingers(akon);
    expect(related).toHaveLength(6);
    for (const o of related) {
      expect(Math.abs(o.lowMidi - akon.lowMidi)).toBeLessThanOrEqual(3);
      expect(Math.abs(o.highMidi - akon.highMidi)).toBeLessThanOrEqual(3);
    }
    expect(related.map((o) => o.slug)).not.toContain("ceelo-green");
  });

  it("rarely lists a voice whose span is an octave wider or narrower, across the catalog", () => {
    let cards = 0;
    let octaveOff = 0;
    for (const s of SINGERS) {
      for (const o of relatedSingers(s)) {
        cards++;
        if (Math.abs(span(o) - span(s)) >= 12) octaveOff++;
      }
    }
    expect(octaveOff / cards).toBeLessThan(0.01);
  });

  it("never skips a closer range for a matching label, on any singer page", () => {
    // The whole catalog: no singer left off a page's cards sits nearer both
    // endpoints than a card that is shown.
    const distance = (s: Singer, o: Singer) =>
      Math.abs(o.lowMidi - s.lowMidi) + Math.abs(o.highMidi - s.highMidi);
    for (const s of SINGERS) {
      const shown = relatedSingers(s);
      const farthest = Math.max(...shown.map((o) => distance(s, o)));
      const closer = SINGERS.filter(
        (o) => o.slug !== s.slug && !shown.includes(o) && distance(s, o) < farthest,
      );
      expect(closer.map((o) => o.slug), s.slug).toEqual([]);
    }
  });

  it("lists an identical range whatever its catalog label", () => {
    const normani = singerBySlug("normani")!;
    const wendy = singerBySlug("wendy")!;
    expect([wendy.lowMidi, wendy.highMidi]).toEqual([normani.lowMidi, normani.highMidi]);
    expect(relatedSingers(normani).map((o) => o.slug)).toContain("wendy");
    const ramey = relatedSingers(singerBySlug("samuel-ramey")!).map((o) => o.slug);
    expect(ramey).not.toContain("tim-storms");
    expect(ramey).toContain("bing-crosby");
  });
});
