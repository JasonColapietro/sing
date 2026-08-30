/**
 * Shared browser-side helpers for the UI/UX end-to-end audit.
 *
 * Everything here exists because the naive version of the same check returns a
 * confident wrong answer in this project. Read the comment above a helper
 * before replacing it with the obvious one-liner.
 */

/**
 * Resolve an element's effective colours the only way that survives modern
 * Chrome: paint them.
 *
 * `getComputedStyle().backgroundColor` returns `lab(...)` / `oklch(...)` for
 * some values here, which no rgb() regex parses, and a semi-transparent panel
 * needs compositing against every ancestor before its contrast means anything.
 * Painting into a 1x1 canvas makes the browser do both conversions for us.
 */
export const COLOR_PROBE = `
(() => {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 1;
  const cx = cv.getContext("2d", { willReadFrequently: true });

  // Paint any CSS colour string and read back true sRGB + alpha.
  function paint(css) {
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = "#000";
    cx.fillStyle = css;              // invalid values leave the previous fill
    const resolved = cx.fillStyle;   // canvas normalises to #rrggbb or rgba()
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = resolved;
    cx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = cx.getImageData(0, 0, 1, 1).data;
    return { r, g, b, a: a / 255 };
  }

  // Composite src over dst using the standard source-over formula.
  function over(src, dst) {
    const a = src.a + dst.a * (1 - src.a);
    if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
    const mix = (s, d) => (s * src.a + d * dst.a * (1 - src.a)) / a;
    return { r: mix(src.r, dst.r), g: mix(src.g, dst.g), b: mix(src.b, dst.b), a };
  }

  // Walk up until the accumulated background is fully opaque. The page canvas
  // is the backstop: an element over nothing sits on the body/html colour.
  function effectiveBackground(el) {
    let acc = { r: 0, g: 0, b: 0, a: 0 };
    for (let node = el; node; node = node.parentElement) {
      const bg = paint(getComputedStyle(node).backgroundColor);
      if (bg.a === 0) continue;
      acc = over(acc, bg);
      if (acc.a >= 0.999) return acc;
    }
    const root = paint(getComputedStyle(document.documentElement).backgroundColor);
    const page = root.a > 0 ? root : { r: 255, g: 255, b: 255, a: 1 };
    return over(acc, page);
  }

  function luminance({ r, g, b }) {
    const f = (v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }

  function ratio(fg, bg) {
    const a = luminance(fg), b = luminance(bg);
    const [hi, lo] = a > b ? [a, b] : [b, a];
    return (hi + 0.05) / (lo + 0.05);
  }

  window.__contrast = { paint, over, effectiveBackground, luminance, ratio };
})();
`;

/**
 * Pointer hit-testing, not paint geometry.
 *
 * border-radius clips the pointer region as well as the pixels, so a
 * `rounded-full size-11` control measures a clean 44x44 by bounding box while
 * ~21% of that square resolves to the parent. A tap-target audit that trusts
 * getBoundingClientRect passes controls a real thumb misses.
 */
