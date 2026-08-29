import { NextRequest, type NextFetchEvent } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

  it("sends account backup requests through the exported Clerk proxy", async () => {
    const { default: proxy } = await loadProxy(true);
    await proxy(
      new NextRequest("https://sing.suedeai.ai/api/account/progress"),
      { waitUntil: vi.fn() } as unknown as NextFetchEvent,
    );
    expect(mocks.clerkProxy).toHaveBeenCalledOnce();
  });
});
