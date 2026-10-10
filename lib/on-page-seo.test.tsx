/**
 * On-page SEO contract for the core product pages.
 *
 * lib/keyword-title-alignment.test.tsx accepts a lead term in the title *or*
 * a literal H1 in the page source, and lib/route-metadata.test.tsx holds the
 * length budget. Neither looks at what a crawler actually reads first: the
 * server-rendered <h1>. Ten of these routes shipped one-word H1s ("Tools",
 * "Breath", "Recorder", "Progress") because the heading lives in a client
 * component the source scan cannot see, and /songs rendered "Song practice"
 * for a page whose title and keyword map say "public domain songs to sing".
 *
 * So this renders each page with renderToStaticMarkup (the server pass, before
 * hydration) and holds every route to one shape:
 *
 *  - exactly one <h1>, containing the route's primary term from
 *    ROUTE_KEYWORDS (or a variant listed here), and not a copy of the title;
 *  - a title that leads with that term and fits the 60-character budget;
 *  - a description that carries the term early and states the free/Pro
 *    boundary lib/free-cap.ts actually enforces;
 *  - headings that never skip a level;
 *  - for the guided rooms, a WebPage entity named exactly what the title says.
 */
import { renderToStaticMarkup } from "react-dom/server";
import type { Metadata } from "next";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { ROUTE_KEYWORDS, type KeywordRoute } from "@/lib/keywords";
import { MAX_TITLE, TITLE_SUFFIX } from "@/lib/meta-fit";
import { TOOL_GUIDES } from "@/lib/guides";

type PageModule = { default: ComponentType; metadata: Metadata };

interface RouteSpec {
  load: () => Promise<PageModule>;
  /** Approved natural variants of the primary term, for the H1. */
  h1Variants?: string[];
  /** Approved variants for the description, when the exact term reads badly. */
  descriptionVariants?: string[];
  /** Which side of lib/free-cap.ts the room sits on, when it is a room. */
  cap?: "capped" | "uncapped";
}

const ROUTES: Record<string, RouteSpec> = {
  "/": { load: () => import("@/app/page") as Promise<PageModule> },
  "/range": { load: () => import("@/app/range/page") as Promise<PageModule>, cap: "uncapped" },
  "/studio": { load: () => import("@/app/studio/page") as Promise<PageModule>, cap: "uncapped" },
  "/warmups": { load: () => import("@/app/warmups/page") as Promise<PageModule>, cap: "capped" },
  "/ear-training": {
    load: () => import("@/app/ear-training/page") as Promise<PageModule>,
    cap: "capped",
  },
  "/breath": { load: () => import("@/app/breath/page") as Promise<PageModule>, cap: "capped" },
  "/songs": { load: () => import("@/app/songs/page") as Promise<PageModule>, cap: "capped" },
  "/recorder": {
    load: () => import("@/app/recorder/page") as Promise<PageModule>,
    // lib/query-ownership.ts pins "voice recorder for singers" as the phrase
    // that separates this description from /tools and /analyze.
    descriptionVariants: ["voice recorder for singers"],
    cap: "uncapped",
  },
  "/tools": { load: () => import("@/app/tools/page") as Promise<PageModule>, cap: "uncapped" },
  "/analyze": { load: () => import("@/app/analyze/page") as Promise<PageModule>, cap: "uncapped" },
  "/programs": { load: () => import("@/app/programs/page") as Promise<PageModule> },
  "/progress": { load: () => import("@/app/progress/page") as Promise<PageModule> },
  "/voice": { load: () => import("@/app/voice/page") as Promise<PageModule> },
  "/extension": { load: () => import("@/app/extension/page") as Promise<PageModule> },
  "/pro": { load: () => import("@/app/pro/page") as Promise<PageModule> },
  "/contact": { load: () => import("@/app/contact/page") as Promise<PageModule> },
  "/changelog": { load: () => import("@/app/changelog/page") as Promise<PageModule> },
};

