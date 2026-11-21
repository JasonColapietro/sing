"use client";

import Link from "next/link";
import { useId } from "react";
import type { ProgressState } from "@/lib/progress";
import { useIsPro } from "@/lib/pro";
import { midiToLabel } from "@/lib/audio/notes";
import { Card, Pill, SectionLabel } from "@/components/ui";
import { PRO_BUY_HREF, PRO_PRICE_ONCE, ProChip, ProLockTag, UNLOCK_PRO_PACKS } from "@/components/pro/ui";
import { NotPro } from "@/components/pro/gate";
import { MicAlert } from "@/components/mic-alert";
import {
  PathList,
  StarTrio,
  averageStars,
  bestScoreForExercise,
  starsForExercise,
  type PathLevel,
  type Stars,
} from "@/components/practice/learn-home";
import {
  EXERCISES,
  PRO_PACKS,
  TIER_LABELS,
  TIER_ORDER,
  computeRootLadder,
  estimateMinutes,
  type WarmupExercise,
} from "./exercises";
import { RangePrompt, TIER_BLURBS, latestRecentSession } from "./library";
import {
  PRO_ROUTINES,
  ROUTINES,
  routineMinutes,
  stepExercise,
  type Routine,
} from "./routines";
import { PRO_PACKS_ANCHOR } from "@/lib/pro-inventory";
import { PatternGlyph, patternShape } from "./pattern-glyph";

/** How many exercise names the strip under a routine shows before "+N". */
const STRIP_MAX = 3;

/**
 * What the singer has already done with a routine: stars averaged over its
 * steps, and the mean of their best scores. Both read the same warmup log the
 * path rows read, so a routine card and the exercises inside it can never
 * disagree about how well it has gone.
 */
export function routineStats(
  progress: ProgressState,
  routine: Routine,
): { stars: Stars; best: number | null } {
  const titles = routine.steps.map((s) => stepExercise(s).title);
  const stars = averageStars(titles.map((t) => starsForExercise(progress, t)));
  const bests = titles
    .map((t) => bestScoreForExercise(progress, t))
    .filter((b): b is number => b !== null);
  const best =
    bests.length > 0 ? Math.round(bests.reduce((a, b) => a + b, 0) / bests.length) : null;
  return { stars, best };
}

function StepStrip({ routine, max = STRIP_MAX }: { routine: Routine; max?: number }) {
  const exercises = routine.steps.map(stepExercise);
  const shown = exercises.slice(0, max);
  const more = exercises.length - shown.length;
  return (
    // Desktop only: on a phone the cards ran long with this strip.
    <ol className="mt-4 hidden flex-wrap gap-1.5 sm:flex" aria-label="Exercises in this routine">
      {shown.map((ex, i) => (
        <li key={`${ex.id}-${i}`}>
          <Pill tone="mut">
            <PatternGlyph shape={patternShape(ex)} className="h-4 w-4" />
            {ex.title}
          </Pill>
        </li>
      ))}
      {more > 0 && (
        <li>
          <Pill tone="mut">+{more} more</Pill>
        </li>
      )}
    </ol>
  );
}

/** The mono meta line a routine card and the continue card share. */
export function RoutineMeta({ routine }: { routine: Routine }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
      {routine.steps.length} exercises
      <span className="mx-2 text-line2">·</span>~{routineMinutes(routine)} min
      <span className="mx-2 text-line2">·</span>Scored as you sing
    </p>
  );
}

/**
 * The routine grid: every routine, the free ones then the Pro packs. Pro cards are
 * rendered from PRO_ROUTINES either way; for a free singer each one is a link
 * to the buy card instead of a start button, and the exercises inside stay
 * behind the paywall in the player.
 *
 * The price is said once, in a line above the packs (PacksAsk), not on every
 * card: eight identical priced links were noise, and because the grid is
 * prerendered as "not Pro" they were also on a Pro owner's screen until
 * hydration took them away and every card below them moved.
 */
