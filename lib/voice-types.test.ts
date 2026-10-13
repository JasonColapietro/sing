/**
 * Voice-category data integrity.
 *
 * Three claims are printed as fact on /atlas/vocal-range-by-voice-type and
 * nowhere is there anything to stop them drifting: that every category has a
 * passaggio, that the conventional bands really are two octaves (the page says
 * so in prose), and that "bass" pluralises to "basses".
 *
 * The plural one was not hypothetical. `${"bass"}s` shipped to production and
 * rendered <h1>Famous basss</h1> on /singers/voice-type/bass, along with the
 * meta description, the JSON-LD name, the breadcrumb, the OG image, and the
 * "All basss" links on singer and genre pages — eight surfaces, because the
 * concatenation was copied rather than shared.
 *
 * Proven non-vacuous: restoring `${type}s` fails the plural test naming Bass;
 * widening any REFERENCE_BAND by a semitone fails the two-octave test;
 * restoring the primo-only male passaggi (55-57, 57-60, 59-62, 64-67)
 * fails both of the registration-event tests below.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { REFERENCE_BANDS, representativeSingers } from "./singers-analysis";
import { SINGERS, VOICE_KINDS, pluralVoice, singersByVoiceType } from "./singers";
import { VOICE_TYPE_NOTES, VOICE_TYPE_PASSAGGIO } from "./voice-types";
import { VOICE_TYPES } from "./audio/notes";
import { BOOK } from "./book-data";
import { ATLAS } from "./atlas-data";
import VocalRangeByVoiceTypePage from "@/app/atlas/vocal-range-by-voice-type/page";

vi.mock("server-only", () => ({}));

describe("voice category coverage", () => {
  it("has a note and a passaggio for every category, with no strays", () => {
    expect(Object.keys(VOICE_TYPE_NOTES).sort()).toEqual([...VOICE_KINDS].sort());
    expect(Object.keys(VOICE_TYPE_PASSAGGIO).sort()).toEqual(
      [...VOICE_KINDS].sort(),
    );
  });
});

describe("conventional bands", () => {
  it("are each exactly two octaves, which the page states in prose", () => {
    const wrong = VOICE_KINDS.filter(
      (v) => REFERENCE_BANDS[v].high - REFERENCE_BANDS[v].low !== 24,
    );
    expect(wrong, `not 24 semitones: ${wrong.join(", ")}`).toEqual([]);
  });

  it("ascend with tessitura down each ladder", () => {
    const ladders = [
      ["Bass", "Bass-baritone", "Baritone", "Tenor"],
      ["Contralto", "Mezzo-soprano", "Soprano"],
    ] as const;
    for (const ladder of ladders) {
      const lows = ladder.map((v) => REFERENCE_BANDS[v].low);
      expect(lows, `${ladder.join(" < ")}`).toEqual([...lows].sort((a, b) => a - b));
      expect(new Set(lows).size).toBe(lows.length);
    }
  });
});

describe("passaggio zones", () => {
  it("are ordered low-to-high and non-empty", () => {
    for (const v of VOICE_KINDS) {
      const p = VOICE_TYPE_PASSAGGIO[v];
      expect(p.low, v).toBeLessThan(p.high);
    }
  });

  it("sit inside the category's own conventional band", () => {
    // A transition zone outside the range it transitions within is nonsense,
    // and would print a number the rest of the row contradicts.
    const outside = VOICE_KINDS.filter((v) => {
      const p = VOICE_TYPE_PASSAGGIO[v];
      const b = REFERENCE_BANDS[v];
      return p.low < b.low || p.high > b.high;
    });
    expect(outside, `passaggio outside its band: ${outside.join(", ")}`).toEqual(
      [],
    );
  });

  it("ascend with tessitura down each ladder", () => {
    // Countertenor is deliberately excluded: its zone is the M1/M2 crossing,
    // a different event, and it carries a caveat saying so.
    const ladders = [
      ["Bass", "Bass-baritone", "Baritone", "Tenor"],
      ["Contralto", "Mezzo-soprano", "Soprano"],
    ] as const;
    for (const ladder of ladders) {
      const lows = ladder.map((v) => VOICE_TYPE_PASSAGGIO[v].low);
      expect(lows, ladder.join(" < ")).toEqual([...lows].sort((a, b) => a - b));
    }
  });

  // The male ladder spans [primo passaggio, secondo passaggio]. The two tests
  // below pin that as a shape rather than as four hardcoded pairs, because the
  // defect they exist for was a category error, not a typo: the published lows
  // were Miller's primo column while the page's prose describes the secondo,
  // so three of the four rows named an event a perfect fourth below the one
  // being defined. Countertenor is excluded throughout — its zone is the M1/M2
  // crossing, a different event, and it carries a caveat saying so.
  const MALE_LADDER = ["Bass", "Bass-baritone", "Baritone", "Tenor"] as const;

  it("spans a perfect fourth for every male category", () => {
    // Miller puts a perfect fourth between primo and secondo, so a male band
    // narrower than five semitones is reporting only one of the two events.
    const wrong = MALE_LADDER.filter(
      (v) => VOICE_TYPE_PASSAGGIO[v].high - VOICE_TYPE_PASSAGGIO[v].low !== 5,
    );
    expect(wrong, `not a perfect fourth: ${wrong.join(", ")}`).toEqual([]);
  });

  it("steps between male categories by less than it spans within one", () => {
    // The tell that caught the original error, kept as an invariant. Adjacent
    // male categories sit a tone or so apart; primo to secondo is a fourth. A
    // gap of a fourth *between* two neighbours therefore means the ladder has
    // changed which event it is measuring partway down — which is exactly what
    // the +5 from the baritone floor to the tenor floor was.
    const lows = MALE_LADDER.map((v) => VOICE_TYPE_PASSAGGIO[v].low);
    const steps = lows.slice(1).map((n, i) => n - lows[i]);
    const jumped = steps
      .map((n, i) => ({ n, pair: `${MALE_LADDER[i]}->${MALE_LADDER[i + 1]}` }))
      .filter((x) => x.n >= 5);
    expect(
      jumped.map((x) => x.pair),
      `gap of a fourth or more between neighbours: ${jumped
        .map((x) => `${x.pair} +${x.n}`)
        .join(", ")}`,
    ).toEqual([]);
  });

  it("explains itself wherever the single-zone model is a poor fit", () => {
    // Countertenor is the case; if the caveat is dropped the page prints a
    // number at a confidence the underlying idea does not support.
    expect(VOICE_TYPE_PASSAGGIO.Countertenor.caveat).toBeTruthy();
  });
});

describe("pluralVoice", () => {
  it("never produces a triple letter, for any category", () => {
    const bad = VOICE_KINDS.filter((v) => /(.)\1\1/.test(pluralVoice(v)));
    expect(bad, `mangled plurals: ${bad.map(pluralVoice).join(", ")}`).toEqual([]);
  });

  it("never prints the typo in the atlas, whose voice-type appendix is generated", () => {
    // scripts/compile-atlas.mjs built its headings with its own `${type}s`
    // and printed "## Basss" for Pro readers and in the PDF, out of reach
    // of every guard on the site's own pages.
    const body = ATLAS.map((c) => c.body).join("\n");
    expect(body).not.toMatch(/\bbasss\b/i);
    expect(body).toContain("## Basses");
  });

  it("pluralises the sibilant category correctly", () => {
    expect(pluralVoice("Bass")).toBe("Basses");
    expect(pluralVoice("bass")).toBe("basses");
    // And leaves the ordinary ones alone.
    expect(pluralVoice("Tenor")).toBe("Tenors");
    expect(pluralVoice("Bass-baritone")).toBe("Bass-baritones");
  });
});

describe("representativeSingers", () => {
  it("returns singers of the requested category only", () => {
    for (const v of VOICE_KINDS) {
      for (const s of representativeSingers(v, 3)) expect(s.voiceType).toBe(v);
    }
  });

  it("returns the requested count wherever the library can supply it", () => {
    for (const v of VOICE_KINDS) {
      const available = singersByVoiceType(v).length;
      expect(representativeSingers(v, 3).length).toBe(Math.min(3, available));
    }
  });

  it("picks nearer the band than the category's widest outlier", () => {
    // The point of the helper: illustrate the typical row with typical voices.
    // Ranked on fame it would surface exactly the singers who defy the band.
    const band = REFERENCE_BANDS.Tenor;
    const dist = (s: (typeof SINGERS)[number]) =>
      Math.abs(s.lowMidi - band.low) + Math.abs(s.highMidi - band.high);
    const picked = representativeSingers("Tenor", 3);
    const widest = [...singersByVoiceType("Tenor")].sort(
      (a, b) => b.highMidi - b.lowMidi - (a.highMidi - a.lowMidi),
    )[0];
    for (const s of picked) expect(dist(s)).toBeLessThan(dist(widest));
  });

  it("is stable between calls", () => {
    expect(representativeSingers("Soprano", 3).map((s) => s.slug)).toEqual(
      representativeSingers("Soprano", 3).map((s) => s.slug),
    );
  });
});

/**
 * The book's chapter-three passaggio list is hand-typed prose, and it had drifted
 * badly: it printed Bass-baritone's A3-D4 under "Bass", and put Contralto,
 * Mezzo-soprano and Soprano two to five semitones below the zones the app and
 * the atlas publish. Nothing compared the two, so a reader following the book
 * was working from different numbers than the product.
 *
 * Prose cannot be generated from the constants without a templating step the
 * book pipeline does not have, so instead it is asserted against them.
 */
