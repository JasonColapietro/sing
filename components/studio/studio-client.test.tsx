import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { createPracticeClock } from "@/lib/practice-clock";
import type { LogResult } from "@/lib/progress";
import { emptyTargetStats } from "./target-practice";

vi.mock("@/lib/audio/use-pitch", () => ({
  usePitch: () => ({
    frame: { freq: null, note: null, volume: 0, clarity: 0, t: 0 },
    latest: { current: { freq: null, note: null, volume: 0, clarity: 0, t: 0 } },
    listening: true,
    error: null,
    start: async () => true,
    stop: () => {},
    getStream: () => null,
    subscribe: () => () => {},
  }),
}));
vi.mock("@/lib/pro", () => ({ useIsPro: () => false, useProReady: () => true }));

import { StudioClient, carriesOver, finishStudioSession } from "./studio-client";

const LOGGED: LogResult = { xpGained: 40, newAchievements: [] } as unknown as LogResult;

/** A clock that has run `ms` of practice and is still running. */
function runClock(ms: number) {
  let now = 1_000;
  const clock = createPracticeClock(() => now);
  clock.resume();
  now += ms;
  return clock;
}

describe("the live studio", () => {
  it("has a status region in the Tuner card for the too-quiet and no-sound hints", () => {
    const html = renderToStaticMarkup(<StudioClient />);
    // Under the tuner's level meter, before the pitch trace, as on the pitch meter.
    expect(html).toMatch(/>Tuner<[\s\S]*role="status"[\s\S]*>Pitch trace</);
  });
});

describe("closing a studio session", () => {
  it("logs nothing for a session in which no note was heard, however long", () => {
    const clock = runClock(50_000);
    const log = vi.fn(() => LOGGED);
    const result = finishStudioSession(
      { clock, stats: { current: emptyTargetStats() }, heardMs: { current: 0 } },
      log,
    );
    expect(result).toEqual({ log: null, locks: 0, newBest: false, silent: true });
    expect(log).not.toHaveBeenCalled();
    // The silent seconds are not banked into the next session.
    expect(clock.elapsedMs()).toBe(0);
  });

  it("says nothing about the mic for a Stop pressed a moment after Start", () => {
    // Under the live hint's own wait: no toast, as before, and nothing banked.
    const clock = runClock(1_500);
    const log = vi.fn(() => LOGGED);
    const result = finishStudioSession(
      { clock, stats: { current: emptyTargetStats() }, heardMs: { current: 0 } },
      log,
    );
    expect(result).toEqual({ log: null, locks: 0, newBest: false });
    expect(log).not.toHaveBeenCalled();
    expect(clock.elapsedMs()).toBe(0);
  });

  it("logs a heard session that ran long enough, and starts the heard time over", () => {
    const clock = runClock(50_000);
    const log = vi.fn(() => LOGGED);
    const heardMs = { current: 4_000 };
    const result = finishStudioSession({ clock, stats: { current: emptyTargetStats() }, heardMs }, log);
    expect(log).toHaveBeenCalledWith({ type: "pitch", durationSec: 50, detail: "Studio session" });
    expect(result).toEqual({ log: LOGGED, locks: 0, newBest: false });
    expect(heardMs.current).toBe(0);
    expect(clock.elapsedMs()).toBe(0);
  });

  it("banks a short heard session for the next flush, as before", () => {
    const clock = runClock(20_000);
    const log = vi.fn(() => LOGGED);
    const result = finishStudioSession(
      { clock, stats: { current: emptyTargetStats() }, heardMs: { current: 900 } },
      log,
    );
    expect(result).toEqual({ log: null, locks: 0, newBest: false });
    expect(result?.silent).toBeUndefined();
    expect(log).not.toHaveBeenCalled();
    expect(clock.elapsedMs()).toBe(20_000);
  });

  it("lets Sing again add to a short session: two 30 s stretches log one 60 s session", () => {
    let now = 1_000;
    const clock = createPracticeClock(() => now);
    clock.resume();
    now += 30_000;
    const session = { clock, stats: { current: emptyTargetStats() }, heardMs: { current: 900 } };
    const first = finishStudioSession(session, vi.fn(() => LOGGED));
    expect(carriesOver(first)).toBe(true);
    // Sing again: the clock resumes where it stopped (handleStart resets only when nothing carries).
    clock.resume();
    now += 30_000;
    const log = vi.fn(() => LOGGED);
    finishStudioSession(session, log);
    expect(log).toHaveBeenCalledWith(expect.objectContaining({ durationSec: 60 }));
  });

  it("starts over after a logged or silent session", () => {
    expect(carriesOver({ log: LOGGED, locks: 0, newBest: false })).toBe(false);
    expect(carriesOver({ log: null, locks: 0, newBest: false, silent: true })).toBe(false);
    expect(carriesOver(null)).toBe(false);
  });

  it("falls straight out once the session is already closed", () => {
    const clock = runClock(50_000);
    const session = { clock, stats: { current: emptyTargetStats() }, heardMs: { current: 0 } };
    finishStudioSession(session, vi.fn(() => LOGGED));
    expect(finishStudioSession(session, vi.fn(() => LOGGED))).toBeNull();
  });
});
