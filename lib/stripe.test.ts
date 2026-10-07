import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const {
  CHECKOUT_PRICE_LOOKUP_KEYS,
  entitlementFrom,
  entitlementFromLifetime,
  isOurLifetimePayment,
  isOurSubscription,
} = await import("./stripe");

beforeEach(() => {
  process.env.PRO_KEY_SECRET = "test-pro-key-secret";
});

function subscription({
  lookupKey,
  interval,
  product = "prod_UymwMKT9x94n1k",
}: {
  lookupKey: string | null;
  interval: "month" | "year";
  product?: string;
}): Stripe.Subscription {
  return {
    id: "sub_legacy",
    status: "active",
    customer: "cus_legacy",
    cancel_at_period_end: false,
    metadata: {},
    items: {
      data: [
        {
          current_period_end: 1_800_000_000,
          price: {
            lookup_key: lookupKey,
            product,
            recurring: { interval },
          },
        },
      ],
    },
  } as unknown as Stripe.Subscription;
}

function lifetimePayment(): Stripe.PaymentIntent {
  return {
    id: "pi_lifetime",
    status: "succeeded",
    customer: "cus_lifetime",
    currency: "usd",
    amount_received: 7_900,
    metadata: {
      app: "suede-sing",
      offer: "early-access",
      plan: "lifetime",
    },
    latest_charge: {
      paid: true,
      refunded: false,
      disputed: false,
      amount_refunded: 0,
      status: "succeeded",
    },
  } as unknown as Stripe.PaymentIntent;
}

describe("sellable Stripe prices", () => {
  it("uses new Early Access keys without moving the legacy subscription keys", () => {
    expect(CHECKOUT_PRICE_LOOKUP_KEYS).toEqual({
      monthly: "suede_pro_monthly_early_access",
      lifetime: "suede_pro_lifetime_early_access",
    });
  });
});

describe("legacy subscription recognition", () => {
  it("continues to recognize and label an annual subscription", () => {
    const annual = subscription({
      lookupKey: "suede_pro_annual",
      interval: "year",
    });

    expect(isOurSubscription(annual)).toBe(true);
    expect(entitlementFrom(annual).plan).toBe("annual");
  });

  it("recognizes a legacy annual price by the canonical Suede Pro product if its lookup key moves", () => {
    const annual = subscription({ lookupKey: null, interval: "year" });

    expect(isOurSubscription(annual)).toBe(true);
    expect(entitlementFrom(annual).plan).toBe("annual");
  });

  it("recognizes subscriptions created on the new Early Access monthly price", () => {
    expect(
      isOurSubscription(
        subscription({
          lookupKey: "suede_pro_monthly_early_access",
          interval: "month",
        }),
      ),
    ).toBe(true);
  });
});

describe("lifetime entitlement", () => {
  it("maps an unrefunded Early Access payment to permanent Pro access", () => {
    const payment = lifetimePayment();

    expect(isOurLifetimePayment(payment)).toBe(true);
    expect(entitlementFromLifetime(payment, "singer@example.com")).toEqual(
      expect.objectContaining({
        active: true,
        plan: "lifetime",
        status: "succeeded",
        subscriptionId: null,
        paymentIntentId: "pi_lifetime",
        customerId: "cus_lifetime",
        email: "singer@example.com",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      }),
    );
  });

  it("does not grant lifetime access after a full refund", () => {
    const payment = lifetimePayment();
    payment.latest_charge = {
      ...(payment.latest_charge as Stripe.Charge),
      refunded: true,
      amount_refunded: 7_900,
    };

    expect(isOurLifetimePayment(payment)).toBe(false);
  });
});
