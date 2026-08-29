import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const stripe = vi.hoisted(() => ({
  getStripe: vi.fn(),
  retrieveSession: vi.fn(),
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
vi.mock("@/lib/stripe", () => ({
  getStripe: stripe.getStripe,
  isStripeId: (value: unknown, prefix: string) =>
    typeof value === "string" && value.startsWith(prefix),
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

function entitlement(body: unknown) {
  return POST(
    new Request("https://sing.suedeai.ai/api/entitlement", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  for (const mock of Object.values(stripe)) mock.mockReset();
  stripe.getStripe.mockReturnValue({
    checkout: { sessions: { retrieve: stripe.retrieveSession } },
    subscriptions: { retrieve: stripe.retrieveSubscription },
    paymentIntents: { retrieve: stripe.retrievePaymentIntent },
  });
  stripe.isOurSubscription.mockReturnValue(true);
  stripe.isOurLifetimePayment.mockReturnValue(true);
  stripe.emailOf.mockReturnValue("singer@example.com");
  stripe.entitlementFromLifetime.mockReturnValue(lifetimeEntitlement);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/entitlement", () => {
  it("rejects missing billing ids before Stripe configuration is required", async () => {
    stripe.getStripe.mockImplementation(() => {
      throw new Error("STRIPE_SECRET_KEY is not set");
    });

    const response = await entitlement({});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error:
        "Provide a checkout session id, subscription id, or payment intent id.",
    });
    expect(stripe.getStripe).not.toHaveBeenCalled();
  });

  it("confirms an owned lifetime payment from its Checkout Session", async () => {
    const payment = {
      id: "pi_lifetime",
      customer: { id: "cus_owner" },
      latest_charge: { id: "ch_lifetime" },
    };
    stripe.retrieveSession.mockResolvedValue({
      subscription: null,
      payment_intent: payment,
      customer: { id: "cus_owner", email: "singer@example.com" },
      customer_details: { email: "singer@example.com" },
    });

    const response = await entitlement({ sessionId: "cs_lifetime" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(lifetimeEntitlement);
    expect(stripe.retrieveSession).toHaveBeenCalledWith("cs_lifetime", {
      expand: [
        "subscription",
        "customer",
        "payment_intent.latest_charge",
      ],
    });
    expect(stripe.isOurLifetimePayment).toHaveBeenCalledWith(payment);
    expect(stripe.entitlementFromLifetime).toHaveBeenCalledWith(
      payment,
      "singer@example.com",
    );
  });

  it("revalidates a lifetime payment without disclosing restore credentials", async () => {
    const payment = {
      id: "pi_lifetime",
      customer: { id: "cus_owner" },
      latest_charge: { id: "ch_lifetime" },
    };
    stripe.retrievePaymentIntent.mockResolvedValue(payment);

    const response = await entitlement({ paymentIntentId: "pi_lifetime" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ...lifetimeEntitlement,
      customerId: null,
      email: null,
      proKey: null,
    });
    expect(stripe.retrievePaymentIntent).toHaveBeenCalledWith("pi_lifetime", {
      expand: ["customer", "latest_charge"],
    });
    expect(stripe.isOurLifetimePayment).toHaveBeenCalledWith(payment);
  });

  it("preserves status-only revalidation for legacy annual subscriptions", async () => {
    const subscription = {
      id: "sub_legacy_annual",
      customer: { id: "cus_legacy" },
    };
    stripe.retrieveSubscription.mockResolvedValue(subscription);
    stripe.entitlementFrom.mockReturnValue(annualEntitlement);

    const response = await entitlement({
      subscriptionId: "sub_legacy_annual",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ...annualEntitlement,
      customerId: null,
      email: null,
      proKey: null,
    });
    expect(stripe.retrieveSubscription).toHaveBeenCalledWith(
      "sub_legacy_annual",
      { expand: ["customer"] },
    );
    expect(stripe.entitlementFrom).toHaveBeenCalledWith(subscription, null);
  });

  it("rejects a lifetime Checkout Session whose customer does not own the payment", async () => {
    stripe.retrieveSession.mockResolvedValue({
      subscription: null,
      payment_intent: {
        id: "pi_lifetime",
        customer: { id: "cus_someone_else" },
        latest_charge: { id: "ch_lifetime" },
      },
      customer: { id: "cus_owner" },
      customer_details: { email: "singer@example.com" },
    });

    const response = await entitlement({ sessionId: "cs_lifetime" });
    const body = (await response.json()) as { active?: boolean };

    expect(response.status).toBe(200);
    expect(body.active).toBe(false);
    expect(stripe.entitlementFromLifetime).not.toHaveBeenCalled();
  });

  it("rejects a refunded or disputed lifetime payment during revalidation", async () => {
    stripe.retrievePaymentIntent.mockResolvedValue({
      id: "pi_lifetime",
      customer: { id: "cus_owner" },
      latest_charge: { id: "ch_lifetime" },
    });
    stripe.isOurLifetimePayment.mockReturnValue(false);

    const response = await entitlement({ paymentIntentId: "pi_lifetime" });
    const body = (await response.json()) as { active?: boolean };

    expect(response.status).toBe(200);
    expect(body.active).toBe(false);
    expect(stripe.entitlementFromLifetime).not.toHaveBeenCalled();
  });

  it("uses inclusive Pro access copy when Stripe cannot be reached", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    stripe.retrievePaymentIntent.mockRejectedValue(new Error("Stripe is down"));

    const response = await entitlement({ paymentIntentId: "pi_lifetime" });
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(502);
    expect(body.error).toBe(
      "Could not check your Pro access. Try again in a moment.",
    );
  });

  it("treats only a missing Stripe object as inactive", async () => {
    stripe.retrievePaymentIntent.mockRejectedValue({
      type: "StripeInvalidRequestError",
      code: "resource_missing",
    });

    const response = await entitlement({ paymentIntentId: "pi_missing" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ active: false });
  });

  it("keeps other Stripe request errors retryable instead of revoking access", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    stripe.retrievePaymentIntent.mockRejectedValue({
      type: "StripeInvalidRequestError",
      code: "parameter_invalid_integer",
    });

    const response = await entitlement({ paymentIntentId: "pi_lifetime" });

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Could not check your Pro access. Try again in a moment.",
    });
  });
});
