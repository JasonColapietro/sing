/**
 * Guards the rig, not the site.
 *
 * Every other module in here depends on probes installed by the runner. When
 * an injection silently no-ops, those modules do not fail — they return clean,
 * and a broken harness reads exactly like a passing site. This one asserts the
 * probes are actually present and returning real numbers, and says nothing at
 * all when they are, so it costs no noise in a normal run.
 */
export const id = "selftest";
export const title = "Runner self-test";

export async function run({ page }) {
  const probes = await page.evaluate(() => {
    const has = {
      contrast: typeof window.__contrast?.ratio === "function",
      hit: typeof window.__hit === "function",
      describe: typeof window.__describe === "function",
    };
    if (!has.contrast) return { ...has, sample: null };
    // Body text on the page background is a value we know is sane; a rig that
    // returns 1.00 or NaN here is compositing nothing.
    const sample = window.__contrast.ratio(
      window.__contrast.paint(getComputedStyle(document.body).color),
      window.__contrast.effectiveBackground(document.body)
    );
    return { ...has, sample };
  });

  const missing = ["contrast", "hit", "describe"].filter((k) => !probes[k]);
  if (missing.length) {
    return [{
      severity: "blocker",
      summary: `harness probes missing: ${missing.join(", ")} — every other finding this run is unreliable`,
    }];
  }
  if (!Number.isFinite(probes.sample) || probes.sample <= 1.01) {
    return [{
      severity: "blocker",
      summary: "contrast probe returned a degenerate ratio — colour compositing is not working",
      detail: `body text vs page background measured ${probes.sample}`,
    }];
  }
  return [];
}
