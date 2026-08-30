/**
 * Motion, theme, and zoom preference support.
 *
 * Five independent checks:
 *   1. Reflow at 320px          — WCAG 1.4.10, mobile-320 viewport only
 *   2. Text zoom to 200%        — WCAG 1.4.4 (overflow / clipped text / overlap)
 *   3. forced-colors            — Windows High Contrast Mode, best-effort
 *   4. prefers-reduced-motion   — infinite/decorative motion suppressed under `reduce`
 *   5. prefers-color-scheme     — dark mode exists, and stays AA if it does
 *
 * They run in that order — not the order above the task brief numbered them
 * in — because two of them (#4, #5) have to reload the page and the other
 * three don't. Running the reload-free checks first lets them use the
 * runner's injected `window.__describe` / `window.__contrast` (installed once
 * right after run.mjs's own navigation, per e2e/lib/harness.mjs) instead of
 * fighting over who reinstalls what when. A `page.reload()` is unavoidable for
 * #4 and #5: a component that only reads `matchMedia(...).matches` once in a
 * mount effect (the common React pattern) will not react to a live
 * `emulateMedia()` call with no navigation — CSS media queries repaint live,
 * but JS mount-time branches don't re-run without one.
 *
 * Reloading drops those injected probes. #4 doesn't need them back — duration
 * / property / iteration-count are all plain computed-style reads, so it
 * builds a throwaway selector string inline instead of paying for a
 * reinstall. #5 does need them: the AA spot-check calls `__contrast.ratio`,
 * and re-deriving that relative-luminance math inline isn't worth it when the
 * shared implementation already exists — so #5 reinstalls both probes right
 * after its reload, the same two calls run.mjs itself makes after its own
 * navigation.
 */
import { installProbes, DESCRIBE } from "../lib/harness.mjs";

export const id = "preferences";
export const title = "Motion, theme, and zoom preference support";

export async function run(ctx) {
  const { page } = ctx;
  const findings = [];

  try {
    await checkReflow320(ctx, findings);
    await checkTextZoom(page, findings);
    await checkForcedColors(page, findings);
    await checkReducedMotion(page, findings);
    await checkColorScheme(page, findings);
  } finally {
    // Belt-and-suspenders on top of each check's own restore below: every
    // emulateMedia-touching check already resets its own feature in its own
    // try/finally, so in the success path this is a redundant no-op. It only
    // matters on a path where an exception somehow lands between two checks
    // rather than inside one of their own try blocks. The cost of a leaked
    // `reducedMotion: reduce` (or colorScheme/forcedColors) surviving into
    // whichever audit module runs next on this same `page` — run.mjs shares
    // one page across every audit for a route/viewport — is silent
    // corruption of that audit's results, so this stays cheap insurance.
    try {
      await page.emulateMedia({ colorScheme: null, forcedColors: null, reducedMotion: null });
    } catch {
      // page may already be mid-navigation or closed on the error path
    }
  }

  return findings;
}

/** Two rAFs: the first is only scheduled for the next paint, the second
 * guarantees that paint has actually happened — i.e. the style/DOM write (or
 * emulateMedia change) immediately before this call has been laid out, not
 * merely queued — before the caller measures anything. */
async function nextPaint(page) {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

/**
 * WCAG 1.4.10 Reflow — no two-dimensional scrolling at 320 CSS px.
 *
 * A separate layout-focused audit module may flag horizontal overflow at
 * this width too, for its own reasons (broken grid, fixed-width element,
 * etc). This check exists independently anyway because Reflow is its own
 * success criterion with its own citation — the underlying signal
 * (scrollWidth > clientWidth) happens to be the same one a general layout
 * check would reach for, but the two audits are reporting different things:
 * "the layout is broken" vs. "this specific viewport fails this specific
 * WCAG criterion."
 */
async function checkReflow320(ctx, findings) {
  const { page, viewport } = ctx;
  if (viewport.name !== "mobile-320") return;

  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const overflowPx = root.scrollWidth - root.clientWidth;
    if (overflowPx <= 0) return null;

    // Best-effort: name the widest offender so the finding is actionable
    // ("this element") rather than just "something, somewhere, is too wide."
    let widest = null;
    let widestRight = root.clientWidth;
    for (const el of document.body.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > widestRight) {
        widestRight = r.right;
        widest = el;
      }
    }
    return {
      overflowPx,
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
      selector: widest ? (typeof window.__describe === "function" ? window.__describe(widest) : widest.tagName.toLowerCase()) : undefined,
    };
  });

  if (overflow) {
    findings.push({
      severity: "major",
      summary: "Page requires horizontal scrolling at 320px width (WCAG 1.4.10 Reflow)",
      detail: `document scrollWidth ${overflow.scrollWidth}px exceeds viewport clientWidth ${overflow.clientWidth}px by ${overflow.overflowPx}px`,
      selector: overflow.selector,
    });
  }
}

