import { NextResponse } from "next/server";
import { INACTIVE } from "@/lib/pro-shared";
import { verifyProKey } from "@/lib/pro-key";
import { rateLimit } from "@/lib/rate-limit";
import {
  emailOf,
  entitlementFrom,
  entitlementFromLifetime,
  getStripe,
  isOurLifetimePayment,
  isOurSubscription,
} from "@/lib/stripe";

function isMissingStripeResource(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { type?: string }).type === "StripeInvalidRequestError" &&
    (error as { code?: string }).code === "resource_missing"
  );
}

/**
 * Restores Pro on a new device from the subscriber's Pro key.
 *
 * This used to accept a bare email address, which meant anyone who knew a
 * subscriber's email could unlock Pro in their own browser, and the endpoint
 * doubled as an oracle for "is this person a subscriber?". Both problems are
 * gone by construction: there is no lookup by email here, so there is nothing
 * to probe, and a key can't be guessed.
 *
 * The key proves purchase; Stripe still decides entitlement, so a cancelled
 * subscription or reversed lifetime payment stops unlocking anything.
 */
export async function POST(request: Request) {
  const limited = rateLimit(request, "restore", { limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  let key: unknown;
  try {
    const body = (await request.json()) as { key?: unknown };
    key = body?.key;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const claims = verifyProKey(key);
  if (!claims) {
    return NextResponse.json(
      { ...INACTIVE, error: "That Pro key isn't valid. Check for a missing character." },
      { status: 400 },
    );
  }

  try {
    if (claims.kind === "subscription") {
      const sub = await getStripe().subscriptions.retrieve(claims.subscriptionId, {
        expand: ["customer"],
      });

      const owner =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      if (owner !== claims.customerId || !isOurSubscription(sub)) {
        return NextResponse.json({
          ...INACTIVE,
          error: "That Pro key doesn't match a Suede Pro subscription.",
        });
      }

      const entitlement = entitlementFrom(sub, emailOf(sub.customer));
      if (!entitlement.active) {
        return NextResponse.json({
          ...entitlement,
          error: "That subscription is no longer active.",
        });
      }
      return NextResponse.json(entitlement);
    }

    const payment = await getStripe().paymentIntents.retrieve(
      claims.paymentIntentId,
      { expand: ["customer", "latest_charge"] },
    );
    const owner =
      typeof payment.customer === "string"
        ? payment.customer
        : payment.customer?.id;
    if (owner !== claims.customerId || !isOurLifetimePayment(payment)) {
      return NextResponse.json({
        ...INACTIVE,
        error: "That Pro key doesn't match a Suede Pro lifetime purchase.",
      });
    }
    return NextResponse.json(
      entitlementFromLifetime(payment, emailOf(payment.customer)),
    );
  } catch (error) {
    if (isMissingStripeResource(error)) {
      return NextResponse.json({
        ...INACTIVE,
        error:
          claims.kind === "subscription"
            ? "That subscription no longer exists."
            : "That lifetime purchase no longer exists.",
      });
    }
    console.error("[api/restore]", error);
    return NextResponse.json(
      { error: "Could not reach Stripe. Try again in a moment." },
      { status: 502 },
    );
  }
}