/** Entities decoded, tags stripped, whitespace collapsed. */
function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;|&apos;|&rsquo;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Case, hyphens and punctuation ignored: "Warm-Up" = "warm up". */
function norm(value: string): string {
  return value
    .toLowerCase()
    .replace(/[‘’']/g, "")
    .replace(/[^\p{L}\p{N}&]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shippedTitle(meta: Metadata): string {
  const t = meta.title;
  if (typeof t === "string") return `${t}${TITLE_SUFFIX}`;
  if (t && typeof t === "object" && "absolute" in t && t.absolute) return t.absolute;
  throw new Error("route declares no title");
}

/** The title without the site name, which is what names the page entity. */
function titleBody(title: string): string {
  return title.replace(/\s*[·|]\s*Suede Sing$/, "");
}

function headings(html: string): { level: number; text: string }[] {
  return [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({
    level: Number(m[1]),
    text: text(m[2]),
  }));
}

/** Claims these pages may not make, in metadata or the first screen. */
const BANNED = [/\bbest\b/i, /#1\b/, /\bunlimited\b/i, /\d+(?:\.\d+)?\s?%/];

describe.each(Object.entries(ROUTES))("%s", (route, spec) => {
  const primary = ROUTE_KEYWORDS[route as KeywordRoute][0];

  async function page() {
    const mod = await spec.load();
    const Page = mod.default;
    const html = renderToStaticMarkup(<Page />);
    const title = shippedTitle(mod.metadata);
    const description = String(mod.metadata.description ?? "");
    return { html, title, description };
  }

  it("server-renders exactly one H1, carrying the primary term", async () => {
    const { html, title } = await page();
    const h1s = headings(html).filter((h) => h.level === 1);
    expect(h1s.map((h) => h.text), `${route} H1s`).toHaveLength(1);
    const h1 = norm(h1s[0].text);
    const needles = [primary, ...(spec.h1Variants ?? [])].map(norm);
    expect(
      needles.some((n) => h1.includes(n)),
      `${route}: H1 "${h1s[0].text}" lacks "${primary}"`,
    ).toBe(true);
    expect(h1, `${route}: the H1 repeats the title`).not.toBe(norm(titleBody(title)));
  });

  it("leads the title with the primary term, inside the budget", async () => {
    const { title } = await page();
    expect(title.length, title).toBeLessThanOrEqual(MAX_TITLE);
    expect(norm(title).startsWith(norm(primary)), `${route}: "${title}"`).toBe(true);
  });

  it("puts the primary term early in a snippet-length description", async () => {
    const { description } = await page();
    expect(description.length, description).toBeGreaterThanOrEqual(70);
    expect(description.length, description).toBeLessThanOrEqual(155);
    const opening = norm(description.slice(0, 90));
    const needles = [primary, ...(spec.descriptionVariants ?? [])].map(norm);
    expect(
      needles.some((n) => opening.includes(n)),
      `${route}: "${primary}" not early in "${description}"`,
    ).toBe(true);
  });

  it("states the free boundary lib/free-cap.ts enforces", async () => {
    const { description } = await page();
    if (spec.cap === "capped") {
      // Warmups, ear training, breath and songs share five minutes a day.
      expect(description).toMatch(/\b(?:5|five) free minutes a day\b/i);
    } else if (spec.cap === "uncapped") {
      expect(description).toMatch(/\bfree\b/i);
      expect(description, `${route} has no daily clock`).not.toMatch(/minutes a day/i);
    }
  });

  it("makes no superlative, unlimited or percentage claim up front", async () => {
    const { html, title, description } = await page();
    const h1 = headings(html).find((h) => h.level === 1)?.text ?? "";
    for (const surface of [title, description, h1]) {
      for (const banned of BANNED) expect(surface, `${route}: ${banned}`).not.toMatch(banned);
    }
  });

  it("never skips a heading level", async () => {
    const { html } = await page();
    const levels = headings(html).map((h) => h.level);
    expect(levels[0], `${route}: first heading`).toBe(1);
    const skips = levels.flatMap((level, i) =>
      i > 0 && level > levels[i - 1] + 1 ? [`h${levels[i - 1]} -> h${level}`] : [],
    );
    expect(skips, route).toEqual([]);
  });
});

describe("guided rooms name their WebPage after the title", () => {
  it.each(TOOL_GUIDES.map((g) => [g.path, g] as const))("%s", async (path, guide) => {
    const spec = ROUTES[path];
    expect(spec, `${path} must be covered above`).toBeTruthy();
    const mod = await spec.load();
    expect(guide.pageName).toBe(titleBody(shippedTitle(mod.metadata)));
  });
});