describe("the book's passaggio chapter agrees with VOICE_TYPE_PASSAGGIO", () => {
  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const label = (midi: number) => `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
  const chapter = BOOK.find((c) => c.slug === "the-passaggio");

  it("ships the chapter", () => {
    expect(chapter, "book chapter 'the-passaggio' is missing").toBeTruthy();
  });

  it("prints every category's zone exactly as the constants define it", () => {
    const body = chapter?.body ?? "";
    for (const kind of VOICE_KINDS) {
      const zone = VOICE_TYPE_PASSAGGIO[kind];
      const expected = `**${kind}:** ${label(zone.low)} up to ${label(zone.high)}`;
      expect(body, `chapter 3 does not state ${kind} as ${label(zone.low)}-${label(zone.high)}`).toContain(
        expected,
      );
    }
  });

  /**
   * The chapter used to say the two turning points sit "often a fourth or fifth"
   * apart, which is true of the male rows and wrong for the female ones — the
   * suite above pins those at three and four semitones.
   */
  it("does not claim a fifth between the turning points", () => {
    expect(chapter?.body ?? "").not.toContain("fourth or fifth");
  });
});

/**
 * The female zones are the commercial belt-or-mix break, several notes above
 * the first flip out of chest that a woman's quiet slide finds. The reference
 * page's per-type answers are written to be quoted alone, and the soprano one
 * used to give C5-E5 as "where the voice changes gear" with no word of the
 * earlier shift. Every answer that prints a female zone must name it.
 */
describe("the reference page names the earlier female shift", () => {
  const faq = () => {
    const html = renderToStaticMarkup(createElement(VocalRangeByVoiceTypePage));
    const answers = new Map<string, string>();
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      const graph = (JSON.parse(m[1])["@graph"] ?? []) as {
        "@type"?: string;
        mainEntity?: { name: string; acceptedAnswer: { text: string } }[];
      }[];
      for (const node of graph) {
        if (node["@type"] !== "FAQPage") continue;
        for (const q of node.mainEntity ?? []) answers.set(q.name, q.acceptedAnswer.text);
      }
    }
    return answers;
  };
  const EARLIER = /earlier, lighter shift out of chest voice somewhere around E4 to G4/;

  it("in each female category's answer and in the passaggio definition", () => {
    const answers = faq();
    for (const q of [
      "What is a contralto's vocal range?",
      "What is a mezzo-soprano's vocal range?",
      "What is a soprano's vocal range?",
      "What is a passaggio?",
    ]) {
      expect(answers.get(q), `missing FAQ: ${q}`).toBeTruthy();
      expect(answers.get(q), q).toMatch(EARLIER);
    }
  });

  it("and not in the male answers, whose zones already span both turning points", () => {
    const answers = faq();
    for (const kind of ["bass", "bass-baritone", "baritone", "tenor"]) {
      expect(answers.get(`What is a ${kind}'s vocal range?`), kind).not.toMatch(EARLIER);
    }
  });
});

