"use client";

import { useMemo } from "react";
import { ProCrescendoNudge } from "@/components/pro/gate";
import { ResultsScreen, starsForScore } from "@/components/practice/results-screen";
import { useDailyGoal } from "@/components/practice/learn-home";
import { todayPracticeSec, useProgress, type Achievement } from "@/lib/progress";
import type { RoutineSummaryData } from "./routine-runner";
import { routineMinutes, stepExercise } from "./routines";

/**
 * The end of a routine. Every step already logged its own warmup session on
 * the way through, so nothing is written here: this reads the step summaries
 * back onto the shared results screen — stars, the average, the XP the steps
 * earned between them, one row per exercise, and the streak the session just
 * extended.
 */
export function RoutineSummary({
  data,
  onRepeat,
  onHome,
  onPractice,
}: {
  data: RoutineSummaryData;
  onRepeat: () => void;
  onHome: () => void;
  /** Run the weakest step again on its own, where the room can start one. */
  onPractice?: (exerciseId: string) => void;
}) {
  const { routine, steps, completed } = data;
  const progress = useProgress();
  const { goalSec } = useDailyGoal();

  const { sungCount, score, xp, achievements, weakestId } = useMemo(() => {
    const sung = steps.filter((s): s is NonNullable<typeof s> => s !== null);
    const score =
      sung.length > 0
        ? Math.round(sung.reduce((a, s) => a + s.avgScore, 0) / sung.length)
        : null;
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

    // "Practice" means the one that went worst, not the one that was skipped:
    // a skipped step has no evidence against it.
    let weakest: (typeof sung)[number] | null = null;
    for (const s of sung) {
      if (!weakest || s.avgScore < weakest.avgScore) weakest = s;
    }

    return { sungCount: sung.length, score, xp, achievements, weakestId: weakest?.ex.id ?? null };
  }, [steps]);

  const subtitle = `${routine.steps.length} exercises · ~${routineMinutes(routine)} min${
    completed ? "" : " · ended early"
  }`;

  return (
    <ResultsScreen
      title={routine.name}
      subtitle={subtitle}
      score={score}
      stars={starsForScore(score)}
      xp={xp}
      streakDays={progress.streak.current}
      goal={{ doneSec: todayPracticeSec(progress), goalSec }}
      rows={routine.steps.map((s, i) => {
        const r = steps[i] ?? null;
        return {
          label: stepExercise(s).title,
          score: r ? r.avgScore : null,
          note: "skipped",
        };
      })}
      achievements={achievements}
      onContinue={onHome}
      onAgain={onRepeat}
      onPractice={
        onPractice && weakestId ? () => onPractice(weakestId) : undefined
      }
      share={
        score === null
          ? undefined
          : {
              title: routine.name,
              subtitle: `Warmup routine · ${sungCount}/${routine.steps.length} exercises · ~${routineMinutes(routine)} min`,
            }
      }
    >
      {/* The nudge is built from the site's paper tokens, and the results
          screen is dark — its quiet one-line variant would land at about
          2.3:1 straight on the session background. It gets its own paper
          ground rather than a dark-mode fork of the Pro components. */}
      {/* `empty:hidden` because the nudge self-hides for Pro members — without it
          they would get a blank cream block where the pitch used to be. */}
      <div className="rounded-2xl bg-panel p-4 empty:hidden sm:p-5">
        <ProCrescendoNudge
          line="Pro plans tomorrow's routine from these scores"
          title="Make tomorrow's warmup count"
          body="Pro plans tomorrow's session from these scores — weak notes first."
          context="Warmups"
        />
      </div>
    </ResultsScreen>
  );
}
