import { stripe, PRO_PRICE_CENTS, PRO_PRODUCT_ID } from "@/lib/stripe";

export async function POST(request: Request) {
  if (!stripe) {
    return Response.json(
      { error: "Checkout isn't live yet — payments are still being set up. Check back soon." },
      { status: 503 },
    );
  }

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Suede Sing Pro",
              description:
                "One-time unlock: every song, every warmup tier, unlimited saved takes.",
            },
            unit_amount: PRO_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      metadata: { product: PRO_PRODUCT_ID },
      success_url: `${origin}/pro/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pro`,
    });
    if (!session.url) {
      return Response.json(
        { error: "Stripe didn't return a checkout link. Try again." },
        { status: 502 },
      );
    }
    return Response.json({ url: session.url });
  } catch {
    return Response.json(
      { error: "Couldn't start checkout. Try again in a moment." },
      { status: 502 },
    );
  }
}
