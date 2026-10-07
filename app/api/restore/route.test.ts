import { beforeEach, describe, expect, it, vi } from "vitest";

const stripe = vi.hoisted(() => ({
  verifyProKey: vi.fn(),
  retrieveSubscription: vi.fn(),
  retrievePaymentIntent: vi.fn(),
  isOurSubscription: vi.fn(),
  isOurLifetimePayment: vi.fn(),
  entitlementFrom: vi.fn(),
  entitlementFromLifetime: vi.fn(),
  emailOf: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => null }));
vi.mock("@/lib/pro-key", () => ({ verifyProKey: stripe.verifyProKey }));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    subscriptions: { retrieve: stripe.retrieveSubscription },
    paymentIntents: { retrieve: stripe.retrievePaymentIntent },
  }),
  isOurSubscription: stripe.isOurSubscription,
  isOurLifetimePayment: stripe.isOurLifetimePayment,
  entitlementFrom: stripe.entitlementFrom,
  entitlementFromLifetime: stripe.entitlementFromLifetime,
  emailOf: stripe.emailOf,
}));

const { POST } = await import("./route");

const lifetimeEntitlement = {
  active: true,
  plan: "lifetime",
  status: "succeeded",
  subscriptionId: null,
  paymentIntentId: "pi_lifetime",
  customerId: "cus_owner",
  email: "singer@example.com",
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  proKey: "suede-pro_lifetime",
};

const annualEntitlement = {
  active: true,
  plan: "annual",
  status: "active",
  subscriptionId: "sub_legacy_annual",
  paymentIntentId: null,
  customerId: "cus_legacy",
  email: "legacy@example.com",
  currentPeriodEnd: "2027-08-23T00:00:00.000Z",
  cancelAtPeriodEnd: false,
  proKey: "suede-pro_annual",
};

function restore(key = "suede-pro_key") {
  return POST(
    new Request("https://sing.suedeai.ai/api/restore", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key }),
    }),
  );
}

beforeEach(() => {
  for (const mock of Object.values(stripe)) mock.mockReset();
  stripe.verifyProKey.mockReturnValue({
    kind: "lifetime",
    customerId: "cus_owner",
    paymentIntentId: "pi_lifetime",
  });
  stripe.isOurLifetimePayment.mockReturnValue(true);
  stripe.emailOf.mockReturnValue("singer@example.com");
  stripe.entitlementFromLifetime.mockReturnValue(lifetimeEntitlement);
});

describe("POST /api/restore", () => {
  it("restores an owned, unreversed lifetime payment", async () => {
    const payment = {
      id: "pi_lifetime",
      customer: { id: "cus_owner", email: "singer@example.com" },
      latest_charge: { id: "ch_lifetime" },
    };
    stripe.retrievePaymentIntent.mockResolvedValue(payment);

    const response = await restore();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(lifetimeEntitlement);
    expect(stripe.retrievePaymentIntent).toHaveBeenCalledWith("pi_lifetime", {
      expand: ["customer", "latest_charge"],
    });
    expect(stripe.isOurLifetimePayment).toHaveBeenCalledWith(payment);
    expect(stripe.entitlementFromLifetime).toHaveBeenCalledWith(
      payment,
      "singer@example.com",
    );
  });

  it("preserves restore for legacy annual subscriptions", async () => {
    const subscription = {
      id: "sub_legacy_annual",
      customer: { id: "cus_legacy", email: "legacy@example.com" },
    };
    stripe.verifyProKey.mockReturnValue({
      kind: "subscription",
      customerId: "cus_legacy",
      subscriptionId: "sub_legacy_annual",
    });
    stripe.retrieveSubscription.mockResolvedValue(subscription);
    stripe.isOurSubscription.mockReturnValue(true);
    stripe.emailOf.mockReturnValue("legacy@example.com");
    stripe.entitlementFrom.mockReturnValue(annualEntitlement);

    const response = await restore();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(annualEntitlement);
    expect(stripe.retrieveSubscription).toHaveBeenCalledWith(
      "sub_legacy_annual",
      { expand: ["customer"] },
    );
    expect(stripe.entitlementFrom).toHaveBeenCalledWith(
      subscription,
      "legacy@example.com",
    );
  });

  it("rejects a lifetime key when its signed customer does not own the payment", async () => {
    stripe.retrievePaymentIntent.mockResolvedValue({
      id: "pi_lifetime",
      customer: { id: "cus_someone_else" },
      latest_charge: { id: "ch_lifetime" },
    });

    const response = await restore();
    const body = (await response.json()) as { active?: boolean; error?: string };

    expect(response.status).toBe(200);
    expect(body.active).toBe(false);
    expect(body.error).toBe(
      "That Pro key doesn't match a Suede Pro lifetime purchase.",
    );
    expect(stripe.entitlementFromLifetime).not.toHaveBeenCalled();
  });

  it("rejects a refunded or disputed lifetime payment", async () => {
    stripe.retrievePaymentIntent.mockResolvedValue({
      id: "pi_lifetime",
      customer: { id: "cus_owner" },
      latest_charge: { id: "ch_lifetime" },
    });
    stripe.isOurLifetimePayment.mockReturnValue(false);

    const response = await restore();
    const body = (await response.json()) as { active?: boolean; error?: string };

    expect(response.status).toBe(200);
    expect(body.active).toBe(false);
    expect(body.error).toBe(
      "That Pro key doesn't match a Suede Pro lifetime purchase.",
    );
  });

  it("reports a missing lifetime PaymentIntent without changing subscription copy", async () => {
    stripe.retrievePaymentIntent.mockRejectedValue({
      type: "StripeInvalidRequestError",
      code: "resource_missing",
    });

    const lifetimeResponse = await restore();
    const lifetimeBody = (await lifetimeResponse.json()) as { error?: string };
    expect(lifetimeBody.error).toBe("That lifetime purchase no longer exists.");

    stripe.verifyProKey.mockReturnValue({
      kind: "subscription",
      customerId: "cus_legacy",
      subscriptionId: "sub_legacy_annual",
    });
    stripe.retrieveSubscription.mockRejectedValue({
      type: "StripeInvalidRequestError",
      code: "resource_missing",
    });

    const subscriptionResponse = await restore();
    const subscriptionBody = (await subscriptionResponse.json()) as {
      error?: string;
    };
    expect(subscriptionBody.error).toBe("That subscription no longer exists.");
  });

  it("keeps non-missing Stripe request errors retryable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    stripe.retrievePaymentIntent.mockRejectedValue({
      type: "StripeInvalidRequestError",
      code: "parameter_unknown",
    });

    const response = await restore();

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Could not reach Stripe. Try again in a moment.",
    });
  });
});
