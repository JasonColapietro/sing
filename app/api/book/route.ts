import { NextResponse } from "next/server";
import { BOOK } from "@/lib/book-data";
import { ATLAS, type AtlasChapter } from "@/lib/atlas-data";
import { rateLimit } from "@/lib/rate-limit";
import { entitlementFrom, getStripe, isStripeId } from "@/lib/stripe";

/**
 * Serves a chapter body to a verified subscriber — for either book.
 *
 * The books are the Pro benefits that are pure content, so gating them in the
 * client the way the rest of the app gates UI would mean shipping the whole
 * text to everyone and hiding it with CSS. Instead the bodies never enter the
 * browser bundle: the reader asks for one chapter at a time and this route
 * re-checks the subscription with Stripe — the same source of truth the rest
 * of the app uses — before returning anything.
 *
 * `book` selects the title: "measured-voice" (default) or "atlas". Atlas
 * responses also carry the chapter's structured singer entries. The atlas's
 * free sample chapter is rendered server-side on its own page and never
 * requested here, so this route stays uniformly subscriber-only.
 */
export async function POST(request: Request) {
  const limited = rateLimit(request, "book", { limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  let subscriptionId: unknown;
  let slug: unknown;
  let book: unknown;
  try {
    const body = (await request.json()) as {
      subscriptionId?: unknown;
      slug?: unknown;
      book?: unknown;
    };
    subscriptionId = body?.subscriptionId;
    slug = body?.slug;
    book = body?.book;
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

  const chapter =
    book === "atlas"
      ? ATLAS.find((c) => c.slug === slug)
      : BOOK.find((c) => c.slug === slug);
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
      entries: book === "atlas" ? (chapter as AtlasChapter).entries : undefined,
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
