"use client";

import { useEffect, useMemo } from "react";
import { ProCrescendoNudge } from "@/components/pro/gate";
import { CappedAgainNote } from "@/components/practice/free-cap";
import { MicAlert } from "@/components/mic-alert";
import { ResultsScreen, starsForScore, type ResultRow } from "@/components/practice/results-screen";
import { useDailyGoal, useGoalDoneSec } from "@/components/practice/learn-home";
import { liveStreak } from "@/components/account/save-state";
import { useProgress, type Achievement } from "@/lib/progress";
import { SITE_URL } from "@/lib/site";
import { emitProResult } from "@/lib/pro-signal";
import type { RoutineSummaryData } from "./routine-runner";
import { routineMinutes, stepExercise } from "./routines";

/**
 * One row per step. Steps before a `?step=` link's were not part of this run.
 * A warm-in (warmInStep) is sung in the first row's place, as a few reps of
 * that exercise rather than the whole step, so its row says so: otherwise a
 * scored step 1 next to "not in this run" on step 2 reads as a mistake.
 * Steps from the one the cap slide stood in for were never reached, which is
 * not the same as skipped: the singer chose nothing there.
 */
export function routineSummaryRows(data: RoutineSummaryData): ResultRow[] {
  const { routine, steps, startStep = 0, warmIn = false, capStoppedAt } = data;
  return routine.steps.map((s, i) => {
    const r = steps[i] ?? null;
    const title = stepExercise(s).title;
    return {
      label: i === 0 && warmIn && r ? `Warm-in: ${title}` : title,
      score: r ? r.avgScore : null,
      note:
        i < startStep
          ? "not in this run"
          : capStoppedAt !== undefined && i >= capStoppedAt
            ? "not reached"
            : "skipped",
    };
  });
}

/** How many steps the cap slide kept this run from reaching. */
export function stepsNotReached(data: RoutineSummaryData): number {
  const { routine, capStoppedAt } = data;
  return capStoppedAt === undefined ? 0 : Math.max(0, routine.steps.length - capStoppedAt);
}

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
  micError = null,
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
  /**
   * "Play again" or "Practice" could not reopen the microphone the room
   * closed while this screen was up. Shown inside the screen, beside the
   * buttons, because the page under this full-screen dialog is hidden.
   */
  micError?: string | null;
}) {
  const { routine, steps, completed } = data;
  const progress = useProgress();
  const { goalSec } = useDailyGoal();
  const goalDoneSec = useGoalDoneSec(progress);

  const { sungCount, score, xp, achievements, weakestId } = useMemo(() => {
    // `!= null`, not `!== null`: an entry a resumed run never wrote must not
    // be read as a sung step (step-results.ts).
    const sung = steps.filter((s): s is NonNullable<typeof s> => s != null);
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

  // A completed result: the one-time Pro moment listens for this. This screen
  // holds the scroll lock, so the moment waits for the singer to close it
  // (components/pro/moments.tsx). A run where nothing was sung is no result.
  const sung = sungCount > 0;
  useEffect(() => {
    if (sung) emitProResult();
  }, [sung]);

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
      rows={routineSummaryRows(data)}
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
      // Why "Play again" and "Practice" are gone, and when they come back;
      // above the rows, so a run the cap stopped explains its "not reached"
      // rows before a phone's fold rather than under them.
      notice={
        capped ? (
          <CappedAgainNote notReached={stepsNotReached(data)} />
        ) : micError ? (
          <MicAlert message={micError} className="max-w-md text-sm text-rec" />
        ) : undefined
      }
    >
      {/* A run where nothing scored usually means the mic could not hear a
          clear note: each step closes itself after two reps it cannot hear,
          so the whole routine fast-forwards to every row reading "skipped".
          Worded so it stays true when the steps were skipped by hand, and it
          points only at things the singer can reach with the mic still on. */}
      {sungCount === 0 && !capped && (
        <p className="mb-3 rounded-2xl bg-panel p-4 text-sm text-mut sm:p-5">
          Nothing was scored this run. If you were singing, the mic didn&apos;t
          pick up a clear note, and each exercise moves on after two reps it
          can&apos;t hear. Sing a little louder or closer to the mic, or raise
          your input level in your system sound settings, then press Play again.
        </p>
      )}
      {/* The nudge is built from the site's paper tokens, and the results
          screen is dark — its quiet one-line variant would land at about
          2.3:1 straight on the session background. It gets its own paper
          ground rather than a dark-mode fork of the Pro components. */}
      {/* `empty:hidden` because the nudge self-hides for Pro members — without it
          they would get a blank cream block where the pitch used to be. */}
      {/* At the cap the notice above already carries the priced way past
          the limit; a second, unpriced ask under it was noise. */}
      {!capped && (
      <div className="rounded-2xl bg-panel p-4 empty:hidden sm:p-5">
        <ProCrescendoNudge
          line="Pro shows the full daily coach plan, not just its first two steps"
          title="See the whole plan"
          body="Tomorrow's three and Today's warmup already read your recent scores on the free plan, these included. Pro adds the full daily coach plan, a per-note accuracy chart and no daily limit."
          context="Warmups"
        />
      </div>
      )}
    </ResultsScreen>
  );
}
