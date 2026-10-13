"use client";

import { isCapped, useFreeCap } from "@/lib/free-cap";
import { getProState } from "@/lib/pro";
import { CapWall, FreeAllowance } from "@/components/practice/free-cap";
import { liveStreak } from "@/components/account/save-state";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, PageShell, Pill, SectionLabel } from "@/components/ui";
import {
  ContinueCard,
  GoalRing,
  PathList,
  StarTrio,
  StreakChip,
  useDailyGoal,
  useGoalDoneSec,
} from "@/components/practice/learn-home";
import { starsForScore } from "@/components/practice/results-screen";
import { getState, localDay, useProgress } from "@/lib/progress";
import {
  DIFFICULTIES,
  GAME_NAMES,
  ROUNDS,
  bestKey,
  readBests,
  type Difficulty,
  type GameId,
} from "./lib";
import { CHASE_DIFFICULTY, chaseSongs } from "./note-catcher";
import {
  EAR_ROUTINES,
  GAME_DESC,
  GAME_MIC,
  earRoutineById,
  earRoutineMinutes,
  recommendEarRoutine,
  type EarRoutine,
} from "./routines";
import { EarGameSession, EarRunner } from "./ear-runner";

/** What the room is running right now, if anything. */
type Active =
  | { kind: "routine"; routine: EarRoutine }
  | {
      kind: "game";
      game: GameId;
      difficulty: Difficulty;
      /** Note catcher chasing this song rather than random notes. */
      song?: { id: string; title: string };
    };

const GAME_ORDER: GameId[] = [
  "higher-lower",
  "interval",
  "pitch-match",
  "note-catcher",
  "melody-echo",
];

/** Computed once: the songbook is static, and so is which songs it offers. */
const CHASE_SONGS = chaseSongs();

/** Bring the cap wall into view, so a capped tap lands on the reason, not on nothing. */
function showCapWall() {
  document.getElementById("free-cap")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

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
  const cap = useFreeCap();
  /**
   * Every way into a game or workout, so a capped singer meets the wall, not a
   * mic prompt. A capped tap scrolls to the wall: a Start that does nothing
   * reads as a broken page, not as a fair limit.
   */
  const start = useCallback(
    (next: Active) => {
      if (cap.capped) {
        showCapWall();
        return;
      }
      setActive(next);
    },
    [cap.capped],
  );
  const unavailableReason = cap.capped
    ? "Free practice is used for today. It resets at midnight; the free studio is still open."
    : undefined;
  const { goalSec } = useDailyGoal();
  const goalDoneSec = useGoalDoneSec(progress);
  // The stored count outlives a lapsed streak; only a live one is named.
  const streakDays = liveStreak(progress.streak);

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

  // A program day links its ear item at a whole workout, as
  // /ear-training?routine=quick (lib/programs.ts itemHref), the way the breath
  // and warmup rooms take ?routine=. Read once after mount rather than with
  // useSearchParams, which would need a Suspense boundary that blanks this
  // route's prerendered copy. The cap is asked of the stores, not of `cap`,
  // which is still the prerender's in the hydration commit.
  const [handledDeepLink, setHandledDeepLink] = useState(false);
  useEffect(() => {
    if (handledDeepLink) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setHandledDeepLink(true);
    const routine = earRoutineById(new URLSearchParams(window.location.search).get("routine"));
    if (!routine || isCapped(getState(), getProState().active)) return;
    setActive({ kind: "routine", routine });
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [handledDeepLink]);

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

  /**
   * The path: one level per difficulty with the five games as its rows, then
   * a last level of songs to chase in Note catcher — the songbook's first
   * phrases, so the ear room points at the songs a singer meets next.
   */
  const levels = useMemo(() => {
    const games = DIFFICULTIES.map((d) => ({
      title: d.label,
      unit: "games",
      blurb:
        d.id === "easy"
          ? "Wide gaps, four intervals, any octave counts."
          : d.id === "medium"
            ? "Smaller gaps, seven intervals. Once your range is saved, the octave matters."
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
          onSelect: () => start({ kind: "game", game, difficulty: d.id }),
        };
      }),
    }));
    const chase = {
      title: "Chase the notes",
      unit: "songs",
      blurb:
        "Note catcher with a real melody: each song's phrase from the songbook, moved into your range. Any octave counts.",
      items: CHASE_SONGS.map((song) => {
        const best = bests[bestKey("note-catcher", CHASE_DIFFICULTY, `song:${song.id}`)];
        return {
          id: `chase:${song.id}`,
          title: song.title,
          desc: `Catch the first ${ROUNDS} notes of ${song.title} as they slide in.`,
          meta:
            typeof best === "number"
              ? `${ROUNDS} notes · best ${best}/100`
              : `${ROUNDS} notes · not played yet`,
          stars: starsForScore(typeof best === "number" ? best : null),
          mic: true,
          onSelect: () =>
            start({
              kind: "game",
              game: "note-catcher",
              difficulty: CHASE_DIFFICULTY,
              song: { id: song.id, title: song.title },
            }),
        };
      }),
    };
    return [...games, chase];
  }, [bests, start]);

  if (active) {
    return active.kind === "routine" ? (
      <EarRunner routine={active.routine} onExit={exit} capped={cap.capped} />
    ) : (
      <EarGameSession
        capped={cap.capped}
        game={active.game}
        difficulty={active.difficulty}
        song={active.song}
        onExit={exit}
      />
    );
  }

  return (
    <PageShell
      kicker="Ear training"
      title="Ear training for singers"
      subtitle="Five short games that train your ear for pitch and intervals: match a pitch, catch moving notes, name intervals and sing melodies back, ten rounds each."
    >
      {cap.capped ? (
        <div className="mb-6">
          <CapWall cap={cap} />
        </div>
      ) : (
        <FreeAllowance cap={cap} className="mb-4" />
      )}
      <ContinueCard
        kicker={earToday ? "Top up today" : "Today's ear workout"}
        title={recommended.name}
        tagline={recommended.tagline}
        meta={`${recommended.steps.length} games · ~${earRoutineMinutes(recommended)} min`}
        stepTitles={recommended.steps.map((s) => GAME_NAMES[s.game])}
        onStart={() => start({ kind: "routine", routine: recommended })}
        startLabel={cap.capped ? "Available tomorrow" : "Start workout"}
        unavailableReason={unavailableReason}
        micReady
        error={null}
        streakDays={streakDays}
        streakBest={progress.streak.best}
      />

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <GoalRing doneSec={goalDoneSec} goalSec={goalSec} />
        <StreakChip days={streakDays} best={progress.streak.best} />
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-center gap-2">
          <SectionLabel heading>Ear training workouts</SectionLabel>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Pick a length, press start
          </span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EAR_ROUTINES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => start({ kind: "routine", routine: r })}
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
          <PathList levels={levels} micNoteId={null} unavailableReason={unavailableReason} />
        </div>
      </section>

      <p className="mt-8 text-center text-xs text-dim">
        Every finished game earns XP and counts toward your streak.
        {" "}
        {GAME_NAMES["pitch-match"]}, {GAME_NAMES["note-catcher"].toLowerCase()} and{" "}
        {GAME_NAMES["melody-echo"].toLowerCase()} need a microphone; the other two never
        listen.
      </p>
    </PageShell>
  );
}
