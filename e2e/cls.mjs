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
 *   node e2e/cls.mjs --returning --viewport=desktop-1280
 *
 * `--returning` measures as a returning singer: a progress record with a
 * warmup sung yesterday, a streak and a saved range is seeded before every
 * load. The prerender always has the newcomer's empty record, so a page whose
 * layout depends on progress (/warmups leads a newcomer with a routine and a
 * returning singer with their path) changes shape at hydration only for them,
 * and a fresh-profile run can never see that shift.
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
const ONLY_VIEWPORT = argv.find((a) => a.startsWith("--viewport="))?.slice("--viewport=".length);
/** A browser build Playwright did not install, e.g. `/opt/pw-browsers/chromium` in a cloud container. */
const EXECUTABLE = argv.find((a) => a.startsWith("--executable="))?.slice("--executable=".length);
const RETURNING = argv.includes("--returning");

/**
 * A returning singer's record (lib/progress-shape.ts ProgressState), dated
 * from the browser's own clock so "yesterday" is the viewer's local day.
 * Runs right after the clear, in the same init script, on every new document.
 *
 * On a Monday "yesterday" falls in last week, so the weekly report card
 * (components/weekly-report-card.tsx) would open above every page's content
 * on every load, because the clear wipes its seen key each time. That card
 * shifts the page once a week by design and would swamp the hydration shift
 * this mode exists to measure, so last week's report is marked as seen.
 */
const RETURNING_SEED = `
try {
  // cls-returning-seed
  const pad = (n) => String(n).padStart(2, "0");
  const key = (t) => t.getFullYear() + "-" + pad(t.getMonth() + 1) + "-" + pad(t.getDate());
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const day = key(d);
  const lastMonday = new Date();
  lastMonday.setHours(12, 0, 0, 0);
  lastMonday.setDate(lastMonday.getDate() - ((lastMonday.getDay() + 6) % 7) - 7);
  localStorage.setItem("suede-sing:weekly-report-seen:v1", key(lastMonday));
  localStorage.setItem("suede-sing:progress:v1", JSON.stringify({
    xp: 40,
    sessions: [{ id: "cls-seed", type: "warmup", date: day + "T09:00:00.000Z", day, durationSec: 240, score: 72, detail: "First hum", xp: 40 }],
    streak: { current: 1, best: 1, lastDay: day },
    range: { lowMidi: 45, highMidi: 67 },
    rangeHistory: [],
    achievements: [],
  }));
} catch {}
`;

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
  // The measurement pass leaves a long page scrolled to the bottom. Scroll
  // anchoring would compensate for a block prepended above that viewport and
  // produce no visible shift, even with a working observer.
  await page.evaluate(() => {
    document.documentElement.style.overflowAnchor = "none";
    document.body.style.overflowAnchor = "none";
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const before = await page.evaluate(() => window.__cls.value);
  await page.evaluate(() => {
    const block = document.createElement("div");
    block.style.cssText = "height:400px";
    document.body.insertBefore(block, document.body.firstChild);
  });
  await page.waitForTimeout(300);
  // Prior organic shifts prove nothing about this probe: require a new one.
  return page.evaluate((before) => window.__cls.value > before, before);
}

const templates = await discoverTemplateRoutes(BASE).catch((error) => {
  console.error(error.message);
  process.exit(2);
});
const routes = [...ROUTES, ...templates];
const viewports = ONLY_VIEWPORT !== undefined ? VIEWPORTS.filter((v) => v.name === ONLY_VIEWPORT) : VIEWPORTS;
if (viewports.length === 0) {
  console.error(`no viewport matched --viewport=${ONLY_VIEWPORT}; known: ${VIEWPORTS.map((v) => v.name).join(", ")}`);
  process.exit(2);
}
const browser = await chromium.launch(EXECUTABLE ? { executablePath: EXECUTABLE } : { channel: "chrome" });

const rows = [];
for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    permissions: ["microphone"],
  });
  // One script, because Playwright does not define the order of separate init
  // scripts: a clear that ran after the seed would measure a newcomer.
  await context.addInitScript(`try { localStorage.clear(); } catch {}\n${RETURNING ? RETURNING_SEED : ""}`);
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
      if (!Number.isFinite(measured.value) || measured.value < 0 || !Array.isArray(measured.shifts)) {
        throw new Error("CLS observer returned an invalid measurement");
      }
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

const errors = rows.filter((r) => r.error);
const dead = rows.filter((r) => !r.error && r.live !== true);
const scored = rows.filter((r) => !r.error && r.live === true);
scored.sort((a, b) => b.value - a.value);

console.log(`\nCLS against ${BASE}${RETURNING ? " as a returning singer" : ""} — good <= 0.10, poor > 0.25\n${"=".repeat(64)}`);
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
for (const r of errors.slice(0, 10)) console.log(`  ! ${r.route}@${r.viewport}: ${r.error}`);
// A missing reading is an incomplete audit, never a passing zero.
process.exit(errors.length > 0 || dead.length > 0 || scored.length === 0 ? 2 : worst.length > 0 ? 1 : 0);
