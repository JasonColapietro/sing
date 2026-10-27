import { tryToParsePath } from "next/dist/lib/try-to-parse-path";
import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";
import { EXERCISES } from "./components/warmups/exercises";
import { PROGRAMS } from "./lib/programs";
import { PROGRAM_IDS } from "./lib/program-ids";

/** A rule's `source`, compiled the way Next compiles it (path-to-regexp). */
function compileSource(source: string): RegExp {
  const { regexStr, error } = tryToParsePath(source);
  if (!regexStr) throw error ?? new Error(`Next cannot parse source "${source}"`);
  return new RegExp(regexStr);
}

describe("response headers", () => {
  it("hardens every response, and leaves the microphone to the studio", async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const site = rules.find((r) => r.source === "/:path*");
    expect(site?.headers).toEqual(
      expect.arrayContaining([
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=()" },
        // Nothing embeds the site (the extension runs its own analysis in a
        // side panel; Stripe Checkout is hosted), so frames stay same-origin.
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
      ]),
    );
    // The studio, range test and recorder open the mic: the policy may name
    // it, but never deny it.
    const permissions = site?.headers.find((h) => h.key === "Permissions-Policy")?.value ?? "";
    expect(permissions).toMatch(/\bmicrophone=\(self\)/);
    expect(permissions).not.toMatch(/\bmicrophone=\(\)/);
    // A CSP is its own project (inline JSON-LD, pre-paint and Stripe scripts).
    expect(site?.headers.map((h) => h.key)).not.toContain("Content-Security-Policy");
    const pattern = compileSource(site!.source);
    for (const p of ["/", "/pro", "/singers/adele", "/api/checkout", "/robots.txt"]) {
      expect(pattern.test(p), p).toBe(true);
    }
  });

  it("caches the image files in public/ for a year, and nothing that changes in place", async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const cache = rules.filter((r) => r.headers.some((h) => h.key === "Cache-Control"));
    expect(cache).toHaveLength(1);
    expect(cache[0].headers).toEqual([
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ]);
    const pattern = compileSource(cache[0].source);
    for (const p of [
      "/icon-192.png",
      "/icon-maskable.png",
      "/apple-touch-icon.png",
      "/app-store-badge.svg",
      "/founder-portrait.jpg",
      "/shot-01-start-the-session.png",
      "/suede-logo.png",
      "/favicon.ico",
      "/icon.png",
      "/fonts/x.woff2",
    ]) {
      expect(pattern.test(p), p).toBe(true);
    }
    // A fixed URL whose body changes keeps Next's must-revalidate: pages,
    // the generated cards, the optimizer, the IndexNow key, the manifest,
    // llms.txt, the sitemaps, the audio.
    for (const p of [
      "/",
      "/pro",
      "/pro.rsc",
      "/opengraph-image",
      "/pro/opengraph-image/abc",
      "/_next/image",
      "/79cdb9d5873525c71a296b9d7c494bf9.txt",
      "/manifest.webmanifest",
      "/llms.txt",
      "/sitemap.xml",
      "/ai-instructions.html",
      "/audio/warmups/x.mp3",
    ]) {
      expect(pattern.test(p), p).toBe(false);
    }
  });

  it("keeps optimized images for thirty days", () => {
    expect(nextConfig.images?.minimumCacheTTL).toBe(30 * 24 * 60 * 60);
  });
});

describe("raw Vercel host redirects", () => {
  it("canonicalizes every path before Proxy and Clerk run", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toContainEqual({
      source: "/:path*",
      has: [{ type: "host", value: ".+\\.vercel\\.app" }],
      destination: "https://sing.suedeai.ai/:path*",
      permanent: true,
    });
  });
});

describe("warmup path redirects", () => {
  it("sends /warmups/<exercise id> to the room's ?exercise= deep link", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];
    const rule = redirects.find((r) => r.source.startsWith("/warmups/"));
    expect(rule?.destination).toBe("/warmups?exercise=:exercise");
    expect(rule?.permanent).toBe(false);
    const pattern = new RegExp(`^/warmups/${rule!.source.slice("/warmups/:exercise".length)}$`);
    expect(pattern.test("/warmups/five-note-scale")).toBe(true);
    for (const e of EXERCISES) expect(pattern.test(`/warmups/${e.id}`)).toBe(true);
    expect(pattern.test("/warmups/typo")).toBe(false);
  });
});

describe("program deep link", () => {
  it("lists every program's id, for the config that cannot load lib/programs.ts", () => {
    expect([...PROGRAM_IDS]).toEqual(PROGRAMS.map((p) => p.id));
  });

  it("serves /programs?program=<id> from that program's prerendered page, and an unknown id the list", async () => {
    const rewrites = await nextConfig.rewrites?.();
    // Before the filesystem: /programs is a page, and an afterFiles rewrite
    // never reaches a path a page owns (the deep link kept getting the list).
    expect(Array.isArray(rewrites)).toBe(false);
    const rule = (rewrites as Exclude<typeof rewrites, unknown[] | undefined>)?.beforeFiles?.find((r) => r.source === "/programs");
    expect(rule?.destination).toBe("/programs/:program");
    const has = rule?.has?.[0];
    expect(has).toMatchObject({ type: "query", key: "program" });
    // Next anchors a `has` value and hands its named groups to the destination.
    const pattern = new RegExp(`^${has!.value}$`);
    for (const p of PROGRAMS) expect(pattern.exec(p.id)?.groups?.program).toBe(p.id);
    expect(pattern.test("typo")).toBe(false);
    expect(pattern.test("foundations-2w-typo")).toBe(false);
    expect(pattern.test("")).toBe(false);
  });
});
