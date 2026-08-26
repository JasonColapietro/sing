/**
 * /atlas/vocal-range-by-voice-type guard.
 *
 * The page exists because nothing on the site answered "what's a tenor's
 * range?" — the atlas chapter deliberately declines the table, /glossary has
 * no numbers, and /range only reports a verdict after you sing into it. What
 * makes this page work is three properties that are each easy to break
 * silently:
 *
 *  1. The table must be a real <table> with header associations. A crawler,
 *     a screen reader, and an answer engine lifting one row all depend on the
 *     cell-to-header relationship; a div grid with ARIA roles looks identical
 *     in a browser and loses it.
 *  2. The FAQ in the JSON-LD must be the FAQ on the page. Google requires the
 *     structured data to match visible content, and the two drift the instant
 *     they stop sharing a source.
 *  3. The graph must reference the Organization by @id, never redeclare it.
 *     A second, thinner description of the same @id forks the entity this
 *     whole task exists to consolidate.
 *
 * Proven non-vacuous: swapping the <table> for divs fails (1); adding an
 * entry to the JSON-LD FAQ alone fails (2); inlining an Organization node
 * fails (3).
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Page, { metadata } from "@/app/atlas/vocal-range-by-voice-type/page";
import sitemap from "@/app/sitemap";
import {
  SINGERS,
  VOICE_KINDS,
  singersByVoiceType,
  voiceTypeSlug,
} from "./singers";
import { REFERENCE_BANDS } from "./singers-analysis";
import { ORG_ID } from "./organization";
import { SITE_URL } from "./site";

const PATH = "/atlas/vocal-range-by-voice-type";
const URL = `${SITE_URL}${PATH}`;

const html = renderToStaticMarkup(<Page />);

/** The single ld+json block the page emits. */
const graph = (() => {
  // [\s\S] rather than the /s flag: tsconfig targets ES2017, where dotAll
  // is not available (CI's `tsc --noEmit` rejects it — `next build` does not
  // typecheck test files, so only CI catches this).
  const m = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );
  if (!m) throw new Error("page emitted no JSON-LD");
  // renderToStaticMarkup escapes the JSON payload for HTML context.
  const raw = m[1]
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  return JSON.parse(raw) as { "@graph": Record<string, unknown>[] };
})();

const node = (type: string) =>
  graph["@graph"].find((n) => n["@type"] === type) as
    | Record<string, never>
    | undefined;

