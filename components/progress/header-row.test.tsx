/**
 * The overview's "Today" card and session totals.
 *
 * The Today bar used to fill against a fixed ten minutes of any practice,
 * while every practice room's ring fills against useDailyGoal: ten minutes on
 * Pro, and on the free plan the five guided minutes the allowance covers. A
 * free singer who had used their five minutes saw a full ring in the room and
 * "of a 10-minute day" with half a red bar here.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HeaderRow } from "./progress-client";

function render(props: Partial<Parameters<typeof HeaderRow>[0]> = {}) {
  return renderToStaticMarkup(
    <HeaderRow
      xp={0}
      streakCurrent={0}
      streakBest={0}
      streakLastDay={null}
      todaySec={0}
      goal={{ doneSec: 0, goalSec: 300, isPro: false }}
      sessionCount={0}
      totalSec={0}
      {...props}
    />,
  ).replace(/&#x27;/g, "'");
}

describe("the Today card uses the practice rooms' goal", () => {
  it("shows a free singer's five guided minutes as met, as the room ring does", () => {
    const html = render({ todaySec: 300, goal: { doneSec: 300, goalSec: 300, isPro: false } });
    expect(html).toContain("today's 5 free guided minutes done");
    expect(html).not.toContain("10-minute");
  });

  it("does not count uncapped studio time toward a free singer's guided minutes", () => {
    // Ten minutes in the pitch studio, no guided practice yet.
    const html = render({ todaySec: 600, goal: { doneSec: 0, goalSec: 300, isPro: false } });
    expect(html).toContain("10m");
    expect(html).toContain("0 of today's 5 free guided minutes");
    expect(html).not.toContain("free guided minutes done");
  });

  it("does not call a free singer's own lower goal the free allowance", () => {
    const html = render({ todaySec: 60, goal: { doneSec: 60, goalSec: 180, isPro: false } });
    expect(html).toContain("of today's 3-minute goal");
    expect(html).not.toContain("free guided minutes");
  });

  it("holds a Pro singer to the ten-minute goal", () => {
    expect(render({ todaySec: 420, goal: { doneSec: 420, goalSec: 600, isPro: true } })).toContain(
      "of today's 10-minute goal",
    );
    expect(render({ todaySec: 600, goal: { doneSec: 600, goalSec: 600, isPro: true } })).toContain(
      "today's 10-minute goal met",
    );
  });
});

describe("session totals at the store's cap", () => {
  it("labels a capped log instead of presenting it as a lifetime count", () => {
    const html = render({ sessionCount: 500, totalSec: 36_000 });
    expect(html).toContain("500+");
    expect(html).toContain("latest 500 kept");
    expect(html).toContain("across the latest 500 sessions");
  });

  it("says nothing about the cap below it", () => {
    const html = render({ sessionCount: 42, totalSec: 3_600 });
    expect(html).toContain(">42<");
    expect(html).not.toContain("latest 500");
  });
});
