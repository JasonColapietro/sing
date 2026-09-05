/**
 * Songs room: rehearsal and performance modes, against a running local app:
 *   node e2e/songs-modes.mjs http://localhost:3011
 * A fake microphone (silence) drives the real player, so scores are 0 and every
 * loop is "poor" — which is exactly what makes Auto tempo's downward step, the
 * rehearsal wrap, and the performance readout deterministic to assert.
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3011";
const progressKey = "suede-sing:progress:v1";
/** The one-time Pro moment opens over the first result it sees; mark it seen so it stays out of the way. */
const coachIntroKey = "suede-sing:coach-intro:v1";
const record = { xp: 0, sessions: [], range: { lowMidi: 52, highMidi: 72 }, rangeHistory: [], achievements: [],
  streak: { current: 0, best: 0, lastDay: null } };
const browser = await chromium.launch({
  channel: "chrome", headless: true,
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--autoplay-policy=no-user-gesture-required"],
});

async function open(song = "silent-night") {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, permissions: ["microphone"] });
  await context.addInitScript(({ progressKey, record, coachIntroKey }) => {
    if (!localStorage.getItem(progressKey)) localStorage.setItem(progressKey, JSON.stringify(record));
    if (!localStorage.getItem(coachIntroKey)) localStorage.setItem(coachIntroKey, new Date().toISOString());
  }, { progressKey, record, coachIntroKey });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}/songs?song=${song}`);
  await page.getByRole("heading", { name: /Enable your microphone to sing/ }).waitFor();
  // The gate is also the route's Suspense fallback, prerendered without handlers; wait for
  // the client tree before clicking anything on it.
  await page.waitForLoadState("networkidle");
  await dismissOverlays(page);
  return { context, page, errors };
}

/** The Pro upsell and the v2 banner open over the page with a full-screen Dismiss backdrop that eats clicks. */
async function dismissOverlays(page) {
  for (let i = 0; i < 3; i++) {
    const notNow = page.getByRole("button", { name: /^Not now$/ });
    const dismiss = page.getByRole("button", { name: "Dismiss", exact: true });
    if ((await notNow.count()) === 0 && (await dismiss.count()) === 0) return;
    const dialog = page.getByRole("dialog").first();
    if (await dialog.count()) console.log("  dismissing:", (await dialog.innerText()).split("\n")[0].slice(0, 80));
    if (await notNow.count()) await notNow.first().click().catch(() => {});
    else await dismiss.first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(200);
  }
}

/** Click a mode chip until React reports it pressed — a click that lands before hydration is a no-op. */
async function chooseMode(page, name) {
  const chip = page.getByRole("button", { name, exact: true }).first();
  for (let i = 0; i < 20; i++) {
    await dismissOverlays(page);
    await chip.click();
    if ((await chip.getAttribute("aria-pressed")) === "true") return;
    await page.waitForTimeout(250);
  }
  throw new Error(`${name} chip never reported aria-pressed=true`);
}

/** The tempo slider carries the live rate as its aria-valuetext ("125%"), even while Auto drives it. */
const tempoSlider = (page) => page.getByLabel("Tempo", { exact: true });
const tempoText = async (page) => (await tempoSlider(page).getAttribute("aria-valuetext")) ?? "";

try {
  // 1. Performance: chosen on the start step, points + multiplier in stage mode, switch while paused, summary names the mode.
  {
    const { context, page, errors } = await open();
    await chooseMode(page, "Performance");
    assert.equal(await page.getByRole("button", { name: "Rehearsal", exact: true }).getAttribute("aria-pressed"), "false");
    assert.match(await page.locator("fieldset", { hasText: "Session mode" }).innerText(), /scored take/i);
    await dismissOverlays(page);
    await page.getByRole("button", { name: "Enable microphone", exact: true }).click();
    await page.getByRole("heading", { level: 1, name: "Silent Night", exact: true }).waitFor();
    // Fastest rate before the run starts: the desk locks once the song is running.
    await dismissOverlays(page);
    await tempoSlider(page).fill("1.25");
    assert.equal(await tempoText(page), "125%");
    await page.getByRole("button", { name: /Stage mode/ }).click();
    const stage = page.locator("[aria-label$='stage mode']");
    await stage.first().waitFor();
    assert.match(await stage.first().innerText(), /\b0\b[\s\S]*3×/, "stage header shows 0 points at 3×");
    await page.getByRole("button", { name: "Play", exact: true }).first().click();
    await page.getByRole("button", { name: "Pause", exact: true }).first().waitFor();
    await page.getByRole("button", { name: "Pause", exact: true }).first().click();
    await page.getByRole("button", { name: "Rehearsal", exact: true }).waitFor(); // the switch, offered only while paused
    await page.getByRole("button", { name: "Performance", exact: true }).first().waitFor();
    await page.keyboard.press("Escape");
    // Resume in the page and let the planned loops run out: a performance ends on its own.
    await page.getByRole("button", { name: "Play", exact: true }).first().click();
    const summary = page.locator("main");
    await summary.getByText("Performance complete").waitFor({ timeout: 240_000 });
    assert.match(await summary.innerText(), /points/i, "summary shows points for a performance");
    assert.match(await summary.innerText(), /top multiplier/i);
    assert.match(await summary.innerText(), /finished at 125% tempo/i);
    assert.deepEqual(errors, []);
    console.log("PASS performance: chooser, stage readout, paused switch, summary");
    await context.close();
  }

  // 2. Rehearsal (default): Auto tempo steps down after a silent loop; the song wraps past its planned loops instead of finishing.
  {
    const { context, page, errors } = await open();
    assert.equal(await page.getByRole("button", { name: "Rehearsal", exact: true }).getAttribute("aria-pressed"), "true");
    await dismissOverlays(page);
    await page.getByRole("button", { name: "Enable microphone", exact: true }).click();
    await page.getByRole("heading", { level: 1, name: "Silent Night", exact: true }).waitFor();
    // Fastest rate so loops pass quickly; then hand the rate to Auto.
    await dismissOverlays(page);
    const slider = tempoSlider(page);
    await slider.fill("1.25");
    assert.equal(await tempoText(page), "125%");
    await page.getByRole("button", { name: "Auto", exact: true }).click();
    assert.equal(await slider.isDisabled(), true, "slider is disabled while Auto drives the rate");
    await page.getByRole("button", { name: "Play", exact: true }).first().click();
    await page.getByRole("button", { name: "Pause", exact: true }).first().waitFor();
    const loopPill = page.getByText(/^Loop \d+$/);
    await loopPill.waitFor();
    // Wait for the first loop line: Auto reads the silent loop as poor and steps down one notch.
    await page.waitForFunction(() => /^Loop [2-9]/.test([...document.querySelectorAll("span")].map((s) => s.textContent).find((t) => /^Loop \d+$/.test(t ?? "")) ?? ""), null, { timeout: 120_000 });
    assert.equal(await tempoText(page), "120%", "Auto stepped the rate down after a silent loop");
    // Planned loops for this song; a rehearsal must run past them.
    const planned = await page.evaluate(() => {
      const m = document.body.innerText.match(/Loops sung|Loop (\d+) of (\d+)/);
      return m ? Number(m[2]) : null;
    });
    await page.waitForFunction(() => {
      const t = [...document.querySelectorAll("span")].map((s) => s.textContent).find((x) => /^Loop \d+$/.test(x ?? "")) ?? "";
      return Number(t.replace("Loop ", "")) >= 3;
    }, null, { timeout: 150_000 });
    assert.equal(await page.getByRole("button", { name: "Pause", exact: true }).first().isVisible(), true, "still running past the planned loops");
    await dismissOverlays(page);
    await page.getByRole("button", { name: "End practice", exact: true }).click();
    await page.locator("main").getByText("Rehearsal complete").waitFor();
    assert.match(await page.locator("main").innerText(), /loops sung/i);
    assert.doesNotMatch(await page.locator("main").innerText(), /top multiplier/i, "rehearsal summary carries no points");
    assert.deepEqual(errors, []);
    console.log(`PASS rehearsal: auto tempo 125%→120%, wrapped past planned loops (${planned ?? "?"}), summary without points`);
    await context.close();
  }
} finally {
  await browser.close();
}
