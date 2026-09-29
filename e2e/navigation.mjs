/** Real menu clicks and responsive edge cases. No account or payment actions.
 * node e2e/navigation.mjs http://localhost:3197
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = (process.argv[2] ?? "http://localhost:3197").replace(/\/$/, "");
const destinations = [
  ["Studio", "/studio"], ["Warmups", "/warmups"], ["Range", "/range"],
  ["Singers", "/singers"], ["Ear", "/ear-training"], ["Breath", "/breath"],
  ["Songs", "/songs"], ["Tools", "/tools"], ["Learn", "/learn"], ["Progress", "/progress"],
];
const browser = await chromium.launch({ channel: "chrome" });
try {
  for (const width of [320, 375, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await page.goto(`${base}/learn`, { waitUntil: "networkidle" });
      for (const [name, path] of destinations) {
        let nav = page.getByRole("navigation", { name: "Main", exact: true });
        if (width < 640) {
          await page.locator("header").getByRole("button", { expanded: false }).click();
          const drawer = page.getByRole("dialog", { name: "Navigation menu" });
          await drawer.waitFor();
          nav = drawer.getByRole("navigation", { name: "Main", exact: true });
        }
        const link = nav.getByRole("link", { name, exact: true });
        await link.scrollIntoViewIfNeeded();
        const box = await link.boundingBox();
        assert.ok(box && box.height >= 44, `${width}px ${name}: 44px target`);
        await link.click();
        await page.waitForURL((url) => url.pathname === path);
        await page.locator("h1").waitFor();
        assert.equal(await page.locator("h1").count(), 1, `${path}: one main heading`);
        assert.equal(await page.getByRole("dialog", { name: "Navigation menu" }).count(), 0);
        assert.equal(await page.evaluate(() => document.body.style.overflow === "hidden"), false);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${path}: no horizontal overflow`);
      }
      if (width >= 640) {
        const nav = page.getByRole("navigation", { name: "Main", exact: true });
        await nav.evaluate((el) => { el.scrollLeft = el.scrollWidth; });
        await page.waitForFunction(() => getComputedStyle(document.querySelector('header nav')).maskImage === "none");
      } else {
        const trigger = page.locator("header").getByRole("button", { expanded: false });
        await trigger.click();
        await page.keyboard.press("Escape");
        await trigger.waitFor();
        assert.equal(await trigger.evaluate((el) => el === document.activeElement), true, "Escape restores trigger focus");
        await trigger.click();
        await page.getByRole("dialog", { name: "Navigation menu" }).waitFor();
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.getByRole("dialog", { name: "Navigation menu", includeHidden: true }).waitFor({ state: "detached" });
        await page.waitForFunction(() => document.body.style.overflow !== "hidden");
      }
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: all ten destinations, touch targets, overflow, menu cleanup`);
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
