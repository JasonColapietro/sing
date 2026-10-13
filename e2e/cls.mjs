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
 *   node e2e/cls.mjs --state=capped --route=warmups,breath,ear-training
 *
 * `--returning` measures as a returning singer: a progress record with a
 * warmup sung yesterday, a streak and a saved range is seeded before every
 * load. The prerender always has the newcomer's empty record, so a page whose
 * layout depends on progress (/warmups leads a newcomer with a routine and a
 * returning singer with their path) changes shape at hydration only for them,
 * and a fresh-profile run can never see that shift.
 *
 * `--state=<name>` measures a returning singer in one of the stored states
 * that reshape a page after hydration (see STATES below): today's free guided
 * minutes used up, a program running, both at once, or a program's rest day.
 * Each is the returning record plus what that state adds, so it implies
 * `--returning`. `--route=<name,...>` restricts a run to the named routes
 * (the `name` in routes.mjs), so CI can measure a state only where it shows.
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
const flag = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const STATE = flag("state");
const RETURNING = argv.includes("--returning") || STATE !== undefined;
const ROUTE_FILTER = flag("route")?.split(",").map((s) => s.trim()).filter(Boolean);
/** Every reading, for a before/after comparison or CI evidence. */
const JSON_OUT = flag("json");

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
const returningSeed = (state = "") => `
try {
  // cls-returning-seed
  const pad = (n) => String(n).padStart(2, "0");
  const key = (t) => t.getFullYear() + "-" + pad(t.getMonth() + 1) + "-" + pad(t.getDate());
  const ago = (n) => {
    const t = new Date();
    t.setDate(t.getDate() - n);
    return key(t);
  };
  const day = ago(1);
  const lastMonday = new Date();
  lastMonday.setHours(12, 0, 0, 0);
  lastMonday.setDate(lastMonday.getDate() - ((lastMonday.getDay() + 6) % 7) - 7);
  localStorage.setItem("suede-sing:weekly-report-seen:v1", key(lastMonday));
  const progress = {
    xp: 40,
    sessions: [{ id: "cls-seed", type: "warmup", date: day + "T09:00:00.000Z", day, durationSec: 240, score: 72, detail: "First hum", xp: 40 }],
    streak: { current: 1, best: 1, lastDay: day },
    range: { lowMidi: 45, highMidi: 67 },
    rangeHistory: [],
    achievements: [],
  };
${state}
  localStorage.setItem("suede-sing:progress:v1", JSON.stringify(progress));
} catch {}
`;

/**
 * What each `--state` adds to the returning record, run inside its seed (so
 * `progress`, `ago` and `key` are in scope) before the record is saved.
 *
 * None of these shows in the prerender, which is always a newcomer's: the
 * free-plan cap and the running program are read from this browser's storage,
 * and before the first paint by the inline script lib/prepaint.ts builds.
 * Each block names itself (cls-state:<name>); e2e/cls.test.mjs runs every
 * seed and reads it back through the app's own rules and that script.
 */
const CAPPED = `
  // cls-state:capped. A free singer past today's five guided minutes
  // (lib/free-cap.ts): 330 s of warmup logged today, newest first like the log.
  progress.sessions.unshift({ id: "cls-cap", type: "warmup", date: new Date().toISOString(), day: ago(0), durationSec: 330, score: 70, detail: "Cap filler", xp: 30 });
  progress.xp += 30;
  progress.streak = { current: 2, best: 2, lastDay: ago(0) };
`;
/** Foundations in 2 weeks, started yesterday with day 1 marked done: day 2 is today's to do. */
const PROGRAM = `
  // cls-state:program
  localStorage.setItem("suede-sing:program:v1", JSON.stringify({ programId: "foundations-2w", startedDay: ago(1), startedAt: ago(1) + "T08:00:00.000Z", done: [{ index: 0, day: ago(1), manual: true }] }));
`;
/**
 * Mix in 4 weeks with its first six days done on the six days before today
 * and day 7, a rest day, reached today: the day says it is resting and that
 * day 8 onward needs Pro.
 */
