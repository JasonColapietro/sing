import { describe, expect, it } from "vitest";
import { GLOSSARY, GLOSSARY_TERMS, roomLabel, termId } from "./glossary";

describe("termId", () => {
  it("slugifies a term into an anchor", () => {
    expect(termId("Scientific pitch notation")).toBe(
      "scientific-pitch-notation",
    );
    expect(termId("A440")).toBe("a440");
  });

  it("drops apostrophes instead of hyphenating them", () => {
    expect(termId("Singer's formant")).toBe("singers-formant");
    expect(termId("Singer’s formant")).toBe("singers-formant");
  });

  it("strips accents and collapses punctuation", () => {
    expect(termId("Pässaggio — the break")).toBe("passaggio-the-break");
  });

  it("never leaves a leading or trailing hyphen", () => {
    expect(termId("  Mix?  ")).toBe("mix");
  });
});

describe("roomLabel", () => {
  it("names the destination in a sentence", () => {
    expect(roomLabel("/studio")).toBe("the pitch studio");
    expect(roomLabel("/singers/records")).toBe("the records page");
  });

  it("falls back to the path for an unknown route", () => {
    expect(roomLabel("/nowhere")).toBe("/nowhere");
  });
});

describe("GLOSSARY", () => {
  it("flattens to every entry, in section order", () => {
    expect(GLOSSARY_TERMS).toHaveLength(
      GLOSSARY.reduce((n, s) => n + s.entries.length, 0),
    );
    expect(GLOSSARY_TERMS[0]).toBe(GLOSSARY[0].entries[0]);
  });

  it("has no duplicate term, anchor or section heading", () => {
    const terms = GLOSSARY_TERMS.map((e) => e.term.toLowerCase());
    expect(new Set(terms).size).toBe(terms.length);

    const anchors = GLOSSARY_TERMS.map((e) => termId(e.term));
    expect(new Set(anchors).size).toBe(anchors.length);

    const headings = GLOSSARY.map((s) => termId(s.heading));
    expect(new Set(headings).size).toBe(headings.length);
    // Section headings and terms share one id namespace on the page.
    expect(headings.some((h) => anchors.includes(h))).toBe(false);
  });

  it("defines each term in exactly one sentence", () => {
    for (const entry of GLOSSARY_TERMS) {
      expect(entry.definition.endsWith(".")).toBe(true);
      expect(entry.definition.indexOf(".")).toBe(entry.definition.length - 1);
      expect(entry.definition[0]).toBe(entry.definition[0].toUpperCase());
    }
  });

  it("points every term at a room the app actually has", () => {
    for (const entry of GLOSSARY_TERMS) {
      expect(entry.href.startsWith("/")).toBe(true);
      // An unlabelled href means a new route was added without deciding what
      // to call it, and the page would render "Open /somewhere →".
      expect(roomLabel(entry.href)).not.toBe(entry.href);
      expect(entry.where.length).toBeGreaterThan(0);
    }
  });

  it("never lists a term as its own alternate name", () => {
    for (const entry of GLOSSARY_TERMS) {
      for (const alias of entry.aka ?? []) {
        expect(alias.toLowerCase()).not.toBe(entry.term.toLowerCase());
      }
    }
  });
});
