import { afterEach, describe, expect, it } from "vitest";
import type { ActivityType, SessionLog } from "./progress-shape";
import {
  shouldShowWeekInReview,
  weekBoundaries,
  weekInReview,
  weekTotals,
} from "./weekly-report";

const originalTz = process.env.TZ;
afterEach(() => {
  process.env.TZ = originalTz;
});

let seq = 0;
function session(
  day: string,
  opts: { type?: ActivityType; score?: number; durationSec?: number } = {},
): SessionLog {
  return {
    id: `s${seq++}`,
    type: opts.type ?? "warmup",
    date: `${day}T12:00:00Z`,
    day,
    durationSec: opts.durationSec ?? 300,
    score: opts.score,
    xp: 0,
  };
}

// Wednesday 2026-09-23; the reported week is Mon 14 – Sun 20 September.
const WED = new Date(2026, 8, 23, 9);

describe("weekBoundaries", () => {
  it("is Monday-based, and a Monday belongs to the week it starts", () => {
    expect(weekBoundaries(WED)).toEqual({
      today: "2026-09-23",
      start: "2026-09-21",
      lastStart: "2026-09-14",
      lastEnd: "2026-09-20",
      priorStart: "2026-09-07",
      priorEnd: "2026-09-13",
    });
    expect(weekBoundaries(new Date(2026, 8, 21, 0, 5)).lastStart).toBe("2026-09-14");
    // Sunday late evening is still the old week.
    expect(weekBoundaries(new Date(2026, 8, 20, 23, 55)).start).toBe("2026-09-14");
  });

  it("keeps local-day boundaries across a spring-forward and a fall-back week", () => {
    process.env.TZ = "America/New_York";
    // DST began Sunday 8 March 2026; just after midnight on the Monday.
    expect(weekBoundaries(new Date(2026, 2, 9, 0, 30))).toMatchObject({
      start: "2026-03-09",
      lastStart: "2026-03-02",
      lastEnd: "2026-03-08",
      priorStart: "2026-02-23",
    });
    process.env.TZ = "Europe/London";
    // DST ended Sunday 25 October 2026 (a 25-hour day).
    expect(weekBoundaries(new Date(2026, 9, 26, 0, 15))).toMatchObject({
      start: "2026-10-26",
      lastStart: "2026-10-19",
      lastEnd: "2026-10-25",
    });
  });

  it("survives a zone whose clocks jump at midnight", () => {
    // Chile starts DST at 24:00 on Saturday 5 September 2026, so Sunday 6
    // September has no 00:00. Midnight-based maths lands on the Saturday.
    process.env.TZ = "America/Santiago";
    expect(weekBoundaries(new Date(2026, 8, 6, 12))).toMatchObject({
      start: "2026-08-31",
      lastStart: "2026-08-24",
    });
    expect(weekBoundaries(new Date(2026, 8, 7, 0, 30))).toMatchObject({
      start: "2026-09-07",
      lastStart: "2026-08-31",
      lastEnd: "2026-09-06",
    });
  });
});

describe("weekTotals", () => {
  it("counts unscored time and stars on the 50/75/90 ladder", () => {
    const totals = weekTotals(
      [
        session("2026-09-14", { score: 90 }),
        session("2026-09-15", { score: 74 }),
        session("2026-09-16"),
        session("2026-09-21", { score: 100 }),
      ],
      "2026-09-14",
      "2026-09-20",
    );
    expect(totals).toEqual({ stars: 4, sessions: 3, durationSec: 900 });
  });
});

