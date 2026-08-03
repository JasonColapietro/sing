import "server-only";

import Stripe from "stripe";
import { SITE_URL } from "./site";
import {
  ENTITLING_STATUSES,
  INACTIVE,
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
export const PRICE_LOOKUP_KEYS: Record<ProPlan, string> = {
  monthly: "suede_pro_monthly",
  annual: "suede_pro_annual",
};

export async function resolvePriceId(plan: ProPlan): Promise<string> {
  const lookupKey = PRICE_LOOKUP_KEYS[plan];
  const { data } = await getStripe().prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  const price = data[0];
  if (!price) {
    throw new Error(
      `No active Stripe price with lookup key "${lookupKey}". Create one for the ${plan} plan.`,
    );
  }
  return price.id;
}

/** True when a subscription is one of ours, so restore ignores unrelated ones. */
export function isOurSubscription(sub: Stripe.Subscription): boolean {
  const ours = Object.values(PRICE_LOOKUP_KEYS);
  return sub.items.data.some(
    (item) => item.price.lookup_key && ours.includes(item.price.lookup_key),
  );
}

function planFromSubscription(sub: Stripe.Subscription): ProPlan | null {
  const price = sub.items.data[0]?.price;
  if (!price) return null;
  if (price.lookup_key === PRICE_LOOKUP_KEYS.annual) return "annual";
  if (price.lookup_key === PRICE_LOOKUP_KEYS.monthly) return "monthly";
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
    customerId,
    email: email ?? null,
    currentPeriodEnd: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
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
