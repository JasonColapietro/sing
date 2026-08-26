#!/usr/bin/env node
/**
 * Makes a Stripe account ready to sell Suede Pro.
 *
 * Test-mode and live-mode data are separate spaces in Stripe, so the product,
 * prices, and billing-portal configuration created in the sandbox do not carry
 * over when you switch to live keys. Run this once against each mode:
 *
 *   node --env-file=.env.local scripts/stripe-setup.mjs
 *   vercel env run -e production -- node scripts/stripe-setup.mjs
 *
 * Name plans to work on only those. The sellable catalog is deliberately
 * monthly and lifetime only; legacy annual prices are never modified:
 *
 *   npm run stripe:setup -- lifetime
 *   vercel env run -e production -- node scripts/stripe-setup.mjs lifetime
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
    lookupKey: "suede_pro_monthly_early_access",
    nickname: "Suede Pro monthly - Early Access",
    unitAmount: 499,
    interval: "month",
  },
  {
    key: "lifetime",
    lookupKey: "suede_pro_lifetime_early_access",
    nickname: "Suede Pro lifetime - Early Access",
    unitAmount: 5900,
    interval: null,
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
const PRODUCT_LOOKUP_KEYS = [
  ...PLANS.map((plan) => plan.lookupKey),
  "suede_pro_monthly",
  "suede_pro_annual",
];

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error(
    "STRIPE_SECRET_KEY is not set.\n" +
      "  Test mode: vercel env pull, then node --env-file=.env.local scripts/stripe-setup.mjs\n" +
      "  Live mode: vercel env run -e production -- node scripts/stripe-setup.mjs",
  );
  process.exit(1);
}

const live = key.startsWith("sk_live_");
const stripe = new Stripe(key, { appInfo: { name: "Suede Sing setup" } });

console.log(`Stripe mode: ${live ? "LIVE catalog" : "test"}`);

/** Reuses the canonical product without changing any legacy prices. */
async function resolveProduct() {
  for (const lookupKey of PRODUCT_LOOKUP_KEYS) {
    const { data } = await stripe.prices.list({
      lookup_keys: [lookupKey],
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
      existing.active &&
      existing.currency === "usd" &&
      existing.unit_amount === plan.unitAmount &&
      (existing.recurring?.interval ?? null) === plan.interval;
    const billing = existing.recurring?.interval ?? "one-time";
    console.log(
      `price:    ${plan.lookupKey} -> ${existing.id} (reused, $${amount}/${billing})` +
        (matches
          ? ""
          : `  ⚠️  /pro quotes $${plan.unitAmount / 100}/${plan.interval ?? "one-time"}`),
    );
    return matches ? "reused" : "mismatch";
  }

  const price = await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: plan.unitAmount,
    ...(plan.interval ? { recurring: { interval: plan.interval } } : {}),
    lookup_key: plan.lookupKey,
    nickname: plan.nickname,
    // The key may still be held by an archived price — Stripe rejects the
    // create otherwise, and only an archived one can hold it here.
    transfer_lookup_key: true,
  });
  console.log(
    `price:    ${plan.lookupKey} -> ${price.id} (created, $${plan.unitAmount / 100}/${plan.interval ?? "one-time"})`,
  );
  return "created";
}

const PORTAL_FEATURES = {
  customer_update: { enabled: true, allowed_updates: ["email"] },
  invoice_history: { enabled: true },
  payment_method_update: { enabled: true },
  subscription_cancel: { enabled: true, mode: "at_period_end" },
};

function portalReady(config) {
  return (
    config.features.customer_update.enabled &&
    config.features.customer_update.allowed_updates.includes("email") &&
    config.features.invoice_history.enabled &&
    config.features.payment_method_update.enabled &&
    config.features.subscription_cancel.enabled &&
    config.features.subscription_cancel.mode === "at_period_end"
  );
}

/** Ensures the monthly cancellation and card-update promises are operational. */
async function ensurePortal() {
  const { data } = await stripe.billingPortal.configurations.list({ limit: 10 });
  const active = data.find((config) => config.is_default && config.active);
  if (active) {
    if (portalReady(active)) {
      console.log(`portal:   ${active.id} (reused)`);
      return;
    }
    await stripe.billingPortal.configurations.update(active.id, {
      business_profile: { headline: "Suede Sing - manage your Pro plan" },
      features: PORTAL_FEATURES,
    });
    console.log(`portal:   ${active.id} (updated for self-service cancellation)`);
    return;
  }

  const config = await stripe.billingPortal.configurations.create({
    business_profile: { headline: "Suede Sing - manage your Pro plan" },
    features: PORTAL_FEATURES,
  });
  console.log(`portal:   ${config.id} (created)`);
}

const productId = await resolveProduct();
const mismatched = [];
for (const plan of selected) {
  const outcome = await ensurePrice(productId, plan);
  if (outcome === "mismatch") mismatched.push(plan);
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

if (mismatched.length) {
  console.error(
    `\n❌ Not ready: ${mismatched
      .map((plan) => `${plan.key} (want $${plan.unitAmount / 100})`)
      .join(", ")}.\n` +
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
