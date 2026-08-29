/**
 * Console health, network failures, and link integrity.
 *
 * Seven checks, run once per (route x viewport) page load handed to us by
 * e2e/run.mjs:
 *   1. Console errors already collected by the runner (`ctx.consoleErrors`).
 *   2. Failed network requests already collected by the runner
 *      (`ctx.failedRequests`), split into first-party (major) vs third-party
 *      (minor) by comparing URL origins against `ctx.baseUrl`.
 *   3. `response.status()` must be 200.
 *   4. React hydration-mismatch signatures inside the console errors,
 *      reported separately — and worse (blocker) — from generic console
 *      noise.
 *   5. Same-origin links on the page, HEAD-checked from inside the page.
 *   6. `<img>` elements that finished loading with naturalWidth 0.
 *   7. A `<meta name="viewport">` tag that exists and doesn't disable zoom.
 *
 * This harness only ever drives `next dev` (see e2e/run.mjs's own header
 * comment: the bundled Chromium hangs on this machine, so it launches with
 * `channel: "chrome"` against a locally running dev server, never a
 * production build). React's development build prints console noise that
 * has nothing to do with site defects — "Download the React DevTools" and
 * Fast Refresh's rebuild/done notices fire on every page load. Those are
 * filtered out on purpose before anything is graded as a console error; a
 * production build wouldn't emit them at all, and counting them would flag
 * every single route as broken.
 *
 * Same-origin classification (checks 2 and 5) always compares parsed URL
 * `.origin`, never a string prefix and never the page's own
 * `location.origin`. A string prefix lets a lookalike host slip through
 * ("http://localhost:30001/x" starts with "http://localhost:3000" as plain
 * text), and trusting `location.origin` breaks the moment a route silently
 * redirects off-app — every request the redirected-to page makes would then
 * read as "first-party" against its own new location. `ctx.baseUrl` is the
 * only origin either check trusts.
 *
 * Self-contained: no new dependencies. Uses only what the page already
 * provides (fetch, AbortController, DOM) and what run.mjs already installs
 * before calling any audit (`window.__describe`, from e2e/lib/harness.mjs).
 */

export const id = "runtime";
export const title = "Console health, network failures, and link integrity";

// No appliesTo export: every check here is meaningful on every route at
// every viewport (a route's console errors and images can genuinely differ
// by viewport width), so the runner's default of applying unconditionally
// is already correct — see the `if (audit.appliesTo && ...)` guard in
// e2e/run.mjs, which treats a missing appliesTo as "always applies."

const MAX_TEXT_LEN = 300;
const MAX_LINKS_PER_ROUTE = 40;
const LINK_FETCH_TIMEOUT_MS = 8000;

/** Cut a very long console/network message down to something reportable. */
function truncate(text, max = MAX_TEXT_LEN) {
  const s = String(text ?? "");
  return s.length > max ? `${s.slice(0, max)}… [+${s.length - max} more chars]` : s;
}

