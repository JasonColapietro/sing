import { NextResponse } from "next/server";
import { ENTITLING_STATUSES, INACTIVE } from "@/lib/pro-shared";
import { entitlementFrom, getStripe, isOurSubscription } from "@/lib/stripe";
import type Stripe from "stripe";

/**
 * Brings Pro back on a new device or a cleared browser.
 *
 * Entitlement normally lives in this browser's storage; this is the escape
 * hatch when that storage is gone. Matching on email alone is a deliberate
 * trade-off for an app with no accounts — what it unlocks is feature access,
 * never anyone's practice data, which stays on-device. Cancellation and
 * billing still require the Stripe portal.
 */
export async function POST(request: Request) {
  let raw: unknown;
  try {
    const body = (await request.json()) as { email?: unknown };
    raw = body?.email;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (typeof raw !== "string" || raw.length > 254 || !/^\S+@\S+\.\S+$/.test(raw.trim())) {
    return NextResponse.json(
      { error: "Enter the email address you paid with." },
      { status: 400 },
    );
  }

  const typed = raw.trim();
  const stripe = getStripe();

  try {
    // Stripe's email filter is case-sensitive, so try what they typed and
    // then the lowercased form before giving up.
    const candidates = new Set([typed, typed.toLowerCase()]);
    const customers: Stripe.Customer[] = [];
    for (const email of candidates) {
      const { data } = await stripe.customers.list({ email, limit: 10 });
      customers.push(...data);
      if (data.length > 0) break;
    }

    for (const customer of customers) {
      const { data: subs } = await stripe.subscriptions.list({
        customer: customer.id,
        status: "all",
        limit: 20,
      });
      const match = subs.find(
        (sub) =>
          (ENTITLING_STATUSES as readonly string[]).includes(sub.status) &&
          isOurSubscription(sub),
      );
      if (match) {
        return NextResponse.json(entitlementFrom(match, customer.email));
      }
    }

    return NextResponse.json({
      ...INACTIVE,
      error: "No active Pro subscription found for that email.",
    });
  } catch (error) {
    console.error("[api/restore]", error);
    return NextResponse.json(
      { error: "Could not reach Stripe. Try again in a moment." },
      { status: 502 },
    );
  }
}
