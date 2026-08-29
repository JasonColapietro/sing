import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import SingerPage from "@/app/singers/[slug]/page";
import { SITE_URL } from "@/lib/site";

const REVIEWED_SLUGS = [
  "olivia-rodrigo",
  "reba-mcentire",
  "alex-warren",
  "sam-smith",
  "arijit-singh",
  "adele",
] as const;

const DISPUTED_VOICE_TYPE_COPY = [
  ["olivia-rodrigo", "voice type is disputed"],
  ["reba-mcentire", "do not establish a definitive classical voice type"],
  ["alex-warren", "not a definitive baritone classification"],
  ["sam-smith", "baritone-to-tenor territory"],
  ["arijit-singh", "rich baritone"],
] as const;

const VOICE_TYPE_QUESTION_SLUGS = [
  ["olivia-rodrigo", "Olivia Rodrigo"],
  ["reba-mcentire", "Reba McEntire"],
  ["alex-warren", "Alex Warren"],
  ["sam-smith", "Sam Smith"],
] as const;

async function rendered(slug: string) {
  return renderToStaticMarkup(
    await SingerPage({ params: Promise.resolve({ slug }) }),
  ).replaceAll("&#x27;", "'");
}

function graphFrom(html: string) {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("page emitted no JSON-LD");
  return JSON.parse(
    match[1]
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">"),
  ) as { "@graph": Array<Record<string, unknown>> };
}

describe("singer-page evidence and provenance", () => {
  it.each(REVIEWED_SLUGS)("renders a reviewed Evidence and review card for %s", async (slug) => {
    const html = await rendered(slug);

    expect(html).toContain("Evidence and review");
    expect(html).toContain("Reviewed 2026-08-29");
    expect(html).toContain("Dataset editor: Jason Colapietro");
    expect(html).toContain("Confidence:");
    expect(html).toContain("Methodology");
    expect(html).toContain("Suggest a correction");
    expect(html).toContain("Reported reference span");
  });

  it("renders source links, claim scopes, and score-specific details as visible anchors", async () => {
    const html = await rendered("sam-smith");

    expect(html).toContain('href="https://www.vh1.com/news/np30pw/sam-smith-vocal-coach-joanna-eden-team-celeb"');
    expect(html).toContain('href="https://www.musicnotes.com/sheetmusic/sam-smith/lay-me-down/MN0129167"');
    expect(html).toContain("Written compass for this song arrangement only");
    expect(html).toContain("Song evidence: Lay Me Down");
    expect(html).toContain("Scientific pitch notation as published by the score");
  });

  it("is explicit when an individual singer evidence review is pending", async () => {
    const html = await rendered("rihanna");
    const graph = graphFrom(html);
    const page = graph["@graph"].find((node) => node["@type"] === "WebPage");

    expect(html).toContain("Individual evidence review is pending");
    expect(html).toContain("reported reference span, not an independently verified physiological limit");
    expect(html).toContain("Reported reference span");
    expect(page).not.toHaveProperty("dateModified");
    expect(page).not.toHaveProperty("reviewedBy");
    expect(page).not.toHaveProperty("citation");
  });

  it("uses one breadcrumb source for visible navigation and JSON-LD", async () => {
    const html = await rendered("adele");
    const graph = graphFrom(html);
    const page = graph["@graph"].find((node) => node["@type"] === "WebPage")!;
    const breadcrumb = page.breadcrumb as {
      itemListElement: Array<{ name: string; item: string }>;
    };

    expect(html).toMatch(/<nav[^>]*aria-label="Breadcrumb"/);
    expect(html).toMatch(/href="\/singers"[^>]*>Famous vocal ranges<\/a>/);
    expect(html).toContain("<span aria-current=\"page\">Adele</span>");
    expect(breadcrumb.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Famous vocal ranges",
        item: `${SITE_URL}/singers`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Adele",
        item: `${SITE_URL}/singers/adele`,
      },
    ]);
  });

  it("adds review schema and citations only to dated evidence records", async () => {
    const html = await rendered("adele");
    const graph = graphFrom(html);
    const page = graph["@graph"].find((node) => node["@type"] === "WebPage")!;

    expect(page.dateModified).toBe("2026-08-29");
    expect(page.reviewedBy).toEqual({ "@type": "Person", name: "Jason Colapietro" });
    expect(page.citation).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": "CreativeWork",
          name: "Adele's voice: power, fragile self and authentic artistry",
        }),
      ]),
    );
  });

  it.each(REVIEWED_SLUGS)("does not put unsupported additionalProperty on %s Person schema", async (slug) => {
    const graph = graphFrom(await rendered(slug));
    const person = graph["@graph"].find((node) => node["@type"] === "Person");
    expect(person).not.toHaveProperty("additionalProperty");
  });

  it.each(VOICE_TYPE_QUESTION_SLUGS)("answers the explicit voice-type question for %s", async (slug, name) => {
    const html = await rendered(slug);
    expect(html).toContain(`What voice type is ${name}?`);
  });

  it.each(DISPUTED_VOICE_TYPE_COPY)("makes attributed or disputed language visible for %s", async (slug, wording) => {
    expect(await rendered(slug)).toContain(wording);
  });
});
