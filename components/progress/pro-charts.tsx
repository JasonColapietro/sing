"use client";

import { midiToLabel } from "@/lib/audio/notes";
import {
  accuracyOf,
  noteReports,
  overallAccuracy,
  rangeGrowth,
  rangeSeries,
  scoredSeconds,
  type NoteTallies,
  type RangeEntry,
} from "@/lib/analytics";
import { AMBER, DIM, LINE, LINE2, MONO, MUT, PANEL } from "./charts";

/** Weak enough to be worth practising on purpose. */
const WEAK_BELOW = 70;
const REC = "#9d3f33";

const emptyClass =
  "rounded-xl border border-dashed border-line2 px-4 py-8 text-center text-sm text-mut";

/**
 * Accuracy for every note the singer has actually been scored on, low to
 * high. Notes below the weak threshold are drawn in red so the thing to
 * practise is the thing that stands out.
 */
export function NoteAccuracyChart({ tallies }: { tallies: NoteTallies }) {
  const reports = noteReports(tallies);

  if (reports.length === 0) {
    return (
      <p className={emptyClass}>
        No per-note data yet. Sing a warmup or a song with your mic on and every
        note you&apos;re scored against shows up here.
      </p>
    );
  }

  const W = 640;
  const H = 190;
  const padL = 34;
  const padR = 8;
  const padT = 16;
  const padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const slot = plotW / reports.length;
  const barW = Math.max(3, Math.min(26, slot * 0.62));

  const overall = overallAccuracy(tallies);
  const weakest = reports.reduce((a, b) => (b.accuracy < a.accuracy ? b : a));
  // With many notes, labelling every one turns the axis into mush.
  const labelEvery = reports.length > 22 ? 3 : reports.length > 14 ? 2 : 1;

  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label={`Accuracy for each note you've been scored on, from ${midiToLabel(
          reports[0].midi,
        )} to ${midiToLabel(reports[reports.length - 1].midi)}. Overall ${
          overall ?? 0
        }% in tune. Weakest note ${midiToLabel(weakest.midi)} at ${
          weakest.accuracy
        }%.`}
      >
        {[0, 50, 100].map((tick) => {
          const y = padT + plotH - (tick / 100) * plotH;
          return (
            <g key={tick}>
              <line
                x1={padL}
                y1={y}
                x2={W - padR}
                y2={y}
                stroke={tick === 0 ? LINE2 : LINE}
                strokeWidth={1}
              />
              <text
                x={padL - 6}
                y={y + 3}
                textAnchor="end"
                fontSize={9}
                fontFamily={MONO}
                fill={DIM}
              >
                {tick}
              </text>
            </g>
          );
        })}

        {reports.map((report, i) => {
          const x = padL + i * slot + (slot - barW) / 2;
          const h = Math.max(1, (report.accuracy / 100) * plotH);
          const y = padT + plotH - h;
          const weak = report.accuracy < WEAK_BELOW;
          return (
            <g key={report.midi}>
              <title>
                {midiToLabel(report.midi)}: {report.accuracy}% in tune over{" "}
                {report.sec.toFixed(0)}s
                {report.cents !== null ? `, ${Math.round(report.cents)} cents off on average` : ""}
              </title>
              <rect
                x={padL + i * slot}
                y={padT}
                width={slot}
                height={plotH}
                fill="transparent"
              />
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={Math.min(4, barW / 2)}
                fill={weak ? REC : AMBER}
                fillOpacity={weak ? 0.75 : 1}
              />
              {i % labelEvery === 0 && (
                <text
                  x={x + barW / 2}
                  y={H - 8}
                  textAnchor="middle"
                  fontSize={9}
                  fontFamily={MONO}
                  fill={weak ? REC : DIM}
                >
                  {midiToLabel(report.midi)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-xs text-mut">
        {overall}% in tune across {Math.round(scoredSeconds(tallies))}s of scored
        singing. Weakest note{" "}
        <span className="text-rec">{midiToLabel(weakest.midi)}</span> at{" "}
        {weakest.accuracy}%
        {weakest.cents !== null
          ? `, averaging ${Math.round(weakest.cents)} cents off`
          : ""}
        .
      </p>
    </>
  );
}

/**
 * One bar per range test, spanning lowest to highest note, so a widening
 * voice is visible as the bars growing outward over time.
 */
export function RangeHistoryChart({ history }: { history: RangeEntry[] }) {
  const series = rangeSeries(history);

  if (series.length === 0) {
    return (
      <p className={emptyClass}>
        No range tests on record yet. Take the range test and this charts your
        low and high notes every time you retake it.
      </p>
    );
  }

  const W = 640;
  const H = 190;
  const padL = 38;
  const padR = 10;
  const padT = 16;
  const padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // Pad the note axis by a tone either side so bars never touch the frame.
  const lowest = Math.min(...series.map((p) => p.lowMidi)) - 2;
  const highest = Math.max(...series.map((p) => p.highMidi)) + 2;
  const span = Math.max(1, highest - lowest);
  const yOf = (midi: number) => padT + plotH - ((midi - lowest) / span) * plotH;

  const slot = plotW / series.length;
  const barW = Math.max(6, Math.min(34, slot * 0.5));
  const growth = rangeGrowth(history);
  const latest = series[series.length - 1];

  // Gridlines on octave Cs, which read as landmarks on a keyboard.
  const cLines: number[] = [];
  for (let midi = Math.ceil(lowest / 12) * 12; midi <= highest; midi += 12) {
    cLines.push(midi);
  }

  const dateLabel = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label={`Your vocal range across ${series.length} test${
          series.length === 1 ? "" : "s"
        }. Latest spans ${midiToLabel(latest.lowMidi)} to ${midiToLabel(
          latest.highMidi,
        )}, ${latest.semitones} semitones${
          growth !== null
            ? `, ${growth >= 0 ? "up" : "down"} ${Math.abs(growth)} since your first test`
            : ""
        }.`}
      >
        {cLines.map((midi) => (
          <g key={midi}>
            <line
              x1={padL}
              y1={yOf(midi)}
              x2={W - padR}
              y2={yOf(midi)}
              stroke={LINE}
              strokeWidth={1}
            />
            <text
              x={padL - 6}
              y={yOf(midi) + 3}
              textAnchor="end"
              fontSize={9}
              fontFamily={MONO}
              fill={DIM}
            >
              {midiToLabel(midi)}
            </text>
          </g>
        ))}

        {series.map((point, i) => {
          const x = padL + i * slot + (slot - barW) / 2;
          const yTop = yOf(point.highMidi);
          const yBottom = yOf(point.lowMidi);
          const newest = i === series.length - 1;
          return (
            <g key={`${point.testedAt}-${i}`}>
              <title>
                {dateLabel(point.testedAt)}: {midiToLabel(point.lowMidi)}–
                {midiToLabel(point.highMidi)} ({point.semitones} semitones
                {point.voiceTypeLabel ? `, ${point.voiceTypeLabel}` : ""})
              </title>
              <rect
                x={padL + i * slot}
                y={padT}
                width={slot}
                height={plotH}
                fill="transparent"
              />
              <rect
                x={x}
                y={yTop}
                width={barW}
                height={Math.max(2, yBottom - yTop)}
                rx={Math.min(6, barW / 2)}
                fill={AMBER}
                fillOpacity={newest ? 1 : 0.3 + (0.5 * i) / series.length}
              />
              {newest && (
                <>
                  <circle cx={x + barW / 2} cy={yTop} r={3} fill={AMBER} stroke={PANEL} strokeWidth={1.5} />
                  <circle cx={x + barW / 2} cy={yBottom} r={3} fill={AMBER} stroke={PANEL} strokeWidth={1.5} />
                </>
              )}
              {(series.length <= 8 || newest) && (
                <text
                  x={x + barW / 2}
                  y={H - 8}
                  textAnchor="middle"
                  fontSize={9}
                  fontFamily={MONO}
                  fill={newest ? MUT : DIM}
                >
                  {dateLabel(point.testedAt)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-xs text-mut">
        {midiToLabel(latest.lowMidi)}–{midiToLabel(latest.highMidi)} ·{" "}
        {latest.semitones} semitones
        {growth === null
          ? " · retake the test to start charting growth"
          : growth === 0
            ? " · unchanged since your first test"
            : ` · ${growth > 0 ? "+" : ""}${growth} semitones since your first test`}
        .
      </p>
    </>
  );
}

/** Small helper the coach uses to name a note's accuracy inline. */
export function noteAccuracyLabel(
  tallies: NoteTallies,
  midi: number,
): string | null {
  const tally = tallies[String(midi)];
  if (!tally) return null;
  return `${midiToLabel(midi)} at ${accuracyOf(tally)}%`;
}
