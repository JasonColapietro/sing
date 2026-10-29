/**
 * Browser regression for erasing local progress without silently restoring it,
 * and for where /progress lands a phone singer coming back to it (returns()).
 * Run against a local, credential-free production build:
 *   node e2e/progress-reset.mjs [http://localhost:3000] [--executable=/path/to/chromium]
 *
 * Every API response is an in-memory fixture. No account, payment, microphone,
 * cloud record, or existing browser profile is used. Failures exit nonzero.
 */
import assert from "node:assert/strict";
import pw from "playwright";

const argv = process.argv.slice(2);
const flag = (name) => argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const base = new URL(argv.find((arg) => !arg.startsWith("--")) ?? "http://localhost:3000");
assert(
  ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname) &&
    ["http:", "https:"].includes(base.protocol) && !base.username && !base.password,
  "This fixture suite only runs against a localhost server.",
);
const executable = flag("executable");
const KEYS = {
  progress: "suede-sing:progress:v1",
  cloud: "suede-sing:progress-cloud:v1",
  pro: "suede-sing:pro:v2",
  lastSync: "suede-sing:sync:last",
  seeded: "progress-reset-e2e:seeded",
};
const now = new Date().toISOString();
const entitlement = {
  active: true, plan: "lifetime", status: "active", subscriptionId: null,
  paymentIntentId: "pi_isolated_browser_fixture", customerId: null, email: null,
  currentPeriodEnd: null, cancelAtPeriodEnd: false, proKey: "isolated-browser-fixture-key",
};
const empty = {
  xp: 0, sessions: [], streak: { current: 0, best: 0, lastDay: null },
  range: {}, rangeHistory: [], achievements: [],
};
function record(id, detail, withRange = false) {
  const range = { lowMidi: 48, highMidi: 72, voiceTypeLabel: "Fixture voice", testedAt: now };
  return {
    xp: withRange ? 70 : 10,
    sessions: [{ id, detail, type: "pitch", date: now, day: now.slice(0, 10), durationSec: 60, xp: 10 }],
    streak: { current: 1, best: 1, lastDay: now.slice(0, 10) },
    range: withRange ? range : {},
    rangeHistory: withRange ? [range] : [],
    achievements: withRange ? ["first-note", "range-found"] : [],
  };
}
const beforeErase = record("local-before-erase", "Local practice before erase", true);
const cloudCopy = record("saved-cloud-practice", "Saved cloud practice", true);
const newPractice = record("new-after-erase", "New practice after erase");
const ids = (state) => state.sessions.map((session) => session.id).sort();
const pass = (name) => console.log(`ok   ${name}`);

