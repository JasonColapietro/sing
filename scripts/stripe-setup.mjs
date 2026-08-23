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
 * Name plans to work on only those — this is how the yearly price gets created
 * on its own, once, without touching a live monthly price:
 *
 *   npm run stripe:setup -- annual
 *   STRIPE_SECRET_KEY=sk_live_… node scripts/stripe-setup.mjs annual
 *
 * Safe to re-run — it reuses whatever already exists and never deletes
 * anything. Prices are keyed by lookup key, which is what the app resolves at
 * runtime, so nothing in the code changes between modes.
 */

import Stripe from "stripe";

/**
 * Amounts are in cents and must match PRICING in lib/pro-shared.ts, which is
 * what every page displays. A mismatch is fatal: this script never edits a
 * price it didn't create, so it reports the plan as not ready and exits
 * non-zero rather than leaving an operator to deploy a page quoting one price
 * over a Stripe price that charges another. Checkout refuses that pairing too.
 */
const PLANS = [
  {
    key: "monthly",
    lookupKey: "suede_pro_monthly",
    nickname: "Suede Pro monthly",
    unitAmount: 999,
    interval: "month",
  },
  {
    key: "annual",
    lookupKey: "suede_pro_annual",
    nickname: "Suede Pro annual",
    unitAmount: 2900,
    interval: "year",
  },
];

const requested = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
const unknown = requested.filter((arg) => !PLANS.some((p) => p.key === arg));
if (unknown.length) {
  console.error(
    `Unknown plan: ${unknown.join(", ")}\n` +
      `  Usage: node scripts/stripe-setup.mjs [${PLANS.map((p) => p.key).join("|")}]\n` +
      "  With no plan named, every plan is created or reused.",
  );
  process.exit(1);
}
const selected = requested.length
  ? PLANS.filter((plan) => requested.includes(plan.key))
  : PLANS;

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
  // active: true is the same question resolvePriceId() asks at checkout — an
  // archived price with this lookup key is not a price the app can sell.
  const { data } = await stripe.prices.list({
    lookup_keys: [plan.lookupKey],
    active: true,
    limit: 1,
  });
  const existing = data[0];
  if (existing) {
    const amount = (existing.unit_amount ?? 0) / 100;
    const matches =
      existing.unit_amount === plan.unitAmount &&
      existing.recurring?.interval === plan.interval;
    console.log(
      `price:    ${plan.lookupKey} -> ${existing.id} (reused, $${amount}/${existing.recurring?.interval})` +
        (matches ? "" : "  ⚠️  differs from the price on /pro"),
    );
    return matches ? "reused" : "mismatch";
  }

  const price = await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: plan.unitAmount,
    recurring: { interval: plan.interval },
    lookup_key: plan.lookupKey,
    nickname: plan.nickname,
    // The key may still be held by an archived price — Stripe rejects the
    // create otherwise, and only an archived one can hold it here.
    transfer_lookup_key: true,
  });
  console.log(
    `price:    ${plan.lookupKey} -> ${price.id} (created, $${plan.unitAmount / 100}/${plan.interval})`,
  );
  return "created";
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
const ready = new Set();
const mismatched = [];
for (const plan of selected) {
  const outcome = await ensurePrice(productId, plan);
  if (outcome === "mismatch") mismatched.push(plan);
  else ready.add(plan.key);
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

if (ready.has("annual")) {
  console.log(
    "\nThe yearly price is in place. The pricing page still shows monthly only\n" +
      "   until NEXT_PUBLIC_PRO_ANNUAL=1 is set in the environment and the app is\n" +
      "   redeployed — that flag is what renders the monthly/yearly toggle.",
  );
}

if (mismatched.length) {
  console.error(
    `\n❌ Not ready: ${mismatched.map((plan) => plan.key).join(", ")}.\n` +
      "   A price already holds that lookup key at a different amount or interval,\n" +
      "   and this script won't repoint or archive a price it didn't create.\n" +
      "   In the Stripe dashboard, either archive that price and re-run this, or\n" +
      "   change PRICING in lib/pro-shared.ts to what Stripe holds.\n" +
      "   Until they agree, checkout refuses the plan rather than charging an\n" +
      "   amount the page never showed.",
  );
  process.exit(1);
}

console.log(
  `\nDone. ${live ? "Live" : "Test"} mode is ready for Suede Pro checkout.`,
);
