import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import ContactPage, { metadata as contactMetadata } from "@/app/contact/page";
import MethodologyPage, {
  metadata as methodologyMetadata,
} from "@/app/singers/methodology/page";
import SingerPage from "@/app/singers/[slug]/page";
import SingersPage from "@/app/singers/page";
import sitemap from "@/app/sitemap";
import SiteFooter from "@/components/site-footer";
import { SINGER_RANGE_DISCLAIMER } from "@/lib/singer-editorial";
import { getSingerLastModified } from "@/lib/singer-evidence";
import { SINGERS } from "@/lib/singers";
import { SITE_URL } from "@/lib/site";

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

function visibleText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&");
}

describe("singer editorial trust routes", () => {
  it("publishes canonical methodology content with the shared range disclaimer", () => {
    const html = renderToStaticMarkup(<MethodologyPage />);

    expect(methodologyMetadata.alternates?.canonical).toBe(`${SITE_URL}/singers/methodology`);
    expect(html).toContain(SINGER_RANGE_DISCLAIMER);
    for (const heading of [
      "Scope of this index",
      "Source hierarchy",
      "Song scores have limited scope",
      "Studio, live, and register distinctions",
      "Disputes, confidence, and human review",
      "Corrections",
      "Reported range is not comfortable tessitura",
    ]) {
      expect(html).toContain(heading);
    }
  });

  it("publishes a canonical correction workflow at the verified support address", () => {
    const html = renderToStaticMarkup(<ContactPage />);

    expect(contactMetadata.alternates?.canonical).toBe(`${SITE_URL}/contact`);
    expect(html).toContain('href="mailto:support@suedeai.ai"');
    for (const field of [
      "Artist or page URL",
      "Disputed claim",
      "Recording or version",
      "Timestamp",
      "Supporting URL",
      "Suggested correction",
    ]) {
      expect(html).toContain(field);
    }
  });

  it("uses the same disclaimer on the singer hub and an artist page", async () => {
    const hub = renderToStaticMarkup(<SingersPage />);
    const artist = renderToStaticMarkup(
      await SingerPage({ params: Promise.resolve({ slug: "adele" }) }),
    );

    expect(hub).toContain(SINGER_RANGE_DISCLAIMER);
    expect(artist).toContain(SINGER_RANGE_DISCLAIMER);
  });

  it("renders every singer hub FAQ question as a visible heading with matching schema text", () => {
    const html = renderToStaticMarkup(<SingersPage />);
    const visible = visibleText(html);
    const graph = graphFrom(html);
    const faq = graph["@graph"].find((node) => node["@type"] === "FAQPage") as {
      mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
    };

    expect(faq.mainEntity.length).toBeGreaterThan(0);
    for (const item of faq.mainEntity) {
      expect(visible).toContain(`<h3 class="text-sm font-medium">${item.name}</h3>`);
      expect(visible).toContain(item.acceptedAnswer.text);
    }
  });

  it("links the methodology and correction routes from the server-rendered footer", () => {
    const html = renderToStaticMarkup(<SiteFooter />);

    expect(html).toContain('href="/singers/methodology"');
    expect(html).toContain('href="/contact"');
  });
});

describe("singer sitemap editorial freshness", () => {
  it("lists each editorial route exactly once", () => {
    const entries = sitemap();
    for (const path of ["/singers/methodology", "/contact"]) {
      expect(entries.filter((entry) => entry.url === `${SITE_URL}${path}`)).toHaveLength(1);
    }
  });

  it("uses only explicit evidence review dates and omits freshness for pending singers", () => {
    const entries = sitemap();
    const reviewed = SINGERS.filter((singer) => getSingerLastModified(singer.slug));
    const pending = SINGERS.filter((singer) => !getSingerLastModified(singer.slug));

    expect(reviewed.length).toBeGreaterThan(0);
    expect(pending.length).toBeGreaterThan(0);
    for (const singer of reviewed) {
      const entry = entries.find((item) => item.url === `${SITE_URL}/singers/${singer.slug}`)!;
      expect(entry.lastModified).toBe(getSingerLastModified(singer.slug));
    }
    for (const singer of pending) {
      const entry = entries.find((item) => item.url === `${SITE_URL}/singers/${singer.slug}`)!;
      expect(entry).not.toHaveProperty("lastModified");
    }

    const sitemapSource = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");
    expect(sitemapSource).not.toMatch(/Date\.now|new Date\(/);
  });
});
