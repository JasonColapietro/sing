/**
 * Guard for the /compare pages: every competitor fact is sourced, competitor
 * pricing reads "Pricing varies" with no dollar figure (owner direction,
 * 2026-11-05),
 * every page is indexable, in the sitemap and in llms.txt, and the copy keeps
 * the house writing rules. Assertions run on renderToStaticMarkup output, the
 * HTML a crawler reads.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import sitemap from "@/app/sitemap";
import HubPage, { metadata as hubMetadata } from "@/app/compare/page";
import ComparisonPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/compare/[slug]/page";
import SiteFooter from "@/components/site-footer";
import HomeComparison from "@/components/landing/comparison";
import {
  COMPARE_PATH,
  COMPARISONS_CHECKED,
  COMPARISONS_CHECKED_LABEL,
  COMPETITORS,
  PRICING_VARIES,
  ROW_KEYS,
  alternativesPath,
  comparisonPages,
  competitorPriceText,
  hubFaq,
  vsPath,
} from "@/lib/comparisons";
import { buildLlmsFullTxt, buildLlmsTxt, SING_HOME } from "@/lib/llms-txt";
import { PRICING, formatPrice } from "@/lib/pro-shared";
import { SITE_URL } from "@/lib/site";

const BANNED = /—|&mdash;|\bmoreover\b|\bdelve|game-changer|\bunlock|\belevate|\bseamless|\blandscape\b|\btapestry\b|it['’]s important to note/i;

/** Suede Sing's own prices are the only dollar figures these pages may print. */
const SUEDE_PRICES = [PRICING.lifetime.amount, PRICING.monthly.amount].map(formatPrice);

/** Any "$" figure left once Suede Sing's own prices are taken out. */
function competitorDollars(text: string): string[] {
  let rest = text;
  for (const p of SUEDE_PRICES) rest = rest.replace(new RegExp(`${p.replace(/[$.]/g, "\\$&")}(?!\\d|\\.\\d)`, "g"), "");
  return rest.match(/\$\s?\d[\d.,]*/g) ?? [];
}

/** Every string inside a value, however deep. */
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

function graph(html: string): Array<Record<string, unknown>> {
  const block = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!block) throw new Error("No JSON-LD emitted");
  return JSON.parse(block[1])["@graph"];
}

async function renderSlug(slug: string): Promise<string> {
  return renderToStaticMarkup(await ComparisonPage({ params: Promise.resolve({ slug }) }));
}