/**
 * WCAG 1.4.4 Resize Text — content must survive 200% text zoom without loss
 * of content or functionality. We approximate "200%" by doubling the root
 * font size (16px -> 32px) rather than using browser page-zoom, since
 * Playwright has no page-zoom control and a doubled rem/em base produces the
 * same downstream effect for any layout built on relative units.
 */
async function checkTextZoom(page, findings) {
  const beforeWidth = await page.evaluate(() => document.documentElement.scrollWidth);

  await page.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
  });
  await nextPaint(page);

  try {
    const result = await page.evaluate((beforeWidth) => {
      const root = document.documentElement;
      const afterWidth = root.scrollWidth;
      // "New" means the zoom made it worse, not that some pre-existing
      // overflow bug (someone else's problem) happens to still be there.
      const newOverflow = afterWidth > root.clientWidth && afterWidth > beforeWidth;

      const hasOwnText = (el) => {
        for (const node of el.childNodes) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) return true;
        }
        return false;
      };
      const isVisible = (el, rect) => {
        if (rect.width === 0 || rect.height === 0) return false;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") return false;
        // Chrome keeps a closed <details>'s contents in the layout tree so
        // find-in-page can reach them: real rects, nothing painted. Every
        // collapsed section is laid out over the same pixels, so comparing
        // them pairwise reports ordinary copy as overlapping ordinary copy.
        // Written inline rather than via window.__rendered because this
        // module reloads the page to apply each preference, and a reload
        // wipes the probes -- a probe call here would silently fall back to
        // "visible" and quietly restore the false positive.
        if (el.closest("details:not([open])")) return false;
        return true;
      };
      const describe = (el) => (typeof window.__describe === "function" ? window.__describe(el) : el.tagName.toLowerCase());

      // (b) clipped text — a text-bearing element whose own content no
      // longer fits its box under overflow:hidden. `overflowY` (rather than
      // the `overflow` shorthand) is checked because the shorthand only
      // reads back as a single value when both axes match; overflowY always
      // resolves individually regardless of how it was declared.
      const clipped = [];
      // (c) text overlap — only checked between siblings sharing a parent.
      // That's the actual shape of a real failure here (a flex/grid row
      // whose items no longer fit at 2x type and start stacking on top of
      // each other), and it keeps this a per-parent O(k^2) instead of a
      // page-wide O(n^2) scan.
      const byParent = new Map();

      let widest = null;
      let widestRight = root.clientWidth;

      for (const el of document.body.querySelectorAll("*")) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.right > widestRight) {
          widestRight = rect.right;
          widest = el;
        }

        if (!hasOwnText(el) || !isVisible(el, rect)) continue;

        const cs = getComputedStyle(el);
        // Screen-reader-only text is clipped to a 1px box on purpose -- that is
        // how the sr-only pattern works, and it is never displayed at any zoom
        // level. Measuring it as "content no longer fits its box" flagged the
        // skip link and 68 more nodes on one page, all of them correct.
        const isScreenReaderOnly =
          cs.position === "absolute" && cs.overflowY === "hidden" &&
          el.clientWidth <= 1 && el.clientHeight <= 1;
        if (!isScreenReaderOnly && cs.overflowY === "hidden" && el.scrollHeight > el.clientHeight + 1) {
          clipped.push({ selector: describe(el), scrollHeight: el.scrollHeight, clientHeight: el.clientHeight });
        }

        // sr-only nodes are all clipped to the same 1px box and stacked on
        // each other by design, so every pair of them "overlaps" by 100%.
        // They are never displayed at any zoom, which is the whole point of
        // the pattern -- two of them on /tools were the last finding in this
        // class. The clipped check above already treats them correctly and
        // runs before this, so skipping them here costs no coverage.
        if (isScreenReaderOnly) continue;

        const parent = el.parentElement;
        if (!parent) continue;
        if (!byParent.has(parent)) byParent.set(parent, []);
        byParent.get(parent).push(el);
      }

      const overlaps = [];
      for (const siblings of byParent.values()) {
        for (let i = 0; i < siblings.length; i++) {
          for (let j = i + 1; j < siblings.length; j++) {
            // A wrapped inline element's bounding rect is the union of its
            // line boxes, which covers the full column width and swallows
            // whatever sits beside it on the first line. At 200% zoom that
            // reported a "." separator as overlapping the link it merely sits
            // next to. Elements laid out across more than one line box have no
            // single meaningful rect, so they are not comparable this way.
            if (siblings[i].getClientRects().length > 1) break;
            if (siblings[j].getClientRects().length > 1) continue;
            const a = siblings[i].getBoundingClientRect();
            const b = siblings[j].getBoundingClientRect();
            const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
            const iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
            const minArea = Math.min(a.width * a.height, b.width * b.height);
            // 25% of the smaller box's area, not any intersection at all —
            // 1-2px of anti-aliasing/rounding overlap between adjacent
            // inline text is normal and not what this check is for.
            if (minArea > 0 && (ix * iy) / minArea > 0.25) {
              overlaps.push({ a: describe(siblings[i]), b: describe(siblings[j]) });
            }
          }
        }
      }

      return {
        newOverflow,
        afterWidth,
        clientWidth: root.clientWidth,
        overflowSelector: widest ? describe(widest) : undefined,
        clipped,
        overlaps,
      };
    }, beforeWidth);

    if (result.newOverflow) {
      findings.push({
        severity: "major",
        summary: "Horizontal scrolling appears at 200% text zoom (WCAG 1.4.4)",
        detail: `document scrollWidth grew to ${result.afterWidth}px against a ${result.clientWidth}px viewport after doubling the root font size`,
        selector: result.overflowSelector,
      });
    }

    pushCapped(findings, result.clipped.slice(0, 5), result.clipped.length, (c) => ({
      severity: "major",
      summary: "Text is clipped at 200% zoom (WCAG 1.4.4)",
      detail: `scrollHeight ${c.scrollHeight}px > clientHeight ${c.clientHeight}px under overflow:hidden`,
      selector: c.selector,
    }), "Text is clipped at 200% zoom (WCAG 1.4.4) — additional instances not listed");

    pushCapped(findings, result.overlaps.slice(0, 5), result.overlaps.length, (o) => ({
      severity: "major",
      summary: "Text overlaps a sibling element at 200% zoom (WCAG 1.4.4)",
      detail: `${o.a} overlaps ${o.b} by more than 25% of the smaller element's area`,
    }), "Text overlaps a sibling element at 200% zoom (WCAG 1.4.4) — additional instances not listed");
  } finally {
    // Reset regardless of what was found — a leaked 32px root font size
    // would corrupt every layout measurement in whichever audit module runs
    // after this one on the same page.
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "";
    });
  }
}

