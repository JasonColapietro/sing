"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { jumpInPage, SectionLabel } from "@/components/ui";
import { useHydrated } from "@/components/prepaint";
import { BookCover } from "@/components/book/cover";
import { NoteAccuracyChart, RangeHistoryChart } from "@/components/progress/pro-charts";
import {
  aggregateNotes,
  noteReports,
  rangeSeries,
  type NoteTallies,
  type RangeEntry,
} from "@/lib/analytics";
import { AUTHOR_NAME } from "@/lib/author";
import { PRO_PERKS } from "@/lib/pro";
import { BOOKS, PRO_PROGRAM_COUNT, PRO_SHOWCASE_ANCHOR } from "@/lib/pro-inventory";
import {
  SAMPLE_ACCURACY,
  SAMPLE_DATA_LABEL,
  SAMPLE_NOTE_TALLIES,
  SAMPLE_RANGE,
  SAMPLE_RANGE_HISTORY,
  SAMPLE_WEAK_NOTE,
} from "@/lib/pro-sample";
import { useProgress } from "@/lib/progress";
import { TakeSample } from "./take-sample";
import { ProChip } from "./ui";

/**
 * "What Pro adds" on /pro, shown rather than listed.
 *
 * Public surface: `ProShowcase({ owned, own, pack, cta })`, `useOwnVoice()`,
 * and the label strings below (tests read them).
 *
 * Rules:
 * - The two charts are the real ones from /progress. The server HTML, and a
 *   visitor with nothing recorded, get lib/pro-sample.ts under a label that
 *   says "Sample data". A visitor with a record gets their own after
 *   hydration, labelled as theirs.
 * - A sample chart is never announced or captioned as the visitor's: the
 *   chart components speak of "your" range and "your first test", so on the
 *   sample their own name and caption are hidden and SampleChart supplies
 *   sample-worded ones.
 * - A free visitor's own chart is drawn exactly as /progress draws it for
 *   them (components/pro/ui.tsx LockedPanel): faded, inert, hidden from
 *   assistive tech, its caption under a gradient. Never clearer than that,
 *   or this page would hand over the chart it sells. An owner sees theirs
 *   plainly.
 * - Each chart sits in a frame whose height depends only on its width, so
 *   the swap from sample to own data moves nothing. Nothing else in the
 *   section depends on the visitor's record, for the same reason.
 * - Pictures, not numerals: the pack is a real pack card (the page passes it
 *   in as `pack`, server-rendered, so the exercise catalogue stays out of
 *   this bundle) and the books are their covers. Each figure is stated once,
 *   from lib/pro-inventory.ts; every claim sentence is a PRO_PERKS row.
 * - Nothing here states a price or sells: a free visitor's buy button is the
 *   hero's, the card's below, and the bar that follows them. `cta` is an
 *   owner's way on.
 */

export const SAMPLE_NOTES_LABEL = `${SAMPLE_DATA_LABEL}. Sing a scored warmup and your own notes appear here.`;
/** Two tests, as the range result's own panel asks before it charts them. */
export const SAMPLE_RANGE_LABEL = `${SAMPLE_DATA_LABEL}. Take the range test twice and your own range appears here.`;
export const OWN_DATA_LABEL = "Your data, from this browser";
/** What a free visitor reads beside their own faded chart. */
const OWN_DATA_PREVIEW = `${OWN_DATA_LABEL}. Faded here; Pro opens the full chart.`;

/** The sample charts' accessible names and captions: the sample's figures, in nobody's second person. */
const SAMPLE_SEMITONES = SAMPLE_RANGE.highMidi - SAMPLE_RANGE.lowMidi;
export const SAMPLE_NOTES_NAME = `Sample chart of accuracy by note, from ${SAMPLE_RANGE.low} to ${SAMPLE_RANGE.high}: ${SAMPLE_ACCURACY}% in tune overall, weakest on ${SAMPLE_WEAK_NOTE.label} at ${SAMPLE_WEAK_NOTE.accuracy}%.`;
export const SAMPLE_NOTES_CAPTION = `Sample voice: ${SAMPLE_ACCURACY}% in tune across its scored notes. Weakest note ${SAMPLE_WEAK_NOTE.label} at ${SAMPLE_WEAK_NOTE.accuracy}%.`;
export const SAMPLE_RANGE_NAME = `Sample chart of a vocal range across ${SAMPLE_RANGE_HISTORY.length} tests six weeks apart. The latest spans ${SAMPLE_RANGE.low} to ${SAMPLE_RANGE.high}, ${SAMPLE_SEMITONES} semitones.`;
export const SAMPLE_RANGE_CAPTION = `Sample voice: ${SAMPLE_RANGE_HISTORY.length} tests six weeks apart. The latest spans ${SAMPLE_RANGE.low}–${SAMPLE_RANGE.high}, ${SAMPLE_SEMITONES} semitones.`;

/** The sample's dates are in the server HTML, so their format cannot follow the reader. */
const SAMPLE_DATES = { locale: "en-US", timeZone: "UTC" };

const perk = (id: string) => PRO_PERKS.find((p) => p.id === id)!;

/**
 * The visitor's own chart data, or null where they have none worth drawing.
 * Null on the server and through hydration (useProgress's server snapshot is
 * the empty record), so the prerendered page is always the sample.
 */
export interface OwnVoice {
  tallies: NoteTallies | null;
  history: RangeEntry[] | null;
}

