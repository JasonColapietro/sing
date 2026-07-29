import { NextResponse } from "next/server";
import { INACTIVE } from "@/lib/pro-shared";
import { rateLimit } from "@/lib/rate-limit";
import { emailOf, entitlementFrom, getStripe, isStripeId } from "@/lib/stripe";
import type Stripe from "stripe";

/**
 * Resolves entitlement from Stripe — the only source of truth.
 *
 * Called two ways: with a `sessionId` right after checkout to unlock Pro on
 * this device, and with a `subscriptionId` periodically afterwards so a
 * cancellation or failed payment is reflected here. There is no database,
 * so every check goes straight to Stripe.
 */
export async function POST(request: Request) {
  // Higher than the others: every page load may revalidate, and a shared NAT
  // or office network can legitimately produce a burst from one address.
  const limited = rateLimit(request, "entitlement", {
    limit: 40,
    windowMs: 60_000,
  });
  if (limited) return limited;

  let sessionId: unknown;
  let subscriptionId: unknown;
  try {
    const body = (await request.json()) as {
      sessionId?: unknown;
      subscriptionId?: unknown;
    };
    sessionId = body?.sessionId;
    subscriptionId = body?.subscriptionId;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const stripe = getStripe();

  try {
    if (isStripeId(sessionId, "cs_")) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription", "customer"],
      });
      const sub = session.subscription;
      if (!sub || typeof sub === "string") {
        return NextResponse.json(INACTIVE);
      }
      const email =
        session.customer_details?.email ?? emailOf(session.customer);
      return NextResponse.json(entitlementFrom(sub as Stripe.Subscription, email));
    }

    if (isStripeId(subscriptionId, "sub_")) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["customer"],
      });
      return NextResponse.json(entitlementFrom(sub, emailOf(sub.customer)));
    }

    return NextResponse.json(
      { error: "Provide a checkout session id or a subscription id." },
      { status: 400 },
    );
  } catch (error) {
    // A deleted or unknown id is a legitimate "not a member" answer.
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { type?: string }).type === "StripeInvalidRequestError"
    ) {
      return NextResponse.json(INACTIVE);
    }
    console.error("[api/entitlement]", error);
    return NextResponse.json(
      { error: "Could not check your subscription. Try again in a moment." },
      { status: 502 },
    );
  }
}
