import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { rangeGrowth, rangeSeries } from "@/lib/analytics";

import {
  ResultView,
  comparisonSingerFromSlug,
  rankFamousVoices,
  returnSongSlugFromSearch,
  sampleHistory,
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

describe("famous-voice comparison", () => {
  it("names the singer whose reported range is closest, not the widest", () => {
    // Wide ranges used to tie on raw overlap and the list order picked
    // Freddie Mercury for almost everyone, sopranos included.
    expect(rankFamousVoices(45, 69)[0].slug).toBe("johnny-cash");
    expect(rankFamousVoices(48, 72)[0].slug).toBe("adele");
    expect(rankFamousVoices(57, 81)[0].slug).toBe("adele");
    expect(rankFamousVoices(60, 84)[0].slug).toBe("whitney-houston");
  });

  it("spreads ordinary ranges across several singers", () => {
    const heads = new Set<string>();
    for (let low = 36; low <= 70; low++) {
      for (let span = 10; span <= 36; span++) {
        heads.add(rankFamousVoices(low, low + span)[0].slug);
      }
    }
    expect(heads.size).toBeGreaterThanOrEqual(5);
  });

  it("keeps raw overlap as the tiebreaker and the label it shows", () => {
    const rows = rankFamousVoices(48, 72);
    for (let i = 1; i < rows.length; i++) {
      const [a, b] = [rows[i - 1], rows[i]];
      expect(a.fit > b.fit || (a.fit === b.fit && a.overlap >= b.overlap)).toBe(
        true,
      );
    }
  });

  it("headlines the closest reported range without a superlative", () => {
    const html = renderToStaticMarkup(
      createElement(ResultView, { lowMidi: 48, highMidi: 72, onRetake: () => {} }),
    );
    expect(html).toContain("Closest reported range to yours:");
    expect(html).not.toContain("overlaps most with");
    // The (Nst) column is overlap, not the sort key, so the order is explained.
    expect(html).toContain("combined span that");
  });
});

describe("range result headline stats", () => {
  it("lets the three stats wrap, so a long voice type is not clipped on a phone", () => {
    const html = renderToStaticMarkup(
      createElement(ResultView, { lowMidi: 57, highMidi: 81, onRetake: () => {} }),
    );
    expect(html).toContain("Mezzo-soprano");
    expect(html).toMatch(
      /<div class="flex flex-wrap[^"]*"><div><div[^>]*>Semitones</,
    );
  });
});

describe("range result guidance", () => {
  const render = (lowMidi: number, highMidi: number) =>
    renderToStaticMarkup(
      createElement(ResultView, { lowMidi, highMidi, onRetake: () => {} }),
    );

  it("calls the trimmed middle a starting guess, not where the test found comfort", () => {
    // The test asks for the furthest clear notes, falsetto included, and
    // tells the singer to stop before strain, so the result cannot say the
    // edges were found by pushing or that the arithmetic middle is measured.
    const html = render(45, 76);
    expect(html).toContain("Start in the middle:");
    expect(html).toContain("furthest clear notes you reached today");
    expect(html).toContain("your span with 3 semitones trimmed from each end");
    expect(html).toContain("a starting guess at where you sing comfortably, not a measurement of it");
    expect(html).toContain("falsetto");
    expect(html).toContain('href="/studio"');
    expect(html).not.toContain("pushing");
    expect(html).not.toContain("widens with practice");
  });

  it("starts warmups in the band instead of confining them to it", () => {
    // A span of 15 or more recommends the octave siren, which sweeps the
    // span, so the card cannot also tell the singer to keep warmups inside
    // the middle.
    const html = render(45, 76);
    expect(html).toContain("Octave siren");
    expect(html).toContain("then start warmups there and keep songs inside it");
    expect(html).not.toContain("keep warmups and songs inside it");
  });

  it("names the trim it actually made on a narrow span", () => {
    // workingRange trims less than three semitones under a 12-semitone span.
    expect(render(55, 63)).toContain("your span with 2 semitones trimmed from each end");
    // Untrimmed, the band is the measured span itself, so the copy must not
    // call that span "not a measurement", only the comfort reading of it.
    const whole = render(55, 58);
    expect(whole).toContain(
      "the whole span you reached: a starting guess at where you sing comfortably, not a measurement of it",
    );
    expect(whole).not.toMatch(/reached: a starting guess, not a measurement/);
  });
});

describe("range chart sample", () => {
  it("plots three tests six weeks apart, ending on the measured range", () => {
    const sample = sampleHistory(45, 76);
    expect(sample).toHaveLength(3);
    expect(sample[2]).toMatchObject({ lowMidi: 45, highMidi: 76 });
    const day = 24 * 60 * 60 * 1000;
    for (let i = 1; i < sample.length; i++) {
      const gap = Date.parse(sample[i].testedAt) - Date.parse(sample[i - 1].testedAt);
      expect(Math.round(gap / day)).toBe(42);
    }
  });

  it("shows no invented growth, and every sample entry survives the chart's filter", () => {
    // The sample used to widen by up to eight semitones over three months of
    // fortnightly tests on every free singer's first result.
    for (const [low, high] of [
      [45, 76],
      [55, 59],
      [55, 58],
      [60, 61],
    ]) {
      const sample = sampleHistory(low, high);
      expect(rangeSeries(sample)).toHaveLength(3);
      expect(rangeGrowth(sample)).toBe(0);
      for (const entry of sample) {
        expect(entry.lowMidi).toBeGreaterThanOrEqual(low);
        expect(entry.highMidi).toBeLessThanOrEqual(high);
        expect(high - low - (entry.highMidi - entry.lowMidi)).toBeLessThanOrEqual(2);
      }
    }
  });
});
