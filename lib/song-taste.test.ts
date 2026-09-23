import { describe, expect, it, vi } from "vitest";

// PRO_SONGS is empty today, so stand one in: the ranking's free-singer guard
// must hold even when a caller hands it a catalog that includes a Pro song.
vi.mock("@/components/songs/data", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/components/songs/data")>();
  return { ...real, isProSong: (id: string) => id === "home-on-the-range" };
});
import { SONGS } from "@/components/songs/data";
import { bandForSong, bandOpen, BAND_ORDER } from "@/components/songs/lib";
import type { Song } from "@/components/songs/types";
import {
  pickForTaste,
  reviveTaste,
  tasteGenreOptions,
  type TasteAnswers,
  type TasteContext,
} from "./song-taste";

const answers = (over: Partial<TasteAnswers> = {}): TasteAnswers => ({
  kind: "answered",
  genres: [],
  level: "new",
  goal: "either",
  at: "2026-09-23T00:00:00.000Z",
  ...over,
});

const ctx = (over: Partial<TasteContext> = {}): TasteContext => ({
  songs: SONGS,
  pro: false,
  masteredIds: new Set(),
  range: {},
  ...over,
});

/** Two mastered songs from each band below `band`, so everything up to it is open. */
function openThrough(band: (typeof BAND_ORDER)[number]): Set<string> {
  const ids = new Set<string>();
  for (const b of BAND_ORDER.slice(0, BAND_ORDER.indexOf(band))) {
    for (const s of SONGS.filter((x) => bandForSong(x) === b).slice(0, 2)) ids.add(s.id);
  }
  return ids;
}

const ids = (picks: { song: Song }[]) => picks.map((p) => p.song.id);

describe("reviveTaste", () => {
  it("degrades anything it cannot vouch for to a first visit", () => {
    for (const raw of [null, 3, "x", [], {}, { kind: "answered" },
      { kind: "answered", level: "guru", goal: "either", genres: [] },
      { kind: "answered", level: "new", goal: "medley", genres: [] }]) {
      expect(reviveTaste(raw)).toBeNull();
    }
  });

  it("keeps a skip, so the quiz does not re-open on every visit", () => {
    expect(reviveTaste({ kind: "skipped", at: "t" })).toEqual({ kind: "skipped", at: "t" });
  });

  it("drops unknown and duplicate genres but keeps the rest of the answer", () => {
    expect(reviveTaste({ kind: "answered", level: "some", goal: "full", at: "t",
      genres: ["Folk", "Folk", "K-Pop", 7, "Hymn"] })).toEqual(
      { kind: "answered", level: "some", goal: "full", at: "t", genres: ["Folk", "Hymn"] });
  });
});

describe("tasteGenreOptions", () => {
  it("offers only genres the catalog holds, most-stocked first", () => {
    const options = tasteGenreOptions(SONGS);
    expect(options[0]).toBe("Folk");
    expect(new Set(options)).toEqual(new Set(SONGS.map((s) => s.genre)));
    // In the type, but no song carries them yet: a chip would lead nowhere.
    expect(options).not.toContain("Blues");
    expect(options).not.toContain("Musical");
  });
});

describe("pickForTaste", () => {
  it("never recommends a song in a locked band", () => {
    for (const level of ["new", "some", "experienced"] as const) {
      const picks = pickForTaste(answers({ level, genres: ["Spiritual", "Hymn"] }), ctx(), 10);
      expect(picks.length).toBeGreaterThan(0);
      for (const { song } of picks) expect(bandOpen(bandForSong(song), new Set(), SONGS)).toBe(true);
    }
  });

  it("flags when nothing in the chosen genres is open yet, rather than pretending", () => {
    const picks = pickForTaste(answers({ genres: ["Nursery"] }), ctx());
    expect(picks.every((p) => !p.genreMatch)).toBe(true);
  });

  it("boosts the chosen genre among open songs", () => {
    expect(pickForTaste(answers({ genres: ["Christmas"] }), ctx())[0]).toEqual({
      song: SONGS.find((s) => s.id === "silent-night"), genreMatch: true,
    });
    expect(ids(pickForTaste(answers({ genres: ["Classical"] }), ctx())).at(0)).toBe("ode-to-joy");
  });

  it("points beginners at easier bands and experienced singers higher", () => {
    const masteredIds = openThrough("peak");
    // Pro, so the mocked Pro song counts: Folk then has exactly two songs at or
    // below "easy", and a genre match outranks band distance past those two.
    const open = ctx({ masteredIds, pro: true });
    const band = (id: string) => BAND_ORDER.indexOf(bandForSong(SONGS.find((s) => s.id === id)!));
    const beginner = ids(pickForTaste(answers({ level: "new", genres: ["Folk"] }), open, 2));
    const experienced = ids(pickForTaste(answers({ level: "experienced", genres: ["Folk"] }), open, 2));
    expect(Math.max(...beginner.map(band))).toBeLessThanOrEqual(BAND_ORDER.indexOf("easy"));
    expect(Math.min(...experienced.map(band))).toBeGreaterThanOrEqual(BAND_ORDER.indexOf("steady"));
  });

  it("lets a genre match outweigh band distance, so the answer the singer gave is honoured", () => {
    const open = ctx({ masteredIds: openThrough("peak") });
    // Every Spiritual sits at "steady" or above; a beginner who asked for them
    // should still see them ahead of off-genre first songs.
    const picks = pickForTaste(answers({ level: "new", genres: ["Spiritual"] }), open);
    expect(picks.every((p) => p.genreMatch)).toBe(true);
  });

  it("prefers the goal's form as a tie-breaker", () => {
    const open = ctx({ masteredIds: openThrough("peak") });
    const full = pickForTaste(answers({ level: "some", genres: ["Hymn"], goal: "full" }), open);
    const phrase = pickForTaste(answers({ level: "some", genres: ["Hymn"], goal: "phrase" }), open);
    expect(full[0].song.form).toBe("full");
    expect(phrase[0].song.form).toBe("phrase");
  });

  it("never lets taste override range fit", () => {
    // A four-semitone voice: Yankee Doodle spans five, so no key fits it, while
    // Frère Jacques (four) and Silent Night (three) both place inside it.
    const picks = pickForTaste(
      answers({ level: "some", genres: ["Patriotic"] }),
      ctx({ masteredIds: openThrough("easy"), range: { lowMidi: 60, highMidi: 64 } }),
      10,
    );
    const order = ids(picks);
    expect(order).toContain("yankee-doodle");
    const firstMisfit = order.indexOf("yankee-doodle");
    expect(order.indexOf("frere-jacques")).toBeLessThan(firstMisfit);
    expect(order.indexOf("silent-night")).toBeLessThan(firstMisfit);
  });

  it("never hands a free singer a Pro song, even when the caller passes one", () => {
    const free = ids(pickForTaste(answers({ genres: ["Folk"] }), ctx({ pro: false }), 50));
    const pro = ids(pickForTaste(answers({ genres: ["Folk"] }), ctx({ pro: true }), 50));
    expect(free).not.toContain("home-on-the-range");
    expect(pro[0]).toBe("home-on-the-range");
  });

  it("is stable and respects the limit", () => {
    const a = pickForTaste(answers({ genres: ["Folk"] }), ctx(), 2);
    const b = pickForTaste(answers({ genres: ["Folk"] }), ctx(), 2);
    expect(a).toHaveLength(2);
    expect(ids(a)).toEqual(ids(b));
    expect(pickForTaste(answers(), ctx(), 0)).toEqual([]);
  });
});