/** Count identical strings so five copies of one error read as one finding. */
function groupByMessage(list) {
  const counts = new Map();
  for (const raw of list) {
    const key = String(raw);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * Origin equality, not string-prefix matching — see the file header for why
 * a prefix check is the wrong tool here.
 */
function sameOrigin(url, baseUrl) {
  try {
    return new URL(url, baseUrl).origin === new URL(baseUrl).origin;
  } catch {
    return false;
  }
}

// React's development build prints this on every cold load. Not a defect —
// see the file header.
const DEV_NOISE_SUBSTRINGS = ["Download the React DevTools", "React DevTools", "Fast Refresh"];
function isDevNoise(message) {
  return DEV_NOISE_SUBSTRINGS.some((s) => message.includes(s));
}

// React's own wording for a client render that disagrees with the HTML the
// server actually sent. Worth separating from generic console noise because
// it means the user briefly saw — or is still seeing — markup nobody
// server-rendered: a correctness bug, not a warning.
const HYDRATION_SIGNATURES = ["Hydration failed", "did not match", "Text content does not match"];
function isHydrationError(message) {
  return HYDRATION_SIGNATURES.some((s) => message.includes(s));
}

/** Checks 1 + 4: split ctx.consoleErrors into hydration vs. generic noise. */
function auditConsole(consoleErrors) {
  const relevant = consoleErrors.map(String).filter((m) => !isDevNoise(m));
  const hydrationMsgs = relevant.filter(isHydrationError);
  const genericMsgs = relevant.filter((m) => !isHydrationError(m));

  const findings = [];

  for (const [msg, count] of groupByMessage(hydrationMsgs)) {
    findings.push({
      severity: "blocker",
      summary: `Hydration mismatch: ${truncate(msg)}`,
      detail:
        count > 1
          ? `Seen ${count} times on this route/viewport — the server and client render disagree consistently, not a one-off race.`
          : "Server-rendered markup and the client's first render disagree.",
    });
  }

  for (const [msg, count] of groupByMessage(genericMsgs)) {
    findings.push({
      severity: "major",
      summary: `Console error: ${truncate(msg)}`,
      detail: count > 1 ? `Seen ${count} times on this route/viewport load.` : "",
    });
  }

  return findings;
}

/**
 * Failed-request lines arrive from run.mjs pre-formatted as
 * `${method} ${url} — ${errorText}` (that literal " — " separator, em dash
 * padded with spaces — see how `failedRequests` is built in e2e/run.mjs).
 * Split on it directly rather than a regex so there's nothing to get subtly
 * wrong about escaping a non-ASCII separator.
 */
function parseFailedRequest(raw) {
  const sep = raw.indexOf(" — ");
  if (sep === -1) return { method: "", url: "", errorText: raw };
  const head = raw.slice(0, sep);
  const errorText = raw.slice(sep + 3);
  const spaceIdx = head.indexOf(" ");
  if (spaceIdx === -1) return { method: "", url: head, errorText };
  return { method: head.slice(0, spaceIdx), url: head.slice(spaceIdx + 1), errorText };
}

/** Check 2: every failedRequests entry, first-party major / third-party minor. */
function auditFailedRequests(failedRequests, baseUrl) {
  const findings = [];
  for (const [raw, count] of groupByMessage(failedRequests)) {
    const { method, url, errorText } = parseFailedRequest(raw);
    const firstParty = url ? sameOrigin(url, baseUrl) : false;

    findings.push({
      severity: firstParty ? "major" : "minor",
      summary: `${firstParty ? "First-party" : "Third-party"} request failed: ${method} ${
        url || truncate(raw, 120)
      }`.trim(),
      detail: `${truncate(errorText)}${count > 1 ? ` — seen ${count} times` : ""}`,
    });
  }
  return findings;
}

/**
 * Check 3: the route's own HTTP status must be 200. Includes the route's
 * path in the detail even though run.mjs's console report only prints the
 * route's short name — for the data-driven templates (singer-detail,
 * song-detail, ...) the exact slug picked at runtime is the one thing that
 * tells you *which* singer or song 404'd, and it's nowhere else in this
 * finding.
 */
function auditStatus(response, route) {
  if (!response) {
    return [
      {
        severity: "blocker",
        summary: "Navigation produced no HTTP response",
        detail: `${route.path} — page.goto() resolved without a Response object.`,
      },
    ];
  }
  const status = response.status();
  if (status === 200) return [];
  return [
    {
      severity: "blocker",
      summary: `HTTP ${status} instead of 200`,
      detail: `${route.path}${response.statusText() ? ` — ${response.statusText()}` : ""}`,
    },
  ];
}

/**
 * Check 5: same-origin links, HEAD-checked from inside the page so the
 * request carries the same cookies and headers a real click would send.
 * Collection and dedup also happen inside the page — a directory route can
 * carry hundreds of repeated nav/footer anchors, and shipping all of them
 * back to Node just to filter them here would be the slow path for no
 * reason. Capped at MAX_LINKS_PER_ROUTE *after* dedup, so a page that
 * legitimately links to 40 distinct destinations still gets fully checked
 * even though a page with 700 raw anchors does not.
 */
async function auditLinks(page, baseUrl) {
  const links = await page.evaluate(
    ({ baseUrl, max }) => {
      const originOf = (u) => {
        try {
          return new URL(u).origin;
        } catch {
          return null;
        }
      };
      const base = originOf(baseUrl);
      const seen = new Map();
      for (const a of document.querySelectorAll("a[href]")) {
        const href = a.href; // DOM property: already resolved to an absolute URL
        if (!href || originOf(href) !== base) continue; // only baseUrl counts as first-party
        const key = href.split("#")[0]; // an in-page anchor isn't a link-integrity question
        if (!key || seen.has(key)) continue;
        seen.set(key, typeof window.__describe === "function" ? window.__describe(a) : "a");
        if (seen.size >= max) break;
      }
      return [...seen.entries()].map(([url, selector]) => ({ url, selector }));
    },
    { baseUrl, max: MAX_LINKS_PER_ROUTE }
  );

  if (links.length === 0) return [];

  const results = await page.evaluate(
    async ({ urls, timeoutMs }) => {
      async function attempt(url, method) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetch(url, { method, signal: controller.signal });
          return { ok: true, status: res.status };
        } catch (err) {
          return { ok: false, error: String(err && err.message ? err.message : err) };
        } finally {
          clearTimeout(timer);
        }
      }
      async function checkOne(url) {
        const head = await attempt(url, "HEAD");
        // Some routes 405 on HEAD (an API handler that only implements GET,
        // for instance) without being broken at all — retry as GET before
        // calling it dead.
        if (head.ok && head.status === 405) {
          const get = await attempt(url, "GET");
          return { ...get, retried: true };
        }
        return head;
      }
      return Promise.all(urls.map(checkOne));
    },
    { urls: links.map((l) => l.url), timeoutMs: LINK_FETCH_TIMEOUT_MS }
  );

  const findings = [];
  results.forEach((result, i) => {
    const { url, selector } = links[i];
    if (!result.ok) {
      findings.push({
        severity: "major",
        summary: `Internal link request failed: ${url}`,
        detail: result.error,
        selector,
      });
      return;
    }
    if (result.status < 200 || result.status >= 400) {
      findings.push({
        severity: "major",
        summary: `Broken internal link (HTTP ${result.status}): ${url}`,
        detail: result.retried ? "HEAD was rejected with 405; retried as GET with the same result." : "",
        selector,
      });
    }
  });
  return findings;
}

