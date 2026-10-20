/**
 * /ai-instructions is a hand-written static file (public/ai-instructions.html
 * behind a vercel.json rewrite), so none of the metadata the App Router pages
 * inherit from the root layout reaches it. Until 2026-10-18 it shipped with no
 * og:image, no Twitter card and no JSON-LD, the one sitemap URL of 270 that
 * did. These checks hold the file to the same preview set every other page
 * carries, and keep its dates in step with its sitemap entry.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_OG_IMAGE } from "@/lib/og";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";

const html = readFileSync(new URL("../public/ai-instructions.html", import.meta.url), "utf8");
const sitemap = readFileSync(
  new URL("../public/ai-instructions-sitemap.xml", import.meta.url),
  "utf8",
);
const PAGE_URL = "https://sing.suedeai.ai/ai-instructions";

function meta(key: string): string | undefined {
  const re = new RegExp(`<meta (?:name|property)="${key.replace(/[.:]/g, "\\$&")}" content="([^"]*)"`);
  return html.match(re)?.[1];
}

function jsonLd(): Record<string, unknown>[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (m) => JSON.parse(m[1]) as Record<string, unknown>,
  );
}

describe("/ai-instructions static page", () => {
  it("is self-canonical with a matching og:url", () => {
    expect(html).toContain(`<link rel="canonical" href="${PAGE_URL}">`);
    expect(meta("og:url")).toBe(PAGE_URL);
  });

  it("carries the full Open Graph and Twitter preview set", () => {
    for (const key of ["og:title", "og:description", "og:image", "og:type", "og:site_name"]) {
      expect(meta(key), key).toBeTruthy();
    }
    expect(meta("twitter:card")).toBe("summary_large_image");
    expect(meta("twitter:title")).toBe(meta("og:title"));
    expect(meta("twitter:description")).toBe(meta("og:description"));
    expect(meta("twitter:image")).toBe(meta("og:image"));
    // Share scrapers cache the URL, so this static page needs the same
    // content version as App Router pages when the default card changes.
    expect(meta("og:image")).toBe(DEFAULT_OG_IMAGE.url);
  });

  it("keeps the description, og:description and JSON-LD description identical", () => {
    const description = meta("description");
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThanOrEqual(70);
    expect(meta("og:description")).toBe(description);
    expect(jsonLd()[0].description).toBe(description);
  });

  it("ships valid WebPage JSON-LD published by the shared organization node", () => {
    const blocks = jsonLd();
    expect(blocks).toHaveLength(1);
    const page = blocks[0];
    expect(page["@type"]).toBe("WebPage");
    expect(page.url).toBe(PAGE_URL);
    expect(page.isPartOf).toEqual({ "@id": "https://sing.suedeai.ai/#website" });
    expect(page.about).toEqual({ "@id": "https://sing.suedeai.ai/#app" });
    expect(page.publisher).toEqual(ORG_PUBLISHER_NODE);
  });

  it("states the same modified date in the footer, the JSON-LD and the sitemap", () => {
    const modified = String(jsonLd()[0].dateModified);
    expect(modified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(sitemap).toContain(`<lastmod>${modified}</lastmod>`);
    const visible = new Date(`${modified}T12:00:00Z`).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
    expect(html).toContain(`Updated ${visible}.`);
  });
});
