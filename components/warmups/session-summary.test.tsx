import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROGRESS, type ProgressState } from "@/lib/progress-shape";
import { localDay } from "@/lib/progress";
import { planDailyThree } from "@/lib/daily-three";
import { EXERCISES, PRO_PACKS } from "./exercises";
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

import { SessionSummary, ladderBreakAlongWalk } from "./session-summary";

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

  it("says tomorrow's three reads this score, once and only where it does", () => {
    const line = "Tomorrow&#x27;s three reads your recent scores, this one included.";
    expect(render(summaryFor(plan.picks[0].exercise.id), { daily: false })).toContain(line);
    // The done card below already says a new three is picked from the scores.
    expect(render(summaryFor(plan.picks[0].exercise.id), { done: [true, true, true] })).not.toContain(line);
    // Today's three is planned from the free catalogue: a pack score is not read.
    const pack = PRO_PACKS[0].exercises[0];
    const rep = { root: 50, score: 82, avgCentsErr: 12, skipped: false };
    const html = render(
      { ex: pack, results: [rep], avgScore: 82, best: rep, xpGained: 20, newAchievements: [], mode: "sing-along" },
      { daily: false },
    );
    expect(html).not.toContain(line);
  });

  it("names no streak that has lapsed", () => {
    stored.progress = { ...DEFAULT_PROGRESS, streak: { current: 12, best: 12, lastDay: "2020-01-01" } };
    const html = render(summaryFor(plan.picks[0].exercise.id), { daily: false });
    expect(html).not.toContain("day streak");
    expect(html).not.toContain("Sing tomorrow");
  });
});

describe("the ladder diagnosis on a descending drill", () => {
  // tongue-trill-descent walks C4 down to F#3, and the low end came apart.
  const scores = [92, 90, 88, 85, 60, 40, 30];
  const reps = scores.map((score, i) => ({ root: 60 - i, score, avgCentsErr: 20, skipped: false }));

  it("finds the break along the descent, not only on a climb", () => {
    expect(ladderBreakAlongWalk(reps, true)).toEqual({ root: 56, heldAt: 92, score: 60, drop: 32 });
    // The climb-only reading resets on every falling root and finds nothing.
    expect(ladderBreakAlongWalk(reps, false)).toBeNull();
  });

  it("does not tell a singer whose low notes fell apart that the ladder held", () => {
    const ex = EXERCISES.find((e) => e.id === "tongue-trill-descent")!;
    const avgScore = Math.round(scores.reduce((a, s) => a + s, 0) / scores.length);
    const html = render(
      { ex, results: reps, avgScore, best: reps[0], xpGained: 20, newAchievements: [], mode: "sing-along" },
      { daily: false },
    );
    expect(html).not.toContain("held together across the whole ladder");
    expect(html).toContain("The ladder held at 92% until");
    expect(html).toContain("then dropped 32 points");
  });

  it("draws the practice rooms' three-star scale, not the songbook's five", () => {
    const html = render(summaryFor(plan.picks[0].exercise.id), { daily: false });
    // An 82 is two of three practice stars, as the library and /progress count it.
    expect(html).toContain('★★☆</span><span class="sr-only">2 of 3 stars</span>');
    // The share card on the same screen counts the same stars: an 82 is four
    // of five on the songbook's scale, which is the second rating this
    // screen used to show for one run.
    expect(html).not.toContain("of 5 stars");
    expect(html).not.toContain("★★★★☆");
    expect(html.match(/2 of 3 stars/g)?.length).toBe(2);
  });
});
