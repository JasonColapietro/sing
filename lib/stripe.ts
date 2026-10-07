import "server-only";

import Stripe from "stripe";
import { SITE_URL } from "./site";
import {
  ENTITLING_STATUSES,
  INACTIVE,
  PRICING,
  type CheckoutPlan,
  type Entitlement,
  type ProPlan,
} from "./pro-shared";
import { mintProKey } from "./pro-key";

let client: Stripe | null = null;

/**
 * Lazily built so a missing key surfaces as a request-time error with a
 * clear message rather than breaking the build.
 */
export function getStripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Run `vercel env pull` locally, or add the Stripe integration in the Vercel dashboard.",
    );
  }
  client = new Stripe(key, { appInfo: { name: "Suede Sing" } });
  return client;
}

/**
 * Prices are resolved by lookup key rather than hardcoded ids, so the same
 * code works against the Stripe sandbox and a claimed live account — you
 * recreate the prices with these keys and nothing here changes.
 */
export const CHECKOUT_PRICE_LOOKUP_KEYS: Record<CheckoutPlan, string> = {
  monthly: "suede_pro_monthly_early_access",
  lifetime: "suede_pro_lifetime_early_access",
};

const LEGACY_SUBSCRIPTION_LOOKUP_KEYS = [
  "suede_pro_monthly",
  "suede_pro_annual",
] as const;

const SUBSCRIPTION_LOOKUP_KEYS = new Set([
  ...LEGACY_SUBSCRIPTION_LOOKUP_KEYS,
  CHECKOUT_PRICE_LOOKUP_KEYS.monthly,
]);

/** The product used by every previously sold Suede Pro subscription. */
const SUEDE_PRO_PRODUCT_ID = "prod_UymwMKT9x94n1k";

/**
 * Optional escape hatch: pin a plan to an exact price id instead of looking it
 * up. Useful when an account carries more than one price with the same lookup
 * key history, or to point a preview deployment at a throwaway price.
 *
 * Pinned prices go through the same active, currency, amount, and billing-shape
 * checks as lookup-key prices.
 */
const PRICE_ID_ENV_VARS: Record<CheckoutPlan, string> = {
  monthly: "STRIPE_PRICE_MONTHLY",
  lifetime: "STRIPE_PRICE_LIFETIME",
};

/**
 * A sellable plan with no configured price. Kept distinct from a Stripe outage
 * so checkout can answer "not on sale" rather than "try again in a moment".
 */
export class PriceNotConfiguredError extends Error {
  readonly plan: CheckoutPlan;

  constructor(plan: CheckoutPlan) {
    super(
      `No active Stripe price with lookup key "${CHECKOUT_PRICE_LOOKUP_KEYS[plan]}". Run \`npm run stripe:setup -- ${plan}\` to create one.`,
    );
    this.name = "PriceNotConfiguredError";
    this.plan = plan;
  }
}

/**
 * A price exists under the plan's lookup key, but it charges something other
 * than what every surface quotes. Kept distinct from a missing price because
 * the fix is different — someone has to reconcile Stripe with PRICING — and
 * because this is a state a live account can reach after a pricing change.
 * Checkout refuses rather than charging an amount nobody was shown.
 */
export class PriceMismatchError extends Error {
  readonly plan: CheckoutPlan;

  constructor(plan: CheckoutPlan, price: Stripe.Price) {
    const shown = `$${PRICING[plan].amount}/${PRICING[plan].interval}`;
    const held = `$${(price.unit_amount ?? 0) / 100}/${price.recurring?.interval ?? "one-off"}`;
    super(
      `Stripe price ${price.id} (lookup key "${CHECKOUT_PRICE_LOOKUP_KEYS[plan]}") charges ${held}, but /pro quotes ${shown}. Fix the price in Stripe or PRICING in lib/pro-shared.ts.`,
    );
    this.name = "PriceMismatchError";
    this.plan = plan;
  }
}

function priceMatchesPlan(plan: CheckoutPlan, price: Stripe.Price): boolean {
  const expectedRecurring = plan === "monthly" ? "month" : null;
  return (
    price.active &&
    price.currency === "usd" &&
    price.unit_amount === Math.round(PRICING[plan].amount * 100) &&
    (price.recurring?.interval ?? null) === expectedRecurring
  );
}

export async function resolvePriceId(plan: CheckoutPlan): Promise<string> {
  const pinned = process.env[PRICE_ID_ENV_VARS[plan]];
  if (pinned) {
    if (!isStripeId(pinned, "price_")) {
      throw new Error(
        `${PRICE_ID_ENV_VARS[plan]} is set but doesn't look like a Stripe price id.`,
      );
    }
    const price = await getStripe().prices.retrieve(pinned);
    if (!priceMatchesPlan(plan, price)) {
      throw new PriceMismatchError(plan, price);
    }
    return price.id;
  }

  const { data } = await getStripe().prices.list({
    lookup_keys: [CHECKOUT_PRICE_LOOKUP_KEYS[plan]],
    active: true,
    limit: 1,
  });
  const price = data[0];
  if (!price) throw new PriceNotConfiguredError(plan);
  // Stripe holds cents, PRICING dollars.
  if (!priceMatchesPlan(plan, price)) {
    throw new PriceMismatchError(plan, price);
  }
  return price.id;
}

