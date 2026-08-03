import { NextResponse } from "next/server";
import { INACTIVE } from "@/lib/pro-shared";
import { rateLimit } from "@/lib/rate-limit";
import { getRedis } from "@/lib/redis";
import { entitlementFrom, getStripe, resolvePriceId } from "@/lib/stripe";

/**
 * Redeems a comp code for 30 days of Pro, with no card on file.
 *
 * The grant is a real Stripe subscription on the ordinary monthly price,
 * opened as a 30-day trial. That matters: `trialing` already entitles
 * (lib/pro-shared.ts), the Pro key mints as usual so the pass restores on a
 * second device, and `isOurSubscription` recognises it — none of which would
 * be true of a $0 price or a local-only flag. Nothing else in the app has to
 * know comps exist.
 *
 * No payment method is collected, so Stripe cancels the subscription when the
 * trial ends rather than invoicing an uncollectable $9.99. The pass expires on
 * its own; there is nothing to clean up, and nobody gets billed by surprise.
 *
 * Codes live in PRO_COMP_CODES rather than in Stripe or a database, so handing
 * one out and revoking it are both an env var edit.
 *
 * A code is reusable without limit unless PRO_COMP_MAX_REDEMPTIONS is set. That
 * is fine for a code shared with a mailing list and dangerous for one that ends
 * up on Reddit: every redemption mints a real Stripe customer and subscription,
 * so an unbounded code is both unbounded free Pro and unbounded object
 * creation. Setting the cap turns on a durable per-code counter.
 */

const COMP_DAYS = 30;

/** Total redemptions allowed per code, or null for the unlimited default. */
function redemptionCap(): number | null {
  const raw = process.env.PRO_COMP_MAX_REDEMPTIONS;
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    console.warn(
      `[api/redeem] PRO_COMP_MAX_REDEMPTIONS is "${raw}", which isn't a positive integer — treating codes as uncapped.`,
    );
    return null;
  }
  return n;
}

const usageKey = (code: string) => `comp:used:${code}`;

/**
 * Claims one redemption against a code's quota.
 *
 * INCR is atomic, so two simultaneous redemptions of the last slot can't both
 * win — which a read-then-write check, or counting subscriptions through
 * Stripe's search index, would both allow. Search is additionally the wrong
 * tool here: it lags writes by around a minute, which is exactly the window a
 * script would exploit.
 *
 * Returns null when the claim succeeded, or a reason when it did not. With no
 * cap configured this never runs, so the store stays entirely optional.
 */
async function claimRedemption(
  code: string,
  cap: number,
): Promise<"exhausted" | "unavailable" | null> {
  const redis = getRedis();
  if (!redis) {
    // The operator asked for a cap. Granting unlimited passes because the
    // counter is unreachable would quietly do the opposite of that.
    console.error(
      "[api/redeem] PRO_COMP_MAX_REDEMPTIONS is set but no Redis store is configured; refusing rather than granting uncapped passes.",
    );
    return "unavailable";
  }
  const used = await redis.incr(usageKey(code));
  if (used > cap) {
    // Give the slot back so a later cap raise starts from the true count.
    await redis.decr(usageKey(code));
    return "exhausted";
  }
  return null;
}

/** Hands a reserved slot back after a failed grant. */
async function releaseRedemption(code: string) {
  try {
    await getRedis()?.decr(usageKey(code));
  } catch (error) {
    // A leaked slot costs one redemption; failing the request over it would
    // cost the singer their pass on top of the Stripe error they already hit.
    console.error("[api/redeem] could not release redemption slot", error);
  }
}

/** Normalised so "friends30", "FRIENDS30 " and "Friends30" are one code. */
function normalise(value: string): string {
  return value.trim().toUpperCase();
}

function validCodes(): Set<string> {
  const raw = process.env.PRO_COMP_CODES;
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map(normalise)
      .filter((code) => code.length > 0),
  );
}

export async function POST(request: Request) {
  // Comp codes are memorable strings, not high-entropy secrets, so this is
  // the guess budget as much as the burst budget. The durable limit is the
  // Vercel WAF rule on /api/* (see README); this is the free floor under it.
  const limited = rateLimit(request, "redeem", {
    limit: 5,
    windowMs: 10 * 60_000,
  });
  if (limited) return limited;

  let code: unknown;
  try {
    const body = (await request.json()) as { code?: unknown };
    code = body?.code;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (typeof code !== "string" || code.trim().length === 0 || code.length > 64) {
    return NextResponse.json(
      { ...INACTIVE, error: "Enter your code." },
      { status: 400 },
    );
  }

  const codes = validCodes();
  if (codes.size === 0) {
    console.warn("[api/redeem] PRO_COMP_CODES is not set — every code fails.");
  }

  // One message for "no such code" and "codes aren't configured", so the
  // response never says which.
  if (!codes.has(normalise(code))) {
    return NextResponse.json(
      { ...INACTIVE, error: "That code isn't valid." },
      { status: 400 },
    );
  }

  const redeemed = normalise(code);

  const cap = redemptionCap();
  if (cap !== null) {
    const refusal = await claimRedemption(redeemed, cap);
    if (refusal === "exhausted") {
      return NextResponse.json(
        {
          ...INACTIVE,
          error: "That code has been fully claimed. Ask for a fresh one.",
        },
        { status: 409 },
      );
    }
    if (refusal === "unavailable") {
      return NextResponse.json(
        { ...INACTIVE, error: "Could not check that code just now. Try again in a moment." },
        { status: 503 },
      );
    }
  }

  try {
    const stripe = getStripe();
    const price = await resolvePriceId("monthly");

    const customer = await stripe.customers.create({
      description: `Suede Pro comp — ${redeemed}`,
      metadata: { app: "suede-sing", comp_code: redeemed },
    });

    const sub = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price }],
      trial_period_days: COMP_DAYS,
      // No card was collected, so let the pass lapse instead of dunning.
      trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      metadata: {
        app: "suede-sing",
        plan: "monthly",
        comp_code: redeemed,
        comp_days: String(COMP_DAYS),
      },
    });

    return NextResponse.json(entitlementFrom(sub, customer.email));
  } catch (error) {
    if (cap !== null) await releaseRedemption(redeemed);
    console.error("[api/redeem]", error);
    return NextResponse.json(
      { error: "Could not start your pass. Try again in a moment." },
      { status: 502 },
    );
  }
}
