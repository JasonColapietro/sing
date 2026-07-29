"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { midiToLabel } from "@/lib/audio/notes";
import { useProgress } from "@/lib/progress";
import {
  SINGERS,
  VOICE_KINDS,
  computeRecords,
  spanOctaves,
  type Singer,
  type VoiceKind,
} from "@/lib/singers";
import { Button, EmptyState } from "@/components/ui";

/* ---------------------------------------------------------------- axis --- */

const DATA_LOW = Math.min(...SINGERS.map((s) => s.lowMidi));
const DATA_HIGH = Math.max(...SINGERS.map((s) => s.highMidi));
/** Shared axis for every row, snapped to octave boundaries. */
const AXIS_LOW = Math.floor(DATA_LOW / 12) * 12;
const AXIS_HIGH = Math.ceil(DATA_HIGH / 12) * 12;
const AXIS_SPAN = AXIS_HIGH - AXIS_LOW;

function pct(midi: number): number {
  return ((midi - AXIS_LOW) / AXIS_SPAN) * 100;
}

/** Octave gridlines as a repeating background so rows need no extra DOM. */
const OCTAVE_TILE = (12 / AXIS_SPAN) * 100;
const GRID_BG = `repeating-linear-gradient(90deg, rgba(201,189,160,0.5) 0, rgba(201,189,160,0.5) 1px, transparent 1px, transparent ${OCTAVE_TILE}%)`;

/** Amber wash where the user's own range sits, layered over the gridlines. */
function youBandBg(uLow: number, uHigh: number): string {
  const l = pct(uLow);
  const r = pct(uHigh);
  return `linear-gradient(90deg, transparent ${l}%, rgba(197,150,66,0.14) ${l}%, rgba(197,150,66,0.14) ${r}%, transparent ${r}%), ${GRID_BG}`;
}

/** Row grid shared by the ruler and every singer row, so columns align. */
const ROW_GRID =
  "sm:grid sm:grid-cols-[12rem_minmax(0,1fr)_6.5rem] sm:items-center sm:gap-x-4";

const BLACK_PCS = new Set([1, 3, 6, 8, 10]);