/**
 * Windows High Contrast Mode (the `forced-colors` media feature). No reload
 * needed — a live `emulateMedia()` change fires `matchMedia` listeners
 * immediately, and CSS repaints live regardless.
 *
 * "Content that disappears" is measured by identity, not by index: elements
 * are tagged with a temporary marker attribute before the emulation change,
 * then re-selected by that marker afterward. An index-matched
 * before/after `querySelectorAll` snapshot would silently misattribute
 * results the moment forced-colors causes React to unmount (not just
 * shrink) anything, since removing a node shifts every later index.
 */
async function checkForcedColors(page, findings) {
  const MARK = "data-e2e-fc-audit";
  let emulated = false;
  try {
    const beforeCount = await page.evaluate((mark) => {
      let n = 0;
      for (const el of document.body.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          el.setAttribute(mark, String(n));
          n++;
        }
      }
      return n;
    }, MARK);

    await page.emulateMedia({ forcedColors: "active" });
    emulated = true;
    await nextPaint(page);

    const { collapsed, stillPresent } = await page.evaluate((mark) => {
      const collapsed = [];
      const marked = document.querySelectorAll(`[${mark}]`);
      for (const el of marked) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) {
          collapsed.push(typeof window.__describe === "function" ? window.__describe(el) : el.tagName.toLowerCase());
        }
        el.removeAttribute(mark);
      }
      return { collapsed, stillPresent: marked.length };
    }, MARK);

    pushCapped(findings, collapsed.slice(0, 5), collapsed.length, (selector) => ({
      severity: "minor",
      summary: "Content collapses to zero size under forced-colors (Windows High Contrast) mode",
      detail: "element had a non-zero rect under normal rendering and a zero rect under forced-colors: active",
      selector,
    }), "Content collapses under forced-colors mode — additional instances not listed");

    const removed = beforeCount - stillPresent;
    if (removed > 0) {
      findings.push({
        severity: "minor",
        summary: "Elements are removed from the page entirely under forced-colors mode",
        detail: `${removed} of ${beforeCount} previously-visible element(s) were unmounted rather than merely recoloured — the marker attribute vanished with them, so no individual selector is available`,
      });
    }
  } catch {
    // Not every Chrome build/OS combination supports forced-colors emulation
    // (Windows High Contrast Mode is native to Windows; CDP has to fake it
    // elsewhere) — an unsupported build must not fail the module.
  } finally {
    if (emulated) {
      try {
        await page.emulateMedia({ forcedColors: null });
      } catch {
        // best-effort
      }
    }
    // Clean up any markers a mid-check exception left behind (e.g. the
    // emulate call itself threw between marking and measuring).
    try {
      await page.evaluate((mark) => {
        for (const el of document.querySelectorAll(`[${mark}]`)) el.removeAttribute(mark);
      }, MARK);
    } catch {
      // best-effort
    }
  }
}

