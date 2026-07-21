"use client";

import { useEffect, useRef } from "react";
import type { PitchFrame } from "@/lib/audio/use-pitch";
import { centsOff, freqToMidiFloat, midiToLabel } from "@/lib/audio/notes";

const WINDOW_MS = 8000;
/** Semitone lanes visible at once. */
const SEMIS = 14;

const C = {
  bg: "#f7f0e7",
  lane: "rgba(242, 237, 227, 0.02)",
  line: "#ddd4c4",
  ink: "#20201d",
  mut: "#5c564d",
  dim: "#8a8272",
  amber: "#c59642",
  ok: "#3f8f6e",
  okFill: "rgba(127, 217, 154, 0.12)",
  inkFill: "rgba(242, 237, 227, 0.05)",
} as const;

const MONO = '"IBM Plex Mono", ui-monospace, monospace';

interface Sample {
  t: number;
  m: number | null;
}

/**
 * Scrolling note-lane canvas: last ~8 s of pitch as an amber trace over
 * horizontal semitone lanes, auto-centered on the sung register.
 */
export function PitchTrace({
  latest,
  targetMidi,
  className,
}: {
  latest: React.RefObject<PitchFrame>;
  targetMidi: number | null;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const samplesRef = useRef<Sample[]>([]);
  const centerRef = useRef(57); // A3 until we hear something
  const targetRef = useRef<number | null>(targetMidi);

  useEffect(() => {
    targetRef.current = targetMidi;
  }, [targetMidi]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      if (
        canvas.width !== Math.round(w * dpr) ||
        canvas.height !== Math.round(h * dpr)
      ) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const now = performance.now();
      const f = latest.current;
      const m = f.freq !== null ? freqToMidiFloat(f.freq) : null;
      const samples = samplesRef.current;
      samples.push({ t: now, m });
      while (samples.length > 0 && samples[0].t < now - WINDOW_MS - 250) {
        samples.shift();
      }

      // Auto-center on the sung register (or drift toward the target).
      if (m !== null) {
        centerRef.current += (m - centerRef.current) * 0.04;
      } else if (targetRef.current !== null) {
        centerRef.current += (targetRef.current - centerRef.current) * 0.008;
      }
      const center = centerRef.current;

      const gutter = 46;
      const laneH = h / SEMIS;
      const yFor = (midi: number) => h / 2 + (center - midi) * laneH;
      const xFor = (t: number) => gutter + (1 - (now - t) / WINDOW_MS) * (w - gutter);

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, w, h);

      // Semitone lanes + mono labels at left.
      const loMidi = Math.floor(center - SEMIS / 2) - 1;
      const hiMidi = Math.ceil(center + SEMIS / 2) + 1;
      ctx.font = `10px ${MONO}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      for (let midi = loMidi; midi <= hiMidi; midi++) {
        const yTop = yFor(midi + 0.5);
        if (midi % 2 === 0) {
          ctx.fillStyle = C.lane;
          ctx.fillRect(gutter, yTop, w - gutter, laneH);
        }
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gutter, Math.round(yTop) + 0.5);
        ctx.lineTo(w, Math.round(yTop) + 0.5);
        ctx.stroke();

        const yMid = yFor(midi);
        if (yMid > 8 && yMid < h - 6 && laneH >= 11) {
          const label = midiToLabel(midi);
          ctx.fillStyle = label.charAt(1) !== "#" && label.charAt(0) === "C" ? C.mut : C.dim;
          ctx.fillText(label, 8, yMid);
        }
      }
      // Gutter divider.
      ctx.strokeStyle = C.line;
      ctx.beginPath();
      ctx.moveTo(gutter - 6 + 0.5, 0);
      ctx.lineTo(gutter - 6 + 0.5, h);
      ctx.stroke();

      // Target lane block (ivory outline, ok-green when within ±50 cents).
      const target = targetRef.current;
      const inTune =
        target !== null &&
        f.freq !== null &&
        Math.abs(centsOff(f.freq, target)) <= 50;
      if (target !== null) {
        const yT = yFor(target + 0.5);
        ctx.fillStyle = inTune ? C.okFill : C.inkFill;
        ctx.fillRect(gutter, yT, w - gutter, laneH);
        ctx.strokeStyle = inTune ? C.ok : C.ink;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(gutter + 1, yT + 1, w - gutter - 2, laneH - 2);
      }

      // Amber pitch trace (segments break on silence or big time gaps).
      ctx.strokeStyle = C.amber;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      let open = false;
      let prevT = 0;
      for (const s of samples) {
        if (s.m === null) {
          open = false;
          continue;
        }
        const x = xFor(s.t);
        const y = yFor(s.m);
        if (!open || s.t - prevT > 200) {
          ctx.moveTo(x, y);
          open = true;
        } else {
          ctx.lineTo(x, y);
        }
        prevT = s.t;
      }
      ctx.stroke();

      // Live dot at the leading edge.
      if (m !== null) {
        ctx.fillStyle = inTune ? C.ok : C.amber;
        ctx.beginPath();
        ctx.arc(xFor(now), yFor(m), 4, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [latest]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Scrolling pitch trace of the last eight seconds"
      className={className}
    />
  );
}
