"use client";

import { useEffect, useRef } from "react";
import type { AnalyserFrame } from "@/lib/audio/use-analyser";
import {
  MAX_HZ,
  MIN_HZ,
  RING_HI_HZ,
  RING_LO_HZ,
  harmonics,
  hzToBin,
  intensity,
  logPos,
  ringRatio,
} from "@/lib/audio/spectrum";
import { freqToNote } from "@/lib/audio/notes";

const C = {
  bg: "#fffaf2",
  line: "#ddd4c4",
  line2: "#c9bda0",
  ink: "#20201d",
  dim: "#6b6455",
  amber: "#c59642",
  amberFill: "rgba(197, 150, 66, 0.14)",
  ringFill: "rgba(197, 150, 66, 0.10)",
} as const;

const MONO = '"IBM Plex Mono", ui-monospace, monospace';
const PAD_B = 18;

/**
 * Live spectrum with the harmonic series marked.
 *
 * Harmonic positions are drawn from the detected fundamental rather than found
 * by peak-picking the spectrum: `detectPitch` already resolves F0 in the time
 * domain, and reusing it means the marks stay put on a note whose upper
 * harmonics are weak enough that a peak-picker would wander.
 */
export function Tone({
  latest,
  running,
  sampleRate,
  ringRef,
  className,
}: {
  latest: React.RefObject<AnalyserFrame>;
  running: boolean;
  sampleRate: number;
  /** Written each frame with the ring ratio, for the readout beside the canvas. */
  ringRef?: React.RefObject<HTMLSpanElement | null>;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const noteRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let lastLabel = "";
    let lastRing = "";

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, w, h);

      const plotH = h - PAD_B;
      const frame = latest.current;

      // Ring band shading, drawn under everything so it reads as background.
      const xRingLo = logPos(RING_LO_HZ) * w;
      const xRingHi = logPos(RING_HI_HZ) * w;
      ctx.fillStyle = C.ringFill;
      ctx.fillRect(xRingLo, 0, xRingHi - xRingLo, plotH);

      // Octave gridlines and their labels.
      ctx.font = `10px ${MONO}`;
      ctx.fillStyle = C.dim;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      for (const hz of [100, 200, 400, 800, 1600, 3200, 6400]) {
        const x = Math.round(logPos(hz) * w) + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, plotH);
        ctx.stroke();
        ctx.fillText(hz >= 1000 ? `${hz / 1000}k` : String(hz), x, plotH + 4);
      }

      if (running) {
        // The spectrum itself, as a filled curve on the log axis.
        ctx.beginPath();
        ctx.moveTo(0, plotH);
        for (let x = 0; x <= w; x++) {
          const hz = MIN_HZ * Math.pow(MAX_HZ / MIN_HZ, x / w);
          const bin = Math.round(hzToBin(hz, sampleRate, frame.freqDb.length * 2));
          const db = bin < frame.freqDb.length ? frame.freqDb[bin] : -Infinity;
          ctx.lineTo(x, plotH - intensity(db) * plotH);
        }
        ctx.lineTo(w, plotH);
        ctx.closePath();
        ctx.fillStyle = C.amberFill;
        ctx.fill();
        ctx.strokeStyle = C.amber;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Harmonic marks from the detected fundamental.
        const f0 = frame.f0;
        if (f0 !== null) {
          const hs = harmonics(f0, MAX_HZ);
          ctx.strokeStyle = C.ink;
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          for (const hz of hs) {
            if (hz < MIN_HZ) continue;
            const x = Math.round(logPos(hz) * w) + 0.5;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, plotH);
          }
          ctx.stroke();
          ctx.setLineDash([]);

          const note = freqToNote(f0);
          const label = note
            ? `${note.label} · ${Math.round(f0)} Hz · ${hs.length} harmonics`
            : `${Math.round(f0)} Hz · ${hs.length} harmonics`;
          if (noteRef.current && label !== lastLabel) {
            noteRef.current.textContent = label;
            lastLabel = label;
          }
        } else if (noteRef.current && lastLabel !== "—") {
          noteRef.current.textContent = "—";
          lastLabel = "—";
        }

        if (ringRef?.current) {
          const pct = `${(ringRatio(frame.freqDb, sampleRate, frame.freqDb.length * 2) * 100).toFixed(1)}%`;
          if (pct !== lastRing) {
            ringRef.current.textContent = pct;
            lastRing = pct;
          }
        }
      }

      // Axis baseline last, so the curve never paints over it.
      ctx.strokeStyle = C.line2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, Math.round(plotH) + 0.5);
      ctx.lineTo(w, Math.round(plotH) + 0.5);
      ctx.stroke();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [latest, running, ringRef, sampleRate]);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        role="img"
        aria-label="Live spectrum with the harmonic series of the sung note marked"
      />
      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
        Note <span ref={noteRef}>—</span>
      </p>
    </div>
  );
}