function Ruler({ youLow, youHigh }: { youLow?: number; youHigh?: number }) {
  const octaveCs: number[] = [];
  for (let m = AXIS_LOW; m <= AXIS_HIGH; m += 12) octaveCs.push(m);
  return (
    <div aria-hidden="true">
      <svg
        viewBox={`0 0 ${AXIS_SPAN} 10`}
        preserveAspectRatio="none"
        className="block h-6 w-full"
      >
        {Array.from({ length: AXIS_SPAN }, (_, i) => {
          const black = BLACK_PCS.has((AXIS_LOW + i) % 12);
          return (
            <rect
              key={i}
              x={i + 0.06}
              y={0}
              width={0.88}
              height={black ? 6 : 10}
              fill={black ? "#fffaf2" : "#e9e2d3"}
            />
          );
        })}
        {youLow !== undefined && youHigh !== undefined && (
          <rect
            x={youLow - AXIS_LOW}
            y={0}
            width={youHigh - youLow + 1}
            height={10}
            fill="rgba(197,150,66,0.35)"
          />
        )}
      </svg>
      <div className="relative h-4">
        {octaveCs.map((m) => (
          <span
            key={m}
            className="absolute -translate-x-1/2 font-mono text-[10px] text-dim"
            style={{ left: `${pct(m)}%` }}
          >
            {midiToLabel(m)}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- rows --- */

function SingerRow({ s, trackBg }: { s: Singer; trackBg: string }) {
  const left = pct(s.lowMidi);
  const width = Math.max(0.8, pct(s.highMidi) - left);
  const beltPct =
    s.beltMidi != null
      ? ((s.beltMidi - s.lowMidi) / (s.highMidi - s.lowMidi)) * 100
      : 100;
  const semis = s.highMidi - s.lowMidi;

  return (
    <li className="cv-auto">
      <Link
        href={`/singers/${s.slug}`}
        className={`group block rounded-xl px-2 py-2.5 transition-colors hover:bg-panel ${ROW_GRID}`}
      >
        <span className="flex items-baseline justify-between gap-2 sm:block">
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-ink">
              {s.name}
            </span>
            <span className="block truncate font-mono text-[10px] uppercase tracking-[0.1em] text-dim sm:mt-0.5">
              {s.voiceType} · {s.activeFrom}
            </span>
          </span>
          <span className="tabular shrink-0 font-mono text-[11px] text-mut sm:hidden">
            {midiToLabel(s.lowMidi)}–{midiToLabel(s.highMidi)}
          </span>
        </span>

        <span
          className="relative mt-1.5 block h-7 sm:mt-0"
          style={{ backgroundImage: trackBg }}
        >
          {/* Full reach (head / falsetto / whistle) */}
          <span
            className="absolute inset-y-1.5 rounded-full bg-cool/20 transition-colors group-hover:bg-cool/30"
            style={{ left: `${left}%`, width: `${width}%` }}
          >
            {/* Full-voice portion */}
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-cool/70 transition-colors group-hover:bg-cool"
              style={{ width: `${beltPct}%` }}
            />
            {s.whistle && (
              <span className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full border border-cool bg-bg" />
            )}
          </span>
        </span>

        <span className="hidden text-right font-mono text-[11px] leading-tight text-mut sm:block">
          <span className="tabular block">
            {midiToLabel(s.lowMidi)}–{midiToLabel(s.highMidi)}
          </span>
          <span className="tabular block text-dim">
            {spanOctaves(semis)} oct
          </span>
        </span>
      </Link>
    </li>
  );
}

/* ------------------------------------------------------------- toolbar --- */

const SORTS = [
  { id: "name", label: "Name A–Z" },
  { id: "widest", label: "Widest range" },
  { id: "lowest", label: "Lowest low" },
  { id: "highest", label: "Highest high" },
  { id: "era", label: "Era (oldest first)" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

const ALL_GENRES = [...new Set(SINGERS.flatMap((s) => s.genres))].sort();

const selectClass =
  "rounded-full border border-line bg-panel px-3 py-1.5 text-sm text-ink focus:border-amber focus:outline-none";

/* ---------------------------------------------------------- directory --- */

export function SingersDirectory() {
  const [q, setQ] = useState("");
  const [voice, setVoice] = useState<VoiceKind | "all">("all");
  const [genre, setGenre] = useState<string>("all");
  const [sort, setSort] = useState<SortId>("name");

  const progress = useProgress();
  const youLow = progress.range.lowMidi;
  const youHigh = progress.range.highMidi;
  const hasYou = youLow !== undefined && youHigh !== undefined;
  const trackBg = hasYou ? youBandBg(youLow, youHigh) : GRID_BG;

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = SINGERS.filter(
      (s) =>
        (voice === "all" || s.voiceType === voice) &&
        (genre === "all" || s.genres.includes(genre)) &&
        (!needle || s.name.toLowerCase().includes(needle)),
    );
    const by: Record<SortId, (a: Singer, b: Singer) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      widest: (a, b) => b.highMidi - b.lowMidi - (a.highMidi - a.lowMidi),
      lowest: (a, b) => a.lowMidi - b.lowMidi,
      highest: (a, b) => b.highMidi - a.highMidi,
      era: (a, b) => a.activeFrom - b.activeFrom,
    };
    return [...list].sort(by[sort]);
  }, [q, voice, genre, sort]);

  const records = useMemo(() => computeRecords(), []);

  const clearFilters = () => {
    setQ("");
    setVoice("all");
    setGenre("all");
  };

  return (
    <div>
      {/* Records strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            [
              "Widest range",
              records.widest,
              `${spanOctaves(records.widest.highMidi - records.widest.lowMidi)} octaves`,
            ],
            ["Lowest note", records.lowest, midiToLabel(records.lowest.lowMidi)],
            ["Highest note", records.highest, midiToLabel(records.highest.highMidi)],
          ] as const
        ).map(([label, s, value]) => (
          <Link
            key={label}
            href={`/singers/${s.slug}`}
            className="rounded-2xl border border-line bg-panel px-4 py-3 transition-colors hover:border-amber"
          >
            <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
              {label}
            </span>
            <span className="mt-1 flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium">{s.name}</span>
              <span className="tabular shrink-0 font-mono text-sm text-amber-ink">
                {value}
              </span>
            </span>
          </Link>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${SINGERS.length} singers…`}
          aria-label="Search singers"
          className="w-full rounded-full border border-line bg-panel px-4 py-2 text-sm text-ink placeholder:text-dim focus:border-amber focus:outline-none sm:w-64"
        />
        <select
          value={voice}
          onChange={(e) => setVoice(e.target.value as VoiceKind | "all")}
          aria-label="Filter by voice type"
          className={selectClass}
        >
          <option value="all">All voice types</option>
          {VOICE_KINDS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          aria-label="Filter by genre"
          className={selectClass}
        >
          <option value="all">All genres</option>
          {ALL_GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortId)}
          aria-label="Sort"
          className={selectClass}
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="tabular ml-auto font-mono text-xs text-dim">
          {rows.length} of {SINGERS.length}
        </span>
      </div>

      {/* Legend + your-range status */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] text-dim">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-6 rounded-full bg-cool/70" /> full voice
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-6 rounded-full bg-cool/20" /> falsetto · head
          · whistle
        </span>
        {hasYou ? (
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-6 rounded-sm bg-amber/30" /> you (
            {midiToLabel(youLow)}–{midiToLabel(youHigh)})
          </span>
        ) : (
          <Link
            href="/range"
            className="text-amber-ink underline decoration-amber/50 underline-offset-2 hover:decoration-amber"
          >
            Take the range test to see your voice on this chart →
          </Link>
        )}
      </div>

      {/* Sticky octave ruler */}
      <div className="sticky top-14 z-40 -mx-2 mt-5 border-b border-line bg-bg/95 px-2 pb-1 pt-2 backdrop-blur">
        <div className={ROW_GRID}>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-dim sm:block">
            low → high
          </span>
          <Ruler
            youLow={hasYou ? youLow : undefined}
            youHigh={hasYou ? youHigh : undefined}
          />
          <span className="hidden sm:block" />
        </div>
      </div>

      {/* Rows */}
      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No voices match"
            hint="Try a shorter search, or clear the voice type and genre filters."
            action={
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-line/50">
          {rows.map((s) => (
            <SingerRow key={s.slug} s={s} trackBg={trackBg} />
          ))}
        </ul>
      )}
    </div>
  );
}
