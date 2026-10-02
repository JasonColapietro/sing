"use client";

import { useEffect, useRef, useState } from "react";
import { usePitch, type PitchFrame } from "@/lib/audio/use-pitch";
import { freqToMidiFloat, midiToLabel, midiToName } from "@/lib/audio/notes";
import { Button, MicGate } from "@/components/ui";
import { AudioSetup } from "@/components/audio/audio-setup";

/** Ignore near-silent frames, the same floor the range test uses. */
const MIN_VOLUME = 0.008;
/** C1..C7: anything outside is a detector artefact, not a voice. */
const MIN_PLAUSIBLE = 24;
const MAX_PLAUSIBLE = 96;
/** Pixels the trail moves left per second. */
const SCROLL_PX_PER_S = 110;
/** Semitones visible top to bottom. */
const VISIBLE_SEMITONES = 15;
/** Where "now" sits, as a fraction of the width. History lives to its left. */
const PLAYHEAD = 0.78;
/** In tune within this many cents. */
const IN_TUNE_CENTS = 15;
const CLOSE_CENTS = 35;

const COLORS = {
  laneA: "rgba(255,255,255,0.025)",
  laneB: "rgba(255,255,255,0.055)",
  laneC: "rgba(139,92,246,0.16)",
  label: "#a39dc9",
  labelC: "#f6f4ff",
  playhead: "rgba(255,255,255,0.35)",
  trailFrom: "#8b5cf6",
  trailTo: "#ff4fa3",
  inTune: "#2fd49a",
  close: "#ffc24a",
  off: "#ff4fa3",
};

type Point = { t: number; midi: number | null };

function voiced(f: PitchFrame): boolean {
  return (
    f.freq !== null &&
    f.note !== null &&
    f.volume >= MIN_VOLUME &&
    f.note.midi >= MIN_PLAUSIBLE &&
    f.note.midi <= MAX_PLAUSIBLE
  );
}

function tuneColor(cents: number): string {
  const a = Math.abs(cents);
  if (a <= IN_TUNE_CENTS) return COLORS.inTune;
  if (a <= CLOSE_CENTS) return COLORS.close;
  return COLORS.off;
}

function tuneWord(cents: number): string {
  const a = Math.abs(cents);
  if (a <= IN_TUNE_CENTS) return "In tune";
  return cents < 0 ? "A little flat" : "A little sharp";
}

/**
 * The default voice test: open the mic and see your pitch, nothing else. A
 * scrolling note lane shows where your voice is and where it has been, the
 * readout names the note and how far off center you are, and the lowest and
 * highest notes you have held this session are kept as a running measurement.
 */
