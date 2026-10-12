/**
 * The program cards for a free singer past a Pro program's free week. Their
 * place is kept, so that day is "today" every day until they buy or stop the
 * program: the warmups room's entry card must not call it today's plan, and
 * every unlock button goes to the offer itself.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const plan = vi.hoisted(() => ({ pro: false, ready: true }));

vi.mock("@/lib/pro", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/pro")>()),
  useIsPro: () => plan.pro,
  useProReady: () => plan.ready,
}));

import { ProgramEntryCard, ProgramTodayCard } from "@/components/programs/today-card";
import type { ActiveProgram } from "@/components/programs/use-program";
import { FREE_WEEKS, programById } from "@/lib/programs";

function active(id: string, index: number): ActiveProgram {
  const program = programById(id)!;
  return {
    program,
    progress: { programId: id, startedOn: "2026-10-01", done: [] },
    today: "2026-10-12",
    view: { status: "todo", index, completed: index },
    itemsDone: program.days[index].items.map(() => false),
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
