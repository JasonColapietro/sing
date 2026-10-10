/**
 * Preview directives on every indexable route.
 *
 * max-image-preview:large (with unlimited snippet and video previews) lives on
 * the root layout's robots. Next merges metadata shallowly, so a page that sets
 * `robots` itself, even to `undefined`, replaces the layout's value and would
 * silently drop the directive. This walks app/ for every page.tsx, expands
 * dynamic routes through generateStaticParams, works out the robots each URL
 * actually ships (the page's own if it sets the key, else the layout's), and
 * holds indexable pages to the directive while noindexed ones stay noindexed.
 */
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
// The layout's fonts are build-time only; stub them so its metadata imports.
vi.mock("next/font/google", () => ({
  Manrope: () => ({ variable: "" }),
  IBM_Plex_Mono: () => ({ variable: "" }),
}));

import { metadata as layoutMetadata } from "@/app/layout";
import { isSingerReviewed } from "@/lib/singer-evidence";
import { INDEXABLE_ROBOTS, NOINDEX_FOLLOW, pageRobots } from "@/lib/robots-meta";

const APP_DIR = path.join(__dirname, "..", "app");

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

function isNoindex(robots: Metadata["robots"]): boolean {
  if (!robots) return false;
  if (typeof robots === "string") return /\b(?:noindex|none)\b/i.test(robots);
  return robots.index === false;
}

function hasPreviewDirectives(robots: Metadata["robots"]): boolean {
  if (!robots || typeof robots === "string") return false;
  return (
    robots["max-image-preview"] === "large" &&
    robots["max-snippet"] === -1 &&
    robots["max-video-preview"] === -1
  );
}

interface ShippedRobots {
  route: string;
  params: Record<string, string>;
  robots: Metadata["robots"];
}

async function shippedRobots(): Promise<ShippedRobots[]> {
  const out: ShippedRobots[] = [];
  for (const file of pageFiles(APP_DIR)) {
    const mod = (await import(/* @vite-ignore */ file)) as PageModule;
    const paramsList = mod.generateStaticParams ? await mod.generateStaticParams() : [{}];
    for (const params of paramsList) {
      const meta =
        mod.metadata ?? (await mod.generateMetadata?.({ params: Promise.resolve(params) })) ?? {};
      out.push({
        route: `/${path.relative(APP_DIR, path.dirname(file))} ${JSON.stringify(params)}`,
        params,
        // Shallow merge: the key's presence, not its value, decides who wins.
        robots: "robots" in meta ? meta.robots : layoutMetadata.robots,
      });
    }
  }
  return out;
}

describe("robots preview directives", async () => {
  const routes = await shippedRobots();
  const indexable = routes.filter((r) => !isNoindex(r.robots));

  it("puts the directives on the root layout", () => {
    expect(layoutMetadata.robots).toEqual(INDEXABLE_ROBOTS);
    expect(hasPreviewDirectives(layoutMetadata.robots)).toBe(true);
  });

  it("covers the generated families, not just the hand-written pages", () => {
    expect(indexable.length).toBeGreaterThan(200);
  });

  it("keeps max-image-preview:large on every indexable route", () => {
    const missing = indexable.filter((r) => !hasPreviewDirectives(r.robots)).map((r) => r.route);
    expect(missing).toEqual([]);
  });

  it("keeps singer pages pending review noindexed, and reviewed ones indexable", () => {
    const singers = routes.filter((r) => r.route.startsWith("/singers/[slug] "));
    const pending = singers.filter((r) => !isSingerReviewed(r.params.slug));
    const reviewed = singers.filter((r) => isSingerReviewed(r.params.slug));
    expect(pending.length).toBeGreaterThan(0);
    expect(reviewed.length).toBeGreaterThan(0);
    for (const r of pending) expect(r.robots, r.route).toEqual(NOINDEX_FOLLOW);
    for (const r of reviewed) expect(hasPreviewDirectives(r.robots), r.route).toBe(true);
  });

  it("keeps the account pages out of the index", () => {
    const auth = routes.filter((r) => /^\/sign-(?:in|up)\//.test(r.route));
    expect(auth.length).toBe(2);
    for (const r of auth) expect(isNoindex(r.robots), r.route).toBe(true);
  });
});

describe("pageRobots", () => {
  it("gives indexable pages the layout's directives and the rest noindex, follow", () => {
    expect(pageRobots(true)).toEqual(INDEXABLE_ROBOTS);
    expect(pageRobots(false)).toEqual({ index: false, follow: true });
  });
});
