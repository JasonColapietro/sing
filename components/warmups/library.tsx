"use client";

import Link from "next/link";
import {
  EXERCISES,
  PRO_PACKS,
  TIER_LABELS,
  TIER_ORDER,
  computeRootLadder,
  estimateMinutes,
  type WarmupExercise,
  type WarmupTier,
} from "./exercises";
import type { ProgressState } from "@/lib/progress";
import { midiToLabel } from "@/lib/audio/notes";
import { MODE_LABELS } from "./prefs";
import { useIsPro } from "@/lib/pro";
import { Card, LinkButton, Pill, SectionLabel } from "@/components/ui";
import { FreeOnly } from "@/components/pro/gate";
import { ProChip, ProLockTag } from "@/components/pro/ui";
import { MicAlert } from "@/components/mic-alert";

const RECENT_WINDOW_MS = 3 * 24 * 3600 * 1000;

/** One line of orientation per tier. TIER_LABELS alone ("Tier 2 · Building")
 *  tells a first-time visitor nothing about who the tier is for. Each line
 *  describes the exercises actually filed under that tier below, so it stays
 *  checkable against the catalogue instead of reading like a brochure. */
const TIER_BLURBS: Record<WarmupTier, string> = {
  beginner:
    "Short ladders on hums and easy vowels. Start here if you have never warmed up on purpose.",
  intermediate:
    "Wider intervals, a minor ladder, and your first siren. The everyday middle of a practice session.",
  advanced:
    "A full-octave siren and clean sixth leaps, for a voice that is already moving freely.",
};

/**
 * The most recent session of this exercise inside the recency window, or
 * undefined. Sessions are stored newest-first, so `find` is the latest one;
 * a rung is recent whichever mode sang it, but the card says which.
 */
function latestRecentSession(ex: WarmupExercise, progress: ProgressState) {
  const now = Date.now();
  return progress.sessions.find(
    (s) =>
      s.type === "warmup" &&
      s.detail === ex.title &&
      now - new Date(s.date).getTime() <= RECENT_WINDOW_MS,
  );
}

export function Library({
  progress,
  onSelect,
  micReady,
  error,
  errorExerciseId,
}: {
  progress: ProgressState;
  onSelect: (ex: WarmupExercise) => void;
  /** False until mic permission lands. The cards look identical either way;
   *  only the announced description changes, so a screen reader user hears
   *  that the button asks for a microphone before they press it. */
  micReady: boolean;
  /** A mic failure that came from a card in here, or null when it came from
   *  the gate card above — which renders it itself. Only ever one of the two,
   *  so the failure is announced once. */
  error: string | null;
  /** Which card it came from. Pressing a card is the only way to set it, so it
   *  always names one that is on this page. */
  errorExerciseId: string | null;
}) {
  const isPro = useIsPro();

  const exerciseCard = (ex: WarmupExercise) => {
    const roots = computeRootLadder(ex, progress.range.lowMidi, progress.range.highMidi);
    const minutes = estimateMinutes(ex, roots.length);
    const recent = latestRecentSession(ex, progress);
    const failed = error !== null && errorExerciseId === ex.id;
    return (
      // The message goes under the button, not inside it: a card is a control,
      // and an alert nested in one is read out as part of its label. The
      // wrapper is the grid cell now, so `flex-1` is what carries the card's
      // full-height stretch down to it.
      <div key={ex.id} className="flex flex-col">
        <button
          type="button"
          onClick={() => onSelect(ex)}
          aria-describedby={micReady ? undefined : "warmups-mic-note"}
          className="flex-1 text-left"
        >
          <Card
            className={`h-full transition-colors hover:border-violet/40 ${
              failed ? "border-rec/50" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg">{ex.title}</h3>
              {recent && (
                <Pill tone="ok">
                  Done recently{recent.mode ? ` · ${MODE_LABELS[recent.mode]}` : ""}
                </Pill>
              )}
            </div>
            <p className="mt-2 text-sm text-mut">{ex.desc}</p>
            <div className="mt-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              <span>
                {roots.length > 1
                  ? `${midiToLabel(roots[0])}–${midiToLabel(roots[roots.length - 1])} ladder`
                  : `${midiToLabel(roots[0])} ladder`}
              </span>
              <span aria-hidden="true">·</span>
              <span>~{minutes} min per climb</span>
              {ex.glide && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Glide</span>
                </>
              )}
            </div>
          </Card>
        </button>
        {failed && <MicAlert message={error} className="mt-2 text-sm text-rec" />}
      </div>
    );
  };

  const hasRange = progress.range.lowMidi !== undefined && progress.range.highMidi !== undefined;

  return (
    <div className="space-y-8">
      {!hasRange && (
        <Card className="border-violet/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <SectionLabel>No range saved</SectionLabel>
              <p className="mt-2 max-w-md text-sm text-mut">
                Warmups default to a C3–G3 ladder. Take the range test and
                warmups auto-fit your voice.
              </p>
            </div>
            <LinkButton href="/range" variant="outline" size="sm">
              Take the range test
            </LinkButton>
          </div>
        </Card>
      )}

      {TIER_ORDER.map((tier) => {
        const exercises = EXERCISES.filter((e) => e.tier === tier);
        if (exercises.length === 0) return null;
        return (
          <section key={tier}>
            <div className="flex flex-wrap items-center gap-2">
              <SectionLabel>{TIER_LABELS[tier]}</SectionLabel>
              {/* Counted, never a literal, so the number cannot drift from the catalogue. */}
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                {exercises.length} exercises
              </span>
            </div>
            <p className="mt-2 max-w-xl text-sm text-mut">{TIER_BLURBS[tier]}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {exercises.map(exerciseCard)}
            </div>
          </section>
        );
      })}

      {isPro &&
        PRO_PACKS.map((pack) => (
          <section key={pack.id}>
            <div className="flex items-center gap-2">
              <SectionLabel>{pack.name}</SectionLabel>
              <ProChip />
            </div>
            <p className="mt-2 text-sm text-mut">{pack.desc}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pack.exercises.map(exerciseCard)}
            </div>
          </section>
        ))}

      <FreeOnly>
        <section>
          <div className="flex items-center gap-2">
            <SectionLabel>Pro packs</SectionLabel>
            <ProChip />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Rendered straight from PRO_PACKS, never a restated copy: a
                hand-kept teaser list is what let this card go on promising a
                "6-minute" Morning reset after the pack itself stopped. Only
                the names and descriptions cross the paywall — the exercises
                stay behind FreeOnly. */}
            {PRO_PACKS.map((pack) => (
              <Link key={pack.id} href="/pro">
                <Card className="h-full transition-colors hover:border-violet/40">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg">{pack.name}</h3>
                    <ProLockTag />
                  </div>
                  <p className="mt-2 text-sm text-mut">{pack.desc}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </FreeOnly>
    </div>
  );
}
