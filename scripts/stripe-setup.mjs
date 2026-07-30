#!/usr/bin/env node
/**
 * Makes a Stripe account ready to sell Suede Pro.
 *
 * Test-mode and live-mode data are separate spaces in Stripe, so the product,
 * prices, and billing-portal configuration created in the sandbox do not carry
 * over when you switch to live keys. Run this once against each mode:
 *
 *   node --env-file=.env.local scripts/stripe-setup.mjs
 *   STRIPE_SECRET_KEY=sk_live_… node scripts/stripe-setup.mjs
 *
 * Safe to re-run — it reuses whatever already exists and never deletes
 * anything. Prices are keyed by lookup key, which is what the app resolves at
 * runtime, so nothing in the code changes between modes.
 */

import Stripe from "stripe";

const PLANS = [
  {
    lookupKey: "suede_pro_monthly",
    nickname: "Suede Pro monthly",
    unitAmount: 400,
    interval: "month",
  },
  {
    lookupKey: "suede_pro_annual",
    nickname: "Suede Pro annual",
    unitAmount: 3000,
    interval: "year",
  },
];

const PRODUCT_NAME = "Suede Pro";
const PRODUCT_DESCRIPTION =
  "The coach on top of the free vocal studio: adaptive daily plans, per-note analytics, take pitch analysis, full songbook, cloud sync.";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error(
    "STRIPE_SECRET_KEY is not set.\n" +
      "  Test mode: vercel env pull, then node --env-file=.env.local scripts/stripe-setup.mjs\n" +
      "  Live mode: STRIPE_SECRET_KEY=sk_live_… node scripts/stripe-setup.mjs",
  );
  process.exit(1);
}

const live = key.startsWith("sk_live_");
const stripe = new Stripe(key, { appInfo: { name: "Suede Sing setup" } });

console.log(`Stripe mode: ${live ? "LIVE — real cards will be charged" : "test"}`);

/** Reuses the product the existing prices point at, so re-runs don't duplicate. */
async function resolveProduct() {
  for (const plan of PLANS) {
    const { data } = await stripe.prices.list({
      lookup_keys: [plan.lookupKey],
      limit: 1,
    });
    const existing = data[0];
    if (existing) {
      const id =
        typeof existing.product === "string"
          ? existing.product
          : existing.product.id;
      console.log(`product:  ${id} (reused)`);
      return id;
    }
  }

  const search = await stripe.products.search({
    query: `active:'true' AND name:'${PRODUCT_NAME}'`,
    limit: 1,
  });
  if (search.data[0]) {
    console.log(`product:  ${search.data[0].id} (reused)`);
    return search.data[0].id;
  }

  const created = await stripe.products.create({
    name: PRODUCT_NAME,
    description: PRODUCT_DESCRIPTION,
  });
  console.log(`product:  ${created.id} (created)`);
  return created.id;
}

async function ensurePrice(productId, plan) {
  const { data } = await stripe.prices.list({
    lookup_keys: [plan.lookupKey],
    limit: 1,
  });
  const existing = data[0];
  if (existing) {
    const amount = (existing.unit_amount ?? 0) / 100;
    const matches =
      existing.unit_amount === plan.unitAmount &&
      existing.recurring?.interval === plan.interval &&
      existing.active;
    console.log(
      `price:    ${plan.lookupKey} -> ${existing.id} (reused, $${amount}/${existing.recurring?.interval})` +
        (matches ? "" : "  ⚠️  differs from the price on /pro — check it"),
    );
    return;
  }

  const price = await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: plan.unitAmount,
    recurring: { interval: plan.interval },
    lookup_key: plan.lookupKey,
    nickname: plan.nickname,
  });
  console.log(
    `price:    ${plan.lookupKey} -> ${price.id} (created, $${plan.unitAmount / 100}/${plan.interval})`,
  );
}

/** Without a default portal configuration, "cancel in one click" 500s. */
async function ensurePortal() {
  const { data } = await stripe.billingPortal.configurations.list({ limit: 10 });
  const active = data.find((config) => config.is_default && config.active);
  if (active) {
    console.log(`portal:   ${active.id} (reused)`);
    return;
  }

  const config = await stripe.billingPortal.configurations.create({
    business_profile: { headline: "Suede Sing — manage your Pro plan" },
    features: {
      customer_update: { enabled: true, allowed_updates: ["email"] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
    },
  });
  console.log(`portal:   ${config.id} (created)`);
}

const productId = await resolveProduct();
for (const plan of PLANS) {
  await ensurePrice(productId, plan);
}
await ensurePortal();

const account = await stripe.accounts.retrieve().catch(() => null);
if (account) {
  console.log(
    `payouts:  charges_enabled=${account.charges_enabled} payouts_enabled=${account.payouts_enabled}`,
  );
  if (live && !account.charges_enabled) {
    console.log(
      "\n⚠️  This account cannot take charges yet. Finish Stripe activation\n" +
        "   (business details, bank account, identity) in the dashboard.",
    );
  }
}

console.log(
  `\nDone. ${live ? "Live" : "Test"} mode is ready for Suede Pro checkout.`,
);
