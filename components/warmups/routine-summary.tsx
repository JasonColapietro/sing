"use client";

import { useMemo } from "react";
import { Button, Card, Pill, ProgressBar, SectionLabel, Stat } from "@/components/ui";
import { ProCrescendoNudge } from "@/components/pro/gate";
import { useProgress, type Achievement } from "@/lib/progress";
import { gradeForScore, starGlyphs, starRatingLabel, type Tone } from "@/components/songs/grade";
import { ShareableResult } from "@/components/songs/result-card";
import type { RoutineSummaryData } from "./routine-runner";
import { routineMinutes, stepExercise } from "./routines";
import { IconPlay } from "./icons";

const TONE_TEXT: Record<Tone, string> = {
  ok: "text-ok-ink",
  violet: "text-violet-ink",
  rec: "text-rec",
};

function scoreTone(score: number): "ok" | "violet" | "rec" {
  if (score >= 80) return "ok";
  if (score >= 50) return "violet";
  return "rec";
}

/**
 * The end of a routine. Every step already logged its own warmup session on
 * the way through, so nothing is written here: this reads the step summaries
 * back as one page — the overall grade, the XP the steps earned between them,
 * one row per exercise, and the streak the session just extended.
 */
export function RoutineSummary({
  data,
  onRepeat,
  onHome,
}: {
  data: RoutineSummaryData;
  onRepeat: () => void;
  onHome: () => void;
}) {
  const { routine, steps, completed } = data;
  const progress = useProgress();

  const { sung, avgScore, xp, achievements } = useMemo(() => {
    const sung = steps.filter((s): s is NonNullable<typeof s> => s !== null);
    const avgScore =
      sung.length > 0
        ? Math.round(sung.reduce((a, s) => a + s.avgScore, 0) / sung.length)
        : 0;
    const xp = sung.reduce((a, s) => a + s.xpGained, 0);
    const seen = new Set<string>();
    const achievements: Achievement[] = [];
    for (const s of sung) {
      for (const a of s.newAchievements) {
        if (seen.has(a.id)) continue;
        seen.add(a.id);
        achievements.push(a);
      }
    }
    return { sung, avgScore, xp, achievements };
  }, [steps]);

  const grade = sung.length > 0 ? gradeForScore(avgScore) : null;
  const streak = progress.streak.current;

  return (
    <div className="space-y-6">
      <Card>
        <SectionLabel>{completed ? "Routine complete" : "Routine ended early"}</SectionLabel>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h2 className="text-2xl">{routine.name}</h2>
          <Pill tone="mut">
            {sung.length} of {routine.steps.length} exercises sung
          </Pill>
        </div>
        <div className="mt-6 flex flex-wrap gap-10">
          <Stat
            label="Average score"
            value={sung.length > 0 ? `${avgScore}%` : "—"}
            tone={sung.length > 0 ? scoreTone(avgScore) : "ink"}
          />
          {grade && (
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Grade
              </div>
              <div className={`mt-1 text-3xl ${TONE_TEXT[grade.tone]}`}>{grade.grade}</div>
            </div>
          )}
          <Stat label="XP earned" value={`+${xp}`} tone="ok" />
          <Stat
            label="Streak"
            value={`${streak} day${streak === 1 ? "" : "s"}`}
            sub={streak >= 2 ? "Keep it going tomorrow" : "Come back tomorrow to start one"}
            tone="cool"
          />
        </div>
        {grade && (
          <div className="mt-3 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="tabular font-mono text-base tracking-wider text-violet-ink"
            >
              {starGlyphs(grade.stars)}
            </span>
            <span className="sr-only">{starRatingLabel(grade.stars)}</span>
          </div>
        )}

        <div className="mt-6 space-y-2">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            By exercise
          </div>
          {routine.steps.map((s, i) => {
            const ex = stepExercise(s);
            const r = steps[i] ?? null;
            return (
              <div key={`${s.exerciseId}-${i}`} className="flex items-center gap-3">
                <span className="tabular w-5 shrink-0 font-mono text-xs text-dim">{i + 1}</span>
                <span className="w-40 shrink-0 truncate text-sm sm:w-56">{ex.title}</span>
                <ProgressBar
                  value={r ? r.avgScore : 0}
                  tone={r ? scoreTone(r.avgScore) : "neutral"}
                  className="flex-1"
                />
                <span className="tabular w-14 shrink-0 text-right font-mono text-xs">
                  {r ? `${r.avgScore}%` : i < steps.length ? "skip" : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {grade && (
        <ShareableResult
          title={routine.name}
          subtitle={`Warmup routine · ${routine.steps.length} exercises · ~${routineMinutes(routine)} min`}
          score={avgScore}
          grade={grade}
          stats={[
            { label: "Exercises", value: `${sung.length}/${routine.steps.length}` },
            { label: "XP", value: `+${xp}`, tone: "cool" },
          ]}
        />
      )}

      {achievements.length > 0 && (
        <Card className="border-ok/30">
          <Pill tone="ok">New achievements</Pill>
          <ul className="mt-4 space-y-2">
            {achievements.map((a) => (
              <li key={a.id} className="flex items-center gap-3 text-sm">
                <span aria-hidden="true">{a.icon}</span>
                <span className="font-medium">{a.title}</span>
                <span className="text-mut">{a.desc}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ProCrescendoNudge
        line="Pro plans tomorrow's routine from these scores"
        title="Make tomorrow's warmup count"
        body="Pro plans tomorrow's session from these scores — weak notes first."
        context="Warmups"
      />

      <div className="flex flex-wrap gap-3">
        <Button variant="violet" onClick={onRepeat}>
          <IconPlay /> Run it again
        </Button>
        <Button variant="outline" onClick={onHome}>
          Back to warmups
        </Button>
      </div>
    </div>
  );
}
