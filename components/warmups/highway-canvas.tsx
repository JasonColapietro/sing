"use client";

import { useEffect, useRef } from "react";
import { midiToLabel } from "@/lib/audio/notes";
import { monoFontStack } from "@/lib/chart-colors";
import type { Segment } from "./exercises";
import type { TracePoint } from "./note-lane-canvas";

/**
 * The note highway: target notes flow right-to-left toward a fixed playhead,
 * the way every real-time singing trainer draws them (Yousician, Simply Sing).
 * The singer's job is to be on the bar when it reaches the line.
 *
 * Same data as the static NoteLaneCanvas — segments in pattern seconds, the
 * cursor's position in the pattern, the live pitch and its trail, and per-
 * segment in-tune seconds — drawn on a canvas so it can move at frame rate.
 * The playhead sits a third of the way across so about two-thirds of the
 * width is what is coming and one-third is the trail of what was sung.
 *
 * Colours are the session shell's dark tokens, read from the element so the
 * canvas can never drift from the CSS.
 *
 * Nothing here is decorative motion: the scroll *is* the content, so there is
 * no animation for `prefers-reduced-motion` to switch off. The one thing that
 * setting would have a claim on — a grid that jumps around under the singer —
 * is fixed for everyone by the lane bounds below, which widen but never narrow
 * inside a rep.
 */

/** Width of the left label gutter, in CSS pixels. */
const GUTTER = 48;
/** Where the playhead sits across the plot area. */
const PLAYHEAD_FRAC = 0.32;
/** Never draw the pattern denser than this, however long it is. */
const MIN_PX_PER_SEC = 70;
/** Semitones of headroom above and below the pattern. */
const LANE_PAD = 2;
/** Past this many lanes the notes are too thin to aim at, so stop widening. */
const MAX_LANES = 30;

