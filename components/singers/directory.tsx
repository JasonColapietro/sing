"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { midiToLabel } from "@/lib/audio/notes";
import { useProgress } from "@/lib/progress";
import {
  SINGERS_LITE as SINGERS,
  type SingerLite as Singer,
} from "@/lib/singers-lite";
import {
  VOICE_KINDS,
  computeRecords,
  spanOctaves,
  type VoiceKind,
} from "@/lib/singers-core";
import {
  INITIAL_RICH_SINGER_ROWS,
  nextRichSingerRowCount,
  visibleRichSingerRows,
} from "@/lib/singer-directory-pagination";
import { Button, EmptyState, LinkButton } from "@/components/ui";

/* ---------------------------------------------------------------- axis --- */

const DATA_LOW = Math.min(...SINGERS.map((s) => s.lowMidi));
const DATA_HIGH = Math.max(...SINGERS.map((s) => s.highMidi));
/** Shared axis for every row, snapped to octave boundaries. */
const AXIS_LOW = Math.floor(DATA_LOW / 12) * 12;
const AXIS_HIGH = Math.ceil(DATA_HIGH / 12) * 12;
const AXIS_SPAN = AXIS_HIGH - AXIS_LOW;

function pct(midi: number): number {
  return Math.min(100, ((midi - AXIS_LOW) / AXIS_SPAN) * 100);
}

/** Octave gridlines as a repeating background so rows need no extra DOM. */
const OCTAVE_TILE = (12 / AXIS_SPAN) * 100;
const GRID_BG = `repeating-linear-gradient(90deg, rgba(201,189,160,0.5) 0, rgba(201,189,160,0.5) 1px, transparent 1px, transparent ${OCTAVE_TILE}%)`;

/** Amber wash where the user's own range sits, layered over the gridlines.
 * Inclusive of the top semitone cell, matching the ruler band. */
function youBandBg(uLow: number, uHigh: number): string {
  const l = pct(uLow);
  const r = pct(uHigh + 1);
  return `linear-gradient(90deg, transparent ${l}%, rgba(197,150,66,0.14) ${l}%, rgba(197,150,66,0.14) ${r}%, transparent ${r}%), ${GRID_BG}`;
}

/** Row grid shared by the ruler and every singer row, so columns align. */
// The two fixed columns are capped as a share of the row as well as in rem.
// At 200% text zoom the rem values double -- 12rem becomes 384px and 6.5rem
// becomes 208px, which with the gaps claims 656px of a ~700px row and leaves
// the ruler about 44px. Nine octave labels positioned by percentage across
// 44px land on top of each other, and the axis renders as one illegible smudge
// (WCAG 1.4.4: content lost at 200%). The caps never bind at normal sizes --
// at every viewport this app targets, 12rem is well under 40% and 6.5rem well
// under 20%, so min() picks the rem value and the layout is byte-identical.
const ROW_GRID =
  "sm:grid sm:grid-cols-[min(12rem,40%)_minmax(0,1fr)_min(6.5rem,20%)] sm:items-center sm:gap-x-4";

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
  // Inclusive of the top semitone cell, matching the ruler and you-band.
  const width = Math.max(0.8, pct(s.highMidi + 1) - left);
  const beltPct =
    s.beltMidi != null
      ? ((s.beltMidi - s.lowMidi + 1) / (s.highMidi - s.lowMidi + 1)) * 100
      : 100;
  const semis = s.highMidi - s.lowMidi;
  const ariaBits = [
    `${s.name}, ${s.voiceType}`,
    `cited range ${midiToLabel(s.lowMidi)} to ${midiToLabel(s.highMidi)}`,
    s.beltMidi != null ? `full voice to ${midiToLabel(s.beltMidi)}` : null,
    s.whistle ? "uses whistle register" : null,
  ].filter(Boolean);

  return (
    <li className="cv-auto">
      <Link
        href={`/singers/${s.slug}`}
        aria-label={ariaBits.join(", ")}
        className={`group block scroll-mt-32 rounded-xl px-2 py-2.5 transition-colors hover:bg-panel ${ROW_GRID}`}
      >
        <span className="flex items-baseline justify-between gap-2 sm:block">
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-ink">
              {s.name}
            </span>
            <span className="block truncate font-mono text-[10px] uppercase tracking-[0.1em] text-mut sm:mt-0.5">
              {s.voiceType} · {s.activeFrom}
            </span>
          </span>
          <span className="tabular shrink-0 font-mono text-[11px] text-mut sm:hidden">
            {midiToLabel(s.lowMidi)}–{midiToLabel(s.highMidi)}
          </span>
        </span>

        <span
          aria-hidden="true"
          className="relative mt-1.5 block h-7 sm:mt-0"
          style={{ backgroundImage: trackBg }}
        >
          {/* Reach above the cited full-voice ceiling (head / falsetto / whistle) */}
          <span
            className="absolute inset-y-1.5 rounded-full bg-cool/30 transition-colors group-hover:bg-cool/45"
            style={{ left: `${left}%`, width: `${width}%` }}
          >
            {/* Full-voice portion (whole bar when no ceiling is cited) */}
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
          <span className="tabular block">{spanOctaves(semis)} oct</span>
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

const SORT_IDS = new Set<string>(SORTS.map((s) => s.id));

const SEARCH_ID = "singers-search";

/** Lives in the sticky ruler bar — the only way back to search/filters from
 * deep inside a 357-row list without a long manual scroll. */
function BackToFiltersButton({ searchId }: { searchId: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        const reduce = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
        // Scrolling alone leaves keyboard focus deep in the row list, so the
        // button did nothing for anyone not using a mouse. The search box is
        // what "↑ filters" is actually for.
        document.getElementById(searchId)?.focus({ preventScroll: true });
      }}
      // py-1 rather than py-0.5: at 10px type this button measured 21px tall,
      // under the 24px minimum for a control that is not inline text.
      className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-mut transition-colors hover:border-amber hover:text-amber-ink"
    >
      ↑ filters
    </button>
  );
}

