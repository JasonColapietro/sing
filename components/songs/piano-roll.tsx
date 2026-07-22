"use client";

import { useEffect, useRef } from "react";
import type { PitchFrame } from "@/lib/audio/use-pitch";
import { freqToMidiFloat, midiToLabel } from "@/lib/audio/notes";
import type { SongNote } from "./data";
import { noteIndexAtBeat } from "./lib";

const BEATS_WINDOW = 6;
const PLAYHEAD_FRAC = 0.3;

const C = {
  bg: "#f7f0e7",
  lane: "rgba(32, 32, 29, 0.025)",
  line: "#ddd4c4",
  line2: "#c9bda0",
  ink: "#20201d",
  mut: "#5c564d",
  dim: "#8a8272",
  amber: "#c59642",
  ok: "#3f8f6e",
} as const;

const MONO = '"IBM Plex Mono", ui-monospace, monospace';

interface TraceSample {
  pos: number;
  midi: number | null;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/**
 * Scrolling piano roll: horizontal semitone lanes with mono labels on the
 * left, target notes as ivory-outlined blocks with the lyric syllable
 * inside, playhead fixed near 30% width, timeline scrolls right-to-left in
 * beat time. Live amber pitch trace overlays; note blocks fill ok-green as
 * the singer holds them in tune.
 */
export function PianoRoll({
  notes,
  totalBeats,
  positionBeatsRef,
  hitRatioRef,
  latest,
  showLive,
  className,
}: {
  notes: SongNote[];
  totalBeats: number;
  /** Beats elapsed within the current phrase loop, or null while idle/count-in. */
  positionBeatsRef: React.RefObject<number | null>;
  /** 0..1 hit fraction per note, same order as `notes`. */
  hitRatioRef: React.RefObject<number[]>;
  latest: React.RefObject<PitchFrame>;
  showLive: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const samplesRef = useRef<TraceSample[]>([]);
  const prevPosRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const midis = notes.map((n) => n.midi);
    const lo = Math.min(...midis) - 2;
    const hi = Math.max(...midis) + 2;
    const lanes = Math.max(1, Math.round(hi - lo) + 1);

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

      const gutter = 42;
      const laneH = h / lanes;
      const pxPerBeat = (w - gutter) / BEATS_WINDOW;
      const playheadX = gutter + (w - gutter) * PLAYHEAD_FRAC;

      const pos = positionBeatsRef.current;
      if (pos !== null && prevPosRef.current !== null && pos < prevPosRef.current - 0.5) {
        samplesRef.current = []; // loop wrapped back to the start
      }
      prevPosRef.current = pos;

      const yFor = (midi: number) => (hi - midi) * laneH;
      const xFor = (beat: number) =>
        pos === null ? gutter + beat * pxPerBeat : playheadX + (beat - pos) * pxPerBeat;

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, w, h);

      // Semitone lanes + mono labels.
      ctx.font = `10px ${MONO}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      for (let i = 0; i < lanes; i++) {
        const midi = hi - i;
        const yTop = i * laneH;
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
        if (laneH >= 11) {
          ctx.fillStyle = C.dim;
          ctx.fillText(midiToLabel(midi), 6, yTop + laneH / 2);
        }
      }
      ctx.strokeStyle = C.line;
      ctx.beginPath();
      ctx.moveTo(gutter - 4 + 0.5, 0);
      ctx.lineTo(gutter - 4 + 0.5, h);
      ctx.stroke();

      // Target note blocks — draw the current loop and a preview of the next.
      const hitRatios = hitRatioRef.current;
      ctx.textAlign = "center";
      notes.forEach((n, i) => {
        for (const off of [0, totalBeats]) {
          const b0 = n.startBeat + off;
          const b1 = b0 + n.durBeats;
          const x0 = xFor(b0);
          const x1 = xFor(b1);
          if (x1 < gutter - 20 || x0 > w + 20) continue;
          const y0 = yFor(n.midi) + 3;
          const bh = Math.max(4, laneH - 6);
          const bw = Math.max(2, x1 - x0 - 3);

          ctx.globalAlpha = 0.8;
          ctx.strokeStyle = C.ink;
          ctx.lineWidth = 1.4;
          roundRect(ctx, x0 + 1.5, y0, bw, bh, 5);
          ctx.stroke();

          const ratio = Math.min(1, Math.max(0, hitRatios?.[i] ?? 0));
          if (ratio > 0) {
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = C.ok;
            roundRect(ctx, x0 + 1.5, y0, bw * ratio, bh, 5);
            ctx.fill();
          }
          ctx.globalAlpha = 1;

          if (bw > 14) {
            ctx.fillStyle = C.mut;
            ctx.font = `9.5px ${MONO}`;
            ctx.fillText(n.lyric, x0 + bw / 2 + 1.5, y0 + bh / 2, Math.max(4, bw - 4));
          }
        }
      });

      // Live amber pitch trace + leading dot.
      if (showLive && pos !== null) {
        const f = latest.current;
        const midiFloat = f.freq !== null ? freqToMidiFloat(f.freq) : null;
        const samples = samplesRef.current;
        samples.push({ pos, midi: midiFloat });
        while (samples.length > 400) samples.shift();

        ctx.strokeStyle = C.amber;
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        let open = false;
        for (const s of samples) {
          if (s.midi === null) {
            open = false;
            continue;
          }
          const x = xFor(s.pos);
          if (x < gutter - 10) {
            open = false;
            continue;
          }
          const y = yFor(s.midi) + laneH / 2;
          if (!open) {
            ctx.moveTo(x, y);
            open = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        if (midiFloat !== null) {
          const idx = noteIndexAtBeat(notes, pos);
          const target = idx >= 0 ? notes[idx].midi : null;
          const inTune = target !== null && Math.abs((midiFloat - target) * 100) <= 50;
          ctx.fillStyle = inTune ? C.ok : C.amber;
          ctx.beginPath();
          ctx.arc(playheadX, yFor(midiFloat) + laneH / 2, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Playhead.
      ctx.strokeStyle = C.line2;
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.round(playheadX) + 0.5, 0);
      ctx.lineTo(Math.round(playheadX) + 0.5, h);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [notes, totalBeats, positionBeatsRef, hitRatioRef, latest, showLive]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Scrolling piano roll of the melody with your live pitch trace"
      className={className}
    />
  );
}
