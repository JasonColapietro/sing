"use client";

import Link from "next/link";
import type { ProgressState } from "@/lib/progress";
import { useIsPro } from "@/lib/pro";
import { midiToLabel } from "@/lib/audio/notes";
import { Card, Pill, SectionLabel } from "@/components/ui";
import { ProChip, ProLockTag } from "@/components/pro/ui";
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
  const titles = routine.steps.map((s) => stepExercise(s).title);
  const shown = titles.slice(0, max);
  const more = titles.length - shown.length;
  return (
    <ol className="mt-4 flex flex-wrap gap-1.5" aria-label="Exercises in this routine">
      {shown.map((t, i) => (
        <li key={`${t}-${i}`}>
          <Pill tone="mut">{t}</Pill>
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
 * The workouts: every routine, the free ones then the Pro packs. Pro cards are
 * rendered from PRO_ROUTINES either way; for a free singer they link to /pro
 * instead of starting, and the exercises inside stay behind the paywall in the
 * player.
 */
export function RoutineGrid({
  progress,
  onStart,
  error,
  errorRoutineId,
}: {
  progress: ProgressState;
  onStart: (routine: Routine) => void;
  error: string | null;
  errorRoutineId: string | null;
}) {
  const isPro = useIsPro();

  const card = (routine: Routine) => {
    const locked = routine.pro && !isPro;
    const failed = error !== null && errorRoutineId === routine.id;
    const { stars, best } = routineStats(progress, routine);
    const body = (
      <Card tone="raised" className={`h-full ${failed ? "border-rec/50" : ""}`}>
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
      <div key={routine.id} className="flex flex-col">
        {locked ? (
          <Link href="/pro" className="flex-1">
            {body}
          </Link>
        ) : (
          <button type="button" onClick={() => onStart(routine)} className="flex-1 text-left">
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
        <SectionLabel>Routines</SectionLabel>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          Pick a length, press start
        </span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROUTINES.map(card)}
        {PRO_ROUTINES.map(card)}
      </div>
    </section>
  );
}

/**
 * The path: the tiers as levels, one row per exercise, the stars it has
 * earned, and a Next pill on the first rung still without one.
 *
 * A free singer sees the Pro packs as one locked level naming the packs, not
 * their exercises — the pack names and descriptions are all that has ever
 * crossed the paywall, and listing the drills inside would be the leak.
 */
export function PathSection({
  progress,
  onSelect,
  micReady,
  error,
  errorExerciseId,
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
      items: PRO_PACKS.map((pack) => ({
        id: pack.id,
        title: pack.name,
        desc: pack.desc,
        stars: 0 as Stars,
        locked: true,
        href: "/pro",
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
      <RangePrompt progress={progress} />
      <PathList levels={levels} />
    </section>
  );
}
