import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { earSessionSeconds } from "./session";
import { EAR_GAME_SECONDS } from "./routines";
import { createActiveTimer } from "@/components/practice/active-clock";

const MIN = 60_000;

describe("an ear game's logged practice time", () => {
  it("holds a turn-based game left idle on a visible screen to three times its usual length", () => {
    // Fourteen seconds of real taps and six minutes waiting on round 2 logged
    // 374 s: a free singer's whole day, and 62 XP.
    const started = 1_000;
    const sec = earSessionSeconds("higher-lower", started, started + 6 * MIN + 14_000);
    expect(sec).toBeLessThanOrEqual(180);
    expect(sec).toBe(EAR_GAME_SECONDS["higher-lower"] * 3);
    expect(earSessionSeconds("interval", 0, 10 * MIN)).toBe(180);
    expect(earSessionSeconds("pitch-match", 0, 10 * MIN)).toBe(360);
    expect(earSessionSeconds("melody-echo", 0, 10 * MIN)).toBe(450);
  });

  it("logs an honest run as it was played", () => {
    expect(earSessionSeconds("higher-lower", 0, 72_400)).toBe(72);
    expect(earSessionSeconds("melody-echo", 0, 200_000)).toBe(200);
  });

  it("never logs less than a second", () => {
    expect(earSessionSeconds("interval", 0, 100)).toBe(1);
  });

  it("leaves Note catcher on its own clock, which already drops paused time", () => {
    expect(earSessionSeconds("note-catcher", 0, 4 * MIN)).toBe(240);
  });
});

describe("an ear game timed on the active clock", () => {
  it("logs fourteen seconds of taps and five idle visible minutes as at most 44 s", () => {
    // Pitch match's 360 s cap would let the idle game take most of a free
    // day; the idle rule keeps thirty seconds of the quiet.
    for (const game of ["higher-lower", "interval", "pitch-match", "melody-echo"] as const) {
      const clock = createActiveTimer(0);
      for (let t = 2_000; t <= 14_000; t += 2_000) clock.mark(t);
      expect(earSessionSeconds(game, clock, 14_000 + 5 * MIN), game).toBeLessThanOrEqual(44);
    }
  });

  it("does not shorten a game played with a tap or a finished round every few seconds", () => {
    const clock = createActiveTimer(0);
    for (let t = 4_000; t <= 100_000; t += 4_000) clock.mark(t);
    expect(earSessionSeconds("melody-echo", clock, 100_000)).toBe(100);
  });

  it("does not cut a sung Pitch match round with no tap for twenty seconds", () => {
    const clock = createActiveTimer(0);
    clock.mark(10_000); // "Next round"
    expect(earSessionSeconds("pitch-match", clock, 30_000)).toBe(30);
  });

  it("still leaves hidden time out", () => {
    const clock = createActiveTimer(0);
    for (let t = 3_000; t <= 30_000; t += 3_000) clock.mark(t);
    clock.hidden(6 * MIN, 30_000 + 6 * MIN);
    clock.mark(30_000 + 6 * MIN + 2_000);
    expect(earSessionSeconds("interval", clock, 30_000 + 6 * MIN + 2_000)).toBe(32);
  });

  it("keeps the three-times cap as a backstop", () => {
    const clock = createActiveTimer(0);
    for (let t = 5_000; t <= 10 * MIN; t += 5_000) clock.mark(t);
    expect(earSessionSeconds("higher-lower", clock, 10 * MIN)).toBe(180);
  });
});

describe("where the ear games' play time comes from", () => {
  const read = (file: string) => readFileSync(new URL(file, import.meta.url), "utf8");

  it("logs through the cap, never a bare clock difference", () => {
    const src = read("./session.tsx");
    expect(src).toContain("const durationSec = earSessionSeconds(game, startedAt, performance.now());");
  });

  it("starts every turn-based game on a clock that skips a hidden tab and idle time", () => {
    // Only Note catcher keeps its own start, which its pause screen and a
    // hidden tab both move (note-catcher-game.tsx).
    for (const file of [
      "./higher-lower-game.tsx",
      "./interval-game.tsx",
      "./pitch-match-game.tsx",
      "./melody-echo-game.tsx",
    ]) {
      const src = read(file);
      expect(src, file).toMatch(/const \[playClock(?:, restartClock)?\] = useActiveStart\(session\.results\.length\);/);
      expect(src, file).not.toMatch(/startedAt=\{(?!playClock\})/);
      expect(src, file).not.toMatch(/setStartedAt\(performance\.now\(\)\)/);
    }
  });

  it("feeds that clock from input anywhere on the page and from finished rounds", () => {
    const src = read("./session.tsx");
    expect(src).toContain("trackActivity(document, () => timer.mark(performance.now()))");
    expect(src).toContain("}, [timer, roundEvent]);");
  });

  it("times the Breathe-and-sing drill on the same idle rule", () => {
    const src = read("../breath/breath-cue-drill.tsx");
    expect(src).toContain("activeElapsedMs(clockRef.current, performance.now()) / 1000");
    expect(src).toContain("trackActivity(document,");
    expect(src).not.toMatch(/performance\.now\(\) - t0Ref/);
  });
});
