/**
 * Pointer target size and hit region.
 *
 * WCAG 2.2 AA (2.5.8) sets a 24x24 CSS px floor; Apple/Material guidance asks
 * for 44x44 on touch. Neither number means anything read off
 * getBoundingClientRect() alone — see the HIT_PROBE comment in
 * ../lib/harness.mjs for why border-radius clips pointer hit-testing the same
 * way it clips paint (a rounded-full size-11 button measures a clean 44x44
 * while losing ~21% of that square to its parent). This module uses the raw
 * box only for what it is still correct for — nominal size, which is what
 * 2.5.8 itself measures — and leans on window.__hit's real elementFromPoint
 * corner probes for everything about where a tap actually lands.
 *
 * Two gotchas that are NOT the border-radius story and will flood every
 * route with false positives if missed:
 *
 * - document.elementFromPoint returns null for a point outside the current
 *   viewport. Anything below the fold has corners that resolve to nothing,
 *   which __hit correctly reports as "dead" for what it was asked and
 *   wrongly for what that means here. This audit only scores controls whose
 *   full box already sits inside the current viewport; it never scrolls.
 * - An inline link that wraps across two lines has a bounding rect spanning
 *   both lines, including the gap between them — its "corners" sit over
 *   whitespace, not glyphs. Corner-probing that rect tests geometry that was
 *   never a tap target shape to begin with. This is also exactly WCAG's own
 *   2.5.8 inline exception (a link running in a sentence is exempt), so
 *   genuine prose links are dropped before any of the three checks run, not
 *   just the size check.
 */

const SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export const id = "tap-targets";
export const title = "Pointer target size and hit region";

/**
 * Everything that needs a live DOM: finding the modal-overlay guard,
 * collecting candidates, and the spacing comparison (which needs real node
 * identity — .contains() — to tell a control's own nested icon from a
 * genuinely adjacent sibling; two serialized rects 0px apart can't tell you
 * which case you're in). Runs inside page.evaluate, once per route/viewport.
 * Thresholds, severities and finding text are built back in Node, where
 * they're easier to read and change without re-deriving browser-side logic.
 */
