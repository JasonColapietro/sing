import { describe, expect, it } from "vitest";
import {
  EMPTY_DOSE,
  type DoseState,
  accumulate,
  doseDay,
  fmtCycles,
  recentDays,
  today,
} from "./vocal-dose";

const DAY = "2026-08-14";

/** Fold `n` frames of a steady tone into the state. */
function sing(state: DoseState, f0: number, seconds: number, day = DAY): DoseState {
  const frames = 60 * seconds;
  let s = state;
  for (let i = 0; i < frames; i++) {
    s = accumulate(s, { day, f0, dtSec: 1 / 60 });
  }
  return s;
}

describe("doseDay", () => {
  it("formats the local calendar day, zero-padded", () => {
    expect(doseDay(new Date(2026, 0, 5, 13, 0, 0))).toBe("2026-01-05");
    expect(doseDay(new Date(2026, 11, 31, 23, 59, 0))).toBe("2026-12-31");
  });

  it("uses local time, not UTC, so a late-night session lands on the right day", () => {
    // 23:30 local on the 14th is the 15th in UTC for any negative offset.
    expect(doseDay(new Date(2026, 7, 14, 23, 30, 0))).toBe("2026-08-14");
  });
});

describe("accumulate", () => {
  it("counts cycles as F0 x time", () => {
    const s = sing(EMPTY_DOSE, 220, 10);
    expect(today(s, DAY).cycles).toBeCloseTo(2200, 6);
    expect(today(s, DAY).phonationSec).toBeCloseTo(10, 6);
  });

  it("charges an octave up at twice the cycles for the same seconds", () => {
    const low = today(sing(EMPTY_DOSE, 220, 10), DAY);
    const high = today(sing(EMPTY_DOSE, 440, 10), DAY);
    expect(high.cycles / low.cycles).toBeCloseTo(2, 6);
    expect(high.phonationSec).toBeCloseTo(low.phonationSec, 6);
  });

  it("ignores unvoiced frames entirely", () => {
    let s = EMPTY_DOSE;
    for (let i = 0; i < 600; i++) s = accumulate(s, { day: DAY, f0: null, dtSec: 1 / 60 });
    expect(s).toBe(EMPTY_DOSE);
    expect(today(s, DAY).phonationSec).toBe(0);
  });

  it("ignores nonsense frames rather than poisoning the total with NaN", () => {
    let s = EMPTY_DOSE;
    s = accumulate(s, { day: DAY, f0: 0, dtSec: 1 });
    s = accumulate(s, { day: DAY, f0: -220, dtSec: 1 });
    s = accumulate(s, { day: DAY, f0: NaN, dtSec: 1 });
    s = accumulate(s, { day: DAY, f0: 220, dtSec: 0 });
    s = accumulate(s, { day: DAY, f0: 220, dtSec: -1 });
    expect(today(s, DAY).cycles).toBe(0);
    expect(today(s, DAY).phonationSec).toBe(0);
  });

  it("does not mutate the state handed to it", () => {
    const before = sing(EMPTY_DOSE, 220, 1);
    const snapshot = JSON.stringify(before);
    accumulate(before, { day: DAY, f0: 440, dtSec: 5 });
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it("keeps days separate across a rollover", () => {
    let s = sing(EMPTY_DOSE, 220, 10, "2026-08-14");
    s = sing(s, 440, 10, "2026-08-15");
    expect(today(s, "2026-08-14").cycles).toBeCloseTo(2200, 6);
    expect(today(s, "2026-08-15").cycles).toBeCloseTo(4400, 6);
  });

  it("keeps days in date order however they arrive", () => {
    let s = sing(EMPTY_DOSE, 220, 1, "2026-08-15");
    s = sing(s, 220, 1, "2026-08-13");
    s = sing(s, 220, 1, "2026-08-14");
    expect(s.days.map((d) => d.day)).toEqual([
      "2026-08-13",
      "2026-08-14",
      "2026-08-15",
    ]);
  });

  it("bounds the history to 30 days, dropping the oldest", () => {
    let s = EMPTY_DOSE;
    const start = new Date(2026, 0, 1);
    for (let i = 0; i < 60; i++) {
      const d = new Date(start.getTime() + i * 24 * 3600 * 1000);
      s = accumulate(s, { day: doseDay(d), f0: 220, dtSec: 1 });
    }
    expect(s.days).toHaveLength(30);
    // 60 days from Jan 1 is Mar 1; the kept window is the most recent 30.
    expect(s.days[0].day).toBe("2026-01-31");
    expect(s.days[29].day).toBe("2026-03-01");
  });
});

describe("today", () => {
  it("returns zeroes for a day with nothing sung", () => {
    expect(today(EMPTY_DOSE, DAY)).toEqual({
      day: DAY,
      phonationSec: 0,
      cycles: 0,
    });
  });
});

describe("recentDays", () => {
  it("returns n days, oldest first, ending on the given day", () => {
    const days = recentDays(EMPTY_DOSE, 7, "2026-08-14");
    expect(days).toHaveLength(7);
    expect(days[0].day).toBe("2026-08-08");
    expect(days[6].day).toBe("2026-08-14");
  });

  it("fills silent days with zeroes instead of closing the gap", () => {
    const s = sing(EMPTY_DOSE, 220, 10, "2026-08-12");
    const days = recentDays(s, 7, "2026-08-14");
    expect(days.map((d) => Math.round(d.cycles))).toEqual([0, 0, 0, 0, 2200, 0, 0]);
  });

  it("walks back across a month boundary", () => {
    const days = recentDays(EMPTY_DOSE, 3, "2026-03-02");
    expect(days.map((d) => d.day)).toEqual(["2026-02-28", "2026-03-01", "2026-03-02"]);
  });

  it("walks back across a leap day", () => {
    const days = recentDays(EMPTY_DOSE, 2, "2024-03-01");
    expect(days.map((d) => d.day)).toEqual(["2024-02-29", "2024-03-01"]);
  });
});

describe("fmtCycles", () => {
  it("scales the unit with the magnitude", () => {
    expect(fmtCycles(310)).toBe("310");
    expect(fmtCycles(8400)).toBe("8.4k");
    expect(fmtCycles(84000)).toBe("84k");
    expect(fmtCycles(1_240_000)).toBe("1.2M");
    expect(fmtCycles(12_400_000)).toBe("12M");
  });

  it("handles zero", () => {
    expect(fmtCycles(0)).toBe("0");
  });
});
