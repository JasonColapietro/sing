import { beforeEach, describe, expect, it, vi } from "vitest";

const stripe = vi.hoisted(() => ({
  createSession: vi.fn(),
  resolvePriceId: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => null }));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    checkout: { sessions: { create: stripe.createSession } },
  }),
  PriceMismatchError: class PriceMismatchError extends Error {},
  PriceNotConfiguredError: class PriceNotConfiguredError extends Error {},
  resolvePriceId: stripe.resolvePriceId,
  siteOrigin: () => "https://sing.suedeai.ai",
}));

const { POST } = await import("./route");

function checkout(plan: unknown) {
  return POST(
    new Request("https://sing.suedeai.ai/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan }),
    }),
  );
}

beforeEach(() => {
  stripe.resolvePriceId.mockReset().mockImplementation(async (plan: string) =>
    plan === "lifetime" ? "price_lifetime" : "price_monthly",
  );
  stripe.createSession.mockReset().mockResolvedValue({
    url: "https://checkout.stripe.com/c/pay/cs_live_should_not_exist",
  });
});

describe("POST /api/checkout", () => {
  it("rejects annual before resolving a price or creating a Stripe session", async () => {
    const response = await checkout("annual");
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(409);
    expect(body.error).toBe(
      "The yearly plan is no longer on sale. Choose monthly or lifetime.",
    );
    expect(stripe.resolvePriceId).not.toHaveBeenCalled();
    expect(stripe.createSession).not.toHaveBeenCalled();
  });

  it("creates a recurring Checkout Session for the Early Access monthly plan", async () => {
    const response = await checkout("monthly");

    expect(response.status).toBe(200);
    expect(stripe.resolvePriceId).toHaveBeenCalledWith("monthly");
    expect(stripe.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: "price_monthly", quantity: 1 }],
        subscription_data: {
          metadata: {
            app: "suede-sing",
            offer: "early-access",
            plan: "monthly",
          },
        },
      }),
    );
  });

  it("creates a one-time Checkout Session for the Early Access lifetime plan", async () => {
    const response = await checkout("lifetime");

    expect(response.status).toBe(200);
    expect(stripe.resolvePriceId).toHaveBeenCalledWith("lifetime");
    expect(stripe.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        payment_method_types: ["card"],
        customer_creation: "always",
        line_items: [{ price: "price_lifetime", quantity: 1 }],
        metadata: {
          app: "suede-sing",
          offer: "early-access",
          plan: "lifetime",
        },
        payment_intent_data: {
          metadata: {
            app: "suede-sing",
            offer: "early-access",
            plan: "lifetime",
          },
        },
      }),
    );
    expect(stripe.createSession.mock.calls[0]?.[0]).not.toHaveProperty(
      "subscription_data",
    );
  });

  it("rejects unknown plans without touching Stripe", async () => {
    const response = await checkout("weekly");
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(body.error).toBe("Choose a monthly or lifetime plan.");
    expect(stripe.resolvePriceId).not.toHaveBeenCalled();
    expect(stripe.createSession).not.toHaveBeenCalled();
  });
});
