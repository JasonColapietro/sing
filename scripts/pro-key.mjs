#!/usr/bin/env node
/**
 * Regenerates a purchaser's Pro key, the support path for "I lost my key".
 *
 *   node --env-file=.env.local scripts/pro-key.mjs sub_123…
 *   node --env-file=.env.local scripts/pro-key.mjs pi_123…
 *   node --env-file=.env.local scripts/pro-key.mjs someone@example.com
 *
 * Keys are derived, not stored, so this prints the same key the purchaser
 * originally saw. Requires STRIPE_SECRET_KEY and PRO_KEY_SECRET.
 */

import { createHmac } from "node:crypto";
import Stripe from "stripe";

const [, , query] = process.argv;
if (!query) {
  console.error(
    "Usage: node --env-file=.env.local scripts/pro-key.mjs <subscription-id|payment-intent-id|email>",
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
function mint(customerId, billingId) {
  const payload = Buffer.from(`${customerId}:${billingId}`, "utf8").toString(
    "base64url",
  );
  const signature = createHmac("sha256", keySecret)
    .update(`suede-pro.v1.${payload}`)
    .digest("base64url");
  return `suede-pro_${payload}.${signature}`;
}

async function findPurchases() {
  if (query.startsWith("sub_")) {
    return [
      {
        kind: "subscription",
        value: await stripe.subscriptions.retrieve(query),
      },
    ];
  }
  if (query.startsWith("pi_")) {
    return [
      {
        kind: "lifetime",
        value: await stripe.paymentIntents.retrieve(query, {
          expand: ["latest_charge"],
        }),
      },
    ];
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
      found.push(...subs.map((value) => ({ kind: "subscription", value })));
      const { data: payments } = await stripe.paymentIntents.list({
        customer: customer.id,
        limit: 20,
        expand: ["data.latest_charge"],
      });
      found.push(
        ...payments
          .filter(
            (payment) =>
              payment.metadata.app === "suede-sing" &&
              payment.metadata.plan === "lifetime",
          )
          .map((value) => ({ kind: "lifetime", value })),
      );
    }
    if (found.length > 0) break;
  }
  return found;
}

const purchases = await findPurchases();
if (purchases.length === 0) {
  console.log("No Pro purchases found for that email or id.");
  process.exit(0);
}

for (const purchase of purchases) {
  const value = purchase.value;
  const customerId =
    typeof value.customer === "string" ? value.customer : value.customer.id;
  if (purchase.kind === "subscription") {
    const entitles = ["active", "trialing", "past_due"].includes(value.status);
    console.log(`\nsubscription: ${value.id}`);
    console.log(`status:       ${value.status}${entitles ? "" : "  (won't unlock Pro)"}`);
    console.log(`pro key:      ${mint(customerId, value.id)}`);
    continue;
  }

  const charge = value.latest_charge;
  const entitles =
    value.status === "succeeded" &&
    value.currency === "usd" &&
    value.amount_received === 7900 &&
    value.metadata.app === "suede-sing" &&
    value.metadata.offer === "early-access" &&
    value.metadata.plan === "lifetime" &&
    charge &&
    typeof charge !== "string" &&
    charge.paid &&
    !charge.refunded &&
    !charge.disputed &&
    charge.amount_refunded === 0;
  console.log(`\npayment:      ${value.id}`);
  console.log(`status:       ${value.status}${entitles ? "" : "  (won't unlock Pro)"}`);
  console.log(`pro key:      ${mint(customerId, value.id)}`);
}
console.log("");
