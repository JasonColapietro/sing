"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { midiToLabel } from "@/lib/audio/notes";
import { useProgress } from "@/lib/progress";
import {
  SINGERS_LITE as SINGERS,
  type SingerLite as Singer,
} from "@/lib/singers-lite";
import {
  VOICE_KINDS,
  recordHolders,
  spanOctaves,
  type VoiceKind,
} from "@/lib/singers-core";
import {
  INITIAL_RICH_SINGER_ROWS,
  nextRichSingerRowCount,
  shownRowCountFromParam,
  visibleRichSingerRows,
} from "@/lib/singer-directory-pagination";
import { Button, EmptyState, FIELD_CLASS_NAME } from "@/components/ui";
import { rangeTestHref } from "@/lib/site";
import {
  FULL_VOICE_FILL_CLASS,
  RangeBarKey,
  WHISTLE_DOT_CLASS,
  fullVoicePct,
  rangeBarWords,
  spanBarClass,
} from "@/components/singers/range-bar";

/* ------------------------------------------------------- back to a row --- */

/**
 * Where a tap into a singer page came from, so browser Back lands on that
 * link again. The chart renders nothing until after mount and starts again
 * at its first batch, so the browser's own restored position is applied to a
 * page thousands of pixels shorter and every return landed far from the row.
 * Links below the chart move with it, so they need the same, and so does a
 * visitor who leaves from the chart by any other link: the list link on
 * screen then is the one to come back to.
 *
 * The tap is written into this page's own history entry (history.state),
 * which only a return to that entry reads: Back, Forward, or a full load of
 * it by either. It used to be a sessionStorage note checked against the time
 * of the last popstate, and the listener for that only existed once this
 * module had loaded. A Back handled by a document that had not loaded it yet
 * (the singer page was reloaded, or the visitor left by a full page load and
 * came back) read as a fresh visit and landed in the footer.
 */
const RETURN_STATE = "singersReturn";
/** The lists a visitor taps a link in (the chart's records strip and rows,
 * then the link lists and sections after the chart), each searched only
 * within itself: the same href can appear in more than one list and in the
 * reviewed cards above the chart. */
export const RETURN_SCOPES = [
  '[data-singer-return="records"]',
  "#singer-directory-results",
  "[data-singer-search-priority]",
  "[data-singer-crawl-index]",
  '[data-singer-return="browse"]',
  '[data-singer-return="method"]',
] as const;

export interface ReturnTarget {
  href: string;
  scope: (typeof RETURN_SCOPES)[number];
  /** Set when the visitor left by some other link (a header tab, the menu,
   * the footer) with this one on screen: its distance from the top of the
   * viewport then, to put it back at. A tapped link has none and is centred. */
  top?: number;
}

/** The tap recorded on a history entry's state, or null. */
export function readReturnTarget(state: unknown): ReturnTarget | null {
  if (!state || typeof state !== "object") return null;
  const saved = (state as Record<string, unknown>)[RETURN_STATE];
  if (!saved || typeof saved !== "object") return null;
  const { href, scope, top } = saved as { href?: unknown; scope?: unknown; top?: unknown };
  if (typeof href !== "string" || !href.startsWith("/")) return null;
  const known = RETURN_SCOPES.find((sel) => sel === scope);
  if (!known) return null;
  return typeof top === "number" && Number.isFinite(top) ? { href, scope: known, top } : { href, scope: known };
}

/**
 * A history entry's state with the return target set, or removed (null).
 * Everything else in it, Next's own fields included, is kept: a state that
 * carries them passes Next's history patch unchanged.
 */
export function withReturnTarget(state: unknown, target: ReturnTarget | null): Record<string, unknown> {
  const next: Record<string, unknown> = state && typeof state === "object" ? { ...state } : {};
  if (target) next[RETURN_STATE] = target;
  else delete next[RETURN_STATE];
  return next;
}

/**
 * The link to hold the view by when the visitor leaves by a link outside the
 * lists: the first, in the lists' order, whose top is on screen below the
 * header (`floor`, the page's scroll-padding). Candidates are in document
 * order and each is the first link to its href in its list, which is the one
 * the return looks up. Null when no list is on screen: above the chart the
 * page is server-rendered and the browser's own position holds.
 */
