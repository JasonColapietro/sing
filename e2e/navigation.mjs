/** Real menu clicks and responsive edge cases. No account or payment actions.
 * node e2e/navigation.mjs http://localhost:3197 [--executable=path]
 *
 * Mirrors components/nav.tsx: five primary destinations ("Main" in the header
 * from sm up, "Tabs" pinned to the bottom below it) and the full room list in
 * the "All rooms" sheet, which the header's menu button opens at every width.
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const argv = process.argv.slice(2);
const base = (argv.find((a) => !a.startsWith("--")) ?? "http://localhost:3197").replace(/\/$/, "");
/** A browser build Playwright did not install, e.g. `/opt/pw-browsers/chromium` in a cloud container. */
const executable = argv.find((a) => a.startsWith("--executable="))?.slice("--executable=".length);
const rooms = [
  ["Pitch & range", "/range"], ["Studio", "/studio"], ["Warmups", "/warmups"],
  ["Songs", "/songs"], ["Singers", "/singers"], ["Ear training", "/ear-training"],
  ["Breath", "/breath"], ["Tools", "/tools"], ["Learn", "/learn"], ["Progress", "/progress"],
];
const primary = [
  ["Home", "/"], ["Sing", "/range"], ["Songs", "/songs"], ["Lessons", "/warmups"], ["Progress", "/progress"],
];
const SM = 640;

async function assertLanded(page, path) {
  await page.waitForURL((url) => url.pathname === path);
  await page.locator("h1").first().waitFor();
  assert.equal(await page.locator("h1").count(), 1, `${path}: one main heading`);
  assert.equal(await page.getByRole("dialog", { name: "Navigation menu" }).count(), 0, `${path}: sheet closed`);
  assert.equal(await page.evaluate(() => document.body.style.overflow === "hidden"), false, `${path}: scroll unlocked`);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${path}: no horizontal overflow`);
}

async function clickTo(page, link, label, path, width) {
  await link.scrollIntoViewIfNeeded();
  const box = await link.boundingBox();
  assert.ok(box && box.height >= 44, `${width}px ${label}: 44px target (got ${box?.height})`);
  await link.click();
  await assertLanded(page, path);
}

const browser = await chromium.launch({
  ...(executable ? { executablePath: executable } : { channel: "chrome" }),
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"],
});
try {
  for (const width of [320, 375, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, permissions: ["microphone"] });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const trigger = page.locator("header").getByRole("button", { name: "All rooms" });
    try {
      await page.goto(`${base}/learn`, { waitUntil: "networkidle" });

      // Every room, through the sheet, at every width.
      for (const [name, path] of rooms) {
        await trigger.click();
        const drawer = page.getByRole("dialog", { name: "Navigation menu" });
        await drawer.waitFor();
        const nav = drawer.getByRole("navigation", { name: "All rooms", exact: true });
        await clickTo(page, nav.getByRole("link", { name, exact: true }), `sheet ${name}`, path, width);
      }

      // The five primary destinations, through whichever bar this width shows.
      const bar = page.getByRole("navigation", { name: width < SM ? "Tabs" : "Main", exact: true });
      for (const [name, path] of primary) {
        await clickTo(page, bar.getByRole("link", { name, exact: true }), `${width < SM ? "tab" : "header"} ${name}`, path, width);
      }

      if (width >= SM) {
        const nav = page.getByRole("navigation", { name: "Main", exact: true });
        await nav.evaluate((el) => { el.scrollLeft = el.scrollWidth; });
        await page.waitForFunction(() => getComputedStyle(document.querySelector('header nav[aria-label="Main"]')).maskImage === "none");
      }

      // Escape closes the sheet and hands focus back to the button that opened it.
      await trigger.click();
      await page.getByRole("dialog", { name: "Navigation menu" }).waitFor();
      await page.keyboard.press("Escape");
      await page.getByRole("dialog", { name: "Navigation menu" }).waitFor({ state: "detached" });
      assert.equal(await trigger.evaluate((el) => el === document.activeElement), true, "Escape restores trigger focus");
      assert.equal(await page.evaluate(() => document.body.style.overflow === "hidden"), false, "Escape releases the scroll lock");

      // Crossing the sm breakpoint with the sheet open must leave a usable
      // sheet (it is the room list at every width), and closing it afterwards
      // must release the scroll lock.
      await trigger.click();
      await page.getByRole("dialog", { name: "Navigation menu" }).waitFor();
      await page.setViewportSize({ width: width < SM ? 1280 : 375, height: 900 });
      await page.getByRole("dialog", { name: "Navigation menu" }).getByRole("button", { name: "Close menu" }).last().click();
      await page.getByRole("dialog", { name: "Navigation menu", includeHidden: true }).waitFor({ state: "detached" });
      await page.waitForFunction(() => document.body.style.overflow !== "hidden");

      // Starting a warmup removes its home card. On exit the old DOM button
      // cannot receive focus: the remounted room heading is the fallback.
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/warmups`, { waitUntil: "networkidle" });
      const starter = page.getByRole("button", { name: "Enable mic and start", exact: true }).first();
      const originalStarter = await starter.elementHandle();
      await starter.focus();
      await page.keyboard.press("Enter");
      const session = page.locator("[data-session-shell]");
      await session.waitFor({ state: "visible" });
      assert.equal(await originalStarter.evaluate((el) => el.isConnected), false, "warmup start card unmounted");
      await page.keyboard.press("Escape");
      await session.waitFor({ state: "detached" });
      await page.waitForFunction(() => document.activeElement === document.querySelector("main h1"));
      assert.equal(await page.evaluate(() => document.body.style.overflow === "hidden"), false, "warmup exit releases scroll lock");
      await page.keyboard.press("Tab");
      assert.equal(await page.evaluate(() => {
        const active = document.activeElement;
        return active?.tagName === "BUTTON" && active.closest("main") !== null && active.getClientRects().length > 0;
      }), true, "Tab resumes at a visible warmup control");

      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: ten rooms via the sheet, five primary tabs, touch targets, overflow, menu cleanup, warmup exit focus`);
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
