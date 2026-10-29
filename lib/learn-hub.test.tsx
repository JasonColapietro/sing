import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import LearnPage, { metadata } from "@/app/learn/page";
import sitemap from "@/app/sitemap";
import { SITE_URL } from "@/lib/site";

function graphFrom(html: string) {
  const match = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );
  if (!match) throw new Error("learn hub emitted no JSON-LD");
  return JSON.parse(
    match[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"),
  ) as { "@graph": Array<Record<string, unknown>> };
}

describe("/learn vocal training hub", () => {
  const html = renderToStaticMarkup(<LearnPage />);
  const visible = html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/\s+/g, " ");

  it("owns the broad learn-to-sing intent without displacing a practice room", () => {
    expect(String(metadata.title)).toContain("Learn to Sing");
    expect(metadata.description).toContain("vocal training plan");
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/learn`);
    expect(visible).toContain(
      "This is the map for learning to sing, not another practice room.",
    );
  });

  it("routes every major beginner need to the existing page that owns it", () => {
    for (const href of [
      "/range?mode=range#start",
      "/studio",
      "/warmups",
      "/breath",
      "/ear-training",
      "/songs",
      "/recorder",
      "/analyze",
      "/singers",
      "/atlas/vocal-range-by-voice-type",
      "/glossary",
      "/book",
      "/programs",
    ]) {
      expect(html, `learn hub missing ${href}`).toContain(`href="${href}"`);
    }
  });

  it("keeps its FAQ and learning-path schema synchronized with visible copy", () => {
    const graph = graphFrom(html)["@graph"];
    const types = graph.map((node) => node["@type"]);
    expect(types).toEqual(
      expect.arrayContaining([
        "CollectionPage",
        "BreadcrumbList",
        "ItemList",
        "FAQPage",
      ]),
    );

    const faq = graph.find((node) => node["@type"] === "FAQPage") as {
      mainEntity: Array<{
        name: string;
        acceptedAnswer: { text: string };
      }>;
    };
    for (const question of faq.mainEntity) {
      expect(visible).toContain(question.name);
      expect(visible).toContain(question.acceptedAnswer.text);
    }

    const paths = graph.find((node) => node["@type"] === "ItemList") as {
      itemListElement: Array<{ url: string }>;
    };
    expect(paths.itemListElement).toHaveLength(7);
    for (const path of paths.itemListElement) {
      expect(path.url).toMatch(new RegExp(`^${SITE_URL.replaceAll(".", "\\.")}/`));
      const destination = new URL(path.url);
      // The schema names the canonical page; the card may add the deep link
      // (the range test's ?mode=range#start), which canonicalizes to /range.
      expect(destination.hash, path.url).toBe("");
      expect(destination.search, path.url).toBe("");
      const escaped = destination.pathname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      expect(html).toMatch(new RegExp(`href="${escaped}(\\?[^"#]*)?(#[a-z-]+)?"`));
    }
  });

  it("warms up before each song day of the seven-day plan, in a room with no clock", () => {
    // The page's fundamentals say to warm up before song work, so the two
    // song days do too, and the warm-up spends none of the guided minutes.
    expect(visible).toContain("Use warmups before range, volume, and song work");
    expect(visible).toContain(
      "Warm up first with a few minutes of easy hums and lip trills in the pitch studio, which has no practice timer",
    );
    expect(visible).toContain("After the same short warm-up, record two takes of the same section.");
  });

  it("is published through the sitemap, header, footer and answer-engine guide", () => {
    expect(sitemap()).toContainEqual(
      expect.objectContaining({
        url: `${SITE_URL}/learn`,
        changeFrequency: "weekly",
        priority: 0.9,
      }),
    );

    const nav = readFileSync(
      new URL("../components/nav.tsx", import.meta.url),
      "utf8",
    );
    const footer = readFileSync(
      new URL("../components/site-footer.tsx", import.meta.url),
      "utf8",
    );
    const llms = readFileSync(new URL("./llms-txt.ts", import.meta.url), "utf8");
    expect(nav).toContain('{ href: "/learn", label: "Learn"');
    expect(footer).toContain('{ href: "/learn", label: "Learn to sing" }');
    expect(llms).toContain("[Learn to sing]");
    expect(llms).toContain("${SING_HOME}/learn");
  });
});
