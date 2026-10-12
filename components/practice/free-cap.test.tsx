import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROGRESS, type ProgressState, type SessionLog } from "@/lib/progress-shape";
import { localDay } from "@/lib/progress";
import type { FreeCap } from "@/lib/free-cap";

const pro = vi.hoisted(() => ({ active: false }));
const stored = vi.hoisted(() => ({ progress: null as ProgressState | null }));

vi.mock("@/lib/pro", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/pro")>(),
  useIsPro: () => pro.active,
}));

vi.mock("@/lib/progress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/progress")>();
  return {
    ...actual,
    useProgress: () => stored.progress ?? actual.useProgress(),
  };
});

import { CapWall, FreeAllowance } from "./free-cap";
import { StreakChip, useGoalDoneSec } from "./learn-home";

const capped: FreeCap = { isPro: false, usedSec: 300, leftSec: 0, capped: true, capSec: 300 };
const open: FreeCap = { isPro: false, usedSec: 120, leftSec: 180, capped: false, capSec: 300 };

function session(type: SessionLog["type"], durationSec: number): SessionLog {
  const day = localDay();
  return { id: `${type}-${durationSec}`, type, date: `${day}T10:00:00.000Z`, day, durationSec, xp: 0 };
}

function GoalProbe({ progress }: { progress: ProgressState }) {
  return <>{useGoalDoneSec(progress)}</>;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDay(d);
}

beforeEach(() => {
  pro.active = false;
  stored.progress = null;
});

describe("the free-practice wall", () => {
  it("sends the singer to the buy card with the benefit and the price on the button", () => {
    const html = renderToStaticMarkup(<CapWall cap={capped} />);
    expect(html).toContain('id="free-cap"');
    expect(html).toContain('href="/pro#buy"');
    expect(html).toContain("Go Pro: no daily limit, $79 once");
    expect(html).not.toContain('href="/pro"');
  });

  it("ends the day with a reason to come back, and promises no account", () => {
    const html = renderToStaticMarkup(<CapWall cap={capped} />);
    expect(html).toContain("The free plan includes 5 minutes of guided practice a day");
    expect(html).toContain("opens at midnight");
    expect(html).toMatch(/<a[^>]*href="\/progress"[^>]*>See your streak<\/a>/);
    expect(html).not.toMatch(/free accounts?/i);
  });

  it("names the streak today's practice extended, and never a lapsed one", () => {
    stored.progress = { ...DEFAULT_PROGRESS, streak: { current: 12, best: 12, lastDay: localDay() } };
    expect(renderToStaticMarkup(<CapWall cap={capped} />)).toContain("now 12 days");

    // The stored count outlives the streak; read raw it would claim 12 days.
    stored.progress = { ...DEFAULT_PROGRESS, streak: { current: 12, best: 12, lastDay: daysAgo(5) } };
    expect(renderToStaticMarkup(<CapWall cap={capped} />)).not.toContain("12 days");
  });

  it("shows no allowance readout until the entitlement has been read", () => {
    // The prerendered page cannot know who is Pro; a readout there would tell
    // a paying singer they have three minutes left.
    expect(renderToStaticMarkup(<FreeAllowance cap={open} />)).toBe("");
  });
});

describe("the day's goal ring", () => {
  const progress: ProgressState = {
    ...DEFAULT_PROGRESS,
    sessions: [session("pitch", 600), session("tools", 120), session("warmup", 90), session("song", 30)],
  };

  it("counts only guided practice for a free singer, the minutes the free goal is capped to", () => {
    // Ten minutes in the uncapped pitch studio used to fill the free ring
    // while every guided minute was still unused.
    expect(renderToStaticMarkup(<GoalProbe progress={progress} />)).toBe("120");
  });

  it("counts every kind of practice on Pro", () => {
    pro.active = true;
    expect(renderToStaticMarkup(<GoalProbe progress={progress} />)).toBe("840");
  });
});

describe("the room streak chip", () => {
  it("names a live streak", () => {
    expect(renderToStaticMarkup(<StreakChip days={4} best={9} />)).toContain("4-day streak");
  });

  it("offers a lapsed singer their record to beat, never the dead streak", () => {
    const html = renderToStaticMarkup(<StreakChip days={0} best={12} />);
    expect(html).toContain("Best streak 12 days, start a new one today");
    expect(html).not.toContain("12-day streak");
  });

  it("keeps the plain invitation when there is no record worth naming", () => {
    expect(renderToStaticMarkup(<StreakChip days={0} best={1} />)).toContain("Start a streak today");
    expect(renderToStaticMarkup(<StreakChip days={0} />)).toContain("Start a streak today");
  });
});
