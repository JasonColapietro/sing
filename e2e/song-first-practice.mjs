/**
 * Focused song-range journeys against a running local app:
 *   node e2e/song-first-practice.mjs http://localhost:3100
 * Seeds saved ranges; a fake microphone verifies handoffs, not singing accuracy.
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3100";
const path = "/can-you-sing/espresso";
const progressKey = "suede-sing:progress:v1";
const proKey = "suede-sing:pro:v2";
const record = (range) => ({
  xp: 0, sessions: [], range, rangeHistory: [], achievements: [],
  streak: { current: 0, best: 0, lastDay: null },
});
const cases = [
  { name: "fits", range: { lowMidi: 52, highMidi: 72 }, href: "/songs?song=silent-night", title: "Silent Night" },
  { name: "high", range: { lowMidi: 48, highMidi: 64 }, href: "/warmups?exercise=ng-siren-fifth", title: "Ng siren to the fifth" },
  { name: "low", range: { lowMidi: 58, highMidi: 76 }, href: "/warmups?exercise=descending-five", title: "Descending five" },
  { name: "wide", range: { lowMidi: 60, highMidi: 73 }, href: "/warmups?exercise=humming-thirds", title: "Humming thirds" },
  { name: "narrow", range: { lowMidi: 60, highMidi: 64 }, href: "/studio", title: "Pitch studio" },
];
const browser = await chromium.launch({
  channel: "chrome", headless: true,
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});

async function session(viewport, range = {}, pro = false) {
  const context = await browser.newContext({ viewport, permissions: ["microphone"] });
  await context.addInitScript(({ progressKey, proKey, initial, pro }) => {
    if (!localStorage.getItem(progressKey)) localStorage.setItem(progressKey, JSON.stringify(initial));
    if (pro) localStorage.setItem(proKey, JSON.stringify({ active: true }));
  }, { progressKey, proKey, initial: record(range), pro });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}${path}`);
  await page.getByRole("heading", { level: 1, name: "Espresso — Sabrina Carpenter" }).waitFor();
  return { context, page, errors };
}

try {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
    for (const test of cases) {
      const { context, page, errors } = await session(viewport, test.range);
      try {
        const practice = page.getByRole("region", { name: "Your first practice" });
        await practice.waitFor();
        const first = practice.getByRole("link").first();
        assert.equal(await first.getAttribute("href"), test.href);
        await practice.getByRole("link", { name: "See Pro plans" }).waitFor();
        assert.equal(await page.getByRole("dialog", { name: "Go Pro", exact: true }).count(), 0);
        assert.equal(await page.evaluate(() => localStorage.getItem("suede-sing:coach-intro:v1")), null);
        assert.match(await practice.innerText(), /not this popular song’s audio or melody/);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        if (viewport.width === 375 && test.name === "high") {
          await practice.scrollIntoViewIfNeeded();
          await page.screenshot({ path: "/private/tmp/sing-song-funnel-mobile.png", fullPage: true });
        }

        await first.click();
        await page.waitForURL(`${base}${test.href}`);
        if (test.href.startsWith("/warmups")) {
          await page.getByRole("heading", { name: `Turn on your mic to start “${test.title}”`, exact: true }).waitFor();
          await page.getByRole("button", { name: "Enable microphone", exact: true }).click();
          await page.getByRole("heading", { level: 1, name: test.title, exact: true }).waitFor();
        } else if (test.href.startsWith("/songs")) {
          await page.getByRole("heading", { name: `Enable your microphone to sing “${test.title}”`, exact: true }).waitFor();
          await page.getByRole("button", { name: "Enable microphone", exact: true }).click();
          await page.getByRole("heading", { level: 1, name: test.title, exact: true }).waitFor();
          await page.getByRole("button", { name: "Fit to my range", exact: true }).click();
          await page.getByRole("button", { name: "Play", exact: true }).first().click();
          await page.getByRole("button", { name: "Pause", exact: true }).first().waitFor();
        } else {
          await page.getByRole("heading", { level: 1, name: test.title, exact: true }).waitFor();
        }
        assert.deepEqual(errors, []);
        console.log(`PASS ${viewport.width}px ${test.name}: ${test.href}`);
      } finally { await context.close(); }
    }
  }

  const { context, page, errors } = await session({ width: 375, height: 812 });
  try {
    assert.equal(await page.getByRole("region", { name: "Your first practice" }).count(), 0);
    await page.getByRole("link", { name: "Find your range free", exact: true }).click();
    await page.getByRole("heading", { level: 1, name: "Find your vocal range" }).waitFor();
    // Another tab saving a range must update the comparison on return.
    const other = await context.newPage();
    await other.goto(`${base}/range`);
    await other.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
      { key: progressKey, value: record(cases[0].range) });
    await other.close();
    // A result popup remains eligible on /range. Returning to a song page
    // must remove it without consuming the one-time offer or its scroll lock.
    await page.reload();
    await page.getByRole("dialog", { name: "Go Pro", exact: true }).waitFor();
    await page.goBack();
    const practice = page.getByRole("region", { name: "Your first practice" });
    await practice.waitFor();
    assert.equal(await page.getByRole("dialog", { name: "Go Pro", exact: true }).count(), 0);
    assert.equal(await page.evaluate(() => document.body.style.overflow === "hidden"), false);
    assert.equal(await page.evaluate(() => localStorage.getItem("suede-sing:coach-intro:v1")), null);
    assert.equal(await practice.getByRole("link").first().getAttribute("href"), cases[0].href);
    await practice.getByRole("link", { name: "See Pro plans" }).click();
    await page.waitForURL(`${base}/pro#plans`);
    await page.locator("#plans").waitFor();
    assert.deepEqual(errors, []);
    console.log("PASS no range → range test → saved range → recommendation → Pro plans");
  } finally { await context.close(); }

  const member = await session({ width: 1280, height: 900 }, cases[0].range, true);
  try {
    const practice = member.page.getByRole("region", { name: "Your first practice" });
    await practice.waitFor();
    assert.equal(await practice.getByRole("link").first().getAttribute("href"), cases[0].href);
    assert.equal(await practice.getByRole("link", { name: "See Pro plans" }).count(), 0);
    assert.deepEqual(member.errors, []);
    console.log("PASS existing Pro member retains free recommendation without upsell");
  } finally { await member.context.close(); }
} finally { await browser.close(); }
