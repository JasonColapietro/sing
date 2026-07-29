import { createHmac } from "node:crypto";
import { stripe, PRO_PRODUCT_ID } from "@/lib/stripe";

/**
 * Verify a Stripe Checkout session (the license key) and issue the proof
 * token the client stores. Used both right after checkout and to restore a
 * purchase on another device.
 */
export async function POST(request: Request) {
  if (!stripe) {
    return Response.json(
      { error: "License checks aren't live yet — payments are still being set up." },
      { status: 503 },
    );
  }

  let sessionId: unknown;
  try {
    ({ sessionId } = (await request.json()) as { sessionId?: unknown });
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  if (typeof sessionId !== "string" || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return Response.json(
      { error: "That doesn't look like a license key. It starts with cs_ — copy it exactly." },
      { status: 400 },
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.product !== PRO_PRODUCT_ID) {
      return Response.json(
        { error: "That key isn't a Suede Sing Pro purchase." },
        { status: 404 },
      );
    }
    if (session.payment_status !== "paid") {
      return Response.json(
        { error: "That checkout was never completed, so there's nothing to restore." },
        { status: 402 },
      );
    }
    const token = createHmac("sha256", process.env.STRIPE_SECRET_KEY as string)
      .update(`${PRO_PRODUCT_ID}:${sessionId}`)
      .digest("hex");
    return Response.json({ ok: true, sessionId, token });
  } catch {
    return Response.json(
      { error: "Couldn't find that license key. Check it and try again." },
      { status: 404 },
    );
  }
}
