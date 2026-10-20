/**
 * Independent audit of what a practice room shows when the microphone is refused.
 *
 * Usage: npm run dev, then
 *   node scripts/audit-mic-gate.mjs [baseUrl] [--executable=path]
 *
 * A room's mic card is not always what the singer pressed. /warmups lists its
 * whole learning path under the gate card and starts the mic from any row;
 * /range starts it again from the saved-result card. The refusal used to
 * render in the card either way, which on /warmups put it up to 843px above the
 * fold — real text, correctly announced, and invisible to the person who pressed
 * the button. That is a layout fact, so it cannot be caught by the unit suite:
 * it needs a real browser, a real refusal, and a real click.
 *
 * Exits non-zero if any room fails to put the message on screen, or puts two
 * copies of it on screen — two role="alert" nodes is two announcements — or,
 * on a 375×667 phone, leaves it behind the fixed tab bar.
 */
import pw from "playwright";

const { chromium } = pw;
const argv = process.argv.slice(2);
const BASE = (argv.find((arg) => !arg.startsWith("--")) ?? "http://localhost:3000").replace(/\/$/, "");
const EXECUTABLE = argv.find((arg) => arg.startsWith("--executable="))?.slice("--executable=".length);
const VIEW = { width: 1280, height: 900 };
/**
 * A small phone, where the fixed tab bar covers the bottom 57px. The desktop
 * pass above cannot see it: a refusal on /studio and /songs used to render at
 * 625–667px, behind the bar at 610, and the press looked dead.
 */
const PHONE = { width: 375, height: 667 };
const TAB_BAR = 'nav[aria-label="Tabs"]';

/**
 * Scoped to the app's own markup. Playwright's locators pierce shadow DOM, so a
 * bare [role="alert"] also counts Next.js's empty dev-mode route announcer.
 */
const ALERT = 'main [role="alert"]';
// PathList puts each exercise in an li, with a microphone description until
// listening starts. Routine and daily-plan controls are separate entry points.
const PATH_ROWS = 'main li > button[aria-describedby~="practice-mic-note"]';

/** Refuse the mic the way a blocked site permission does, before app code runs. */
const REFUSE_MIC = `
  localStorage.clear();
  sessionStorage.clear();
  const md = navigator.mediaDevices;
  if (md) {
    md.getUserMedia = () => {
      if (window.__micAuditAllow) {
        // A silent, entirely synthetic input for the recorder retry check.
        // This never opens a real microphone or records a take.
        const context = new AudioContext();
        window.__micAuditContext = context;
        return Promise.resolve(context.createMediaStreamDestination().stream);
      }
      return Promise.reject(
        Object.assign(new Error("Permission denied"), { name: "NotAllowedError" })
      );
    };
  }
  // Keep the Pro moment from covering the button this audit needs to press.
  localStorage.setItem("suede-sing:coach-intro:v1", new Date().toISOString());
`;

/** A saved range, which is what puts /range's second start button on the page. */
const SAVED_RANGE = `
  localStorage.setItem("suede-sing:progress:v1", JSON.stringify({
    xp: 0, sessions: [], streak: { current: 0, best: 0, lastDay: null },
    range: { lowMidi: 48, highMidi: 72, voiceTypeLabel: "Baritone",
             testedAt: new Date(0).toISOString() },
    rangeHistory: [], achievements: [],
  }));
`;

let failed = 0;
function check(label, pass, detail) {
  if (!pass) failed++;
  console.log(`${pass ? "  ok  " : "FAIL  "}${label}${detail ? `  — ${detail}` : ""}`);
}

const browser = await chromium.launch({ ...(EXECUTABLE ? { executablePath: EXECUTABLE } : {}) });

async function freshPage(extraInit = "", viewport = VIEW) {
  const ctx = await browser.newContext({ viewport });
  await ctx.clearPermissions();
  await ctx.addInitScript(REFUSE_MIC + extraInit);
  return { ctx, page: await ctx.newPage() };
}

/**
 * Press one control with the mic refused and report where the message landed.
 * A real click, not element.click() in page script: this app's handlers are
 * React's, and an injected click does not reach them.
 */
async function pressAndMeasure(page, control) {
  await control.scrollIntoViewIfNeeded();
  const pressed = await control.boundingBox();
  await control.click();
  try {
    await page.locator(ALERT).first().waitFor({ state: "visible", timeout: 5000 });
  } catch {
    // No alert at all. A room can fail this way by rendering the refusal as a
    // plain paragraph — visible, and silent to anyone not looking at it — so it
    // is a result to report, not a crash.
    return { count: 0, onScreen: false, top: null, fromPressed: null,
             note: "no role=alert appeared" };
  }
  // Let the alert's own scroll-into-view settle before measuring.
  await page.waitForTimeout(400);
  const box = await page.locator(ALERT).first().boundingBox();
  if (!box || !pressed) return { count: await page.locator(ALERT).count(), onScreen: false,
    top: null, fromPressed: null, note: "message or pressed control has no visible bounds" };
  return {
    count: await page.locator(ALERT).count(),
    onScreen: box.y >= 0 && box.y + box.height <= VIEW.height,
    top: Math.round(box.y),
    // How far the message is from the control that was pressed.
    fromPressed: Math.round(box.y - pressed.y),
  };
}

