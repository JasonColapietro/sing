"use client";

import { useMemo, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { jumpInPage, SectionLabel } from "@/components/ui";
import { useHydrated } from "@/components/prepaint";
import { NoteAccuracyChart, RangeHistoryChart } from "@/components/progress/pro-charts";
import {
  aggregateNotes,
  noteReports,
  rangeSeries,
  type NoteTallies,
  type RangeEntry,
} from "@/lib/analytics";
import { PRO_PERKS } from "@/lib/pro";
import {
  BOOKS,
  PRO_EXERCISES,
  PRO_PACK_COUNT,
  PRO_PROGRAM_COUNT,
  PRO_PROGRAM_NAMES,
} from "@/lib/pro-inventory";
import { SAMPLE_NOTE_TALLIES, SAMPLE_RANGE_HISTORY } from "@/lib/pro-sample";
import { useProgress } from "@/lib/progress";
import {
  AnalyticsGlyph,
  BookGlyph,
  CoachGlyph,
  PacksGlyph,
  SongbookGlyph,
  SyncGlyph,
  TakesGlyph,
} from "./glyphs";
import { TakeSample } from "./take-sample";
import { ProChip } from "./ui";

/**
 * "What Pro adds" on /pro, shown rather than listed.
 *
 * Public surface: `ProShowcase({ owned, cta })`, `useOwnVoice()`, and the
 * label strings below (tests and the hero's jump link read them).
 *
 * Rules:
 * - The two charts are the real ones from /progress. The server HTML, and a
 *   visitor with nothing recorded, get lib/pro-sample.ts under a label that
 *   says "Sample data". A visitor with a record gets their own after
 *   hydration, labelled as theirs.
 * - A free visitor's own chart is drawn exactly as /progress draws it for
 *   them (components/pro/ui.tsx LockedPanel): faded, inert, hidden from
 *   assistive tech, its caption under a gradient. Never clearer than that,
 *   or this page would hand over the chart it sells. An owner sees theirs
 *   plainly.
 * - Each chart sits in a frame whose height depends only on its width, so
 *   the swap from sample to own data moves nothing.
 * - Every figure comes from lib/pro-inventory.ts; every claim sentence is a
 *   PRO_PERKS row. Nothing here states a price: the page passes its own buy
 *   button in as `cta`.
 */

export const SAMPLE_NOTES_LABEL =
  "Sample data. Sing a scored warmup and this becomes yours.";
/** Two tests, as the range result's own panel asks before it charts them. */
export const SAMPLE_RANGE_LABEL =
  "Sample data. Take the range test twice and this becomes yours.";
export const OWN_DATA_LABEL = "Your data, from this browser";
/** What a free visitor reads beside their own faded chart. */
const OWN_DATA_PREVIEW = `${OWN_DATA_LABEL}. Faded here; Pro opens the full chart.`;

/** The sample's dates are in the server HTML, so their format cannot follow the reader. */
const SAMPLE_DATES = { locale: "en-US", timeZone: "UTC" };

const perk = (id: string) => PRO_PERKS.find((p) => p.id === id)!;

/**
 * The visitor's own chart data, or null where they have none worth drawing.
 * Null on the server and through hydration (useProgress's server snapshot is
 * the empty record), so the prerendered page is always the sample.
 */
export function useOwnVoice(owned = false): {
  tallies: NoteTallies | null;
  history: RangeEntry[] | null;
} {
  const state = useProgress();
  const hydrated = useHydrated();
  const tallies = useMemo(() => aggregateNotes(state.sessions), [state.sessions]);
  const tests = rangeSeries(state.rangeHistory).length;
  if (!hydrated) return { tallies: null, history: null };
  return {
    tallies: noteReports(tallies).length > 0 ? tallies : null,
    // One test is a single bar: an owner's dashboard draws it, but as a
    // preview it shows nothing "over time" (components/range/result-view.tsx
    // asks for two as well).
    history: tests >= (owned ? 1 : 2) ? state.rangeHistory : null,
  };
}

/**
 * A chart in a frame that cannot change height: the SVG's height follows its
 * width, and the caption under it gets a fixed row (three lines of text-xs)
 * however long it runs.
 */
function ChartFrame({
  title,
  label,
  faded,
  children,
}: {
  title: string;
  label: string;
  /** A free visitor's own data: the locked-panel treatment. */
  faded: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-panel2/60 px-4 py-2.5">
        <h4 className="font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-mut">
          {title}
        </h4>
        <ProChip />
      </div>
      {/* Two lines reserved: the labels differ in length, and one that
          wrapped where the other did not would move the chart. */}
      <p className="min-h-12 px-4 pt-3 text-xs leading-4 text-mut sm:px-5">{label}</p>
      <div className="relative px-4 pb-4 sm:px-5">
        <div
          aria-hidden={faded || undefined}
          className={`grid grid-rows-[auto_4rem] overflow-hidden ${
            faded ? "pointer-events-none select-none opacity-60" : ""
          }`}
        >
          {children}
        </div>
        {faded && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-panel to-transparent"
          />
        )}
      </div>
    </div>
  );
}

function GlyphChip({ Glyph }: { Glyph: ComponentType }) {
  return (
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet/40 bg-panel2 text-violet-ink">
      <Glyph />
    </span>
  );
}