/**
 * The classifier returns six categories; the editorial taxonomy publishes eight.
 * That gap is deliberate — bass-baritone and countertenor are judgments about
 * timbre and production, not bands a low and a high note can place you in — but
 * it is only safe while every category the classifier CAN return routes
 * somewhere. A classified label with no passaggio row or no reference band would
 * render a blank or crash the page it was routed to.
 */
describe("every classifiable voice type routes", () => {
  it("is a subset of the published taxonomy", () => {
    for (const type of VOICE_TYPES) {
      const match = VOICE_KINDS.find((kind) => kind.toLowerCase() === type.label.toLowerCase());
      expect(match, `classifier can return ${type.label}, which is not a published voice kind`).toBeTruthy();
    }
  });

  it("has a passaggio zone and a reference band for every label it can return", () => {
    for (const type of VOICE_TYPES) {
      const kind = VOICE_KINDS.find((k) => k.toLowerCase() === type.label.toLowerCase())!;
      expect(VOICE_TYPE_PASSAGGIO[kind], `no passaggio zone for ${kind}`).toBeTruthy();
      expect(REFERENCE_BANDS[kind], `no reference band for ${kind}`).toBeTruthy();
    }
  });

  /**
   * Named so the two editorial-only categories are a recorded state rather than
   * a surprise. If the classifier ever gains one, this fails and the gap is
   * re-decided deliberately.
   */
  it("records which published categories a range scan can never assign", () => {
    const classifiable = VOICE_TYPES.map((t) => t.label.toLowerCase());
    const unreachable = VOICE_KINDS.filter((k) => !classifiable.includes(k.toLowerCase()));
    expect(unreachable).toEqual(["Bass-baritone", "Countertenor"]);
  });
});

