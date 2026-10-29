/**
 * Checkout recovery against a local production build with synthetic payments.
 * node e2e/checkout-recovery.mjs [http://127.0.0.1:3100] [--executable=/path/to/chromium]
 * Every API and external request is intercepted; no Stripe charge is made.
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { browserTarget, cliArgs } from "./lib/args.mjs";

const cli = cliArgs("http://127.0.0.1:3100");
const base = new URL(cli.base);
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname), "Use a local test server");
const keys = {
  started: "suede-sing:pro:started-checkout",
  pending: "suede-sing:pro:pending-checkout",
  pro: "suede-sing:pro:v2",
};
const sessionId = "cs_test_browser_recovery";
const inactive = {
  active: false, plan: null, status: null, subscriptionId: null,
  paymentIntentId: null, customerId: null, email: null,
  currentPeriodEnd: null, cancelAtPeriodEnd: false, proKey: null,
};
const paid = {
  ...inactive, active: true, plan: "lifetime", status: "succeeded",
  paymentIntentId: "pi_browser_recovery", customerId: "cus_browser_recovery",
  proKey: "suede-pro_browser_recovery_fixture", email: "fixture@example.com",
};

async function stored(page) {
  return page.evaluate((keys) => ({
    started: localStorage.getItem(keys.started),
    pending: localStorage.getItem(keys.pending),
    pro: JSON.parse(localStorage.getItem(keys.pro)),
  }), keys);
}

async function fixture(browser) {
  const context = await browser.newContext({ serviceWorkers: "block" });
  const wire = { status: "processing", httpStatus: 200, confirmations: [], purchases: 0, errors: [] };
  await context.addInitScript((origin) => {
    // A new page starts at about:blank, where storage is unavailable.
    if (location.origin !== origin) return;
    localStorage.setItem("suede-sing:progress-cloud:v1", JSON.stringify({ paused: true, generation: "checkout-test" }));
    localStorage.setItem("suede-sing:coach-intro:v1", new Date().toISOString());
  }, base.origin);
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== base.origin) return route.abort("blockedbyclient");
    if (url.pathname === "/fixture-checkout") {
      return route.fulfill({ contentType: "text/html", body: "<p>Synthetic checkout receipt</p>" });
    }
    if (!url.pathname.startsWith("/api/")) return route.continue();
    try {
      assert.equal(request.method(), "POST");
      if (url.pathname === "/api/checkout") {
        assert.deepEqual(request.postDataJSON(), { plan: "lifetime" });
        wire.purchases++;
        return await route.fulfill({ json: { id: sessionId, url: new URL("/fixture-checkout", base).href } });
      }
      assert.equal(url.pathname, "/api/entitlement", "unexpected API request");
      assert.deepEqual(request.postDataJSON(), { sessionId });
      wire.confirmations.push(sessionId);
      return await route.fulfill({
        status: wire.httpStatus,
        json: wire.httpStatus === 400 ? { error: "Invalid checkout reference" }
          : wire.status === "succeeded" ? paid : { ...inactive, status: wire.status },
      });
    } catch (error) {
      wire.errors.push(error.message);
      return route.fulfill({ status: 500, json: { error: "Unexpected fixture request" } });
    }
  });
  context.on("page", (page) => page.on("pageerror", (error) => wire.errors.push(error.message)));
  return { context, wire, page: await context.newPage() };
}

async function unlocked(page) {
  await page.getByRole("link", { name: "Sing your first pro warmup", exact: true }).waitFor();
  const state = await stored(page);
  assert.equal(state.pro.active, true);
  assert.equal(state.pro.proKey, paid.proKey);
  assert.equal(state.pending, null);
  assert.equal(state.started, null);
}

const browser = await chromium.launch(browserTarget(cli.executable, {}));
try {
  {
    const { context, page, wire } = await fixture(browser);
    try {
      await page.goto(new URL(`/pro?checkout=success&session_id=${sessionId}`, base).href);
      await page.getByText(/Reload this page and we'll try again/).waitFor();
      assert.equal(new URL(page.url()).search, "", "the success URL is stripped");
      assert.equal((await stored(page)).pending, sessionId);
      await page.reload();
      await page.getByText(/Reload this page and we'll try again/).waitFor();
      assert.equal((await stored(page)).pending, sessionId);
      assert.equal((await stored(page)).pro.active, false, "processing alone does not grant Pro");
      wire.status = "succeeded";
      await page.close();
      const later = await context.newPage();
      await later.goto(new URL("/pro", base).href);
      await unlocked(later);
      await later.reload({ waitUntil: "networkidle" });
      assert.equal((await stored(later)).pro.active, true, "paid entitlement survives refresh");
      assert.equal(wire.confirmations.length, 3);
      assert.equal(wire.purchases, 0, "recovery never starts a second purchase");
      assert.deepEqual(wire.errors, []);
      console.log("ok   processing return survives refresh and later visit, then paid Pro persists");
    } finally { await context.close(); }
  }

  {
    const { context, page, wire } = await fixture(browser);
    try {
      await page.goto(new URL("/pro", base).href, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: /Get lifetime Pro/ }).first().click();
      await page.waitForURL(new URL("/fixture-checkout", base).href);
      assert.equal((await stored(page)).started, sessionId, "checkout id saved before leaving");
      await page.close(); // The successful Stripe redirect never arrives.
      const later = await context.newPage();
      await later.goto(new URL("/pro", base).href, { waitUntil: "networkidle" });
      assert.equal((await stored(later)).started, sessionId, "processing checkout remains recoverable");
      assert.equal(wire.confirmations.length, 1);
      wire.status = "succeeded";
      await later.reload();
      await unlocked(later);
      assert.equal(wire.confirmations.length, 2);
      assert.equal(wire.purchases, 1, "only the original purchase was started");
      assert.deepEqual(wire.errors, []);
      console.log("ok   interrupted redirect recovers processing-to-paid without a second purchase");
    } finally { await context.close(); }
  }

  for (const status of ["expired", "canceled", "requires_payment_method", "invalid-reference"]) {
    const { context, page, wire } = await fixture(browser);
    try {
      wire.status = status;
      if (status === "invalid-reference") wire.httpStatus = 400;
      await page.goto(new URL(`/pro?checkout=success&session_id=${sessionId}`, base).href);
      await page.getByText(/reloading won't change it/).waitFor();
      assert.equal((await stored(page)).pending, null);
      assert.notEqual((await stored(page)).pro?.active, true);
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(wire.confirmations.length, 1, "definitive failures are not retried on refresh");
      assert.equal(wire.purchases, 0);
      assert.deepEqual(wire.errors, []);
      console.log(`ok   ${status} clears recovery without granting Pro or retrying on refresh`);
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
