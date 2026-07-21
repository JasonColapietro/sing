"use client";

import type { VocalRange } from "@/lib/progress";
import { midiToLabel } from "@/lib/audio/notes";
import { Card, EmptyState, LinkButton, Pill } from "@/components/ui";

const STRIP_LOW = 36; // C2
const STRIP_HIGH = 84; // C6
const BLACK_PCS = new Set([1, 3, 6, 8, 10]);

function isBlack(midi: number): boolean {
  return BLACK_PCS.has(((midi % 12) + 12) % 12);
}

/** Compact keyboard strip, C2..C6, with an amber band over the sung range. */
function MiniKeyboard({ low, high }: { low: number; high: number }) {
  const CW = 9;
  const KH = 38;
  const LABEL_H = 18;
  const n = STRIP_HIGH - STRIP_LOW + 1;
  const W = n * CW;
  const clamp = (m: number) => Math.max(STRIP_LOW, Math.min(STRIP_HIGH, m));
  const lo = clamp(low);
  const hi = clamp(high);
  const x = (m: number) => (m - STRIP_LOW) * CW;

  return (
    <svg
      viewBox={`0 0 ${W} ${KH + LABEL_H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Keyboard strip from C2 to C6 with your range highlighted from ${midiToLabel(low)} to ${midiToLabel(high)}.`}
    >
      {Array.from({ length: n }, (_, i) => {
        const m = STRIP_LOW + i;
        const black = isBlack(m);
        return (
          <rect
            key={m}
            x={x(m) + 0.5}
            y={0.5}
            width={CW - 1}
            height={(black ? KH * 0.62 : KH) - 1}
            rx={1.5}
            fill={black ? "#17140f" : "#e9e2d3"}
            stroke="#2b2519"
            strokeWidth={1}
          />
        );
      })}
      <rect
        x={x(lo)}
        y={0}
        width={x(hi) - x(lo) + CW}
        height={KH}
        rx={2}
        fill="rgba(245, 176, 62, 0.24)"
        stroke="rgba(245, 176, 62, 0.6)"
        strokeWidth={1}
      />
      {[lo, hi].map((m) => (
        <text
          key={m}
          x={x(m) + CW / 2}
          y={KH + 13}
          textAnchor="middle"
          fontSize={10}
          fontWeight={600}
          fontFamily="var(--font-mono)"
          fill="#f5b03e"
        >
          {midiToLabel(m)}
        </text>
      ))}
      {Array.from({ length: n }, (_, i) => STRIP_LOW + i)
        .filter((m) => m % 12 === 0 && m !== lo && m !== hi)
        .map((m) => (
          <text
            key={`oct-${m}`}
            x={x(m) + CW / 2}
            y={KH + 13}
            textAnchor="middle"
            fontSize={8}
            fontFamily="var(--font-mono)"
            fill="#6f685a"
          >
            {midiToLabel(m)}
          </text>
        ))}
    </svg>
  );
}

export function VoiceCard({ range }: { range: VocalRange }) {
  if (range.lowMidi === undefined || range.highMidi === undefined) {
    return (
      <Card pad={false}>
        <EmptyState
          title="No range on file"
          hint="Take the 2-minute range test to find your lowest and highest comfortable notes and your voice type."
          action={<LinkButton href="/range">Take the range test</LinkButton>}
        />
      </Card>
    );
  }

  const semitones = range.highMidi - range.lowMidi;
  const octaves = (semitones / 12).toFixed(1);
  const tested = range.testedAt
    ? new Date(range.testedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg">Your voice</h2>
        {range.voiceTypeLabel && <Pill tone="amber">{range.voiceTypeLabel}</Pill>}
      </div>
      <div className="tabular mt-3 font-mono text-2xl text-ink">
        {midiToLabel(range.lowMidi)}
        <span className="mx-2 text-dim">–</span>
        {midiToLabel(range.highMidi)}
      </div>
      <p className="mt-1 text-xs text-mut">
        {semitones} semitones — about {octaves} octaves.
        {tested && ` Tested ${tested}.`}
      </p>
      <div className="mt-4">
        <MiniKeyboard low={range.lowMidi} high={range.highMidi} />
      </div>
      <div className="mt-4">
        <LinkButton href="/range" variant="outline" size="sm">
          Retake the test
        </LinkButton>
      </div>
    </Card>
  );
}