/** True when a subscription is one of ours, so restore ignores unrelated ones. */
export function isOurSubscription(sub: Stripe.Subscription): boolean {
  if (sub.metadata.app === "suede-sing") return true;
  return sub.items.data.some((item) => {
    const lookupKey = item.price.lookup_key;
    if (lookupKey && SUBSCRIPTION_LOOKUP_KEYS.has(lookupKey)) return true;
    const product = item.price.product;
    const productId = typeof product === "string" ? product : product?.id;
    return productId === SUEDE_PRO_PRODUCT_ID;
  });
}

function planFromSubscription(sub: Stripe.Subscription): ProPlan | null {
  const price = sub.items.data[0]?.price;
  if (!price) return null;
  if (price.lookup_key === "suede_pro_annual") return "annual";
  if (
    price.lookup_key === "suede_pro_monthly" ||
    price.lookup_key === CHECKOUT_PRICE_LOOKUP_KEYS.monthly
  ) {
    return "monthly";
  }
  if (sub.metadata.plan === "annual") return "annual";
  if (sub.metadata.plan === "monthly") return "monthly";
  return price.recurring?.interval === "year" ? "annual" : "monthly";
}

/**
 * Maps a Stripe subscription onto the app's entitlement shape. Note that
 * `current_period_end` lives on the subscription *item* in current Stripe
 * API versions, not on the subscription itself.
 */
export function entitlementFrom(
  sub: Stripe.Subscription,
  email?: string | null,
): Entitlement {
  const granted = (ENTITLING_STATUSES as readonly string[]).includes(sub.status);
  if (!granted) return { ...INACTIVE, status: sub.status };
  const periodEnd = sub.items.data[0]?.current_period_end ?? null;
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  // A missing signing secret shouldn't cost a paying singer their access —
  // they just don't get a restore key until it's configured.
  let proKey: string | null = null;
  try {
    proKey = mintProKey(customerId, sub.id);
  } catch (error) {
    console.error("[stripe] could not mint pro key", error);
  }

  return {
    active: true,
    plan: planFromSubscription(sub),
    status: sub.status,
    subscriptionId: sub.id,
    paymentIntentId: null,
    customerId,
    email: email ?? null,
    currentPeriodEnd: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    proKey,
  };
}

/** True only for an unreversed $79 Early Access lifetime purchase. */
export function isOurLifetimePayment(payment: Stripe.PaymentIntent): boolean {
  const customerId =
    typeof payment.customer === "string"
      ? payment.customer
      : payment.customer?.id;
  const charge = payment.latest_charge;
  if (!charge || typeof charge === "string") return false;
  return (
    payment.status === "succeeded" &&
    !!customerId?.startsWith("cus_") &&
    payment.currency === "usd" &&
    payment.amount_received === Math.round(PRICING.lifetime.amount * 100) &&
    payment.metadata.app === "suede-sing" &&
    payment.metadata.offer === "early-access" &&
    payment.metadata.plan === "lifetime" &&
    charge.paid &&
    charge.status === "succeeded" &&
    !charge.refunded &&
    !charge.disputed &&
    charge.amount_refunded === 0
  );
}

/** Maps a verified one-time purchase onto the same client entitlement shape. */
export function entitlementFromLifetime(
  payment: Stripe.PaymentIntent,
  email?: string | null,
): Entitlement {
  if (!isOurLifetimePayment(payment)) {
    return { ...INACTIVE, status: payment.status };
  }
  const customerId =
    typeof payment.customer === "string"
      ? payment.customer
      : payment.customer?.id;
  if (!customerId) return { ...INACTIVE, status: payment.status };

  let proKey: string | null = null;
  try {
    proKey = mintProKey(customerId, payment.id);
  } catch (error) {
    console.error("[stripe] could not mint lifetime pro key", error);
  }

  return {
    active: true,
    plan: "lifetime",
    status: payment.status,
    subscriptionId: null,
    paymentIntentId: payment.id,
    customerId,
    email: email ?? null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    proKey,
  };
}

export function emailOf(
  customer: Stripe.Customer | Stripe.DeletedCustomer | string | null,
): string | null {
  if (!customer || typeof customer === "string") return null;
  return "email" in customer ? customer.email ?? null : null;
}

/** Guards ids that arrive from the client before they reach the Stripe API. */
export function isStripeId(value: unknown, prefix: string): value is string {
  return (
    typeof value === "string" &&
    value.startsWith(prefix) &&
    value.length <= 255 &&
    /^[A-Za-z0-9_]+$/.test(value)
  );
}

/**
 * The origin Stripe should return a customer to.
 *
 * Deployed, this is always the configured canonical origin rather than
 * whatever Host the request carried. Two reasons: entitlement lives in
 * localStorage and localStorage is per origin, so a checkout begun on a
 * vercel.app host would unlock Pro on that host and leave the singer looking
 * unsubscribed on the real domain; and a redirect target should not be
 * derived from a request header when the canonical value is already in
 * config. Vercel currently rejects a forged Host at the edge, but that is the
 * platform protecting this, not the code.
 *
 * Local development still follows the request, so localhost keeps working.
 */
export function siteOrigin(request: Request): string {
  const host = request.headers.get("host");
  const local =
    !!host && (host.startsWith("localhost") || host.startsWith("127.0.0.1"));
  if (local) return `http://${host}`;
  if (SITE_URL) return SITE_URL;
  if (host) return `https://${host}`;
  return new URL(request.url).origin;
}
