"use client";

import { useMemo, type ReactNode } from "react";
import { SectionLabel } from "@/components/ui";
import { useHydrated } from "@/components/prepaint";
import { NoteAccuracyChart, RangeHistoryChart } from "@/components/progress/pro-charts";
import {
  aggregateNotes,
  noteReports,
  rangeSeries,
  type NoteTallies,
  type RangeEntry,
} from "@/lib/analytics";
import { PRO_SHOWCASE_ANCHOR } from "@/lib/pro-inventory";
import {
  SAMPLE_ACCURACY,
  SAMPLE_DATA_LABEL,
  SAMPLE_NOTE_TALLIES,
  SAMPLE_RANGE,
  SAMPLE_RANGE_HISTORY,
  SAMPLE_WEAK_NOTE,
} from "@/lib/pro-sample";
import { useProgress } from "@/lib/progress";
import { Claim } from "./claim";
import { TAKE_SAMPLE_READING, TakeSample } from "./take-sample";
import { ProChip } from "./ui";

/**
 * "What Pro adds" on /pro, shown rather than listed: the two real charts and
 * the take drawing, between the hero and the buy card. The other perks (the
 * pack card, the books, the plan, songs and sync) are drawn once, under the
 * card, in components/pro/unlock-stack.tsx.
 *
 * Public surface: `ProShowcase({ owned, own, cta })`, `useOwnVoice()`,
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
 * - The charts are drawn `compact` (components/progress/pro-charts.tsx): a
 *   frame here is about a phone wide at every breakpoint, and the compact
 *   drawing keeps its axis text at 10px or more there.
 * - Every claim sentence is a PRO_PERKS row (components/pro/claim.tsx).
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

/** The take frame's line above its drawing: the recorder's locked panel and the landing say the same of it. */
export const TAKES_LINE = "The pitch line of each take, and two takes overlaid.";

/** The sample's dates are in the server HTML, so their format cannot follow the reader. */
const SAMPLE_DATES = { locale: "en-US", timeZone: "UTC" };

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

/** A frame's title bar: what the exhibit is, and that it is Pro's. */
function FrameHead({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-line bg-panel2/60 px-4 py-2.5">
      <h4 className="font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-mut">
        {title}
      </h4>
      <ProChip />
    </div>
  );
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
      <FrameHead title={title} />
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

export function ProShowcase({
  owned,
  own,
  cta,
}: {
  /** Pro is on in this browser: the visitor's own charts are drawn plainly. */
  owned: boolean;
  /** The visitor's own chart data (`useOwnVoice`), called once by the page, which words its jump link from it too. */
  own: OwnVoice;
  /** An owner's way on from here. A free visitor is sold nothing in this section. */
  cta?: ReactNode;
}) {
  const notesOwn = own.tallies !== null;
  const rangeOwn = own.history !== null;
  return (
    <section id={PRO_SHOWCASE_ANCHOR} className="scroll-mt-20 border-t border-line">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <SectionLabel hairline className="mb-4">What Pro adds</SectionLabel>
        <h2 className="max-w-2xl text-2xl sm:text-3xl">
          The coach&apos;s full plan, and the charts behind it
        </h2>

        {/* One grid, three exhibits. A phone reads it top to bottom: the
            analytics claim, its two charts, the takes claim, its drawing. From
            xl the claims are the first row and the three frames the second,
            so no claim sits alone beside a wide exhibit. Between, the charts
            pair up and the take drawing runs under them. Every frame is about
            a phone wide at each of those, which is what the compact charts
            are drawn for. */}
        <div className="mt-6 grid gap-x-4 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
          <Claim id="analytics" className="md:col-span-2 xl:row-start-1" />
          <div className="xl:row-start-2">
            <ChartFrame
              title="Accuracy by note"
              label={notesOwn ? (owned ? `${OWN_DATA_LABEL}.` : OWN_DATA_PREVIEW) : SAMPLE_NOTES_LABEL}
              faded={notesOwn && !owned}
            >
              {own.tallies ? (
                <NoteAccuracyChart tallies={own.tallies} compact />
              ) : (
                <SampleChart name={SAMPLE_NOTES_NAME} caption={SAMPLE_NOTES_CAPTION}>
                  <NoteAccuracyChart tallies={SAMPLE_NOTE_TALLIES} compact />
                </SampleChart>
              )}
            </ChartFrame>
          </div>
          <div className="xl:row-start-2">
            <ChartFrame
              title="Range over time"
              label={rangeOwn ? (owned ? `${OWN_DATA_LABEL}.` : OWN_DATA_PREVIEW) : SAMPLE_RANGE_LABEL}
              faded={rangeOwn && !owned}
            >
              {own.history ? (
                <RangeHistoryChart history={own.history} compact />
              ) : (
                <SampleChart name={SAMPLE_RANGE_NAME} caption={SAMPLE_RANGE_CAPTION}>
                  <RangeHistoryChart history={SAMPLE_RANGE_HISTORY} dateFormat={SAMPLE_DATES} compact />
                </SampleChart>
              )}
            </ChartFrame>
          </div>
          <Claim id="takes" className="mt-4 md:col-span-2 xl:col-span-1 xl:col-start-3 xl:row-start-1 xl:mt-0" />
          {/* Take analysis: a drawing, labelled as a sample by TakeSample. */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-panel md:col-span-2 xl:col-span-1 xl:col-start-3 xl:row-start-2">
            <FrameHead title="Two takes, overlaid" />
            {/* The chart frames' shape: a line above the exhibit, a caption
                under it. Centred alone, the drawing (it stops at 21rem) sat
                in about 140px of blank beside the two charts at xl. */}
            <p className="min-h-12 px-4 pt-3 text-xs leading-4 text-mut sm:px-5">{TAKES_LINE}</p>
            <div className="flex grow flex-col px-4 pb-4 sm:px-5">
              <TakeSample />
              <p className="mt-2 text-xs text-mut">{TAKE_SAMPLE_READING}</p>
            </div>
          </div>
        </div>

        {/* A free visitor reads on into the buy card; the rest of what Pro
            opens (packs, books, sync) is drawn once, in the unlock stack
            under it, and the card's list names it in between. */}
        {cta && <div className="mt-8 flex flex-col items-start gap-3">{cta}</div>}
      </div>
    </section>
  );
}
