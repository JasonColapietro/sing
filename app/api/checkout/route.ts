import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getStripe, resolvePriceId, siteOrigin } from "@/lib/stripe";

/**
 * Starts a Stripe Checkout Session for a Pro subscription and hands the
 * hosted URL back to the client. Hosted Checkout (rather than embedded)
 * means Stripe owns card entry, SCA, and receipts — no card data ever
 * touches this app.
 */
export async function POST(request: Request) {
  const limited = rateLimit(request, "checkout", { limit: 8, windowMs: 60_000 });
  if (limited) return limited;

  let plan: unknown;
  try {
    const body = (await request.json()) as { plan?: unknown };
    plan = body?.plan;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  // Monthly is the only plan on sale. `ProPlan` still includes "annual" so
  // existing/legacy subscriptions map correctly, but this route must not sell
  // it — the UI never offers annual, and accepting it here would let a direct
  // POST buy a year at the setup script's $30 price against $9.99/month.
  if (plan !== "monthly") {
    return NextResponse.json(
      { error: "Monthly is the only plan available." },
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
