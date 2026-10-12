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
