"use client";

import { useEffect, useState } from "react";
import { usePitch } from "@/lib/audio/use-pitch";
import { localDay, todayPracticeSec, useProgress } from "@/lib/progress";
import { Card, PageShell, SectionHeading } from "@/components/ui";
import {
  ContinueCard,
  PathList,
  StarTrio,
  averageStars,
  useDailyGoal,
} from "@/components/practice/learn-home";
import { BreathDrillSession, BreathRunner } from "./breath-runner";
import {
  BREATH_ROUTINES,
  breathDrillDesc,
  breathDrillTitle,
  breathRoutineMinutes,
  breathStepTitle,
  recommendBreathRoutine,
  type BreathDrillId,
  type BreathRoutine,
} from "./routines";
import {
  EMPTY_BREATH_BESTS,
  loadBreathBests,
  starsForBox,
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
  | { kind: "routine"; routine: BreathRoutine }
  | { kind: "drill"; drill: BreathDrillId };

const DRILL_ORDER: BreathDrillId[] = ["sustain", "box", "farinelli"];

function starsForDrill(drill: BreathDrillId, bests: BreathBests): Stars {
  switch (drill) {
    case "box":
      return starsForBox(bests.boxMinutes);
    case "farinelli":
      return starsForFarinelli(bests.farinelliCap);
    default:
      return starsForSustain(bests.sustainSec);
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
    default:
      return bests.sustainSec > 0
        ? `Best ${bests.sustainSec.toFixed(1)}s`
        : "Not tried yet";
  }
}

/** A set's stars, on the same rule the warmups room uses for its routines. */
function routineStars(routine: BreathRoutine, bests: BreathBests): Stars {
  return averageStars(routine.steps.map((s) => starsForDrill(s.drill, bests)));
}

export function BreathStudio() {
  const [view, setView] = useState<View>({ kind: "home" });
  const [bests, setBests] = useState<BreathBests>(EMPTY_BREATH_BESTS);

  const progress = useProgress();
  const { goalSec } = useDailyGoal();

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

  const practicedToday = progress.sessions.some(
    (s) => s.type === "breath" && s.day === localDay(),
  );
  const recommended = recommendBreathRoutine({ practicedToday });

  const goHome = () => {
    pitch.stop();
    setView({ kind: "home" });
  };

  if (view.kind === "routine") {
    return <BreathRunner routine={view.routine} pitch={pitch} onExit={goHome} />;
  }
  if (view.kind === "drill") {
    return <BreathDrillSession drill={view.drill} pitch={pitch} onExit={goHome} />;
  }


  return (
    <PageShell
      kicker="Breath training"
      title="Breath"
      subtitle="Build the air supply behind every long note — start the set that fits the moment, or pick one drill and work it."
    >
      <ContinueCard
        kicker={practicedToday ? "Back for more" : "Start here"}
        title={recommended.name}
        tagline={recommended.tagline}
        meta={
          <p className="tabular font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            {recommended.steps.length} drills
            <span className="mx-2 text-line2">·</span>~
            {breathRoutineMinutes(recommended)} min
            <span className="mx-2 text-line2">·</span>
            {practicedToday ? "second set today" : "no breath work yet today"}
          </p>
        }
        stepTitles={recommended.steps.map(breathStepTitle)}
        onStart={() => setView({ kind: "routine", routine: recommended })}
        /* Our own label rather than the card's mic-aware default: every breath
           set opens on a silent drill, so "Enable mic and start" would be
           asking for something this set does not need until its last step. */
        startLabel={practicedToday ? "Top up" : "Start breathing"}
        micReady={pitch.listening}
        error={pitch.error}
        streakDays={progress.streak.current}
        stars={routineStars(recommended, bests)}
        goal={{ doneSec: todayPracticeSec(progress), goalSec }}
      />

      <section className="mt-10">
        <SectionHeading
          label="Workouts"
          lede="Three sets, shortest first. Each runs its drills back to back and ends on a score."
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
                <button
                  type="button"
                  onClick={() => setView({ kind: "routine", routine: r })}
                  className="mt-4 min-h-11 rounded-full bg-violet-ink px-5 text-sm font-medium text-white transition-colors hover:bg-violet"
                >
                  Start {r.name.toLowerCase()}
                </button>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <SectionHeading
          label="Path"
          lede="The three drills on their own, with the stars each has earned so far."
        >
          Your breath path
        </SectionHeading>
        <div className="mt-5">
          <PathList
            micNoteId={null}
            levels={[
              {
                title: "Breath",
                blurb:
                  "One measured test and two guided drills. Stars come from how far you have taken each one.",
                unit: "drills",
                items: DRILL_ORDER.map((drill) => {
                  const stars = starsForDrill(drill, bests);
                  return {
                    id: drill,
                    title: breathDrillTitle(drill),
                    // A row shows one secondary line and the mono one wins, so
                    // an untried drill explains itself and a tried one reports.
                    ...(stars > 0
                      ? { meta: bestLine(drill, bests) }
                      : { desc: breathDrillDesc(drill) }),
                    stars,
                    mic: drill === "sustain",
                    onSelect: () => setView({ kind: "drill", drill }),
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
            <h4 className="text-lg">Why breath work</h4>
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
    </PageShell>
  );
}
