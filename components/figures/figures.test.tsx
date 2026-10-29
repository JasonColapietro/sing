/**
 * The sample-data figures the mic gates wear. Each must render on the server
 * (no hooks, no "use client"), name itself as an example, and wear the chip.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  MelodyContour,
  PianoRollFigure,
  RangeFigure,
  SpectrogramFigure,
  TraceFigure,
  WaveformFigure,
  contourPoints,
} from "./index";
import { SONGS } from "@/components/songs/data";

const FIGURES = [
  ["RangeFigure", <RangeFigure key="r" />],
  ["TraceFigure", <TraceFigure key="t" />],
  ["PianoRollFigure", <PianoRollFigure key="p" />],
  ["WaveformFigure", <WaveformFigure key="w" />],
  ["SpectrogramFigure", <SpectrogramFigure key="s" />],
] as const;

describe("figures", () => {
  it.each(FIGURES)("%s is an honest, labelled example", (_name, el) => {
    const html = renderToStaticMarkup(el);
    expect(html).toMatch(/<svg[^>]*viewBox="0 0 \d+ \d+"/);
    expect(html).toMatch(/role="img"/);
    expect(html).toMatch(/aria-label="Example[^"]*Sample data, not your/);
    expect(html).toContain(">EXAMPLE</text>");
  });

  it("renders without a client boundary", () => {
    const dir = fileURLToPath(new URL(".", import.meta.url));
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".tsx") && !f.includes(".test."))) {
      expect(readFileSync(`${dir}/${file}`, "utf8"), file).not.toMatch(/^"use client"/m);
    }
  });

  it("draws the trace once on entry and nothing else moves", () => {
    for (const [, el] of FIGURES) {
      const html = renderToStaticMarkup(el);
      expect(html.match(/pro-visual-spark/g)?.length ?? 0).toBeLessThanOrEqual(1);
      expect(html).not.toMatch(/animate|<animate/i);
    }
  });

  it("labels the range example at G2 and E4 on a C2–C6 strip", () => {
    const html = renderToStaticMarkup(<RangeFigure />);
    for (const label of ["C2", "C6", "G2", "E4", "YOUR RANGE"]) expect(html).toContain(`>${label}</text>`);
  });

  it("marks the studio example's target and cents", () => {
    const html = renderToStaticMarkup(<TraceFigure />);
    expect(html).toContain(">C4</text>");
    expect(html).toContain(">+12¢</text>");
  });

  it("marks 440 Hz on the spectrogram example", () => {
    expect(renderToStaticMarkup(<SpectrogramFigure />)).toContain(">440 Hz</text>");
  });

  it("names the waveform example's take and position", () => {
    expect(renderToStaticMarkup(<WaveformFigure />)).toContain("Take 2 · 0:14");
  });
});

describe("melody contour", () => {
  it("draws every song's opening phrase inside a 60×16 box", () => {
    for (const song of SONGS) {
      const points = contourPoints(song.notes);
      expect(points, song.id).not.toBe("");
      for (const pair of points.split(" ")) {
        const [x, y] = pair.split(",").map(Number);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(60);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(16);
      }
    }
  });

  it("stays on the first lyric line and is decorative", () => {
    const twinkle = SONGS.find((s) => s.id === "twinkle")!;
    const firstLine = twinkle.notes.filter((n) => (n.line ?? 0) === 0);
    // Two points per note.
    expect(contourPoints(twinkle.notes).split(" ")).toHaveLength(firstLine.length * 2);
    const html = renderToStaticMarkup(<MelodyContour notes={twinkle.notes} />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("role=");
  });

  it("renders nothing for an empty melody", () => {
    expect(renderToStaticMarkup(<MelodyContour notes={[]} />)).toBe("");
  });
});
