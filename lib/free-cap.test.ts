import { describe, expect, it } from "vitest";
import { DEFAULT_PROGRESS, type ProgressState, type SessionLog } from "./progress-shape";
import {
  CAPPED_TYPES,
  FREE_DAILY_SEC,
  formatClock,
  freeSecondsLeft,
  guidedSecondsToday,
  isCapped,
} from "./free-cap";

const DAY = "2026-09-03";

function session(type: SessionLog["type"], durationSec: number, day = DAY): SessionLog {
  return {
    id: `${type}-${durationSec}-${day}`,
    type,
    date: `${day}T12:00:00.000Z`,
    day,
    durationSec,
    xp: 4,
  };
}

function state(...sessions: SessionLog[]): ProgressState {
  return { ...DEFAULT_PROGRESS, sessions };
}

describe("free daily cap", () => {
  it("is three minutes, and covers exactly the four guided rooms", () => {
    expect(FREE_DAILY_SEC).toBe(180);
    expect([...CAPPED_TYPES].sort()).toEqual(["breath", "ear", "song", "warmup"]);
  });

  it("counts only guided practice logged today", () => {
    const s = state(
      session("warmup", 60),
      session("ear", 30),
      session("pitch", 500), // the studio is never counted
      session("range", 120), // nor the range test
      session("song", 45, "2026-09-02"), // nor yesterday
    );
    expect(guidedSecondsToday(s, DAY)).toBe(90);
  });

  it("runs the allowance down and stops at zero", () => {
    expect(freeSecondsLeft(state(), false, DAY)).toBe(180);
    expect(freeSecondsLeft(state(session("warmup", 100)), false, DAY)).toBe(80);
    expect(freeSecondsLeft(state(session("warmup", 400)), false, DAY)).toBe(0);
    expect(isCapped(state(session("warmup", 179)), false, DAY)).toBe(false);
    expect(isCapped(state(session("warmup", 180)), false, DAY)).toBe(true);
  });

  it("never caps Pro", () => {
    const heavy = state(session("warmup", 3600), session("song", 3600));
    expect(freeSecondsLeft(heavy, true, DAY)).toBe(Number.POSITIVE_INFINITY);
    expect(isCapped(heavy, true, DAY)).toBe(false);
  });

  it("resets with the calendar day", () => {
    const s = state(session("warmup", 500, "2026-09-02"));
    expect(isCapped(s, false, "2026-09-02")).toBe(true);
    expect(isCapped(s, false, "2026-09-03")).toBe(false);
  });

  it("formats the readout as m:ss", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(130)).toBe("2:10");
    expect(formatClock(180)).toBe("3:00");
  });
});
