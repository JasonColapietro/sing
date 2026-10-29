import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import SingersPage from "@/app/singers/page";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { hasDocumentedSourceReview, singerReviewLabel } from "@/lib/singer-evidence";
import { VOCAL_RANGE_PRIORITY_SLUGS } from "@/lib/singer-search-priority";
import { SINGERS, rangeLabel } from "@/lib/singers";
import { SITE_URL } from "@/lib/site";

function graphFrom(html: string) {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("singer hub emitted no JSON-LD");
  return JSON.parse(match[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&")) as {
    "@graph": Array<Record<string, unknown>>;
  };
}

function crawlIndexHtml(html: string) {
  const match = html.match(/<section[^>]*data-singer-crawl-index="true"[^>]*>([\s\S]*?)<\/section>/);
  if (!match) throw new Error("singer hub emitted no compact crawl index");
  return match[1];
}

function reviewedHtml(html: string) {
  const match = html.match(/<section[^>]*data-singer-reviewed="true"[^>]*>([\s\S]*?)<\/section>/);
  if (!match) throw new Error("singer hub emitted no reviewed-profiles section");
  return match[1];
}

const REVIEWED_SLUGS = SINGERS.filter((s) => hasDocumentedSourceReview(s.slug)).map((s) => s.slug);

function searchPriorityHtml(html: string) {
  const match = html.match(/<section[^>]*data-singer-search-priority="true"[^>]*>([\s\S]*?)<\/section>/);
  if (!match) throw new Error("singer hub emitted no search-priority section");
  return match[1];
}

describe("/singers hub schema and crawl discovery", () => {
  const html = renderToStaticMarkup(<SingersPage />);
  const graph = graphFrom(html);

  // The hub used to carry no Organization at all, on the reasoning that a
  // second copy of the estate entity would duplicate the canonical one. What
  // that produced was a `publisher` pointing at an @id the document never
  // defined, so the hub named no publisher to anything reading it on its own.
  // The node below is the shared minimal one, held to that exact shape here so
  // it cannot grow back into a full duplicate, and the payload ceiling still
  // guards the size worry underneath the original rule.
  it("keeps a lean collection graph with a resolvable publisher and no catalog-sized ItemList", () => {
    const types = graph["@graph"].map((node) => node["@type"]);
    const script = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? "";

    expect(types).toContain("CollectionPage");
    expect(types).toContain("WebSite");
    expect(types).toContain("FAQPage");
    expect(JSON.stringify(graph)).not.toContain('"@type":"ItemList"');
    expect(graph["@graph"].filter((node) => node["@type"] === "Organization")).toEqual([
      ORG_PUBLISHER_NODE,
    ]);
    expect(graph["@graph"].find((node) => node["@type"] === "CollectionPage")).toMatchObject({
      isPartOf: { "@id": `${SITE_URL}/#website` },
      publisher: { "@id": "https://suedeai.ai/#organization" },
    });
    expect(script.length).toBeLessThan(5_000);
  });

  it("keeps FAQ schema synchronized with the visible headings", () => {
    const faq = graph["@graph"].find((node) => node["@type"] === "FAQPage") as {
      mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
    };
    const visible = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/&#x27;/g, "'");

    for (const question of faq.mainEntity) {
      expect(visible).toContain(question.name);
      expect(visible).toContain(question.acceptedAnswer.text);
    }
  });

  it("renders each artist once in a compact server-only A-Z crawl index", () => {
    const index = crawlIndexHtml(html);
    const slugs = [...index.matchAll(/href="\/singers\/([a-z0-9-]+)"/g)].map((match) => match[1]);

    expect(slugs).toHaveLength(SINGERS.length);
    expect(new Set(slugs).size).toBe(SINGERS.length);
    expect(new Set(slugs)).toEqual(new Set(SINGERS.map((singer) => singer.slug)));
    const knownSlugs = new Set(SINGERS.map((singer) => singer.slug));
    const allHubSlugs = [...html.matchAll(/href="\/singers\/([a-z0-9-]+)"/g)]
      .map((match) => match[1])
      .filter((slug) => knownSlugs.has(slug));
    expect(allHubSlugs).toHaveLength(
      SINGERS.length + VOCAL_RANGE_PRIORITY_SLUGS.length + REVIEWED_SLUGS.length,
    );
  });

  it("files accented names under their base letter in the A-Z index", () => {
    const initials = [...crawlIndexHtml(html).matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map((m) => m[1]);
    expect(initials.length).toBeGreaterThan(10);
    for (const initial of initials) expect(initial, initial).toMatch(/^[A-Z0-9]$/);
  });

  // The index is for readers too: its visible copy says what a name opens,
  // not that the section exists for crawlers.
  it("introduces the A-Z index to readers without SEO jargon", () => {
    const visible = crawlIndexHtml(html).replace(/<[^>]+>/g, " ");
    expect(visible).not.toMatch(/\bcrawl|\bSEO\b|search engine|\bindexed\b/i);
    expect(visible).toMatch(/reported range/);
  });

  it("gives every documented source review a named link with its status", () => {
    const reviewed = reviewedHtml(html);
    expect(REVIEWED_SLUGS.length).toBeGreaterThan(0);
    for (const slug of REVIEWED_SLUGS) {
      const singer = SINGERS.find((s) => s.slug === slug)!;
      const link = reviewed.match(new RegExp(`<a[^>]*href="/singers/${slug}"[^>]*>([\\s\\S]*?)</a>`))?.[1];
      expect(link, slug).toBeDefined();
      expect(link!.replace(/<[^>]+>/g, ""), slug).toContain(`${singer.name} vocal range`);
      expect(link, slug).toContain(rangeLabel(singer));
      expect(link, slug).toContain(singerReviewLabel(slug));
    }
  });

  it("keeps search-demand implementation details out of the reader-facing section", () => {
    expect(searchPriorityHtml(html)).not.toContain("Google");
  });

  it("gives frequently looked-up singers named exact-answer links", () => {
    const priority = searchPriorityHtml(html);
    const links = [...priority.matchAll(/href="\/singers\/([a-z0-9-]+)"[^>]*>([\s\S]*?)<\/a>/g)];

    expect(VOCAL_RANGE_PRIORITY_SLUGS.length).toBeGreaterThanOrEqual(12);
    expect(VOCAL_RANGE_PRIORITY_SLUGS).toContain("olivia-rodrigo");
    expect(VOCAL_RANGE_PRIORITY_SLUGS).toContain("michael-jackson");
    expect(links.map((match) => match[1])).toEqual([...VOCAL_RANGE_PRIORITY_SLUGS]);
    expect(new Set(VOCAL_RANGE_PRIORITY_SLUGS).size).toBe(VOCAL_RANGE_PRIORITY_SLUGS.length);

    for (const [index, slug] of VOCAL_RANGE_PRIORITY_SLUGS.entries()) {
      const singer = SINGERS.find((candidate) => candidate.slug === slug);
      expect(singer, `${slug} must remain in the singer catalog`).toBeDefined();
      expect(links[index][2].replace(/<[^>]+>/g, "")).toContain(
        `${singer!.name} vocal range`,
      );
      expect(links[index][2]).toContain(rangeLabel(singer!));
    }
  });

  it("lists the frequently looked-up singers after the chart, not above it", () => {
    // The chart (SingersDirectory) mounts where the server leaves a
    // one-screen placeholder, between the voice-type links and this list; on
    // a phone the list above it put the chart five screens down.
    const priority = html.indexOf('data-singer-search-priority="true"');
    expect(priority).toBeGreaterThan(html.indexOf("Browse by voice type"));
    expect(priority).toBeGreaterThan(html.indexOf('data-singer-reviewed="true"'));
    expect(priority).toBeLessThan(html.indexOf('data-singer-crawl-index="true"'));
    // Back from a singer tapped in it returns to that link.
    expect(
      readFileSync(new URL("../components/singers/directory.tsx", import.meta.url), "utf8"),
    ).toContain('"[data-singer-search-priority]"');
  });

  it("holds one empty screen where the chart mounts, so nothing after it shifts in view", () => {
    // With no box in the server HTML, a screen taller than about 1,200px
    // showed the lookups at load and the ~2,500px chart then pushed them down
    // (layout shift 0.1-0.2 at 1024×1366 and 1440×1300).
    const placeholder = '<div aria-hidden="true" class="min-h-screen"></div>';
    const at = html.indexOf(placeholder);
    expect(at, "SingersDirectory renders a one-screen placeholder before mount").toBeGreaterThan(-1);
    expect(at).toBeGreaterThan(html.indexOf("Browse by voice type"));
    expect(at).toBeLessThan(html.indexOf('data-singer-search-priority="true"'));
    expect(html.indexOf(placeholder, at + 1)).toBe(-1);
  });

  it("gives the chart its own heading, between the voice-type list and the chart", () => {
    // Bare, the chart's records strip ran on from the voice-type cards with no
    // gap and no outline entry. The heading is server HTML above the
    // placeholder, so it adds nothing that shifts at hydration.
    const placeholder = '<div aria-hidden="true" class="min-h-screen"></div>';
    const heading = html.indexOf('id="singer-chart"');
    expect(heading).toBeGreaterThan(html.indexOf("Browse by voice type"));
    expect(heading).toBeLessThan(html.indexOf(placeholder));
    expect(html).toMatch(
      /<section aria-labelledby="singer-chart" class="mt-12"><h2 id="singer-chart"[^>]*>Every reported range on one keyboard<\/h2>/,
    );
  });

  it("makes the free range test an immediate next step from the hub", () => {
    expect(html).toContain('href="/range?mode=range#start"');
    expect(html).toContain("Test my vocal range");
    expect(html).toContain("Can you sing it?");
  });
});

describe("the chart's range-test offer", () => {
  it("limits its privacy claim to audio, which is all that stays on the device", () => {
    // The offer renders only after hydration, so it is read from source. The
    // saved range is backed up by Pro sync (lib/sync.ts) and by the account
    // backup (lib/account-backup.ts); only the audio never leaves.
    const source = readFileSync(
      new URL("../components/singers/directory.tsx", import.meta.url),
      "utf8",
    ).replace(/\s+/g, " ");
    expect(source).toContain(
      "Your own range can sit on this chart: the test takes about two minutes, and your audio never leaves your device.",
    );
    expect(source).not.toMatch(/two minutes and never leaves your device/);
  });
});
