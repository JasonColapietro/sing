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
    return { width: r.width, height: r.height, dead };
  };
})();
`;

/** Install every probe on the page. Call after each navigation. */
export async function installProbes(page) {
  await page.evaluate(COLOR_PROBE);
  await page.evaluate(HIT_PROBE);
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
