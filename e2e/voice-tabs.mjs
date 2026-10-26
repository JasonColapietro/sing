/** Keyboard-only voice-mode navigation, without asking for a microphone. */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const base = (args.find((arg) => !arg.startsWith("--")) ?? "http://127.0.0.1:3100").replace(/\/$/, "");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(base).hostname), "Use a local test server");
const executable = args.find((arg) => arg.startsWith("--executable="))?.slice(13);
const browser = await chromium.launch(executable ? { executablePath: executable } : { channel: "chrome" });
try {
  for (const width of [320, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 720 } });
    try {
      await context.addInitScript(() => {
        window.__micRequests = 0;
        navigator.mediaDevices.getUserMedia = async () => {
          window.__micRequests++;
          throw new DOMException("Unexpected microphone request", "NotAllowedError");
        };
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${base}/range?mode=pitch&compare=adele#start`);
      const pitch = page.getByRole("tab", { name: "Pitch", exact: true });
      const range = page.getByRole("tab", { name: "Range test", exact: true });
      const panel = page.getByRole("tabpanel");
      const focused = (locator) => locator.evaluate((element) => element === document.activeElement);
      async function selected(mode) {
        await page.waitForURL((url) => url.searchParams.get("mode") === mode);
        await page.waitForFunction((expected) =>
          document.querySelector('[role="tab"][aria-selected="true"]')?.textContent === expected,
        mode === "pitch" ? "Pitch" : "Range test");
        assert.equal(await pitch.getAttribute("aria-selected"), String(mode === "pitch"));
        assert.equal(await range.getAttribute("aria-selected"), String(mode === "range"));
        assert.equal(await pitch.getAttribute("tabindex"), mode === "pitch" ? "0" : "-1");
        assert.equal(await range.getAttribute("tabindex"), mode === "range" ? "0" : "-1");
        assert.equal(await panel.getAttribute("aria-labelledby"), await (mode === "pitch" ? pitch : range).getAttribute("id"));
        assert.equal(new URL(page.url()).searchParams.get("compare"), "adele");
        assert.equal(new URL(page.url()).hash, "#start");
      }
      await pitch.waitFor({ state: "visible" });
      await page.waitForFunction(() => !document.querySelector('[role="tab"][aria-selected="true"]')?.disabled);
      await pitch.press("ArrowRight");
      assert.equal(await focused(range), true);
      await selected("pitch"); // Focus alone must leave the current tool running.
      await range.press("Enter");
      await selected("range");
      assert.equal(await focused(range), true);
      await range.press("Home");
      assert.equal(await focused(pitch), true);
      await selected("range");
      await pitch.press("Space");
      await selected("pitch");
      await pitch.press("ArrowLeft");
      assert.equal(await focused(range), true, "Left wraps to the last tab");
      await range.press("ArrowRight");
      assert.equal(await focused(pitch), true, "Right wraps to the first tab");
      await pitch.press("End");
      assert.equal(await focused(range), true);
      await range.press("Home");
      await pitch.press("Tab");
      assert.equal(await focused(panel), true, "Tab leaves the tablist for its content");
      await page.keyboard.press("Shift+Tab");
      assert.equal(await focused(pitch), true, "Tab reenters at the selected mode");
      assert.equal(await page.evaluate(() => window.__micRequests), 0);
      assert.deepEqual(errors, []);
      console.log(`PASS voice tabs ${width}px: arrows, Home/End, Enter/Space, panel focus and query retention`);
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
