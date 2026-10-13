import { describe, expect, it } from "vitest";
import {
  ACTIVITY_EVENTS,
  IDLE_GRACE_MS,
  activeElapsedMs,
  createActiveTimer,
  markActive,
  skipHidden,
  startActiveClock,
  trackActivity,
  type ActiveClock,
  type ActivitySource,
} from "./active-clock";

const SEC = 1_000;
const MIN = 60_000;

/** Taps every `every` ms from `from` to `to`, inclusive. */
function tap(clock: ActiveClock, from: number, to: number, every: number): ActiveClock {
  let c = clock;
  for (let t = from; t <= to; t += every) c = markActive(c, t);
  return c;
}

describe("a game's active play time", () => {
  it("keeps only thirty seconds of a visible screen nobody touches", () => {
    // The round-11 repro: fourteen seconds of real taps, then the phone put
    // down on a visible game for five minutes.
    let c = startActiveClock(0);
    c = tap(c, 2 * SEC, 14 * SEC, 2 * SEC);
    const end = 14 * SEC + 5 * MIN;
    expect(activeElapsedMs(c, end)).toBeLessThanOrEqual(44 * SEC);
    expect(activeElapsedMs(c, end)).toBe(14 * SEC + IDLE_GRACE_MS);
    // Coming back and tapping again does not bring the idle minutes back.
    c = markActive(c, end);
    expect(activeElapsedMs(c, end)).toBe(44 * SEC);
    expect(activeElapsedMs(c, end + 3 * SEC)).toBe(47 * SEC);
  });

  it("does not shorten continuous play with a tap every few seconds", () => {
    let c = startActiveClock(1_000);
    c = tap(c, 1_000 + 3 * SEC, 1_000 + 5 * MIN, 3 * SEC);
    expect(activeElapsedMs(c, 1_000 + 5 * MIN)).toBe(5 * MIN);
  });

  it("does not cut short a round sung for twenty seconds without a tap", () => {
    // Pitch match and Melody echo: "Next round", then the reference and the
    // whole answer window with the singer singing, not tapping.
    let c = startActiveClock(0);
    c = markActive(c, 5 * SEC);
    expect(activeElapsedMs(c, 25 * SEC)).toBe(25 * SEC);
    c = markActive(c, 25 * SEC);
    // A gap of exactly the grace still counts in full.
    expect(activeElapsedMs(c, 25 * SEC + IDLE_GRACE_MS)).toBe(25 * SEC + IDLE_GRACE_MS);
    // One second past it is where the excess starts.
    expect(activeElapsedMs(c, 26 * SEC + IDLE_GRACE_MS)).toBe(25 * SEC + IDLE_GRACE_MS);
  });

  it("still leaves out hidden time, without counting it twice as idle", () => {
    // Taps to 20 s, the tab hidden from 25 s for six minutes, back and
    // tapping 10 s after it shows again: 15 s of visible quiet in all.
    let c = startActiveClock(0);
    c = tap(c, 4 * SEC, 20 * SEC, 4 * SEC);
    const back = 25 * SEC + 6 * MIN;
    c = skipHidden(c, 6 * MIN, back);
    c = markActive(c, back + 10 * SEC);
    expect(activeElapsedMs(c, back + 10 * SEC)).toBe(35 * SEC);
  });

  it("adds the visible quiet either side of a hidden stretch", () => {
    // 25 s idle before hiding and 25 s after coming back is 50 s of nobody
    // there on a visible screen: 20 s of it is excess.
    let c = startActiveClock(0);
    c = markActive(c, 10 * SEC);
    const back = 35 * SEC + 2 * MIN;
    c = skipHidden(c, 2 * MIN, back);
    c = markActive(c, back + 25 * SEC);
    expect(activeElapsedMs(c, back + 25 * SEC)).toBe(10 * SEC + 50 * SEC - 20 * SEC);
  });

  it("never reports less than nothing", () => {
    const c = skipHidden(startActiveClock(10 * SEC), 5 * MIN, 20 * SEC);
    expect(activeElapsedMs(c, 20 * SEC)).toBe(0);
  });

  it("skips only the part of a hidden stretch after a restart", () => {
    // Hidden at 5 s, the mic turns on and restarts the run at 60 s while the
    // tab is still hidden, back at 100 s, then a minute of play with taps:
    // only the 40 s hidden after the restart are left out.
    let c = startActiveClock(0);
    c = startActiveClock(60 * SEC);
    c = skipHidden(c, 95 * SEC, 100 * SEC);
    expect(c.start).toBe(100 * SEC);
    c = tap(c, 103 * SEC, 160 * SEC, 3 * SEC);
    expect(activeElapsedMs(c, 160 * SEC)).toBe(60 * SEC);
  });
});

describe("the mutable timer", () => {
  it("runs the same arithmetic and restarts cleanly", () => {
    const timer = createActiveTimer(0);
    for (let t = 2 * SEC; t <= 14 * SEC; t += 2 * SEC) timer.mark(t);
    expect(timer.elapsedMs(14 * SEC + 5 * MIN)).toBe(44 * SEC);
    // A hidden minute inside that idle stretch changes nothing: it was
    // already not being counted.
    timer.hidden(MIN, 14 * SEC + 5 * MIN);
    expect(timer.elapsedMs(14 * SEC + 5 * MIN)).toBe(44 * SEC);
    timer.restart(10 * MIN);
    expect(timer.elapsedMs(10 * MIN + 12 * SEC)).toBe(12 * SEC);
    // Hidden since before the restart: only the time after it is skipped.
    timer.hidden(MIN, 10 * MIN + 20 * SEC);
    expect(timer.elapsedMs(10 * MIN + 50 * SEC)).toBe(30 * SEC);
  });
});

describe("what counts as input", () => {
  /** A document stand-in that records its listeners. */
  function fakeDoc() {
    const target = new EventTarget();
    const added: string[] = [];
    const doc: ActivitySource & { fire(type: string): void; added: string[] } = {
      added,
      addEventListener: (type, fn, options) => {
        added.push(type);
        target.addEventListener(type, fn, options);
      },
      removeEventListener: (type, fn, options) => target.removeEventListener(type, fn, options),
      fire: (type) => target.dispatchEvent(new Event(type)),
    };
    return doc;
  }

  it("is a tap, a click or a key anywhere on the page, until unsubscribed", () => {
    const doc = fakeDoc();
    let n = 0;
    const stop = trackActivity(doc, () => n++);
    expect(doc.added).toEqual([...ACTIVITY_EVENTS]);
    doc.fire("pointerdown");
    doc.fire("keydown");
    doc.fire("touchstart");
    doc.fire("pointermove");
    expect(n).toBe(3);
    stop();
    doc.fire("pointerdown");
    expect(n).toBe(3);
  });
});
