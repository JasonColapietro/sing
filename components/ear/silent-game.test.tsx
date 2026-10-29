import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Plays each real listening game to its end, with the real session and its
// real logging (StepDone), against a mic that hears nothing, then one voice.
const hooks = await vi.hoisted(async () => (await import("@/tests/hooks-harness")).createHooks());
vi.mock("react", async (original) => hooks.mockReact(await original<typeof import("react")>()));

const fixture = vi.hoisted(() => ({
  log: vi.fn(() => ({ xpGained: 6, newAchievements: [] })),
  emit: vi.fn(),
  best: vi.fn(() => false),
  voice: null as number | null,
  pitch: {
    listening: true,
    error: null as string | null,
    latest: { current: { freq: null as number | null, t: 0 } },
    start: vi.fn(async () => true),
    stop: vi.fn(),
  },
}));
vi.mock("@/lib/audio/use-pitch", () => ({ usePitch: () => fixture.pitch }));
vi.mock("@/lib/audio/devices", () => ({ useAudioPrefs: () => ({ monitoring: "headphones" }) }));
vi.mock("@/lib/audio/synth", () => ({ playTone: () => 0, playSequence: () => 0 }));
vi.mock("@/lib/progress", () => ({ useProgress: () => ({ range: {}, streak: { current: 0, lastDay: null } }), logSession: fixture.log }));
vi.mock("@/lib/pro-signal", () => ({ emitProResult: fixture.emit }));
vi.mock("./lib", async (original) => ({ ...(await original<typeof import("./lib")>()), saveBest: fixture.best }));
vi.mock("@/components/ui", () => ({ MicGate: "mic-gate" }));
vi.mock("@/components/practice/learn-home", () => ({ useDailyGoal: () => ({ goalSec: 600 }), useGoalDoneSec: () => 0 }));

import { PitchMatchGame } from "./pitch-match-game";
import { MelodyEchoGame } from "./melody-echo-game";
import { NoteCatcherGame } from "./note-catcher-game";
import { StepDone, earGameCredits, type EarStepResult } from "./session";
import { GAME_MIC } from "./routines";
import { GAME_NAMES, type GameId } from "./lib";
import { EarRunResults, earSilentLine } from "./ear-runner";

let now = 0;
let nextFrame = 1;
let frames = new Map<number, FrameRequestCallback>();

const LISTENING: [GameId, typeof PitchMatchGame][] = [
  ["pitch-match", PitchMatchGame],
  ["melody-echo", MelodyEchoGame],
  ["note-catcher", NoteCatcherGame],
];

/**
 * Play a game to the end: frames at 60 fps, Enter once a second (next round,
 * or done singing). Each render also renders the StepDone the finished game
 * returns, in the same hook slots, as React would mount it.
 */
function play(Game: typeof PitchMatchGame): EarStepResult[] {
  const completed: EarStepResult[] = [];
  const props = { difficulty: "easy" as const, pitch: fixture.pitch as never, onExit() {}, onComplete: (r: EarStepResult) => completed.push(r) };
  let done = false;
  const draw = () =>
    hooks.render(() => {
      const tree = Game(props) as ReactElement<Record<string, unknown>>;
      if (tree.type === StepDone) {
        done = true;
        StepDone(tree.props as Parameters<typeof StepDone>[0]);
      }
      return tree;
    });
  draw();
  for (let sec = 0; sec < 600 && completed.length === 0; sec++) {
    for (let ms = 0; ms < 1000; ms += 16) {
      now += 16;
      fixture.pitch.latest.current = { freq: fixture.voice, t: now };
      vi.advanceTimersByTime(16);
      const due = frames;
      frames = new Map();
      due.forEach((callback) => callback(now));
      draw();
    }
    if (!done) {
      window.dispatchEvent(Object.assign(new Event("keydown"), { key: "Enter" }));
      draw();
    }
  }
  return completed;
}

