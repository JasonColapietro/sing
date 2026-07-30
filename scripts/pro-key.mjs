#!/usr/bin/env node
/**
 * Regenerates a subscriber's Pro key — the support path for "I lost my key".
 *
 *   node --env-file=.env.local scripts/pro-key.mjs sub_123…
 *   node --env-file=.env.local scripts/pro-key.mjs someone@example.com
 *
 * Keys are derived, not stored, so this prints the same key the subscriber
 * originally saw. Requires STRIPE_SECRET_KEY and PRO_KEY_SECRET.
 */

import { createHmac } from "node:crypto";
import Stripe from "stripe";

const [, , query] = process.argv;
if (!query) {
  console.error(
    "Usage: node --env-file=.env.local scripts/pro-key.mjs <subscription-id|email>",
  );
  process.exit(1);
}

const stripeKey = process.env.STRIPE_SECRET_KEY;
const keySecret = process.env.PRO_KEY_SECRET;
if (!stripeKey || !keySecret) {
  console.error(
    "Missing STRIPE_SECRET_KEY or PRO_KEY_SECRET. Run `vercel env pull` first.",
  );
  process.exit(1);
}

const stripe = new Stripe(stripeKey);

/** Must stay in step with lib/pro-key.ts. */
function mint(customerId, subscriptionId) {
  const payload = Buffer.from(`${customerId}:${subscriptionId}`, "utf8").toString(
    "base64url",
  );
  const signature = createHmac("sha256", keySecret)
    .update(`suede-pro.v1.${payload}`)
    .digest("base64url");
  return `suede-pro_${payload}.${signature}`;
}

async function findSubscriptions() {
  if (query.startsWith("sub_")) {
    return [await stripe.subscriptions.retrieve(query)];
  }

  const found = [];
  for (const email of new Set([query.trim(), query.trim().toLowerCase()])) {
    const { data } = await stripe.customers.list({ email, limit: 10 });
    for (const customer of data) {
      const { data: subs } = await stripe.subscriptions.list({
        customer: customer.id,
        status: "all",
        limit: 20,
      });
      found.push(...subs);
    }
    if (found.length > 0) break;
  }
  return found;
}

const subs = await findSubscriptions();
if (subs.length === 0) {
  console.log("No subscriptions found for that email or id.");
  process.exit(0);
}

for (const sub of subs) {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const entitles = ["active", "trialing", "past_due"].includes(sub.status);
  console.log(`\nsubscription: ${sub.id}`);
  console.log(`status:       ${sub.status}${entitles ? "" : "  (won't unlock Pro)"}`);
  console.log(`pro key:      ${mint(customerId, sub.id)}`);
}
console.log("");