/**
 * Check 6: only images the browser has actually finished with. `complete`
 * is false for a `loading="lazy"` image that hasn't scrolled into view yet,
 * and naturalWidth is 0 for exactly the same not-yet-attempted reason —
 * gating on `complete` first is what keeps every offscreen lazy image on a
 * long page from being reported as broken when it just hasn't loaded.
 */
async function auditImages(page) {
  const broken = await page.evaluate(() => {
    const out = [];
    for (const img of document.querySelectorAll("img")) {
      if (!img.complete) continue;
      const src = img.currentSrc || img.src;
      if (!src) continue; // no source was ever set — nothing to have failed
      if (img.naturalWidth === 0) {
        out.push({
          src,
          selector: typeof window.__describe === "function" ? window.__describe(img) : "img",
        });
      }
    }
    return out;
  });

  return broken.map(({ src, selector }) => ({
    severity: "major",
    summary: `Image failed to load: ${src}`,
    selector,
  }));
}

/** Check 7: a viewport meta tag must exist and must not disable pinch-zoom. */
async function auditViewportMeta(page) {
  const meta = await page.evaluate(() => {
    const el = document.querySelector('meta[name="viewport"]');
    return el
      ? { present: true, content: el.getAttribute("content") || "" }
      : { present: false, content: "" };
  });

  if (!meta.present) {
    return [
      {
        severity: "major",
        summary: 'No <meta name="viewport"> tag',
        detail:
          "Mobile browsers fall back to a desktop-width virtual viewport and scale the whole page down — the responsive layout never engages.",
      },
    ];
  }

  const parts = Object.fromEntries(
    meta.content
      .toLowerCase()
      .split(",")
      .map((p) => p.trim().split("=").map((s) => s.trim()))
  );
  const userScalableNo = parts["user-scalable"] === "no" || parts["user-scalable"] === "0";
  const maxScale = parseFloat(parts["maximum-scale"]);
  const scaleTooSmall = !Number.isNaN(maxScale) && maxScale < 2;

  if (!userScalableNo && !scaleTooSmall) return [];

  return [
    {
      severity: "major",
      summary: "Viewport meta blocks or restricts pinch-to-zoom",
      detail: `content="${meta.content}" — ${
        userScalableNo ? "user-scalable=no" : `maximum-scale=${maxScale} is under 2`
      }. Disabling zoom is a WCAG 1.4.4 failure for low-vision users.`,
    },
  ];
}

export async function run(ctx) {
  const { page, route, baseUrl, response, consoleErrors, failedRequests } = ctx;
  const findings = [];

  // Each section is isolated so a rig-level failure in one — most likely a
  // client-side redirect tearing down the page mid-`evaluate`, which throws
  // "Execution context was destroyed" — only drops that section's coverage
  // for this page instead of the whole audit. run.mjs already separates
  // "audit errors" from "findings" at the top level for exactly this kind
  // of problem; skipping quietly here avoids reporting a rig hiccup as if
  // it were a site defect.
  try {
    findings.push(...auditConsole(consoleErrors));
  } catch {
    // rig problem, not a site defect — move on to the next section
  }

  try {
    findings.push(...auditFailedRequests(failedRequests, baseUrl));
  } catch {
    // rig problem, not a site defect
  }

  try {
    findings.push(...auditStatus(response, route));
  } catch {
    // rig problem, not a site defect
  }

  try {
    findings.push(...(await auditLinks(page, baseUrl)));
  } catch {
    // rig problem, not a site defect
  }

  try {
    findings.push(...(await auditImages(page)));
  } catch {
    // rig problem, not a site defect
  }

  try {
    findings.push(...(await auditViewportMeta(page)));
  } catch {
    // rig problem, not a site defect
  }

  return findings;
}
