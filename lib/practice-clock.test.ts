import { describe, expect, it } from "vitest";
import { createPracticeClock } from "./practice-clock";

describe("practice time across visibility changes", () => {
  it("counts two 30-second stretches without charging ten hidden minutes", () => {
    let now = 1_000;
    const clock = createPracticeClock(() => now);
    clock.resume();
    now += 30_000;
    clock.pause();
    now += 600_000;
    expect(clock.elapsedMs()).toBe(30_000);
    clock.resume();
    now += 30_000;
    clock.pause();
    expect(clock.elapsedMs()).toBe(60_000);
  });

  it("keeps the last scored snapshot when the singer hides and exits without another rep", () => {
    let now = 0;
    const clock = createPracticeClock(() => now);
    clock.resume();
    now = 30_000;
    const lastScoredMs = clock.elapsedMs();
    now = 35_000;
    clock.pause();
    now += 600_000;
    clock.resume();
    now += 5_000;
    clock.pause();
    expect(lastScoredMs).toBe(30_000);
    expect(clock.elapsedMs()).toBe(40_000);
  });

  it("flushes an active stretch once even when hide, pagehide, and unmount all fire", () => {
    let now = 0;
    const clock = createPracticeClock(() => now);
    clock.resume();
    now = 30_000;
    expect(clock.pause()).toBe(true);
    now += 600_000;
    expect(clock.pause()).toBe(false);
    expect(clock.pause()).toBe(false);
    expect(clock.elapsedMs()).toBe(30_000);
  });

  it("retains short stretches and fractional seconds until a studio flush can log them", () => {
    let now = 0;
    const clock = createPracticeClock(() => now);
    for (let i = 0; i < 3; i++) {
      clock.resume();
      now += 15_500;
      clock.pause();
      now += 600_000;
    }
    expect(Math.floor(clock.elapsedMs() / 1000)).toBe(46);
  });

  it("starts a fresh timer after a logged stretch without banking the hidden gap", () => {
    let now = 0;
    const clock = createPracticeClock(() => now);
    clock.resume();
    now = 60_000;
    clock.pause();
    expect(clock.elapsedMs()).toBe(60_000);
    clock.reset();
    now += 600_000;
    expect(clock.elapsedMs()).toBe(0);
    expect(clock.pause()).toBe(false);
    clock.resume();
    now += 45_000;
    expect(clock.elapsedMs()).toBe(45_000);
  });

  it("does not restart an already active stretch on duplicate visible events", () => {
    let now = 0;
    const clock = createPracticeClock(() => now);
    clock.resume();
    now = 20_000;
    clock.resume();
    now = 45_000;
    expect(clock.elapsedMs()).toBe(45_000);
  });
});
