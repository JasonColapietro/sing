"use client";

import { isCapped, sizeToAllowance, useFreeCap } from "@/lib/free-cap";
import { getProState } from "@/lib/pro";
import { CapWall, FreeAllowance } from "@/components/practice/free-cap";
import { useCappedStart } from "@/components/practice/use-capped-start";
import { liveStreak } from "@/components/account/save-state";
import { DeepLinkSlot, deepLinkMarker, useDeepLinkRead } from "@/components/prepaint";

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
  earRoutineSeconds,
  recommendEarRoutine,
  type EarRoutine,
} from "./routines";
import { EarGameSession, EarRunner } from "./ear-runner";
import { GameGlyph } from "./game-glyph";

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

/** "4 games · ~7 min · mic at step 3": the mic is first asked inside the first game that listens. */
export function routineMeta(routine: EarRoutine): string {
  const micAt = routine.steps.findIndex((s) => GAME_MIC[s.game]);
  const base = `${routine.steps.length} games · ~${earRoutineMinutes(routine)} min`;
  return micAt < 0 ? base : `${base} · mic at step ${micAt + 1}`;
}

/** Stars for a whole routine: the average of its steps' best scores. */
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
  // Every way into a game or routine: a capped singer meets the wall, not a mic prompt.
  const { guard, reason: unavailableReason } = useCappedStart(cap);
  const start = useMemo(() => guard((next: Active) => setActive(next)), [guard]);
  const { goalSec } = useDailyGoal();
  const goalDoneSec = useGoalDoneSec(progress);
  // The stored count outlives a lapsed streak; only a live one is named.
  const streakDays = liveStreak(progress.streak);

  const refreshBests = useCallback(() => setBests(readBests()), []);
  useEffect(() => {
    // localStorage, so read in an effect: a lazy initializer would mismatch the prerender.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshBests();
  }, [refreshBests]);

  const exit = useCallback(() => {
    setActive(null);
    refreshBests();
  }, [refreshBests]);

  // /ear-training?routine=<id> (a program day): read once after mount, not with
  // useSearchParams (its Suspense boundary blanks the prerendered copy). The cap
  // is asked of the stores: `cap` is still the prerender's in this commit.
  const [handledDeepLink, setHandledDeepLink] = useState(false);
  // Until it has run, the front page carries the deep-link marker the pre-paint script hides on a link's first load.
  useDeepLinkRead(handledDeepLink);
  useEffect(() => {
    if (handledDeepLink) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setHandledDeepLink(true);
    const routine = earRoutineById(new URLSearchParams(window.location.search).get("routine"));
    if (!routine || isCapped(getState(), getProState().active)) return;
    setActive({ kind: "routine", routine });
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [handledDeepLink]);

  // Ear sessions specifically: they decide between the top-up and the full routine.
  const earToday = useMemo(() => {
    const today = localDay();
    return progress.sessions.some((s) => s.type === "ear" && s.day === today);
  }, [progress.sessions]);

  // Sized to the free minutes left: the daily routine (406 s) outlasts a fresh
  // allowance (300 s) and would end on the cap slide before its last game.
  const recommended = useMemo(() => {
    const preferred = recommendEarRoutine({ practicedToday: earToday });
    return cap.capped
      ? preferred
      : sizeToAllowance(preferred, [earRoutineById("quick")], earRoutineSeconds, cap.leftSec);
  }, [earToday, cap.capped, cap.leftSec]);

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
          figure: <GameGlyph game={game} />,
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
          figure: <GameGlyph game="note-catcher" />,
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

  const heading = {
    kicker: "Ear training",
    title: "Ear training for singers",
    subtitle:
      "Five short games that train your ear for pitch and intervals: match a pitch, catch moving notes, name intervals and sing melodies back, ten rounds each.",
  };

  // A session is a portal over the page; the page under it keeps the heading and the deep-link slot, so opening a link moves nothing.
  if (active) {
    return (
      <PageShell {...heading}>
        <DeepLinkSlot room="ear" read />
        {active.kind === "routine" ? (
          <EarRunner routine={active.routine} onExit={exit} capped={cap.capped} />
        ) : (
          <EarGameSession
            capped={cap.capped}
            game={active.game}
            difficulty={active.difficulty}
            song={active.song}
            onExit={exit}
          />
        )}
      </PageShell>
    );
  }

  return (
    <PageShell {...heading}>
      <div {...deepLinkMarker(handledDeepLink, "ear")}>
        {/* Both are in the server HTML; each renders only in its own state, and
            until hydration the pre-paint state shows the right one
            (components/prepaint.tsx). */}
        <CapWall cap={cap} className="mb-6" />
        <FreeAllowance cap={cap} className="mb-4" />
        <ContinueCard
          kicker={earToday && !cap.capped ? "Top up today" : "Today's ear routine"}
          title={recommended.name}
          tagline={recommended.tagline}
          meta={routineMeta(recommended)}
          stepTitles={recommended.steps.map((s) => GAME_NAMES[s.game])}
          onStart={() => start({ kind: "routine", routine: recommended })}
          startLabel={cap.capped ? "Available tomorrow" : "Start routine"}
          unavailableReason={unavailableReason}
          micReady
          error={null}
          streakDays={streakDays}
          streakBest={progress.streak.best}
        />

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <GoalRing doneSec={goalDoneSec} goalSec={goalSec} />
          {/* The continue card above already says "Start a streak today" (or
              the lapsed best) whenever there is no live streak, so the chip
              here only names a streak that exists. */}
          {streakDays >= 1 && <StreakChip days={streakDays} best={progress.streak.best} />}
        </div>

        <section className="mt-10">
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel heading>Ear training routines</SectionLabel>
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
                  <ol className="mt-4 flex flex-wrap gap-1.5" aria-label="Games in this routine">
                    {r.steps.map((s, i) => (
                      <li key={`${s.game}-${s.difficulty}-${i}`}>
                        <Pill tone="mut">
                          <GameGlyph game={s.game} className="h-4 w-4" />
                          {GAME_NAMES[s.game]}
                        </Pill>
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
      </div>
      {/* Shown only on a deep link's first load, until the room has read it. */}
      {!handledDeepLink && <DeepLinkSlot room="ear" read={false} />}
    </PageShell>
  );
}
