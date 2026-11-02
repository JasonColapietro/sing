import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getStripe, isStripeId, siteOrigin } from "@/lib/stripe";
import { SUPPORT_EMAIL } from "@/lib/organization";
import { PORTAL_RETURN_PATH } from "@/lib/pro-shared";

/**
 * Every answer from this route is for one browser only, so no shared cache
 * (Vercel's edge, a proxy, a CDN) may keep it and the browser must not reuse
 * it. Errors and the rate limit's 429 get the same header.
 */
const NO_STORE = "private, no-store";

function noStore<T extends Response>(response: T): T {
  response.headers.set("Cache-Control", NO_STORE);
  return response;
}

/** NextResponse.json, marked private and no-store. */
function json(body: unknown, init?: ResponseInit) {
  return noStore(NextResponse.json(body, init));
}

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
  if (limited) return noStore(limited);

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
    return json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (!isStripeId(customerId, "cus_") || !isStripeId(subscriptionId, "sub_")) {
    return json(
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
      return json(
        { error: "That subscription doesn't belong to this account." },
        { status: 403 },
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: owner,
      // Marked, so /pro re-checks the entitlement on the way back instead of
      // showing the pre-portal plan for up to 12 hours.
      return_url: `${siteOrigin(request)}${PORTAL_RETURN_PATH}`,
    });
    return json({ url: session.url });
  } catch (error) {
    // A subscription Stripe has never heard of isn't a transient fault, and
    // telling that person to "try again in a moment" sends them retrying a
    // button that can never work. It happens for real: a subscription deleted
    // in Stripe, or ids left in localStorage from a test checkout. Other
    // invalid-request errors (e.g. no portal configuration) are ours, not
    // the subscriber's, so they fall through to the logged 502.
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { type?: string }).type === "StripeInvalidRequestError" &&
      (error as { code?: string }).code === "resource_missing"
    ) {
      return json(
        {
          error:
            `We couldn't find that subscription in Stripe. Unlock Pro again with your Pro key, or email ${SUPPORT_EMAIL}.`,
        },
        { status: 404 },
      );
    }
    console.error("[api/portal]", error);
    return json(
      { error: "Could not open the billing portal. Try again in a moment." },
      { status: 502 },
    );
  }
}
