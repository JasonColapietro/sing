/**
 * Search metadata, checked on every indexable URL the app generates.
 *
 * The length rules in lib/meta-fit.ts were enforced only where a template
 * happened to call them, and nothing checked uniqueness at all. The voice
 * course showed the gap: fitTitle() cut 94 of 102 lesson titles back to a
 * bare phrase, which left one lesson sharing its exact <title> with its own
 * module page, and 64 lesson descriptions under 100 characters.
 *
 * This walks app/ for every page.tsx, expands each dynamic route through its
 * generateStaticParams, resolves the metadata the route would ship, and holds
 * every page that is not robots-noindexed to the same contract the sitemap
 * relies on: a title inside the result-page budget, a description of snippet
 * length, both unique across the site, and a canonical that Open Graph agrees
 * with, under the site's name.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { MAX_DESCRIPTION, MAX_TITLE, TITLE_SUFFIX } from "@/lib/meta-fit";
import { OG_SITE_NAME } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

const APP_DIR = path.join(__dirname, "..", "app");

/** Shorter than this and a description is a fragment, not a snippet. */
const MIN_DESCRIPTION = 70;

type PageModule = {
  metadata?: Metadata;
  generateMetadata?: (p: { params: Promise<Record<string, string>> }) => Promise<Metadata>;
  generateStaticParams?: () => Record<string, string>[] | Promise<Record<string, string>[]>;
};

function pageFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return pageFiles(full);
    return entry === "page.tsx" ? [full] : [];
  });
}

/** The <title> a route ships, with the root layout's template applied. */
function shippedTitle(meta: Metadata, layoutDefault: string): string {
  const t = meta.title;
  if (typeof t === "string") return `${t}${TITLE_SUFFIX}`;
  if (t && "absolute" in t && t.absolute) return t.absolute;
  return layoutDefault;
}

function isNoindex(robots: Metadata["robots"]): boolean {
  if (!robots) return false;
  if (typeof robots === "string") return /\b(?:noindex|none)\b/i.test(robots);
  return robots.index === false;
}

interface RouteMeta {
  route: string;
  title: string;
  description: string;
  canonical: string | undefined;
  ogUrl: string | undefined;
  siteName: string | undefined;
}

async function indexableRoutes(): Promise<RouteMeta[]> {
  // Read from source: importing the layout pulls in next/font.
  const layoutDefault =
    readFileSync(path.join(APP_DIR, "layout.tsx"), "utf8").match(/\bdefault:\s*"([^"]+)"/)?.[1] ?? "";
  const out: RouteMeta[] = [];
  for (const file of pageFiles(APP_DIR)) {
    const mod = (await import(/* @vite-ignore */ file)) as PageModule;
    const paramsList = mod.generateStaticParams ? await mod.generateStaticParams() : [{}];
    for (const params of paramsList) {
      const meta =
        mod.metadata ?? (await mod.generateMetadata?.({ params: Promise.resolve(params) })) ?? {};
      if (isNoindex(meta.robots)) continue;
      const canonical = meta.alternates?.canonical;
      const og = (meta.openGraph ?? {}) as { url?: string | URL; siteName?: string };
      out.push({
        route: `${path.relative(APP_DIR, path.dirname(file)) || "/"} ${JSON.stringify(params)}`,
        title: shippedTitle(meta, layoutDefault),
        description: typeof meta.description === "string" ? meta.description : "",
        canonical:
          typeof canonical === "string" || canonical instanceof URL
            ? canonical.toString()
            : canonical?.url?.toString(),
        ogUrl: og.url?.toString(),
        siteName: og.siteName,
      });
    }
  }
  return out;
}

function duplicates(routes: RouteMeta[], key: "title" | "description"): Record<string, string[]> {
  const seen = new Map<string, string[]>();
  for (const r of routes) seen.set(r[key], [...(seen.get(r[key]) ?? []), r.route]);
  return Object.fromEntries([...seen].filter(([, rs]) => rs.length > 1));
}

describe("metadata on every indexable route", async () => {
  const routes = await indexableRoutes();

  it("covers the generated families, not just the hand-written pages", () => {
    // Static pages, singer hubs, songs, popular songs and the voice course.
    expect(routes.length).toBeGreaterThan(200);
  });

  it(`keeps every title within ${MAX_TITLE} characters`, () => {
    const long = routes.filter((r) => r.title.length > MAX_TITLE).map((r) => `${r.route}: ${r.title}`);
    expect(long).toEqual([]);
  });

  it(`keeps every description between ${MIN_DESCRIPTION} and ${MAX_DESCRIPTION} characters`, () => {
    const off = routes
      .filter((r) => r.description.length < MIN_DESCRIPTION || r.description.length > MAX_DESCRIPTION)
      .map((r) => `${r.route} (${r.description.length}): ${r.description}`);
    expect(off).toEqual([]);
  });

  it("starts every description with a capital, as a sentence", () => {
    const off = routes.filter((r) => !/^[^a-z]/.test(r.description)).map((r) => `${r.route}: ${r.description}`);
    expect(off).toEqual([]);
  });

  it("gives no two indexable pages the same title", () => {
    expect(duplicates(routes, "title")).toEqual({});
  });

  it("gives no two indexable pages the same description", () => {
    expect(duplicates(routes, "description")).toEqual({});
  });

  it("self-canonicalizes on the site origin, and og:url agrees", () => {
    const off = routes
      .filter((r) => !r.canonical?.startsWith(SITE_URL) || r.ogUrl !== r.canonical)
      .map((r) => `${r.route}: canonical ${r.canonical}, og:url ${r.ogUrl}`);
    expect(off).toEqual([]);
  });

  it("names the site in Open Graph", () => {
    const off = routes.filter((r) => r.siteName !== OG_SITE_NAME).map((r) => r.route);
    expect(off).toEqual([]);
  });
});
