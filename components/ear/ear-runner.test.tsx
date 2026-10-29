import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FreeCap } from "@/lib/free-cap";

// SessionShell is a portal and renders nothing on the server, so the screen's
// contents are rendered in place here, the top bar's right slot marked.
vi.mock("@/components/practice/session-shell", () => ({
  SESSION_FOCUS: "",
  SessionButton: ({ children }: { children: ReactNode }) => <button type="button">{children}</button>,
  SessionShell: ({ children, bottom, topRight }: { children: ReactNode; bottom?: ReactNode; topRight?: ReactNode }) => (
    <div>
      <div data-slot="top-right">{topRight}</div>
      {children}
      {bottom}
    </div>
  ),
}));

// The real allowance unless a test sets one.
const capState = vi.hoisted(() => ({ current: null as FreeCap | null }));
vi.mock("@/lib/free-cap", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/free-cap")>();
  return { ...actual, useFreeCap: () => capState.current ?? actual.useFreeCap() };
});

import { EMPTY_FRAME, type UsePitchResult } from "@/lib/audio/use-pitch";
import { readFileSync } from "node:fs";
import { EarRunResults, EarRunner, earIntroFreeLeft, earPhaseListens } from "./ear-runner";
import { EAR_ROUTINES, GAME_MIC, earRoutineSeconds } from "./routines";
import type { EarStepResult } from "./session";
import { PitchMatchGame } from "./pitch-match-game";
import { MelodyEchoGame } from "./melody-echo-game";
import { NoteCatcherGame, dealsWhenMicOn } from "./note-catcher-game";

const quick = EAR_ROUTINES.find((r) => r.id === "quick")!;
const played: EarStepResult = {
  score: 80,
  bestStreak: 5,
  results: Array(10).fill(true),
  xpGained: 20,
  newAchievements: [],
  newBest: false,
};

function render(capped: boolean) {
  return renderToStaticMarkup(
    <EarRunResults
      routine={quick}
      // The free minutes ran out after the first game: the rest never ran.
      results={[played]}
      capped={capped}
      onContinue={() => {}}
      onAgain={() => {}}
    />,
  );
}

describe("a routine the free minutes stopped", () => {
  it("offers no Play again, which could only reopen the cap slide, and says why the set stopped", () => {
    const html = render(true);
    expect(html).not.toContain("Play again");
    expect(html).toContain("free minutes of guided practice");
    expect(html).toMatch(/<a[^>]*href="\/pro#buy"[^>]*>Keep practicing today with Pro, \$79 once<\/a>/);
  });

  it("keeps Play again, and no cap note, while the allowance is open", () => {
    const html = render(false);
    expect(html).toContain("Play again");
    expect(html).not.toContain("Pro has no daily limit");
  });
});

describe("a routine the free minutes stopped between games", () => {
  function stopped(capStoppedAt: number | null, results: (EarStepResult | null)[] = [played]) {
    return renderToStaticMarkup(
      <EarRunResults
        routine={quick}
        results={results}
        capStoppedAt={capStoppedAt}
        capped
        onContinue={() => {}}
        onAgain={() => {}}
      />,
    ).replace(/<!-- -->/g, "");
  }

  it("calls the games it never reached not reached, and says why above them", () => {
    const html = stopped(1);
    const left = quick.steps.length - 1;
    expect(html.match(/>not reached</g)).toHaveLength(left);
    expect(html).not.toContain(">skipped<");
    expect(html).toContain(`ran out before the last ${left === 1 ? "step" : `${left} steps`} of this run.`);
    expect(html.indexOf("ran out before")).toBeLessThan(html.indexOf("Step by step"));
  });

  it("keeps a game skipped by hand as skipped, and the plain note when nothing was cut short", () => {
    const html = stopped(2, [played, null]);
    expect(html).toContain(">skipped<");
    expect(stopped(null)).toContain("That&#x27;s today&#x27;s 5 free minutes of guided practice.");
  });
});

/** A routine's microphone, already on from an earlier step. */
const lentMic: UsePitchResult = {
  frame: EMPTY_FRAME,
  latest: { current: EMPTY_FRAME },
  listening: true,
  error: null,
  start: async () => true,
  stop: () => {},
  getStream: () => null,
  subscribe: () => () => {},
};

