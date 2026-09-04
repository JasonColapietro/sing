"use client";

import { titlesFor } from "@/components/practice/learn-home";

import type { ProgressState, SessionLog } from "@/lib/progress";
import { Card, LinkButton, SectionLabel } from "@/components/ui";
import type { WarmupExercise, WarmupTier } from "./exercises";

/**
 * What is left of the old catalogue.
 *
 * This file used to render every exercise as a card in a tier-by-tier grid,
 * collapsed behind a disclosure at the bottom of the room. The catalogue is now
 * the learning path on the room's home — rows, in order, with the stars each
 * exercise has earned — so only the two things the grid knew that the path
 * still needs live here: what each tier is for, and when an exercise was last
 * sung.
 */

/** One line of orientation per tier. TIER_LABELS alone ("Tier 2 · Building")
 *  tells a first-time visitor nothing about who the tier is for. Each line
 *  describes the exercises actually filed under that tier, so it stays
 *  checkable against the catalogue instead of reading like a brochure. */
export const TIER_BLURBS: Record<WarmupTier, string> = {
  beginner:
    "Hums, the bubble, the straw and a slow hoo. Start here if you have never warmed up on purpose.",
  intermediate:
    "Wider intervals, a minor ladder, and your first siren. The everyday middle of a practice session.",
  advanced:
    "A full-octave siren and clean sixth leaps, for a voice that is already moving freely.",
};

const RECENT_WINDOW_MS = 3 * 24 * 3600 * 1000;

/**
 * The most recent session of this exercise inside the recency window, or
 * undefined. Sessions are stored newest-first, so `find` is the latest one;
 * a rung is recent whichever mode sang it.
 */
export function latestRecentSession(
  ex: WarmupExercise,
  progress: ProgressState,
  now = Date.now(),
): SessionLog | undefined {
  const titles = titlesFor(ex.title);
  return progress.sessions.find(
    (s) =>
      s.type === "warmup" &&
      s.detail !== undefined &&
      titles.includes(s.detail) &&
      now - new Date(s.date).getTime() <= RECENT_WINDOW_MS,
  );
}

/**
 * Shown above the path when no range test has been taken: every ladder falls
 * back to C3–G3 until one has, which fits almost nobody.
 */
export function RangePrompt({ progress }: { progress: ProgressState }) {
  const hasRange =
    progress.range.lowMidi !== undefined && progress.range.highMidi !== undefined;
  if (hasRange) return null;
  return (
    <Card className="border-violet/30">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <SectionLabel>No range saved</SectionLabel>
          <p className="mt-2 max-w-md text-sm text-mut">
            Warmups default to a C3–G3 ladder. Take the range test and warmups
            auto-fit your voice.
          </p>
        </div>
        <LinkButton href="/range" variant="outline" size="sm">
          Take the range test
        </LinkButton>
      </div>
    </Card>
  );
}