export function pickReturnAnchor(
  candidates: ReadonlyArray<ReturnTarget & { top: number; height: number }>,
  floor: number,
  viewportHeight: number,
): ReturnTarget | null {
  const hit = candidates.find((c) => c.height > 0 && c.top >= floor && c.top < viewportHeight);
  return hit ? { href: hit.href, scope: hit.scope, top: Math.round(hit.top) } : null;
}

function returnAnchorInView(): ReturnTarget | null {
  const floor = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const candidates: Array<ReturnTarget & { top: number; height: number }> = [];
  for (const scope of RETURN_SCOPES) {
    const box = document.querySelector(scope);
    if (!box) continue;
    const area = box.getBoundingClientRect();
    if (area.bottom <= floor || area.top >= window.innerHeight) continue;
    const seen = new Set<string>();
    for (const a of box.querySelectorAll('a[href^="/singers/"]')) {
      const href = a.getAttribute("href");
      if (!href || seen.has(href)) continue;
      seen.add(href);
      const { top, height } = a.getBoundingClientRect();
      candidates.push({ href, scope, top, height });
    }
  }
  return pickReturnAnchor(candidates, floor, window.innerHeight);
}

/**
 * Remember, on this entry, where to bring the visitor back to: the link they
 * tapped in one of those lists, or, when they leave by any other link from
 * somewhere in or below the chart, the list link on screen at the time. The
 * second case is the same fall as the first: a header tab or a footer link
 * left from row 31 came back 3,000px further down on a phone, in the footer.
 */
function rememberReturn(e: MouseEvent) {
  // A tap that opens another tab or window leaves this page where it is.
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const target = e.target instanceof Element ? e.target : null;
  const link = target?.closest("a[href]");
  if (!(link instanceof HTMLAnchorElement)) return;
  if ((link.target && link.target !== "_self") || link.hasAttribute("download")) return;
  // A link within this page (#method, the Singers tab itself) leaves nothing
  // to come back to.
  if (link.origin === window.location.origin && link.pathname === window.location.pathname) return;
  const href = link.getAttribute("href") ?? "";
  const scope = href.startsWith("/singers/")
    ? RETURN_SCOPES.find((sel) => link.closest(sel))
    : undefined;
  const saved = scope ? { href, scope } : returnAnchorInView();
  try {
    window.history.replaceState(withReturnTarget(window.history.state, saved), "");
  } catch {
    // History refused the write: Back keeps the browser's own position.
  }
}

/** On a return to this entry, bring the link back into view, once: the
 * target is cleared from the entry so a later Back here (after leaving from
 * above the chart) keeps the browser's own position. */