/**
 * prefers-reduced-motion: decorative/perpetual motion should stop under
 * `reduce`. Requires a reload (see file header) and does not reinstall the
 * probes it drops — every read here is a plain computed-style value, so
 * there's nothing a probe reinstall would buy.
 */
async function checkReducedMotion(page, findings) {
  let emulated = false;
  try {
    await page.emulateMedia({ reducedMotion: "reduce" });
    emulated = true;
    await page.reload({ waitUntil: "networkidle", timeout: 45000 });
    await nextPaint(page);

    const offenders = await page.evaluate(() => {
      const describe = (el) => {
        const id = el.id ? "#" + el.id : "";
        const cls = typeof el.className === "string" && el.className
          ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".")
          : "";
        return el.tagName.toLowerCase() + id + cls;
      };

      // Resolving whether a named animation actually touches transform/
      // opacity requires walking the CSSOM for its @keyframes rule — computed
      // style alone (`animationName`) doesn't say what properties the
      // keyframes move. Cached per name since many elements typically share
      // one animation (e.g. a "pulse" badge repeated across a list).
      // Top-level stylesheet rules only (no @media-nested @keyframes) and
      // cross-origin stylesheets are skipped (unreadable, not an error) —
      // both are deliberate scope cuts, not oversights.
      const motionKeyframeCache = new Map();
      function keyframeTouchesMotion(name) {
        if (!name || name === "none") return false;
        if (motionKeyframeCache.has(name)) return motionKeyframeCache.get(name);
        let touches = false;
        search: for (const sheet of document.styleSheets) {
          let rules;
          try {
            rules = sheet.cssRules;
          } catch {
            continue; // cross-origin stylesheet, unreadable
          }
          for (const rule of rules) {
            if (rule instanceof CSSKeyframesRule && rule.name === name) {
              for (const kf of rule.cssRules) {
                if (kf.style && (kf.style.transform || kf.style.opacity)) {
                  touches = true;
                  break search;
                }
              }
              break search;
            }
          }
        }
        motionKeyframeCache.set(name, touches);
        return touches;
      }

      const infinite = [];
      const longMotion = [];

      // NOTE: elements with more than one comma-separated animation (e.g.
      // `animation: a 1s, b 2s`) are only checked against the first value in
      // each list — real but rare, and not worth the zipped-array parsing
      // here.
      for (const el of document.body.querySelectorAll("*")) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") continue;

        const animDuration = parseFloat(cs.animationDuration) || 0;
        if (animDuration > 0.01 && cs.animationPlayState !== "paused" && keyframeTouchesMotion(cs.animationName)) {
          const entry = { selector: describe(el), kind: "animation", duration: animDuration, name: cs.animationName };
          if (cs.animationIterationCount === "infinite") infinite.push(entry);
          else longMotion.push(entry);
        }

        const transDuration = parseFloat(cs.transitionDuration) || 0;
        const transProps = cs.transitionProperty.split(",").map((p) => p.trim());
        if (transDuration > 0.01 && transProps.some((p) => p === "all" || p === "transform" || p === "opacity")) {
          longMotion.push({ selector: describe(el), kind: "transition", duration: transDuration, property: cs.transitionProperty });
        }
      }

      const videos = [...document.querySelectorAll("video")]
        .filter((v) => v.autoplay && !v.paused)
        .map((v) => describe(v));

      return { infinite, longMotion, videos };
    });

    pushCapped(findings, offenders.videos.slice(0, 5), offenders.videos.length, (selector) => ({
      severity: "major",
      summary: "Autoplaying <video> keeps playing under prefers-reduced-motion: reduce",
      detail: "video has the autoplay property set and is not paused after a reload with reduced motion emulated",
      selector,
    }), "Autoplaying <video> keeps playing under reduced motion — additional instances not listed");

    // Grouped with autoplaying video above/below as one "infinite/decorative
    // motion" bucket per the brief this check was written against: both are
    // continuous motion sources that `reduce` is specifically supposed to
    // stop, so both land at `major` when they survive it.
    pushCapped(findings, offenders.infinite.slice(0, 5), offenders.infinite.length, (a) => ({
      severity: "major",
      summary: "Infinitely-looping animation is not suppressed under prefers-reduced-motion: reduce",
      detail: `animation-iteration-count: infinite, animation-duration ${a.duration}s${a.name ? ` (animation: ${a.name})` : ""}`,
      selector: a.selector,
    }), "Infinitely-looping animation is not suppressed under reduced motion — additional instances not listed");

    pushCapped(findings, offenders.longMotion.slice(0, 5), offenders.longMotion.length, (m) => ({
      severity: "minor",
      summary: "Non-trivial motion survives prefers-reduced-motion: reduce",
      detail: m.kind === "animation"
        ? `animation-duration ${m.duration}s${m.name ? ` (animation: ${m.name})` : ""}`
        : `transition-duration ${m.duration}s on ${m.property}`,
      selector: m.selector,
    }), "Non-trivial motion survives reduced motion — additional instances not listed");
  } finally {
    if (emulated) {
      try {
        await page.emulateMedia({ reducedMotion: null });
      } catch {
        // best-effort
      }
    }
  }
}

