import { describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";

vi.mock("server-only", () => ({}));

import { ROUTE_KEYWORDS } from "@/lib/keywords";
import { SINGERS } from "@/lib/singers";

/**
 * The keyword list is the page's target map, so its lead term has to be the
 * thing the page visibly claims: it must appear in the <title> or the <h1>.
 * Matching ignores case, hyphens and punctuation ("warm-up" = "warm up").
 */

const APP_DIR = join(__dirname, "..", "app");

function norm(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’']/g, "")
    .replace(/[^\p{L}\p{N}&]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleText(meta: Metadata): string {
  const t = meta.title;
  if (!t) return "";
  if (typeof t === "string") return t;
  if ("absolute" in t && t.absolute) return t.absolute;
  if ("default" in t && t.default) return t.default;
  return "";
}

/** Literal H1 text in a page's source: <h1>…</h1> or a PageShell title="…". */
function sourceHeadings(file: string): string[] {
  const src = readFileSync(file, "utf8");
  return [
    ...[...src.matchAll(/<h1[^>]*>([^<{]+)<\/h1>/g)].map((m) => m[1]),
    ...[...src.matchAll(/\btitle="([^"]+)"/g)].map((m) => m[1]),
  ];
}

function leadOf(meta: Metadata): string {
  const k = meta.keywords;
  const list = Array.isArray(k) ? k : typeof k === "string" ? k.split(",") : [];
  return list[0] ?? "";
}

function expectLeadVisible(route: string, lead: string, title: string, headings: string[]) {
  const needle = norm(lead);
  const surfaces = [title, ...headings].map(norm);
  expect(
    surfaces.some((s) => s.includes(needle)),
    `${route}: lead term "${lead}" not in title "${title}" or H1 ${JSON.stringify(headings)}`,
  ).toBe(true);
}

type PageModule = {
  metadata?: Metadata;
  generateMetadata?: (p: { params: Promise<Record<string, string>> }) => Promise<Metadata>;
  generateStaticParams?: () => Record<string, string>[];
};

describe("lead keyword is visible in the title or H1", () => {
  it.each(Object.keys(ROUTE_KEYWORDS))("static route %s", async (route) => {
    const file = join(APP_DIR, route === "/" ? "" : route, "page.tsx");
    expect(existsSync(file), file).toBe(true);
    const mod = (await import(/* @vite-ignore */ file)) as PageModule;
    const meta = mod.metadata ?? (await mod.generateMetadata!({ params: Promise.resolve({}) }));
    expect(leadOf(meta)).toBe(ROUTE_KEYWORDS[route as keyof typeof ROUTE_KEYWORDS][0]);
    // A page without its own title inherits the root layout's default.
    // (Read from source: importing the layout pulls in next/font.)
    const layoutDefault =
      readFileSync(join(APP_DIR, "layout.tsx"), "utf8").match(/\bdefault:\s*"([^"]+)"/)?.[1] ?? "";
    const title = titleText(meta) || layoutDefault;
    expectLeadVisible(route, leadOf(meta), title, sourceHeadings(file));
  });

  const DYNAMIC = [
    "singers/[slug]",
    "singers/genre/[genre]",
    "singers/voice-type/[type]",
    "songs/[slug]",
    "can-you-sing/[slug]",
    "book/[slug]",
    "atlas/[slug]",
    "learn/voice/[stage]",
    "learn/voice/[stage]/[module]",
    "learn/voice/[stage]/[module]/[lesson]",
  ];

  it.each(DYNAMIC)(
    "every indexable %s page",
    async (dir) => {
      const mod = (await import(/* @vite-ignore */ join(APP_DIR, dir, "page.tsx"))) as PageModule;
      const params = mod.generateStaticParams!();
      expect(params.length).toBeGreaterThan(0);
      for (const p of params) {
        const meta = await mod.generateMetadata!({ params: Promise.resolve(p) });
        const robots = meta.robots;
        if (robots && typeof robots === "object" && robots.index === false) continue;
        expectLeadVisible(`${dir} ${JSON.stringify(p)}`, leadOf(meta), titleText(meta), []);
      }
    },
    30_000,
  );
});

describe("singer page snippets", () => {
  it("every singer title starts with \"{Singer} Vocal Range\" and no snippet says pending", async () => {
    const { generateMetadata } = await import("@/app/singers/[slug]/page");
    for (const s of SINGERS) {
      const meta = await generateMetadata({ params: Promise.resolve({ slug: s.slug }) });
      const title = titleText(meta);
      expect(title.startsWith(`${s.name} Vocal Range`), `${s.slug}: ${title}`).toBe(true);
      expect(title.length, s.slug).toBeLessThanOrEqual(60);
      for (const d of [meta.description, meta.openGraph?.description]) {
        expect(d, s.slug).toBeTruthy();
        expect(d, s.slug).not.toMatch(/pending/i);
      }
    }
  });
});