function gatherTapTargets({ selector, isTouch }) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // --- full-screen overlay guard ------------------------------------------
  // moments.tsx (the Pro upsell), the mobile nav drawer, and stage mode all
  // render as `fixed inset-0` with a raised z-index the instant they open.
  // While one is up, every control on the page underneath it fails
  // hit-testing — not because those controls are broken, but because the
  // overlay is, correctly, in front of them. Don't trust position/inset/
  // z-index alone to decide that though: confirm with __hit on the candidate
  // itself. A fixed inset-0 box that LOOKS like it covers the page but has
  // lost its own corners to something else in the same stacking context
  // (or sits behind real content, e.g. a decorative fixed background) is not
  // actually the frontmost thing, and box geometry can't tell the two apart.
  let overlay = null;
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.position !== "fixed" || cs.pointerEvents === "none") continue;
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    // 2px slop for scrollbar gutters / subpixel layout, not for a drawer
    // that only covers part of the screen.
    const coversViewport = r.top <= 2 && r.left <= 2 && r.right >= vw - 2 && r.bottom >= vh - 2;
    if (!coversViewport) continue;
    const hit = window.__hit(el);
    if (hit && hit.dead.length === 0) {
      const dialog = el.querySelector('[role="dialog"]');
      const label = dialog?.getAttribute("aria-label") || el.getAttribute("aria-label") || "";
      overlay = { selector: window.__describe(el), label };
      break;
    }
  }
  if (overlay) return { overlay, targets: [], spacing: [] };

  // --- candidate collection ------------------------------------------------
  const EPS = 0.5; // subpixel slop, not an excuse to admit a clipped element

  // A link is only exempt from 2.5.8 when it is genuinely running inline
  // with other text (WCAG's "inline" exception) — not merely because some
  // ancestor happens to be a <p> or <li>. Using closest("p, li") would also
  // exempt e.g. a directory-card link three levels under an <li> just
  // because a heading elsewhere in that card contributes "other text"; that
  // is a grid item, not a sentence. Requiring the link to be a DIRECT child
  // of the <p>/<li>, with real text left over once the link's own text is
  // stripped out, is what actually distinguishes "Read the {full story}
  // here" from "<li><div class='card'><h3>…</h3><a>…</a></div></li>".
  const isInlineProseLink = (el) => {
    const parent = el.parentElement;
    if (!parent || (parent.tagName !== "P" && parent.tagName !== "LI")) return false;
    const own = (el.textContent || "").trim();
    if (!own) return false;
    const full = (parent.textContent || "").trim();
    return full.replace(own, "").trim().length > 0;
  };

  const nodes = [];
  for (const el of document.querySelectorAll(selector)) {
    if (el.closest('[aria-hidden="true"]')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;

    const isLinkish = el.tagName === "A" || el.getAttribute("role") === "link";
    if (isLinkish && isInlineProseLink(el)) continue;

    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const fullyOnScreen = r.top >= -EPS && r.left >= -EPS && r.bottom <= vh + EPS && r.right <= vw + EPS;
    if (!fullyOnScreen) continue; // see module header — elementFromPoint(outside viewport) is null

    const hit = window.__hit(el);
    if (!hit) continue;

    nodes.push({ el, hit, r });
  }

  const targets = nodes.map(({ el, hit }) => ({
    selector: window.__describe(el),
    width: hit.width,
    height: hit.height,
    dead: hit.dead,
    minimumTargetFits: hit.minimumTargetFits,
  }));

  // --- spacing (touch viewports only, gated by the caller via `isTouch`) ---
  const spacing = [];
  if (isTouch) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        // A control and its own nested icon/label match the selector twice
        // at ~0px apart. That is nesting, not a spacing bug — exclude it the
        // only reliable way, real containment, since two rects alone can't
        // distinguish "nested" from "coincidentally touching".
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const dx = Math.max(a.r.left - b.r.right, b.r.left - a.r.right, 0);
        const dy = Math.max(a.r.top - b.r.bottom, b.r.top - a.r.bottom, 0);
        const gap = Math.sqrt(dx * dx + dy * dy);
        if (gap < 8) {
          spacing.push({ a: window.__describe(a.el), b: window.__describe(b.el), gap });
        }
      }
    }
  }

  return { overlay: null, targets, spacing };
}

/**
 * Estimate the untappable area for a dead-corner finding.
 *
 * There is no way to recover the actual clip geometry from "these corners
 * didn't hit" alone — it could be border-radius, clip-path, or an
 * overlapping sibling. What's modeled here is the documented common case in
 * this repo: a rounded-full control, where each dead corner loses everything
 * outside a quarter-ellipse inscribed in its (width/2 x height/2) quadrant.
 * That's the same arithmetic as the canonical 44x44 rounded-full example
 * (44² − π·22² = 416px²), generalized to N dead corners instead of assuming
 * all four, so findings are comparable to each other even though none of
 * them is a pixel measurement.
 */
function deadCornerLostArea(width, height, deadCount) {
  const perCorner = (width / 2) * (height / 2) * (1 - Math.PI / 4);
  return Math.round(perCorner * deadCount);
}