describe("weekInReview", () => {
  it("is null with no sessions at all", () => {
    expect(weekInReview([], WED)).toBeNull();
  });

  it("is null for a singer who skipped last week, whatever came before or after", () => {
    expect(
      weekInReview([session("2026-09-08"), session("2026-09-22")], WED),
    ).toBeNull();
  });

  it("reports a first-ever week with no comparison", () => {
    const report = weekInReview(
      [
        session("2026-09-14", { score: 92, durationSec: 600 }),
        session("2026-09-15", { score: 70 }),
        session("2026-09-15", { type: "recording", durationSec: 120 }),
        session("2026-09-19", { score: 80 }),
        // This week: not part of the report.
        session("2026-09-22", { score: 10 }),
      ],
      WED,
    )!;
    expect(report).toMatchObject({
      weekStart: "2026-09-14",
      weekEnd: "2026-09-20",
      durationSec: 1320,
      minutes: 22,
      sessions: 4,
      stars: 6,
      daysPractised: 3,
      bestRun: 2,
      bestScore: 92,
      averageScore: 81,
      previous: null,
    });
    expect(report.suggestion).toEqual({ kind: "keep-going", days: 3 });
  });

  it("leaves scores empty when nothing was scored", () => {
    const report = weekInReview([session("2026-09-20", { type: "breath" })], WED)!;
    expect(report.bestScore).toBeNull();
    expect(report.averageScore).toBeNull();
    expect(report.bestRun).toBe(1);
  });

  it("compares with the week before, including an empty one after older history", () => {
    const lastWeek = [session("2026-09-14"), session("2026-09-16")];
    const withPrior = weekInReview(
      [...lastWeek, session("2026-09-10", { durationSec: 900 })],
      WED,
    )!;
    expect(withPrior.previous).toEqual({ durationSec: 900, minutes: 15, sessions: 1 });
    const afterGap = weekInReview([...lastWeek, session("2026-08-30")], WED)!;
    expect(afterGap.previous).toEqual({ durationSec: 0, minutes: 0, sessions: 0 });
  });

  it("counts a streak across the DST changeover day", () => {
    process.env.TZ = "Europe/London";
    const report = weekInReview(
      ["2026-10-23", "2026-10-24", "2026-10-25"].map((d) => session(d)),
      new Date(2026, 9, 26, 0, 15),
    )!;
    expect(report.bestRun).toBe(3);
    expect(report.daysPractised).toBe(3);
  });

  describe("suggestion", () => {
    it("names the room used most in the three weeks before and skipped last week", () => {
      const report = weekInReview(
        [
          session("2026-09-14"),
          session("2026-09-01", { type: "ear" }),
          session("2026-09-08", { type: "breath" }),
          session("2026-09-09", { type: "breath" }),
          // Four weeks back: outside the lookback, so it cannot win.
          ...Array.from({ length: 5 }, () => session("2026-08-20", { type: "range" })),
        ],
        WED,
      )!;
      expect(report.suggestion).toEqual({
        kind: "neglected",
        type: "breath",
        label: "Breath",
        href: "/breath",
        before: 2,
      });
    });

    it("names a room whose scores trailed the week by ten points or more", () => {
      const report = weekInReview(
        [
          session("2026-09-14", { type: "warmup", score: 90 }),
          session("2026-09-15", { type: "warmup", score: 94 }),
          session("2026-09-16", { type: "warmup", score: 92 }),
          session("2026-09-17", { type: "ear", score: 60 }),
          session("2026-09-18", { type: "ear", score: 64 }),
        ],
        WED,
      )!;
      expect(report.suggestion).toEqual({
        kind: "weakest",
        type: "ear",
        label: "Ear",
        href: "/ear-training",
        average: 62,
        overall: 80,
      });
    });

    it("never names a room on a single scored session", () => {
      const report = weekInReview(
        [
          session("2026-09-14", { score: 95 }),
          session("2026-09-15", { score: 95 }),
          session("2026-09-16", { type: "pitch", score: 20 }),
        ],
        WED,
      )!;
      expect(report.suggestion).toEqual({ kind: "keep-going", days: 3 });
    });

    it("asks for another day when fewer than three were practised", () => {
      const report = weekInReview([session("2026-09-14"), session("2026-09-14")], WED)!;
      expect(report.suggestion).toEqual({ kind: "more-days", days: 1 });
    });
  });
});

describe("shouldShowWeekInReview", () => {
  const report = weekInReview([session("2026-09-14")], WED);

  it("shows an unseen week once, and never an empty one", () => {
    expect(shouldShowWeekInReview(report, null)).toBe(true);
    expect(shouldShowWeekInReview(report, "2026-09-07")).toBe(true);
    expect(shouldShowWeekInReview(report, "2026-09-14")).toBe(false);
    expect(shouldShowWeekInReview(null, null)).toBe(false);
  });
});
