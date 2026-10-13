import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROGRESS, type ProgressState } from "@/lib/progress-shape";
import { localDay } from "@/lib/progress";
import { planDailyThree } from "@/lib/daily-three";
import { EXERCISES, PRO_PACKS } from "./exercises";
import type { SessionSummaryData } from "./lib";

const stored = vi.hoisted(() => ({ progress: null as ProgressState | null }));
const guide = vi.hoisted(() => ({ pct: 70 }));

vi.mock("./prefs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./prefs")>();
  return {
    ...actual,
    useWarmupPrefs: () => ({ ...actual.DEFAULT_WARMUP_PREFS, guidePct: guide.pct }),
  };
});

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
  guide.pct = 70;
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
    // The way out names the limit just reached, as every other room's cap note does.
    expect(html).toMatch(/<a[^>]*href="\/pro#buy"[^>]*>Pro has no daily limit<\/a>/);
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

  it("names a low, level ladder by its average, never as sitting under the note", () => {
    // The score keeps absolute cents, so it cannot tell flat from sharp:
    // "under the target" would steer a sharp singer the wrong way.
    const ex = EXERCISES.find((e) => e.id === "tongue-trill-descent")!;
    const level = [40, 42, 38, 41, 39].map((score, i) => ({ root: 60 - i, score, avgCentsErr: 60, skipped: false }));
    expect(ladderBreakAlongWalk(level, true)).toBeNull();
    const html = render(
      { ex, results: level, avgScore: 40, best: level[1], xpGained: 5, newAchievements: [], mode: "sing-along" },
      { daily: false },
    ).replace(/<!-- -->/g, "");
    expect(html).toContain("your average across the whole ladder stayed under 50% instead");
    expect(html).not.toContain("sat under the");
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

  it("names the weakest note's share by the scoring window, never as in tune", () => {
    // The ±50-cent window passes a phrase sung clearly flat (book chapter 9);
    // the studio's ±15-cent green zone is what in tune means on this site.
    const ex = EXERCISES.find((e) => e.id === plan.picks[0].exercise.id)!;
    const notes = [{ midi: 52, hitSec: 1, possibleSec: 2, centsSum: 40 * 60, centsFrames: 60 }];
    const rep = { root: 50, score: 50, avgCentsErr: 40, skipped: false, notes };
    const html = render(
      { ex, results: [rep], avgScore: 50, best: rep, xpGained: 20, newAchievements: [], mode: "sing-along" },
      { daily: false },
    );
    expect(html).toContain("was the shakiest note in the session: within 50 cents of the target for 50% of its scored time, about 40 cents off on average.");
    expect(html).not.toMatch(/in tune/i);
  });
});

describe("what the summary says the score measured", () => {
  const ex = EXERCISES[0];
  const rep = { root: 50, score: 82, avgCentsErr: 12, skipped: false };
  const data = (mode: SessionSummaryData["mode"]): SessionSummaryData => ({
    ex, results: [rep], avgScore: 82, best: rep, xpGained: 20, newAchievements: [], mode,
  });

  it("says the guide was sounding in sing-along with the guide on", () => {
    const html = render(data("sing-along"), { daily: false });
    expect(html).toContain("The guide was sounding while you sang");
  });

  it("does not say the guide was sounding when it was set to Off", () => {
    // Off plays the pattern once at the start and nothing under the voice.
    guide.pct = 0;
    const html = render(data("sing-along"), { daily: false });
    expect(html).not.toContain("The guide was sounding while you sang");
    expect(html).toContain(
      "The guide was off while you sang (it played the pattern once at the start), so this score measures how well you held to notes you were carrying yourself.",
    );
  });

  it("keeps call and response's own line while the reference plays", () => {
    expect(render(data("call-response"), { daily: false })).toContain("The guide had stopped before you sang");
  });

  it("does not say a guide stopped in call and response when the reference was off", () => {
    // The level governs the reference itself there: at Off no pitch plays.
    guide.pct = 0;
    const html = render(data("call-response"), { daily: false });
    expect(html).not.toContain("The guide had stopped before you sang");
    expect(html).toContain(
      "The reference was off, so no note played before you sang, and this score measures how well you found and held each note on your own.",
    );
  });

  it("names no shakiest note when every scored note held for all of its time", () => {
    const notes = [{ midi: 52, hitSec: 2, possibleSec: 2, centsSum: 8 * 60, centsFrames: 60 }];
    const clean = { ...rep, score: 100, notes };
    const html = render(
      { ex, results: [clean], avgScore: 100, best: clean, xpGained: 20, newAchievements: [], mode: "sing-along" },
      { daily: false },
    );
    expect(html).not.toContain("shakiest note");
  });

  it("sells Pro's per-note chart as a chart, not a view over time", () => {
    // Pro's 'Accuracy by note' is one tally across every kept session, one
    // bar per note with no time axis (components/progress/pro-charts.tsx).
    // The nudge renders only once Pro status is known, so the copy is read
    // from both warmup summaries' source.
    for (const file of ["session-summary.tsx", "routine-summary.tsx"]) {
      const src = readFileSync(fileURLToPath(new URL(file, import.meta.url)), "utf8");
      expect(src, file).toContain("Pro adds the full daily coach plan, a per-note accuracy chart and no daily limit.");
      expect(src, file).not.toMatch(/accuracy over time|accuracy trends?/);
    }
  });
});
