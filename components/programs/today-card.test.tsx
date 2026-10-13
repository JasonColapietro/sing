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

const saved = vi.hoisted(() => ({ calls: [] as unknown[] }));
vi.mock("@/components/programs/store", () => ({
  saveProgramProgress: (next: unknown) => saved.calls.push(next),
}));

vi.mock("@/lib/free-cap", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/free-cap")>()),
  useFreeCap: () => ({ capped: capState.capped, isPro: false, usedSec: 300, leftSec: 0, capSec: 300 }),
}));

import {
  ProgramEntryCard,
  ProgramTodayCard,
  restartFinished,
  restartQuestion,
  resumeStep,
} from "@/components/programs/today-card";
import type { ActiveProgram } from "@/components/programs/use-program";
import { FREE_WEEKS, itemSteps, programById } from "@/lib/programs";
import type { ProgramReading, ProgramToday } from "@/lib/programs";

function active(
  id: string,
  index: number,
  view?: ProgramToday,
  itemsDone?: boolean[],
  stepsDone?: boolean[][],
  readings: ProgramReading[] = [],
  stepsWaived?: boolean[][],
): ActiveProgram {
  const program = programById(id)!;
  return {
    program,
    progress: { programId: id, startedOn: "2026-10-01", done: [] },
    today: "2026-10-12",
    view: view ?? { status: "todo", index, completed: index },
    itemsDone: itemsDone ?? program.days[index].items.map(() => false),
    stepsDone: stepsDone ?? program.days[index].items.map(() => []),
    stepsWaived: stepsWaived ?? program.days[index].items.map(() => []),
    countsFrom: "2026-10-12",
    readings,
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

describe("a routine or breath set the free plan stopped part way", () => {
  /** The rows' links on the today card, in order. */
  const rowHrefs = (html: string) =>
    [...html.matchAll(/<a data-program-item="[^"]*"[^>]*\shref="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));

  it("links the row to the first step still to sing, and says so", () => {
    plan.pro = false;
    plan.ready = true;
    // Foundations day 2: Daily breath, then the Quick set. Box breathing,
    // Farinelli and the cue drill are logged; the sustain test is not, and
    // from step 1 the five free minutes run out before it ever starts.
    const p = programById("foundations-2w")!;
    expect(p.days[1].items.map((i) => i.kind)).toEqual(["breath", "routine"]);
    const steps = [[true, true, true, false], itemSteps(p.days[1].items[1]).map(() => false)];
    const html = renderToStaticMarkup(
      <ProgramTodayCard active={active("foundations-2w", 1, undefined, [false, false], steps)} onBrowse={null} />,
    );
    expect(rowHrefs(html)[0]).toBe("/breath?routine=daily&step=4");
    expect(html).toContain(" · carries on from step 4");
    // The step list opens, so the three ticks show.
    expect(html).toContain("<details open=\"\" class=");
    // The Quick set, with nothing sung, still opens at its start.
    expect(rowHrefs(html)[1]).toBe("/warmups?routine=quick");
  });

  it("opens at the start with nothing sung, once the item is done, and for items without steps", () => {
    plan.pro = false;
    plan.ready = true;
    const fresh = renderToStaticMarkup(<ProgramTodayCard active={active("foundations-2w", 1)} onBrowse={null} />);
    expect(rowHrefs(fresh)[0]).toBe("/breath?routine=daily");
    expect(fresh).not.toContain("carries on from step");
    expect(fresh).not.toContain("<details open");
    const breath = { kind: "breath", id: "daily" } as const;
    expect(resumeStep(breath, [true, true, true, false], false)).toBe(3);
    // A later step sung on its own leaves step 1 to sing first.
    expect(resumeStep(breath, [false, true, false, false], false)).toBe(-1);
    expect(resumeStep(breath, [true, true, true, true], true)).toBe(-1);
    expect(resumeStep(breath, undefined, false)).toBe(-1);
    // Ear training's two requirements are not steps a link can open on.
    expect(resumeStep({ kind: "ear" }, [true, false], false)).toBe(-1);
  });

  it("does not count a step skipped for the saved range as sung", () => {
    plan.pro = false;
    plan.ready = true;
    // Foundations day 2's Quick set holds N run, which the routine runner
    // skips for a range no wider than the run (matchDay waives it). On a
    // fresh day nothing has been sung: the row opens at its start, the step
    // list stays shut, and N run says it is skipped rather than ticked.
    const p = programById("foundations-2w")!;
    const quick = p.days[1].items[1];
    const runAt = itemSteps(quick).findIndex((st) => st.kind === "exercise" && st.id === "n-hum-scale");
    expect(runAt).toBeGreaterThan(0);
    const waivedQuick = itemSteps(quick).map((_, k) => k === runAt);
    const fresh = renderToStaticMarkup(
      <ProgramTodayCard
        active={active("foundations-2w", 1, undefined, [false, false], [[false, false, false, false], waivedQuick], [], [[], waivedQuick])}
        onBrowse={null}
      />,
    );
    expect(rowHrefs(fresh)[1]).toBe("/warmups?routine=quick");
    expect(fresh).not.toContain("carries on from step");
    expect(fresh).not.toContain("<details open");
    expect(fresh).toContain("Its 4 steps, one at a time (0 done)");
    expect(fresh).toContain("skipped for your range");
    // No link into a step that would only skip itself.
    expect(fresh).not.toContain(`href="/warmups?routine=quick&amp;step=${runAt + 1}"`);
    expect(resumeStep(quick, waivedQuick, false, waivedQuick)).toBe(-1);
    // Sung up to the skipped step: carry on past it.
    const upTo = itemSteps(quick).map((_, k) => k <= runAt);
    expect(resumeStep(quick, upTo, false, waivedQuick)).toBe(runAt + 1);
    const partway = renderToStaticMarkup(
      <ProgramTodayCard
        active={active("foundations-2w", 1, undefined, [false, false], [[false, false, false, false], upTo], [], [[], waivedQuick])}
        onBrowse={null}
      />,
    );
    expect(rowHrefs(partway)[1]).toBe(`/warmups?routine=quick&step=${runAt + 2}`);
    expect(partway).toContain(`Its 4 steps, one at a time (${runAt} done)`);
    expect(partway).toContain("<details open=\"\" class=");
  });
});

describe("restarting a finished program", () => {
  const finished = (id: string): ProgramToday => {
    const n = programById(id)!.days.length;
    return { status: "finished", index: n - 1, completed: n };
  };
  const readings: ProgramReading[] = [
    { index: 0, day: "2026-09-01", range: { lowMidi: 48, highMidi: 67 }, sustainSec: 9.2 },
    { index: 13, day: "2026-09-14", range: { lowMidi: 47, highMidi: 69 }, sustainSec: 12.4 },
  ];

  it("asks first, and says the check-in readings go when there are any", () => {
    const p = programById("foundations-2w")!;
    expect(restartQuestion(p, readings)).toBe(
      `Start ${p.name} again from day 1? This run's check-in readings above are cleared.`,
    );
    // Vibrato in 3 weeks takes no range or sustain readings.
    const v = programById("vibrato-3w")!;
    expect(restartQuestion(v, [])).toBe(`Start ${v.name} again from day 1?`);
    const html = renderToStaticMarkup(
      <ProgramTodayCard active={active("foundations-2w", 13, finished("foundations-2w"), [], [], readings)} onBrowse={null} />,
    );
    expect(html).toContain("Start again from day 1");
    expect(html).toContain("data-program-readings");
  });

  it("keeps the finished run when the singer says no, and starts a new one on yes", () => {
    const p = programById("foundations-2w")!;
    const asked: string[] = [];
    let answer = false;
    vi.stubGlobal("window", {
      confirm: (q: string) => {
        asked.push(q);
        return answer;
      },
    });
    try {
      saved.calls.length = 0;
      restartFinished(p, readings, "2026-10-12");
      expect(asked).toEqual([restartQuestion(p, readings)]);
      expect(saved.calls).toEqual([]);
      answer = true;
      restartFinished(p, readings, "2026-10-12");
      expect(saved.calls).toHaveLength(1);
      expect(saved.calls[0]).toMatchObject({ programId: p.id, done: [] });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
