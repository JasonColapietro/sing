import { NextResponse } from "next/server";
import { isProPlan } from "@/lib/pro-shared";
import { rateLimit } from "@/lib/rate-limit";
import {
  getStripe,
  PriceMismatchError,
  PriceNotConfiguredError,
  resolvePriceId,
  siteOrigin,
} from "@/lib/stripe";

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

  if (!isProPlan(plan)) {
    return NextResponse.json(
      { error: "Choose a monthly or annual plan." },
      { status: 400 },
    );
  }

  try {
    // Resolved per request rather than pinned in the bundle, so the annual
    // plan starts selling the moment its Stripe price exists — and answers
    // honestly until then. Resolution also refuses a price that charges
    // something other than the page quoted, so no session can open at an
    // amount the singer never saw.
    const priceId = await resolvePriceId(plan);
    const origin = siteOrigin(request);
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
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
    if (
      error instanceof PriceNotConfiguredError ||
      error instanceof PriceMismatchError
    ) {
      // Same answer to the buyer either way — the plan can't be sold at the
      // price they were shown. The log carries which of the two it is.
      console.error(
        "[api/checkout] no sellable price for plan",
        error.plan,
        error.message,
      );
      return NextResponse.json(
        {
          error:
            error.plan === "annual"
              ? "The yearly plan isn't on sale yet. Monthly is ready now."
              : "That plan isn't on sale right now.",
        },
        { status: 409 },
      );
    }
    console.error("[api/checkout]", error);
    return NextResponse.json(
      { error: "Could not reach Stripe. Try again in a moment." },
      { status: 502 },
    );
  }
}
