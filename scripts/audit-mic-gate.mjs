/**
 * Independent audit of what a practice room shows when the microphone is refused.
 *
 * Usage: npm run dev, then
 *   node scripts/audit-mic-gate.mjs [baseUrl]      # default http://localhost:3000
 *
 * A room's mic card is not always what the singer pressed. /warmups lists its
 * whole catalogue under the gate card and starts the mic from any of those
 * cards; /range starts it again from the saved-result card. The refusal used to
 * render in the card either way, which on /warmups put it up to 843px above the
 * fold — real text, correctly announced, and invisible to the person who pressed
 * the button. That is a layout fact, so it cannot be caught by the unit suite:
 * it needs a real browser, a real refusal, and a real click.
 *
 * Exits non-zero if any room fails to put the message on screen, or puts two
 * copies of it on screen — two role="alert" nodes is two announcements.
 */
import pw from "playwright";

const { chromium } = pw;
const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const VIEW = { width: 1280, height: 900 };

/**
 * Scoped to the app's own markup. Playwright's locators pierce shadow DOM, so a
 * bare [role="alert"] also counts Next.js's empty dev-mode route announcer.
 */
const ALERT = 'main [role="alert"]';

/** Refuse the mic the way a blocked site permission does, before app code runs. */
const REFUSE_MIC = `
  const md = navigator.mediaDevices;
  if (md) {
    md.getUserMedia = () => Promise.reject(
      Object.assign(new Error("Permission denied"), { name: "NotAllowedError" })
    );
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

const browser = await chromium.launch();

async function freshPage(extraInit = "") {
  const ctx = await browser.newContext({ viewport: VIEW });
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

console.log("\n/warmups — every exercise card starts the mic");
{
  const { ctx, page } = await freshPage();
  await page.goto(`${BASE}/warmups`, { waitUntil: "networkidle" });

  const titles = await page.locator("button h3").allTextContents();
  check("catalogue is readable before any mic prompt", titles.length > 0,
    `${titles.length} cards`);
  check("nothing is announced before the singer acts",
    (await page.locator(ALERT).count()) === 0);

  let worst = null;
  for (const title of titles) {
    // Reload per card so the alert starts absent every time.
    await page.goto(`${BASE}/warmups`, { waitUntil: "networkidle" });
    const card = page.locator("button", {
      has: page.locator("h3", { hasText: title }),
    }).first();
    const r = await pressAndMeasure(page, card);
    const cardBox = await card.boundingBox();
    // The message belongs at the card, not merely somewhere on screen.
    const gap = r.top === null ? null : Math.round(r.top - (cardBox.y + cardBox.height));
    const good = r.onScreen && r.count === 1 && gap !== null && Math.abs(gap) <= 40;
    if (!good) check(title, false, `${describe(r)} gap=${gap}px`);
    if (gap !== null && (worst === null || Math.abs(gap) > Math.abs(worst))) worst = gap;
  }
  check(`all ${titles.length} cards: one alert, on screen, at the card`,
    failed === 0, `worst gap ${worst}px`);
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
    !!el.parentElement?.querySelector("#warmups-mic-note"));
  check("message stays in the gate card", inGateCard);
  await ctx.close();
}

console.log("\n/warmups — switching between the two sources");
{
  const { ctx, page } = await freshPage();
  await page.goto(`${BASE}/warmups`, { waitUntil: "networkidle" });
  const titles = await page.locator("button h3").allTextContents();
  const sequence = [
    ["last card", page.locator("button", {
      has: page.locator("h3", { hasText: titles[titles.length - 1] }) }).first()],
    ["gate button", page.getByRole("button", { name: "Enable microphone" })],
    ["first card", page.locator("button", {
      has: page.locator("h3", { hasText: titles[0] }) }).first()],
    ["that card again", page.locator("button", {
      has: page.locator("h3", { hasText: titles[0] }) }).first()],
  ];
  for (const [label, control] of sequence) {
    const r = await pressAndMeasure(page, control);
    check(`after ${label}: one alert, on screen`, r.count === 1 && r.onScreen,
      describe(r));
  }
  await ctx.close();
}

/* --------------------------------------------------------------- /range */

console.log("\n/range — both of its start buttons");
for (const [label, name, init] of [
  ["cold visitor", "Start free range test", ""],
  ["saved range", "Retake test", SAVED_RANGE],
]) {
  const { ctx, page } = await freshPage(init);
  await page.goto(`${BASE}/range`, { waitUntil: "networkidle" });
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

await browser.close();
console.log(failed === 0
  ? "\nEvery room shows a refused mic where the singer pressed."
  : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
