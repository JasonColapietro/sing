/**
 * Layout-shift measurement, deliberately kept out of the main audit run.
 *
 * CLS only means anything against a production build: `next dev` ships
 * unminified, unsplit bundles and re-renders on Fast Refresh, so a dev number
 * is noise. A local `npm run build && npm start` has reproduced production to
 * four decimals here, so this iterates locally rather than against the live
 * site.
 *
 *   npm run build && npm start &     # NOT alongside `next dev` — the build
 *   node e2e/cls.mjs                 # clobbers .next out from under it
 *
 * Reads `entry.sources[]`, which names the element that MOVED. That element is
 * the victim; the cause is whatever above it changed size. Reporting the mover
 * as the culprit has sent a previous investigation at the wrong element for an
 * hour — so both the mover and its preceding siblings are printed.
 */
import pw from "playwright";
import { ROUTES, VIEWPORTS, discoverTemplateRoutes } from "./routes.mjs";

const { chromium } = pw;
// argv[0] is the node binary and argv[1] this script; without the slice the
// first "bare" argument is /usr/local/bin/node, which Chrome cheerfully tries
// to navigate to.
const argv = process.argv.slice(2);
const BASE = (argv.find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/$/, "");
const ONLY_VIEWPORT = argv.find((a) => a.startsWith("--viewport="))?.split("=")[1];

const OBSERVER = `
window.__cls = { value: 0, shifts: [] };
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.hadRecentInput) continue;          // user-initiated shifts do not count
    window.__cls.value += entry.value;
    window.__cls.shifts.push({
      value: entry.value,
      sources: (entry.sources ?? []).map((s) => ({
        node: s.node ? (s.node.tagName || "") + (s.node.className && typeof s.node.className === "string"
          ? "." + s.node.className.trim().split(/\\s+/).slice(0, 2).join(".") : "") : "(detached)",
        from: s.previousRect ? { y: Math.round(s.previousRect.y), h: Math.round(s.previousRect.height) } : null,
        to: s.currentRect ? { y: Math.round(s.currentRect.y), h: Math.round(s.currentRect.height) } : null,
      })),
    });
  }
}).observe({ type: "layout-shift", buffered: true });
`;

/**
 * Prove the instrument works before trusting a zero.
 *
 * A CLS of 0.0000 from a dead observer is indistinguishable from a clean page,
 * and that exact false reading has been recorded here before. Fire a shift the
 * observer cannot miss and refuse to report any page whose rig did not see it.
 */
async function observerIsLive(page) {
  await page.evaluate(() => {
    const block = document.createElement("div");
    block.style.cssText = "height:400px";
    document.body.insertBefore(block, document.body.firstChild);
  });
  await page.waitForTimeout(300);
  return page.evaluate(() => window.__cls.value > 0);
}

const browser = await chromium.launch({ channel: "chrome" });
const templates = await discoverTemplateRoutes(BASE).catch(() => []);
const routes = [...ROUTES, ...templates];
const viewports = ONLY_VIEWPORT ? VIEWPORTS.filter((v) => v.name === ONLY_VIEWPORT) : VIEWPORTS;

const rows = [];
for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    permissions: ["microphone"],
  });
  await context.addInitScript(() => { try { localStorage.clear(); } catch {} });
  await context.addInitScript(OBSERVER);

  for (const route of routes) {
    const page = await context.newPage();
    try {
      await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle", timeout: 45000 });
      // Let late images, fonts and hydration settle — most real shifts land here.
      await page.waitForTimeout(2500);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1500);

      const measured = await page.evaluate(() => ({ ...window.__cls }));
      const live = await observerIsLive(page);
      rows.push({ route: route.name, path: route.path, viewport: viewport.name, ...measured, live });
    } catch (err) {
      rows.push({ route: route.name, path: route.path, viewport: viewport.name, error: err.message });
    } finally {
      await page.close();
    }
  }
  await context.close();
}
await browser.close();

const dead = rows.filter((r) => !r.error && r.live === false);
const scored = rows.filter((r) => !r.error && r.live !== false);
scored.sort((a, b) => b.value - a.value);

console.log(`\nCLS against ${BASE} — good <= 0.10, poor > 0.25\n${"=".repeat(64)}`);
for (const r of scored) {
  if (r.value < 0.01) continue;
  const verdict = r.value > 0.25 ? "POOR" : r.value > 0.1 ? "NEEDS WORK" : "ok";
  console.log(`\n[${verdict}] ${r.route} @ ${r.viewport} — CLS ${r.value.toFixed(4)}`);
  for (const s of r.shifts.filter((s) => s.value > 0.01).slice(0, 4)) {
    console.log(`   shift ${s.value.toFixed(4)}`);
    for (const src of s.sources.slice(0, 3)) {
      const move = src.from && src.to ? `y ${src.from.y}->${src.to.y}, h ${src.from.h}->${src.to.h}` : "(offscreen)";
      console.log(`     moved: ${src.node}  ${move}`);
    }
  }
}
const worst = scored.filter((r) => r.value > 0.1);
console.log(`\n${scored.length} measured, ${worst.length} above the 0.10 "good" threshold`);
if (dead.length) console.log(`!! ${dead.length} pages discarded — observer never saw the synthetic shift, so their 0.0000 is a dead instrument, not a clean page`);
for (const r of rows.filter((r) => r.error).slice(0, 10)) console.log(`  ! ${r.route}@${r.viewport}: ${r.error}`);
process.exit(worst.length > 0 ? 1 : 0);
