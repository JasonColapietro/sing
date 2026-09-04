import { describe, expect, it } from "vitest";
import { SONGS } from "@/components/songs/data";
import { fitTransposeToRange, rangeFit } from "@/components/songs/lib";
import { computeRootLadder, EXERCISES } from "@/components/warmups/exercises";
import { POP_SONGS, popFit } from "./pop-songs";
import { songFirstPractice } from "./song-first-practice";

const song = POP_SONGS.find((s) => s.slug === "espresso")!;

describe("saved-range recommendation boundaries", () => {
  it.each(["drop-dead", "unchained-melody"])(
    "gives the new %s result a safe first-practice destination for every fit outcome",
    (slug) => {
      const popular = POP_SONGS.find((candidate) => candidate.slug === slug)!;
      expect(popular).toBeDefined();

      const cases = [
        ["fits", { lowMidi: popular.lowMidi - 2, highMidi: popular.highMidi + 2 }],
        ["high", { lowMidi: popular.lowMidi - 3, highMidi: popular.highMidi - 1 }],
        ["low", { lowMidi: popular.lowMidi + 1, highMidi: popular.highMidi + 3 }],
        ["wide", { lowMidi: popular.lowMidi, highMidi: popular.highMidi - 1 }],
      ] as const;

      for (const [verdict, range] of cases) {
        const fit = popFit(popular, range);
        expect(fit.verdict).toBe(verdict);
        const next = songFirstPractice(fit, range);
        expect(next?.free.href).toMatch(/^\/(songs|warmups|studio)/);
        expect(next?.free.label.length).toBeGreaterThan(0);
        expect(next?.free.reason.length).toBeGreaterThan(40);
      }
    },
  );

  it("requires a complete, finite, ordered MIDI range", () => {
    for (const range of [{}, { lowMidi: 48 }, { highMidi: 72 },
      { lowMidi: NaN, highMidi: 72 }, { lowMidi: 48, highMidi: Infinity },
      { lowMidi: 72, highMidi: 48 }, { lowMidi: -1, highMidi: 72 },
      { lowMidi: 48, highMidi: 128 }, { lowMidi: 48.5, highMidi: 72 }]) {
      const fit = popFit(song, range);
      expect(fit.verdict).toBe("unknown");
      expect(songFirstPractice(fit, range)).toBeNull();
    }
  });

  it("keeps exact-bound fits and one-semitone key changes distinct from an unfixably wide span", () => {
    expect(popFit(song, { lowMidi: 55, highMidi: 69 }).verdict).toBe("fits");
    expect(popFit(song, { lowMidi: 54, highMidi: 68 })).toEqual({ verdict: "high", offsetSemis: 1 });
    expect(popFit(song, { lowMidi: 56, highMidi: 70 })).toEqual({ verdict: "low", offsetSemis: 1 });
    // Too wide takes precedence even when only one end exceeds the range.
    for (const range of [{ lowMidi: 55, highMidi: 68 }, { lowMidi: 56, highMidi: 69 }]) {
      expect(popFit(song, range).verdict).toBe("wide");
    }
  });

  it.each([
    ["high", 48, 64, "ng-siren-fifth"],
    ["high", 48, 63, "morning-lip-trill"],
    ["low", 58, 74, "descending-five"],
    ["low", 58, 73, "morning-sigh"],
    ["wide", 60, 73, "humming-thirds"],
    ["wide", 60, 72, "morning-hum"],
  ] as const)("keeps %s within the actual ladder headroom at %i–%i", (verdict, lowMidi, highMidi, id) => {
    const range = { lowMidi, highMidi };
    const fit = popFit(song, range);
    expect(fit.verdict).toBe(verdict);
    expect(songFirstPractice(fit, range)?.free.href).toBe(`/warmups?exercise=${id}`);
  });

  it("only links playable free songs or free ladders inside the saved range across the catalog", () => {
    for (const popular of POP_SONGS) {
      for (let lowMidi = 36; lowMidi <= 76; lowMidi += 4) {
        for (let span = 0; span <= 36; span++) {
          const range = { lowMidi, highMidi: lowMidi + span };
          const next = songFirstPractice(popFit(popular, range), range)!;
          const url = new URL(next.free.href, "https://example.test");
          if (url.pathname === "/songs") {
            const target = SONGS.find((s) => s.slug === url.searchParams.get("song"));
            expect(target).toBeDefined();
            expect(rangeFit(target!, range, fitTransposeToRange(target!, range)!).verdict).toBe("fits");
          } else if (url.pathname === "/warmups") {
            const target = EXERCISES.find((ex) => ex.id === url.searchParams.get("exercise"));
            expect(target).toBeDefined();
            const notes = computeRootLadder(target!, lowMidi, range.highMidi)
              .flatMap((root) => target!.buildSteps(root).flat());
            expect(Math.min(...notes)).toBeGreaterThanOrEqual(lowMidi + 4);
            expect(Math.max(...notes)).toBeLessThanOrEqual(range.highMidi - 5);
          } else {
            expect(url.pathname).toBe("/studio");
          }
        }
      }
    }
  }, 20_000);

  it("uses the studio when the song player's transpose limit cannot reach the saved range", () => {
    const range = { lowMidi: 25, highMidi: 40 };
    const fit = popFit({ ...song, lowMidi: 25, highMidi: 40 }, range);
    expect(songFirstPractice(fit, range)?.free.href).toBe("/studio");
  });
});
