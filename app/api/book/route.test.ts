import { beforeEach, describe, expect, it, vi } from "vitest";

const stripe = vi.hoisted(() => ({
  retrieveSubscription: vi.fn(),
  retrievePaymentIntent: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => null }));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    subscriptions: { retrieve: stripe.retrieveSubscription },
    paymentIntents: { retrieve: stripe.retrievePaymentIntent },
  }),
  isStripeId: (value: unknown, prefix: string) =>
    typeof value === "string" &&
    value.startsWith(prefix) &&
    /^[A-Za-z0-9_]+$/.test(value),
  isOurSubscription: (subscription: { ours?: boolean }) => subscription.ours,
  entitlementFrom: (subscription: { active?: boolean }) => ({
    active: subscription.active === true,
  }),
  entitlementFromLifetime: (payment: { active?: boolean }) => ({
    active: payment.active === true,
  }),
}));

const { POST } = await import("./route");

function request(body: Record<string, unknown>) {
  return POST(
    new Request("https://sing.suedeai.ai/api/book", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  stripe.retrieveSubscription.mockReset().mockResolvedValue({
    id: "sub_legacyAnnual",
    ours: true,
    active: true,
  });
  stripe.retrievePaymentIntent.mockReset().mockResolvedValue({
    id: "pi_lifetime",
    active: true,
  });
});

describe("POST /api/book", () => {
  it("keeps serving chapters to legacy annual subscribers", async () => {
    const response = await request({
      subscriptionId: "sub_legacyAnnual",
      slug: "registers",
    });

    expect(response.status).toBe(200);
    expect(stripe.retrieveSubscription).toHaveBeenCalledWith(
      "sub_legacyAnnual",
      { expand: ["customer"] },
    );
    expect(stripe.retrievePaymentIntent).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      slug: "registers",
      title: "Registers, and why they exist",
    });
  });

  it("serves chapters to an active lifetime purchaser", async () => {
    const response = await request({
      subscriptionId: null,
      paymentIntentId: "pi_lifetime",
      slug: "a-vocabulary-for-tone",
      book: "atlas",
    });

    expect(response.status).toBe(200);
    expect(stripe.retrievePaymentIntent).toHaveBeenCalledWith("pi_lifetime", {
      expand: ["customer", "latest_charge"],
    });
    expect(stripe.retrieveSubscription).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      slug: "a-vocabulary-for-tone",
      title: "A vocabulary for tone",
    });
  });

  it("rejects an ambiguous request carrying both billing references", async () => {
    const response = await request({
      subscriptionId: "sub_legacyAnnual",
      paymentIntentId: "pi_lifetime",
      slug: "registers",
    });

    expect(response.status).toBe(403);
    expect(stripe.retrieveSubscription).not.toHaveBeenCalled();
    expect(stripe.retrievePaymentIntent).not.toHaveBeenCalled();
  });
});
