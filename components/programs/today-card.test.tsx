/**
 * The program cards for a free singer past a Pro program's free week. Their
 * place is kept, so that day is "today" every day until they buy or stop the
 * program: the warmups room's entry card must not call it today's plan, and
 * every unlock button goes to the offer itself.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const plan = vi.hoisted(() => ({ pro: false, ready: true }));
const capState = vi.hoisted(() => ({ capped: false }));

vi.mock("@/lib/pro", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/pro")>()),
  useIsPro: () => plan.pro,
  useProReady: () => plan.ready,
}));

vi.mock("@/lib/free-cap", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/free-cap")>()),
  useFreeCap: () => ({ capped: capState.capped, isPro: false, usedSec: 300, leftSec: 0, capSec: 300 }),
}));

import { ProgramEntryCard, ProgramTodayCard } from "@/components/programs/today-card";
import type { ActiveProgram } from "@/components/programs/use-program";
import { FREE_WEEKS, programById } from "@/lib/programs";
import type { ProgramToday } from "@/lib/programs";

function active(id: string, index: number, view?: ProgramToday, itemsDone?: boolean[]): ActiveProgram {
  const program = programById(id)!;
  return {
    program,
    progress: { programId: id, startedOn: "2026-10-01", done: [] },
    today: "2026-10-12",
    view: view ?? { status: "todo", index, completed: index },
    itemsDone: itemsDone ?? program.days[index].items.map(() => false),
    stepsDone: program.days[index].items.map(() => []),
    countsFrom: "2026-10-12",
    readings: [],
  } as unknown as ActiveProgram;
}

const firstPaid = FREE_WEEKS * 7;

describe("the program entry card on a day that needs Pro", () => {
  it("says the day needs Pro and links the offer, not 'Open today's plan'", () => {
    plan.pro = false;
    plan.ready = true;
    const html = renderToStaticMarkup(<ProgramEntryCard active={active("mix-4w", firstPaid)} />);
    expect(html).toContain(`Day ${firstPaid + 1} needs Pro.`);
    expect(html).toContain("your place is kept");
    expect(html).toContain('href="/pro#buy"');
    expect(html).toContain(`Unlock day ${firstPaid + 1} with Pro`);
    expect(html).toContain('href="/programs?program=mix-4w"');
    expect(html).toContain("See the calendar");
    expect(html).not.toContain("Open today’s plan");
    // The heading the e2e check reads stays as it was.
    expect(html).toContain(`Your program: day ${firstPaid + 1}`);
  });

  it("keeps today's plan for Pro, for the free week, and before the entitlement is read", () => {
    plan.pro = true;
    plan.ready = true;
    expect(renderToStaticMarkup(<ProgramEntryCard active={active("mix-4w", firstPaid)} />)).toContain(
      "Open today’s plan",
    );
    plan.pro = false;
    expect(renderToStaticMarkup(<ProgramEntryCard active={active("mix-4w", 0)} />)).toContain("Open today’s plan");
    plan.ready = false;
    const unknown = renderToStaticMarkup(<ProgramEntryCard active={active("mix-4w", firstPaid)} />);
    expect(unknown).not.toContain("needs Pro");
    plan.ready = true;
  });

  it("sends the day card's own unlock button to the offer", () => {
    plan.pro = false;
    plan.ready = true;
    const html = renderToStaticMarkup(
      <ProgramTodayCard active={active("measured-voice-12w", firstPaid)} onBrowse={null} />,
    );
    expect(html).toContain("needs Pro");
    expect(html).toMatch(/<a[^>]*href="\/pro#buy"[^>]*>Unlock with Pro<\/a>/);
  });
});

describe("the program cards once today's free minutes are used", () => {
  it("says the day carries on after midnight instead of leading with 'Open today's plan'", () => {
    plan.pro = false;
    plan.ready = true;
    capState.capped = true;
    try {
      const entry = renderToStaticMarkup(<ProgramEntryCard active={active("foundations-2w", 3)} />);
      expect(entry).toContain("carry on after midnight");
      expect(entry).toContain("See today’s plan");
      expect(entry).not.toContain("Open today’s plan");
      expect(entry).toContain("0 of 3 done");
      const card = renderToStaticMarkup(<ProgramTodayCard active={active("foundations-2w", 3)} onBrowse={null} />);
      // Nothing ticked yet, so no "rows already ticked".
      expect(card).toContain("5 free guided minutes are used. Day 4 is kept, and its guided rows open again after midnight.");
      expect(card).not.toContain("already ticked");
      expect(card).not.toContain("Each row opens its room.");
      // Part way through, the ticks are kept and the day resumes.
      const part = renderToStaticMarkup(
        <ProgramTodayCard active={active("foundations-2w", 3, undefined, [true, false, false])} onBrowse={null} />,
      );
      expect(part).toContain("Rows already ticked stay ticked, and day 4 picks up where you left off after midnight.");
      // The rows stay listed, and the day can still be marked done by hand.
      expect(card).toContain("data-program-item");
      expect(card).toContain("Mark day 4 done");
    } finally {
      capState.capped = false;
    }
  });

  it("names the rows outside the allowance as open now, and keeps a day with only those left open", () => {
    plan.pro = false;
    plan.ready = true;
    capState.capped = true;
    try {
      // Day 1 of The Measured Voice: the Morning reset, the range test, a
      // recorded take and the sustain test. The range test and the take sit
      // outside the cap.
      const p = programById("measured-voice-12w")!;
      const kinds = p.days[0].items.map((i) => i.kind);
      expect(kinds).toEqual(["routine", "range", "recorder", "drill"]);
      const card = renderToStaticMarkup(<ProgramTodayCard active={active("measured-voice-12w", 0)} onBrowse={null} />);
      expect(card).toContain("its guided rows open again after midnight");
      expect(card).toContain("The range test and the recorded take sit outside the allowance and are open now.");
      // With every capped row ticked, only the range test and the take are
      // left, and both are open now: the card does not say to wait.
      const rest = active("measured-voice-12w", 0, undefined, [true, false, false, true]);
      const entry = renderToStaticMarkup(<ProgramEntryCard active={rest} />);
      expect(entry).toContain("Open today’s plan");
      expect(entry).not.toContain("after midnight");
      expect(renderToStaticMarkup(<ProgramTodayCard active={rest} onBrowse={null} />)).toContain("Each row opens its room.");
    } finally {
      capState.capped = false;
    }
  });

  it("is unchanged while the cap is not reached, for Pro, and before the entitlement is read", () => {
    plan.pro = false;
    plan.ready = true;
    expect(renderToStaticMarkup(<ProgramEntryCard active={active("foundations-2w", 3)} />)).toContain("Open today’s plan");
    capState.capped = true;
    plan.ready = false;
    try {
      expect(renderToStaticMarkup(<ProgramEntryCard active={active("foundations-2w", 3)} />)).not.toContain("after midnight");
    } finally {
      capState.capped = false;
      plan.ready = true;
    }
  });
});

describe("the rest day that ends a Pro program's free week", () => {
  const lastFree = FREE_WEEKS * 7 - 1;

  it("says tomorrow needs Pro rather than that it opens tomorrow", () => {
    plan.pro = false;
    plan.ready = true;
    for (const id of ["mix-4w", "measured-voice-12w"]) {
      const view: ProgramToday = { status: "done-today", index: lastFree, completed: lastFree + 1 };
      const card = renderToStaticMarkup(<ProgramTodayCard active={active(id, lastFree, view)} onBrowse={null} />);
      expect(card, id).toContain(`Day ${lastFree + 2} onward needs Pro`);
      expect(card, id).not.toContain("opens tomorrow");
      expect(card, id).toMatch(/<a[^>]*href="\/pro#buy"[^>]*>Unlock with Pro<\/a>/);
      const entry = renderToStaticMarkup(<ProgramEntryCard active={active(id, lastFree, view)} />);
      expect(entry, id).toContain(`Day ${lastFree + 1}: rest day. Day ${lastFree + 2} onward needs Pro; week 1 was free.`);
      expect(entry, id).not.toContain("opens tomorrow");
    }
  });

  it("keeps 'opens tomorrow' for Pro, and says a rest day before a rest day is one", () => {
    plan.pro = true;
    plan.ready = true;
    const view: ProgramToday = { status: "done-today", index: lastFree, completed: lastFree + 1 };
    const card = renderToStaticMarkup(<ProgramTodayCard active={active("mix-4w", lastFree, view)} onBrowse={null} />);
    expect(card).toContain(`Day ${lastFree + 2}, “Into the mix pack”, opens tomorrow.`);
    expect(card).not.toContain("needs Pro");
    plan.pro = false;
    // The Measured Voice rests on days 6 and 7 of every week.
    const six: ProgramToday = { status: "done-today", index: 5, completed: 6 };
    const rest = renderToStaticMarkup(<ProgramTodayCard active={active("measured-voice-12w", 5, six)} onBrowse={null} />);
    expect(rest).toContain("Tomorrow, day 7, is a rest day.");
    expect(rest).not.toContain("“Rest day”, opens tomorrow");
    expect(renderToStaticMarkup(<ProgramEntryCard active={active("measured-voice-12w", 5, six)} />)).toContain(
      "Day 6: rest day. Tomorrow is a rest day too.",
    );
  });
});
