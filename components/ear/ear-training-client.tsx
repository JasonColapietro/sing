"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, PageShell, Pill, SectionLabel } from "@/components/ui";
import {
  ContinueCard,
  GoalRing,
  PathList,
  StarTrio,
  StreakChip,
  useDailyGoal,
} from "@/components/practice/learn-home";
import { starsForScore } from "@/components/practice/results-screen";
import { localDay, todayPracticeSec, useProgress } from "@/lib/progress";
import {
  DIFFICULTIES,
  GAME_NAMES,
  readBests,
  type Difficulty,
  type GameId,
} from "./lib";
import {
  EAR_ROUTINES,
  GAME_DESC,
  GAME_MIC,
  GAME_TRAINS,
  earRoutineMinutes,
  recommendEarRoutine,
  type EarRoutine,
} from "./routines";
import { EarGameSession, EarRunner } from "./ear-runner";

/** What the room is running right now, if anything. */
type Active =
  | { kind: "routine"; routine: EarRoutine }
  | { kind: "game"; game: GameId; difficulty: Difficulty };

const GAME_ORDER: GameId[] = [
  "higher-lower",
  "interval",
  "pitch-match",
  "melody-echo",
];

/** Stars for a whole workout: the average of its steps' best scores. */
function routineStars(
  routine: EarRoutine,
  bests: Record<string, number>,
): 0 | 1 | 2 | 3 {
  const scores = routine.steps.map((s) => bests[`${s.game}:${s.difficulty}`] ?? 0);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return starsForScore(Math.round(avg));
}

export default function EarTrainingClient() {
  const [active, setActive] = useState<Active | null>(null);
  const [bests, setBests] = useState<Record<string, number>>({});
  const progress = useProgress();
  const { goalSec } = useDailyGoal();

  const refreshBests = useCallback(() => setBests(readBests()), []);
  useEffect(() => {
    // Deliberately deferred to an effect: reading localStorage during the
    // lazy initializer would return real scores on the client but {} on the
    // server, causing a hydration mismatch on this route's SSR-prerendered
    // HTML shell.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshBests();
  }, [refreshBests]);

  const exit = useCallback(() => {
    setActive(null);
    refreshBests();
  }, [refreshBests]);

  // "Practised ear today" is what decides between the top-up and the full
  // workout, so it asks about ear sessions specifically, not practice at large.
  const earToday = useMemo(() => {
    const today = localDay();
    return progress.sessions.some((s) => s.type === "ear" && s.day === today);
  }, [progress.sessions]);

  const recommended = useMemo(
    () => recommendEarRoutine({ practicedToday: earToday }),
    [earToday],
  );

  /** The path: one level per difficulty, the four games as its rows. */
  const levels = useMemo(() => {
    return DIFFICULTIES.map((d) => ({
      title: d.label,
      unit: "games",
      blurb:
        d.id === "easy"
          ? "Wide gaps, four intervals, any octave counts."
          : d.id === "medium"
            ? "Smaller gaps, seven intervals, the octave matters."
            : "Every interval, harmonic pairs, and a tighter tuning window.",
      items: GAME_ORDER.map((game) => {
        const best = bests[`${game}:${d.id}`];
        const stars = starsForScore(typeof best === "number" ? best : null);
        return {
          id: `${game}:${d.id}`,
          title: GAME_NAMES[game],
          desc: GAME_DESC[game],
          meta:
            typeof best === "number"
              ? `10 rounds · best ${best}/100`
              : "10 rounds · not played yet",
          stars,
          mic: GAME_MIC[game],
          onSelect: () => setActive({ kind: "game", game, difficulty: d.id }),
        };
      }),
    }));
  }, [bests]);

  if (active) {
    return active.kind === "routine" ? (
      <EarRunner routine={active.routine} onExit={exit} />
    ) : (
      <EarGameSession
        game={active.game}
        difficulty={active.difficulty}
        onExit={exit}
      />
    );
  }

  return (
    <PageShell
      kicker="Ear training"
      title="Train your ear"
      subtitle="Short workouts and four games, ten rounds each. Start where the app points you."
    >
      <ContinueCard
        kicker={earToday ? "Top up today" : "Today's ear workout"}
        title={recommended.name}
        tagline={recommended.tagline}
        meta={`${recommended.steps.length} games · ~${earRoutineMinutes(recommended)} min`}
        stepTitles={recommended.steps.map((s) => GAME_NAMES[s.game])}
        onStart={() => setActive({ kind: "routine", routine: recommended })}
        startLabel="Start workout"
        micReady
        error={null}
        streakDays={progress.streak.current}
      />

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <GoalRing doneSec={todayPracticeSec(progress)} goalSec={goalSec} />
        <StreakChip days={progress.streak.current} />
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-center gap-2">
          <SectionLabel>Workouts</SectionLabel>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Pick a length, press start
          </span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EAR_ROUTINES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setActive({ kind: "routine", routine: r })}
              className="text-left"
            >
              <Card tone="raised" className="h-full">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg">{r.name}</h3>
                  <StarTrio stars={routineStars(r, bests)} />
                </div>
                <p className="mt-2 text-sm text-mut">{r.tagline}</p>
                <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                  {r.steps.length} games
                  <span className="mx-2 text-line2">·</span>~{earRoutineMinutes(r)} min
                </p>
                <ol className="mt-4 flex flex-wrap gap-1.5" aria-label="Games in this workout">
                  {r.steps.map((s, i) => (
                    <li key={`${s.game}-${s.difficulty}-${i}`}>
                      <Pill tone="mut">{GAME_NAMES[s.game]}</Pill>
                    </li>
                  ))}
                </ol>
              </Card>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-center gap-2">
          <SectionLabel>Path</SectionLabel>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Three stars on every game, easiest first
          </span>
        </div>
        <div className="mt-4">
          <PathList levels={levels} micNoteId={null} />
        </div>
      </section>

      <p className="mt-8 text-center text-xs text-dim">
        Every finished game earns XP and counts toward your streak.
        {" "}
        {GAME_TRAINS["pitch-match"]} and {GAME_TRAINS["melody-echo"].toLowerCase()} need a
        microphone; the other two never listen.
      </p>
    </PageShell>
  );
}
