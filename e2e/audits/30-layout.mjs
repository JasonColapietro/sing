/**
 * Responsive layout integrity — six checks against the rendered page:
 * sideways page scroll, content silently clipped by an overflow-hidden
 * ancestor, overlapping text, unreadable paragraph line lengths, fixed/sticky
 * chrome eating the mobile viewport, and images missing intrinsic sizing.
 *
 * Runs as ONE `page.evaluate` so all six checks share a single DOM walk and
 * node budget instead of paying the JS bridge round trip — and re-querying
 * the tree — six separate times.
 */

export const id = "layout";
export const title = "Responsive layout integrity";

export async function run(ctx) {
  const { page, viewport } = ctx;

  return page.evaluate((viewportName) => {
    const findings = [];

    // A single O(n) walk over the tree can afford a generous budget; the
    // text-overlap check below is O(n^2) on whatever it's handed, so it
    // draws from the same walk but caps its own candidate set much lower.
    const WALK_BUDGET = 4000;
    const TEXT_PAIR_BUDGET = 500;

    // -----------------------------------------------------------------
    // Shared helpers
    // -----------------------------------------------------------------

    /**
     * A rect of all zeros means the element has left the viewport — fixed
     * off-screen, `display:none`, detached — not that it visually collapsed
     * to nothing while still in place. Treat it as invisible, never as a
     * layout defect in its own right.
     */
    function isRendered(el) {
      // A closed <details> keeps its contents in the layout tree so find-in-page
      // can reach them: full-size rects, nothing painted, nothing clickable. Two
      // collapsed sections therefore report their boxes stacked on the same
      // pixels, which read as overlapping body copy on /pro and /studio.
      if (typeof window.__rendered === "function" && !window.__rendered(el)) return false;
      const r = el.getBoundingClientRect();
      if (r.top === 0 && r.left === 0 && r.right === 0 && r.bottom === 0) return false;
      if (r.width === 0 || r.height === 0) return false;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") return false;
      if (parseFloat(cs.opacity) === 0) return false;
      return true;
    }

    // SVG internals (icon paths, chart nodes) are never real culprits for
    // any check below and can dominate the tree on icon-heavy pages — skip
    // the whole namespace instead of burning walk budget on it.
    function isSvgNode(el) {
      return el.namespaceURI === "http://www.w3.org/2000/svg";
    }

    /**
     * Collapse a flat list of "offending" elements to the outermost ones. A
     * wrapper and forty of its own overflowing children are one defect, not
     * forty-one, and reporting all forty-one buries the actual root cause.
     */
    function outermostOnly(elements) {
      const set = new Set(elements);
      return elements.filter((el) => {
        for (let p = el.parentElement; p; p = p.parentElement) {
          if (set.has(p)) return false;
        }
        return true;
      });
    }

    function describe(el) {
      return typeof window.__describe === "function" ? window.__describe(el) : el.tagName.toLowerCase();
    }

    const WALKABLE = Array.from(document.body.querySelectorAll("*")).slice(0, WALK_BUDGET);

    // -----------------------------------------------------------------
    // 1. Horizontal overflow of the page
    // -----------------------------------------------------------------
    function auditPageOverflow() {
      const clientWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      if (scrollWidth <= clientWidth + 1) return; // +1: subpixel rounding, not a defect

      /**
       * Overflow only bubbles up to the nearest ancestor that establishes a
       * scroll/clip boundary (`overflow-x` != visible). A wide child inside
       * an `overflow-x: auto` container — e.g. the /tools virtual keyboard,
       * 992px wide in a 299px box, reaching 693 — never reaches the document
       * edge. That's the intentional horizontally-scrollable-child case;
       * only an element with NO such ancestor is actually leaking width
       * onto the page.
       *
       * `overflow` doesn't apply to non-replaced inline boxes (CSS Overflow
       * spec), so an inline ancestor's `overflow-x: hidden` is inert — skip
       * it rather than treat it as a containing boundary.
       */
      function nearestClipAncestor(el) {
        let node = el.parentElement;
        while (node && node !== document.body) {
          const cs = getComputedStyle(node);
          if (cs.display !== "inline") {
            const ox = cs.overflowX;
            if (ox === "hidden" || ox === "auto" || ox === "scroll" || ox === "clip") return node;
          }
          node = node.parentElement;
        }
        return null;
      }

      const culprits = [];
      for (const el of WALKABLE) {
        if (isSvgNode(el) || !isRendered(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.right <= clientWidth + 1) continue;
        if (nearestClipAncestor(el)) continue;
        culprits.push(el);
      }

      const pageDetail = `document scrollWidth ${Math.round(scrollWidth)} > clientWidth ${Math.round(clientWidth)}, overflow ${Math.round(scrollWidth - clientWidth)}px`;
      const outermost = outermostOnly(culprits);

      if (outermost.length === 0) {
        // The page measurably overflows but nothing in the walked budget
        // explains it (pseudo-element, scrollbar quirk, budget cutoff) —
        // still worth surfacing rather than staying silent.
        findings.push({ severity: "major", summary: "Page scrolls horizontally", detail: pageDetail });
        return;
      }

      for (const el of outermost.slice(0, 5)) {
        const r = el.getBoundingClientRect();
        findings.push({
          severity: "major",
          summary: "Page scrolls horizontally because an element extends past the viewport",
          detail: `${pageDetail}; element right edge at ${Math.round(r.right)}px, ${Math.round(r.right - clientWidth)}px past the viewport`,
          selector: describe(el),
        });
      }
    }

    // -----------------------------------------------------------------
    // 2. Content clipped by an overflow-hidden ancestor
    // -----------------------------------------------------------------
    function auditClippedContent() {
      const candidates = [];
      for (const el of WALKABLE) {
        if (isSvgNode(el) || !isRendered(el)) continue;
        const cs = getComputedStyle(el);
        // `overflow` doesn't apply to inline boxes, and clientWidth is
        // forced to 0 there too — which would otherwise misread as "100%
        // of this element's content is clipped".
        if (cs.display === "inline") continue;
        if (cs.overflowX !== "hidden") continue;
        // Truncation is a design decision, not a clipping bug. `truncate`
        // (overflow:hidden + text-overflow:ellipsis) deliberately cuts a long
        // singer name to fit its column and shows an ellipsis saying so.
        if (cs.textOverflow === "ellipsis") continue;
        // Screen-reader-only text lives in a 1px box with overflow hidden by
        // definition; every sr-only node on the page reads as 100% clipped.
        if (cs.position === "absolute" && el.clientWidth <= 1 && el.clientHeight <= 1) continue;
        if (el.scrollWidth <= el.clientWidth + 1) continue;
        candidates.push(el);
      }

      for (const el of outermostOnly(candidates).slice(0, 8)) {
        const hasText = (el.textContent || "").trim().length > 0;
        findings.push({
          severity: hasText ? "major" : "minor",
          summary: hasText
            ? "Text is clipped by an overflow-hidden ancestor"
            : "Content is clipped by an overflow-hidden ancestor",
          detail: `scrollWidth ${el.scrollWidth} > clientWidth ${el.clientWidth}, ${el.scrollWidth - el.clientWidth}px hidden`,
          selector: describe(el),
        });
      }
    }

    // -----------------------------------------------------------------
    // 3. Text overlap / collision
    // -----------------------------------------------------------------
    function auditTextOverlap() {
      // "Text-bearing" means the element owns a direct, non-whitespace text
      // node — not merely a container whose descendants happen to render
      // text somewhere inside. That keeps every ancestor wrapper out of the
      // candidate set (it would trivially "contain" its own children in the
      // geometric check below) and keeps this O(n^2) pass small.
      function hasOwnText(el) {
        for (const node of el.childNodes) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) return true;
        }
        return false;
      }

      const candidates = [];
      for (const el of WALKABLE) {
        if (candidates.length >= TEXT_PAIR_BUDGET) break;
        if (isSvgNode(el) || !isRendered(el)) continue;
        if (!hasOwnText(el)) continue;
        // A box laid out across more than one line has no single meaningful
        // rect: getBoundingClientRect returns the union of its line boxes,
        // which spans the whole column and swallows whatever sits beside it on
        // the first line. Comparing those unions reported ordinary stacked
        // paragraphs as overlapping each other.
        if (el.getClientRects().length > 1) continue;
        candidates.push(el);
      }

      const rects = candidates.map((el) => el.getBoundingClientRect());
      const hits = [];
      for (let i = 0; i < candidates.length; i++) {
        for (let j = i + 1; j < candidates.length; j++) {
          const a = rects[i];
          const b = rects[j];
          const xOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const yOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (xOverlap <= 4 || yOverlap <= 4) continue;
          if (candidates[i].contains(candidates[j]) || candidates[j].contains(candidates[i])) continue;

          // Neither rect may fully contain the other — that's nesting
          // (e.g. a highlighted `<span>` inside its parent `<p>`), not a
          // collision between two independent pieces of text.
          const aInB = a.left >= b.left - 0.5 && a.right <= b.right + 0.5 && a.top >= b.top - 0.5 && a.bottom <= b.bottom + 0.5;
          const bInA = b.left >= a.left - 0.5 && b.right <= a.right + 0.5 && b.top >= a.top - 0.5 && b.bottom <= a.bottom + 0.5;
          if (aInB || bInA) continue;

          hits.push({ i, j, area: xOverlap * yOverlap });
        }
      }

      hits.sort((x, y) => y.area - x.area);
      for (const h of hits.slice(0, 5)) {
        const a = rects[h.i];
        const b = rects[h.j];
        const xOverlap = Math.round(Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const yOverlap = Math.round(Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        findings.push({
          severity: "major",
          summary: "Two text elements visually overlap",
          detail: `overlap ${xOverlap}x${yOverlap}px between "${(candidates[h.i].textContent || "").trim().slice(0, 30)}" and "${(candidates[h.j].textContent || "").trim().slice(0, 30)}"`,
          selector: `${describe(candidates[h.i])} ~ ${describe(candidates[h.j])}`,
        });
      }
    }

    // -----------------------------------------------------------------
    // 4. Unreadable line lengths (desktop only)
    // -----------------------------------------------------------------
    function auditLineLength() {
      if (!viewportName.startsWith("desktop")) return;
      const LIMIT = 110;

      /**
       * Measure px-per-character the only accurate way: lay out a real
       * `1ch` box in the paragraph's actual font. `ch` is defined as the
       * advance width of "0" in the element's font, which a fixed
       * average-char-width table can't approximate across typefaces.
       */
      function measureChWidth(cs) {
        const probe = document.createElement("span");
        probe.style.position = "absolute";
        probe.style.visibility = "hidden";
        probe.style.whiteSpace = "pre";
        probe.style.fontFamily = cs.fontFamily;
        probe.style.fontSize = cs.fontSize;
        probe.style.fontWeight = cs.fontWeight;
        probe.style.fontStyle = cs.fontStyle;
        probe.style.width = "1ch";
        document.body.appendChild(probe);
        const w = probe.getBoundingClientRect().width;
        probe.remove();
        return w;
      }

      const chCache = new Map();
      const paragraphs = WALKABLE.filter((el) => el.tagName === "P");
      let reported = 0;

      for (const p of paragraphs) {
        if (reported >= 5) break;
        if (!isRendered(p)) continue;
        const text = (p.textContent || "").trim();
        if (text.length < LIMIT) continue; // too short to ever produce a >110-char line

        const cs = getComputedStyle(p);
        const key = `${cs.fontFamily}|${cs.fontSize}|${cs.fontWeight}|${cs.fontStyle}`;
        let chWidth = chCache.get(key);
        if (chWidth === undefined) {
          chWidth = measureChWidth(cs);
          chCache.set(key, chWidth);
        }
        if (!chWidth) continue;

        const paddingL = parseFloat(cs.paddingLeft) || 0;
        const paddingR = parseFloat(cs.paddingRight) || 0;
        const contentWidth = p.clientWidth - paddingL - paddingR;
        const estChars = contentWidth / chWidth;
        if (estChars <= LIMIT) continue;
        // The container is only wide enough to matter if the text is long
        // enough to actually reach a full-width line at least once.
        if (text.length < estChars) continue;

        findings.push({
          severity: "minor",
          summary: "Paragraph line length exceeds a comfortable reading width",
          detail: `line width ${Math.round(contentWidth)}px / ${chWidth.toFixed(1)}px per character ~= ${Math.round(estChars)} characters (comfortable limit ~110)`,
          selector: describe(p),
        });
        reported++;
      }
    }

    // -----------------------------------------------------------------
    // 5. Fixed/sticky chrome eating the viewport (mobile only)
    // -----------------------------------------------------------------
    function auditFixedChrome() {
      if (!viewportName.startsWith("mobile")) return;
      const viewportHeight = window.innerHeight;

      const pinned = [];
      for (const el of WALKABLE) {
        if (isSvgNode(el) || !isRendered(el)) continue;
        const cs = getComputedStyle(el);
        if (cs.position !== "fixed" && cs.position !== "sticky") continue;
        const r = el.getBoundingClientRect();
        const atTop = r.top <= 1;
        const atBottom = r.bottom >= viewportHeight - 1;
        if (!atTop && !atBottom) continue; // e.g. a mid-page sticky sidebar — not chrome
        pinned.push(el);
      }

      // Collapse nested chrome (a fixed header containing a sticky search
      // bar) to the outer element only — the inner one's height is already
      // inside the outer rect, so counting both double-charges the total.
      const outermost = outermostOnly(pinned);
      const totalHeight = outermost.reduce((sum, el) => sum + el.getBoundingClientRect().height, 0);
      const ratio = totalHeight / viewportHeight;
      if (ratio <= 0.3) return;

      findings.push({
        severity: "minor",
        summary: "Fixed/sticky chrome consumes a large share of the mobile viewport",
        detail: `${Math.round(totalHeight)}px of pinned chrome across ${outermost.length} element(s) = ${Math.round(ratio * 100)}% of the ${viewportHeight}px viewport (threshold 30%)`,
        selector: outermost.slice(0, 4).map(describe).join(", "),
      });
    }

    // -----------------------------------------------------------------
    // 6. Images without intrinsic sizing
    // -----------------------------------------------------------------
    function auditImageSizing() {
      const images = WALKABLE.filter((el) => el.tagName === "IMG");
      let reported = 0;

      for (const img of images) {
        if (reported >= 10) break;
        if (!isRendered(img)) continue;

        const hasWidthAttr = img.hasAttribute("width");
        const hasHeightAttr = img.hasAttribute("height");
        if (hasWidthAttr && hasHeightAttr) continue;

        const cs = getComputedStyle(img);
        if (cs.aspectRatio && cs.aspectRatio !== "auto") continue;

        // Out-of-flow images (Next/Image `fill`, or plain `position:
        // absolute|fixed`) reserve no space in the flow either way — they
        // can't push sibling content around, so a missing intrinsic size
        // isn't a layout-shift source the way it is for an in-flow image.
        if (cs.position === "absolute" || cs.position === "fixed") continue;

        findings.push({
          severity: "minor",
          summary: "Image has no intrinsic sizing — a layout-shift source",
          detail: `width attr=${hasWidthAttr}, height attr=${hasHeightAttr}, aspect-ratio=${cs.aspectRatio || "auto"}`,
          selector: describe(img),
        });
        reported++;
      }
    }

    // -----------------------------------------------------------------
    for (const audit of [
      auditPageOverflow,
      auditClippedContent,
      auditTextOverlap,
      auditLineLength,
      auditFixedChrome,
      auditImageSizing,
    ]) {
      try {
        audit();
      } catch {
        // A bug in one check shouldn't silence the other five for this
        // route+viewport; run.mjs reports rig errors separately from this
        // return value anyway.
      }
    }

    return findings;
  }, viewport.name);
}