export function HighwayCanvas({
  segs,
  totalSec,
  hitSec,
  cursorSec,
  liveMidiFloat,
  trace,
  showLive,
  className,
}: {
  segs: Segment[];
  totalSec: number;
  hitSec: number[];
  /** Position in the pattern, or null before it starts (the pattern waits at 0). */
  cursorSec: number | null;
  liveMidiFloat: number | null;
  trace: TracePoint[];
  showLive: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Everything the draw loop reads goes through a ref, so React renders never
  // gate the frame rate and the loop is registered once.
  const stateRef = useRef({ segs, totalSec, hitSec, cursorSec, liveMidiFloat, trace, showLive });
  // Written during render rather than in an effect, deliberately. The player
  // publishes a new cursor every rAF tick and corrects it by the measured
  // output lag; syncing this in a passive effect would put the canvas one
  // commit behind and silently add ~16ms back onto the number that
  // compensation exists to remove. A discarded concurrent render can write a
  // frame early here, which the next frame overwrites — on a surface that
  // redraws sixty times a second that is not a class of bug.
  // eslint-disable-next-line react-hooks/refs -- see above: one frame of lag is worse than one frame of lead
  stateRef.current = { segs, totalSec, hitSec, cursorSec, liveMidiFloat, trace, showLive };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    /**
     * Element size, kept by a ResizeObserver rather than read per frame.
     * `clientWidth` inside the loop forces a layout flush sixty times a second
     * on the one screen that has to hold sixty frames a second.
     */
    const size = { w: canvas.clientWidth, h: canvas.clientHeight };

    /**
     * The tokens, read once. They are inline styles on the shell and never
     * change, but the first read can land before the stylesheet applies — so a
     * read that came back empty is retried next frame rather than cached.
     */
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
      };
    };

    /**
     * Vertical bounds, held across frames.
     *
     * They used to be recomputed from the pattern *and the live pitch* every
     * frame, which meant one wobbling note dragged the whole lane grid up and
     * down under the bars the singer was aiming at. They also came out
     * fractional, so the integer note labels stopped sitting on their own
     * lanes. Now the pattern sets integer bounds when it changes, and a voice
     * outside them widens the view once and keeps it there for the rest of the
     * rep.
     */
    const bounds = { segs: null as Segment[] | null, lo: 0, hi: 0 };
    const laneBounds = (patterns: Segment[], live: number | null) => {
      if (bounds.segs !== patterns) {
        const midis = patterns.flatMap((g) => [g.startMidi, g.endMidi]);
        bounds.segs = patterns;
        bounds.lo = Math.floor(Math.min(...midis)) - LANE_PAD;
        bounds.hi = Math.ceil(Math.max(...midis)) + LANE_PAD;
      }
      if (live !== null && bounds.hi - bounds.lo + 1 < MAX_LANES) {
        if (live < bounds.lo + 0.5) bounds.lo = Math.floor(live) - 1;
        if (live > bounds.hi - 0.5) bounds.hi = Math.ceil(live) + 1;
      }
      return bounds;
    };

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const s = stateRef.current;
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
      if (s.segs.length === 0) return;

      const live = s.showLive ? s.liveMidiFloat : null;
      const { lo, hi } = laneBounds(s.segs, live);
      const lanes = Math.max(5, hi - lo + 1);
      const laneH = h / lanes;
      const yFor = (midi: number) => (hi - midi) * laneH + laneH / 2;

      // Horizontal layout: the playhead a third across the plot, and the whole
      // pattern sized to fit the space ahead of it — but never squeezed below
      // 70px a second, past which a short note is a smear.
      const playX = GUTTER + (w - GUTTER) * PLAYHEAD_FRAC;
      const ahead = Math.max(1, w - playX - 12);
      const pxPerSec = Math.max(MIN_PX_PER_SEC, ahead / Math.max(0.5, s.totalSec));
      const cursor = s.cursorSec ?? 0;
      const xFor = (t: number) => playX + (t - cursor) * pxPerSec;

      // What the singer should be on right now: the lane to light, and the
      // pitch the live dot is judged against.
      const target = s.segs.find((g) => cursor >= g.t0 && cursor <= g.t0 + g.dur) ?? null;
      const targetMidi = target
        ? target.startMidi +
          (target.endMidi - target.startMidi) *
            (target.dur > 0 ? (cursor - target.t0) / target.dur : 0)
        : null;

      // --- the plot, clipped so nothing bleeds into the label gutter --------
      ctx.save();
      ctx.beginPath();
      ctx.rect(GUTTER, 0, w - GUTTER, h);
      ctx.clip();

      for (let i = 0; i < lanes; i++) {
        const midi = hi - i;
        const yTop = i * laneH;
        // C lanes carry a faint fill so the octave reads at a glance.
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

      // The lane the current note lives in, lit across the width: at a glance
      // it says "be here", which is the only instruction this screen gives.
      if (targetMidi !== null) {
        ctx.fillStyle = p.line;
        ctx.fillRect(GUTTER, yFor(Math.round(targetMidi)) - laneH / 2, w - GUTTER, laneH);
      }

      // Target notes. Ahead of the playhead they are outlines; the one under it
      // takes a bright outline; every one fills green from its left edge in
      // proportion to the seconds it was actually held in tune.
      const pad = Math.max(3, laneH * 0.18);
      const barH = Math.max(4, laneH - pad * 2);
      const radius = Math.min(8, barH / 2);
      s.segs.forEach((seg, i) => {
        const x0 = xFor(seg.t0);
        const x1 = xFor(seg.t0 + seg.dur);
        if (x1 < GUTTER || x0 > w) return;
        const ratio = seg.dur > 0 ? clamp01((s.hitSec[i] ?? 0) / seg.dur) : 0;
        const active = seg === target;
        if (seg.startMidi === seg.endMidi) {
          const y = yFor(seg.startMidi) - barH / 2;
          const bw = Math.max(2, x1 - x0);
          roundRect(ctx, x0, y, bw, barH, radius);
          ctx.fillStyle = active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)";
          ctx.fill();
          ctx.strokeStyle = active ? p.ink : p.line2;
          ctx.lineWidth = active ? 2 : 1.25;
          ctx.stroke();
          if (ratio > 0) {
            ctx.save();
            // Clip to the bar's own rounded shape, so a partly-held note keeps
            // its corners instead of squaring off where the fill stops.
            roundRect(ctx, x0, y, bw, barH, radius);
            ctx.clip();
            ctx.fillStyle = p.ok;
            ctx.globalAlpha = 0.9;
            ctx.fillRect(x0, y, bw * ratio, barH);
            ctx.restore();
          }
        } else {
          // Glide: a thick diagonal from start pitch to end pitch.
          const y0 = yFor(seg.startMidi);
          const y1 = yFor(seg.endMidi);
          ctx.lineCap = "round";
          ctx.lineWidth = Math.max(6, barH * 0.55);
          ctx.strokeStyle = active ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.16)";
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
          if (ratio > 0) {
            ctx.strokeStyle = p.ok;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x0 + (x1 - x0) * ratio, y0 + (y1 - y0) * ratio);
            ctx.stroke();
          }
        }
      });

      // The voice: the trail of where it has been, running back from the line.
      if (s.showLive) {
        ctx.strokeStyle = p.voice;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        let open = false;
        for (const point of s.trace) {
          if (point.midi === null) {
            open = false;
            continue;
          }
          const x = xFor(point.t);
          const y = yFor(point.midi);
          if (open) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
          open = true;
        }
        ctx.stroke();
      }

      // Playhead, with a wedge at each end so the line reads as a sight rather
      // than as a divider.
      ctx.strokeStyle = p.amber;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.round(playX) + 0.5, 0);
      ctx.lineTo(Math.round(playX) + 0.5, h);
      ctx.stroke();
      ctx.fillStyle = p.amber;
      wedge(ctx, playX, 0, 5, 1);
      wedge(ctx, playX, h, 5, -1);

      // The live pitch, on the line: a soft halo so it stays findable against a
      // bright bar, green the moment it is inside a quarter-tone.
      if (live !== null) {
        const y = yFor(live);
        const inTune = targetMidi !== null && Math.abs(live - targetMidi) <= 0.5;
        ctx.fillStyle = inTune ? p.okSoft : "rgba(255,255,255,0.10)";
        ctx.beginPath();
        ctx.arc(playX, y, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = inTune ? p.ok : p.voice;
        ctx.beginPath();
        ctx.arc(playX, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // --- the gutter -------------------------------------------------------
      ctx.fillStyle = p.bg;
      ctx.fillRect(0, 0, GUTTER, h);
      ctx.strokeStyle = p.line2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(GUTTER) - 1.5, 0);
      ctx.lineTo(Math.round(GUTTER) - 1.5, h);
      ctx.stroke();

      ctx.font = `11px ${monoFontStack()}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "right";
      // Below ~13px a lane the labels start colliding, so a crowded range keeps
      // its octave markers only. Dropping every label would leave the singer
      // with no way to tell which lane is which.
      const roomy = laneH >= 13;
      for (let i = 0; i < lanes; i++) {
        const midi = hi - i;
        const isC = midi % 12 === 0;
        if (!roomy && !isC) continue;
        ctx.fillStyle = isC ? p.mut : p.dim;
        ctx.fillText(midiToLabel(midi), GUTTER - 9, yFor(midi));
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Note highway: outlined bars are the target notes moving toward the line, the light trail is your voice"
      className={className}
    />
  );
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
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** A small triangle pointing into the plot from edge `y`; `dir` 1 = downward. */
function wedge(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, dir: number) {
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r * 1.4 * dir);
  ctx.closePath();
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}