/**
 * scripts/compile-singers.mjs only warns about this at compile time, so the
 * suite is what keeps it out of the shipped library. A male-category floor at
 * G3 or above sits over the singer's own speaking pitch: almost always a
 * treble-clef score's written compass, which sounds an octave lower, copied
 * as if it were the sounding range.
 */
describe("cited floors", () => {
  it("puts no male-category floor at or above G3, the signature of a written treble-clef figure", () => {
    const MALE = new Set(["Countertenor", "Tenor", "Baritone", "Bass-baritone", "Bass"]);
    expect(
      SINGERS.filter((s) => MALE.has(s.voiceType) && s.lowMidi >= 55).map(
        (s) => `${s.name} (${s.voiceType})`,
      ),
    ).toEqual([]);
  });
});

/**
 * The soprano note prints two counts about this library as fact, on an
 * indexable hub, and /singers/records publishes the table that checks the
 * first one. "Most of the extreme top figures" survived round 1 of the audit
 * while the records page showed 7 sopranos of 15; these assertions mirror
 * that table's cut (top 15 by highest endpoint, plus ties) so the sentence
 * cannot drift from it again.
 */
describe("soprano note counts", () => {
  const countBy = (rows: typeof SINGERS) => {
    const counts = new Map<string, number>();
    for (const s of rows) counts.set(s.voiceType, (counts.get(s.voiceType) ?? 0) + 1);
    return counts;
  };

  it("says sopranos hold more of the top figures than any other category, which the records cut bears out", () => {
    expect(VOICE_TYPE_NOTES.Soprano.body).toContain(
      "more of the extreme top figures than any other category",
    );
    const sorted = [...SINGERS].sort((a, b) => b.highMidi - a.highMidi);
    const cut = sorted[14].highMidi;
    const top = sorted.filter((s, i) => i < 15 || s.highMidi === cut);
    const counts = countBy(top);
    const soprano = counts.get("Soprano") ?? 0;
    const others = [...counts].filter(([type]) => type !== "Soprano");
    for (const [type, n] of others) {
      expect(soprano, `${type} has ${n} of the top figures, sopranos ${soprano}`).toBeGreaterThan(n);
    }
  });

  it("says sopranos hold most of the whistle-register entries, which the flags bear out", () => {
    expect(VOICE_TYPE_NOTES.Soprano.body).toContain("most of the whistle-register entries");
    const whistle = SINGERS.filter((s) => s.whistle);
    const soprano = whistle.filter((s) => s.voiceType === "Soprano").length;
    expect(soprano * 2, `${soprano} of ${whistle.length} whistle entries are sopranos`).toBeGreaterThan(
      whistle.length,
    );
  });
});
