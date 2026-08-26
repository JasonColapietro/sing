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
 * widening any REFERENCE_BAND by a semitone fails the two-octave test.
 */
import { describe, expect, it } from "vitest";

import { REFERENCE_BANDS, representativeSingers } from "./singers-analysis";
import { SINGERS, VOICE_KINDS, pluralVoice, singersByVoiceType } from "./singers";
import { VOICE_TYPE_NOTES, VOICE_TYPE_PASSAGGIO } from "./voice-types";

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
