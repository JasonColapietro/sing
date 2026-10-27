import { tryToParsePath } from "next/dist/lib/try-to-parse-path";
import { NextRequest, type NextFetchEvent } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A matcher entry compiled the way Next compiles it at build time
 * (path-to-regexp via next/dist/lib/try-to-parse-path), then tested against
 * the request pathname as getMiddlewareRouteMatcher does. Next also wraps
 * the source with its data-route affixes (`_next/data`, `.rsc`); those add
 * paths, never remove any, so the bare source is the stricter check.
 */
function compileMatcher(source: string): RegExp {
  const { regexStr, error } = tryToParsePath(source);
  if (!regexStr) throw error ?? new Error(`Next cannot parse matcher "${source}"`);
  return new RegExp(regexStr);
}

const mocks = vi.hoisted(() => ({
  accountsReady: true,
  clerkProxy: vi.fn(async () => new Response(null, { status: 204 })),
  clerkMiddleware: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ clerkMiddleware: mocks.clerkMiddleware }));
vi.mock("@/lib/accounts", () => ({ accountsReady: () => mocks.accountsReady }));

async function loadProxy(accountsReady: boolean) {
  vi.resetModules();
  mocks.accountsReady = accountsReady;
  return import("./proxy");
}

describe("proxy Clerk integration", () => {
  beforeEach(() => {
    mocks.clerkProxy.mockClear();
    mocks.clerkMiddleware.mockReset().mockReturnValue(mocks.clerkProxy);
  });

  it("exports Clerk's middleware directly when production accounts are ready", async () => {
    const { default: proxy } = await loadProxy(true);
    expect(mocks.clerkMiddleware).toHaveBeenCalledOnce();
    expect(proxy).toBe(mocks.clerkProxy);
  });

  it("keeps canonical-host routes open when accounts are not configured", async () => {
    const { default: proxy } = await loadProxy(false);
    expect(mocks.clerkMiddleware).not.toHaveBeenCalled();
    const response = await proxy(
      new NextRequest("https://sing.suedeai.ai/"),
      { waitUntil: vi.fn() } as unknown as NextFetchEvent,
    );
    expect(response?.headers.get("x-middleware-next")).toBe("1");
  });

  it("explicitly covers API routes in Clerk's matcher", async () => {
    const { config } = await loadProxy(true);
    expect(config.matcher).toContain("/(api|trpc)(.*)");
  });

  it("runs on pages and /api, never on static files or the generated share cards", async () => {
    const { config } = await loadProxy(true);
    const [pages] = Array.isArray(config.matcher) ? config.matcher : [config.matcher];
    expect(typeof pages).toBe("string");
    const matcher = compileMatcher(pages as string);
    for (const p of ["/", "/pro", "/singers/adele", "/api/checkout", "/learn/x/y", "/sign-in"]) {
      expect(matcher.test(p), p).toBe(true);
    }
    // The old list (`_next/static|_next/image|favicon.ico`) sent all of these
    // through Clerk, and on a development instance its handshake redirect
    // bounced robots.txt and sitemap.xml off the domain.
    for (const p of [
      "/robots.txt",
      "/sitemap.xml",
      "/llms.txt",
      "/llms-full.txt",
      "/manifest.webmanifest",
      "/icon.png",
      "/apple-icon.png",
      "/favicon.ico",
      "/app-store-badge.svg",
      "/ai-instructions.html",
      "/ai-instructions-sitemap.xml",
      "/79cdb9d5873525c71a296b9d7c494bf9.txt",
      "/_next/image",
      "/_next/image?x",
      "/_next/static/chunks/a.js",
      "/opengraph-image",
      "/pro/opengraph-image",
      "/singers/adele/opengraph-image/abc",
    ]) {
      expect(matcher.test(p), p).toBe(false);
    }
  });

  it("sends account backup requests through the exported Clerk proxy", async () => {
    const { default: proxy } = await loadProxy(true);
    await proxy(
      new NextRequest("https://sing.suedeai.ai/api/account/progress"),
      { waitUntil: vi.fn() } as unknown as NextFetchEvent,
    );
    expect(mocks.clerkProxy).toHaveBeenCalledOnce();
  });

  it("installs Clerk with no route-protecting handler", async () => {
    await loadProxy(true);
    expect(mocks.clerkMiddleware).toHaveBeenCalledWith();
  });
});
