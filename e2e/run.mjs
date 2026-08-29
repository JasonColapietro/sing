/**
 * UI/UX end-to-end audit for sing.
 *
 *   npm run dev          # in another shell — the account surfaces need it
 *   node e2e/run.mjs [baseUrl] [--only=id,id] [--route=name] [--json=path]
 *
 * Exits non-zero when any blocker or major finding survives, so this is usable
 * as a gate. Chrome is driven through `channel: "chrome"`: the bundled
 * chromium/headless-shell never signals ready on this machine and dies at the
 * 180s launch timeout.
 */
import pw from "playwright";
import { readdir } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROUTES, VIEWPORTS, discoverTemplateRoutes } from "./routes.mjs";
import { installProbes, DESCRIBE } from "./lib/harness.mjs";

const { chromium } = pw;
const HERE = path.dirname(fileURLToPath(import.meta.url));

const argv = process.argv.slice(2);
const flag = (name) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const BASE = (argv.find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/$/, "");
const ONLY = flag("only")?.split(",").map((s) => s.trim()).filter(Boolean) ?? null;
const ROUTE_FILTER = flag("route")?.split(",").map((s) => s.trim()).filter(Boolean) ?? null;
const VIEWPORT_FILTER = flag("viewport")?.split(",").map((s) => s.trim()).filter(Boolean) ?? null;
const JSON_OUT = flag("json");

async function loadAudits() {
  const dir = path.join(HERE, "audits");
  let files = [];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith(".mjs")).sort();
  } catch {
    return [];
  }
  const mods = [];
  for (const file of files) {
    const mod = await import(path.join(dir, file));
    if (!mod.id || typeof mod.run !== "function") {
      console.warn(`skipping ${file}: needs an \`id\` and a \`run\` export`);
      continue;
    }
    if (ONLY && !ONLY.includes(mod.id)) continue;
    mods.push(mod);
  }
  return mods;
}

/**
 * A seeded high-XP record triggers the Pro upsell modal, which renders
 * `fixed inset-0 z-[70]` and swallows every click beneath it — so a control
 * that is fine reports as "subtree intercepts pointer events". Start each page
 * from a clean store.
 */
async function clearAppState(context) {
  await context.addInitScript(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
  });
}


/**
 * Hand each audit the same starting conditions.
 *
 * Audits share one page per route, so whatever the previous one left behind
 * becomes the next one's baseline. That is not hypothetical: a module that
 * focuses a control to measure its focus ring moves the sequential focus
 * navigation starting point, and the keyboard audit then begins its Tab walk
 * from the middle of the page and reports every control above that point as
 * unreachable. Run alone it found nothing; run third it accused a correct site
 * of 39 keyboard traps.
 *
 * Blurring resets the navigation starting point to the document, so Tab starts
 * at the top again, and scrolling home undoes any scrolling a module did.
 */
async function resetPageState(page) {
  // Modules are allowed to reload the page (the preference audit has to, to
  // re-render under prefers-reduced-motion and a dark colour scheme). A reload
  // wipes the injected probes, so reinstalling here is what keeps a module that
  // reloads from silently disarming every module ordered after it. The
  // self-test caught this as 40 "probes missing" blockers on a full run.
  await installProbes(page).catch(() => {});
  await page.evaluate(DESCRIBE).catch(() => {});
  await page.evaluate(() => {
    const el = document.activeElement;
    if (el && el !== document.body && typeof el.blur === "function") el.blur();
    // blur() alone does not move Chrome's sequential focus navigation starting
    // point, so the next Tab resumes from wherever the last module left off
    // rather than from the top. Focusing the body does move it; the body needs
    // a tabindex to accept focus at all, and the attribute comes straight back
    // off so the page is left as it was found.
    const hadTabindex = document.body.hasAttribute("tabindex");
    if (!hadTabindex) document.body.setAttribute("tabindex", "-1");
    document.body.focus({ preventScroll: true });
    if (!hadTabindex) document.body.removeAttribute("tabindex");
    window.scrollTo(0, 0);
  }).catch(() => {});
}

