/**
 * The coached session on a program's rest day.
 *
 * The Measured Voice rests on days 3, 6 and 7 of every week, as the book asks.
 * The coach card used to sit directly under "Day 3: rest day" and say, in red,
 * "Keep your 2-day streak alive", so the two things meant to bring a singer
 * back told them opposite things on the same screen.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROGRESS, type ProgressState, type SessionLog } from "@/lib/progress-shape";
import { RANGE_RETEST_DAYS } from "@/lib/progress";

const capState = vi.hoisted(() => ({ capped: null as boolean | null }));
vi.mock("@/lib/free-cap", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/free-cap")>();
  return {
    ...actual,
    // The real hook under renderToStaticMarkup (server day "", never capped)
    // unless a test sets the allowance.
    useFreeCap: () => {
      const real = actual.useFreeCap();
      return capState.capped === null
        ? real
        : { ...real, capped: capState.capped, usedSec: capState.capped ? 300 : 0, leftSec: capState.capped ? 0 : 300 };
    },
  };
});
import { HeaderRow } from "./progress-client";
import { CoachCard, buildPlan } from "./coach";

const PROGRAM = "The Measured Voice: 12 weeks";
/** Wednesday 14 October 2026, 15:00 local: after noon, when the streak banner shows. */
const NOW = new Date(2026, 9, 14, 15, 0);

function session(day: string, n: number): SessionLog {
  return { id: `s${n}`, type: "warmup", date: `${day}T12:00:00.000Z`, day, durationSec: 300, score: 80, detail: "Morning hum", xp: 10 };
}

/** Sang on days 1 and 2 of the program, Monday and Tuesday. */
function state(extra: SessionLog[] = []): ProgressState {
  return {
    ...DEFAULT_PROGRESS,
    sessions: [...extra, session("2026-10-13", 2), session("2026-10-12", 1)],
    streak: { current: 2, best: 2, lastDay: extra.length ? "2026-10-14" : "2026-10-13" },
  };
}

afterEach(() => {
  vi.useRealTimers();
  capState.capped = null;
});

describe("buildPlan on a program rest day", () => {
  it("still asks a singer with no rest day to keep the streak", () => {
    const plan = buildPlan(state(), NOW);
    expect(plan.banner).toMatch(/Keep your 2-day streak alive/);
    expect(plan.restNote).toBeNull();
  });

  it("drops the red streak banner and says what resting costs instead", () => {
    const plan = buildPlan(state(), NOW, PROGRAM);
    expect(plan.banner).toBeNull();
    expect(plan.restNote).toContain(`Today is a rest day in ${PROGRAM}, and the program counts it as done.`);
    expect(plan.restNote).toContain("Nothing below is required.");
    expect(plan.restNote).toContain("if you rest today it starts again from 1 at your next session");
    // The plan is still there for a singer who wants it.
    expect(plan.items.length).toBeGreaterThan(0);
  });

  it("does not talk about the streak once today is already banked", () => {
    const plan = buildPlan(state([session("2026-10-14", 3)]), NOW, PROGRAM);
    expect(plan.banner).toBeNull();
    expect(plan.restNote).toContain("rest day");
    expect(plan.restNote).not.toContain("streak");
  });
});

describe("the progress page on a program rest day", () => {
  it("renders the rest-day line in place of the streak banner", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const html = renderToStaticMarkup(<CoachCard state={state()} restDayOf={PROGRAM} />);
    expect(html).toContain(`Today is a rest day in ${PROGRAM}`);
    expect(html).not.toContain("streak alive");
    const plain = renderToStaticMarkup(<CoachCard state={state()} />);
    expect(plain).toContain("streak alive");
  });

  it("labels a waiting streak as the program's rest day, not 'Keep it alive'", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const props = {
      xp: 20,
      streakCurrent: 2,
      streakBest: 2,
      streakLastDay: "2026-10-13",
      todaySec: 0,
      goal: { doneSec: 0, goalSec: 300, isPro: false },
      sessionCount: 2,
      totalSec: 600,
    };
    expect(renderToStaticMarkup(<HeaderRow {...props} />)).toContain("Keep it alive");
    const rest = renderToStaticMarkup(<HeaderRow {...props} restDay />);
    expect(rest).toContain("Program rest day");
    expect(rest).not.toContain("Keep it alive");
  });
});