export async function run(ctx) {
  const { page, viewport } = ctx;
  const isTouch = viewport.width <= 768;

  const { overlay, targets, spacing } = await page.evaluate(gatherTapTargets, {
    selector: SELECTOR,
    isTouch,
  });

  if (overlay) {
    const named = overlay.label ? ` ("${overlay.label}")` : "";
    return [
      {
        severity: "blocker",
        summary: "A full-screen dialog is covering the page — skipping the rest of this audit",
        detail:
          `${overlay.selector}${named} is fixed, covers the full viewport, and its own corners ` +
          `hit-test back to itself, so it is genuinely frontmost rather than a false alarm. Most ` +
          `likely the Pro upsell (components/pro/moments.tsx), the mobile nav drawer, or stage mode, ` +
          `left open by an earlier interaction in this run. Every control underneath would fail ` +
          `hit-testing for reasons that have nothing to do with those controls, so the rest of this ` +
          `audit is skipped for this route/viewport instead of reporting a wall of false positives.`,
        selector: overlay.selector,
      },
    ];
  }

  const findings = [];

  // Scoped to this one run() call — one route, one viewport — deliberately.
  // run.mjs's own report() already collapses identical [audit, route,
  // severity, summary, selector] findings across all five viewports once
  // every audit has finished. Doing that here too, across viewport calls,
  // would need a module-level cache keyed by route, and it would be wrong:
  // a control whose Tailwind classes change its rendered size per breakpoint
  // can have a real mobile-only violation, and a cross-viewport cache would
  // silently swallow it because the same describe-string already "used up"
  // its one finding on desktop. This Set only stops the SAME element (or an
  // indistinguishable sibling — see __describe's own limits) from filing the
  // same check twice within a single viewport pass, e.g. twenty identical
  // song-row play buttons collapsing to one finding instead of twenty.
  const seen = new Set();
  const once = (checkType, key) => {
    const k = `${checkType}::${key}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  };

  for (const target of targets) {
    const nominal = Math.min(target.width, target.height);
    const w = Math.round(target.width);
    const h = Math.round(target.height);

    if (nominal < 24) {
      if (once("size", target.selector)) {
        findings.push({
          severity: "major",
          summary: "Target is under the WCAG 2.2 AA 24x24px minimum (2.5.8)",
          detail: `${target.selector} measures ${w}x${h}px — under 24px on at least one axis.`,
          selector: target.selector,
        });
      }
    } else if (isTouch && nominal < 44) {
      if (once("size", target.selector)) {
        findings.push({
          severity: "minor",
          summary: "Target clears the WCAG floor but is under 44x44px Apple/Material touch guidance",
          detail: `${target.selector} measures ${w}x${h}px — fine with a mouse, tight for a thumb.`,
          selector: target.selector,
        });
      }
    }

    // Dead corners alone are not a defect. Every rounded-full control has them
    // by construction, so reporting each one buried the real findings under
    // ~27 non-defects per route: a 66x32 pill and a 44px circle both report 4/4
    // dead and both are comfortably tappable. Only speak up when the WCAG 2.5.8
    // minimum does not actually fit inside the hittable region.
    if (target.dead.length > 0 && target.minimumTargetFits === false && once("dead-corners", target.selector)) {
      const severity = nominal < 44 ? "major" : "minor";
      const lost = deadCornerLostArea(target.width, target.height, target.dead.length);
      const verb = target.dead.length === 1 ? "does" : "do";
      findings.push({
        severity,
        summary: `${target.dead.length}/4 corners of the nominal box do not hit-test back to the control`,
        detail:
          `${target.selector} is nominally ${w}x${h}px but ${target.dead.join(", ")} ${verb} not ` +
          `resolve to it, and a 24x24 box at its centre does not hit-test cleanly either — so the ` +
          `WCAG 2.5.8 minimum does not fit inside the real target. An estimated ${lost}px² is ` +
          `untappable (border-radius clips the hit region the same way it clips paint). Fix: an unrounded ` +
          `after:absolute after:inset-0 overlay squares the hit region while border-radius keeps ` +
          `shaping only the :focus-visible ring.`,
        selector: target.selector,
      });
    }
  }

  for (const pair of spacing) {
    const key = [pair.a, pair.b].sort().join(" ~ ");
    if (!once("spacing", key)) continue;
    findings.push({
      severity: "minor",
      summary: `Adjacent targets are ${pair.gap.toFixed(1)}px apart, under the 8px comfortable-spacing margin`,
      detail: `${pair.a} and ${pair.b}.`,
      selector: pair.a,
    });
  }

  return findings;
}
