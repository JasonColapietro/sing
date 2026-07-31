import { NextResponse } from "next/server";
import { BOOK } from "@/lib/book-data";
import { rateLimit } from "@/lib/rate-limit";
import { entitlementFrom, getStripe, isStripeId } from "@/lib/stripe";

/**
 * Serves a chapter body to a verified subscriber.
 *
 * The book is the one Pro benefit that is pure content, so gating it in the
 * client the way the rest of the app gates UI would mean shipping the whole
 * text to everyone and hiding it with CSS. Instead the bodies never enter the
 * browser bundle: the reader asks for one chapter at a time and this route
 * re-checks the subscription with Stripe — the same source of truth the rest
 * of the app uses — before returning anything.
 */
export async function POST(request: Request) {
  const limited = rateLimit(request, "book", { limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  let subscriptionId: unknown;
  let slug: unknown;
  try {
    const body = (await request.json()) as {
      subscriptionId?: unknown;
      slug?: unknown;
    };
    subscriptionId = body?.subscriptionId;
    slug = body?.slug;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (typeof slug !== "string" || !/^[a-z0-9-]{1,64}$/.test(slug)) {
    return NextResponse.json({ error: "Unknown chapter." }, { status: 400 });
  }
  if (!isStripeId(subscriptionId, "sub_")) {
    return NextResponse.json(
      { error: "Suede Pro is required to read this." },
      { status: 403 },
    );
  }

  const chapter = BOOK.find((c) => c.slug === slug);
  if (!chapter) {
    return NextResponse.json({ error: "Unknown chapter." }, { status: 404 });
  }

  try {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["customer"],
    });
    const entitlement = entitlementFrom(sub, null);
    if (!entitlement.active) {
      return NextResponse.json(
        { error: "That subscription is no longer active." },
        { status: 403 },
      );
    }
    return NextResponse.json({
      slug: chapter.slug,
      title: chapter.title,
      part: chapter.part,
      order: chapter.order,
      body: chapter.body,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { type?: string }).type === "StripeInvalidRequestError"
    ) {
      return NextResponse.json(
        { error: "Suede Pro is required to read this." },
        { status: 403 },
      );
    }
    console.error("[api/book]", error);
    return NextResponse.json(
      { error: "Could not verify your subscription. Try again in a moment." },
      { status: 502 },
    );
  }
}