/** Visible text, tags stripped and entities decoded. */
const text = html
  .replace(/<script[\s\S]*?<\/script>/g, "")
  .replace(/<[^>]+>/g, " ")
  .replace(/&#x27;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, "&")
  .replace(/&mdash;/g, "—")
  .replace(/&rsquo;/g, "'")
  .replace(/\s+/g, " ");

describe("the answer is actually on the page", () => {
  it("poses the question in the h1", () => {
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "";
    expect(h1.toLowerCase()).toContain("vocal range");
    expect(h1).toMatch(/\?/);
  });

  it("renders a real <table>, not a div grid", () => {
    expect(html).toContain("<table");
    expect(html).toContain("<thead");
    expect(html).toContain("<tbody");
    // Header association is the part that a div grid silently loses.
    expect(html).toContain('scope="col"');
    expect(html).toContain('scope="row"');
    expect((html.match(/scope="row"/g) ?? []).length).toBe(VOICE_KINDS.length);
    expect(html).toContain("<caption");
  });

  it("gives every voice type a row with a range and a passaggio", () => {
    const table = html.match(/<table[\s\S]*?<\/table>/)?.[0] ?? "";
    for (const v of VOICE_KINDS) expect(table).toContain(v);
    // Note-name pairs like "E2–E4": two per row, range and passaggio.
    const pairs = table.match(/[A-G]#?\d–[A-G]#?\d/g) ?? [];
    expect(pairs.length).toBeGreaterThanOrEqual(VOICE_KINDS.length * 2);
  });

  it("links every voice type to its hub and every example to a real singer", () => {
    const table = html.match(/<table[\s\S]*?<\/table>/)?.[0] ?? "";
    for (const v of VOICE_KINDS) {
      expect(table).toContain(`href="/singers/voice-type/${voiceTypeSlug(v)}"`);
    }
    const slugs = [...table.matchAll(/href="\/singers\/([a-z0-9-]+)"/g)].map(
      (m) => m[1],
    );
    expect(slugs.length).toBeGreaterThanOrEqual(VOICE_KINDS.length);
    const known = new Set(SINGERS.map((s) => s.slug));
    const dead = slugs.filter((s) => !known.has(s));
    expect(dead, `example singers with no page: ${dead.join(", ")}`).toEqual([]);
  });

  it("keeps the atlas's hedge rather than presenting the bands as limits", () => {
    // The chapter's argument is the reason this page is allowed to exist.
    expect(text.toLowerCase()).toContain("different measurements");
  });
});

describe("generated prose stays true to the data", () => {
  it("only claims the library runs outside the band where it actually does", () => {
    // Every per-type FAQ answer ends by asserting the cited ranges run "well
    // outside the conventional band at both ends". That is true of all eight
    // categories today, with margin — but it is generated prose about a
    // dataset that changes, and a library edit could turn it into a plain
    // falsehood on a page whose whole argument is measurement honesty.
    const failing = VOICE_KINDS.filter((v) => {
      const group = singersByVoiceType(v);
      const band = REFERENCE_BANDS[v];
      return (
        Math.min(...group.map((s) => s.lowMidi)) >= band.low ||
        Math.max(...group.map((s) => s.highMidi)) <= band.high
      );
    });
    expect(
      failing,
      `the page asserts these run outside the band at both ends, and they no longer do: ${failing.join(", ")}`,
    ).toEqual([]);
  });
});

describe("structured data", () => {
  it("emits an FAQPage whose questions are all visible on the page", () => {
    const faq = node("FAQPage");
    expect(faq).toBeTruthy();
    const entities = (faq as unknown as {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    }).mainEntity;
    expect(entities.length).toBeGreaterThanOrEqual(VOICE_KINDS.length);
    const missing = entities.filter((q) => !text.includes(q.name));
    expect(
      missing.map((q) => q.name),
      "FAQ questions in the graph but not rendered",
    ).toEqual([]);
    // Answers too — schema that does not match visible content is a violation.
    const orphanAnswers = entities.filter(
      (q) => !text.includes(q.acceptedAnswer.text.slice(0, 60)),
    );
    expect(
      orphanAnswers.map((q) => q.name),
      "FAQ answers in the graph but not rendered",
    ).toEqual([]);
  });

  it("asks one question per voice type, phrased as the query", () => {
    const names = (node("FAQPage") as unknown as { mainEntity: { name: string }[] })
      .mainEntity.map((q) => q.name.toLowerCase());
    const uncovered = VOICE_KINDS.filter(
      (v) => !names.some((n) => n.includes(v.toLowerCase())),
    );
    expect(uncovered, `no FAQ entry for: ${uncovered.join(", ")}`).toEqual([]);
  });

  it("references the Organization by @id and never redeclares it", () => {
    const declared = graph["@graph"].filter(
      (n) => n["@type"] === "Organization" || n["@type"] === "Person",
    );
    expect(
      declared,
      "this page must join the estate entity, not fork it",
    ).toEqual([]);
    expect(JSON.stringify(graph)).toContain(ORG_ID);
  });

  it("declares the page and points it at its own FAQ", () => {
    const page = node("WebPage") as unknown as {
      url: string;
      mainEntity: { "@id": string };
      isPartOf: { "@id": string };
    };
    expect(page.url).toBe(URL);
    expect(page.mainEntity["@id"]).toBe(`${URL}#faq`);
    expect(page.isPartOf["@id"]).toBe(`${SITE_URL}/#website`);
  });
});

describe("discoverability", () => {
  it("is in the sitemap exactly once", () => {
    const hits = sitemap().filter((e) => e.url === URL);
    expect(hits.length).toBe(1);
  });

  it("declares itself canonical at its own URL", () => {
    expect(metadata.alternates?.canonical).toBe(URL);
  });

  it("is not noindexed", () => {
    expect(metadata.robots).toBeUndefined();
  });
});
