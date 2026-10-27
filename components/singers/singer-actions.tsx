"use client";

import Link from "next/link";
import { midiToLabel } from "@/lib/audio/notes";
import { playTone } from "@/lib/audio/synth";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import { useIsPro } from "@/lib/pro";
import { useProgress } from "@/lib/progress";
import { rangeOverlap, spanOctaves } from "@/lib/singers-core";
import type { Singer } from "@/lib/singers-data";
import { rangeTestHref } from "@/lib/site";
import { Button, Card, LinkButton, SectionLabel, jumpInPage } from "@/components/ui";
import { ProInlineNudge } from "@/components/pro/gate";

/**
 * The four fields these client components use. A page passes exactly these,
 * never the whole record: everything handed to a client component is
 * serialized into the page's flight payload, and a full Singer carries the
 * blurb and technique notes that are the paid atlas's entry prose.
 */
export type SingerRangeProps = Pick<Singer, "slug" | "name" | "lowMidi" | "highMidi">;

/** Low → glide → high, same gesture as the range-test result card. */
export function PlayRangeButton({ s }: { s: Pick<Singer, "lowMidi" | "highMidi"> }) {
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
 * The header action's labels: the server's (no saved range) and the one that
 * replaces it once a saved range hydrates, for each kind of singer page, and
 * the width both share. "compare" is the comparison-search CTR pilot's
 * wording (COMPARISON_SEARCH_SLUGS on the singer page); "test" is every other
 * profile.
 *
 * The swap happens after the server HTML has painted, beside "← All singers",
 * so the two labels of a pair must take the same room. Unequal labels moved
 * the page: "See how your range compares ↓" (256px) beside "Test my range →"
 * (151px) wrapped "← All singers" onto a second line at every phone width
 * from 320 to 424 and dropped the actions under the title at 1024–1128, a
 * 52–60px shift of the whole page for every returning singer; a shorter
 * label unwrapped rows the other way. A shared min-width holds both labels
 * of a pair at one width, measured against the built page from 300 to 1280px
 * with no change in the header's height.
 */
const RANGE_ACTIONS = {
  test: {
    label: "Test my range →",
    saved: "See the overlap ↓",
    width: "min-w-[10rem]",
  },
  compare: {
    label: "Compare my range — free test →",
    saved: "See how your range compares ↓",
    width: "min-w-[16.5rem]",
  },
} as const;

export type SingerRangeActionKind = keyof typeof RANGE_ACTIONS;

/**
 * The header action on a singer page, where a phone sees it on the first
 * screen. With no saved range it starts the test, told which singer to come
 * back to; with one it points at the comparison below, which sits about a
 * screen and a half down. Before this, a singer back from the test met
 * "Test my range →" again, pointing them at the test they had just taken.
 * The server HTML (no saved range) keeps the range-test link.
 */
export function SingerRangeAction({
  s,
  kind,
}: {
  s: SingerRangeProps;
  kind: SingerRangeActionKind;
}) {
  const { range } = useProgress();
  const { label, saved, width } = RANGE_ACTIONS[kind];
  if (range.lowMidi === undefined || range.highMidi === undefined) {
    return (
      <LinkButton href={rangeTestHref({ compare: s.slug })} size="md" className={width}>
        {label}
      </LinkButton>
    );
  }
  // `#you-vs` is the wrapper around CompareWithMe on the singer page. Not a
  // shared constant: a server page importing a value from this client module
  // would get a client reference, not the string. A plain anchor with the
  // history repair (jumpInPage in components/ui.tsx): next/link makes no
  // navigation once the address already ends in #you-vs, so a second tap did
  // nothing, and its scripted scroll left the Tab starting point at the top.
  return (
    <LinkButton
      href="#you-vs"
      fullLoad
      onClick={jumpInPage}
      variant="outline"
      size="md"
      className={width}
    >
      {saved}
    </LinkButton>
  );
}

/**
 * Compares the visitor's measured range (from the free range test, stored
 * locally) against this singer's cited range.
 */
export function CompareWithMe({ s }: { s: SingerRangeProps }) {
  const { range } = useProgress();
  // The free plan keeps only the latest test; range over time is Pro
  // (PLAN_ROWS "Range history"), so the link names what each plan will find.
  const isPro = useIsPro();
  const youLow = range.lowMidi;
  const youHigh = range.highMidi;

  if (youLow === undefined || youHigh === undefined) {
    return (
      <Card className="border-violet/40">
        <SectionLabel>You vs {s.name}</SectionLabel>
        <h2 className="mt-3 text-xl">Can you sing it?</h2>
        <p className="mt-3 max-w-xl text-sm text-mut">
          Take the{" "}
          <Link
            href={rangeTestHref({ compare: s.slug })}
            className="text-ink underline decoration-line underline-offset-2 hover:text-violet-ink"
          >
            free 2-minute range test
          </Link>{" "}
          — your mic finds your lowest and
          highest notes, then compare your measured notes with {s.name}&rsquo;s
          reported reference span. Matching endpoints does not establish the same
          voice type or technique.
        </p>
        {/* The header's "Test my range →" is this card's action; the button
            that repeated it a screen below is gone, and the prose link keeps
            the card's own way into the test (the September 27 funnel audit).
            This is the one Pro line on a singer page until a range is saved;
            the saved-range branch below carries its own, so the two never
            render together. Self-hides for Pro. */}
        <div className="mt-4">
          <ProInlineNudge>Pro charts your range tests over time and removes the guided-practice limit</ProInlineNudge>
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
      cls: "bg-violet",
      text: "text-violet-ink font-semibold",
    },
  ];

  return (
    <Card>
      <SectionLabel>You vs {s.name}</SectionLabel>
      <h2 className="mt-3 text-xl">
        Your range covers{" "}
        <span className="text-violet-ink">{coverage}%</span> of {s.name}
        &rsquo;s reported span
      </h2>
      <p className="mt-2 text-sm text-mut">
        {overlap} of {singerSpan} semitones overlap. Your {midiToLabel(youLow)}
        –{midiToLabel(youHigh)} ({spanOctaves(youHigh - youLow)} oct) against
        the cited {midiToLabel(s.lowMidi)}–{midiToLabel(s.highMidi)} (
        {spanOctaves(singerSpan)} oct).
      </p>
      <p className="mt-2 max-w-2xl text-sm text-mut">
        A catalog comparison, not a training target. Use comfortable, repeatable
        notes; matching these endpoints does not establish the same voice type
        or technique.
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
          Practice in your comfortable range
        </LinkButton>
        <LinkButton href="/songs" variant="ghost" size="sm">
          Practice songs in your range
        </LinkButton>
        <Link
          href="/progress"
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-mut underline decoration-line underline-offset-2 hover:text-ink"
        >
          {isPro ? "Your range history" : "Your saved range"}
        </Link>
        <Link
          href={rangeTestHref({ compare: s.slug })}
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-mut underline decoration-line underline-offset-2 hover:text-ink"
        >
          Retake the range test
        </Link>
      </div>
      {/* The ~636 singer pages are where search traffic lands; this is the one
          Pro line on them, and only after the visitor has a measured range to
          compare — value first, pitch second. Both links above lead into
          capped guided practice, so the line names the free allowance too.
          The free plan already gets the coach's first two steps a day
          (PLAN_ROWS "Coach plan"), so Pro is credited with the full plan, not
          with the coach itself. Self-hides for Pro. */}
      <div className="mt-4">
        <ProInlineNudge>{`Guided practice is ${FREE_DAILY_MINUTES} free minutes a day; Pro removes the limit and unlocks the full coach plan`}</ProInlineNudge>
      </div>
    </Card>
  );
}
