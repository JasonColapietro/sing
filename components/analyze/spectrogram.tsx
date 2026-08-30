"use client";

import { useEffect, useRef } from "react";
import type { AnalyserFrame } from "@/lib/audio/use-analyser";
import {
  MAX_HZ,
  MIN_HZ,
  RING_HI_HZ,
  RING_LO_HZ,
  heatColor,
  intensity,
  logPos,
  posToHz,
} from "@/lib/audio/spectrum";
import { AMBER, DIM, LINE, PANEL, monoFontStack } from "@/lib/chart-colors";

const C = {
  bg: PANEL,
  line: LINE,
  dim: DIM,
  violet: AMBER,
} as const;

/**
 * 256 pre-mixed heat colours.
 *
 * `heatColor` returns a fresh array, and a spectrogram column asks for one per
 * device row: at 640 rows and 60 fps that is 38,400 allocations a second, all
 * of them garbage. Quantising intensity to 8 bits is invisible on screen and
 * turns the whole thing into an array read.
 */
const LUT = (() => {
  const t = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const [r, g, b] = heatColor(i / 255);
    t[i * 3] = r;
    t[i * 3 + 1] = g;
    t[i * 3 + 2] = b;
  }
  return t;
})();
/** Width of the frequency ruler down the left edge, in CSS pixels. */
const GUTTER = 44;
/** Ruler ticks, an octave apart so the spacing reads as even on a log axis. */
const TICKS = [100, 200, 400, 800, 1600, 3200, 6400];

/**
 * Scrolling time × frequency canvas.
 *
 * History lives in an offscreen ring buffer rather than being scrolled in
 * place. Scrolling a canvas by drawing it onto itself looks like it works and
 * does not: each copy resamples the previous copy, so a column fades to
 * background within a few pixels of travel and the display keeps only the
 * newest sliver. Writing new columns into a ring buffer and blitting it in two
 * pieces copies every pixel exactly once per frame, so a column looks the same
 * when it leaves the display as it did when it was drawn.
 */
export function Spectrogram({
  latest,
  running,
  sampleRate,
  className,
}: {
  latest: React.RefObject<AnalyserFrame>;
  running: boolean;
  sampleRate: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const buf = document.createElement("canvas");
    const bctx = buf.getContext("2d");
    if (!bctx) return;

    let raf = 0;
    let dpr = 0;
    let cssW = 0;
    let cssH = 0;
    /** Device-pixel x of the oldest column in the ring, i.e. where the next one goes. */
    let head = 0;

    /** Device-pixel width of one frame's column. Fixed in CSS px so the scroll runs at the same speed on any display. */
    const colW = () => Math.max(1, Math.round(dpr));

    const resize = (w: number, h: number, ratio: number) => {
      cssW = w;
      cssH = h;
      dpr = ratio;
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
      buf.width = Math.max(1, Math.round((w - GUTTER) * ratio));
      buf.height = Math.round(h * ratio);
      bctx.fillStyle = C.bg;
      bctx.fillRect(0, 0, buf.width, buf.height);
      head = 0;
      rowBins = null;
      mappedFor = "";
      colImg = null;
    };

    /** Ruler, tick marks and the ring-band guides. Redrawn every frame over the blit. */
    const drawChrome = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, GUTTER, cssH);
      ctx.font = `10px ${monoFontStack()}`;
      ctx.fillStyle = C.dim;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      for (const hz of TICKS) {
        const y = cssH - logPos(hz) * cssH;
        ctx.fillText(hz >= 1000 ? `${hz / 1000}k` : String(hz), GUTTER - 7, y);
        ctx.beginPath();
        ctx.moveTo(GUTTER - 4, Math.round(y) + 0.5);
        ctx.lineTo(GUTTER, Math.round(y) + 0.5);
        ctx.stroke();
      }
      ctx.strokeStyle = C.violet;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      for (const hz of [RING_LO_HZ, RING_HI_HZ]) {
        const y = Math.round(cssH - logPos(hz) * cssH) + 0.5;
        ctx.moveTo(GUTTER, y);
        ctx.lineTo(cssW, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    /**
     * Row → FFT bin range, one entry pair per device row.
     *
     * The mapping only changes when the canvas or the audio format does, but it
     * costs two `Math.pow` per row to derive. Recomputing it every frame was
     * most of why this loop ran at three frames a second.
     */
    let rowBins: Int32Array | null = null;
    let mappedFor = "";

    const buildRowMap = (binCount: number) => {
      const key = `${buf.height}:${binCount}:${sampleRate}`;
      if (mappedFor === key && rowBins) return;
      const h = buf.height;
      const fftSize = binCount * 2;
      const map = new Int32Array(h * 2);
      for (let y = 0; y < h; y++) {
        const hzTop = posToHz(1 - y / h, MIN_HZ, MAX_HZ);
        const hzBot = posToHz(1 - (y + 1) / h, MIN_HZ, MAX_HZ);
        map[y * 2] = Math.max(0, Math.floor((hzBot * fftSize) / sampleRate));
        map[y * 2 + 1] = Math.min(
          binCount - 1,
          Math.ceil((hzTop * fftSize) / sampleRate),
        );
      }
      rowBins = map;
      mappedFor = key;
    };

    let colImg: ImageData | null = null;

    /**
     * Write one column into the ring buffer as a single putImageData.
     *
     * Each row takes the loudest bin in the band it covers, so a narrow
     * harmonic can't fall between rows high on the axis where many bins share
     * a single pixel.
     */
    const writeColumn = (frame: AnalyserFrame) => {
      const bins = frame.freqDb;
      const h = buf.height;
      const w = colW();
      buildRowMap(bins.length);
      const map = rowBins;
      if (!map) return;
      if (!colImg || colImg.width !== w || colImg.height !== h) {
        colImg = bctx.createImageData(w, h);
      }
      const d = colImg.data;
      for (let y = 0; y < h; y++) {
        const b0 = map[y * 2];
        const b1 = map[y * 2 + 1];
        let peak = -Infinity;
        for (let b = b0; b <= b1; b++) if (bins[b] > peak) peak = bins[b];
        const li = Math.round(intensity(peak) * 255) * 3;
        const r = LUT[li];
        const g = LUT[li + 1];
        const bl = LUT[li + 2];
        for (let px = 0; px < w; px++) {
          const i = (y * w + px) * 4;
          d[i] = r;
          d[i + 1] = g;
          d[i + 2] = bl;
          d[i + 3] = 255;
        }
      }
      bctx.putImageData(colImg, head, 0);
      head = (head + w) % buf.width;
    };

    /** Blit the ring buffer, oldest column first, into the plot area. */
    const blit = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      const x0 = Math.round(GUTTER * dpr);
      const tail = buf.width - head;
      if (tail > 0) ctx.drawImage(buf, head, 0, tail, buf.height, x0, 0, tail, buf.height);
      if (head > 0) {
        ctx.drawImage(buf, 0, 0, head, buf.height, x0 + tail, 0, head, buf.height);
      }
    };

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const ratio = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      if (w !== cssW || h !== cssH || ratio !== dpr) resize(w, h, ratio);

      if (running) writeColumn(latest.current);
      blit();
      drawChrome();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [latest, running, sampleRate]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="Spectrogram: frequency over time, darker where the voice has more energy in that band"
    />
  );
}
