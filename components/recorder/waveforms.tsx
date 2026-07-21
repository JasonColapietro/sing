"use client";

import { useEffect, useRef } from "react";
import type { Peaks } from "./wav";

const PANEL = "#fffaf2";
const LINE = "#ddd4c4";
const AMBER = "#c59642";
const AMBER_DIM = "rgba(245, 176, 62, 0.32)";

/** Size a canvas to its CSS box at devicePixelRatio. Returns a 2d ctx in CSS px. */
function prepare(canvas: HTMLCanvasElement): {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
} | null {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return null;
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

/**
 * Live time-domain trace from an AnalyserNode — the "tape rolling" view.
 * Runs a rAF loop while an analyser is connected.
 */
export function LiveWaveform({
  analyser,
  height = 120,
}: {
  analyser: AnalyserNode | null;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    const data = analyser ? new Float32Array(analyser.fftSize) : null;

    const drawFrame = () => {
      const p = prepare(canvas);
      if (!p) {
        if (analyser) raf = requestAnimationFrame(drawFrame);
        return;
      }
      const { ctx, w, h } = p;
      ctx.fillStyle = PANEL;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      if (analyser && data) {
        analyser.getFloatTimeDomainData(data);
        ctx.strokeStyle = AMBER;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const n = data.length;
        for (let i = 0; i < n; i++) {
          const x = (i / (n - 1)) * w;
          const y = h / 2 + data[i] * (h / 2 - 4);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        raf = requestAnimationFrame(drawFrame);
      }
    };

    drawFrame();
    return () => cancelAnimationFrame(raf);
  }, [analyser]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-xl border border-line"
      style={{ height }}
      aria-hidden="true"
    />
  );
}

/**
 * Static min/max peak waveform for a decoded take, with playback progress
 * (played portion bright amber) and optional click-to-seek.
 */
export function PeaksWaveform({
  peaks,
  progress,
  height = 72,
  onSeek,
}: {
  peaks: Peaks | null;
  /** 0..1 playback position. */
  progress: number;
  height?: number;
  onSeek?: (fraction: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const p = prepare(canvas);
      if (!p) return;
      const { ctx, w, h } = p;
      ctx.fillStyle = PANEL;
      ctx.fillRect(0, 0, w, h);

      if (!peaks || peaks.min.length === 0) {
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        return;
      }

      const buckets = peaks.min.length;
      const mid = h / 2;
      const amp = h / 2 - 3;
      const playedX = Math.max(0, Math.min(1, progress)) * w;
      for (let x = 0; x < w; x++) {
        const b = Math.min(buckets - 1, Math.floor((x / w) * buckets));
        const hi = Math.max(0.012, peaks.max[b]);
        const lo = Math.min(-0.012, peaks.min[b]);
        ctx.fillStyle = x <= playedX && progress > 0 ? AMBER : AMBER_DIM;
        ctx.fillRect(x, mid - hi * amp, 1, (hi - lo) * amp);
      }

      if (progress > 0) {
        ctx.fillStyle = AMBER;
        ctx.fillRect(playedX, 2, 1.5, h - 4);
      }
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [peaks, progress, height]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full rounded-xl border border-line ${onSeek ? "cursor-pointer" : ""}`}
      style={{ height }}
      aria-hidden="true"
      onPointerDown={
        onSeek
          ? (e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              if (rect.width === 0) return;
              onSeek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
            }
          : undefined
      }
    />
  );
}
