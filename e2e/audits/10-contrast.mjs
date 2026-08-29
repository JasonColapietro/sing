/**
 * WCAG 2.2 AA contrast audit.
 *
 * Four checks, all run inside one page.evaluate so every colour comparison
 * goes through window.__contrast (installed by lib/harness.mjs) instead of a
 * hand-rolled parser:
 *
 *   1. Every visible text node — SC 1.4.3 Contrast (Minimum).
 *   2-4. The non-text UI SC 1.4.11 covers: icon-only button marks, form-input
 *      borders, and focus rings.
 *
 * Nothing here reads getComputedStyle().color/backgroundColor and treats the
 * string as ground truth — Chrome hands back lab()/oklch() for some of this
 * app's declared colours, and __contrast.paint() is what actually resolves
 * those (see harness.mjs). Likewise every background is effectiveBackground(),
 * never an element's own backgroundColor, because panels here are frequently
 * semi-transparent over another panel.
 */

export const id = "contrast";
export const title = "Text contrast (WCAG 2.2 AA)";

export async function run(ctx) {
  return ctx.page.evaluate(() => {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const SIDES = ["Top", "Right", "Bottom", "Left"];

    // ---- colour helpers ---------------------------------------------------

    function colorsClose(a, b, eps = 1) {
      return Math.abs(a.r - b.r) <= eps && Math.abs(a.g - b.g) <= eps && Math.abs(a.b - b.b) <= eps;
    }

    function fmtColor(c) {
      const r = Math.round(c.r), g = Math.round(c.g), b = Math.round(c.b);
      return c.a < 0.999 ? `rgba(${r}, ${g}, ${b}, ${c.a.toFixed(2)})` : `rgb(${r}, ${g}, ${b})`;
    }

    function colorKey(c) {
      return `${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${c.a.toFixed(2)}`;
    }

    // ratio()/luminance() in the probe only look at r/g/b. A semi-transparent
    // foreground (rgba text, a low-alpha border) has to be blended onto its
    // backdrop first, or its nominal colour overstates what's actually on
    // screen — that's exactly what the exposed over() is for.
    function actualRatio(fg, bg) {
      const rendered = fg.a < 1 ? window.__contrast.over(fg, bg) : fg;
      return window.__contrast.ratio(rendered, bg);
    }

    // SVG glyphs are painted via fill (or stroke, for outline-style icon
    // sets), never `color`. Reading `color` on an <svg text> is a confident
    // wrong answer waiting to happen — at least one component in this repo
    // (pitch-match-game.tsx) still ships a hardcoded literal fill instead of
    // a token, so this has to read the real presentation value, not assume
    // everything resolves through currentColor.
    function resolvePaintColor(el, cs) {
      if (el.namespaceURI === SVG_NS) {
        for (const prop of [cs.fill, cs.stroke]) {
          if (prop && prop !== "none") {
            const c = window.__contrast.paint(prop);
            if (c.a > 0) return c;
          }
        }
      }
      return window.__contrast.paint(cs.color);
    }

    // effectiveBackground() walks CSS background-color up the HTML ancestor
    // chain, which is right for everything except SVG text sitting over a
    // sibling shape (a <rect> panel behind a chart label) — that's paint
    // order, not ancestry, so CSS walking finds nothing and falls through to
    // the page background. elementsFromPoint() gives the real visual stack at
    // that pixel; if the first thing behind the text within the same <svg> is
    // an opaque fill, use it. Only trusts a (near-)opaque shape, since partial
    // alpha would need real compositing this isn't attempting to redo.
    function svgBackdrop(el) {
      const r = el.getBoundingClientRect();
      const stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      for (const node of stack) {
        if (node === el || el.contains(node) || node.contains(el)) continue;
        if (node.namespaceURI !== SVG_NS) break; // left the <svg> — effectiveBackground already covers the HTML side
        const fill = getComputedStyle(node).fill;
        if (!fill || fill === "none") continue;
        const c = window.__contrast.paint(fill);
        if (c.a >= 0.98) return c;
      }
      return null;
    }

    // ---- visibility --------------------------------------------------------

    // opacity doesn't inherit, so a parent's opacity:0 doesn't show up on a
    // child's own computed style — has to be walked and multiplied. Memoised
    // because many text nodes on a page share the same ancestor chain.
    const opacityCache = new WeakMap();
    function cumulativeOpacity(el) {
      if (!el) return 1;
      if (opacityCache.has(el)) return opacityCache.get(el);
      const own = parseFloat(getComputedStyle(el).opacity);
      const result = (Number.isNaN(own) ? 1 : own) * cumulativeOpacity(el.parentElement);
      opacityCache.set(el, result);
      return result;
    }

    function isReallyVisible(el) {
      if (el.getClientRects().length === 0) return false; // display:none, self or an ancestor
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      const cs = getComputedStyle(el);
      // visibility inherits, so el's own computed value already reflects an
      // ancestor's `hidden` unless something between them opted back in.
      if (cs.visibility === "hidden" || cs.visibility === "collapse") return false;
      if (cumulativeOpacity(el) === 0) return false;
      return true;
    }

    // Tailwind's .sr-only (and every hand-rolled equivalent in this repo:
    // nav.tsx, result-card.tsx, the skip link in layout.tsx, …) clips to a
    // 1px box rather than using display:none, so it survives the visibility
    // check above by design — screen-reader-only text is still "visible" to
    // getBoundingClientRect. That's real content for AT users, not a contrast
    // defect, so it needs its own check: the clip-rect technique, the
    // clip-path inset(50%+) equivalent, or the 1x1-clipped-box signature
    // directly. Walks up because the class can sit on a wrapping element
    // rather than the text's direct parent.
    const srOnlyCache = new WeakMap();
    function isScreenReaderOnly(el) {
      if (!el || el.nodeType !== 1) return false;
      if (srOnlyCache.has(el)) return srOnlyCache.get(el);
      const cs = getComputedStyle(el);
      const clipRect = cs.clip === "rect(0px, 0px, 0px, 0px)";
      const clipInset = /inset\(\s*50%/.test(cs.clipPath || "none");
      const r = el.getBoundingClientRect();
      const clipsOverflow = cs.overflowX !== "visible" || cs.overflowY !== "visible";
      const pinhole = r.width <= 1 && r.height <= 1 && clipsOverflow && cs.position !== "static";
      const result = clipRect || clipInset || pinhole || isScreenReaderOnly(el.parentElement);
      srOnlyCache.set(el, result);
      return result;
    }

    // ---- design tokens ------------------------------------------------------

    // Discovered live from the served stylesheets rather than hardcoded, so
    // this keeps working as tokens are added/renamed. Tailwind v4 wraps
    // @theme output in @layer, so this has to recurse into group rules
    // (@layer/@media), not just walk sheet.cssRules directly.
    function collectColorTokens() {
      const tokens = new Map();
      const visit = (rules) => {
        if (!rules) return;
        for (const rule of rules) {
          if (rule.style) {
            for (let i = 0; i < rule.style.length; i++) {
              const prop = rule.style[i];
              if (prop.startsWith("--color-")) {
                const raw = rule.style.getPropertyValue(prop).trim();
                if (raw) tokens.set(prop, window.__contrast.paint(raw));
              }
            }
          }
          if (rule.cssRules) visit(rule.cssRules);
        }
      };
      for (const sheet of document.styleSheets) {
        try { visit(sheet.cssRules); } catch { /* cross-origin sheet — unreadable, skip */ }
      }
      return tokens;
    }

    // The repo's pattern is --color-X for fills/borders and --color-X-ink for
    // text (globals.css spells this out for amber and ok). If failing text
    // resolves to a non-ink token, that names the actual fix instead of just
    // the numbers. A token not present on this particular page's stylesheet
    // (Tailwind only emits what's referenced) just yields no note — never a
    // guess.
    function tokenNoteFor(fg, tokens) {
      const hits = [...tokens.keys()].filter((name) => colorsClose(fg, tokens.get(name)));
      const nonInk = hits.filter((n) => !n.endsWith("-ink"));
      if (!nonInk.length) return "";
      const suggestions = nonInk.map((n) => `${n}-ink`).filter((n) => tokens.has(n));
      return suggestions.length
        ? ` Uses fill/border token ${nonInk.join(", ")} as text colour — ${suggestions.join(", ")} exists for this.`
        : ` Uses fill/border token ${nonInk.join(", ")} as text colour; no -ink variant is defined yet.`;
    }

    // known-accepted exception: middle-dot separators styled on the border
    // token read ~1.65:1 and are deliberate decorative punctuation, not a
    // defect. Matched against the token's live value (not a hardcoded hex) so
    // this keeps working if the token is retuned, and matched on the exact
    // text node's own content (not el.textContent, which would flatten in
    // any sibling text from other children) so it can't accidentally swallow
    // real copy that happens to share a parent with a separator.
    function isExemptDotSeparator(text, fg, lineToken) {
      if (!lineToken) return false;
      const stripped = text.replace(/\s+/g, "");
      return stripped.length > 0 && !/[^·]/.test(stripped) && colorsClose(fg, lineToken);
    }

    // ---- text metrics ---------------------------------------------------

    function isLargeText(cs) {
      const px = parseFloat(cs.fontSize);
      let weight = parseFloat(cs.fontWeight);
      if (Number.isNaN(weight)) weight = cs.fontWeight === "bold" ? 700 : 400;
      return px >= 24 || (px >= 18.66 && weight >= 700);
    }

    // Memoised per element: several direct text-node children of the same
    // element (inline markup like "Hello <b>world</b> and more") would
    // otherwise repeat an identical getComputedStyle/paint/ratio computation.
    const textMetricsCache = new WeakMap();
    function computeTextMetrics(el) {
      if (textMetricsCache.has(el)) return textMetricsCache.get(el);
      let metrics = null;
      if (isReallyVisible(el) && !isScreenReaderOnly(el)) {
        const cs = getComputedStyle(el);
        const isSvg = el.namespaceURI === SVG_NS;
        const fg = resolvePaintColor(el, cs);
        if (fg.a > 0) {
          const bg = (isSvg && svgBackdrop(el)) || window.__contrast.effectiveBackground(el);
          const large = isLargeText(cs);
          metrics = { fg, bg, ratio: actualRatio(fg, bg), large, threshold: large ? 3 : 4.5, cs };
        }
      }
      textMetricsCache.set(el, metrics);
      return metrics;
    }

    // ---- findings, deduplicated by (colour pair, tag, severity) ---------

    const hits = [];
    const colorTokens = collectColorTokens();
    const lineTokenRaw = getComputedStyle(document.documentElement).getPropertyValue("--color-line2").trim();
    const lineToken = lineTokenRaw ? window.__contrast.paint(lineTokenRaw) : null;

    // 1. Text contrast — every element with a visible, non-whitespace direct
    // text-node child. Walking text nodes (not elements) and caching by
    // parent keeps this correct for elements with multiple direct text
    // children while still doing the colour work once per element.
    const SKIP_TEXT_PARENTS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = node.parentElement;
        if (!p || SKIP_TEXT_PARENTS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let textNode;
    while ((textNode = walker.nextNode())) {
      const el = textNode.parentElement;
      const m = computeTextMetrics(el);
      if (!m || m.ratio >= m.threshold) continue;
      if (isExemptDotSeparator(textNode.nodeValue.trim(), m.fg, lineToken)) continue;

      const tag = el.tagName.toLowerCase();
      const note = tokenNoteFor(m.fg, colorTokens);
      hits.push({
        key: `text|major|${colorKey(m.fg)}|${colorKey(m.bg)}|${tag}`,
        severity: "major",
        summary: `<${tag}> text fails WCAG 1.4.3 Contrast Minimum: ${m.ratio.toFixed(2)}:1, needs ${m.threshold}:1 for ${m.large ? "large" : "normal"} text.`,
        detail: `${fmtColor(m.fg)} on ${fmtColor(m.bg)} — font-size ${Math.round(parseFloat(m.cs.fontSize))}px, weight ${m.cs.fontWeight}.${note}`,
        selector: window.__describe(el),
      });
    }

    // 2. Icon-only button fills — a control with no visible text label, so
    // whatever the icon is painted with is the entire visual affordance.
    // <img>/background-image icons are recognised (so they don't get
    // mis-flagged as an unrelated missing-label bug) but not measured — no
    // reliable way to read a foreground colour off a raster image without
    // pixel sampling, and guessing is worse than skipping it.
    for (const el of document.querySelectorAll('button, a[role="button"], [role="button"]')) {
      if (!isReallyVisible(el)) continue;
      if (el.textContent.trim() !== "") continue;
      const svgIcon = el.querySelector("svg");
      const cs = getComputedStyle(el);
      const hasAnyGraphic = svgIcon || el.querySelector("img") || (cs.backgroundImage && cs.backgroundImage !== "none");
      if (!hasAnyGraphic) continue; // no label and no graphic = missing accessible name, a different bug
      if (!svgIcon) continue;

      // The <svg> wrapper itself almost never carries fill/stroke — real icon
      // sets paint the inner shape. SVG's initial fill value is black, so
      // reading the wrapper's own computed fill silently returns "black" for
      // any icon that doesn't set fill on the <svg> root specifically, no
      // matter what the visible glyph is actually painted with. Read the
      // shape that's actually drawn instead.
      const shape = svgIcon.querySelector("path, circle, rect, line, polyline, polygon, ellipse") || svgIcon;
      const mark = resolvePaintColor(shape, getComputedStyle(shape));
      if (mark.a === 0) continue;
      const bg = window.__contrast.effectiveBackground(el);
      const ratio = actualRatio(mark, bg);
      if (ratio >= 3) continue;

      const ownBg = window.__contrast.paint(cs.backgroundColor);
      const hasFill = ownBg.a > 0.05;
      const hasBorder = SIDES.some((side) => {
        const w = parseFloat(cs[`border${side}Width`]) || 0;
        return w > 0 && window.__contrast.paint(cs[`border${side}Color`]).a > 0.05;
      });
      const onlyAffordance = !hasFill && !hasBorder;
      const tag = el.tagName.toLowerCase();

      hits.push({
        key: `icon|${onlyAffordance ? "major" : "minor"}|${colorKey(mark)}|${colorKey(bg)}|${tag}`,
        severity: onlyAffordance ? "major" : "minor",
        summary: `Icon-only <${tag}> fails WCAG 1.4.11 Non-text Contrast: ${ratio.toFixed(2)}:1, needs 3:1.${onlyAffordance ? " No visible border or fill on the control, so the icon is its only affordance." : ""}`,
        detail: `icon mark ${fmtColor(mark)} on ${fmtColor(bg)}.`,
        selector: window.__describe(el),
      });
    }

    // 3. Form input borders — only controls that actually render a border on
    // some side; one styled with a box-shadow or underline instead has
    // nothing here to measure and isn't a false pass, just out of scope for
    // this specific check.
    for (const el of document.querySelectorAll("input, textarea, select")) {
      if (el.type === "hidden" || !isReallyVisible(el)) continue;
      const cs = getComputedStyle(el);
      const widths = SIDES.map((s) => parseFloat(cs[`border${s}Width`]) || 0);
      const maxW = Math.max(...widths);
      if (maxW === 0) continue;
      const side = SIDES[widths.indexOf(maxW)];
      const borderColor = window.__contrast.paint(cs[`border${side}Color`]);
      if (borderColor.a === 0) continue;

      const bg = window.__contrast.effectiveBackground(el);
      const ratio = actualRatio(borderColor, bg);
      if (ratio >= 3) continue;

      const tag = el.tagName.toLowerCase();
      hits.push({
        key: `border|minor|${colorKey(borderColor)}|${colorKey(bg)}|${tag}`,
        severity: "minor",
        summary: `<${tag}> border fails WCAG 1.4.11 Non-text Contrast: ${ratio.toFixed(2)}:1, needs 3:1.`,
        detail: `border ${fmtColor(borderColor)} on field background ${fmtColor(bg)}.`,
        selector: window.__describe(el),
      });
    }

    // 4. Focus ring — gated on el.matches(":focus-visible") rather than
    // assumed, and reached via script focus() rather than a simulated Tab
    // key. Verified against this harness's own launch config (chromium,
    // channel: "chrome"): script-invoked focus() reliably triggers
    // :focus-visible here, while a synthetic keyboard Tab on a freshly
    // navigated page often doesn't move focus at all (the page isn't
    // OS-focused). Gating on the match means a browser where that stops
    // being true just yields no finding instead of a wrong one.
    //
    // Deliberately NOT pre-filtered by isReallyVisible — layout.tsx's skip
    // link is sr-only until focused (`sr-only focus:not-sr-only`), so
    // visibility is checked after focusing, not before, or every skip link
    // in the app would be silently skipped here.
    const focusables = [...document.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]'
    )].filter((el) => el.tabIndex !== -1);

    // Capped: a directory page can have hundreds of identical row links
    // sharing one design-system focus style — 40 is enough to surface every
    // distinct style on a page without re-running getComputedStyle per row.
    const sample = focusables.slice(0, 40);
    const initialActive = document.activeElement;

    for (const el of sample) {
      el.focus({ preventScroll: true });
      if (!el.matches(":focus-visible")) continue;
      if (!isReallyVisible(el)) continue;
      const cs = getComputedStyle(el);
      const width = parseFloat(cs.outlineWidth) || 0;
      if (cs.outlineStyle === "none" || width === 0) continue; // no ring at all is a keyboard-nav defect, not a contrast one

      const ring = window.__contrast.paint(cs.outlineColor);
      if (ring.a === 0) continue;
      const bg = window.__contrast.effectiveBackground(el);
      const ratio = actualRatio(ring, bg);
      if (ratio >= 3) continue;

      const tag = el.tagName.toLowerCase();
      hits.push({
        key: `ring|minor|${colorKey(ring)}|${colorKey(bg)}|${tag}`,
        severity: "minor",
        summary: `Focus outline on <${tag}> fails WCAG 1.4.11 Non-text Contrast: ${ratio.toFixed(2)}:1, needs 3:1.`,
        detail: `outline ${fmtColor(ring)} on ${fmtColor(bg)}.`,
        selector: window.__describe(el),
      });
    }
    document.activeElement?.blur();
    if (initialActive && initialActive !== document.body && typeof initialActive.focus === "function") {
      initialActive.focus({ preventScroll: true });
    }

    // ---- aggregate ---------------------------------------------------------
    // Same colour pairing repeated across many nodes (one design-system
    // token used site-wide) is one defect, not N — count instances and keep
    // the first hit as the representative selector.
    const groups = new Map();
    for (const h of hits) {
      if (!groups.has(h.key)) groups.set(h.key, { ...h, count: 0 });
      groups.get(h.key).count++;
    }
    return [...groups.values()].map((g) => ({
      severity: g.severity,
      summary: g.summary,
      detail: g.count > 1 ? `${g.detail} Affects ${g.count} nodes with this exact styling.` : g.detail,
      selector: g.selector,
    }));
  });
}
