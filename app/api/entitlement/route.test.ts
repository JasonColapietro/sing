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
// null lets every request through; a test that needs the 429 sets it.
const rate = vi.hoisted(() => ({ limited: null as Response | null }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => rate.limited }));
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
  rate.limited = null;
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

  it("reports an unpaid Checkout Session by its own status, so the browser that began it can forget it", async () => {
    // No PaymentIntent on a payment-mode session: nobody paid. The status
    // ("open" while Stripe's page can still take a card, "expired" after)
    // is what lets resolveStartedCheckout drop an abandoned one quietly.
    stripe.retrieveSession.mockResolvedValue({
      subscription: null,
      payment_intent: null,
      status: "expired",
      customer: null,
      customer_details: null,
    });

    const response = await entitlement({ sessionId: "cs_abandoned" });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ active: false, status: "expired", proKey: null });
    expect(stripe.entitlementFromLifetime).not.toHaveBeenCalled();
  });

  it("keeps an open session with a payment attempt but no customer yet reporting as open", async () => {
    // A declined card or a pending 3D Secure step: Stripe's page is still
    // open, so the browser that began the checkout must not forget it.
    stripe.retrieveSession.mockResolvedValue({
      subscription: null,
      status: "open",
      payment_intent: { id: "pi_attempt", status: "requires_action", customer: null, latest_charge: null },
      customer: null,
      customer_details: null,
    });

    const response = await entitlement({ sessionId: "cs_attempt" });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ active: false, status: "open" });
    expect(stripe.entitlementFromLifetime).not.toHaveBeenCalled();
  });

  it("reports a payment still processing as inactive with its status, not as a refusal", async () => {
    stripe.isOurLifetimePayment.mockReturnValue(false);
    stripe.retrieveSession.mockResolvedValue({
      subscription: null,
      payment_intent: {
        id: "pi_slow",
        status: "processing",
        customer: { id: "cus_owner" },
        latest_charge: null,
      },
      customer: { id: "cus_owner" },
      customer_details: { email: "singer@example.com" },
    });

    const response = await entitlement({ sessionId: "cs_slow" });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ active: false, status: "processing" });
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

  it("marks every answer private and no-store: success, error and rate limit", async () => {
    // A success can carry the buyer's email and Pro key; no shared cache may
    // keep one, and the platform default was `public, max-age=0`.
    stripe.retrieveSession.mockResolvedValue({
      subscription: null,
      payment_intent: { id: "pi_lifetime", customer: { id: "cus_owner" }, latest_charge: { id: "ch_lifetime" } },
      customer: { id: "cus_owner", email: "singer@example.com" },
      customer_details: { email: "singer@example.com" },
    });
    const success = await entitlement({ sessionId: "cs_lifetime" });
    expect(success.status).toBe(200);
    expect(await success.json()).toMatchObject({ email: "singer@example.com", proKey: "suede-pro_lifetime" });
    expect(success.headers.get("cache-control")).toBe("private, no-store");

    const invalid = await entitlement({});
    expect(invalid.status).toBe(400);
    expect(invalid.headers.get("cache-control")).toBe("private, no-store");

    vi.spyOn(console, "error").mockImplementation(() => {});
    stripe.retrievePaymentIntent.mockRejectedValue(new Error("network"));
    const failed = await entitlement({ paymentIntentId: "pi_lifetime" });
    expect(failed.status).toBe(502);
    expect(failed.headers.get("cache-control")).toBe("private, no-store");

    rate.limited = Response.json({ error: "Too many requests." }, { status: 429 });
    const limited = await entitlement({ sessionId: "cs_lifetime" });
    expect(limited.status).toBe(429);
    expect(limited.headers.get("cache-control")).toBe("private, no-store");
  });
});
