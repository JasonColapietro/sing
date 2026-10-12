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
import { EXERCISES } from "@/components/warmups/exercises";
import { AUTHOR_NAME } from "./author";
import {
  GLOSSARY_TERMS,
  publisherFor,
  SING_GLOSSARY_TERMS,
  termId,
} from "./glossary";
import { courseModuleForTerm } from "./lesson-glossary";
import { GUIDED_PRACTICE_ROOMS } from "./llms-txt";
import { FREE_DAILY_MINUTES } from "./practice-limits";

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

/**
 * Where a definition leads. Each entry links its room; an entry that names a
 * free warmup also links that drill, and an entry a course module trains links
 * the module's free lessons, which link back to the term from their side.
 */
describe("the glossary page's onward links", () => {
  /** The rendered block for one term, from its anchor to the next entry. */
  function entryHtml(term: string): string {
    const start = HTML.indexOf(`id="${termId(term)}"`);
    expect(start, term).toBeGreaterThan(-1);
    // Every entry and section heading carries this class; skip the entry's own.
    const own = HTML.indexOf('class="scroll-mt-20', start);
    const next = HTML.indexOf('class="scroll-mt-20', own + 1);
    return HTML.slice(start, next === -1 ? undefined : next);
  }

  it("links each named drill as a warmup deep link", () => {
    const withDrill = SING_GLOSSARY_TERMS.filter((e) => e.drill);
    expect(withDrill.map((e) => e.term)).toContain("Lip trill");
    for (const entry of withDrill) {
      const title = EXERCISES.find((x) => x.id === entry.drill)?.title;
      const html = entryHtml(entry.term);
      expect(html).toContain(`href="/warmups?exercise=${entry.drill}"`);
      expect(html).toContain(`Try it: ${title}`);
    }
  });

  /**
   * A drill in another room links by that room's deep link, so "Breath
   * support" opens the sustain test its sentence names rather than the top of
   * the breath room, a few screens above it on a phone.
   */
  it("links another room's named drill by its deep link", () => {
    const withTryIt = SING_GLOSSARY_TERMS.filter((e) => e.tryIt);
    expect(withTryIt.map((e) => e.term)).toContain("Breath support");
    for (const entry of withTryIt) {
      const html = entryHtml(entry.term);
      expect(html).toContain(`href="${entry.tryIt!.href.replace(/&/g, "&amp;")}"`);
      expect(html).toContain(`Try it: ${entry.tryIt!.label}`);
    }
  });

  it("links the free lessons a module trains each term in", () => {
    let linked = 0;
    for (const entry of SING_GLOSSARY_TERMS) {
      const lessons = courseModuleForTerm(entry.term);
      const html = entryHtml(entry.term);
      if (!lessons) {
        expect(html, entry.term).not.toContain("Free lessons:");
        continue;
      }
      linked += 1;
      expect(html).toContain(`href="${lessons.href}"`);
    }
    expect(linked).toBeGreaterThan(10);
  });

  it("shows the author its markup names", () => {
    expect(HTML).toMatch(new RegExp(`rel="author"[^>]*>${AUTHOR_NAME}<`));
  });

  it("states the daily guided-practice limit where it links into capped rooms", () => {
    expect(HTML).toContain(`${FREE_DAILY_MINUTES} minutes of guided practice a day`);
    // The capped rooms, named the way every other disclosure names them.
    const labels = GUIDED_PRACTICE_ROOMS.map((room) => room.label);
    const rooms = `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
    expect(HTML.toLowerCase()).toContain(`${rooms} share`);
  });

  /** The intro may not say nothing is prescribed above entries that link a drill. */
  it("does not deny the drill links it renders", () => {
    expect(HTML).not.toMatch(/No exercise is prescribed/);
  });
});