export const HIT_PROBE = `
(() => {
  window.__hit = function (el) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return null;
    const inset = 1; // stay inside the border, not on it
    const corners = [
      ["top-left", r.left + inset, r.top + inset],
      ["top-right", r.right - inset, r.top + inset],
      ["bottom-left", r.left + inset, r.bottom - inset],
      ["bottom-right", r.right - inset, r.bottom - inset],
    ];
    const dead = [];
    for (const [name, x, y] of corners) {
      const at = document.elementFromPoint(x, y);
      if (!at || !(at === el || el.contains(at))) dead.push(name);
    }

    /**
     * Dead corners on their own do not make a target too small.
     *
     * Every rounded-full control has them by construction -- the corners of the
     * bounding box are outside the shape, so they resolve to the parent. A 66x32
     * pill and a 44px circle both report 4/4 dead and both are comfortably
     * tappable. What actually matters is whether the WCAG 2.5.8 minimum fits
     * INSIDE the hittable region, so probe a 24x24 box at the centre: if every
     * point of that box hits the control, the target passes regardless of how
     * the corners are shaped.
     */
    const cx = (r.left + r.right) / 2;
    const cy = (r.top + r.bottom) / 2;
    // 24x24 CSS px is the 2.5.8 minimum, but probing at exactly +/-12 puts the
    // sample points on the boundary of a control that is exactly 24px tall, and
    // hit-testing there rounds to the parent. That reported the ear-training
    // difficulty pills (50x24) as having no room for a target they exactly fit.
    // Pulling the probes half a pixel inward tests the same box without asking
    // the browser to resolve its edge.
    const half = 11.5;
    const probes = [
      [cx, cy],
      [cx - half, cy - half], [cx + half, cy - half],
      [cx - half, cy + half], [cx + half, cy + half],
      [cx, cy - half], [cx, cy + half], [cx - half, cy], [cx + half, cy],
    ];
    let minimumTargetFits = r.width >= 24 && r.height >= 24;
    if (minimumTargetFits) {
      for (const [x, y] of probes) {
        const at = document.elementFromPoint(x, y);
        if (!at || !(at === el || el.contains(at))) { minimumTargetFits = false; break; }
      }
    }
    /**
     * A control scrolled out of its own scroll container is not a defect.
     *
     * The nav pill strip and the /tools keyboard are both deliberately
     * scrollable: their contents are wider than the box and you swipe to reach
     * them. Those off-strip controls still have rects inside the viewport, so a
     * viewport-only bounds check lets them through, and every probe point then
     * resolves to the clipping container instead of the control. That reported
     * 33 perfectly good piano keys and most of the nav as untappable.
     *
     * The control becomes reachable the moment its container is scrolled, so
     * this is reported separately rather than treated as a hit-test failure.
     */
    let clippedByScroll = false;
    for (let p = el.parentElement; p && !clippedByScroll; p = p.parentElement) {
      const pcs = getComputedStyle(p);
      const clips = /auto|scroll|hidden|clip/.test(pcs.overflowX + " " + pcs.overflowY);
      if (!clips) continue;
      const pr = p.getBoundingClientRect();
      if (r.right > pr.right + 1 || r.left < pr.left - 1 ||
          r.bottom > pr.bottom + 1 || r.top < pr.top - 1) clippedByScroll = true;
    }

    /**
     * What the browser will actually accept a press on.
     *
     * A native <input type=range> styled to a 6px track still draws a thumb
     * bigger than its own box, and that thumb hit-tests back to the input --
     * /tools' metronome slider reports a 6px box and responds across 16px.
     * Reporting the box would describe a control four times harder to hit than
     * it is. Only measured for elements that would otherwise be reported
     * undersized, so the scan costs nothing on the common path.
     */
    let liveWidth = r.width, liveHeight = r.height;
    if (r.width < 24 || r.height < 24) {
      const owns = (x, y) => { const e = document.elementFromPoint(x, y); return e === el || el.contains(e); };
      const grow = (probe) => {
        let lo = 0, hi = 0;
        while (lo > -30 && probe(lo - 1)) lo--;
        while (hi < 30 && probe(hi + 1)) hi++;
        return hi - lo + 1;
      };
      // Sample across the control rather than only through its centre. A
      // slider's thumb sits wherever its current value puts it, so a single
      // centre probe measures the 6px track and misses the 16px thumb beside
      // it. The tallest response anywhere along the control is the target a
      // person actually presses.
      const fracs = [0.1, 0.25, 0.5, 0.75, 0.9];
      if (r.height < 24) {
        for (const f of fracs) {
          const x = r.left + r.width * f;
          liveHeight = Math.max(liveHeight, grow((d) => owns(x, (r.top + r.bottom) / 2 + d)));
        }
      }
      if (r.width < 24) {
        for (const f of fracs) {
          const y = r.top + r.height * f;
          liveWidth = Math.max(liveWidth, grow((d) => owns((r.left + r.right) / 2 + d, y)));
        }
      }
    }

    return { width: r.width, height: r.height, liveWidth, liveHeight, dead, minimumTargetFits, clippedByScroll };
  };
})();
`;

/**
 * "Is this element actually presented to the person looking at the page?"
 *
 * Not the same question as `display:none` or `visibility:hidden`. Chrome keeps
 * the contents of a closed <details> in the layout tree so find-in-page can
 * reach them, which means every control inside a collapsed accordion still
 * reports a full-size bounding rect while being unpainted and unhittable. That
 * made the audio-device picker on /recorder look like a 350x39 control nothing
 * could click, and stacked the boxes of collapsed sections on top of each other
 * so ordinary copy read as overlapping text.
 *
 * checkVisibility covers the content-visibility cases; the explicit
 * details:not([open]) test covers the collapsed accordion directly rather than
 * relying on which Chrome version models it which way.
 */
export const RENDERED_PROBE = `
(() => {
  window.__rendered = function (el) {
    if (!el || !el.isConnected) return false;
    if (el.closest("details:not([open])")) return false;
    if (typeof el.checkVisibility === "function") {
      return el.checkVisibility({
        checkVisibilityCSS: true,
        contentVisibilityAuto: true,
        opacityProperty: false,
      });
    }
    const cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden";
  };
})();
`;

/** Install every probe on the page. Call after each navigation. */
export async function installProbes(page) {
  await page.evaluate(COLOR_PROBE);
  await page.evaluate(HIT_PROBE);
  await page.evaluate(RENDERED_PROBE);
}

/** A stable, human-readable selector for reporting a finding. */
export const DESCRIBE = `
(() => {
  window.__describe = function (el) {
    if (!el) return "(none)";
    const id = el.id ? "#" + el.id : "";
    const cls = typeof el.className === "string" && el.className
      ? "." + el.className.trim().split(/\\s+/).slice(0, 3).join(".")
      : "";
    const text = (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 40);
    return el.tagName.toLowerCase() + id + cls + (text ? ' "' + text + '"' : "");
  };
})();
`;
