import { NextRequest, type NextFetchEvent } from "next/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Clerk and Stripe post to /api/webhooks/* with no session, so the proxy must
 * pass those requests straight through: a 401, or a 307 to Clerk's handshake,
 * would drop every signup, login and purchase report. This runs the real
 * clerkMiddleware (proxy.test.ts mocks it) against a placeholder development
 * key, which is the stricter case: development instances are the ones that
 * redirect document requests to the handshake.
 */

const KEYS = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: `pk_test_${Buffer.from("example.clerk.accounts.dev$").toString("base64")}`,
  CLERK_SECRET_KEY: "sk_test_placeholder_for_proxy_tests",
};
const saved: Record<string, string | undefined> = {};

beforeAll(() => {
  for (const [key, value] of Object.entries(KEYS)) {
    saved[key] = process.env[key];
    process.env[key] = value;
  }
});

afterAll(() => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function webhookDelivery(path: string, headers: Record<string, string>): NextRequest {
  return new NextRequest(`https://sing.suedeai.ai${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "*/*", ...headers },
    body: JSON.stringify({ type: "user.created", data: {} }),
  });
}

describe("proxy and webhook deliveries", () => {
  it.each([
    ["/api/webhooks/clerk", { "svix-id": "msg_1", "svix-timestamp": "1", "svix-signature": "v1,x" }],
    ["/api/webhooks/stripe", { "stripe-signature": "t=1,v1=x" }],
  ])("passes %s through to its route handler", async (path, headers) => {
    vi.resetModules();
    const { default: proxy, config } = await import("./proxy");
    const response = await proxy(webhookDelivery(path, headers), {
      waitUntil: vi.fn(),
    } as unknown as NextFetchEvent);

    // Clerk does see the request (the matcher covers /api), reads it as
    // signed out, and hands it on to the same URL: no 401, no redirect.
    expect(config.matcher).toContain("/(api|trpc)(.*)");
    expect(response).toBeDefined();
    expect(response!.status).toBe(200);
    expect(response!.headers.get("location")).toBeNull();
    expect(response!.headers.get("x-clerk-auth-status")).toBe("signed-out");
    const handedOn =
      response!.headers.get("x-middleware-next") === "1" ||
      response!.headers.get("x-middleware-rewrite") === `https://sing.suedeai.ai${path}`;
    expect(handedOn).toBe(true);
  });
});