async function waitForFixture(check, message) {
  const deadline = Date.now() + 15_000;
  while (!check()) {
    assert(Date.now() < deadline, message);
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

async function stored(page) {
  return page.evaluate((keys) => ({
    progress: JSON.parse(localStorage.getItem(keys.progress)),
    cloud: JSON.parse(localStorage.getItem(keys.cloud)),
  }), KEYS);
}

async function sessionRows(page, state) {
  const log = page.getByRole("region", { name: "Session log", exact: true });
  if (state.sessions.length === 0) {
    // A fresh record has one empty state (FreshStart); the log waits for the first session.
    await page.getByText("Nothing logged yet", { exact: true }).waitFor();
    assert.equal(await log.count(), 0, "no empty session log on a fresh record");
  } else {
    for (const session of state.sessions) {
      await log.getByRole("cell", { name: session.detail, exact: true }).waitFor();
    }
  }
  assert.equal(await log.locator("tbody tr").count(), state.sessions.length, "visible session count");
  assert.deepEqual(ids((await stored(page)).progress), ids(state), "persisted session IDs");
}

async function erased(page) {
  await page.getByText("Nothing logged yet", { exact: true }).waitFor();
  // A cleared browser's first screen points at the restore, under the start
  // buttons (components/progress/progress-client.tsx FreshStart).
  assert.equal(
    await page.getByRole("link", { name: "Import it under Your data", exact: true }).getAttribute("href"),
    "#your-data",
    "the empty state links to the import",
  );
  await page.getByText("No range on file", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Resume sync and restore", exact: true }).waitFor();
  await sessionRows(page, empty);
  const state = await stored(page);
  assert.deepEqual(state.progress, empty, "erase clears XP, sessions, streak, range, history and achievements");
  assert.equal(state.cloud?.paused, true, "cloud sync remains paused");
}

async function eraseThroughUi(page) {
  const erase = page.getByRole("button", { name: "Erase browser progress", exact: true });
  const confirmation = page.getByRole("textbox", { name: 'Type "erase" to confirm', exact: true });
  assert.equal(await erase.isDisabled(), true, "erase requires confirmation");
  await confirmation.fill("keep");
  assert.equal(await erase.isDisabled(), true, "incorrect confirmation cannot erase");
  await confirmation.fill("erase");
  await erase.click();
  await page.getByRole("status").filter({ hasText: "Progress erased from this browser." }).waitFor();
  await erased(page);
}

async function importThroughUi(page) {
  // The way a singer back on a cleared browser reaches it: the empty state's
  // link, which lands on the Your data section with Import JSON in it.
  await page.getByRole("link", { name: "Import it under Your data", exact: true }).click();
  assert.equal(
    await page.evaluate(() => {
      const top = document.getElementById("your-data")?.getBoundingClientRect().top;
      return top !== undefined && top >= 0 && top < innerHeight;
    }),
    true,
    "the link lands on Your data",
  );
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import JSON", exact: true }).click();
  await (await chooser).setFiles({
    name: "new-practice.json", mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(newPractice)),
  });
  await page.getByRole("status").filter({ hasText: "Progress imported." }).waitFor();
  await sessionRows(page, newPractice);
  assert.equal((await stored(page)).cloud?.paused, true, "import does not authorize cloud restore");
}

async function resumeThroughUi(page, wire) {
  const pullsBefore = wire.pulls;
  const pushesBefore = wire.pushes.length;
  await page.getByRole("button", { name: "Resume sync and restore", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Synced — progress from your other devices is merged in." }).waitFor();
  await sessionRows(page, { sessions: [...cloudCopy.sessions, ...newPractice.sessions] });
  const state = await stored(page);
  assert.equal(state.cloud?.paused, false, "explicit resume re-enables sync");
  assert.equal(wire.pulls, pullsBefore + 1, "resume pulls the saved cloud copy");
  assert.equal(wire.pushes.length, pushesBefore + 1, "resume backs up the merged copy once");
  assert.deepEqual(wire.pushes.at(-1), state.progress, "the uploaded copy contains both cloud and new practice");
  await page.getByRole("button", { name: "Sync now", exact: true }).waitFor();
}

async function scenario(browser, { delayedPull = false } = {}) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }, locale: "en-US", timezoneId: "UTC", serviceWorkers: "block",
  });
  let releasePull;
  const heldPull = new Promise((resolve) => { releasePull = resolve; });
  const wire = { pulls: 0, pushes: [], entitlements: 0, errors: [], pageErrors: [] };
  let remote = structuredClone(cloudCopy);
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== base.origin) return route.abort("blockedbyclient");
    if (!url.pathname.startsWith("/api/")) return route.continue();
    // No API traffic ever reaches the local server (or its configured services).
    try {
      assert.equal(request.method(), "POST", `unexpected method for ${url.pathname}`);
      const body = request.postDataJSON();
      if (url.pathname === "/api/entitlement") {
        assert.deepEqual(body, { paymentIntentId: entitlement.paymentIntentId });
        wire.entitlements += 1;
        return await route.fulfill({ json: entitlement });
      }
      assert.equal(url.pathname, "/api/sync", "unexpected API request");
      assert.equal(body.key, entitlement.proKey, "only the synthetic Pro key is sent");
      if (Object.hasOwn(body, "state")) {
        wire.pushes.push(structuredClone(body.state));
        remote = structuredClone(body.state);
        return await route.fulfill({ json: { ok: true } });
      }
      wire.pulls += 1;
      // Capture the response before the delay, just as an already-issued pull would.
      const response = structuredClone(remote);
      if (delayedPull && wire.pulls === 1) await heldPull;
      return await route.fulfill({ json: { state: response } });
    } catch (error) {
      wire.errors.push(String(error));
      await route.fulfill({ status: 500, json: { error: "Unexpected fixture request" } });
    }
  });
  await context.addInitScript(({ keys, progress, pro, now, delayedPull }) => {
    if (localStorage.getItem(keys.seeded)) return;
    localStorage.clear();
    localStorage.setItem(keys.seeded, "yes");
    localStorage.setItem(keys.progress, JSON.stringify(progress));
    localStorage.setItem(keys.pro, JSON.stringify({ ...pro, since: now, lastVerified: "2000-01-01T00:00:00.000Z" }));
    localStorage.setItem("suede-sing:coach-intro:v1", now);
    if (!delayedPull) localStorage.setItem(keys.lastSync, now);
  }, { keys: KEYS, progress: beforeErase, pro: entitlement, now, delayedPull });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  page.on("pageerror", (error) => wire.pageErrors.push(String(error)));
  // Advance the actual auto-sync debounce after import without spending 45 seconds waiting.
  await page.clock.install({ time: new Date(now) });
  try {
    const response = await page.goto(new URL("/progress", base).href, { waitUntil: "domcontentloaded" });
    assert.equal(response?.ok(), true, "local progress page loads");
    await page.getByRole("button", { name: "Sync now", exact: true }).waitFor();
    await sessionRows(page, beforeErase);
    if (delayedPull) {
      // The pending response intentionally prevents networkidle until after erase.
      await waitForFixture(() => wire.pulls > 0, "automatic cloud pull never started");
      assert.equal(wire.pulls, 1, "automatic cloud pull is in flight before erase");
    } else {
      await page.waitForLoadState("networkidle");
      assert.equal(wire.pulls, 0, "recently synced fixture starts without a cloud pull");
    }
    await waitForFixture(() => wire.entitlements > 0, "Pro revalidation never requested its fixture");
    assert.equal(wire.entitlements, 1, "Pro revalidation uses the intercepted entitlement fixture");
    await eraseThroughUi(page);
    if (delayedPull) {
      releasePull();
      await page.waitForLoadState("networkidle");
      await erased(page);
      assert.equal(wire.pushes.length, 0, "an interrupted pull cannot push after erase");
      pass("erase rejects a cloud response that was already in flight");
    } else {
      pass("typed erase clears the visible dashboard and every progress field");
    }

    // Force the mount-time auto-sync condition true; the pause must be the guard.
    await page.evaluate((key) => localStorage.removeItem(key), KEYS.lastSync);
    const pullsWhilePaused = wire.pulls;
    await page.reload({ waitUntil: "networkidle" });
    await erased(page);
    assert.equal(wire.pulls, pullsWhilePaused, "paused reload cannot restore the cloud copy");
    assert.equal(wire.pushes.length, 0, "erased progress is not uploaded");

    await importThroughUi(page);
    await page.clock.fastForward(46_000);
    await page.waitForLoadState("networkidle");
    assert.equal(wire.pulls, pullsWhilePaused, "new local practice cannot auto-pull while paused");
    assert.equal(wire.pushes.length, 0, "new local practice cannot auto-upload while paused");
    await page.reload({ waitUntil: "networkidle" });
    await sessionRows(page, newPractice);
    await page.getByRole("button", { name: "Resume sync and restore", exact: true }).waitFor();
    assert.equal((await stored(page)).cloud?.paused, true, "pause survives importing and reloading");
    assert.equal(wire.pulls, pullsWhilePaused, "imported practice stays local after reload");
    assert.deepEqual(remote, cloudCopy, "erasing and importing leave the cloud fixture untouched");
    pass(`${delayedPull ? "in-flight" : "ordinary"} reset keeps new imported practice through reload without sync`);

    await resumeThroughUi(page, wire);
    await page.reload({ waitUntil: "networkidle" });
    await sessionRows(page, { sessions: [...cloudCopy.sessions, ...newPractice.sessions] });
    assert.equal((await stored(page)).cloud?.paused, false, "explicit resume survives reload");
    assert.deepEqual(wire.errors, [], "all API requests match the isolated fixtures");
    assert.deepEqual(wire.pageErrors, [], "no uncaught browser errors");
    pass(`${delayedPull ? "in-flight" : "ordinary"} reset restores cloud + new practice only after explicit resume`);
  } finally {
    releasePull();
    await context.close();
  }
}

