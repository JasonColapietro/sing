import { NextResponse } from "next/server";
import { INACTIVE } from "@/lib/pro-shared";
import { rateLimit } from "@/lib/rate-limit";
import {
  emailOf,
  entitlementFrom,
  entitlementFromLifetime,
  getStripe,
  isOurLifetimePayment,
  isOurSubscription,
  isStripeId,
} from "@/lib/stripe";
import type Stripe from "stripe";

function customerIdOf(
  customer: { id: string } | string | null | undefined,
): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

function isMissingStripeResource(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { type?: string }).type === "StripeInvalidRequestError" &&
    (error as { code?: string }).code === "resource_missing"
  );
}

function invalidBillingReference() {
  return NextResponse.json(
    {
      error:
        "Provide a checkout session id, subscription id, or payment intent id.",
    },
    { status: 400 },
  );
}

/**
 * Resolves entitlement from Stripe — the only source of truth.
 *
 * Called with a `sessionId` right after checkout to unlock Pro on this device,
 * then with either its `subscriptionId` or `paymentIntentId` periodically so a
 * cancellation, failed payment, refund, or dispute is reflected here. There
 * is no database, so every check goes straight to Stripe.
 *
 * Every path confirms the billing record is actually one of ours before
 * granting anything. The id arrives from localStorage, which anyone can edit,
 * and this Stripe account bills other Suede products too — without the check,
 * one of their billing ids would unlock Pro here. `/api/restore` and
 * `/api/sync` enforce the same boundary.
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
  let paymentIntentId: unknown;
  try {
    const body = (await request.json()) as {
      sessionId?: unknown;
      subscriptionId?: unknown;
      paymentIntentId?: unknown;
    };
    sessionId = body?.sessionId;
    subscriptionId = body?.subscriptionId;
    paymentIntentId = body?.paymentIntentId;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const validSessionId = isStripeId(sessionId, "cs_") ? sessionId : null;
  const validSubscriptionId = isStripeId(subscriptionId, "sub_")
    ? subscriptionId
    : null;
  const validPaymentIntentId = isStripeId(paymentIntentId, "pi_")
    ? paymentIntentId
    : null;
  if (!validSessionId && !validSubscriptionId && !validPaymentIntentId) {
    return invalidBillingReference();
  }

  try {
    // Inside the try: a missing or unreadable STRIPE_SECRET_KEY throws here,
    // and the README's Marketplace-resync trap is a real way for that to
    // happen in production. Outside, it surfaced as an unhandled 500 instead
    // of the 502 the client knows how to retry.
    const stripe = getStripe();

    if (validSessionId) {
      const session = await stripe.checkout.sessions.retrieve(validSessionId, {
        expand: [
          "subscription",
          "customer",
          "payment_intent.latest_charge",
        ],
      });
      const sub = session.subscription;
      if (sub) {
        if (typeof sub === "string") {
          return NextResponse.json(INACTIVE);
        }
        if (!isOurSubscription(sub as Stripe.Subscription)) {
          return NextResponse.json(INACTIVE);
        }
        const email =
          session.customer_details?.email ?? emailOf(session.customer);
        return NextResponse.json(
          entitlementFrom(sub as Stripe.Subscription, email),
        );
      }

      const payment = session.payment_intent;
      if (!payment || typeof payment === "string") {
        return NextResponse.json(INACTIVE);
      }
      const sessionCustomerId = customerIdOf(session.customer);
      const paymentCustomerId = customerIdOf(payment.customer);
      if (
        !sessionCustomerId ||
        sessionCustomerId !== paymentCustomerId ||
        !isOurLifetimePayment(payment)
      ) {
        return NextResponse.json(INACTIVE);
      }
      const email =
        session.customer_details?.email ?? emailOf(session.customer);
      return NextResponse.json(entitlementFromLifetime(payment, email));
    }

    if (validSubscriptionId) {
      const sub = await stripe.subscriptions.retrieve(validSubscriptionId, {
        expand: ["customer"],
      });
      if (!isOurSubscription(sub)) {
        return NextResponse.json(INACTIVE);
      }
      // Status only. A subscription id is not proof of ownership: it is a
      // bearer string sitting in plaintext localStorage, and this branch exists
      // solely so a device that already holds one can ask whether it is still
      // active.
      //
      // Answering it with the full entitlement made that id a master key. The
      // reply carried the customer id, and /api/portal's whole defence is that
      // "holding a customer id alone is not enough" — it demands both ids, and
      // this handed over the missing half, opening the victim's real billing
      // portal: invoice history, card last four, and a working cancel button.
      // It also returned the subscriber's email, the precise disclosure
      // /api/restore was rewritten to remove, and minted their permanent Pro
      // key, which unlocks their practice record through /api/sync and both
      // PDFs through /api/book.
      //
      // Nothing legitimate needs those fields here. The client keeps the
      // credentials it already earned at checkout — see `apply` in lib/pro.ts,
      // which preserves them across a revalidation rather than blanking them.
      const status = entitlementFrom(sub, null);
      return NextResponse.json({
        ...status,
        customerId: null,
        proKey: null,
        email: null,
      });
    }

    if (validPaymentIntentId) {
      const payment = await stripe.paymentIntents.retrieve(validPaymentIntentId, {
        expand: ["customer", "latest_charge"],
      });
      if (!isOurLifetimePayment(payment)) {
        return NextResponse.json(INACTIVE);
      }
      const status = entitlementFromLifetime(payment, null);
      return NextResponse.json({
        ...status,
        customerId: null,
        proKey: null,
        email: null,
      });
    }

    return invalidBillingReference();
  } catch (error) {
    // A deleted or unknown id is a legitimate "not a member" answer.
    if (isMissingStripeResource(error)) {
      return NextResponse.json(INACTIVE);
    }
    console.error("[api/entitlement]", error);
    return NextResponse.json(
      { error: "Could not check your Pro access. Try again in a moment." },
      { status: 502 },
    );
  }
}