beforeEach(() => {
  hooks.reset(); vi.clearAllMocks(); vi.useFakeTimers();
  fixture.voice = null;
  now = 0; nextFrame = 1; frames = new Map();
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.stubGlobal("window", Object.assign(new EventTarget(), { setTimeout, clearTimeout }));
  vi.stubGlobal("document", Object.assign(new EventTarget(), { visibilityState: "visible" }));
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrame++; frames.set(id, callback); return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
});
afterEach(() => { hooks.unmount(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("an ear game the mic heard nothing of", () => {
  it("covers every game that listens", () => {
    const listening = (Object.keys(GAME_MIC) as GameId[]).filter((g) => GAME_MIC[g]);
    expect(listening.sort()).toEqual(LISTENING.map(([g]) => g).sort());
  });

  it.each(LISTENING)("%s plays out in silence and logs nothing", (_game, Game) => {
    const [result, ...rest] = play(Game);
    expect(rest).toEqual([]);
    expect(result).toMatchObject({ silent: true, xpGained: 0, newAchievements: [], newBest: false });
    // No XP, streak day, "First note", free minutes or program tick, no best
    // and no Pro moment for a game nobody sang.
    expect(fixture.log).not.toHaveBeenCalled();
    expect(fixture.best).not.toHaveBeenCalled();
    expect(fixture.emit).not.toHaveBeenCalled();
  });

  it.each(LISTENING)("%s logs a game the mic heard a voice in, as before", (game, Game) => {
    fixture.voice = 220;
    const [result] = play(Game);
    expect(result.silent).toBeUndefined();
    expect(result.xpGained).toBe(6);
    expect(fixture.log).toHaveBeenCalledOnce();
    expect(fixture.log).toHaveBeenCalledWith(expect.objectContaining({ type: "ear", detail: GAME_NAMES[game] }));
  });

  it("never holds back a game that only plays notes", () => {
    expect(earGameCredits("interval", false)).toBe(true);
    expect(earGameCredits("higher-lower", false)).toBe(true);
    expect(earGameCredits("pitch-match", false)).toBe(false);
    expect(earGameCredits("pitch-match", true)).toBe(true);
  });
});

describe("the results after a silent game", () => {
  const heard: EarStepResult = { score: 60, bestStreak: 3, results: [], xpGained: 6, newAchievements: [], newBest: false };
  const silent: EarStepResult = { score: 0, bestStreak: 0, results: [], xpGained: 0, newAchievements: [], newBest: false, silent: true };

  it("says no sound was picked up and grades only what was heard", () => {
    hooks.reset();
    const routine = {
      id: "t",
      name: "Test set",
      tagline: "",
      steps: [
        { game: "interval" as const, difficulty: "easy" as const },
        { game: "pitch-match" as const, difficulty: "easy" as const },
      ],
    };
    const tree = hooks.render(() => {
      const outer = EarRunResults({ routine: routine as never, results: [heard, silent], capped: false, onContinue() {}, onAgain() {} });
      return (outer.type as (props: unknown) => ReactElement)(outer.props);
    }) as ReactElement<{ score: number | null; rows: { score: number | null; note?: string }[]; notice: ReactNode }>;
    expect(tree.props.score).toBe(60);
    expect(tree.props.rows.map((r) => [r.score, r.note])).toEqual([[60, undefined], [null, "no sound"]]);
    const notice = renderToStaticMarkup(<>{tree.props.notice}</>);
    expect(notice).toContain("No sound picked up");
    expect(notice).toContain("The mic heard no note in Pitch match, so that game was not logged.");
  });

  it("names a lone game's silence without listing it", () => {
    expect(earSilentLine()).toBe(
      "The mic heard no note this game, so nothing was logged. If you were singing, sing a little louder or closer to the mic, or check the input, then play again.",
    );
    expect(earSilentLine(["Pitch match", "Melody echo", "Note catcher"])).toContain(
      "in Pitch match, Melody echo and Note catcher, so those games were not logged.",
    );
  });

  it("does not ask to play again once the free minutes leave no Play again", () => {
    hooks.reset();
    const routine = {
      id: "t",
      name: "Test set",
      tagline: "",
      steps: [{ game: "pitch-match" as const, difficulty: "easy" as const }, { game: "interval" as const, difficulty: "easy" as const }],
    };
    const tree = hooks.render(() => {
      const outer = EarRunResults({ routine: routine as never, results: [silent, heard], capped: true, onContinue() {}, onAgain() {} });
      return (outer.type as (props: unknown) => ReactElement)(outer.props);
    }) as ReactElement<{ onAgain?: unknown; notice: ReactNode }>;
    expect(tree.props.onAgain).toBeUndefined();
    const notice = renderToStaticMarkup(<>{tree.props.notice}</>);
    expect(notice).toContain("or check the input.");
    expect(notice).not.toContain("play again");
  });
});