export function SingersDirectory() {
  const [q, setQ] = useState("");
  const [voice, setVoice] = useState<VoiceKind | "all">("all");
  const [genre, setGenre] = useState<string>("all");
  const [sort, setSort] = useState<SortId>("name");
  const [visibleRowCount, setVisibleRowCount] = useState(
    INITIAL_RICH_SINGER_ROWS,
  );
  const [isInteractive, setIsInteractive] = useState(false);

  // Filters live in the URL (?q=&voice=&genre=&sort=) so browser Back from a
  // singer page restores them. Read once after mount (SSR renders defaults,
  // so no hydration mismatch), write with replaceState (no nav, no rerender).
  useEffect(() => {
    // useSearchParams would need a Suspense boundary that blanks the
    // server-rendered directory (and its 357 crawlable links), so restore
    // from the URL after hydration instead — the one-shot init the rule
    // can't distinguish from a cascading-render bug.
    /* eslint-disable react-hooks/set-state-in-effect */
    const p = new URLSearchParams(window.location.search);
    const pv = p.get("voice");
    const pg = p.get("genre");
    const ps = p.get("sort");
    if (p.get("q")) setQ(p.get("q")!);
    if (pv && (VOICE_KINDS as string[]).includes(pv)) setVoice(pv as VoiceKind);
    if (pg && ALL_GENRES.includes(pg)) setGenre(pg);
    if (ps && SORT_IDS.has(ps)) setSort(ps as SortId);
    setVisibleRowCount(INITIAL_RICH_SINGER_ROWS);
    setIsInteractive(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (voice !== "all") p.set("voice", voice);
    if (genre !== "all") p.set("genre", genre);
    if (sort !== "name") p.set("sort", sort);
    const qs = p.toString();
    const next = qs ? `?${qs}` : window.location.pathname;
    if (window.location.search !== (qs ? `?${qs}` : "")) {
      window.history.replaceState(null, "", next);
    }
  }, [q, voice, genre, sort]);

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

  const records = useMemo(() => computeRecords(SINGERS), []);
  const visibleRows = visibleRichSingerRows(rows, visibleRowCount);
  const canLoadMore = visibleRows.length < rows.length;

  const clearFilters = () => {
    setQ("");
    setVoice("all");
    setGenre("all");
    setVisibleRowCount(INITIAL_RICH_SINGER_ROWS);
  };

  // The complete server-only crawl index on /singers carries every raw HTML
  // artist anchor. Deferring this richer client chart avoids duplicating those
  // anchors in the initial document and keeps the first interactive batch small.
  if (!isInteractive) return null;

  return (
    <div>
      {/* Records strip. Three stacked cards pushed every singer below the fold
          on a phone, so below sm they sit in one horizontally-scrollable row
          (same fade affordance as the nav) instead of ~200px of column. */}
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,black_calc(100%-20px),transparent)] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:[mask-image:none]">
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
            className="w-[13.5rem] shrink-0 rounded-2xl border border-line bg-panel px-4 py-3 transition-colors hover:border-amber sm:w-auto"
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
          id={SEARCH_ID}
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setVisibleRowCount(INITIAL_RICH_SINGER_ROWS);
          }}
          placeholder="Search singers…"
          aria-label="Search singers"
          className="w-full rounded-full border border-line bg-panel px-4 py-2 text-sm text-ink placeholder:text-dim focus:border-amber focus:outline-none sm:w-64"
        />
        <select
          value={voice}
          onChange={(e) => {
            setVoice(e.target.value as VoiceKind | "all");
            setVisibleRowCount(INITIAL_RICH_SINGER_ROWS);
          }}
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
          onChange={(e) => {
            setGenre(e.target.value);
            setVisibleRowCount(INITIAL_RICH_SINGER_ROWS);
          }}
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
          onChange={(e) => {
            setSort(e.target.value as SortId);
            setVisibleRowCount(INITIAL_RICH_SINGER_ROWS);
          }}
          aria-label="Sort"
          className={selectClass}
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        {/* aria-atomic so the whole sentence is re-read on every filter
            change, not just the digits that happened to differ. */}
        <span
          aria-live="polite"
          aria-atomic="true"
          className="tabular ml-auto font-mono text-xs text-mut"
        >
          {rows.length === 0
            ? "No singers match"
            : `${rows.length} matches · ${visibleRows.length} loaded`}
        </span>
      </div>

      {/* Legend + your-range status */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] text-mut">
        {/* "cited range" for the solid segment implied the faded part was
            uncited, which is backwards — both come from the same figures.
            beltMidi: null means full voice essentially to the top, so a
            fully-solid bar reading "full voice" is accurate. */}
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-6 rounded-full bg-cool/70" /> full voice
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-6 rounded-full bg-cool/30" /> falsetto · head ·
          whistle
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-cool bg-bg" />{" "}
          whistle register
        </span>
        {hasYou && (
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-6 rounded-sm bg-amber/30" /> you (
            {midiToLabel(youLow)}–{midiToLabel(youHigh)})
          </span>
        )}
      </div>

      {/* First visit: the offer that makes this chart personal deserves a real
          button, not 11px of legend text. */}
      {!hasYou && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber/40 bg-panel px-4 py-3">
          <span className="text-sm text-mut">
            Your own range can sit on this chart — the test takes two minutes
            and never leaves your device.
          </span>
          <LinkButton href="/range" size="sm" className="ml-auto">
            Find my range
          </LinkButton>
        </div>
      )}

      {/* Sticky octave ruler. -mx-2 bleeds the bar to the row-hover edge;
          px-4 (8px bleed + 8px row padding) keeps its grid aligned with the
          rows' px-2 content below. */}
      <div className="sticky top-14 z-40 -mx-2 mt-5 border-b border-line bg-bg/95 px-4 pb-1 pt-1.5 backdrop-blur">
        <div className="mb-1 flex items-center justify-between sm:hidden">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
            low → high
          </span>
          <BackToFiltersButton searchId={SEARCH_ID} />
        </div>
        <div className={ROW_GRID}>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-dim sm:block">
            low → high
          </span>
          <Ruler
            youLow={hasYou ? youLow : undefined}
            youHigh={hasYou ? youHigh : undefined}
          />
          <span className="hidden text-right sm:block">
            <BackToFiltersButton searchId={SEARCH_ID} />
          </span>
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
        <>
          <ul
            id="singer-directory-results"
            className="mt-2 divide-y divide-line/50"
          >
            {visibleRows.map((s) => (
              <SingerRow key={s.slug} s={s} trackBg={trackBg} />
            ))}
          </ul>
          {canLoadMore && (
            <div className="mt-5 flex justify-center">
              <Button
                variant="outline"
                onClick={() =>
                  setVisibleRowCount(
                    nextRichSingerRowCount(visibleRowCount, rows.length),
                  )
                }
                aria-controls="singer-directory-results"
              >
                Load more singers ({rows.length - visibleRows.length} remaining)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
