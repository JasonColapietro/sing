"use client";

import { useMemo } from "react";
import { EXERCISES } from "./exercises";
import { Button, Card, Pill, ProgressBar, SectionLabel, Stat } from "@/components/ui";
import { midiToLabel } from "@/lib/audio/notes";
import type { SessionSummaryData } from "./lib";

function scoreTone(score: number): "ok" | "amber" | "rec" {
  if (score >= 80) return "ok";
  if (score >= 50) return "amber";
  return "rec";
}

export function SessionSummary({
  data,
  onNext,
  onLibrary,
}: {
  data: SessionSummaryData;
  onNext: (id: string) => void;
  onLibrary: () => void;
}) {
  const { ex, results, avgScore, best, xpGained, newAchievements } = data;

  const nextEx = useMemo(() => {
    const idx = EXERCISES.findIndex((e) => e.id === ex.id);
    if (idx < 0) return EXERCISES[0];
    return EXERCISES[(idx + 1) % EXERCISES.length];
  }, [ex.id]);

  return (
    <div className="space-y-6">
      <Card>
        <SectionLabel>Session complete</SectionLabel>
        <h2 className="mt-3 text-2xl">{ex.title}</h2>
        <div className="mt-6 flex flex-wrap gap-10">
          <Stat label="Average score" value={`${avgScore}%`} tone={scoreTone(avgScore)} />
          <Stat
            label="Best rep"
            value={best ? `${best.score}%` : "—"}
            sub={best ? midiToLabel(best.root) : undefined}
            tone="cool"
          />
          <Stat label="Reps" value={results.length} tone="ink" />
        </div>

        <div className="mt-6 space-y-2">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Per-rep score
          </div>
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="tabular w-8 shrink-0 font-mono text-xs text-dim">
                {i + 1}
              </span>
              <span className="tabular w-12 shrink-0 font-mono text-xs text-mut">
                {midiToLabel(r.root)}
              </span>
              <ProgressBar value={r.score} tone={scoreTone(r.score)} className="flex-1" />
              <span className="tabular w-12 shrink-0 text-right font-mono text-xs">
                {r.skipped ? "skip" : `${r.score}%`}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-ok/30">
        <div className="flex flex-wrap items-center gap-3">
          <Pill tone="ok">Saved to your progress</Pill>
          <span className="tabular font-mono text-sm text-ok">+{xpGained} XP</span>
        </div>
        {newAchievements.length > 0 && (
          <ul className="mt-4 space-y-2">
            {newAchievements.map((a) => (
              <li key={a.id} className="flex items-center gap-3 text-sm">
                <span aria-hidden="true">{a.icon}</span>
                <span className="font-medium">{a.title}</span>
                <span className="text-mut">{a.desc}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <SectionLabel>Keep going</SectionLabel>
        <h3 className="mt-3 text-lg">
          Next up: <span className="text-amber">{nextEx.title}</span>
        </h3>
        <p className="mt-1.5 max-w-md text-sm text-mut">{nextEx.desc}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="amber" onClick={() => onNext(nextEx.id)}>
            Next exercise
          </Button>
          <Button variant="outline" onClick={onLibrary}>
            Back to library
          </Button>
        </div>
      </Card>
    </div>
  );
}