function returnToTappedSinger(saved: ReturnTarget | null) {
  if (!saved) return;
  try {
    window.history.replaceState(withReturnTarget(window.history.state, null), "");
  } catch {
    // Nothing to clear.
  }
  const link = document
    .querySelector(saved.scope)
    ?.querySelector(`a[href="${CSS.escape(saved.href)}"]`);
  if (!link) return;
  const { top } = saved;
  const place = () => {
    if (top === undefined) link.scrollIntoView({ block: "center" });
    else window.scrollBy(0, link.getBoundingClientRect().top - top);
  };
  place();
  // A Back inside the app can mount the chart while the popstate is still
  // being handled, and the browser then applies the entry's saved scroll
  // position on top of this one. Bring the link back once the browser has
  // done that; already in place, it is a no-op.
  requestAnimationFrame(() => requestAnimationFrame(place));
}

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
  // null when the catalog cites no full-voice ceiling: the bar is then drawn
  // dashed and unfilled, never as full voice to the top.
  const beltPct = fullVoicePct(s);
  const semis = s.highMidi - s.lowMidi;

  return (
    // Pagination bounds this rich list (48 initially). Its rows must use real
    // heights on departure as well as return: intrinsic offscreen estimates
    // changed distances between visible rows while Back restored its anchor.
    <li>
      {/* prefetch off: rows load in batches of hundreds, and the default
          fetched every row's page payload as it scrolled into view. */}
      <Link
        href={`/singers/${s.slug}`}
        prefetch={false}
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
          {/* Whole cited span; the faded part above the full-voice portion is
              the reach above the ceiling (head / falsetto / whistle). */}
          <span
            className={`absolute inset-y-1.5 ${spanBarClass(s)}`}
            style={{ left: `${left}%`, width: `${width}%` }}
          >
            {/* Full-voice portion, only where a ceiling is cited */}
            {beltPct != null && (
              <span
                className={FULL_VOICE_FILL_CLASS}
                style={{ width: `${beltPct}%` }}
              />
            )}
            {s.whistle && <span className={WHISTLE_DOT_CLASS} />}
          </span>
        </span>

        <span className="hidden text-right font-mono text-[11px] leading-tight text-mut sm:block">
          <span className="tabular block">
            {midiToLabel(s.lowMidi)}–{midiToLabel(s.highMidi)}
          </span>
          <span className="tabular block">{spanOctaves(semis)} oct</span>
        </span>
        {/* The link's name is its visible text (name, voice type, year,
            range, span) so a spoken "click" on what is shown finds it (WCAG
            2.5.3); the drawn bar is hidden, so what it shows is added here. */}
        <span className="sr-only">, {rangeBarWords(s).join(", ")}</span>
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
        const search = document.getElementById(searchId);
        // To the search box and the filters beside it, not the top of the
        // page: the chart starts below the hero, the reviewed profiles and
        // the voice types, so the page top left the filters about 2,100px
        // down on a phone with the focus already in a field nobody could see.
        // The page's scroll-padding keeps the box clear of the header.
        search?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
        // Scrolling alone leaves keyboard focus deep in the row list, so the
        // button did nothing for anyone not using a mouse. The search box is
        // what "↑ filters" is actually for.
        search?.focus({ preventScroll: true });
      }}
      // py-1 rather than py-0.5: at 10px type this button measured 21px tall,
      // under the 24px minimum for a control that is not inline text.
      className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-mut transition-colors hover:border-violet hover:text-violet-ink"
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
  // The link this history entry was left by, read before anything below
  // rewrites the entry's state (the filter sync's replaceState drops it).
  const returnTarget = useRef<ReturnTarget | null>(null);

  // Filters live in the URL (?q=&voice=&genre=&sort=), with the loaded row
  // count past the first batch (?shown=), so browser Back from a singer page
  // restores them. Read once after mount (SSR renders defaults, so no
  // hydration mismatch), write with replaceState (no nav, no rerender).
  useEffect(() => {
    // useSearchParams would need a Suspense boundary that blanks the
    // server-rendered directory (and its 357 crawlable links), so restore
    // from the URL after hydration instead — the one-shot init the rule
    // can't distinguish from a cascading-render bug.
    returnTarget.current = readReturnTarget(window.history.state);
    /* eslint-disable react-hooks/set-state-in-effect */
    const p = new URLSearchParams(window.location.search);
    const pv = p.get("voice");
    const pg = p.get("genre");
    const ps = p.get("sort");
    if (p.get("q")) setQ(p.get("q")!);
    if (pv && (VOICE_KINDS as string[]).includes(pv)) setVoice(pv as VoiceKind);
    if (pg && ALL_GENRES.includes(pg)) setGenre(pg);
    if (ps && SORT_IDS.has(ps)) setSort(ps as SortId);
    setVisibleRowCount(shownRowCountFromParam(p.get("shown"), SINGERS.length));
    setIsInteractive(true);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Capture phase, so the tap is recorded before the link navigates.
    document.addEventListener("click", rememberReturn, true);
    return () => document.removeEventListener("click", rememberReturn, true);
  }, []);

  // Runs once the chart (and its restored rows) is in the DOM.
  useEffect(() => {
    if (!isInteractive) return;
    returnToTappedSinger(returnTarget.current);
    returnTarget.current = null;
  }, [isInteractive]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (voice !== "all") p.set("voice", voice);
    if (genre !== "all") p.set("genre", genre);
    if (sort !== "name") p.set("sort", sort);
    if (visibleRowCount > INITIAL_RICH_SINGER_ROWS) p.set("shown", String(visibleRowCount));
    const qs = p.toString();
    const next = qs ? `?${qs}` : window.location.pathname;
    if (window.location.search !== (qs ? `?${qs}` : "")) {
      window.history.replaceState(null, "", next);
    }
  }, [q, voice, genre, sort, visibleRowCount]);

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

  const records = useMemo(() => recordHolders(SINGERS), []);
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
  // Until then the slot holds one empty screen (no anchors), so the sections
  // after it start below the first screen on any display and the chart, about
  // 2,500px, replaces it without moving anything in view: with no box there,
  // a tall screen showed "Popular vocal range lookups" at load and the chart
  // shoved it down (layout shift 0.1-0.2 at 1024×1366 and 1440×1300).
  if (!isInteractive) return <div aria-hidden="true" className="min-h-screen" />;

  return (
    <div>
      {/* Records strip. Three stacked cards pushed every singer below the fold
          on a phone, so below sm they sit in one horizontally-scrollable row
          (same fade affordance as the nav) instead of ~200px of column. */}
      <div
        data-singer-return="records"
        className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,black_calc(100%-20px),transparent)] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:[mask-image:none]"
      >
        {/* A shared record names every holder ("Dimash Kudaibergen · Mike
            Patton"), not whichever sorts first, and links to the records
            page, which lists them side by side, rather than to one of them. */}
        {(
          [
            [
              "Widest range",
              records.widest,
              `${spanOctaves(records.widest[0].highMidi - records.widest[0].lowMidi)} octaves`,
            ],
            ["Lowest note", records.lowest, midiToLabel(records.lowest[0].lowMidi)],
            ["Highest note", records.highest, midiToLabel(records.highest[0].highMidi)],
          ] as const
        ).map(([label, holders, value]) => (
          <Link
            key={label}
            href={holders.length === 1 ? `/singers/${holders[0].slug}` : "/singers/records"}
            prefetch={false}
            className="w-[13.5rem] shrink-0 rounded-2xl border border-line bg-panel px-4 py-3 transition-colors hover:border-violet sm:w-auto"
          >
            <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
              {label}
              {holders.length > 1 ? " · tied" : ""}
            </span>
            <span className="mt-1 flex items-baseline justify-between gap-2">
              {/* Wraps rather than truncates, so a second holder is never
                  clipped off a narrow card. */}
              <span className="min-w-0 text-sm font-medium">
                {holders.map((h) => h.name).join(" · ")}
              </span>
              <span className="tabular shrink-0 font-mono text-sm text-violet-ink">
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
          className={`w-full sm:w-64 ${FIELD_CLASS_NAME}`}
        />
        <select
          value={voice}
          onChange={(e) => {
            setVoice(e.target.value as VoiceKind | "all");
            setVisibleRowCount(INITIAL_RICH_SINGER_ROWS);
          }}
          aria-label="Filter by voice type"
          className={FIELD_CLASS_NAME}
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
          className={FIELD_CLASS_NAME}
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
          className={FIELD_CLASS_NAME}
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
            beltMidi: null means the catalog cites no full-voice ceiling, not
            full voice to the top, so those bars are drawn dashed and unfilled.
            The same key sits above every hub chart. */}
        <RangeBarKey />
        {hasYou && (
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-6 rounded-sm bg-violet/30" /> you (
            {midiToLabel(youLow)}–{midiToLabel(youHigh)})
          </span>
        )}
      </div>

      {/* First visit: the offer that makes this chart personal, at body size
          rather than 11px of legend text. A quiet link rather than a button:
          the page's own "Test my vocal range" is the primary ask, and a
          second filled button here competed with it. */}
      {!hasYou && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-violet/40 bg-panel px-4 py-3">
          <span className="text-sm text-mut">
            {/* Audio only: the saved range itself is backed up by Pro sync
                and, once accounts open, by the account backup. */}
            Your own range can sit on this chart: the test takes about two
            minutes, and your audio never leaves your device.
          </span>
          <Link
            href={rangeTestHref()}
            className="ml-auto inline-flex min-h-11 items-center text-sm font-medium text-violet-ink underline decoration-violet/40 underline-offset-4 hover:decoration-violet"
          >
            Find my range
          </Link>
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
