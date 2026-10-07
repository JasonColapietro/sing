import { NextResponse } from "next/server";
import { isCheckoutPlan } from "@/lib/pro-shared";
import { rateLimit } from "@/lib/rate-limit";
import {
  getStripe,
  PriceMismatchError,
  PriceNotConfiguredError,
  resolvePriceId,
  siteOrigin,
} from "@/lib/stripe";

/**
 * Starts a Stripe Checkout Session for a Pro purchase and hands the
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

  // Annual remains a valid legacy entitlement, but it must never begin a new
  // sale. Keep this guard ahead of every Stripe lookup and client call.
  if (plan === "annual") {
    return NextResponse.json(
      {
        error:
          "The yearly plan is no longer on sale. Choose monthly or lifetime.",
      },
      { status: 409 },
    );
  }

  if (!isCheckoutPlan(plan)) {
    return NextResponse.json(
      { error: "Choose a monthly or lifetime plan." },
      { status: 400 },
    );
  }

  try {
    const priceId = await resolvePriceId(plan);
    const origin = siteOrigin(request);
    const metadata = {
      app: "suede-sing",
      offer: "early-access",
      plan,
    };
    const common = {
      line_items: [{ price: priceId, quantity: 1 }],
      // This app confirms purchases synchronously after Checkout returns and
      // has no async-payment webhook. Restrict the session to cards so a bank
      // payment cannot settle later after the browser discarded its handle.
      payment_method_types: ["card" as const],
      success_url: `${origin}/pro?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pro?checkout=cancelled`,
      billing_address_collection: "auto" as const,
      metadata,
    };
    const session =
      plan === "monthly"
        ? await getStripe().checkout.sessions.create({
            ...common,
            mode: "subscription",
            allow_promotion_codes: true,
            subscription_data: { metadata },
          })
        : await getStripe().checkout.sessions.create({
            ...common,
            mode: "payment",
            customer_creation: "always",
            payment_intent_data: { metadata },
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
      // Same answer to the buyer either way: the plan can't be sold at the
      // price they were shown. The log carries which of the two it is.
      console.error(
        "[api/checkout] no sellable price for plan",
        error.plan,
        error.message,
      );
      return NextResponse.json(
        {
          error: "That plan isn't on sale right now.",
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
