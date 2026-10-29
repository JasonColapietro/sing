import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { createPracticeClock } from "@/lib/practice-clock";
import type { LogResult } from "@/lib/progress";
import { emptyTargetStats } from "./target-practice";

const mic = vi.hoisted(() => ({ listening: true }));

vi.mock("@/lib/audio/use-pitch", () => ({
  usePitch: () => ({
    frame: { freq: null, note: null, volume: 0, clarity: 0, t: 0 },
    latest: { current: { freq: null, note: null, volume: 0, clarity: 0, t: 0 } },
    listening: mic.listening,
    error: null,
    start: async () => true,
    stop: () => {},
    getStream: () => null,
    subscribe: () => () => {},
  }),
}));
vi.mock("@/lib/pro", () => ({ useIsPro: () => false, useProReady: () => true }));

import { StudioClient, StudioLastSession, carriesOver, finishStudioSession } from "./studio-client";
import { recoveryRangeNote } from "@/components/practice/program-range-note";

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

describe("the studio before the mic opens", () => {
  it("puts Enable microphone above the example trace, on a phone's first screen", () => {
    mic.listening = false;
    try {
      const html = renderToStaticMarkup(<StudioClient />);
      const button = html.indexOf(">Enable microphone<");
      const figure = html.indexOf("What the trace draws once the mic is on");
      expect(button).toBeGreaterThan(-1);
      expect(figure).toBeGreaterThan(button);
      // One line under the gate's title, in American spelling.
      expect(html).toContain("Sing any note to see its name, how far off center it is, and its trace.");
      expect(html).not.toContain("centre");
    } finally {
      mic.listening = true;
    }
  });
});

describe("the studio's Stop card", () => {
  const short = { log: null, locks: 0, newBest: false };
  const links = (html: string) => [...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g)].map((m) => [m[1], m[2]]);

  it("offers the range test only while one is due", () => {
    const html = renderToStaticMarkup(
      <StudioLastSession result={short} elapsedSec={30} retestDue programNote={null} programDayHref={null} />,
    );
    expect(links(html)[0]).toEqual(["/range?mode=range#start", "Take the 2-minute range test"]);
    expect(html).toContain('href="/warmups"');
  });

  it("sends a singer with a recent saved range to practice, not a retest", () => {
    // A range tested three days ago: retestDue is false (lib/progress rangeRetestDue).
    const html = renderToStaticMarkup(
      <StudioLastSession result={short} elapsedSec={30} retestDue={false} programNote={null} programDayHref={null} />,
    );
    expect(html).not.toContain("range test");
    expect(html).not.toContain("/range");
    expect(links(html)[0]).toEqual(["/warmups", "Warm up"]);
    expect(html).toContain('href="/songs"');
    expect(html).toContain("Retest weeks apart, not in the same session.");
  });

  it("leaves the range test out during Recovery week, in the coach's words", () => {
    const note = recoveryRangeNote({}, "Recovery week", Date.parse("2026-10-13T12:00:00Z"))!;
    const html = renderToStaticMarkup(
      <StudioLastSession result={short} elapsedSec={30} retestDue={false} programNote={note} programDayHref={null} />,
    ).replace(/&#x27;/g, "'");
    expect(html).toContain(note);
    expect(html).not.toContain("Take the 2-minute range test");
  });

  it("reads the rule the /range meter uses, as the mic starts", () => {
    const src = readFileSync(new URL("./studio-client.tsx", import.meta.url), "utf8");
    expect(src).toContain("const retestRule = useRangeRetestRule();");
    expect(src).toContain("retestDue={retestRule.offerRetest}");
    expect(src).toContain("{retestRule.probe}");
    const start = src.slice(src.indexOf("const handleStart = async"), src.indexOf("const handleStop = () =>"));
    expect(start).toMatch(/^const handleStart = async \(\) => \{\s*readRetestRule\(\);/);
  });

  it("keeps a short session's time for Sing again, as the card says", () => {
    const html = renderToStaticMarkup(
      <StudioLastSession result={short} elapsedSec={30} retestDue programNote={null} programDayHref={null} />,
    );
    expect(html).toContain("Sing again adds to the time.");
    // Sing again is handleStart: it resets the bank only when nothing carries
    // over (carriesOver), and the header clock carries on from it.
    expect(carriesOver(short)).toBe(true);
    const src = readFileSync(new URL("./studio-client.tsx", import.meta.url), "utf8");
    const start = src.slice(src.indexOf("const handleStart = async"), src.indexOf("const handleStop = () =>"));
    expect(start).toMatch(/const carry = carriesOver\(toast\);\s*if \(!carry\) \{\s*practiceClock\.reset\(\);/);
    expect(start).toContain("setElapsed(carry ? Math.floor(practiceClock.elapsedMs() / 1000) : 0);");
  });

  it("shows the card for a short heard session with no lock, so Sing again can carry it", () => {
    // A tuner-only 30 s stop: no log, no lock, not silent. Without the card
    // the gate says Enable microphone and the next start drops the 30 s.
    const src = readFileSync(new URL("./studio-client.tsx", import.meta.url), "utf8");
    const close = src.slice(src.indexOf("const closeSession = useCallback"), src.indexOf("const pitch = usePitch"));
    expect(close).toMatch(/carriesOver\(result\) && practiceClock\.elapsedMs\(\) > 0/);
    // A Stop a moment after Start resets the clock, so it still shows nothing.
    const clock = runClock(1_500);
    finishStudioSession({ clock, stats: { current: emptyTargetStats() }, heardMs: { current: 0 } }, vi.fn(() => LOGGED));
    expect(clock.elapsedMs()).toBe(0);
  });

  it("logs the second short session with the first one's banked time", () => {
    // 30 s, Stop, Sing again, 20 s, Stop: one 50 s session.
    let now = 1_000;
    const clock = createPracticeClock(() => now);
    const session = { clock, stats: { current: emptyTargetStats() }, heardMs: { current: 0 } };
    clock.resume();
    now += 30_000;
    session.heardMs.current = 10_000;
    const log = vi.fn(() => LOGGED);
    expect(finishStudioSession(session, log)?.log).toBeNull();
    clock.resume();
    now += 20_000;
    expect(finishStudioSession(session, log)?.log).toBe(LOGGED);
    expect(log).toHaveBeenCalledWith({ type: "pitch", durationSec: 50, detail: "Studio session" });
  });
});
