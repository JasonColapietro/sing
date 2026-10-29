"use client";

import { isCapped, useFreeCap } from "@/lib/free-cap";
import { getProState, useProReady } from "@/lib/pro";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import { CapWall, FreeAllowance } from "@/components/practice/free-cap";
import { liveStreak } from "@/components/account/save-state";
import { DeepLinkSlot, deepLinkMarker, useDeepLinkRead } from "@/components/prepaint";

import { useCallback, useEffect, useState } from "react";
import { usePitch } from "@/lib/audio/use-pitch";
import { getState, localDay, useProgress } from "@/lib/progress";
import { Button, Card, PageShell, SectionHeading } from "@/components/ui";
import {
  ContinueCard,
  PathList,
  StarTrio,
  averageStars,
  useDailyGoal,
  useGoalDoneSec,
} from "@/components/practice/learn-home";
import { BreathDrillSession, BreathRunner } from "./breath-runner";
import {
  BREATH_ROUTINES,
  breathDrillDesc,
  breathDrillNeedsMic,
  breathDrillTitle,
  breathRoutineById,
  breathRoutineMinutes,
  breathStepTitle,
  drillPresetFromQuery,
  isBreathDrillId,
  recommendBreathRoutine,
  sizeBreathRoutineToAllowance,
  type BreathDrillId,
  type BreathRoutine,
  type BreathStep,
} from "./routines";
import {
  EMPTY_BREATH_BESTS,
  loadBreathBests,
  starsForBox,
  starsForCue,
  starsForFarinelli,
  starsForSustain,
  type BreathBests,
  type Stars,
} from "./store";

/**
 * The breath room, in the shape the warmups room now has: what to do next,
 * how today is going, the sets, then the individual drills with their stars.
 *
 * It used to be three tabs over three setup cards. That is a shelf — it says
 * what exists and nothing about what to do, in what order, or for how long, and
 * every visit started with the same three-way choice between drills most
 * singers cannot rank. The room now opens with one recommendation and keeps the
 * three drills a click away for anyone who wants to work a specific one.
 */

type View =
  | { kind: "home" }
  | { kind: "routine"; routine: BreathRoutine; startStep?: number }
  /** `preset` is a setting a link asked for (a program day's counts); none opens the setup card's defaults. */
  | { kind: "drill"; drill: BreathDrillId; preset?: BreathStep };

const DRILL_ORDER: BreathDrillId[] = ["sustain", "cue", "box", "farinelli"];

function starsForDrill(drill: BreathDrillId, bests: BreathBests): Stars {
  switch (drill) {
    case "box":
      return starsForBox(bests.boxMinutes);
    case "farinelli":
      return starsForFarinelli(bests.farinelliCap);
    case "cue":
      return starsForCue(bests.cueReps);
    default:
      return starsForSustain(bests.sustainSec);
  }
}

/**
 * Whether the drill has a best at all. A sustain under ten seconds earns no
 * star, and a set's own presets cap box breathing and the Farinelli climb at
 * one, so stars cannot say whether a drill was ever done.
 */
export function drillTried(drill: BreathDrillId, bests: BreathBests): boolean {
  switch (drill) {
    case "box":
      return bests.boxMinutes > 0;
    case "farinelli":
      return bests.farinelliCap > 0;
    case "cue":
      return bests.cueReps > 0;
    default:
      return bests.sustainSec > 0;
  }
}

/** What the singer has already got out of this drill, in one line. */
function bestLine(drill: BreathDrillId, bests: BreathBests): string {
  switch (drill) {
    case "box":
      return bests.boxMinutes > 0
        ? `Longest set ${bests.boxMinutes} min`
        : "Not tried yet";
    case "farinelli":
      return bests.farinelliCap > 0
        ? `Top count ${bests.farinelliCap}`
        : "Not tried yet";
    case "cue":
      return bests.cueReps > 0 ? `Longest run ${bests.cueReps} reps` : "Not tried yet";
    default:
      return bests.sustainSec > 0
        ? `Best ${bests.sustainSec.toFixed(1)}s`
        : "Not tried yet";
  }
}

