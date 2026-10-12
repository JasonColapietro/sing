import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_PROGRESS, type ProgressState } from "@/lib/progress-shape";
import { hasSomethingToSave, liveStreak } from "./save-state";

const originalTz = process.env.TZ;
afterEach(() => {
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
});

/** Noon on 12 October 2026, local time. */
const NOW = new Date(2026, 9, 12, 12, 0);

function record(streak: ProgressState["streak"]): ProgressState {
  return { ...DEFAULT_PROGRESS, streak };
}

describe("liveStreak", () => {
  it("keeps a streak practised today or yesterday", () => {
    expect(liveStreak({ current: 12, lastDay: "2026-10-12" }, NOW)).toBe(12);
    expect(liveStreak({ current: 12, lastDay: "2026-10-11" }, NOW)).toBe(12);
  });

  it("reports a lapsed streak as gone, though streak.current still holds it", () => {
    expect(liveStreak({ current: 12, lastDay: "2026-10-07" }, NOW)).toBe(0);
    expect(liveStreak({ current: 12, lastDay: "2026-10-10" }, NOW)).toBe(0);
  });

  it("has nothing to report without a streak", () => {
    expect(liveStreak({ current: 0, lastDay: "2026-10-12" }, NOW)).toBe(0);
    expect(liveStreak({ current: 3, lastDay: null }, NOW)).toBe(0);
  });

  it("counts yesterday by calendar day across a short daylight-saving day", () => {
    process.env.TZ = "America/New_York";
    expect(liveStreak({ current: 7, lastDay: "2026-03-08" }, new Date(2026, 2, 9, 0, 30))).toBe(7);
  });
});

describe("hasSomethingToSave", () => {
  it("does not count a lapsed streak as practice worth backing up", () => {
    expect(hasSomethingToSave(record({ current: 12, best: 12, lastDay: "2026-10-07" }), NOW)).toBe(false);
  });

  it("counts a live streak of two days or more", () => {
    expect(hasSomethingToSave(record({ current: 2, best: 2, lastDay: "2026-10-11" }), NOW)).toBe(true);
    expect(hasSomethingToSave(record({ current: 1, best: 1, lastDay: "2026-10-12" }), NOW)).toBe(false);
  });

  it("counts a measured range on its own", () => {
    expect(hasSomethingToSave({ ...DEFAULT_PROGRESS, range: { lowMidi: 48, highMidi: 67 } }, NOW)).toBe(true);
  });
});
