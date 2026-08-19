"use client";

import Link from "next/link";
import { midiToLabel } from "@/lib/audio/notes";
import { playTone } from "@/lib/audio/synth";
import { useProgress } from "@/lib/progress";
import { rangeOverlap, spanOctaves, type Singer } from "@/lib/singers";
import { Button, Card, LinkButton, SectionLabel } from "@/components/ui";
import { ProInlineNudge } from "@/components/pro/gate";

/** Low → glide → high, same gesture as the range-test result card. */
export function PlayRangeButton({ s }: { s: Singer }) {
  const play = () => {
    playTone(s.lowMidi, { dur: 0.6 });
    playTone(s.lowMidi, { dur: 1.4, at: 0.7, glideToMidi: s.highMidi });
    playTone(s.highMidi, { dur: 0.6, at: 2.2 });
  };
  return (
    <Button variant="outline" size="sm" onClick={play}>
      Hear this range
    </Button>
  );
}

/**
 * Compares the visitor's measured range (from the free range test, stored
 * locally) against this singer's cited range.
 */
export function CompareWithMe({ s }: { s: Singer }) {
  const { range } = useProgress();
  const youLow = range.lowMidi;
  const youHigh = range.highMidi;

  if (youLow === undefined || youHigh === undefined) {
    return (
      <Card className="border-amber/40">
        <SectionLabel>You vs {s.name}</SectionLabel>
        <p className="mt-3 max-w-xl text-sm text-mut">
          Take the free 2-minute range test — your mic finds your lowest and
          highest notes, then this page shows exactly how your voice lines up
          with {s.name}&rsquo;s.
        </p>
        <div className="mt-4">
          <LinkButton href="/range" size="sm">
            Find my range
          </LinkButton>
        </div>
      </Card>
    );
  }

  const singerSpan = s.highMidi - s.lowMidi;
  const overlap = rangeOverlap(youLow, youHigh, s.lowMidi, s.highMidi);
  const coverage = Math.round((overlap / singerSpan) * 100);

  // Shared mini axis padded an octave beyond both ranges.
  const axisLow = Math.floor((Math.min(youLow, s.lowMidi) - 2) / 12) * 12;
  const axisHigh = Math.ceil((Math.max(youHigh, s.highMidi) + 2) / 12) * 12;
  const pct = (m: number) => ((m - axisLow) / (axisHigh - axisLow)) * 100;

  const bars: Array<{ who: string; low: number; high: number; cls: string; text: string }> = [
    {
      who: s.name,
      low: s.lowMidi,
      high: s.highMidi,
      cls: "bg-cool/60",
      text: "text-mut",
    },
    {
      who: "You",
      low: youLow,
      high: youHigh,
      cls: "bg-amber",
      text: "text-amber-ink font-semibold",
    },
  ];

  return (
    <Card>
      <SectionLabel>You vs {s.name}</SectionLabel>
      <h2 className="mt-3 text-xl">
        Your range covers{" "}
        <span className="text-amber-ink">{coverage}%</span> of {s.name}
        &rsquo;s
      </h2>
      <p className="mt-2 text-sm text-mut">
        {overlap} of {singerSpan} semitones overlap. Your {midiToLabel(youLow)}
        –{midiToLabel(youHigh)} ({spanOctaves(youHigh - youLow)} oct) against
        the cited {midiToLabel(s.lowMidi)}–{midiToLabel(s.highMidi)} (
        {spanOctaves(singerSpan)} oct).
      </p>
      <div className="mt-5 space-y-2">
        {bars.map((b) => (
          // On a phone the fixed side labels left the track ~100px wide, so
          // the bars stopped being comparable. Stack the label above the track
          // below sm and keep the side-by-side layout from sm up.
          <div
            key={b.who}
            className="sm:flex sm:items-center sm:gap-3"
          >
            <div className="flex items-baseline justify-between gap-2 sm:block sm:w-28 sm:shrink-0">
              <span className={`truncate font-mono text-xs sm:block sm:text-right ${b.text}`}>
                {b.who}
              </span>
              <span className="tabular shrink-0 font-mono text-[11px] text-dim sm:hidden">
                {midiToLabel(b.low)}–{midiToLabel(b.high)}
              </span>
            </div>
            <div className="relative mt-1 h-5 rounded bg-panel2 sm:mt-0 sm:flex-1">
              <div
                className={`absolute inset-y-0 rounded ${b.cls}`}
                style={{
                  left: `${pct(b.low)}%`,
                  width: `${Math.max(1, pct(b.high) - pct(b.low))}%`,
                }}
              />
            </div>
            <span className="tabular hidden w-20 shrink-0 font-mono text-[11px] text-dim sm:block">
              {midiToLabel(b.low)}–{midiToLabel(b.high)}
            </span>
          </div>
        ))}
      </div>
      {/* Where to go with the comparison — into practice, not a dead end. */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <LinkButton href="/warmups" variant="outline" size="sm">
          Train toward the gap
        </LinkButton>
        <LinkButton href="/songs" variant="ghost" size="sm">
          Practice songs in your range
        </LinkButton>
        <Link
          href="/progress"
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-mut underline decoration-line underline-offset-2 hover:text-ink"
        >
          Your range history
        </Link>
        <Link
          href="/range"
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-mut underline decoration-line underline-offset-2 hover:text-ink"
        >
          Retake the range test
        </Link>
      </div>
      {/* The ~420 singer pages are where search traffic lands; this is the one
          Pro line on them, and only after the visitor has a measured range to
          compare — value first, pitch second. Self-hides for Pro. */}
      <div className="mt-4">
        <ProInlineNudge>The coach builds a daily plan around this gap</ProInlineNudge>
      </div>
    </Card>
  );
}
