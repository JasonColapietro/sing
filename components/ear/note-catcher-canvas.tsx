"use client";

import { useEffect, useRef } from "react";
import { midiToLabel } from "@/lib/audio/notes";
import { monoFontStack } from "@/lib/chart-colors";
import type { CatcherLevel, CatcherState, CatcherTarget } from "./note-catcher";

/**
 * Note catcher's playfield. Semitone lanes run across; the catch line stands a
 * little over a quarter of the way in; target bars slide in from the right and
 * across it, each as long as the window it stays catchable for. The singer's
 * voice is the marker on the line, and the ring around it fills as a catch is
 * held.
 *
 * Built the way the warmup highway is: one rAF loop registered once, reading
 * everything through a ref the game writes every frame, drawn in the session
 * shell's dark tokens read from the element. The scroll is the game, so it
 * runs for everyone; `prefers-reduced-motion` switches off what is decoration
 * on top of it — the marker's easing (it jumps to the voice instead) and the
 * burst when a note is caught.
 */

/** Width of the left label gutter, in CSS pixels. */
const GUTTER = 44;
/** Where the catch line stands across the plot. */
const LINE_FRAC = 0.28;
/** How many target spacings fit ahead of the line. */
const SPACINGS_AHEAD = 1.35;
/** Semitones of headroom above and below the targets. */
const LANE_PAD = 2;
/** How long a caught-note burst lasts. */
const BURST_MS = 450;
/** How much of the voice's recent path trails behind the marker. */
const TRAIL_MS = 1600;

/** Everything the loop reads, written by the game every frame. */
export interface CatcherView {
  targets: CatcherTarget[];
  level: CatcherLevel;
  state: CatcherState;
  /** Where to draw the marker (already octave-folded), or null when silent. */
  markerMidi: number | null;
}

interface Palette {
  bg: string;
  line: string;
  line2: string;
  ink: string;
  mut: string;
  dim: string;
  ok: string;
  okSoft: string;
  voice: string;
  amber: string;
  rec: string;
}

