import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { pickForTaste, type TasteAnswers, type TastePick } from "@/lib/song-taste";
import { SONGS } from "./data";
import { computeDifficulty } from "./lib";
import { PickedForYou } from "./taste-quiz";

const answers = (over: Partial<TasteAnswers> = {}): TasteAnswers => ({
  kind: "answered",
  genres: [],
  level: "new",
  goal: "either",
  at: "2026-10-12T00:00:00.000Z",
  ...over,
});

const firstVisit = (a: TasteAnswers) =>
  pickForTaste(a, { songs: SONGS, pro: false, masteredIds: new Set(), range: {} });

const card = (a: TasteAnswers, picks: readonly TastePick[]) =>
  renderToStaticMarkup(
    <PickedForYou answers={a} picks={picks} onStart={() => {}} onChange={() => {}} />,
  );

const NOTE = "The longer arrangements rate hard, so these picks are short phrases";

/**
 * A new singer who answers "Longer arrangements" gets looped phrases, because
 * the longer entries sit in a band that is still shut. The card says so rather
 * than printing "Longer arrangements" in its summary above three phrases.
 */
describe("Picked for you, after asking for longer arrangements", () => {
  it("says why the picks are short phrases", () => {
    const a = answers({ goal: "full" });
    const picks = firstVisit(a);
    expect(picks.length).toBeGreaterThan(0);
    expect(picks.every((p) => p.song.form === "phrase")).toBe(true);
    const html = card(a, picks);
    expect(html).toContain("Longer arrangements");
    expect(html).toContain(`${NOTE} to start on. Master two songs in a band to open the next one.`);
    // The note's reason has to stay true of the data.
    for (const song of SONGS.filter((s) => s.form === "full")) {
      expect(computeDifficulty(song).label, song.slug).toBe("Hard");
    }
  });

  it("states the unlock rule once when the style note already does", () => {
    // Sea Shanty holds only Shenandoah, which a first visit cannot open.
    const a = answers({ goal: "full", genres: ["Sea Shanty"] });
    const html = card(a, firstVisit(a));
    expect(html).toContain("Nothing in those styles is open yet.");
    expect(html).toContain(NOTE);
    expect(html.match(/open the next/g)).toHaveLength(1);
  });

  it("stays quiet when a pick is a longer arrangement, or when none was asked for", () => {
    const longer = SONGS.find((s) => s.form === "full")!;
    expect(card(answers({ goal: "full" }), [{ song: longer, genreMatch: false }])).not.toContain(NOTE);
    const a = answers({ goal: "either" });
    expect(card(a, firstVisit(a))).not.toContain(NOTE);
  });
});
