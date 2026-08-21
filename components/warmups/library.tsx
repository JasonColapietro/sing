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
import { useIsPro } from "@/lib/pro";
import { Card, LinkButton, Pill, SectionLabel } from "@/components/ui";
import { FreeOnly } from "@/components/pro/gate";
import { ProChip, ProLockTag } from "@/components/pro/ui";

const RECENT_WINDOW_MS = 3 * 24 * 3600 * 1000;

/** What free users see of the packs; copy mirrors the real content above. */
const PACK_TEASERS = [
  { name: "Belt prep", desc: "Chest-voice power without strain, 8 exercises." },
  { name: "Head-voice builder", desc: "Light, connected top notes, 7 exercises." },
  { name: "Morning reset", desc: "A gentle 6-minute wake-up for rough days." },
];

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

function isRecentlyDone(ex: WarmupExercise, progress: ProgressState): boolean {
  const now = Date.now();
  return progress.sessions.some(
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
}: {
  progress: ProgressState;
  onSelect: (ex: WarmupExercise) => void;
  /** False until mic permission lands. The cards look identical either way;
   *  only the announced description changes, so a screen reader user hears
   *  that the button asks for a microphone before they press it. */
  micReady: boolean;
}) {
  const isPro = useIsPro();

  const exerciseCard = (ex: WarmupExercise) => {
    const roots = computeRootLadder(ex, progress.range.lowMidi, progress.range.highMidi);
    const minutes = estimateMinutes(ex, roots.length);
    const recent = isRecentlyDone(ex, progress);
    return (
      <button
        key={ex.id}
        type="button"
        onClick={() => onSelect(ex)}
        aria-describedby={micReady ? undefined : "warmups-mic-note"}
        className="text-left"
      >
        <Card className="h-full transition-colors hover:border-amber/40">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg">{ex.title}</h3>
            {recent && <Pill tone="ok">Done recently</Pill>}
          </div>
          <p className="mt-2 text-sm text-mut">{ex.desc}</p>
          <div className="mt-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            <span>{roots.length} reps</span>
            <span aria-hidden="true">·</span>
            <span>~{minutes} min</span>
            {ex.glide && (
              <>
                <span aria-hidden="true">·</span>
                <span>Glide</span>
              </>
            )}
          </div>
        </Card>
      </button>
    );
  };

  const hasRange = progress.range.lowMidi !== undefined && progress.range.highMidi !== undefined;

  return (
    <div className="space-y-8">
      {!hasRange && (
        <Card className="border-amber/30">
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
            {PACK_TEASERS.map((pack) => (
              <Link key={pack.name} href="/pro">
                <Card className="h-full transition-colors hover:border-amber/40">
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