export function NoteCatcherCanvas({
  viewRef,
  className,
}: {
  viewRef: React.RefObject<CatcherView>;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Element size from a ResizeObserver, not read per frame — see the highway.
    const size = { w: canvas.clientWidth, h: canvas.clientHeight };

    let palette: Palette | null = null;
    const readPalette = (): Palette | null => {
      const cs = getComputedStyle(canvas);
      const get = (name: string) => cs.getPropertyValue(name).trim();
      const bg = get("--s-bg");
      if (bg === "") return null;
      return {
        bg,
        line: get("--s-line") || "rgba(255,255,255,0.08)",
        line2: get("--s-line2") || "rgba(255,255,255,0.14)",
        ink: get("--s-ink") || "#f4f1ea",
        mut: get("--s-mut") || "rgba(255,255,255,0.62)",
        dim: get("--s-dim") || "rgba(255,255,255,0.42)",
        ok: get("--s-ok") || "#7fd6a3",
        okSoft: get("--s-ok-soft") || "rgba(127,214,163,0.22)",
        voice: get("--s-voice") || "#9fd3d8",
        amber: get("--s-amber") || "#e0bb74",
        rec: get("--s-rec") || "#e0685a",
      };
    };

    // The lanes are fixed per run from the targets, so the grid never moves
    // under the singer. A new target list (a replay) resets them.
    const bounds = { targets: null as CatcherTarget[] | null, lo: 0, hi: 0 };
    // The marker's drawn position, eased toward the voice.
    let shownY: number | null = null;
    // Where the voice has been, in game time, for the trail.
    const trail: { t: number; midi: number | null }[] = [];
    // When each caught target was caught, for its burst.
    const caughtAt = new Map<number, number>();
    let lastResolved = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const view = viewRef.current;
      const { w, h } = size;
      if (w === 0 || h === 0) return;
      palette ??= readPalette();
      if (palette === null) return;
      const p = palette;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = p.bg;
      ctx.fillRect(0, 0, w, h);

      const { targets, level, state, markerMidi } = view;
      if (targets.length === 0) return;

      if (bounds.targets !== targets) {
        const midis = targets.map((t) => t.midi);
        bounds.targets = targets;
        bounds.lo = Math.min(...midis) - LANE_PAD;
        bounds.hi = Math.max(...midis) + LANE_PAD;
        trail.length = 0;
        caughtAt.clear();
        lastResolved = 0;
        shownY = null;
      }
      const { lo, hi } = bounds;
      const lanes = hi - lo + 1;
      const laneH = h / lanes;
      const yFor = (midi: number) => (hi - midi) * laneH + laneH / 2;

      const lineX = GUTTER + (w - GUTTER) * LINE_FRAC;
      const spacing = level.windowMs + level.gapMs;
      const pxPerMs = Math.max(0.02, (w - lineX) / (spacing * SPACINGS_AHEAD));
      const now = state.elapsed;
      const xFor = (t: number) => lineX + (t - now) * pxPerMs;

      // Note the moment each newly resolved target was caught.
      for (let i = lastResolved; i < state.results.length; i++) {
        if (state.results[i]) caughtAt.set(i, now);
      }
      lastResolved = state.results.length;

      const current = targets[state.index] ?? null;
      const currentOnLine =
        current !== null && now >= current.arriveMs && now < current.arriveMs + level.windowMs;

      // --- plot, clipped off the gutter -------------------------------------
      ctx.save();
      ctx.beginPath();
      ctx.rect(GUTTER, 0, w - GUTTER, h);
      ctx.clip();

      for (let i = 0; i < lanes; i++) {
        const midi = hi - i;
        const yTop = i * laneH;
        if (midi % 12 === 0) {
          ctx.fillStyle = p.line;
          ctx.fillRect(GUTTER, yTop, w - GUTTER, laneH);
        }
        ctx.strokeStyle = p.line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(GUTTER, Math.round(yTop) + 0.5);
        ctx.lineTo(w, Math.round(yTop) + 0.5);
        ctx.stroke();
      }

      // The lane to be in, lit across the plot while its target is on the line.
      if (current !== null && currentOnLine) {
        ctx.fillStyle = p.line;
        ctx.fillRect(GUTTER, yFor(current.midi) - laneH / 2, w - GUTTER, laneH);
      }

      // Targets.
      const pad = Math.max(2, laneH * 0.14);
      const barH = Math.max(6, laneH - pad * 2);
      const radius = Math.min(8, barH / 2);
      ctx.font = `10px ${monoFontStack()}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      targets.forEach((t, i) => {
        const x0 = xFor(t.arriveMs);
        const x1 = xFor(t.arriveMs + level.windowMs);
        if (x1 < GUTTER || x0 > w) return;
        const y = yFor(t.midi) - barH / 2;
        const bw = Math.max(4, x1 - x0);
        const resolved = i < state.results.length;
        const caught = resolved && state.results[i];
        roundRect(ctx, x0, y, bw, barH, radius);
        if (caught) {
          ctx.fillStyle = p.ok;
          ctx.globalAlpha = 0.85;
          ctx.fill();
          ctx.globalAlpha = 1;
        } else if (resolved) {
          ctx.strokeStyle = p.rec;
          ctx.globalAlpha = 0.6;
          ctx.lineWidth = 1.25;
          ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        } else {
          const active = i === state.index;
          ctx.fillStyle = active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)";
          ctx.fill();
          ctx.strokeStyle = active ? p.ink : p.line2;
          ctx.lineWidth = active ? 2 : 1.25;
          ctx.stroke();
        }
        const label = t.lyric ?? midiToLabel(t.midi);
        if (bw > 28 && barH >= 11) {
          ctx.fillStyle = caught ? p.bg : resolved ? p.dim : p.mut;
          ctx.fillText(label, x0 + bw / 2, y + barH / 2, bw - 8);
        }
      });

      // Trail: where the voice has been, running back from the line.
      trail.push({ t: now, midi: markerMidi });
      while (trail.length > 0 && trail[0].t < now - TRAIL_MS) trail.shift();
      ctx.strokeStyle = p.voice;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      let open = false;
      for (const pt of trail) {
        if (pt.midi === null) {
          open = false;
          continue;
        }
        const x = xFor(pt.t);
        const y = yFor(clamp(pt.midi, lo - 0.4, hi + 0.4));
        if (open) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
        open = true;
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Catch line, with a wedge at each end so it reads as a sight.
      ctx.strokeStyle = p.amber;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.round(lineX) + 0.5, 0);
      ctx.lineTo(Math.round(lineX) + 0.5, h);
      ctx.stroke();
      ctx.fillStyle = p.amber;
      wedge(ctx, lineX, 0, 5, 1);
      wedge(ctx, lineX, h, 5, -1);

      // Bursts for fresh catches.
      if (!reduceMotion) {
        for (const [i, at] of caughtAt) {
          const age = now - at;
          if (age > BURST_MS) {
            caughtAt.delete(i);
            continue;
          }
          const k = age / BURST_MS;
          ctx.strokeStyle = p.ok;
          ctx.globalAlpha = 1 - k;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(lineX, yFor(targets[i].midi), 10 + k * 26, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      // The marker: the voice on the line. Off the top or bottom of the lanes
      // it pins to the edge as a chevron pointing the way it went.
      if (markerMidi !== null) {
        const off = markerMidi > hi + 0.4 ? 1 : markerMidi < lo - 0.4 ? -1 : 0;
        const targetY = yFor(clamp(markerMidi, lo - 0.4, hi + 0.4));
        shownY =
          shownY === null || reduceMotion ? targetY : shownY + (targetY - shownY) * 0.45;
        const inTune =
          current !== null &&
          currentOnLine &&
          Math.abs(markerMidi - current.midi) * 100 <= level.tolerance;
        if (off !== 0) {
          ctx.fillStyle = p.voice;
          // Base inset from the edge, apex at it: an arrow out of the plot.
          wedge(ctx, lineX, off > 0 ? 14 : h - 14, 9, off > 0 ? -1 : 1);
        } else {
          ctx.fillStyle = inTune ? p.okSoft : "rgba(255,255,255,0.10)";
          ctx.beginPath();
          ctx.arc(lineX, shownY, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = inTune ? p.ok : p.voice;
          ctx.beginPath();
          ctx.arc(lineX, shownY, 6.5, 0, Math.PI * 2);
          ctx.fill();
          // The hold, as a ring that closes when the note is caught.
          if (state.heldMs > 0 && currentOnLine) {
            const frac = clamp(state.heldMs / level.dwellMs, 0, 1);
            ctx.strokeStyle = p.ok;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(lineX, shownY, 14, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
            ctx.stroke();
          }
        }
      } else {
        shownY = null;
      }

      ctx.restore();

      // --- gutter -------------------------------------------------------------
      ctx.fillStyle = p.bg;
      ctx.fillRect(0, 0, GUTTER, h);
      ctx.strokeStyle = p.line2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(GUTTER) - 1.5, 0);
      ctx.lineTo(Math.round(GUTTER) - 1.5, h);
      ctx.stroke();
      ctx.font = `11px ${monoFontStack()}`;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      const roomy = laneH >= 13;
      for (let i = 0; i < lanes; i++) {
        const midi = hi - i;
        const isC = midi % 12 === 0;
        const isTarget = current !== null && midi === current.midi;
        if (!roomy && !isC && !isTarget) continue;
        ctx.fillStyle = isTarget ? p.ink : isC ? p.mut : p.dim;
        ctx.fillText(midiToLabel(midi), GUTTER - 8, yFor(midi));
      }
    };

    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (!box) return;
      size.w = box.width;
      size.h = box.height;
    });
    ro.observe(canvas);

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [viewRef]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Note catcher playfield: target notes slide in from the right toward the catch line, and your voice moves the marker on the line up and down"
      className={className}
    />
  );
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

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

/** A small triangle pointing into the plot from edge `y`; `dir` 1 = downward. */
function wedge(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, dir: number) {
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r * 1.4 * dir);
  ctx.closePath();
  ctx.fill();
}