/** A claim: the perk's own title and sentence, word for word. */
function Claim({ id, Glyph }: { id: string; Glyph: ComponentType }) {
  const { title, desc } = perk(id);
  return (
    <div>
      <GlyphChip Glyph={Glyph} />
      <h3 className="mt-4 text-xl font-extrabold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-mut">{desc}</p>
    </div>
  );
}

const ROW = "grid items-center gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10";
const TEXT_LINK =
  "inline-flex min-h-11 items-center text-sm text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet";

const PROGRAM_LIST = new Intl.ListFormat("en", { type: "conjunction" }).format(PRO_PROGRAM_NAMES);

export function ProShowcase({
  owned,
  cta,
}: {
  /** Pro is on in this browser: the visitor's own charts are drawn plainly. */
  owned: boolean;
  /** The page's closing action for this section: its buy button, or an owner's way on. */
  cta: ReactNode;
}) {
  const own = useOwnVoice(owned);

  return (
    <section id="showcase" className="scroll-mt-20 border-t border-line">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <SectionLabel hairline className="mb-4">What Pro adds</SectionLabel>
        <h2 className="max-w-2xl text-2xl sm:text-3xl">
          The coach&apos;s full plan, and the charts behind it
        </h2>
        <p className="mt-3 max-w-2xl text-mut">
          See it on your own voice. The two charts below draw from the practice
          saved in this browser; until there is some, they show a sample voice
          and say so.
        </p>

        {/* a. The charts: the real components, on real or sample data. */}
        <div className="mt-10">
          <Claim id="analytics" Glyph={AnalyticsGlyph} />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ChartFrame
              title="Accuracy by note"
              label={
                own.tallies ? (owned ? `${OWN_DATA_LABEL}.` : OWN_DATA_PREVIEW) : SAMPLE_NOTES_LABEL
              }
              faded={own.tallies !== null && !owned}
            >
              <NoteAccuracyChart tallies={own.tallies ?? SAMPLE_NOTE_TALLIES} />
            </ChartFrame>
            <ChartFrame
              title="Range over time"
              label={
                own.history ? (owned ? `${OWN_DATA_LABEL}.` : OWN_DATA_PREVIEW) : SAMPLE_RANGE_LABEL
              }
              faded={own.history !== null && !owned}
            >
              {own.history ? (
                <RangeHistoryChart history={own.history} />
              ) : (
                <RangeHistoryChart history={SAMPLE_RANGE_HISTORY} dateFormat={SAMPLE_DATES} />
              )}
            </ChartFrame>
          </div>
        </div>

        {/* b. Take analysis: a drawing, labelled as a sample by TakeSample. */}
        <div className={`mt-14 ${ROW}`}>
          <Claim id="takes" Glyph={TakesGlyph} />
          <TakeSample className="rounded-2xl border border-line bg-panel p-4 sm:p-5" />
        </div>

        {/* c. Packs and programs, counted by lib/pro-inventory.ts. */}
        <div className={`mt-14 ${ROW}`}>
          <Claim id="warmups" Glyph={PacksGlyph} />
          <div className="rounded-2xl border border-line bg-panel p-5 sm:p-6">
            <ul className="grid grid-cols-3 gap-4">
              {[
                [PRO_EXERCISES, "pro exercises"],
                [PRO_PACK_COUNT, "pro packs"],
                [PRO_PROGRAM_COUNT, "Pro programs"],
              ].map(([figure, label]) => (
                <li key={label}>
                  <p className="tabular text-3xl text-violet-ink sm:text-4xl">{figure}</p>
                  <p className="mt-1 text-sm text-ink">{label}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-line pt-4 text-sm text-mut">
              The programs, each in full: {PROGRAM_LIST}.
            </p>
            <Link href="/programs" className={`mt-1 ${TEXT_LINK}`}>
              Week 1 of every program is free
            </Link>
          </div>
        </div>

        {/* d. The books, by their own figures. */}
        <div className={`mt-14 ${ROW}`}>
          <Claim id="book" Glyph={BookGlyph} />
          <div className="rounded-2xl border border-line bg-panel p-5 sm:p-6">
            <ul className="grid gap-4 sm:grid-cols-2">
              {BOOKS.map((book) => (
                <li key={book.href} className="border-l-2 border-violet/40 pl-4">
                  <p className="font-display text-xl leading-tight text-ink">{book.title}</p>
                  <p className="tabular mt-2 text-sm text-mut">
                    {book.chapters} chapters, {book.words.toLocaleString("en-US")} words
                  </p>
                  <p className="tabular text-sm text-mut">
                    {book.free} chapters free to read now
                  </p>
                </li>
              ))}
            </ul>
            {/* A plain anchor: the browser makes the jump (see jumpInPage). */}
            <a href="#unlocks" onClick={jumpInPage} className={`mt-3 ${TEXT_LINK}`}>
              See every chapter title
            </a>
          </div>
        </div>

        {/* The perks with nothing to draw: the plan is the report at the top
            of the page, and the other two are a limit and a sync. */}
        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {(
            [
              ["coach", CoachGlyph],
              ["songs", SongbookGlyph],
              ["history", SyncGlyph],
            ] as const
          ).map(([id, Glyph]) => (
            <div key={id} className="rounded-2xl border border-line bg-panel p-5 sm:p-6">
              <GlyphChip Glyph={Glyph} />
              <h3 className="mt-4 text-xl font-extrabold text-ink">{perk(id).title}</h3>
              <p className="mt-1 text-sm text-mut">{perk(id).desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start gap-3">{cta}</div>
      </div>
    </section>
  );
}
