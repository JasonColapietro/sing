import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  retrieveSubscription: vi.fn(),
  createPortalSession: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => null }));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    subscriptions: { retrieve: dependencies.retrieveSubscription },
    billingPortal: { sessions: { create: dependencies.createPortalSession } },
  }),
  isStripeId: (value: unknown, prefix: string) =>
    typeof value === "string" && value.startsWith(prefix),
  siteOrigin: () => "https://sing.suedeai.ai",
}));

const { POST } = await import("./route");

function request() {
  return POST(
    new Request("https://sing.suedeai.ai/api/portal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ customerId: "cus_a", subscriptionId: "sub_a" }),
    }),
  );
}

function stripeError(code: string) {
  return Object.assign(new Error(code), {
    type: "StripeInvalidRequestError",
    code,
  });
}

beforeEach(() => {
  dependencies.retrieveSubscription
    .mockReset()
    .mockResolvedValue({ id: "sub_a", customer: "cus_a" });
  dependencies.createPortalSession
    .mockReset()
    .mockResolvedValue({ url: "https://billing.stripe.com/p/session" });
});

describe("POST /api/portal", () => {
  it("answers 404 when Stripe no longer has the subscription", async () => {
    dependencies.retrieveSubscription.mockRejectedValue(
      stripeError("resource_missing"),
    );
    const response = await request();
    expect(response.status).toBe(404);
  });

  it("does not blame the subscriber for a portal configuration fault", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    dependencies.createPortalSession.mockRejectedValue(
      stripeError("parameter_invalid_empty"),
    );
    const response = await request();
    expect(response.status).toBe(502);
    expect(console.error).toHaveBeenCalled();
  });

  it("returns the portal url for the subscription's owner", async () => {
    const response = await request();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: "https://billing.stripe.com/p/session",
    });
  });
});