export function RoutineGrid({
  progress,
  onStart,
  error,
  errorRoutineId,
  unavailableReason,
}: {
  progress: ProgressState;
  onStart: (routine: Routine) => void;
  error: string | null;
  errorRoutineId: string | null;
  unavailableReason?: string;
}) {
  const isPro = useIsPro();
  const unavailableId = useId();

  const card = (routine: Routine) => {
    const locked = routine.pro && !isPro;
    const failed = error !== null && errorRoutineId === routine.id;
    const { stars, best } = routineStats(progress, routine);
    const body = (
      <Card tone={!locked && unavailableReason ? "flat" : "raised"} className={`h-full ${failed ? "border-rec/50" : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg">{routine.name}</h3>
          {routine.pro ? locked ? <ProLockTag /> : <ProChip /> : null}
        </div>
        <p className="mt-2 text-sm text-mut">{routine.tagline}</p>
        <div className="mt-3 flex items-center gap-2">
          <StarTrio stars={stars} />
          <span className="tabular font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            {best === null ? "Not played yet" : `Best ${best}%`}
          </span>
        </div>
        <div className="mt-4">
          <RoutineMeta routine={routine} />
        </div>
        <StepStrip routine={routine} />
      </Card>
    );
    return (
      // The first Pro pack carries the anchor /pro links to after a purchase,
      // so "Sing your first pro warmup" lands on the packs, not a free set.
      <div
        key={routine.id}
        id={routine.id === PRO_ROUTINES[0]?.id ? PRO_PACKS_ANCHOR : undefined}
        className="flex scroll-mt-20 flex-col"
      >
        {locked ? (
          // The whole card is the link, and its name says what the tap is
          // for: the pack, that Pro unlocks it, and the price. The name
          // starts with the visible heading (WCAG 2.5.3).
          <Link
            href={PRO_BUY_HREF}
            aria-label={lockedPackLabel(routine)}
            className="flex-1 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-ink"
          >
            {body}
          </Link>
        ) : (
          <button type="button" onClick={() => onStart(routine)}
            disabled={Boolean(unavailableReason)} aria-describedby={unavailableReason ? unavailableId : undefined}
            className="flex-1 text-left disabled:cursor-not-allowed disabled:opacity-50">
            {body}
          </button>
        )}
        {failed && <MicAlert message={error} className="mt-2 text-sm text-rec" />}
      </div>
    );
  };

  return (
    <section>
      <div className="flex flex-wrap items-center gap-2">
        <SectionLabel heading>Warmup routines</SectionLabel>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          {unavailableReason ? "Routines for your next practice" : "Pick a length, press start"}
        </span>
      </div>
      {unavailableReason && <p id={unavailableId} className="mt-3 text-sm text-mut">{unavailableReason}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROUTINES.map(card)}
        <PacksAsk />
        {PRO_ROUTINES.map(card)}
      </div>
    </section>
  );
}

/** A locked pack card's accessible name: the pack, what unlocks it, the price. */
export function lockedPackLabel(routine: Routine): string {
  return `${routine.name}: unlocks with Pro, ${PRO_PRICE_ONCE}`;
}

/**
 * The one priced line above the pro packs, across the whole grid row. In the
 * server HTML for everyone and behind the pre-paint "not-pro" marker
 * (NotPro, components/pro/gate.tsx), so a Pro owner's first paint never has
 * it and taking it away at hydration moves nothing.
 */
function PacksAsk() {
  return (
    <NotPro as="p" className="col-span-full flex flex-wrap items-center gap-x-2 text-sm text-mut">
      <span>The {PRO_ROUTINES.length} packs below open with Pro.</span>
      <Link
        href={PRO_BUY_HREF}
        className="inline-flex min-h-11 items-center font-medium text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet"
      >
        {UNLOCK_PRO_PACKS}
      </Link>
    </NotPro>
  );
}

/** The path: tiers as levels, one row per exercise; a free singer sees the Pro packs as one locked level naming only the packs. */
export function PathSection({
  progress,
  onSelect,
  micReady,
  error,
  errorExerciseId,
  unavailableReason,
  recovering = null,
}: {
  progress: ProgressState;
  onSelect: (ex: WarmupExercise) => void;
  /** False until mic permission lands: only the announced description changes,
   *  so a screen reader user hears that the row asks for a microphone. */
  micReady: boolean;
  /** A mic failure that came from a row in here, or null when it came from the
   *  gate card above — which renders it itself. */
  error: string | null;
  errorExerciseId: string | null;
  unavailableReason?: string;
  /** Recovery week's name while it runs, or null: the no-range prompt then offers no test (RangePrompt). */
  recovering?: string | null;
}) {
  const isPro = useIsPro();

  const row = (ex: WarmupExercise) => {
    const roots = computeRootLadder(ex, progress.range.lowMidi, progress.range.highMidi);
    const ladder =
      roots.length > 1
        ? `${midiToLabel(roots[0])}–${midiToLabel(roots[roots.length - 1])} ladder`
        : `${midiToLabel(roots[0])} ladder`;
    return {
      id: ex.id,
      title: ex.title,
      figure: <PatternGlyph shape={patternShape(ex)} />,
      meta: `${ladder} · ~${estimateMinutes(ex, roots.length)} min${ex.glide ? " · Glide" : ""}`,
      stars: starsForExercise(progress, ex.title),
      mic: !micReady,
      recent: latestRecentSession(ex, progress) !== undefined,
      onSelect: () => onSelect(ex),
      error: error !== null && errorExerciseId === ex.id ? error : null,
    };
  };

  const levels: PathLevel[] = TIER_ORDER.map((tier) => ({
    title: TIER_LABELS[tier],
    blurb: TIER_BLURBS[tier],
    items: EXERCISES.filter((e) => e.tier === tier).map(row),
  })).filter((l) => l.items.length > 0);

  if (isPro) {
    for (const pack of PRO_PACKS) {
      levels.push({ title: pack.name, blurb: pack.desc, items: pack.exercises.map(row) });
    }
  } else {
    levels.push({
      title: "Pro packs",
      blurb: "Themed sets that pick up where the path ends.",
      // Each row is a whole pack, not an exercise: "0 of 8 exercises" would
      // count the packs as if each were one exercise.
      unit: "packs",
      items: PRO_PACKS.map((pack) => ({
        id: pack.id,
        title: pack.name,
        desc: pack.desc,
        stars: 0 as Stars,
        locked: true,
        href: PRO_BUY_HREF,
      })),
    });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <SectionLabel>Path</SectionLabel>
        <span className="text-sm text-mut">
          Every exercise on its own, as an endless ladder. Stars are your best
          score so far.
        </span>
      </div>
      <RangePrompt progress={progress} recovering={recovering} />
      <PathList levels={levels} unavailableReason={unavailableReason} />
    </section>
  );
}