describe("a listening game inside a routine whose mic is on", () => {
  const noop = () => {};
  const games = [
    ["Pitch match", (pitch?: UsePitchResult) => <PitchMatchGame difficulty="easy" pitch={pitch} onExit={noop} onComplete={noop} />],
    ["Melody echo", (pitch?: UsePitchResult) => <MelodyEchoGame difficulty="easy" pitch={pitch} onExit={noop} onComplete={noop} />],
    ["Note catcher", (pitch?: UsePitchResult) => <NoteCatcherGame difficulty="easy" pitch={pitch} onExit={noop} onComplete={noop} />],
  ] as const;

  it.each(games)("%s opens without another Enable microphone gate", (_name, game) => {
    const html = renderToStaticMarkup(game(lentMic));
    expect(html).not.toContain("Enable microphone");
    expect(html).not.toContain("This game listens to you sing");
  });

  it.each(games)("%s still asks for the mic when it has to open its own", (_name, game) => {
    expect(renderToStaticMarkup(game())).toContain("Enable microphone");
    expect(renderToStaticMarkup(game({ ...lentMic, listening: false }))).toContain("Enable microphone");
  });
});

describe("who deals Note catcher's run in a routine", () => {
  it("is the game itself once a lent mic is on, so the gate's button only turns it on", () => {
    // Lent, nothing dealt yet: the mic going live deals the run, once.
    expect(dealsWhenMicOn(true, false, false)).toBe(true);
    // A game with its own mic deals from the button, as it always has.
    expect(dealsWhenMicOn(false, false, false)).toBe(false);
    // A run already dealt (the mic dropped mid-run) or a finished game.
    expect(dealsWhenMicOn(true, true, false)).toBe(false);
    expect(dealsWhenMicOn(true, false, true)).toBe(false);
  });
});

describe("when a routine's open microphone is analyzed", () => {
  it("only while a game that listens is played, never on a slide, a tapping game or the results", () => {
    // The stream stays open from the first singing step to the results, so
    // no step asks for the mic again; the analysis loop, which updated state
    // on every animation frame, re-rendered the whole routine through
    // Interval ID, Higher or lower and the slides between steps.
    let listening = 0;
    let quiet = 0;
    for (const routine of EAR_ROUTINES) {
      routine.steps.forEach((step, i) => {
        expect(earPhaseListens({ kind: "intro", step: i }, routine.steps)).toBe(false);
        const plays = earPhaseListens({ kind: "play", step: i }, routine.steps);
        expect(plays, `${routine.id} ${step.game}`).toBe(GAME_MIC[step.game]);
        if (plays) listening++;
        else quiet++;
      });
      expect(earPhaseListens({ kind: "done" }, routine.steps)).toBe(false);
    }
    // The routines mix both kinds, so the pause is exercised.
    expect(listening).toBeGreaterThan(0);
    expect(quiet).toBeGreaterThan(0);
  });

  it("is what the runner hands its microphone", () => {
    const src = readFileSync(new URL("./ear-runner.tsx", import.meta.url), "utf8");
    expect(src).toContain("const pitch = usePitch({ analyse: earPhaseListens(phase, routine.steps) });");
  });
});

describe("a routine opened straight from a program row", () => {
  afterEach(() => {
    capState.current = null;
  });

  const free = (leftSec: number): FreeCap => ({
    isPro: false,
    usedSec: 300 - leftSec,
    leftSec,
    capped: leftSec <= 0,
    capSec: 300,
  });

  /** The top bar's right slot on the first game's intro slide. */
  function topRight(routine = quick): string {
    const html = renderToStaticMarkup(<EarRunner routine={routine} onExit={() => {}} />);
    return html.match(/<div data-slot="top-right">(.*?)<\/div>/)?.[1] ?? "";
  }

  it("shows the free minutes left on the intro slide when the routine outlasts them", () => {
    // /ear-training?routine=quick skips the room's allowance line, so this is
    // the only place the countdown can be read before the cap slide.
    capState.current = free(100);
    expect(topRight()).toContain("1:40 free left today");
  });

  it("shows nothing on Pro", () => {
    capState.current = { isPro: true, usedSec: 0, leftSec: Number.POSITIVE_INFINITY, capped: false, capSec: 300 };
    expect(topRight()).not.toContain("free left");
  });

  it("shows nothing while the free minutes cover the rest of the routine", () => {
    expect(earRoutineSeconds(quick)).toBeLessThanOrEqual(300);
    capState.current = free(300);
    expect(topRight()).not.toContain("free left");
  });

  it("counts only the games still ahead", () => {
    const pitchLab = EAR_ROUTINES.find((r) => r.id === "pitch")!;
    const last = pitchLab.steps.length - 1;
    const lastSec = earRoutineSeconds({ ...pitchLab, steps: pitchLab.steps.slice(last) });
    expect(earIntroFreeLeft(pitchLab, last, { isPro: false, leftSec: lastSec })).toBeNull();
    expect(earIntroFreeLeft(pitchLab, 0, { isPro: false, leftSec: lastSec })).toMatch(/ free left today$/);
    expect(earIntroFreeLeft(pitchLab, 0, { isPro: true, leftSec: 0 })).toBeNull();
  });
});
