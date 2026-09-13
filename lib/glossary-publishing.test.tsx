/**
 * The glossary page publishes the terms this site owns and nothing else.
 *
 * The shared set now carries the guitar senses of `register`, `support` and
 * `tone` as well as thirteen guitar-only words, because the guitar hub vendors
 * the whole file. None of them belong on this page: this app has no fretboard
 * room to link a reader into, and — the part that matters — two sites emitting
 * `DefinedTerm` markup for one term compete with each other as the definitional
 * source for it.
 *
 * Rendering the page and reading the markup back is the only assertion that
 * survives someone mapping over `GLOSSARY` again instead of `SING_GLOSSARY`,
 * which is exactly the edit that would leak them.
 *
 * Proven non-vacuous by pointing the page back at `GLOSSARY`: both checks below
 * fail, naming the guitar terms.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import GlossaryPage from "@/app/glossary/page";
import {
  GLOSSARY_TERMS,
  publisherFor,
  SING_GLOSSARY_TERMS,
  termId,
} from "./glossary";

const HTML = renderToStaticMarkup(<GlossaryPage />);

/** The JSON-LD block, parsed, so the markup is read the way a crawler reads it. */
function definedTermSet() {
  const block = HTML.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  )?.[1];
  expect(block).toBeTruthy();
  return JSON.parse(block as string) as {
    "@type": string;
    hasDefinedTerm: Array<{ name: string; description: string; "@id": string }>;
  };
}

describe("the glossary page", () => {
  /**
   * Two of the guitar entries — `register` and `tone` — share an anchor with a
   * sing entry, so their absence cannot be asserted by name. They are covered by
   * the DefinedTerm check below, which pins the published sense of each; this one
   * takes the fourteen words only the guitar hub has. Guitar `support` is among
   * them: this site's entry is "Breath support", so the two never share an
   * anchor.
   */
  const guitarOnly = GLOSSARY_TERMS.filter(
    (entry) =>
      publisherFor(entry.domain) === "guitarHub" &&
      !SING_GLOSSARY_TERMS.some(
        (own) => termId(own.term) === termId(entry.term),
      ),
  );

  it("renders no term the guitar hub owns", () => {
    expect(guitarOnly.map((e) => e.term)).toContain("Barre chord");
    expect(guitarOnly).toHaveLength(14);

    for (const entry of guitarOnly) {
      expect(HTML).not.toContain(`id="${termId(entry.term)}"`);
      expect(HTML).not.toContain(`>${entry.term}<`);
      expect(HTML).not.toContain(entry.definition);
    }

    // And no section of theirs, which is how a whole block would arrive.
    expect(HTML).not.toContain("Guitar and the fretboard");
  });

  it("emits a DefinedTerm for every sing-owned term and no other", () => {
    const set = definedTermSet();
    expect(set["@type"]).toBe("DefinedTermSet");

    expect(set.hasDefinedTerm.map((t) => t.name)).toEqual(
      SING_GLOSSARY_TERMS.map((entry) => entry.term),
    );

    for (const entry of guitarOnly) {
      expect(set.hasDefinedTerm.some((t) => t.name === entry.term)).toBe(false);
      expect(
        set.hasDefinedTerm.some((t) => t["@id"].endsWith(`#${termId(entry.term)}`)),
      ).toBe(false);
    }

    /**
     * The three colliding words do appear in the markup, as this site's senses.
     * Asserted positively so that "no guitar term leaked" is never satisfied by
     * the voice entry having gone missing too.
     */
    for (const term of ["Register", "Tone"]) {
      const published = set.hasDefinedTerm.filter((t) => t.name === term);
      const own = GLOSSARY_TERMS.find(
        (entry) =>
          entry.term === term && publisherFor(entry.domain) === "sing",
      );
      expect(published).toHaveLength(1);
      expect(published[0].description).toBe(own?.definition);
    }
  });
});
