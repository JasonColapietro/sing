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
// A third entry is the fragment the link must land on. /range's two entries
// land on #start, its start button, rather than the intro above it, which on
// a phone leaves the button under the tab bar.
const rooms = [
  ["Pitch & range", "/range", "#start"], ["Studio", "/studio"], ["Warmups", "/warmups"],
  ["Songs", "/songs"], ["Singers", "/singers"], ["Ear training", "/ear-training"],
  ["Breath", "/breath"], ["Tools", "/tools"], ["Learn", "/learn"], ["Progress", "/progress"],
];
const primary = [
  ["Home", "/"], ["Sing", "/range", "#start"], ["Songs", "/songs"], ["Lessons", "/warmups"], ["Progress", "/progress"],
];
const SM = 640;

async function assertLanded(page, path, hash) {
  await page.waitForURL((url) => url.pathname === path && (hash === undefined || url.hash === hash));
  await page.locator("h1").first().waitFor();
  assert.equal(await page.locator("h1").count(), 1, `${path}: one main heading`);
  assert.equal(await page.getByRole("dialog", { name: "Navigation menu" }).count(), 0, `${path}: sheet closed`);
  assert.equal(await page.evaluate(() => document.body.style.overflow === "hidden"), false, `${path}: scroll unlocked`);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${path}: no horizontal overflow`);
}

async function clickTo(page, link, label, path, width, hash) {
  await link.scrollIntoViewIfNeeded();
  const box = await link.boundingBox();
  assert.ok(box && box.height >= 44, `${width}px ${label}: 44px target (got ${box?.height})`);
  await link.click();
  await assertLanded(page, path, hash);
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
      for (const [name, path, hash] of rooms) {
        await trigger.click();
        const drawer = page.getByRole("dialog", { name: "Navigation menu" });
        await drawer.waitFor();
        const nav = drawer.getByRole("navigation", { name: "All rooms", exact: true });
        await clickTo(page, nav.getByRole("link", { name, exact: true }), `sheet ${name}`, path, width, hash);
      }

      // The five primary destinations, through whichever bar this width shows.
      const bar = page.getByRole("navigation", { name: width < SM ? "Tabs" : "Main", exact: true });
      for (const [name, path, hash] of primary) {
        await clickTo(page, bar.getByRole("link", { name, exact: true }), `${width < SM ? "tab" : "header"} ${name}`, path, width, hash);
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
      // Tab continues from the heading: focus lands on the room's first
      // visible control after it. For a free singer that is the allowance
      // line's "Pro has no daily limit" link (components/practice/free-cap.tsx),
      // ahead of the start buttons, so a link counts as well as a button.
      assert.equal(await page.evaluate(() => {
        const active = document.activeElement;
        const heading = document.querySelector("main h1");
        const next = [...document.querySelectorAll("main a[href], main button, main input, main select, main textarea, main summary, main [tabindex]")]
          .find((el) => (heading.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
            && el.tabIndex >= 0 && !el.matches(":disabled") && el.getClientRects().length > 0);
        return (active?.tagName === "BUTTON" || active?.tagName === "A") && active === next;
      }), true, "Tab resumes at the first visible warmup control after the heading");

      // Back from a singer page returns to the link that was tapped. The
      // /singers chart renders after mount, so the browser's own restored
      // position used to land thousands of pixels off (or on the footer after
      // "Load more"); components/singers/directory.tsx keeps the loaded rows
      // in ?shown= and scrolls the tapped link, in the list it was tapped in,
      // back into view.
      if (width === 375) {
        const rows = page.locator("#singer-directory-results a");
        const backTo = async (link, scope, label) => {
          await link.scrollIntoViewIfNeeded();
          const href = await link.getAttribute("href");
          await link.click();
          await page.waitForURL((url) => url.pathname === href);
          await page.locator("h1").first().waitFor();
          await page.goBack();
          await page.waitForURL((url) => url.pathname === "/singers");
          const back = await page.waitForFunction(([sel, target]) => {
            const el = document.querySelector(sel)?.querySelector(`a[href="${target}"]`);
            if (!el) return false;
            const top = el.getBoundingClientRect().top;
            return top >= 0 && top < innerHeight;
          }, [scope, href], { timeout: 5000 }).then(() => true, () => false);
          assert.equal(back, true, `${label}: Back lands with ${href} in view`);
        };
        await page.goto(`${base}/singers`, { waitUntil: "networkidle" });
        await rows.nth(47).waitFor();
        await backTo(rows.nth(20), "#singer-directory-results", "chart row 21");
        await page.getByRole("button", { name: /^Load more singers/ }).click();
        await rows.nth(95).waitFor();
        await backTo(rows.nth(59), "#singer-directory-results", "chart row 60 after Load more");
        assert.equal(await rows.count(), 96, "Back keeps the rows that were loaded");
        await backTo(
          page.locator('[data-singer-crawl-index] a[href="/singers/joni-mitchell"]'),
          "[data-singer-crawl-index]",
          "A-Z index link",
        );
        // The popular lookups sit under the chart since round 11, so the
        // chart's mount moves them too; they are a return scope of their own.
        await backTo(
          page.locator('[data-singer-search-priority] a[href^="/singers/"]').nth(5),
          "[data-singer-search-priority]",
          "Popular vocal range lookups link",
        );
      }

      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: ten rooms via the sheet, five primary tabs, touch targets, overflow, menu cleanup, warmup exit focus${width === 375 ? ", Back to the tapped singer" : ""}`);
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
