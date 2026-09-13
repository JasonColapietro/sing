import { describe, expect, it } from "vitest";
import {
  GLOSSARY,
  GLOSSARY_TERMS,
  glossaryKey,
  publisherFor,
  roomLabel,
  SING_GLOSSARY_TERMS,
  termId,
} from "./glossary";
import type { GlossaryDomain } from "./glossary";
import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

/**
 * The routes this app actually serves, read off the filesystem rather than
 * listed, so a room that is renamed or deleted fails here instead of becoming a
 * glossary link to a 404. Dynamic segments are dropped: no glossary href
 * carries one, and a term whose destination needs a slug should name the slug.
 */
const APP_DIR = fileURLToPath(new URL("../app", import.meta.url));

function staticRoutes(dir: string, prefix = ""): string[] {
  const found: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (name === "page.tsx") {
      found.push(prefix === "" ? "/" : prefix);
      continue;
    }
    if (!statSync(full).isDirectory()) continue;
    // Route groups and private folders do not appear in the URL; dynamic
    // segments cannot be matched against a literal href.
    if (name.startsWith("[")) continue;
    if (name.startsWith("(") || name.startsWith("_")) {
      found.push(...staticRoutes(full, prefix));
      continue;
    }
    found.push(...staticRoutes(full, `${prefix}/${name}`));
  }
  return found;
}

const APP_ROUTES = staticRoutes(APP_DIR);

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

  /**
   * The set is shared between two sites, so a term string is no longer unique:
   * `register` and `tone` are each defined twice, once per instrument. What has
   * to stay unique is the domain-qualified key, and `termId` within one site,
   * because that is what an anchor and a JSON-LD term URL are scoped to.
   */
  it("keys every entry uniquely once the domain is accounted for", () => {
    const keys = GLOSSARY_TERMS.map(glossaryKey);
    expect(new Set(keys).size).toBe(keys.length);

    for (const publisher of ["sing", "guitarHub"] as const) {
      const anchors = GLOSSARY_TERMS.filter(
        (e) => publisherFor(e.domain) === publisher,
      ).map((e) => termId(e.term));
      expect(new Set(anchors).size).toBe(anchors.length);
    }
  });

  it("keeps section headings out of the term anchor namespace", () => {
    const anchors = GLOSSARY_TERMS.map((e) => termId(e.term));
    const headings = GLOSSARY.map((s) => termId(s.heading));
    expect(new Set(headings).size).toBe(headings.length);
    // Section headings and terms share one id namespace on the page.
    expect(headings.some((h) => anchors.includes(h))).toBe(false);
  });

  /**
   * Pinned by name, because the point of the domain field is these four words
   * and losing one of them would otherwise just look like a shorter glossary.
   * `mix` has a single entry on purpose: the guitar curriculum never uses the
   * word, so a guitar sense would be data nothing links to. See the comment on
   * the guitar section.
   */
  it("defines each colliding word once per domain that uses it", () => {
    const collisions: Array<[string, GlossaryDomain[]]> = [
      ["Register", ["voice", "guitar"]],
      ["Tone", ["music", "guitar"]],
      ["Mix", ["voice"]],
    ];

    for (const [term, domains] of collisions) {
      const found = GLOSSARY_TERMS.filter((e) => e.term === term);
      expect(found.map((e) => e.domain).sort()).toEqual([...domains].sort());
    }

    /**
     * `support` collides as a concept but not as a string: this app's entry is
     * "Breath support" and the guitar hub's is "Support", so they never share an
     * anchor. Asserted rather than assumed, because renaming either one to match
     * the other would put two entries in one site's anchor namespace the day
     * someone decided the wording was inconsistent.
     */
    expect(
      GLOSSARY_TERMS.filter((e) => termId(e.term) === "support").map(
        (e) => e.domain,
      ),
    ).toEqual(["guitar"]);
    expect(
      GLOSSARY_TERMS.filter((e) => termId(e.term) === "breath-support").map(
        (e) => e.domain,
      ),
    ).toEqual(["voice"]);
  });

  /**
   * Pinned so that a change to the shared vocabulary is a line in a review
   * rather than a number nobody looked at. A new term is a deliberate edit here.
   */
  it("counts the set, per domain and in total", () => {
    const byDomain = (domain: GlossaryDomain) =>
      GLOSSARY_TERMS.filter((e) => e.domain === domain).length;

    expect(byDomain("music")).toBe(20);
    expect(byDomain("voice")).toBe(22);
    expect(byDomain("guitar")).toBe(16);
    expect(GLOSSARY_TERMS).toHaveLength(58);
    expect(SING_GLOSSARY_TERMS).toHaveLength(42);
  });

  it("defines each term in exactly one sentence", () => {
    for (const entry of GLOSSARY_TERMS) {
      expect(entry.definition.endsWith(".")).toBe(true);
      expect(entry.definition.indexOf(".")).toBe(entry.definition.length - 1);
      expect(entry.definition[0]).toBe(entry.definition[0].toUpperCase());
    }
  });

  it("names a surface for every term, wherever it is published", () => {
    for (const entry of GLOSSARY_TERMS) {
      expect(entry.href.startsWith("/")).toBe(true);
      expect(entry.where.length).toBeGreaterThan(0);
    }
  });

  /**
   * Only the entries this site renders are checked against this site's routes.
   * A guitar entry's href is a path on the guitar hub, which this repo cannot
   * resolve; that side is checked where it is rendered.
   */
  it("points every term this site publishes at a room this site serves", () => {
    for (const entry of SING_GLOSSARY_TERMS) {
      // An unlabelled href means a new route was added without deciding what
      // to call it, and the page would render "Open /somewhere →".
      expect(roomLabel(entry.href)).not.toBe(entry.href);
      expect(APP_ROUTES).toContain(entry.href);
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
