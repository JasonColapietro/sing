// Renders slides.html to slide-1.png … slide-6.png at 1080x1350 (Instagram's
// 4:5 portrait, the tallest the feed allows). Run from the repo root:
//   node marketing/social/assets/carousel-range/render.mjs
//
// channel:"chrome" because the Playwright-cached headless shell hangs at
// launch on this machine — see marketing/social/assets/render-cover.mjs.
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1080, height: 1350 },
  deviceScaleFactor: 1,
});

await page.goto("file://" + path.join(here, "slides.html"), { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);

for (let i = 1; i <= 6; i++) {
  const el = await page.$(`#s${i}`);
  if (!el) throw new Error(`slide #s${i} not found`);
  const out = path.join(here, `slide-${i}.png`);
  await el.screenshot({ path: out });
  console.log("wrote", path.basename(out));
}

await browser.close();