export function PitchMeter() {
  const { frame, latest, listening, error, start, stop } = usePitch();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);
  /** The midi value the view is centered on, eased toward the singer. */
  const centerRef = useRef(57); // A3 until we hear something
  const [low, setLow] = useState<number | null>(null);
  const [high, setHigh] = useState<number | null>(null);
  const lowRef = useRef<number | null>(null);
  const highRef = useRef<number | null>(null);
  const heldRef = useRef<{ midi: number | null; ms: number; lastT: number }>({
    midi: null,
    ms: 0,
    lastT: 0,
  });

  // The lane: its own rAF loop reading the latest frame by ref.
  useEffect(() => {
    if (!listening) return;
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
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const now = performance.now();
      const f = latest.current;

      // Count a note toward low/high only once it has been held for a moment,
      // so a crack or a consonant never sets the record.
      const held = heldRef.current;
      const dt = held.lastT ? Math.min(120, now - held.lastT) : 0;
      held.lastT = now;
      if (f && voiced(f) && f.note) {
        const m = f.note.midi;
        if (held.midi === m) held.ms += dt;
        else {
          held.midi = m;
          held.ms = 0;
        }
        if (held.ms >= 300) {
          if (lowRef.current === null || m < lowRef.current) {
            lowRef.current = m;
            setLow(m);
          }
          if (highRef.current === null || m > highRef.current) {
            highRef.current = m;
            setHigh(m);
          }
        }
      } else {
        held.midi = null;
        held.ms = 0;
      }
      const midiF = f && voiced(f) && f.freq ? freqToMidiFloat(f.freq) : null;
      const pts = pointsRef.current;
      pts.push({ t: now, midi: midiF });
      const horizonMs = ((w * PLAYHEAD) / SCROLL_PX_PER_S) * 1000 + 200;
      while (pts.length && now - pts[0].t > horizonMs) pts.shift();

      // Follow the voice: ease the window toward the recent median.
      const recent = pts.filter((p) => p.midi !== null && now - p.t < 1500).map((p) => p.midi as number);
      if (recent.length) {
        const sorted = [...recent].sort((a, b) => a - b);
        const target = sorted[Math.floor(sorted.length / 2)];
        centerRef.current += (target - centerRef.current) * 0.04;
      }
      const top = centerRef.current + VISIBLE_SEMITONES / 2;
      const laneH = h / VISIBLE_SEMITONES;
      const yFor = (m: number) => (top - m) * laneH;

      // Lanes, one per semitone, C lanes tinted and lettered.
      ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
      ctx.textBaseline = "middle";
      const first = Math.floor(top - VISIBLE_SEMITONES) - 1;
      for (let m = first; m <= Math.ceil(top) + 1; m++) {
        const yC = yFor(m);
        const isC = midiToName(m) === "C";
        const sharp = midiToName(m).includes("#");
        ctx.fillStyle = isC ? COLORS.laneC : sharp ? COLORS.laneA : COLORS.laneB;
        ctx.fillRect(0, yC - laneH / 2 + 1, w, laneH - 2);
        if (!sharp && laneH >= 14) {
          ctx.fillStyle = isC ? COLORS.labelC : COLORS.label;
          ctx.fillText(midiToLabel(m), 10, yC);
        }
      }

      // Playhead.
      const px = w * PLAYHEAD;
      ctx.strokeStyle = COLORS.playhead;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Trail.
      const grad = ctx.createLinearGradient(0, 0, px, 0);
      grad.addColorStop(0, "rgba(139,92,246,0)");
      grad.addColorStop(0.35, COLORS.trailFrom);
      grad.addColorStop(1, COLORS.trailTo);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = COLORS.trailTo;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      let pen = false;
      for (const p of pts) {
        if (p.midi === null) {
          pen = false;
          continue;
        }
        const x = px - ((now - p.t) / 1000) * SCROLL_PX_PER_S;
        const y = yFor(p.midi);
        if (!pen) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        pen = true;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // The head: where your voice is right now, colored by tuning.
      if (midiF !== null && f?.note) {
        const y = yFor(midiF);
        const color = tuneColor(f.note.cents);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(px, y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(px, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [listening, latest]);

  const begin = async () => {
    pointsRef.current = [];
    heldRef.current = { midi: null, ms: 0, lastT: 0 };
    await start();
  };

  const reset = () => {
    setLow(null);
    setHigh(null);
    lowRef.current = null;
    highRef.current = null;
    pointsRef.current = [];
  };

  if (!listening) {
    return (
      <div>
        <MicGate
          title="See your pitch"
          description="Sing or hum any note. You will see exactly which note you are on, how close to center you are, and a live line of your voice."
          enableLabel="Start singing"
          onEnable={begin}
          error={error}
        />
        <AudioSetup className="mx-auto mt-6 max-w-md" />
      </div>
    );
  }

  const on = voiced(frame) && frame.note ? frame.note : null;
  const cents = on ? Math.round(on.cents) : 0;
  const color = on ? tuneColor(on.cents) : undefined;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-line bg-panel">
        <div className="flex items-end justify-between gap-4 px-5 pt-5 sm:px-6">
          <div>
            <div className="text-label font-extrabold uppercase tracking-[0.12em] text-dim">
              Your note
            </div>
            <div
              className="tabular mt-1 text-6xl font-extrabold leading-none sm:text-7xl"
              style={{ color: color ?? "var(--color-dim)" }}
              aria-live="off"
            >
              {on ? on.label : "—"}
            </div>
          </div>
          <div className="text-right">
            <div className="tabular text-2xl font-extrabold text-ink">
              {on && frame.freq ? `${frame.freq.toFixed(1)} Hz` : "—"}
            </div>
            <div className="mt-1 text-sm font-bold" style={{ color: color ?? "var(--color-dim)" }}>
              {on ? `${cents > 0 ? "+" : ""}${cents}¢ · ${tuneWord(on.cents)}` : "Sing a note"}
            </div>
          </div>
        </div>

        {/* Tuner bar: center is perfect, each side is 50 cents. */}
        <div className="px-5 pt-4 sm:px-6" aria-hidden="true">
          <div className="relative h-2 rounded-full bg-panel2">
            <div className="absolute inset-y-0 left-[35%] right-[35%] rounded-full bg-ok/25" />
            <div className="absolute inset-y-[-4px] left-1/2 w-px bg-ink/50" />
            {on && (
              <div
                className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-bg transition-[left] duration-75"
                style={{ left: `${50 + Math.max(-50, Math.min(50, cents))}%`, background: color }}
              />
            )}
          </div>
          <div className="mt-1 flex justify-between text-[11px] font-bold text-dim">
            <span>Flat</span>
            <span>Sharp</span>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          className="mt-3 block h-[clamp(260px,46vh,440px)] w-full"
          role="img"
          aria-label={on ? `Live pitch: ${on.label}` : "Live pitch lane"}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-line bg-panel p-4">
          <div className="text-label font-extrabold uppercase tracking-[0.12em] text-dim">Lowest held</div>
          <div className="tabular mt-1 text-3xl font-extrabold">{low !== null ? midiToLabel(low) : "—"}</div>
        </div>
        <div className="rounded-3xl border border-line bg-panel p-4">
          <div className="text-label font-extrabold uppercase tracking-[0.12em] text-dim">Highest held</div>
          <div className="tabular mt-1 text-3xl font-extrabold">{high !== null ? midiToLabel(high) : "—"}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={reset}>
          Reset
        </Button>
        <Button variant="ghost" onClick={stop}>
          Stop mic
        </Button>
      </div>
    </div>
  );
}
