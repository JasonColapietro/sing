import { NextResponse } from "next/server";
import { isProPlan } from "@/lib/pro-shared";
import { getStripe, resolvePriceId, siteOrigin } from "@/lib/stripe";

/**
 * Starts a Stripe Checkout Session for a Pro subscription and hands the
 * hosted URL back to the client. Hosted Checkout (rather than embedded)
 * means Stripe owns card entry, SCA, and receipts — no card data ever
 * touches this app.
 */
export async function POST(request: Request) {
  let plan: unknown;
  try {
    const body = (await request.json()) as { plan?: unknown };
    plan = body?.plan;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (!isProPlan(plan)) {
    return NextResponse.json(
      { error: "Choose a monthly or annual plan." },
      { status: 400 },
    );
  }

  try {
    const origin = siteOrigin(request);
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: await resolvePriceId(plan), quantity: 1 }],
      success_url: `${origin}/pro?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pro?checkout=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      subscription_data: { metadata: { app: "suede-sing", plan } },
    });

    if (!session.url) {
      throw new Error("Stripe returned a session without a redirect URL.");
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[api/checkout]", error);
    return NextResponse.json(
      { error: "Could not reach Stripe. Try again in a moment." },
      { status: 502 },
    );
  }
}
