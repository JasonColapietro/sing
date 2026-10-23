import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  forwardToIntake,
  intakeContact,
  intakeProperty,
  intakeSummary,
  type IntakeEvent,
} from "@/lib/intake-forward";

/**
 * Stripe webhook: tells the Suede AI lead intake hub about each completed Pro
 * checkout (`checkout.session.completed` → purchase).
 *
 * It reports, nothing more. Entitlement is still granted by the buyer's
 * browser returning to /api/entitlement with its checkout session id, and
 * this route never reads, grants or revokes Pro. Before it existed, a buyer
 * who closed the tab before that return was a sale nobody saw. Stripe keeps
 * the payment, so it is the copy of record the intake contract asks a sender
 * to hold before forwarding.
 *
 * The Stripe account bills other Suede products too, so only sessions that
 * /api/checkout opened (metadata.app = "suede-sing") are forwarded; anything
 * else is acknowledged and dropped.
 *
 * What leaves the app: the buyer's email, name and phone as Stripe collected
 * them, the amount, currency, plan and country, and the Stripe customer id
 * (alone it opens nothing; /api/portal needs a subscription id beside it).
 * Never the checkout session, subscription or payment intent id, each of which
 * /api/entitlement accepts, and never card data, which Stripe-hosted Checkout
 * keeps away from this app in the first place.
 *
 * Responses: 400 for a missing or bad signature; 503 when the webhook or the
 * intake sender is not configured, or the hub could not be reached after its
 * retries, so Stripe redelivers the same event later (the hub drops a repeat
 * by its id); 200 otherwise, including events this route ignores and an event
 * the hub refused, which a redelivery would not fix.
 */

function customerIdOf(customer: Stripe.Checkout.Session["customer"]): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

/** Digits after the decimal point for a currency: 2 for USD, 0 for JPY. */
function minorDigits(currency: string): number {
  try {
    return (
      new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() })
        .resolvedOptions().maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch {
    return `${amount} ${currency.toUpperCase()}`;
  }
}

/**
 * The intake event for a completed Sing checkout, or null for another
 * product's session.
 */
function purchaseFrom(event: Stripe.CheckoutSessionCompletedEvent): IntakeEvent | null {
  const session = event.data.object;
  if (session.metadata?.app !== "suede-sing") return null;

  const plan = session.metadata?.plan ?? null;
  const currency = session.currency ?? null;
  const amount =
    session.amount_total !== null && currency
      ? session.amount_total / 10 ** minorDigits(currency)
      : null;
  const price = amount !== null && currency ? formatAmount(amount, currency) : null;
  // /api/checkout takes cards only, so a completed session is paid. Should a
  // delayed method ever be allowed, the event still goes out, marked.
  const pending = session.payment_status === "unpaid" ? " (payment pending)" : "";
  const what = `Suede Pro ${plan ?? ""} purchase${price ? `, ${price}` : ""}${pending}`
    .replace(/\s+/g, " ");
  const details = session.customer_details;
  const contact = intakeContact({
    email: details?.email ?? session.customer_email,
    name: details?.name,
    phone: details?.phone,
  });

  return {
    id: `stripe:${event.id}`,
    kind: "purchase",
    property: intakeProperty(),
    occurredAt: new Date(event.created * 1000).toISOString(),
    summary: intakeSummary(event.livemode ? what : `Test mode: ${what}`),
    person: contact.person,
    details: {
      ...contact.details,
      plan,
      offer: session.metadata?.offer ?? null,
      mode: session.mode,
      amount,
      currency,
      paymentStatus: session.payment_status,
      country: details?.address?.country ?? null,
      stripeCustomer: customerIdOf(session.customer),
      livemode: event.livemode,
    },
  };
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    // Retryable, so Stripe redelivers once the secret is set rather than
    // dropping every purchase made in between.
    console.error(
      "[webhooks/stripe] STRIPE_WEBHOOK_SECRET is not set; refusing the event so Stripe retries it.",
    );
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  // The signature covers the exact bytes Stripe sent, so verify the raw body
  // and never re-serialise parsed JSON.
  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.warn(
      "[webhooks/stripe] signature verification failed",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, forwarded: false });
  }
  const purchase = purchaseFrom(event);
  if (!purchase) {
    return NextResponse.json({ received: true, forwarded: false });
  }

  const result = await forwardToIntake(purchase);
  if (!result.ok && result.reason === "rejected") {
    // A redelivery cannot fix a refusal, so Stripe gets a 200, but the
    // purchase report is now lost unless someone acts on this line. Ids only.
    console.error("[webhooks/stripe] lead intake refused the event; it was not stored", {
      id: purchase.id,
      kind: purchase.kind,
    });
  }
  if (!result.ok && result.reason !== "rejected") {
    return NextResponse.json(
      { error: "Lead intake unavailable; retry later." },
      { status: 503 },
    );
  }
  return NextResponse.json({ received: true, forwarded: result.ok });
}
