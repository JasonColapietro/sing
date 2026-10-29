import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROGRESS, type ProgressState, type SessionLog } from "@/lib/progress-shape";
import { localDay } from "@/lib/progress";
import type { FreeCap } from "@/lib/free-cap";

const pro = vi.hoisted(() => ({ active: false }));
const stored = vi.hoisted(() => ({ progress: null as ProgressState | null }));
const hydration = vi.hoisted(() => ({ done: false }));

vi.mock("@/components/prepaint", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/components/prepaint")>(),
  useHydrated: () => hydration.done,
}));

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
import { paintedFor, staticText, wordsPainted } from "@/components/prepaint.testing";
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
  hydration.done = false;
});

/** The wall a capped singer reads once the room has hydrated. */
function wall(cap: FreeCap = capped, className?: string): string {
  hydration.done = true;
  try {
    return renderToStaticMarkup(<CapWall cap={cap} className={className} />);
  } finally {
    hydration.done = false;
  }
}

/** useId's ids, which differ between two renders of one tree only by chance. */
const ids = (html: string) => html.replace(/_R_[0-9a-z]+_/g, "_ID_");

describe("the free-practice wall", () => {
  it("sends the singer to the buy card with the benefit and the price on the button", () => {
    const html = wall();
    expect(html).toContain('id="free-cap"');
    expect(html).toContain('href="/pro#buy"');
    expect(html).toContain("Keep practicing today with Pro: $79 once");
    expect(html).not.toContain('href="/pro"');
  });

  it("gives a Pro owner in a new browser a way to unlock it, not only a second purchase", () => {
    const html = wall();
    expect(html).toMatch(/<a[^>]*href="\/pro#restore"[^>]*>Already have Pro\? Unlock it in this browser<\/a>/);
    // After the offer, never ahead of it.
    expect(html.indexOf('href="/pro#restore"')).toBeGreaterThan(html.indexOf('href="/pro#buy"'));
  });

  it("ends the day with a reason to come back, in one sentence, and promises no account", () => {
    const html = wall();
    expect(html).toContain("That&#x27;s today&#x27;s 5 free minutes");
    expect(html).toContain("Today counts toward your streak");
    expect(html).toContain("opens again at midnight");
    // The heading says five; the counter line and the streak button are gone.
    expect(html).not.toContain("5:00 of 5:00");
    expect(html).not.toContain("See your streak");
    expect(html).not.toMatch(/<a[^>]*href="\/progress"/);
    expect(html).not.toMatch(/free accounts?/i);
  });

  it("names the streak today's practice extended, and never a lapsed one", () => {
    stored.progress = { ...DEFAULT_PROGRESS, streak: { current: 12, best: 12, lastDay: localDay() } };
    expect(wall()).toContain("now 12 days");

    // The stored count outlives the streak; read raw it would claim 12 days.
    stored.progress = { ...DEFAULT_PROGRESS, streak: { current: 12, best: 12, lastDay: daysAgo(5) } };
    expect(wall()).not.toContain("12 days");
  });

  it("paints the allowance readout before hydration only for a free singer under the cap", () => {
    // The prerendered page cannot know who is Pro; a readout a paying singer
    // could see would tell them they have three minutes left. It is in the
    // server HTML behind the free-plan marker, which the pre-paint state
    // hides for Pro and at the cap (lib/prepaint.ts, app/globals.css).
    const html = renderToStaticMarkup(<FreeAllowance cap={open} />);
    expect(html).toMatch(/^<p data-prepaint-plan="free"/);
    expect(paintedFor(html, { plan: "pro" })).toBe("");
    expect(paintedFor(html, { plan: "capped" })).toBe("");
    // The minutes left are filled in before paint from the stored log.
    expect(paintedFor(html, { plan: "free" })).toContain("p.freeLeft");
  });

  it("reads as a sentence at body size, and drops its Pro link on a results view", () => {
    const html = renderToStaticMarkup(<FreeAllowance cap={open} />);
    expect(html).toContain("text-sm");
    expect(html).not.toContain("uppercase");
    expect(html).toContain("Pro has no daily limit");
    const quiet = renderToStaticMarkup(<FreeAllowance cap={open} proLink={false} />);
    expect(quiet).not.toContain("/pro");
    expect(quiet).toContain("Free guided practice today");
  });

  it("paints the wall before hydration only where the cap is reached, with its readout exact", () => {
    stored.progress = { ...DEFAULT_PROGRESS, streak: { current: 3, best: 3, lastDay: localDay() } };
    const html = renderToStaticMarkup(<CapWall cap={open} className="mb-6" />);
    expect(html).toMatch(/^<div id="free-cap" class="scroll-mt-24 mb-6" data-prepaint-plan="capped"/);
    expect(paintedFor(html, { plan: "free" })).toBe("");
    expect(paintedFor(html, { plan: "pro" })).toBe("");
    expect(wordsPainted(html)).toContain("That&#x27;s today&#x27;s 5 free minutes");
    expect(html).toContain("p.streakClause");
  });

  it("keeps the wall's words out of the static HTML, and paints them as the hydrated wall has them", () => {
    // Every room's server HTML carries the wall for every visitor. A reader
    // that runs no script and applies no CSS (GPTBot, ClaudeBot, CCBot…)
    // took "That's your 5 free minutes for today … 5:00 of 5:00 used today"
    // for the opening of /warmups, /breath, /ear-training and /songs.
    const html = renderToStaticMarkup(<CapWall cap={open} className="mb-6" />);
    expect(staticText(html)).toBe("");
    expect(html).toContain('data-prepaint-text="That&#x27;s today&#x27;s 5 free minutes"');
    // Painted, it is the hydrated wall exactly, so the swap at hydration
    // moves nothing: the same elements, classes and words.
    const prepainted = wordsPainted(html)
      .replace(' data-prepaint-plan="capped"', "")
      .replace(/<script>[\s\S]*?<\/script>/g, "");
    expect(ids(prepainted)).toBe(ids(wall(capped, "mb-6").replace(/<script>[\s\S]*?<\/script>/g, "")));
  });
});

describe("the free-practice wall on a phone", () => {
  /** The class attribute of the element whose start tag holds `marker`. */
  function classOf(html: string, marker: string): string {
    const at = html.indexOf(marker);
    expect(at, marker).toBeGreaterThan(-1);
    const open = html.lastIndexOf("<", at);
    return /class="([^"]*)"/.exec(html.slice(open, html.indexOf(">", open)))?.[1] ?? "";
  }
  // As the server HTML paints before hydration (the hydrated wall is the
  // same markup, see above).
  const html = wordsPainted(renderToStaticMarkup(<CapWall cap={capped} />));

  it("orders the ways forward straight under the heading, ahead of the explanation", () => {
    // After the explanation, the actions sat under a 375×667 phone's tab bar.
    expect(classOf(html, "That&#x27;s today&#x27;s 5 free minutes")).toMatch(/\border-1\b/);
    expect(html).toContain('class="order-2 mt-5 flex w-full flex-col gap-3 sm:order-none sm:mt-0 sm:w-auto"');
    expect(classOf(html, "Today counts toward your streak")).toMatch(/\border-3\b.*\bmt-5\b.*\bsm:mt-2\b/);
  });

  it("keeps the order to phones and leaves DOM order alone", () => {
    expect(html.match(/class="contents sm:block sm:max-w-xl"/g)).toHaveLength(1);
    expect(html).toContain('class="flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-6"');
    expect(html.indexOf("Today counts toward your streak")).toBeLessThan(html.indexOf("Keep practicing today with Pro"));
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