/** Whether `locator`'s box is on screen once the page has settled. */
async function onScreen(page, locator) {
  // Let a restored scroll, anchoring and a late hash jump all finish first: a
  // check that passes on the way through is not where the singer lands.
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(600);
  return locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight;
  });
}

/**
 * Where /progress puts a phone singer back: Back from a coach step lands on
 * the coach card (it used to come back about 7,146px down, at the room rail),
 * a full load of /progress#your-data lands on Your data, and "Go to
 * Progress" on /sign-in with accounts off lands on Export JSON.
 */
async function returns(browser) {
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, locale: "en-US", timezoneId: "UTC", serviceWorkers: "block",
  });
  const pageErrors = [];
  await context.route("**/*", (route) =>
    new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort("blockedbyclient"));
  await context.addInitScript(({ keys, progress, now, origin }) => {
    // Not on the about:blank between loads, which has no storage to touch.
    if (location.origin !== origin) return;
    if (localStorage.getItem(keys.seeded)) return;
    localStorage.clear();
    localStorage.setItem(keys.seeded, "yes");
    localStorage.setItem(keys.progress, JSON.stringify(progress));
    localStorage.setItem("suede-sing:coach-intro:v1", now);
  }, { keys: KEYS, progress: beforeErase, now, origin: base.origin });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  try {
    await page.goto(new URL("/progress", base).href, { waitUntil: "networkidle" });
    const coach = page.locator('section[aria-label="Today\'s coached session"]');
    await coach.waitFor();
    await coach.scrollIntoViewIfNeeded();
    const step = coach.locator("ol a[href]").first();
    const href = await step.getAttribute("href");
    await step.click();
    await page.waitForURL((url) => url.pathname !== "/progress");
    await page.locator("h1").first().waitFor();
    await page.goBack();
    await page.waitForURL((url) => url.pathname === "/progress");
    await coach.waitFor();
    assert.equal(await onScreen(page, coach), true, `Back from the coach step ${href} lands on the coach card`);
    pass("Back from a coach step returns a phone singer to the coach card");

    // A real document load, not a same-page jump from /progress.
    await page.goto("about:blank");
    await page.goto(new URL("/progress#your-data", base).href, { waitUntil: "networkidle" });
    const yourData = page.getByRole("heading", { name: "Your data", exact: true });
    await yourData.waitFor();
    assert.equal(await onScreen(page, yourData), true, "a full load of /progress#your-data lands on Your data");
    pass("/progress#your-data lands on Your data after hydration");

    await page.goto(new URL("/sign-in", base).href, { waitUntil: "networkidle" });
    if (await page.getByRole("heading", { name: "Accounts are not open yet", exact: true }).count()) {
      await page.getByRole("link", { name: "Go to Progress", exact: true }).click();
      await page.waitForURL((url) => url.pathname === "/progress" && url.hash === "#your-data");
      const exportButton = page.getByRole("button", { name: "Export JSON", exact: true });
      await exportButton.waitFor();
      assert.equal(await onScreen(page, exportButton), true, "Go to Progress lands with Export JSON on screen");
      pass("Go to Progress on /sign-in lands on Export JSON");
    } else {
      console.log("skip Go to Progress: accounts are on in this build");
    }
    assert.deepEqual(pageErrors, [], "no uncaught browser errors");
  } finally {
    await context.close();
  }
}

let browser;
try {
  browser = await pw.chromium.launch(executable
    ? { executablePath: executable, headless: true }
    : { channel: flag("channel") ?? "chrome", headless: true });
  await scenario(browser);
  await scenario(browser, { delayedPull: true });
  await returns(browser);
} catch (error) {
  console.error(`FAIL progress reset: ${error.stack ?? error}`);
  process.exitCode = 1;
} finally {
  await browser?.close();
}
