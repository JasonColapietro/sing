"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ProCrescendoNudge } from "@/components/pro/gate";
import { ResultsScreen, starsForScore } from "@/components/practice/results-screen";
import { useDailyGoal, useGoalDoneSec } from "@/components/practice/learn-home";
import { liveStreak } from "@/components/account/save-state";
import { useProgress, type Achievement } from "@/lib/progress";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import { SITE_URL } from "@/lib/site";
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
  capped = false,
}: {
  data: RoutineSummaryData;
  onRepeat: () => void;
  onHome: () => void;
  /** Run the weakest step again on its own, where the room can start one. */
  onPractice?: (exerciseId: string) => void;
  /**
   * Today's free guided minutes are used. Both starts would do nothing (the
   * room refuses them), so they are not offered, and the screen says why and
   * when practice opens again instead of ending on two dead buttons.
   */
  capped?: boolean;
}) {
  const { routine, steps, completed, startStep = 0 } = data;
  const progress = useProgress();
  const { goalSec } = useDailyGoal();
  const goalDoneSec = useGoalDoneSec(progress);

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
      // Live, not the stored count: a routine whose steps were all skipped
      // logged nothing, and a lapsed streak must not read as alive.
      streakDays={liveStreak(progress.streak)}
      goal={{ doneSec: goalDoneSec, goalSec }}
      rows={routine.steps.map((s, i) => {
        const r = steps[i] ?? null;
        return {
          label: stepExercise(s).title,
          score: r ? r.avgScore : null,
          note: i < startStep ? "not in this run" : "skipped",
        };
      })}
      achievements={achievements}
      onContinue={onHome}
      onAgain={capped ? undefined : onRepeat}
      onPractice={
        !capped && onPractice && weakestId ? () => onPractice(weakestId) : undefined
      }
      share={
        score === null
          ? undefined
          : {
              title: routine.name,
              subtitle: `Warmup routine · ${sungCount}/${routine.steps.length} exercises · ~${routineMinutes(routine)} min`,
              url: `${SITE_URL}/warmups?routine=${routine.id}`,
            }
      }
    >
      {/* Why "Play again" and "Practice" are gone, and when they come back.
          On the paper panel for the same contrast reason as the nudge. */}
      {capped && (
        <p className="mb-3 rounded-2xl bg-panel p-4 text-sm text-mut sm:p-5">
          That&apos;s today&apos;s {FREE_DAILY_MINUTES} free minutes of guided
          practice. A fresh {FREE_DAILY_MINUTES} minutes opens at midnight; the
          pitch studio and the range test stay open now.{" "}
          <Link
            href="/pro#buy"
            className="text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet"
          >
            Pro has no daily limit
          </Link>
          .
        </p>
      )}
      {/* The nudge is built from the site's paper tokens, and the results
          screen is dark — its quiet one-line variant would land at about
          2.3:1 straight on the session background. It gets its own paper
          ground rather than a dark-mode fork of the Pro components. */}
      {/* `empty:hidden` because the nudge self-hides for Pro members — without it
          they would get a blank cream block where the pitch used to be. */}
      <div className="rounded-2xl bg-panel p-4 empty:hidden sm:p-5">
        <ProCrescendoNudge
          line="Pro shows the full daily coach plan, not just its first two steps"
          title="See the whole plan"
          body="Tomorrow's three and Today's warmup already read your recent scores on the free plan, these included. Pro adds the full daily coach plan, per-note accuracy over time and no daily limit."
          context="Warmups"
        />
      </div>
    </ResultsScreen>
  );
}