/** Render one measurement for the log line. */
function describe(r) {
  if (r.note) return r.note;
  return `alerts=${r.count} top=${r.top}`;
}

/** describe(), plus how far the message sat from the control that was pressed. */
function describeFromPressed(r) {
  return r.note ? r.note : `${describe(r)} ${r.fromPressed}px from the button`;
}

/* ------------------------------------------------------------- /warmups */

try {
console.log("\n/warmups — every exercise row starts the mic");
{
  const { ctx, page } = await freshPage();
  await page.goto(`${BASE}/warmups`, { waitUntil: "networkidle" });

  const titles = await page.locator(PATH_ROWS).locator("span.font-medium").allTextContents();
  check("catalogue is readable before any mic prompt", titles.length > 0,
    `${titles.length} exercise rows`);
  check("nothing is announced before the singer acts",
    (await page.locator(ALERT).count()) === 0);

  let worst = null;
  let rowsPassed = titles.length > 0;
  for (const [index, title] of titles.entries()) {
    // Reload per row so the alert starts absent every time.
    await page.goto(`${BASE}/warmups`, { waitUntil: "networkidle" });
    const row = page.locator(PATH_ROWS).nth(index);
    const r = await pressAndMeasure(page, row);
    const rowBox = await row.boundingBox();
    // The message belongs at the row, not merely somewhere on screen.
    const gap = r.top === null || !rowBox ? null : Math.round(r.top - (rowBox.y + rowBox.height));
    const good = r.onScreen && r.count === 1 && gap !== null && Math.abs(gap) <= 40;
    rowsPassed &&= good;
    if (!good) check(title, false, `${describe(r)} gap=${gap}px`);
    if (gap !== null && (worst === null || Math.abs(gap) > Math.abs(worst))) worst = gap;
  }
  check(`all ${titles.length} rows: one alert, on screen, at the row`,
    rowsPassed, `worst gap ${worst}px`);
  await ctx.close();
}

console.log("\n/warmups — the gate card's own button");
{
  const { ctx, page } = await freshPage();
  await page.goto(`${BASE}/warmups`, { waitUntil: "networkidle" });
  const r = await pressAndMeasure(page,
    page.getByRole("button", { name: "Enable microphone" }));
  check("one alert, on screen", r.count === 1 && r.onScreen, describe(r));
  // The gate card owns the message when the gate button is what was pressed.
  const inGateCard = r.count === 1 && await page.locator(ALERT).evaluate((el) =>
    !!el.parentElement?.querySelector("#practice-mic-note"));
  check("message stays in the gate card", inGateCard);
  await ctx.close();
}

console.log("\n/warmups — switching between path, continue card and gate sources");
{
  const { ctx, page } = await freshPage();
  await page.goto(`${BASE}/warmups`, { waitUntil: "networkidle" });
  const rows = page.locator(PATH_ROWS);
  const count = await rows.count();
  check("exercise rows exist for repeated permission checks", count > 0);
  const sequence = count > 0 ? [
    ["last row", rows.last()],
    ["gate button", page.getByRole("button", { name: "Enable microphone" })],
    ["first row", rows.first()],
    ["continue card", page.getByRole("button", { name: "Enable mic and start", exact: true }).first()],
    ["that row again", rows.first()],
  ] : [];
  for (const [label, control] of sequence) {
    const r = await pressAndMeasure(page, control);
    check(`after ${label}: one alert, on screen`, r.count === 1 && r.onScreen,
      describe(r));
    if (label === "continue card") {
      const inContinueCard = r.count === 1 && await page.locator(ALERT).evaluate((el) =>
        // A fresh visitor's card is titled "Start here"; a returning one's
        // "Continue your path" (components/warmups/warmups-client.tsx).
        /Continue your path|Start here/.test(el.parentElement?.textContent ?? ""));
      check("continue-card refusal stays in the card, not its matching path row", inContinueCard);
    }
  }
  await ctx.close();
}

/* --------------------------------------------------------------- /range */

console.log("\n/range — pitch meter and both range-test start buttons");
for (const [label, path, name, init] of [
  ["default pitch meter", "/range", "Start singing", ""],
  ["cold visitor", "/range?mode=range", "Start free range test", ""],
  ["saved range", "/range?mode=range", "Retake test", SAVED_RANGE],
]) {
  const { ctx, page } = await freshPage(init);
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  const r = await pressAndMeasure(page, page.getByRole("button", { name }).first());
  check(`${label} (${name})`, r.count === 1 && r.onScreen,
    describeFromPressed(r));
  await ctx.close();
}

/* -------------------------------------------------------------- /studio */

console.log("\n/studio — its single start button");
{
  const { ctx, page } = await freshPage();
  await page.goto(`${BASE}/studio`, { waitUntil: "networkidle" });
  const r = await pressAndMeasure(page,
    page.getByRole("button", { name: "Enable microphone" }));
  check("one alert, on screen", r.count === 1 && r.onScreen,
    describeFromPressed(r));
  await ctx.close();
}

/* -------------------------------------------- phone: visible feedback */

/** After a press on a phone: is the refusal on screen and clear of the tab bar? */
async function phoneAlertClear(page) {
  let alertBox = null;
  try {
    await page.locator(ALERT).first().waitFor({ state: "visible", timeout: 5000 });
    // Let MicAlert's own scroll settle before measuring.
    await page.waitForTimeout(400);
    alertBox = await page.locator(ALERT).first().boundingBox();
  } catch {
    // Reported by the caller as a failure, not a crash.
  }
  const bar = page.locator(TAB_BAR);
  const barBox = await bar.count() ? await bar.boundingBox() : null;
  const visibleBottom = barBox?.y ?? PHONE.height;
  const bottom = alertBox ? Math.round(alertBox.y + alertBox.height) : null;
  return {
    clear: !!alertBox && alertBox.y >= 0 && alertBox.y + alertBox.height <= visibleBottom,
    detail: alertBox
      ? `alert ${Math.round(alertBox.y)}–${bottom}, visible bottom ${Math.round(visibleBottom)}`
      : "no alert measured",
  };
}

console.log(`\n/studio and /songs at ${PHONE.width}×${PHONE.height} — the message stays on screen`);
for (const path of ["/studio", "/songs", "/songs?song=twinkle-twinkle-little-star"]) {
  const { ctx, page } = await freshPage("", PHONE);
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Enable microphone", exact: true }).first().click();
  const { clear, detail } = await phoneAlertClear(page);
  check(`${path}: refusal stays on screen`, clear, detail);
  // The press is a retry now; an unchanged label read as a dead button.
  check(`${path}: the gate button offers to try again`,
    (await page.getByRole("button", { name: "Try again" }).count()) > 0);
  await ctx.close();
}

/*
 * The song player's own control. "Continue without a mic" opens the player
 * unscored, and the line under the roll offers "Enable microphone"
 * (components/songs/song-player.tsx). Refused there, the message renders in
 * the player's row, which on a phone wraps toward the tab bar.
 */
console.log(`\n/songs player at ${PHONE.width}×${PHONE.height} — its Enable microphone after Continue without a mic`);
{
  const { ctx, page } = await freshPage("", PHONE);
  await page.goto(`${BASE}/songs?song=twinkle-twinkle-little-star`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Continue without a mic", exact: true }).click();
  const control = page.getByRole("button", { name: "Enable microphone", exact: true });
  await control.waitFor({ state: "visible", timeout: 5000 });
  check("the player offers Enable microphone", (await control.count()) === 1);
  check("nothing is announced before the press", (await page.locator(ALERT).count()) === 0);
  await control.scrollIntoViewIfNeeded();
  await control.click();
  const { clear, detail } = await phoneAlertClear(page);
  check("player refusal stays on screen", clear, detail);
  check("player refusal is announced once", (await page.locator(ALERT).count()) === 1);
  await ctx.close();
}

/* ------------------------------------------------------------ /recorder */

console.log("\n/recorder — permission refusal and a successful retry");
{
  const { ctx, page } = await freshPage();
  await page.goto(`${BASE}/recorder`, { waitUntil: "networkidle" });
  const r = await pressAndMeasure(page,
    page.getByRole("button", { name: "Enable microphone", exact: true }));
  check("recorder refusal is visible once", r.count === 1 && r.onScreen, describe(r));
  await page.evaluate(() => { window.__micAuditAllow = true; });
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page.getByRole("button", { name: "Start recording", exact: true }).waitFor({ state: "visible", timeout: 5000 });
  check("recorder retry opens the record deck", (await page.locator(ALERT).count()) === 0);
  await ctx.close();
}
} catch (error) {
  failed++;
  console.error(`Mic audit could not complete: ${error.message}`);
} finally {
  await browser.close();
}
console.log(failed === 0
  ? "\nEvery room shows a refused mic where the singer pressed."
  : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
