"use client";

import { AMBER, DIM, LINE, LINE2, MONO } from "@/components/progress/charts";
import type { TakeAnalysis } from "@/lib/audio/analyze-take";
import { midiToLabel } from "@/lib/audio/notes";

const W = 640;
const H = 190;
const PAD_L = 34;
const PAD_R = 8;
const PAD_T = 16;
const PAD_B = 24;
const INNER_W = W - PAD_L - PAD_R;
const INNER_H = H - PAD_T - PAD_B;

function fmtClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function voicedMidis(analysis: TakeAnalysis): number[] {
  const out: number[] = [];
  for (const p of analysis.points) {
    if (p.midi !== null) out.push(p.midi);
  }
  return out;
}

function midiBounds(midis: number[]): { lo: number; hi: number } {
  let lo = Infinity;
  let hi = -Infinity;
  for (const m of midis) {
    if (m < lo) lo = m;
    if (m > hi) hi = m;
  }
  return { lo: Math.floor(lo - 1), hi: Math.ceil(hi + 1) };
}

function octaveCs(lo: number, hi: number): number[] {
  const out: number[] = [];
  for (let m = Math.ceil(lo / 12) * 12; m <= hi; m += 12) out.push(m);
  return out;
}

function tracePath(
  points: TakeAnalysis["points"],
  x: (t: number) => number,
  y: (midi: number) => number,
): string {
  let d = "";
  let pen = false;
  for (const p of points) {
    if (p.midi === null) {
      pen = false;
      continue;
    }
    d += `${pen ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.midi).toFixed(1)} `;
    pen = true;
  }
  return d.trim();
}

function Gridlines({ cs, y }: { cs: number[]; y: (midi: number) => number }) {
  return (
    <>
      <line
        x1={PAD_L}
        y1={PAD_T + INNER_H}
        x2={W - PAD_R}
        y2={PAD_T + INNER_H}
        stroke={LINE2}
        strokeWidth={1}
      />
      {cs.map((m) => (
        <g key={m}>
          <line x1={PAD_L} y1={y(m)} x2={W - PAD_R} y2={y(m)} stroke={LINE} strokeWidth={1} />
          <text
            x={PAD_L - 6}
            y={y(m)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={9}
            fontFamily={MONO}
            fill={DIM}
          >
            {midiToLabel(m)}
          </text>
        </g>
      ))}
    </>
  );
}

export function TakePitchPanel({ analysis, name }: { analysis: TakeAnalysis; name: string }) {
  const midis = voicedMidis(analysis);
  if (midis.length === 0 || analysis.medianMidi === null || analysis.inTunePct === null) {
    return (
      <p className="rounded-xl border border-dashed border-line2 px-4 py-8 text-center text-sm text-mut">
        No clear pitch found in {name}. Sing or hum a sustained line and the trace draws here.
      </p>
    );
  }

  const { lo, hi } = midiBounds(midis);
  const tEnd = Math.max(analysis.points[analysis.points.length - 1]?.t ?? 0, 0.001);
  const x = (t: number) => PAD_L + (INNER_W * t) / tEnd;
  const y = (midi: number) => PAD_T + (INNER_H * (hi - midi)) / (hi - lo);
  const median = Math.round(analysis.medianMidi);

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Pitch trace of ${name}. Median note ${midiToLabel(median)}, ${analysis.inTunePct}% of voiced moments within 25 cents of a note.`}
      >
        <Gridlines cs={octaveCs(lo, hi)} y={y} />
        <path
          d={tracePath(analysis.points, x, y)}
          fill="none"
          stroke={AMBER}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <p className="mt-2 text-xs text-mut">
        Median note {midiToLabel(median)} · {analysis.inTunePct}% within ±25 cents of a note ·{" "}
        {fmtClock(analysis.durationSec)}
        {analysis.truncated && " — first 3:00 analyzed"}
      </p>
    </div>
  );
}

export function AbPitchOverlay({
  a,
  b,
  nameA,
  nameB,
}: {
  a: TakeAnalysis;
  b: TakeAnalysis;
  nameA: string;
  nameB: string;
}) {
  const midisA = voicedMidis(a);
  const midisB = voicedMidis(b);
  if (midisA.length === 0 && midisB.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line2 px-4 py-8 text-center text-sm text-mut">
        No clear pitch found in either take yet — the overlay needs voiced singing to compare.
      </p>
    );
  }

  const { lo, hi } = midiBounds([...midisA, ...midisB]);
  const y = (midi: number) => PAD_T + (INNER_H * (hi - midi)) / (hi - lo);
  const xFor = (analysis: TakeAnalysis) => {
    const span = Math.max(analysis.durationSec, 0.001);
    return (t: number) => PAD_L + INNER_W * Math.min(1, t / span);
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em] text-mut">
        <span className="flex items-center gap-1.5">
          <span
            className="h-0.5 w-4 rounded-full"
            style={{ backgroundColor: AMBER }}
            aria-hidden="true"
          />
          A · {nameA}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-0.5 w-4 rounded-full"
            style={{ backgroundColor: LINE2 }}
            aria-hidden="true"
          />
          B · {nameB}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Overlaid pitch traces of ${nameA} and ${nameB}, each stretched to its own length so the shapes line up.`}
      >
        <Gridlines cs={octaveCs(lo, hi)} y={y} />
        <path
          d={tracePath(b.points, xFor(b), y)}
          fill="none"
          stroke={LINE2}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={tracePath(a.points, xFor(a), y)}
          fill="none"
          stroke={AMBER}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <p className="mt-2 text-xs text-mut">
        Each take is stretched to its own full length, so the shapes compare even when the
        takes run different times.
      </p>
    </div>
  );
}