async function main() {
  const audits = await loadAudits();
  if (audits.length === 0) {
    console.error("no audit modules found in e2e/audits/ — nothing to run");
    process.exit(2);
  }

  const templateRoutes = await discoverTemplateRoutes(BASE).catch(() => []);
  let routes = [...ROUTES, ...templateRoutes];
  if (ROUTE_FILTER) routes = routes.filter((r) => ROUTE_FILTER.includes(r.name));

  const viewports = VIEWPORT_FILTER
    ? VIEWPORTS.filter((v) => VIEWPORT_FILTER.includes(v.name))
    : VIEWPORTS;
  if (viewports.length === 0) {
    console.error(`no viewport matched --viewport=${VIEWPORT_FILTER?.join(",")}; known: ${VIEWPORTS.map((v) => v.name).join(", ")}`);
    process.exit(2);
  }

  console.log(
    `sing UI/UX audit — ${audits.length} audits x ${routes.length} routes x ${viewports.length} viewports against ${BASE}\n`
  );

  const browser = await chromium.launch({
    channel: "chrome",
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });

  const findings = [];
  const errors = [];

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      permissions: ["microphone"],
      deviceScaleFactor: 1,
    });
    await clearAppState(context);

    for (const route of routes) {
      const page = await context.newPage();
      const consoleErrors = [];
      const failedRequests = [];
      page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
      page.on("pageerror", (e) => consoleErrors.push(String(e)));
      page.on("requestfailed", (r) => failedRequests.push(`${r.method()} ${r.url()} — ${r.failure()?.errorText}`));

      try {
        const response = await page.goto(`${BASE}${route.path}`, {
          waitUntil: "networkidle",
          timeout: 45000,
        });
        await installProbes(page);
        await page.evaluate(DESCRIBE);

        const ctx = { page, route, viewport, baseUrl: BASE, response, consoleErrors, failedRequests };
        for (const audit of audits) {
          if (audit.appliesTo && !audit.appliesTo(ctx)) continue;
          await resetPageState(page);
          try {
            const got = (await audit.run(ctx)) ?? [];
            for (const f of got) {
              findings.push({
                audit: audit.id,
                route: route.name,
                path: route.path,
                viewport: viewport.name,
                severity: f.severity ?? "minor",
                summary: f.summary,
                detail: f.detail ?? "",
                selector: f.selector ?? "",
              });
            }
          } catch (err) {
            errors.push(`${audit.id} @ ${route.name}/${viewport.name}: ${err.message}`);
          }
        }
      } catch (err) {
        errors.push(`navigate ${route.path} @ ${viewport.name}: ${err.message}`);
      } finally {
        await page.close();
      }
    }
    await context.close();
    console.log(`  ${viewport.name} done — ${findings.length} findings so far`);
  }

  await browser.close();
  report(findings, errors, viewports.length);
  if (JSON_OUT) await writeFile(JSON_OUT, JSON.stringify({ findings, errors }, null, 2));

  const blocking = findings.filter((f) => f.severity === "blocker" || f.severity === "major");
  process.exit(blocking.length > 0 ? 1 : 0);
}

/**
 * Collapse identical findings across viewports. The same low-contrast token on
 * five viewports is one defect with five witnesses, and listing it five times
 * buries the ones that only happen at 320px.
 */
function report(findings, errors, viewportCount) {
  const groups = new Map();
  for (const f of findings) {
    const key = [f.audit, f.route, f.severity, f.summary, f.selector].join("|");
    if (!groups.has(key)) groups.set(key, { ...f, viewports: [] });
    groups.get(key).viewports.push(f.viewport);
  }

  const rank = { blocker: 0, major: 1, minor: 2 };
  const rows = [...groups.values()].sort(
    (a, b) => rank[a.severity] - rank[b.severity] || a.route.localeCompare(b.route)
  );

  console.log(`\n${"=".repeat(72)}\n  ${rows.length} distinct findings\n${"=".repeat(72)}`);
  for (const r of rows) {
    const seen = [...new Set(r.viewports)];
    const where = seen.length === viewportCount ? "all viewports" : seen.join(", ");
    console.log(`\n[${r.severity.toUpperCase()}] ${r.audit} — ${r.route} (${where})`);
    console.log(`  ${r.summary}`);
    if (r.selector) console.log(`  at: ${r.selector}`);
    if (r.detail) console.log(`  ${r.detail}`);
  }

  if (errors.length) {
    console.log(`\n${"-".repeat(72)}\n  ${errors.length} audit errors (rig problems, not site defects)`);
    for (const e of errors.slice(0, 20)) console.log(`  ! ${e}`);
  }

  const counts = rows.reduce((acc, r) => ({ ...acc, [r.severity]: (acc[r.severity] ?? 0) + 1 }), {});
  console.log(`\nblocker=${counts.blocker ?? 0} major=${counts.major ?? 0} minor=${counts.minor ?? 0}`);
}

main().catch((e) => { console.error(e); process.exit(2); });
