// Renders fb-cover-source.html to fb-cover-1640x720.png with the repo's
// Playwright. Run from the repo root:  node marketing/social/assets/render-cover.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
// channel: "chrome" drives the installed Google Chrome — the Playwright-cached
// chromium_headless_shell hangs at launch on this machine (180s timeout).
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1640, height: 720 },
  deviceScaleFactor: 1,
});
await page.goto("file://" + path.join(here, "fb-cover-source.html"), {
  waitUntil: "load",
});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(here, "fb-cover-1640x720.png") });
await browser.close();
console.log("wrote", path.join(here, "fb-cover-1640x720.png"));