export function useOwnVoice(owned = false): OwnVoice {
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

/**
 * A chart on the sample voice. The chart's own accessible name and caption
 * say "you" and "your first test", so both are hidden (the name from
 * assistive tech, the caption from everyone) and replaced by ones that say
 * whose voice this is. Two children, like the chart itself, so it fills the
 * frame's two rows exactly as the visitor's own chart does.
 */
function SampleChart({ name, caption, children }: { name: string; caption: string; children: ReactNode }) {
  return (
    <>
      <div role="img" aria-label={name}>
        <div aria-hidden="true" className="[&>p]:hidden">
          {children}
        </div>
      </div>
      <p className="mt-2 text-xs text-mut">{caption}</p>
    </>
  );
}

/** A claim: the perk's own title and sentence, word for word. */
function Claim({ id, compact = false }: { id: string; compact?: boolean }) {
  const { title, desc } = perk(id);
  return (
    <div>
      <h3 className={`font-extrabold text-ink ${compact ? "text-base" : "text-xl"}`}>{title}</h3>
      <p className="mt-1 max-w-md text-sm text-mut">{desc}</p>
    </div>
  );
}

const ROW = "mt-10 grid items-center gap-5 lg:mt-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10";
const TEXT_LINK =
  "inline-flex min-h-11 items-center text-sm text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet";

export function ProShowcase({
  owned,
  own,
  pack,
  cta,
}: {
  /** Pro is on in this browser: the visitor's own charts are drawn plainly. */
  owned: boolean;
  /** The visitor's own chart data (`useOwnVoice`), called once by the page, which words its jump link from it too. */
  own: OwnVoice;
  /** A real pro pack card (components/pro/pack-sample.tsx), rendered on the server. */
  pack?: ReactNode;
  /** An owner's way on from here. A free visitor is sold nothing in this section. */
  cta?: ReactNode;
}) {
  return (
    <section id={PRO_SHOWCASE_ANCHOR} className="scroll-mt-20 border-t border-line">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <SectionLabel hairline className="mb-4">What Pro adds</SectionLabel>
        <h2 className="max-w-2xl text-2xl sm:text-3xl">
          The coach&apos;s full plan, and the charts behind it
        </h2>
        {/* The same words whoever reads them: a line that changed with the
            visitor's record would move everything under it on hydration. */}
        <p className="mt-3 max-w-2xl text-mut">
          The two charts below draw from the practice saved in this browser;
          until there is some, they show a sample voice and say so.
        </p>

        {/* a. The charts: the real components, on real or sample data. */}
        <div className="mt-8">
          <Claim id="analytics" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ChartFrame
              title="Accuracy by note"
              label={
                own.tallies ? (owned ? `${OWN_DATA_LABEL}.` : OWN_DATA_PREVIEW) : SAMPLE_NOTES_LABEL
              }
              faded={own.tallies !== null && !owned}
            >
              {own.tallies ? (
                <NoteAccuracyChart tallies={own.tallies} />
              ) : (
                <SampleChart name={SAMPLE_NOTES_NAME} caption={SAMPLE_NOTES_CAPTION}>
                  <NoteAccuracyChart tallies={SAMPLE_NOTE_TALLIES} />
                </SampleChart>
              )}
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
                <SampleChart name={SAMPLE_RANGE_NAME} caption={SAMPLE_RANGE_CAPTION}>
                  <RangeHistoryChart history={SAMPLE_RANGE_HISTORY} dateFormat={SAMPLE_DATES} />
                </SampleChart>
              )}
            </ChartFrame>
          </div>
        </div>

        {/* b. Take analysis: a drawing, labelled as a sample by TakeSample. */}
        <div className={ROW}>
          <Claim id="takes" />
          <TakeSample className="rounded-2xl border border-line bg-panel p-4 sm:p-5" />
        </div>

        {/* c. A pro pack, as the warmups room draws it, and the programs. */}
        <div className={ROW}>
          <Claim id="warmups" />
          <div>
            {pack}
            <p className="mt-3 text-sm text-mut">
              Pro also opens {PRO_PROGRAM_COUNT} programs in full.{" "}
              <Link href="/programs" className={TEXT_LINK}>
                Week 1 of every program is free
              </Link>
            </p>
          </div>
        </div>

        {/* d. The books, as their covers, each with its own figures. */}
        <div className={ROW}>
          <Claim id="book" />
          <div>
            <ul className="grid grid-cols-2 gap-4 sm:gap-6">
              {BOOKS.map((book) => (
                <li key={book.href}>
                  <BookCover title={book.title} author={AUTHOR_NAME} />
                  {/* The cover is a drawing, hidden from assistive tech. */}
                  <p className="tabular mt-3 text-sm text-ink">
                    <span className="sr-only">{book.title}: </span>
                    {book.chapters} chapters, {book.words.toLocaleString("en-US")} words
                  </p>
                  <p className="tabular text-sm text-mut">{book.free} chapters free to read now</p>
                </li>
              ))}
            </ul>
            {/* A plain anchor: the browser makes the jump (see jumpInPage). */}
            <a href="#unlocks" onClick={jumpInPage} className={`mt-1 ${TEXT_LINK}`}>
              See every chapter title
            </a>
          </div>
        </div>

        {/* The perks with nothing more to draw, in one row: the plan is the
            coach report at the top of the page, and the other two are a
            limit lifted and a sync. */}
        <div className="mt-10 grid gap-x-8 gap-y-5 border-t border-line pt-8 sm:grid-cols-3 lg:mt-14">
          {(["coach", "songs", "history"] as const).map((id) => (
            <Claim key={id} id={id} compact />
          ))}
        </div>

        {cta && <div className="mt-8 flex flex-col items-start gap-3">{cta}</div>}
      </div>
    </section>
  );
}
