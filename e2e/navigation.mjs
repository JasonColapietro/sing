/** Real menu clicks and responsive edge cases. No account or payment actions.
 * node e2e/navigation.mjs http://localhost:3197 [--executable=path]
 *
 * Mirrors components/nav.tsx: all ten destinations in the desktop header,
 * with the same links in a full-screen drawer on phones and overflowing rows.
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const argv = process.argv.slice(2);
const base = (argv.find((a) => !a.startsWith("--")) ?? "http://localhost:3197").replace(/\/$/, "");
/** A browser build Playwright did not install, e.g. `/opt/pw-browsers/chromium` in a cloud container. */
const executable = argv.find((a) => a.startsWith("--executable="))?.slice("--executable=".length);
// Range must retain the guided-test mode and land on its start button.
const rooms = [
  ["Studio", "/studio"], ["Warmups", "/warmups"], ["Range", "/range", "#start", "?mode=range"],
  ["Singers", "/singers"], ["Ear", "/ear-training"], ["Breath", "/breath"],
  ["Songs", "/songs"], ["Tools", "/tools"], ["Learn", "/learn"], ["Progress", "/progress"],
];
const SM = 640;

async function assertLanded(page, path, hash, search) {
  await page.waitForURL((url) => url.pathname === path
    && (hash === undefined || url.hash === hash)
    && (search === undefined || url.search === search));
  await page.locator("h1").first().waitFor();
  assert.equal(await page.locator("h1").count(), 1, `${path}: one main heading`);
  assert.equal(await page.getByRole("dialog", { name: "Navigation menu" }).count(), 0, `${path}: sheet closed`);
  assert.equal(await page.evaluate(() => document.body.style.overflow === "hidden"), false, `${path}: scroll unlocked`);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${path}: no horizontal overflow`);
}

async function clickTo(page, link, label, path, width, hash, search) {
  await link.scrollIntoViewIfNeeded();
  const box = await link.boundingBox();
  assert.ok(box && box.height >= 44, `${width}px ${label}: 44px target (got ${box?.height})`);
  await link.click();
  await assertLanded(page, path, hash, search);
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
    const trigger = page.locator('header button[aria-haspopup="dialog"]');
    try {
      await page.goto(`${base}/learn`, { waitUntil: "networkidle" });

      // Every room, through the drawer on phones and the header on larger screens.
      for (const [name, path, hash, search] of rooms) {
        let nav = page.locator("header").getByRole("navigation", { name: "Main", exact: true });
        if (width < SM) {
          await trigger.click();
          const drawer = page.getByRole("dialog", { name: "Navigation menu" });
          await drawer.waitFor();
          nav = drawer.getByRole("navigation", { name: "Main", exact: true });
          assert.equal(await nav.getByRole("link").count(), 10, "drawer exposes all ten destinations");
        }
        await clickTo(page, nav.getByRole("link", { name, exact: true }), `${width < SM ? "drawer" : "header"} ${name}`, path, width, hash, search);
        if (width < SM) assert.equal((await trigger.innerText()).trim(), name, "phone trigger names the current room");
        else {
          const current = nav.locator('a[aria-current="page"]');
          assert.equal(await current.count(), 1, "header announces one current page");
          assert.equal((await current.textContent()).trim(), name);
        }
      }

      if (width >= SM) {
        const nav = page.getByRole("navigation", { name: "Main", exact: true });
        await nav.evaluate((el) => { el.scrollLeft = el.scrollWidth; });
        await page.waitForFunction(() => getComputedStyle(document.querySelector('header nav[aria-label="Main"]')).maskImage === "none");
        const overflows = await nav.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
        assert.equal(await trigger.isVisible(), overflows, "overflowing rows keep the menu even at the scroll end");
      } else {
        // Tab remains inside the drawer; Escape restores its trigger and scroll.
        await trigger.click();
        const drawer = page.getByRole("dialog", { name: "Navigation menu" });
        await drawer.waitFor();
        await page.waitForFunction(() => document.activeElement?.getAttribute("role") === "dialog");
        await page.keyboard.press("Shift+Tab");
        assert.equal(await drawer.getByRole("link", { name: "Progress", exact: true }).evaluate((el) => el === document.activeElement), true, "Shift+Tab wraps to the last drawer link");
        await page.keyboard.press("Tab");
        assert.equal(await drawer.getByRole("link").first().evaluate((el) => el === document.activeElement), true, "Tab wraps to the first drawer link");
        await page.keyboard.press("Escape");
        await drawer.waitFor({ state: "detached" });
        assert.equal(await trigger.evaluate((el) => el === document.activeElement), true, "Escape restores trigger focus");
        assert.equal(await page.evaluate(() => document.body.style.overflow === "hidden"), false, "Escape releases the scroll lock");

        // A sufficiently wide header takes over. Release the drawer's focus
        // trap and scroll lock once every tab fits, rather than at sm.
        await trigger.click();
        await drawer.waitFor();
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.getByRole("dialog", { name: "Navigation menu", includeHidden: true }).waitFor({ state: "detached" });
        await page.waitForFunction(() => document.body.style.overflow !== "hidden");
        await page.setViewportSize({ width, height: 900 });
        assert.equal(await trigger.getAttribute("aria-expanded"), "false", "returning to phone width leaves the drawer closed");
      }

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
        // `reload`: the singer page is reloaded before Back, so /singers is
        // the first page this document renders (round 12, content:D3).
        const backTo = async (link, scope, label, { reload = false } = {}) => {
          await link.scrollIntoViewIfNeeded();
          const href = await link.getAttribute("href");
          await link.click();
          await page.waitForURL((url) => url.pathname === href);
          await page.locator("h1").first().waitFor();
          if (reload) {
            await page.reload({ waitUntil: "networkidle" });
            await page.locator("h1").first().waitFor();
          }
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
        // The links under the chart: Browse by genre, the records button and
        // the methodology link used to come back at the footer (content:D2).
        await backTo(
          page.locator('[data-singer-return="browse"] a[href="/singers/genre/reggae"]'),
          '[data-singer-return="browse"]',
          "Browse by genre chip",
        );
        await backTo(
          page.locator('[data-singer-return="browse"] a[href="/singers/records"]'),
          '[data-singer-return="browse"]',
          "records button",
        );
        await backTo(
          page.locator('[data-singer-return="method"] a[href="/singers/methodology"]'),
          '[data-singer-return="method"]',
          "methodology link",
        );
        await page.goto(`${base}/singers`, { waitUntil: "networkidle" });
        await rows.nth(47).waitFor();
        await backTo(rows.nth(30), "#singer-directory-results", "chart row 31, singer page reloaded", { reload: true });
      }

      // Back after leaving the chart by a link outside its lists (a header
      // tab, the menu drawer) puts the chart where it was. It came back
      // 1,490px (1280) or 3,285px (375) lower.
      if (width === 375 || width === 1280) {
        await page.goto(`${base}/singers`, { waitUntil: "networkidle" });
        const row = page.locator("#singer-directory-results a").nth(30);
        await row.scrollIntoViewIfNeeded();
        const href = await row.getAttribute("href");
        const before = await row.evaluate((el) => el.getBoundingClientRect().top);
        // A press where the control is on screen, as a finger or mouse makes
        // it: locator.click() first scrolls its target into view, and for a
        // control in the sticky header that moved the page about 450px
        // before the click, so the test measured its own scroll.
        const press = async (control) => {
          const box = await control.boundingBox();
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        };
        if (width < SM) {
          await press(trigger);
          const drawer = page.getByRole("dialog", { name: "Navigation menu" });
          await drawer.waitFor();
          await press(drawer.getByRole("link", { name: "Songs", exact: true }));
        } else {
          await press(page.locator("header").getByRole("navigation", { name: "Main", exact: true })
            .getByRole("link", { name: "Songs", exact: true }));
        }
        await page.waitForURL((url) => url.pathname === "/songs");
        await page.locator("h1").first().waitFor();
        await page.goBack();
        await page.waitForURL((url) => url.pathname === "/singers");
        const settled = await page.waitForFunction(([target, top]) => {
          const el = document.querySelector(`#singer-directory-results a[href="${target}"]`);
          return el !== null && Math.abs(el.getBoundingClientRect().top - top) <= 2;
        }, [href, before], { timeout: 5000 }).then(() => true, () => false);
        assert.equal(settled, true, `${width}px: Back after a header departure puts ${href} back at ${Math.round(before)}px`);
      }

      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: ten destinations via ${width < SM ? "drawer" : "header"}, touch targets, overflow, menu cleanup, warmup exit focus${width === 375 ? ", Back to the tapped singer" : ""}${width === 375 || width === 1280 ? ", Back after leaving the chart" : ""}`);
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
