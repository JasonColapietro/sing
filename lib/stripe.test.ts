import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
// No test reaches Stripe: the client getStripe builds only has the dispute
// list the lifetime policy reads, and each test decides what it returns.
const disputes = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("stripe", () => ({
  default: class {
    disputes = { list: disputes.list };
  },
}));

const {
  CHECKOUT_PRICE_LOOKUP_KEYS,
  DisputeLookupError,
  entitlementFrom,
  entitlementFromLifetime,
  HONOURED_LIFETIME_CENTS,
  isOurLifetimePayment,
  lifetimeAccess,
  isOurSubscription,
  PriceNotConfiguredError,
  resolvePriceId,
} = await import("./stripe");
const { LIFETIME_OFFER, PRICING } = await import("./pro-shared");

beforeEach(() => {
  process.env.PRO_KEY_SECRET = "test-pro-key-secret";
  process.env.STRIPE_SECRET_KEY = "sk_test_never_used";
  disputes.list.mockReset();
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
      id: "ch_lifetime",
      paid: true,
      refunded: false,
      disputed: false,
      amount_captured: 7_900,
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
  it("maps an unrefunded Early Access payment to permanent Pro access", async () => {
    const payment = lifetimePayment();

    // isOurLifetimePayment now takes the dispute status (null: undisputed).
    expect(isOurLifetimePayment(payment, null)).toBe(true);
    expect(await entitlementFromLifetime(payment, "singer@example.com")).toEqual(
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

    // isOurLifetimePayment now takes the dispute status (null: undisputed).
    expect(isOurLifetimePayment(payment, null)).toBe(false);
  });

  it("honours the price on sale today", () => {
    // A new lifetime price has to be added to the honoured set, or the
    // people who pay it would be refused the access they just bought.
    expect(
      HONOURED_LIFETIME_CENTS.has(Math.round(PRICING.lifetime.amount * 100)),
    ).toBe(true);
  });

  it("keeps an earlier buyer's lifetime access when the display price changes", async () => {
    const shown = PRICING.lifetime.amount;
    PRICING.lifetime.amount = 99;
    try {
      const payment = lifetimePayment();
      // Dispute status argument and await: the new signatures, same assertions.
      expect(isOurLifetimePayment(payment, null)).toBe(true);
      expect((await entitlementFromLifetime(payment)).active).toBe(true);
    } finally {
      PRICING.lifetime.amount = shown;
    }
  });

  it("keeps the offer tag every past lifetime payment carries", () => {
    // Checkout writes this tag and every recheck requires it, so renaming it
    // when Early Access ends would refuse everyone who bought under it.
    expect(LIFETIME_OFFER).toBe("early-access");
    expect(isOurLifetimePayment(lifetimePayment(), null)).toBe(true);
  });

  it("does not grant lifetime access for an amount it was never sold at", () => {
    const payment = lifetimePayment();
    payment.amount_received = 100;

    expect(isOurLifetimePayment(payment, null)).toBe(false);
  });

  it("refuses to sell lifetime at a price it would not honour afterwards", async () => {
    // Otherwise the buyer is charged, and the confirmation and every recheck
    // after it refuse the payment: paid, and never Pro. Refused before any
    // Stripe call, so no client is needed here.
    const shown = PRICING.lifetime.amount;
    PRICING.lifetime.amount = 99;
    try {
      await expect(resolvePriceId("lifetime")).rejects.toBeInstanceOf(
        PriceNotConfiguredError,
      );
    } finally {
      PRICING.lifetime.amount = shown;
    }
  });
});

function withCharge(changes: Partial<Stripe.Charge>): Stripe.PaymentIntent {
  const payment = lifetimePayment();
  payment.latest_charge = {
    ...(payment.latest_charge as Stripe.Charge),
    ...changes,
  };
  return payment;
}

function disputedWith(
  ...found: Array<{ status: string; created: number }>
): Stripe.PaymentIntent {
  disputes.list.mockResolvedValue({
    data: found.map((dispute, index) => ({ id: `dp_${index}`, ...dispute })),
  });
  return withCharge({ disputed: true });
}

/** Whether the payment grants Pro, through the entitlement every route uses. */
async function grants(payment: Stripe.PaymentIntent): Promise<boolean> {
  return (await entitlementFromLifetime(payment)).active;
}

describe("lifetime refund and dispute policy", () => {
  it("ends access after a full refund marked on the charge", async () => {
    expect(await grants(withCharge({ refunded: true, amount_refunded: 7_900 }))).toBe(false);
  });

  it("ends access once the refunded amount reaches the captured amount", async () => {
    expect(await grants(withCharge({ refunded: false, amount_refunded: 7_900 }))).toBe(false);
  });

  it("keeps access after a partial refund", async () => {
    const payment = withCharge({ amount_refunded: 2_000 });

    expect(await grants(payment)).toBe(true);
    expect(await lifetimeAccess(payment)).toBe(true);
  });

  it("decides an undisputed payment without looking up a dispute", async () => {
    expect(await grants(lifetimePayment())).toBe(true);
    expect(await lifetimeAccess(lifetimePayment())).toBe(true);
    expect(disputes.list).not.toHaveBeenCalled();
  });

  it.each([
    "warning_needs_response",
    "warning_under_review",
    "needs_response",
    "under_review",
  ])("suspends access while a dispute is open (%s)", async (status) => {
    expect(await grants(disputedWith({ status, created: 1 }))).toBe(false);
    expect(disputes.list).toHaveBeenCalledWith({ charge: "ch_lifetime", limit: 10 });
  });

  it("ends access when the dispute is lost", async () => {
    expect(await grants(disputedWith({ status: "lost", created: 1 }))).toBe(false);
  });

  it("keeps access when the dispute is won", async () => {
    expect(await grants(disputedWith({ status: "won", created: 1 }))).toBe(true);
    expect(disputes.list).toHaveBeenCalledWith({ charge: "ch_lifetime", limit: 10 });
  });

  it("keeps access when an inquiry closes without a chargeback", async () => {
    expect(await grants(disputedWith({ status: "warning_closed", created: 1 }))).toBe(true);
  });

  it("keeps access when a dispute was prevented", async () => {
    expect(await grants(disputedWith({ status: "prevented", created: 1 }))).toBe(true);
  });

  it("lets the most recent dispute decide, whatever order Stripe lists them in", async () => {
    expect(
      await grants(disputedWith({ status: "lost", created: 1 }, { status: "won", created: 2 })),
    ).toBe(true);
    expect(
      await grants(disputedWith({ status: "won", created: 2 }, { status: "under_review", created: 3 })),
    ).toBe(false);
  });

  it("grants nothing for a dispute status it does not know", async () => {
    expect(await grants(disputedWith({ status: "some_future_status", created: 1 }))).toBe(false);
  });

  it("fails closed when the dispute lookup fails", async () => {
    disputes.list.mockRejectedValue(new Error("Stripe is down"));
    const payment = withCharge({ disputed: true });

    await expect(lifetimeAccess(payment)).rejects.toBeInstanceOf(DisputeLookupError);
    await expect(entitlementFromLifetime(payment)).rejects.toBeInstanceOf(DisputeLookupError);
  });

  it("fails closed when a disputed charge lists no dispute", async () => {
    await expect(lifetimeAccess(disputedWith())).rejects.toBeInstanceOf(DisputeLookupError);
  });

  it("does not look up disputes for a payment that is not ours", async () => {
    const payment = withCharge({ disputed: true });
    payment.metadata = { ...payment.metadata, app: "another-product" };

    expect(await lifetimeAccess(payment)).toBe(false);
    expect(disputes.list).not.toHaveBeenCalled();
  });

  it("grants nothing for a disputed charge when no dispute status is supplied", () => {
    expect(isOurLifetimePayment(withCharge({ disputed: true }), null)).toBe(false);
    expect(isOurLifetimePayment(withCharge({ disputed: true }), "won")).toBe(true);
  });
});
