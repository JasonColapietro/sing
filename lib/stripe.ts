import "server-only";

import Stripe from "stripe";

/**
 * Stripe client, or null while the Vercel Stripe integration hasn't been
 * connected yet (no STRIPE_SECRET_KEY). API routes must handle null and
 * return a friendly 503 so the app ships safely before payments are live.
 */
const key = process.env.STRIPE_SECRET_KEY;
export const stripe = key ? new Stripe(key) : null;

/** Written into checkout-session metadata and verified on license restore. */
export const PRO_PRODUCT_ID = "suede-sing-pro";

/** One-time price in USD cents. Keep in sync with copy on /pro. */
export const PRO_PRICE_CENTS = 900;
