/**
 * The take-analysis exhibit on /, /pro and the recorder's locked panel. It
 * was a 640-wide drawing with 9-unit labels, 1.5-unit pale lines and two
 * near-parallel curves: at 375px nothing in it could be read and the two
 * takes showed no difference.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TAKE_SAMPLE_LABEL, TAKE_SAMPLE_LINES, TakeSample } from "./take-sample";

const html = renderToStaticMarkup(<TakeSample />);

describe("the sample takes drawing", () => {
  it("keeps its visible sample caption", () => {
    expect(html).toContain(`>${TAKE_SAMPLE_LABEL}</figcaption>`);
    expect(html).toMatch(/aria-label="Two sample takes/);
  });

  it("is drawn at about one unit per pixel on a phone, with text and lines to match", () => {
    const [, w, h] = /viewBox="0 0 (\d+) (\d+)"/.exec(html)!.map(Number);
    expect(w).toBeLessThanOrEqual(330);
    expect(h).toBeGreaterThanOrEqual(110);
    const sizes = [...html.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
    expect(sizes.length).toBeGreaterThanOrEqual(5);
    for (const size of sizes) expect(size).toBeGreaterThanOrEqual(10);
    const takes = [...html.matchAll(/<path[^>]*stroke-width="([\d.]+)"/g)].map((m) => Number(m[1]));
    expect(takes).toEqual([2.5, 2.5]);
  });

  it("paints from theme tokens: one take in violet ink, one in gold ink, nothing in hex", () => {
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(html).not.toMatch(/opacity/);
    expect(TAKE_SAMPLE_LINES.map((t) => t.className).sort()).toEqual(["stroke-amber-ink", "stroke-violet-ink"]);
    for (const take of TAKE_SAMPLE_LINES) {
      // The line and its swatch in the key.
      expect(html.split(`class="${take.className}"`).length - 1, take.name).toBe(2);
      expect(html).toContain(`>${take.name}</text>`);
    }
  });

  it("parts the two takes on one phrase and keeps them together on the rest", () => {
    const [a, b] = TAKE_SAMPLE_LINES;
    expect(a.points).toHaveLength(b.points.length);
    const gaps = a.points.map(([, y], i) => Math.abs(y - b.points[i][1]));
    // Five times the stroke on the phrase that differs, about a stroke elsewhere.
    expect(gaps.filter((gap) => gap >= 12)).toHaveLength(2);
    expect(gaps.filter((gap) => gap <= 3)).toHaveLength(gaps.length - 2);
  });

  it("draws a guide line and a name for each target note", () => {
    expect(html.match(/stroke-dasharray/g)).toHaveLength(3);
    for (const note of ["G4", "E4", "C4"]) expect(html).toContain(`>${note}</text>`);
  });
});