/**
 * prefers-color-scheme: does dark mode exist at all, and if it does, is body
 * text still AA. Requires a reload (see file header) and reinstalls the
 * probes it drops, specifically so the AA spot-check can call the shared
 * `__contrast.ratio` rather than re-deriving relative-luminance math here.
 */
async function checkColorScheme(page, findings) {
  let emulated = false;
  try {
    const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    await page.emulateMedia({ colorScheme: "dark" });
    emulated = true;
    await page.reload({ waitUntil: "networkidle", timeout: 45000 });
    await nextPaint(page);

    await installProbes(page);
    await page.evaluate(DESCRIBE);

    const after = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    if (after === before) {
      // Body only, per this check's scope — a theme applied to :root/html or
      // a wrapper div instead of body would read as "unchanged" here. That's
      // a known blind spot of this specific heuristic, not a claim that no
      // element on the page ever changes color.
      findings.push({
        severity: "minor",
        summary: "No dark mode support detected (prefers-color-scheme: dark has no visible effect)",
        detail: `body background-color unchanged (${before}) under prefers-color-scheme: dark`,
      });
      return;
    }

    const spotCheck = await page.evaluate(() => {
      const body = document.body;
      const cs = getComputedStyle(body);
      const bg = window.__contrast.effectiveBackground(body);
      const fg = window.__contrast.paint(cs.color);
      return {
        ratio: window.__contrast.ratio(fg, bg),
        fgCss: cs.color,
        bgCss: `rgba(${bg.r}, ${bg.g}, ${bg.b}, ${bg.a})`,
        selector: window.__describe(body),
      };
    });

    // 4.5:1 is the WCAG AA threshold for normal (non-large) body text —
    // SC 1.4.3 Contrast (Minimum).
    if (spotCheck.ratio < 4.5) {
      findings.push({
        severity: "major",
        summary: "Body text fails WCAG AA contrast in dark mode",
        detail: `contrast ratio ${spotCheck.ratio.toFixed(2)}:1 (needs >= 4.5:1) — color ${spotCheck.fgCss} on effective background ${spotCheck.bgCss}`,
        selector: spotCheck.selector,
      });
    }
  } finally {
    if (emulated) {
      try {
        await page.emulateMedia({ colorScheme: null });
      } catch {
        // best-effort
      }
    }
  }
}

/**
 * Push up to `items.length` pre-built findings, plus one rollup finding if
 * `total` (the un-sliced count) exceeds what was pushed. Keeps a page with
 * fifty clipped elements from producing fifty near-duplicate findings —
 * run.mjs's report() only collapses identical findings across viewports, not
 * across the many distinct selectors a single page can offer up here.
 */
function pushCapped(findings, items, total, toFinding, rollupSummary) {
  for (const item of items) findings.push(toFinding(item));
  const extra = total - items.length;
  if (extra > 0) {
    findings.push({
      severity: toFinding(items[0]).severity,
      summary: rollupSummary,
      detail: `${extra} more instance(s) beyond the ${items.length} shown above`,
    });
  }
}
