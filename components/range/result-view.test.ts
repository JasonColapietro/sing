import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { rangeGrowth, rangeSeries } from "@/lib/analytics";
import { SONGS } from "@/components/songs/data";
import { countOpenSongsFitting } from "@/components/songs/lib";
import {
  EXERCISES,
  OCTAVE_SIREN_MIN_SEMIS,
  computeRootLadder,
  patternSpan,
} from "@/components/warmups/exercises";

import {
  FIVE_NOTE_SCALE_SEMIS,
  ResultView,
  comparisonSingerFromSlug,
  rankFamousVoices,
  returnSongHref,
  returnSongSlugFromSearch,
  sampleHistory,
  songCountCopy,
  voicePlural,
} from "./result-view";
import { MIN_SAVED_SPAN } from "./range-test";

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

  it("sends the singer back to the verdict, not the top of the song page", () => {
    // app/can-you-sing/[slug]/page.tsx wraps the verdict in id="fit".
    expect(returnSongHref("creep")).toBe("/can-you-sing/creep#fit");
    // The fragment needs its target: renaming the wrapper would quietly
    // drop the singer back on the H1.
    const songPage = readFileSync(
      join(__dirname, "../../app/can-you-sing/[slug]/page.tsx"),
      "utf8",
    );
    expect(songPage).toMatch(/<div id="fit"[^>]*>\s*<CanYouSingVerdict/);
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

describe("range result song count", () => {
  it("counts the open songs in the key they open in, as the songbook badges do", () => {
    // C3–F4 (48–65): the written-key count said "Nothing fits as written —
    // yet" here, while the library marked the same three songs as fitting.
    const counted = countOpenSongsFitting(SONGS, new Set(), { lowMidi: 48, highMidi: 65 });
    expect(counted.fitting).toBe(counted.total);
    const copy = songCountCopy(counted);
    expect(copy.heading).toBe("Every open song fits your range");
    expect(copy.body).toContain("They open fitted to the range you just measured");
    expect(copy.body).toContain(`the other ${counted.locked} open a band at a time`);
    expect(`${copy.heading} ${copy.body}`).not.toMatch(/written key|yet/);
  });

  it("agrees the verb with one song", () => {
    expect(songCountCopy({ fitting: 1, total: 3, locked: 0 }).heading).toBe("1 of 3 open songs fits your range");
    expect(songCountCopy({ fitting: 2, total: 3, locked: 0 }).heading).toBe("2 of 3 open songs fit your range");
  });

  it("does not offer more shifting as the cure when even an octave's shift misses", () => {
    // A2–E3 (45–52): the first band, dropped the player's full octave, still
    // sits above this ceiling.
    const counted = countOpenSongsFitting(SONGS, new Set(), { lowMidi: 45, highMidi: 52 });
    expect(counted.fitting).toBe(0);
    const copy = songCountCopy(counted);
    expect(copy.heading).toBe(`0 of ${counted.total} open songs fit your range`);
    expect(copy.body).toContain("even shifted by up to an octave");
    expect(copy.body).not.toContain("You can still shift");
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
    // A span of 21 or more recommends the octave siren, which roots in the
    // band but glides above it, so the card cannot also tell the singer to
    // keep warmups inside the middle.
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

  it("describes the narrow-span warmup as it plays, without promising growth", () => {
    for (const [lo, hi] of [[48, 55], [52, 64]]) {
      const html = render(lo, hi);
      expect(html).toContain("Five-note scale");
      expect(html).toContain("may stay in one key");
      expect(html).toContain("stop any rep that strains");
      expect(html).not.toContain("through the middle of your range");
      expect(html).not.toContain("builds the span");
    }
    // Under the five-note scale's own width its ladder would sing below the
    // measured low on every rep, so the card offers humming thirds instead.
    expect(render(48, 54)).toContain("Humming thirds");
    expect(render(48, 54)).toContain('href="/warmups?exercise=humming-thirds"');
    expect(render(48, 54)).not.toContain("Five-note scale");
    expect(render(48, 54)).not.toContain("below your lowest");
    expect(render(52, 64)).toContain("come close to the lowest or highest note you reached");
  });

  it("keeps the warmup for the narrowest saved results inside the measured span", () => {
    // "It stays inside the notes you reached, though a rep can touch your
    // lowest or highest": true for every span the range test saves.
    const hum = EXERCISES.find((ex) => ex.id === "humming-thirds")!;
    expect(hum.tier).toBe("beginner");
    expect(patternSpan(hum)).toBe(4);
    for (let semis = MIN_SAVED_SPAN; semis < FIVE_NOTE_SCALE_SEMIS; semis++) {
      expect(render(48, 48 + semis)).toContain("Humming thirds");
      const roots = computeRootLadder(hum, 48, 48 + semis);
      expect(Math.min(...roots), `${semis} semitones`).toBeGreaterThanOrEqual(48);
      expect(Math.max(...roots) + patternSpan(hum), `${semis} semitones`).toBeLessThanOrEqual(48 + semis);
      // The key still moves a semitone a rep, as the warmup room says.
      expect(roots.length, `${semis} semitones`).toBeGreaterThan(1);
    }
  });

  it("matches what the fitted five-note ladder actually plays", () => {
    // The card's copy rests on these facts about fitRootLadder: few keys at
    // most for every span that gets the five-note card, and inside the
    // measured span.
    const five = EXERCISES.find((ex) => ex.id === "five-note-scale")!;
    expect(patternSpan(five)).toBe(FIVE_NOTE_SCALE_SEMIS);
    const low = 48;
    for (let semis = FIVE_NOTE_SCALE_SEMIS; semis < OCTAVE_SIREN_MIN_SEMIS; semis++) {
      const high = low + semis;
      const roots = computeRootLadder(five, low, high);
      expect(roots.length, `${semis} semitones`).toBeLessThanOrEqual(5);
      const top = Math.max(...roots) + FIVE_NOTE_SCALE_SEMIS;
      expect(top, `${semis} semitones`).toBeLessThanOrEqual(high);
      expect(Math.min(...roots), `${semis} semitones`).toBeGreaterThanOrEqual(low);
      if (semis >= 15) {
        // "It starts a major third above the lowest note you reached and
        // stays a few notes under your highest."
        expect(Math.min(...roots), `${semis} semitones`).toBe(low + 4);
        expect(top, `${semis} semitones`).toBeLessThanOrEqual(high - 4);
      }
    }
  });

  it("keeps the octave siren for spans whose ladder starts it inside the band", () => {
    // Round 9 offered the siren from 15 semitones, where its fitted ladder
    // roots the octave on the measured floor (and at 15 glides onto the
    // measured ceiling), one tap after "Start in the middle".
    const fifteenToTwenty = render(48, 65);
    expect(fifteenToTwenty).toContain("Five-note scale");
    expect(fifteenToTwenty).not.toContain("Octave siren");
    expect(fifteenToTwenty).toContain("It starts a major third above the lowest note you reached");
    expect(render(48, 68)).not.toContain("Octave siren");
    expect(render(48, 69)).toContain("Octave siren");
    expect(render(48, 69)).toContain('href="/warmups?exercise=octave-siren"');

    const siren = EXERCISES.find((ex) => ex.id === "octave-siren")!;
    const low = 48;
    for (let semis = 15; semis < 32; semis++) {
      const roots = computeRootLadder(siren, low, low + semis);
      // workingRange trims three semitones off each end from 12 up.
      const startsInBand = Math.min(...roots) >= low + 3;
      expect(startsInBand, `${semis} semitones`).toBe(semis >= OCTAVE_SIREN_MIN_SEMIS);
    }
  });

  it("applies the coach's span rule for the octave siren, not a second one", () => {
    // components/progress/coach.tsx withholds the siren below the same span:
    // both import the one constant from components/warmups/exercises.ts.
    for (const file of ["../progress/coach.tsx", "./result-view.tsx"]) {
      const src = readFileSync(join(__dirname, file), "utf8");
      expect(src, file).not.toMatch(/const OCTAVE_SIREN_MIN_SEMIS\b/);
      expect(src, file).toMatch(
        /import \{[^}]*\bOCTAVE_SIREN_MIN_SEMIS\b[^}]*\} from "@\/components\/warmups\/exercises"/,
      );
    }
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