const REST_DAY = `
  // cls-state:rest-day
  localStorage.setItem("suede-sing:program:v1", JSON.stringify({ programId: "mix-4w", startedDay: ago(6), startedAt: ago(6) + "T08:00:00.000Z", done: [0, 1, 2, 3, 4, 5, 6].map((index) => ({ index, day: ago(6 - index), manual: true })) }));
`;

const STATES = {
  capped: CAPPED,
  program: PROGRAM,
  /** Today's program day waits for midnight because the free minutes are used. */
  "program-capped": PROGRAM + CAPPED,
  "rest-day": REST_DAY,
};

/**
 * Where each state has to show for the run to count, by route name, and the
 * selector that proves it did. A seed that stops producing its state (a
 * renamed key, a reshaped record) would otherwise measure a plain returning
 * singer and pass.
 */
const STATE_PROOF = {
  capped: { routes: ["warmups", "breath", "ear-training", "songs"], selector: "#free-cap" },
  program: { routes: ["programs", "warmups", "progress"], selector: "[data-program-day]" },
  "program-capped": { routes: ["programs", "warmups"], selector: "[data-program-day] [data-program-waits]" },
  "rest-day": { routes: ["programs", "warmups", "progress"], selector: "[data-program-day]" },
};

if (STATE !== undefined && !Object.hasOwn(STATES, STATE)) {
  console.error(`unknown --state=${STATE}; known: ${Object.keys(STATES).join(", ")}`);
  process.exit(2);
}
const RETURNING_SEED = returningSeed(STATE === undefined ? "" : STATES[STATE]);

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
let routes = [...ROUTES, ...templates];
if (ROUTE_FILTER !== undefined) {
  const known = new Set(routes.map((r) => r.name));
  const unknown = ROUTE_FILTER.filter((name) => !known.has(name));
  if (ROUTE_FILTER.length === 0 || unknown.length > 0) {
    console.error(`unknown route filter: ${unknown.join(", ") || "(empty)"}; known: ${[...known].join(", ")}`);
    process.exit(2);
  }
  routes = routes.filter((r) => ROUTE_FILTER.includes(r.name));
}
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
      const proof = STATE === undefined ? null : STATE_PROOF[STATE];
      if (proof && proof.routes.includes(route.name)) {
        const shown = await page.evaluate((selector) => document.querySelector(selector) !== null, proof.selector);
        if (!shown) throw new Error(`the ${STATE} seed did not take: no ${proof.selector} on the page`);
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

const who = STATE !== undefined ? ` as a returning singer, state ${STATE}` : RETURNING ? " as a returning singer" : "";
console.log(`\nCLS against ${BASE}${who} — good <= 0.10, poor > 0.25\n${"=".repeat(64)}`);
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
if (JSON_OUT) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync(JSON_OUT, JSON.stringify({ base: BASE, state: STATE ?? (RETURNING ? "returning" : "fresh"), rows: rows.map(({ shifts, ...r }) => ({ ...r, shifts: shifts?.filter((s) => s.value > 0.001) })) }, null, 2));
}
const worst = scored.filter((r) => r.value > 0.1);
console.log(`\n${scored.length} measured, ${worst.length} above the 0.10 "good" threshold`);
if (dead.length) console.log(`!! ${dead.length} pages discarded — observer never saw the synthetic shift, so their 0.0000 is a dead instrument, not a clean page`);
for (const r of errors.slice(0, 10)) console.log(`  ! ${r.route}@${r.viewport}: ${r.error}`);
// A missing reading is an incomplete audit, never a passing zero.
process.exit(errors.length > 0 || dead.length > 0 || scored.length === 0 ? 2 : worst.length > 0 ? 1 : 0);
