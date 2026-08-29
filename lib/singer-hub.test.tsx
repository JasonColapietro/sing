import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import SingersPage from "@/app/singers/page";
import { SINGERS } from "@/lib/singers";
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

describe("/singers hub schema and crawl discovery", () => {
  const html = renderToStaticMarkup(<SingersPage />);
  const graph = graphFrom(html);

  it("keeps a lean collection graph without a catalog-sized ItemList or duplicate Organization", () => {
    const types = graph["@graph"].map((node) => node["@type"]);
    const script = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? "";

    expect(types).toContain("CollectionPage");
    expect(types).toContain("WebSite");
    expect(types).toContain("FAQPage");
    expect(JSON.stringify(graph)).not.toContain('"@type":"ItemList"');
    expect(types).not.toContain("Organization");
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
    expect(allHubSlugs).toHaveLength(SINGERS.length);
  });
});