describe("the coached session after the free minutes are used", () => {
  it("says which steps wait for midnight and what is open now", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    capState.capped = true;
    const html = renderToStaticMarkup(<CoachCard state={state([session("2026-10-14", 3)])} />);
    expect(html).toContain("Today&#x27;s session");
    expect(html).toContain("free guided minutes are used, so");
    expect(html).toContain("open again at midnight");
    expect(html).toContain('href="/studio"');
    expect(html).toContain('href="/range?mode=range#start"');
    // The generic allowance footnote would repeat it.
    expect(html).not.toContain("share 5 guided minutes a day");
  });

  it("keeps the allowance footnote, and no midnight line, before the cap", () => {
    capState.capped = false;
    const html = renderToStaticMarkup(<CoachCard state={state()} />);
    expect(html).not.toContain("open again at midnight");
    expect(html).toContain("guided minutes a day");
  });
});

describe("the coach's range retest", () => {
  const DAY = 86_400_000;
  const withRange = (ageDays: number): ProgressState => ({
    ...state(),
    range: { lowMidi: 48, highMidi: 69, testedAt: new Date(NOW.getTime() - ageDays * DAY).toISOString() },
  });

  it("waits RANGE_RETEST_DAYS, then asks for a retest without promising growth", () => {
    const early = buildPlan(withRange(RANGE_RETEST_DAYS - 1), NOW).items;
    expect(early.map((i) => i.title)).not.toContain("Retake the range test");
    const due = buildPlan(withRange(RANGE_RETEST_DAYS), NOW).items.find((i) => i.title === "Retake the range test");
    expect(due?.reason).toBe(
      `Your range was last measured ${RANGE_RETEST_DAYS} days ago — a fresh test adds a current point to your range over time.`,
    );
    expect(due?.reason).not.toMatch(/growth/i);
  });
});

describe("the coach's accuracy lines", () => {
  // The tallies count time within the ±50-cent scoring window, which passes
  // a phrase sung clearly flat (book chapter 9); on this site "in tune" is the
  // studio's ±15-cent zone, so the coach names the window instead.
  const tallied = (): ProgressState => {
    const base = state();
    return {
      ...base,
      range: { lowMidi: 48, highMidi: 69, testedAt: NOW.toISOString() },
      sessions: base.sessions.map((s) => ({ ...s, notes: { "60": { sec: 5, hitSec: 2, cents: 35, frames: 100 } } })),
    };
  };

  it("names the weak note's share by the scoring window", () => {
    const items = buildPlan(tallied(), NOW).items;
    const weak = items.find((i) => i.reason.includes("weakest note"));
    expect(weak?.reason).toContain("C4 lands within 50 cents of the target just 40% of the time, off by ~35 cents.");
    const songs = items.find((i) => i.title === "Sing a song");
    expect(songs?.reason).toBe(
      "Finish on real music — you're within 50 cents of the target 40% of the scored time lately, and songs are where that shows.",
    );
    for (const i of items) expect(i.reason, i.title).not.toMatch(/in tune/i);
  });
});

describe("the Pro perk that sells this plan", () => {
  // The perk once said the plan reshapes itself around the singer's streak.
  // The streak only switches the banner and the rest-day note; the steps come
  // from scores, weak notes, the range test's age and yesterday's minutes.
  it("builds the same steps whatever the streak", () => {
    const base = state();
    const long: ProgressState = { ...base, streak: { ...base.streak, current: 40, best: 40 } };
    const none: ProgressState = { ...base, streak: { current: 0, best: 2, lastDay: "2026-09-01" } };
    const steps = (s: ProgressState) => buildPlan(s, NOW).items;
    expect(steps(long)).toEqual(steps(base));
    expect(steps(none)).toEqual(steps(base));
  });

  it("names only the plan's real inputs", async () => {
    const { PRO_PERKS } = await import("@/lib/pro");
    const coach = PRO_PERKS.find((p) => p.id === "coach")!;
    expect(coach.desc).not.toMatch(/streak/i);
    expect(coach.desc).toMatch(/scores/);
    expect(coach.desc).toMatch(/weak notes/);
    expect(coach.desc).toMatch(/range test/);
    expect(coach.desc).toMatch(/yesterday/);
  });
});
