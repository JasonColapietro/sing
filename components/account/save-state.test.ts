import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_PROGRESS, type ProgressState } from "@/lib/progress-shape";
import { BACKUP_REFRESH_MS, backupFileStatus, hasSomethingToSave, liveStreak } from "./save-state";

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

describe("backupFileStatus", () => {
  const DAY = 86_400_000;
  const FILE_AT = "2026-09-01T12:00:00.000Z";
  /** Warmups logged at these offsets from the backup download. */
  const sessions = (...offsets: number[]): ProgressState["sessions"] =>
    offsets.map((o, i) => {
      const date = new Date(Date.parse(FILE_AT) + o).toISOString();
      return { id: `s${i}`, type: "warmup", date, day: date.slice(0, 10), durationSec: 240, xp: 10 };
    });

  it("offers a file when none has been downloaded", () => {
    expect(backupFileStatus(sessions(-DAY), null)).toEqual({ hasFile: false, stale: true, sessionsSince: 1 });
  });

  it("treats an unreadable stored date as no file rather than a fresh one", () => {
    expect(backupFileStatus(sessions(-DAY), "not a date").stale).toBe(true);
  });

  it("stays quiet after a download until practice runs a couple of weeks past it", () => {
    expect(backupFileStatus(sessions(-DAY, DAY, 10 * DAY), FILE_AT)).toEqual({
      hasFile: true,
      stale: false,
      sessionsSince: 2,
    });
  });

  it("offers a fresh file once a session lands more than two weeks after the last one", () => {
    expect(backupFileStatus(sessions(DAY, BACKUP_REFRESH_MS + DAY), FILE_AT)).toEqual({
      hasFile: true,
      stale: true,
      sessionsSince: 2,
    });
  });

  it("does not nag a singer who has not practised since the download, however long ago", () => {
    expect(backupFileStatus(sessions(-DAY, -30 * DAY), FILE_AT).stale).toBe(false);
  });
});
