import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROGRESS, type ProgressState } from "@/lib/progress-shape";
import { localDay } from "@/lib/progress";
import { planDailyThree } from "@/lib/daily-three";
import { EXERCISES } from "./exercises";
import type { SessionSummaryData } from "./lib";

const stored = vi.hoisted(() => ({ progress: null as ProgressState | null }));

vi.mock("@/lib/pro", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/pro")>(),
  useIsPro: () => false,
}));

vi.mock("@/lib/progress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/progress")>();
  return {
    ...actual,
    useProgress: () => stored.progress ?? actual.useProgress(),
  };
});

import { SessionSummary } from "./session-summary";

const plan = planDailyThree({ sessions: [], day: "2026-09-03" });
const noop = () => {};

function summaryFor(exerciseId: string): SessionSummaryData {
  const ex = EXERCISES.find((e) => e.id === exerciseId)!;
  const rep = { root: 50, score: 82, avgCentsErr: 12, skipped: false };
  return { ex, results: [rep], avgScore: 82, best: rep, xpGained: 20, newAchievements: [], mode: "sing-along" };
}

function render(
  data: SessionSummaryData,
  opts: { done?: boolean[]; capped?: boolean; daily?: boolean } = {},
): string {
  return renderToStaticMarkup(
    <SessionSummary
      data={data}
      daily={opts.daily === false ? null : { plan, done: opts.done ?? [true, false, false] }}
      capped={opts.capped}
      onDaily={noop}
      onNext={noop}
      onLibrary={noop}
    />,
  );
}

beforeEach(() => {
  stored.progress = null;
});

describe("the single-exercise summary after one of today's three", () => {
  const first = plan.picks[0].exercise.id;

  it("offers the next unsung pick, not the next exercise in the catalogue", () => {
    const html = render(summaryFor(first));
    expect(html).toContain("Today&#x27;s three · 1 of 3 done");
    expect(html).toContain(plan.picks[1].exercise.title);
    expect(html).toContain("Sing it");
    expect(html).not.toContain("Next exercise");
  });

  it("says the three are done and when the next three arrive", () => {
    const html = render(summaryFor(first), { done: [true, true, true] });
    expect(html).toContain("Today&#x27;s three: done");
    expect(html).toContain("A new three is picked from your scores tomorrow.");
    expect(html).not.toContain("Sing it");
  });

  it("never offers a start that does nothing once the free minutes are used", () => {
    const html = render(summaryFor(first), { capped: true });
    expect(html).toContain("Available tomorrow");
    expect(html).not.toContain("Sing it");
    expect(html).toContain("Free practice is used for today.");
    // The next pick, and running this ladder again, are both disabled.
    expect(html.match(/<button[^>]*disabled=""/g)?.length).toBe(2);
  });

  it("keeps the catalogue's next exercise for one outside today's three", () => {
    const outside = EXERCISES.find((e) => !plan.picks.some((p) => p.exercise.id === e.id))!;
    const html = render(summaryFor(outside.id));
    expect(html).toContain("Keep going");
    expect(html).toContain("Next exercise");
    expect(html).not.toContain("Today&#x27;s three");
  });
});

describe("the saved card", () => {
  it("names the live streak and what singing tomorrow makes it", () => {
    stored.progress = { ...DEFAULT_PROGRESS, streak: { current: 4, best: 6, lastDay: localDay() } };
    const html = render(summaryFor(plan.picks[0].exercise.id), { daily: false });
    expect(html).toContain("4-day streak");
    expect(html).toContain("Sing tomorrow to make it 5.");
  });

  it("names no streak that has lapsed", () => {
    stored.progress = { ...DEFAULT_PROGRESS, streak: { current: 12, best: 12, lastDay: "2020-01-01" } };
    const html = render(summaryFor(plan.picks[0].exercise.id), { daily: false });
    expect(html).not.toContain("day streak");
    expect(html).not.toContain("Sing tomorrow");
  });
});
