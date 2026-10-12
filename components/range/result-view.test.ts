import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ResultView,
  comparisonSingerFromSlug,
  returnSongSlugFromSearch,
  voicePlural,
} from "./result-view";

describe("range result singer return path", () => {
  it("resolves a valid singer from the comparison query", () => {
    expect(comparisonSingerFromSlug("bruno-mars")).toMatchObject({
      slug: "bruno-mars",
      name: "Bruno Mars",
    });
  });

  it("ignores absent and unknown comparison targets", () => {
    expect(comparisonSingerFromSlug(null)).toBeNull();
    expect(comparisonSingerFromSlug("not-a-real-singer")).toBeNull();
  });
});

describe("range result song return path", () => {
  it("reads the song a /can-you-sing page sent", () => {
    expect(returnSongSlugFromSearch("?mode=range&check=espresso")).toBe("espresso");
    expect(returnSongSlugFromSearch("?mode=range&song=creep")).toBe("creep");
  });

  it("ignores absent and malformed slugs", () => {
    expect(returnSongSlugFromSearch("?mode=range")).toBeNull();
    expect(returnSongSlugFromSearch("?check=")).toBeNull();
    expect(returnSongSlugFromSearch("?check=../pro")).toBeNull();
    expect(returnSongSlugFromSearch("?check=Espresso")).toBeNull();
    expect(returnSongSlugFromSearch(`?check=${"a".repeat(81)}`)).toBeNull();
  });
});

describe("voice-type library link", () => {
  it("pluralises every label the classifier can return", () => {
    expect(voicePlural("Bass")).toBe("basses");
    expect(voicePlural("Baritone")).toBe("baritones");
    expect(voicePlural("Mezzo-soprano")).toBe("mezzo-sopranos");
  });
});

describe("range result voice type", () => {
  const render = (lowMidi: number, highMidi: number) =>
    renderToStaticMarkup(
      createElement(ResultView, { lowMidi, highMidi, onRetake: () => {} }),
    );

  it("labels the headline voice type as an estimate", () => {
    // C3–C5: a clear tenor, with no near-equal band on the other side.
    const html = render(48, 72);
    expect(html).toContain("Closest fit, an estimate");
    expect(html).toContain('href="/singers/voice-type/tenor"');
    expect(html).not.toContain(" or <span");
  });

  it("names both bands when range alone cannot split them", () => {
    // F3–C5 fits tenor and contralto equally well.
    const html = render(53, 72);
    expect(html).toContain("Or Contralto, an estimate");
    expect(html).toContain("See the tenors in the library");
    expect(html).toContain("See the contraltos in the library");
    expect(html).toContain("can&#x27;t tell them apart");
    // The tiebreaker is the singer's own voice, named the way the singer
    // library names these categories, and it reads the same whichever band
    // scored first.
    expect(html).toContain(
      "tenor is a male voice category and contralto a female one",
    );
    expect(render(45, 81)).toContain(
      "tenor is a male voice category and contralto a female one",
    );
  });

  it("says every song opens fitted to the new range", () => {
    // The book loads after mount, so the static pass shows the pre-count copy.
    const html = render(48, 72);
    expect(html).toContain("Songs now open fitted to the range you just measured");
    expect(html).toContain("shift any of them by semitones");
  });

  it("spells the bass link and the chart legend correctly", () => {
    const html = render(40, 64);
    expect(html).toContain("See the basses in the library");
    expect(html).not.toContain("basss");
    expect(html).toContain("Violet = your range");
  });
});
