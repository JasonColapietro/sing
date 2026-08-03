import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getStripe, isStripeId, siteOrigin } from "@/lib/stripe";

/**
 * Opens the Stripe billing portal, which is where cancelling, swapping
 * plans, and updating a card actually happen — that is what makes the
 * "cancel in one click" promise on /pro true.
 *
 * Both ids are required and must agree: holding a customer id alone is not
 * enough to open someone's billing history.
 */
export async function POST(request: Request) {
  const limited = rateLimit(request, "portal", { limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  let customerId: unknown;
  let subscriptionId: unknown;
  try {
    const body = (await request.json()) as {
      customerId?: unknown;
      subscriptionId?: unknown;
    };
    customerId = body?.customerId;
    subscriptionId = body?.subscriptionId;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (!isStripeId(customerId, "cus_") || !isStripeId(subscriptionId, "sub_")) {
    return NextResponse.json(
      { error: "No subscription found on this device." },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const owner =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;

    if (owner !== customerId) {
      return NextResponse.json(
        { error: "That subscription doesn't belong to this account." },
        { status: 403 },
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: owner,
      return_url: `${siteOrigin(request)}/pro`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    // A subscription Stripe has never heard of isn't a transient fault, and
    // telling that person to "try again in a moment" sends them retrying a
    // button that can never work. It happens for real: a subscription deleted
    // in Stripe, or ids left in localStorage from a test checkout.
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { type?: string }).type === "StripeInvalidRequestError"
    ) {
      return NextResponse.json(
        {
          error:
            "We couldn't find that subscription in Stripe. Unlock Pro again with your Pro key, or email hey@suedeai.ai.",
        },
        { status: 404 },
      );
    }
    console.error("[api/portal]", error);
    return NextResponse.json(
      { error: "Could not open the billing portal. Try again in a moment." },
      { status: 502 },
    );
  }
}
