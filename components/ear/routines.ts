// Ear-training routines: fixed sequences of games, each at a named difficulty,
// so the room can offer a workout instead of a catalogue.
//
// The four games shipped as four cards with a difficulty toggle on each: a
// singer had to decide which ear skill to train, how hard, and when they had
// done enough, before hearing a single note. Every structured ear course
// (Yousician's technique drills, Functional Ear Trainer's daily sets) answers
// those three questions for you — a named workout, a few games in a sensible
// order, and an end it reaches on its own. This is that catalogue.
//
// Nothing here reads scores. `recommendEarRoutine` only answers "what fits
// this moment"; the path on the room home is where best scores decide what to
// play next.

import { GAME_NAMES, type Difficulty, type GameId } from "./lib";

export interface EarRoutineStep {
  game: GameId;
  difficulty: Difficulty;
}

export interface EarRoutine {
  id: string;
  name: string;
  /** One line, in the singer's terms, for the card and the session header. */
  tagline: string;
  steps: EarRoutineStep[];
}

const step = (game: GameId, difficulty: Difficulty): EarRoutineStep => ({
  game,
  difficulty,
});

/**
 * What each game trains, and how it plays — the line the path row and the
 * runner's intro slide both read from, so a game describes itself once.
 */
export const GAME_TRAINS: Record<GameId, string> = {
  interval: "Interval recognition",
  "pitch-match": "Pitch accuracy",
  "melody-echo": "Melodic memory",
  "higher-lower": "Pitch direction",
};

export const GAME_DESC: Record<GameId, string> = {
  interval: "Two notes play — name the distance between them.",
  "pitch-match": "Hear a note, sing it back, and hold it steady in tune.",
  "melody-echo": "Hear a short melody and echo it back note for note.",
  "higher-lower": "Was the second note higher or lower? Fast rounds, tiny gaps.",
};

/** The two games that listen to you. */
export const GAME_MIC: Record<GameId, boolean> = {
  interval: false,
  "pitch-match": true,
  "melody-echo": true,
  "higher-lower": false,
};

/**
 * Wall-clock seconds a ten-round game takes, near enough for a card.
 *
 * Unlike a warmup, an ear game has no schedule to add up: the rounds are
 * paced by the singer. These are the observed lengths of a ten-round run —
 * the two tapping games run about a minute, pitch match spends 1.5s holding
 * plus its reference tone per round, and melody echo plays and then waits out
 * a window several seconds long.
 */
export const EAR_GAME_SECONDS: Record<GameId, number> = {
  "higher-lower": 60,
  interval: 60,
  "pitch-match": 120,
  "melody-echo": 150,
};

/**
 * Seconds the intro slide holds before its step starts itself. The same four
 * as the warmup runner, for the same reason: long enough to read the game and
 * why it is next, short enough that a repeat visitor is never waiting.
 */
export const EAR_STEP_INTRO_SEC = 4;

export const EAR_ROUTINES: EarRoutine[] = [
  {
    id: "quick",
    name: "Quick ear",
    tagline: "Four minutes, all easy: direction, intervals, then one sung note.",
    steps: [
      step("higher-lower", "easy"),
      step("interval", "easy"),
      step("pitch-match", "easy"),
    ],
  },
  {
    id: "daily",
    name: "Daily ear workout",
    tagline: "The everyday set: all four games, the listening ones at medium.",
    steps: [
      step("higher-lower", "medium"),
      step("interval", "medium"),
      step("pitch-match", "medium"),
      step("melody-echo", "easy"),
    ],
  },
  {
    id: "full",
    name: "Full ear workout",
    tagline: "Ten minutes: every game at medium, then intervals and pitch at hard.",
    steps: [
      step("higher-lower", "medium"),
      step("interval", "medium"),
      step("pitch-match", "medium"),
      step("melody-echo", "medium"),
      step("interval", "hard"),
      step("pitch-match", "hard"),
    ],
  },
  {
    id: "intervals",
    name: "Interval drill",
    tagline: "One game, three difficulties: four intervals, then seven, then all twelve.",
    steps: [
      step("interval", "easy"),
      step("interval", "medium"),
      step("interval", "hard"),
    ],
  },
  {
    id: "pitch",
    name: "Pitch lab",
    tagline: "Sing every round: pitch match up through hard, then echo a melody.",
    steps: [
      step("pitch-match", "easy"),
      step("pitch-match", "medium"),
      step("pitch-match", "hard"),
      step("melody-echo", "medium"),
    ],
  },
];

export function earRoutineById(id: string | null | undefined): EarRoutine | null {
  if (!id) return null;
  return EAR_ROUTINES.find((r) => r.id === id) ?? null;
}

/** Estimated seconds for a whole routine, intro slides included. */
export function earRoutineSeconds(r: EarRoutine): number {
  return r.steps.reduce(
    (a, s) => a + EAR_GAME_SECONDS[s.game] + EAR_STEP_INTRO_SEC,
    0,
  );
}

export function earRoutineMinutes(r: EarRoutine): number {
  return Math.max(1, Math.round(earRoutineSeconds(r) / 60));
}

/** True when any step of this routine needs the microphone. */
export function earRoutineNeedsMic(r: EarRoutine): boolean {
  return r.steps.some((s) => GAME_MIC[s.game]);
}

/** "Interval ID · Medium" — the label a results row and an intro slide share. */
export function earStepLabel(s: EarRoutineStep): string {
  const diff = s.difficulty[0].toUpperCase() + s.difficulty.slice(1);
  return `${GAME_NAMES[s.game]} · ${diff}`;
}

/**
 * Which ear workout to put at the top of the room right now.
 *
 * Someone who has already practised today gets the quick one — a second visit
 * is a top-up, not another full workout. Everyone else gets the daily.
 */
export function recommendEarRoutine(opts: { practicedToday: boolean }): EarRoutine {
  const pick = opts.practicedToday ? "quick" : "daily";
  return earRoutineById(pick) ?? EAR_ROUTINES[0];
}
