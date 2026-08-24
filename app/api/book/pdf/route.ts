import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { INACTIVE } from "@/lib/pro-shared";
import { rateLimit } from "@/lib/rate-limit";
import {
  entitlementFrom,
  entitlementFromLifetime,
  getStripe,
  isOurSubscription,
  isStripeId,
} from "@/lib/stripe";

/**
 * Serves a book PDF to a verified Pro customer.
 *
 * The PDFs used to live in public/, which made them world-readable at a
 * stable URL — the whole book, free, to anyone who ever saw the link. They
 * now live in content/pdfs/ (bundled into this function via
 * outputFileTracingIncludes) and are only streamed after the same Stripe
 * subscription or lifetime-payment check /api/book performs for chapters.
 */

const PDFS: Record<string, { file: string; filename: string }> = {
  "measured-voice": {
    file: "the-measured-voice.pdf",
    filename: "the-measured-voice.pdf",
  },
  atlas: {
    file: "the-voice-atlas.pdf",
    filename: "the-voice-atlas.pdf",
  },
};

export async function POST(request: Request) {
  const limited = rateLimit(request, "book-pdf", { limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  let subscriptionId: unknown;
  let paymentIntentId: unknown;
  let book: unknown;
  try {
    const body = (await request.json()) as {
      subscriptionId?: unknown;
      paymentIntentId?: unknown;
      book?: unknown;
    };
    subscriptionId = body?.subscriptionId;
    paymentIntentId = body?.paymentIntentId;
    book = body?.book;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const pdf = typeof book === "string" ? PDFS[book] : undefined;
  if (!pdf) {
    return NextResponse.json({ error: "Unknown book." }, { status: 400 });
  }
  let billing:
    | { kind: "subscription"; id: string }
    | { kind: "lifetime"; id: string };
  if (paymentIntentId == null && isStripeId(subscriptionId, "sub_")) {
    billing = { kind: "subscription", id: subscriptionId };
  } else if (
    subscriptionId == null &&
    isStripeId(paymentIntentId, "pi_")
  ) {
    billing = { kind: "lifetime", id: paymentIntentId };
  } else {
    return NextResponse.json(
      { error: "Suede Pro is required to download this." },
      { status: 403 },
    );
  }

  try {
    const stripe = getStripe();
    let entitlement = INACTIVE;
    if (billing.kind === "subscription") {
      const sub = await stripe.subscriptions.retrieve(billing.id, {
        expand: ["customer"],
      });
      // Same guard as /api/restore: an id from another product on this Stripe
      // account must not unlock a Suede Sing book.
      if (isOurSubscription(sub)) entitlement = entitlementFrom(sub, null);
    } else {
      const payment = await stripe.paymentIntents.retrieve(billing.id, {
        expand: ["customer", "latest_charge"],
      });
      entitlement = entitlementFromLifetime(payment, null);
    }
    if (!entitlement.active) {
      return NextResponse.json(
        {
          error:
            billing.kind === "subscription"
              ? "That subscription is no longer active."
              : "That lifetime purchase is no longer active.",
        },
        { status: 403 },
      );
    }

    const bytes = await readFile(
      path.join(process.cwd(), "content", "pdfs", pdf.file),
    );
    return new Response(new Uint8Array(bytes), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${pdf.filename}"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { type?: string }).type === "StripeInvalidRequestError"
    ) {
      return NextResponse.json(
        { error: "Suede Pro is required to download this." },
        { status: 403 },
      );
    }
    console.error("[api/book/pdf]", error);
    return NextResponse.json(
      { error: "Could not verify your Pro access. Try again in a moment." },
      { status: 502 },
    );
  }
}
