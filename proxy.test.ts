import { NextRequest, type NextFetchEvent } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  accountsReady: true,
  clerkProxy: vi.fn(async () => new Response(null, { status: 204 })),
  clerkMiddleware: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", async (importOriginal) => ({
  createRouteMatcher: (
    (await importOriginal()) as typeof import("@clerk/nextjs/server")
  ).createRouteMatcher,
  clerkMiddleware: mocks.clerkMiddleware,
}));
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

  describe("sign-in gate", () => {
    type Handler = (
      auth: () => Promise<{ userId: string | null }>,
      request: NextRequest,
    ) => Promise<Response | undefined>;

    async function gate(path: string, userId: string | null) {
      await loadProxy(true);
      const handler = mocks.clerkMiddleware.mock.calls[0]?.[0] as Handler;
      return handler(async () => ({ userId }), new NextRequest(`https://sing.suedeai.ai${path}`));
    }

    it("sends a signed-out visitor from a lesson room to sign-in and back", async () => {
      const response = await gate("/studio?note=A4", null);
      expect(response?.status).toBe(307);
      const location = new URL(response!.headers.get("location")!);
      expect(location.pathname).toBe("/sign-in");
      expect(location.searchParams.get("redirect_url")).toBe("/studio?note=A4");
    });

    it.each(["/range", "/learn/voice/breath", "/songs/some-song", "/tools", "/progress"])(
      "gates %s",
      async (path) => {
        expect((await gate(path, null))?.status).toBe(307);
      },
    );

    it.each(["/", "/singers", "/singers/adele", "/pro", "/sign-in", "/atlas", "/api/checkout"])(
      "leaves %s open",
      async (path) => {
        expect(await gate(path, null)).toBeUndefined();
      },
    );

    it("lets a signed-in singer straight through", async () => {
      expect(await gate("/studio", "user_1")).toBeUndefined();
    });

    it("gates nothing while accounts are not configured", async () => {
      const { default: proxy } = await loadProxy(false);
      const response = await proxy(
        new NextRequest("https://sing.suedeai.ai/studio"),
        { waitUntil: vi.fn() } as unknown as NextFetchEvent,
      );
      expect(response?.headers.get("x-middleware-next")).toBe("1");
    });
  });
});