/** Bring the cap wall into view, so a capped tap lands on the reason, not on nothing. */
function showCapWall() {
  document.getElementById("free-cap")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

/** A set's stars, on the same rule the warmups room uses for its routines. */
function routineStars(routine: BreathRoutine, bests: BreathBests): Stars {
  return averageStars(routine.steps.map((s) => starsForDrill(s.drill, bests)));
}

export function BreathStudio() {
  const [view, setView] = useState<View>({ kind: "home" });
  const [bests, setBests] = useState<BreathBests>(EMPTY_BREATH_BESTS);

  const progress = useProgress();
  const cap = useFreeCap();
  /**
   * Every way into a drill or set, so a capped singer meets the wall, not a
   * mic prompt. A capped tap scrolls to the wall: a Start that does nothing
   * reads as a broken page, not as a fair limit.
   */
  const start = useCallback(
    (next: View) => {
      if (cap.capped) {
        showCapWall();
        return;
      }
      setView(next);
    },
    [cap.capped],
  );
  const unavailableReason = cap.capped
    ? "Free practice is used for today. It resets at midnight; the free studio is still open."
    : undefined;
  const { goalSec } = useDailyGoal();
  const goalDoneSec = useGoalDoneSec(progress);

  /**
   * The room holds the microphone rather than the sustain step.
   *
   * A routine reaches the sustain test after two silent drills, and opening the
   * input stream at that moment costs a second of dead air — in some browsers a
   * permission sheet dropped over the middle of a session. Held here, a routine
   * and a single drill share one stream instead of taking turns with the
   * device, and leaving the session closes it.
   */
  const pitch = usePitch();

  // localStorage, so deferred to an effect: reading it during render would give
  // the server an empty path and the client a starred one, and that mismatch
  // lands on this route's prerendered shell. Re-read whenever the room comes
  // back from a session, which is the only time the figures can have moved.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBests(loadBreathBests());
  }, [view]);

  // GuitarHub's voice curriculum links a breath lesson straight at the drill it
  // teaches, as /breath?drill=sustain, and its checkpoints at a whole set as
  // /breath?routine=daily. Without this the links landed on the room's front
  // page and the lesson looked broken rather than the link.
  //
  // Read from the URL after mount rather than with useSearchParams, for the
  // reason the warmups room documents: that hook needs a Suspense boundary in
  // app/breath/page.tsx, and the boundary would blank this route's prerendered
  // heading and copy. Runs once, and never overrides a singer who has already
  // navigated — `handled` keeps a back-press out of the drill they just left.
  // Until it has run, the room's front page carries the deep-link marker: on
  // a link's first load the pre-paint script has hidden it, so the drill
  // opens over a page that never painted it (components/prepaint.tsx).
  const [handledDeepLink, setHandledDeepLink] = useState(false);
  useDeepLinkRead(handledDeepLink);
  useEffect(() => {
    if (handledDeepLink) return;
    const q = new URLSearchParams(window.location.search);
    const drill = q.get("drill");
    const routineId = q.get("routine");
    /* eslint-disable react-hooks/set-state-in-effect */
    setHandledDeepLink(true);
    // Asked of the stores, not of `cap`: this first runs in the hydration
    // commit, where `cap` is still the prerender's (no sessions, so never
    // capped), and a capped singer on a lesson link would land in the drill.
    if (isCapped(getState(), getProState().active)) return;
    if (drill && isBreathDrillId(drill)) {
      // A program day links its drill with the counts it asks for
      // (lib/programs.ts itemHref); a bare ?drill= opens the usual setup.
      setView({ kind: "drill", drill, preset: drillPresetFromQuery(drill, q) ?? undefined });
      return;
    }
    const routine = breathRoutineById(routineId);
    // `step` (1-based) opens a set part way through, with that step's own
    // preset: a program lists a set's steps one by one, for a singer the free
    // plan stopped between them.
    const step = Number(q.get("step"));
    const startStep =
      routine && Number.isInteger(step) && step >= 1 && step <= routine.steps.length ? step - 1 : 0;
    if (routine) setView({ kind: "routine", routine, startStep });
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [handledDeepLink]);

  const practicedToday = progress.sessions.some(
    (s) => s.type === "breath" && s.day === localDay(),
  );
  // Sized to the free minutes left, like the warmups room: the daily set runs
  // past five minutes and would reach the cap before its sustain test, so a
  // free singer's first set would end on the cap slide instead of a score.
  const preferred = recommendBreathRoutine({ practicedToday });
  const recommended = cap.capped ? preferred : sizeBreathRoutineToAllowance(preferred, cap.leftSec);
  // "Ends on a score" holds on the free plan only for the quick set: the daily
  // set and the builder run past the free minutes and stop on the cap slide
  // before their sustain test. Said only once the entitlement is read, so a
  // Pro singer is never told about a limit they paid to remove.
  const proReady = useProReady();
  const setsLede =
    proReady && !cap.isPro
      ? `Three sets, shortest first. Each runs its drills back to back and ends on a score. Free guided practice is ${FREE_DAILY_MINUTES} minutes a day: the quick set fits, and the longer two stop when it runs out.`
      : "Three sets, shortest first. Each runs its drills back to back and ends on a score.";

  const goHome = () => {
    pitch.stop();
    setView({ kind: "home" });
  };

  // A set or a drill runs in the full-screen session surface, a portal over
  // the page. The page under it keeps the room's heading and a screen of
  // empty page, the same block a deep link's first load paints in place of
  // the front page, so opening a link's drill moves nothing on that page.
  const session =
    view.kind === "routine" ? (
      <BreathRunner
        routine={view.routine}
        startStep={view.startStep}
        pitch={pitch}
        onExit={goHome}
        capped={cap.capped}
      />
    ) : view.kind === "drill" ? (
      <BreathDrillSession
        capped={cap.capped}
        drill={view.drill}
        preset={view.preset}
        pitch={pitch}
        onExit={goHome}
      />
    ) : null;
  const heading = {
    kicker: "Breath training",
    title: "Breathing exercises for singers",
    subtitle:
      "Guided breath sets and a mic-based sustain test that build breath support for long phrases. Start the set that fits the moment, or pick one drill and work it.",
  };
  if (session) {
    return (
      <PageShell {...heading}>
        <DeepLinkSlot room="breath" read />
        {session}
      </PageShell>
    );
  }

  return (
    <PageShell {...heading}>
      <div {...deepLinkMarker(handledDeepLink, "breath")}>
        {/* Both are in the server HTML; each renders only in its own state, and
            until hydration the pre-paint state shows the right one
            (components/prepaint.tsx). */}
        <CapWall cap={cap} className="mb-6" />
        <FreeAllowance cap={cap} className="mb-4" />
        <ContinueCard
          // At the cap the button already says when (Available tomorrow), so
          // the card neither greets a return nor offers a second set that
          // cannot start, as on /warmups and /ear-training.
          kicker={practicedToday && !cap.capped ? "Back for more" : "Start here"}
          title={recommended.name}
          tagline={recommended.tagline}
          meta={
            <p className="tabular font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              {recommended.steps.length} drills
              <span className="mx-2 text-line2">·</span>~
              {breathRoutineMinutes(recommended)} min
              <span className="mx-2 text-line2">·</span>
              {practicedToday
                ? cap.capped
                  ? "breath work done today"
                  : "second set today"
                : "no breath work yet today"}
            </p>
          }
          stepTitles={recommended.steps.map(breathStepTitle)}
          onStart={() => start({ kind: "routine", routine: recommended })}
          /* Our own label rather than the card's mic-aware default: every breath
             set opens on a silent drill, so "Enable mic and start" would be
             asking for something this set does not need until its last step. */
          startLabel={cap.capped ? "Available tomorrow" : practicedToday ? "Top up" : "Start breathing"}
          unavailableReason={unavailableReason}
          micReady={pitch.listening}
          error={pitch.error}
          // The stored count outlives a lapsed streak; only a live one is named.
          streakDays={liveStreak(progress.streak)}
          streakBest={progress.streak.best}
          stars={routineStars(recommended, bests)}
          // A finished quick set can average under one star (its presets cap
          // two drills at one, and a short sustain earns none): that is "So
          // far", not "Not started".
          started={recommended.steps.some((st) => drillTried(st.drill, bests))}
          goal={{ doneSec: goalDoneSec, goalSec }}
        />

        <section className="mt-10">
          <SectionHeading
            label="Workouts"
            lede={setsLede}
          >
            Breath sets
          </SectionHeading>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BREATH_ROUTINES.map((r) => {
              const stars = routineStars(r, bests);
              return (
                <Card key={r.id} tone="raised" className="flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg">{r.name}</h3>
                    <StarTrio stars={stars} />
                  </div>
                  <p className="mt-2 flex-1 text-sm text-mut">{r.tagline}</p>
                  <p className="tabular mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                    {r.steps.length} drills
                    <span className="mx-2 text-line2">·</span>~
                    {breathRoutineMinutes(r)} min
                  </p>
                  {/* Outline, so the routine card's rust "Start breathing" above
                      stays the one primary action on the page. */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => start({ kind: "routine", routine: r })}
                    className="mt-4"
                  >
                    Start {r.name.toLowerCase()}
                  </Button>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <SectionHeading
            label="Path"
            lede="The four drills on their own, with the stars each has earned so far."
          >
            Your breath path
          </SectionHeading>
          <div className="mt-5">
            <PathList
              micNoteId={null}
              unavailableReason={unavailableReason}
              levels={[
                {
                  title: "Breath",
                  blurb:
                    "One measured test, one drill where the mic listens for your breath, and two guided drills. Stars come from how far you have taken each one.",
                  unit: "drills",
                  items: DRILL_ORDER.map((drill) => {
                    const stars = starsForDrill(drill, bests);
                    return {
                      id: drill,
                      title: breathDrillTitle(drill),
                      // A row shows one secondary line and the mono one wins, so
                      // an untried drill explains itself and a tried one reports,
                      // stars or not: a 7-second sustain is a best, not "untried".
                      ...(drillTried(drill, bests)
                        ? { meta: bestLine(drill, bests) }
                        : { desc: breathDrillDesc(drill) }),
                      stars,
                      mic: breathDrillNeedsMic(drill),
                      onSelect: () => start({ kind: "drill", drill }),
                    };
                  }),
                },
              ]}
            />
          </div>
        </section>

        <Card className="mt-10">
          <div className="flex items-start gap-4">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-cool)"
              strokeWidth="1.5"
              aria-hidden="true"
              className="mt-0.5 shrink-0"
            >
              <path d="M12 3v7" />
              <path d="M12 10c0 4-2 6-5 7a4 4 0 0 1-4-4c0-3 4-3 9-3s9 0 9 3a4 4 0 0 1-4 4c-3-1-5-3-5-7Z" />
            </svg>
            <div>
              <h3 className="text-lg">Why breath work</h3>
              <p className="mt-1 max-w-2xl text-sm text-mut">
                Steady airflow is what keeps a note even and a phrase alive to
                its last word. Training slow, measured exhales teaches your body
                to meter air out instead of spending it all at once, so
                sustained notes hold their level and phrase endings stay
                supported. A few minutes a day is plenty.
              </p>
            </div>
          </div>
        </Card>
      </div>
      {/* Shown only on a deep link's first load, until the room has read it. */}
      {!handledDeepLink && <DeepLinkSlot room="breath" read={false} />}
    </PageShell>
  );
}
