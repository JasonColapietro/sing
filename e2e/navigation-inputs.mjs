/** Reach every room using ordinary mouse, touch and keyboard input.
 * No locator.click/tap or scrollIntoView: those can conceal clipped links.
 * node e2e/navigation-inputs.mjs [base] [--executable=path]
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { browserTarget, cliArgs } from "./lib/args.mjs";

const { base, executable, has } = cliArgs("http://localhost:3197");
const rooms = [
  ["Studio", "/studio"], ["Warmups", "/warmups"], ["Range", "/range?mode=range#start"],
  ["Singers", "/singers"], ["Ear", "/ear-training"], ["Breath", "/breath"],
  ["Songs", "/songs"], ["Tools", "/tools"], ["Learn", "/learn"], ["Progress", "/progress"],
];
const browser = await chromium.launch({
  ...browserTarget(executable),
  // Keep classic scrollbars: hiding them would miss modal-lock width changes.
  ignoreDefaultArgs: ["--hide-scrollbars"],
  ...(process.env.SING_BROWSER_PROXY ? { proxy: { server: process.env.SING_BROWSER_PROXY } } : {}),
});

// Reading geometry is allowed; only user input may move focus or scroll.
async function activate(page, locator, input) {
  if (input === "keyboard") {
    for (let i = 0; i < 60; i++) {
      if (await locator.evaluate((el) => el === document.activeElement)) {
        await page.keyboard.press("Enter");
        return;
      }
      await page.keyboard.press("Tab");
    }
    assert.fail(`Tab could not reach ${await locator.textContent()}`);
  }
  const point = await locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const x = r.x + r.width / 2, y = r.y + r.height / 2;
    return { x, y, height: r.height, reachable: r.width > 0 && x >= 0 && x < innerWidth
      && y >= 0 && y < innerHeight && el.contains(document.elementFromPoint(x, y)) };
  });
  assert.ok(point.reachable, `${input}: ${await locator.textContent()} has a visible, unoccluded hit target`);
  assert.ok(point.height >= 44, "44px target height");
  if (input === "touch") await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
}

try {
  // Find the actual font/layout boundary, rather than assuming a breakpoint.
  // Classic scrollbars and scroll locking must not destabilize this boundary.
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 600 },
      ignoreHTTPSErrors: process.env.SING_BROWSER_IGNORE_HTTPS_ERRORS === "1",
    });
    try {
      const page = await context.newPage();
      await page.goto(`${base}/learn`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const trigger = page.locator('header button[aria-haspopup="dialog"]');
      const drawer = page.getByRole("dialog", { name: "Navigation menu" });
      const settle = () => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const scrollbar = await page.evaluate(() => innerWidth - document.documentElement.clientWidth);
      assert.ok(scrollbar > 0, "exercise classic vertical scrollbars");
      let low = 640, high = 1440;
      while (high - low > 1) {
        const width = Math.floor((low + high) / 2);
        await page.setViewportSize({ width, height: 600 });
        await settle();
        if (await trigger.isVisible()) low = width;
        else high = width;
      }
      await page.setViewportSize({ width: low, height: 600 });
      await settle();
      const padding = await page.evaluate(() => document.body.style.paddingRight);
      await activate(page, trigger, "mouse");
      await settle();
      assert.equal(await drawer.isVisible(), true, `${low}px: Menu stays open at the fit boundary with classic scrollbars`);
      await page.keyboard.press("Escape");
      await drawer.waitFor({ state: "detached" });
      assert.equal(await page.evaluate(() => document.body.style.paddingRight), padding, "restore original body padding");
      assert.equal(await page.evaluate(() => document.body.style.overflow === "hidden"), false);
      console.log(`PASS classic scrollbar boundary ${low}px: drawer remains open and restores layout`);
    } finally { await context.close(); }
  }
  for (const input of has("scrollbar-boundary") ? [] : ["mouse", "touch", "keyboard"]) {
    // Begin with the original failing tablet case; include both sides of sm.
    for (const width of input === "mouse" ? [768, 320, 375, 639, 640, 1024, 1280, 1440] : [375, 768, 1024, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 }, hasTouch: input === "touch",
        ignoreHTTPSErrors: process.env.SING_BROWSER_IGNORE_HTTPS_ERRORS === "1",
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const trigger = page.locator('header button[aria-haspopup="dialog"]');
      const headerNav = page.locator('header nav[aria-label="Main"]');
      const drawer = page.getByRole("dialog", { name: "Navigation menu" });
      try {
        await page.goto(`${base}/learn`, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        for (const [name, target] of rooms) {
          const overflow = await headerNav.evaluate((el) => el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1);
          if (overflow) assert.equal(await trigger.isVisible(), true, `${width}px: overflowing tabs have a visible menu`);
          let nav = headerNav;
          if (width < 640 || (input !== "keyboard" && overflow)) {
            await activate(page, trigger, input);
            await drawer.waitFor();
            nav = drawer.getByRole("navigation", { name: "Main", exact: true });
            assert.equal(await nav.getByRole("link").count(), 10);
          }
          await activate(page, nav.getByRole("link", { name, exact: true }), input);
          await page.waitForURL(`${base}${target}`);
          await page.locator("h1").first().waitFor();
          await drawer.waitFor({ state: "detached" });
          assert.equal(await page.evaluate(() => document.body.style.overflow === "hidden"), false);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
        }
        if (await trigger.isVisible()) {
          // Opening/closing and focus trapping also work at intermediate widths.
          await activate(page, trigger, "keyboard");
          await drawer.waitFor();
          await page.waitForFunction(() => document.activeElement?.getAttribute("role") === "dialog");
          await page.keyboard.press("Shift+Tab");
          assert.equal(await drawer.getByRole("link", { name: "Progress", exact: true }).evaluate((el) => el === document.activeElement), true);
          await page.keyboard.press("Tab");
          assert.equal(await drawer.getByRole("link").first().evaluate((el) => el === document.activeElement), true);
          await page.keyboard.press("Escape");
          await drawer.waitFor({ state: "detached" });
          assert.equal(await trigger.evaluate((el) => el === document.activeElement), true);
          assert.equal(await page.evaluate(() => document.body.style.overflow === "hidden"), false);
        }
        if (width === 768 && input === "mouse") {
          await activate(page, trigger, input);
          await drawer.waitFor();
          // Crossing sm cannot hide a still-needed drawer behind a scroll lock.
          for (const resized of [375, 640, 1024]) {
            await page.setViewportSize({ width: resized, height: 900 });
            assert.equal(await drawer.isVisible(), true, `${resized}px: open drawer stays operable`);
          }
          await page.setViewportSize({ width: 1440, height: 900 });
          await drawer.waitFor({ state: "detached" });
          await page.waitForFunction(() => document.body.style.overflow !== "hidden");
          assert.equal(await trigger.isVisible(), false, "wide desktop recovers the original header without an unnecessary menu");
          await page.setViewportSize({ width, height: 900 });
          await trigger.waitFor({ state: "visible" });
          await activate(page, trigger, input);
          await drawer.waitFor();
          await activate(page, drawer.getByRole("button", { name: "Close menu", exact: true }), input);
          await drawer.waitFor({ state: "detached" });
          assert.equal(await page.evaluate(() => document.body.style.overflow === "hidden"), false);
        }
        if (width === 768 && input === "touch") {
          // A native horizontal swipe still works alongside the visible menu.
          const cdp = await context.newCDPSession(page);
          const box = await headerNav.boundingBox();
          const start = box.x + box.width - 12, end = box.x + 12, y = box.y + box.height / 2;
          const before = await headerNav.evaluate((el) => el.scrollLeft);
          await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: start, y }] });
          for (let step = 1; step <= 12; step++) {
            await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: start + (end - start) * step / 12, y }] });
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
          await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
          await page.waitForFunction((left) => document.querySelector("header nav").scrollLeft > left, before);
          assert.equal(await trigger.isVisible(), true, "native swipe preserves the visible menu");
          await cdp.detach();
        }
        assert.deepEqual(errors, []);
        console.log(`PASS ${input} ${width}px: all ten destinations, deep links, drawer cleanup and focus`);
      } finally { await context.close(); }
    }
  }
} finally { await browser.close(); }