describe("comparison data", () => {
  it("covers six competitors, each with sources and every table row", () => {
    expect(COMPETITORS).toHaveLength(6);
    for (const c of COMPETITORS) {
      expect(c.sources.length, c.slug).toBeGreaterThan(0);
      for (const s of c.sources) expect(s.url, c.slug).toMatch(/^https:\/\//);
      for (const key of ROW_KEYS) expect(c.facts[key].length, `${c.slug} ${key}`).toBeGreaterThan(10);
    }
  });

  it("prices every competitor as \"Pricing varies\" and links its own pricing source", () => {
    expect(PRICING_VARIES).toBe("Pricing varies");
    for (const c of COMPETITORS) {
      expect(c.facts.price, c.slug).toBe(PRICING_VARIES);
      expect(c.pricing.url, c.slug).toMatch(/^https:\/\//);
      expect(c.sources.map((s) => s.url), c.slug).toContain(c.pricing.url);
    }
  });

  it("holds no competitor dollar figure anywhere in the data", () => {
    for (const c of COMPETITORS) expect(competitorDollars(strings(c).join("\n")), c.slug).toEqual([]);
    expect(competitorDollars(strings(hubFaq()).join("\n"))).toEqual([]);
  });

  it("guard catches a competitor figure and spares Suede Sing's own price", () => {
    expect(competitorDollars("Premium+ is $29.99 a month")).toEqual(["$29.99"]);
    expect(competitorDollars(`Suede Pro is ${SUEDE_PRICES[0]} once`)).toEqual([]);
    expect(competitorDollars(`${SUEDE_PRICES[0]}0 a year`)).not.toEqual([]);
  });

  it("generates a vs page and an alternatives page per competitor", () => {
    const slugs = generateStaticParams().map((p) => p.slug);
    expect(slugs).toHaveLength(COMPETITORS.length * 2);
    for (const c of COMPETITORS) {
      expect(slugs).toContain(`suede-sing-vs-${c.slug}`);
      expect(slugs).toContain(`${c.slug}-alternatives`);
    }
  });
});

describe("comparison pages", () => {
  it.each(comparisonPages().map((p) => [p.slug]))("%s renders one h1, a table, FAQ and breadcrumb markup", async (slug) => {
    const html = await renderSlug(slug);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain("<table");
    expect(html).toContain(PRICING_VARIES);
    expect(html).not.toMatch(/as of November 2026/i);
    // No competitor "$" figure in the page, its FAQ answers or its JSON-LD.
    expect(competitorDollars(html), slug).toEqual([]);
    expect(html).toContain('aria-label="Breadcrumb"');
    const nodes = graph(html);
    const faq = nodes.find((n) => n["@type"] === "FAQPage") as { mainEntity: Array<{ name: string }> };
    expect(faq.mainEntity.length).toBeGreaterThanOrEqual(4);
    // Every Question node has a visible heading.
    for (const q of faq.mainEntity) expect(html).toContain(q.name.replace(/'/g, "&#x27;"));
    const page = nodes.find((n) => n["@type"] === "WebPage") as { breadcrumb: { itemListElement: unknown[] } };
    expect(page.breadcrumb.itemListElement).toHaveLength(3);
    expect(html).not.toMatch(BANNED);
  });

  it.each(comparisonPages().map((p) => [p.slug]))("%s is indexable with its own canonical", async (slug) => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug }) });
    expect(meta.robots).toBeUndefined();
    expect(competitorDollars(strings(meta).join("\n")), slug).toEqual([]);
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}${COMPARE_PATH}/${slug}`);
    expect(meta.openGraph?.url).toBe(`${SITE_URL}${COMPARE_PATH}/${slug}`);
  });

  it("links every competitor source on its vs page", async () => {
    for (const c of COMPETITORS) {
      const html = await renderSlug(`suede-sing-vs-${c.slug}`);
      for (const s of c.sources) expect(html, c.slug).toContain(`href="${s.url}"`);
      expect(html, c.slug).toContain(`See ${c.pricing.label}`);
    }
  });
});

describe("the /compare hub", () => {
  const html = renderToStaticMarkup(<HubPage />);

  it("links every vs and alternatives page", () => {
    for (const c of COMPETITORS) {
      expect(html).toContain(`href="${vsPath(c)}"`);
      expect(html).toContain(`href="${alternativesPath(c)}"`);
    }
    expect(html).not.toMatch(BANNED);
  });

  it("prints no competitor dollar figure", () => {
    expect(competitorDollars(html)).toEqual([]);
    expect(competitorDollars(strings(hubMetadata).join("\n"))).toEqual([]);
    for (const c of COMPETITORS) expect(html).toContain(`href="${c.pricing.url}"`);
  });

  it("self-canonicalizes", () => {
    expect(hubMetadata.alternates?.canonical).toBe(`${SITE_URL}${COMPARE_PATH}`);
  });

  it("is linked from the sitewide footer", () => {
    expect(renderToStaticMarkup(<SiteFooter />)).toContain(`href="${COMPARE_PATH}"`);
  });
});

describe("homepage comparison consistency", () => {
  const html = renderToStaticMarkup(<HomeComparison />);

  it("uses the same competitors, facts, pricing sources and reviewed date as the hub", () => {
    expect(html).toContain(COMPARISONS_CHECKED_LABEL);
    expect(html).not.toContain("August 2026");
    expect(html.match(/<tbody\b[^>]*>[\s\S]*?<\/tbody>/)?.[0].match(/<tr\b/g)).toHaveLength(COMPETITORS.length + 1);
    for (const c of COMPETITORS) {
      expect(html).toContain(c.builtFor.replace(/&/g, "&amp;"));
      expect(html).toContain(`href="${vsPath(c)}"`);
      expect(html).toContain(`href="${c.pricing.url}"`);
    }
    expect(competitorDollars(html)).toEqual([]);
    expect(html).not.toMatch(BANNED);
  });
});

describe("sitemap and llms files", () => {
  const urls = new Map(sitemap().map((e) => [e.url, e]));

  it("lists the hub and every comparison page, dated by the fact check", () => {
    expect(urls.get(`${SITE_URL}${COMPARE_PATH}`)?.lastModified).toBe(COMPARISONS_CHECKED);
    for (const p of comparisonPages()) {
      expect(urls.get(`${SITE_URL}${COMPARE_PATH}/${p.slug}`)?.lastModified, p.slug).toBe(COMPARISONS_CHECKED);
    }
  });

  it("advertises every comparison page in llms.txt and carries the facts in llms-full.txt", () => {
    const llms = buildLlmsTxt();
    const full = buildLlmsFullTxt();
    expect(llms).toContain(`${SING_HOME}${COMPARE_PATH}`);
    for (const c of COMPETITORS) {
      expect(llms).toContain(`${SING_HOME}${vsPath(c)}`);
      expect(llms).toContain(`${SING_HOME}${alternativesPath(c)}`);
      expect(full).toContain(competitorPriceText(c));
      for (const s of c.sources) expect(full).toContain(s.url);
    }
    const comparisons = full.slice(full.indexOf("## Singing app comparisons"));
    expect(competitorDollars(comparisons)).toEqual([]);
    expect(competitorDollars(llms)).toEqual([]);
  });
});
