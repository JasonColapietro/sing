"use client";

import {
  EXERCISES,
  TIER_LABELS,
  TIER_ORDER,
  computeRootLadder,
  estimateMinutes,
  type WarmupExercise,
} from "./exercises";
import type { ProgressState } from "@/lib/progress";
import { Card, LinkButton, Pill, SectionLabel } from "@/components/ui";

const RECENT_WINDOW_MS = 3 * 24 * 3600 * 1000;

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
}: {
  progress: ProgressState;
  onSelect: (ex: WarmupExercise) => void;
}) {
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
            <SectionLabel>{TIER_LABELS[tier]}</SectionLabel>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {exercises.map((ex) => {
                const roots = computeRootLadder(ex, progress.range.lowMidi, progress.range.highMidi);
                const minutes = estimateMinutes(ex, roots.length);
                const recent = isRecentlyDone(ex, progress);
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => onSelect(ex)}
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
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
