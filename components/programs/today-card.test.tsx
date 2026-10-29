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
  DayItems,
  ProgramEntryCard,
  ProgramTodayCard,
  goBackQuestion,
  goBackTo,
  leaveQuestion,
  restartFinished,
  restartQuestion,
  resumeStep,
  stopQuestion,
} from "@/components/programs/today-card";
import type { ActiveProgram } from "@/components/programs/use-program";
import { FREE_WEEKS, itemSteps, programById } from "@/lib/programs";
import type { ProgramReading, ProgramToday } from "@/lib/programs";
import { PRICING, formatPrice } from "@/lib/pro-shared";

/** The unlock button to the offer, priced; the `$` is escaped for the pattern. */
const UNLOCK = new RegExp(
  `<a[^>]*href="/pro#buy"[^>]*>Unlock with Pro: ${formatPrice(PRICING.lifetime.amount).replace("$", "\\$")} once</a>`,
);

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
    expect(html).toContain(`Unlock day ${firstPaid + 1} with Pro: ${formatPrice(PRICING.lifetime.amount)} once`);
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
    expect(html).toMatch(UNLOCK);
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
      expect(card, id).toMatch(UNLOCK);
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

describe("the free plan's note on a day longer than five guided minutes", () => {
  const note = (id: string, index: number) =>
    renderToStaticMarkup(<ProgramTodayCard active={active(id, index)} onBrowse={null} />).replace(/<!-- -->/g, "");

  it("names the range test only on a day that takes one", () => {
    plan.pro = false;
    plan.ready = true;
    // Recovery week asks for no range test (a tired voice is not one to
    // measure), so its card does not point at one.
    const rw = programById("recovery-week")!;
    expect(rw.days[0].items.some((i) => i.kind === "range")).toBe(false);
    const recovery = note(rw.id, 0);
    expect(recovery).toContain("The free plan covers five guided minutes a day, and this day runs longer");
    expect(recovery).toMatch(/>Pro<\/a> removes the cap\.<\/p>/);
    expect(recovery).not.toContain("range test is always free");
    // Foundations' day 1 takes one, and still says it is free.
    const f = programById("foundations-2w")!;
    expect(f.days[0].items.some((i) => i.kind === "range")).toBe(true);
    const foundations = note(f.id, 0);
    expect(foundations).toContain("The free plan covers five guided minutes a day, and this day runs longer");
    expect(foundations).toContain("removes the cap; the range test is always free.");
  });

  it("is not shown to Pro", () => {
    plan.pro = true;
    plan.ready = true;
    expect(note("recovery-week", 0)).not.toContain("The free plan covers five guided minutes");
    plan.pro = false;
  });
});

describe("a finished Recovery week", () => {
  const rw = programById("recovery-week")!;
  const finished: ProgramToday = { status: "finished", index: rw.days.length - 1, completed: rw.days.length };

  it("ends on the referral, not on running the week again", () => {
    // Chapter 6: hoarseness that hangs around is a doctor's question, not "a
    // stricter practice week, or waiting to see".
    const html = renderToStaticMarkup(
      <ProgramTodayCard active={active(rw.id, rw.days.length - 1, finished)} onBrowse={null} />,
    ).replace(/<!-- -->/g, "");
    expect(html).toContain(`All ${rw.days.length} days done. If your voice feels back to ordinary`);
    expect(html).toContain("a doctor who can examine the vocal folds, such as an ENT or laryngologist");
    expect(html).not.toContain("Run it again from day 1");
    // The restart stays (its variant is an open owner decision), with no go-back.
    expect(html).toContain("Start again from day 1");
    expect(html).not.toContain("Repeat weeks");
    // The entry card on /warmups and /progress points at that line rather
    // than suggesting another run, and never says a bare "a doctor".
    const entry = renderToStaticMarkup(<ProgramEntryCard active={active(rw.id, rw.days.length - 1, finished)} />);
    expect(entry).toContain("Finished. The calendar says what next if your voice is still rough.");
    expect(entry).not.toContain("Start it again");
    expect(entry).not.toMatch(/\bdoctor\b/);
  });

  it("leaves every other program's finished lines as they were", () => {
    const vibrato: ProgramToday = { status: "finished", index: 20, completed: 21 };
    const card = renderToStaticMarkup(<ProgramTodayCard active={active("vibrato-3w", 20, vibrato)} onBrowse={null} />);
    expect(card.replace(/<!-- -->/g, "")).toContain("All 21 days done. Run it again from day 1, or pick another program.");
    expect(card).not.toMatch(/\bdoctor\b/);
    expect(renderToStaticMarkup(<ProgramEntryCard active={active("vibrato-3w", 20, vibrato)} />)).toContain(
      "Finished. Start it again or pick another.",
    );
  });
});

describe("leaving or stopping a program", () => {
  const finished = (id: string): ProgramToday => {
    const n = programById(id)!.days.length;
    return { status: "finished", index: n - 1, completed: n };
  };
  const readings: ProgramReading[] = [
    { index: 0, day: "2026-09-01", range: { lowMidi: 48, highMidi: 67 }, sustainSec: 9.2 },
    { index: 13, day: "2026-09-14", range: { lowMidi: 47, highMidi: 69 }, sustainSec: 12.4 },
  ];

  it("says a finished run's check-in readings go, not that its place does", () => {
    const p = programById("foundations-2w")!;
    const done = active("foundations-2w", 13, finished("foundations-2w"), [], [], readings);
    expect(leaveQuestion(done)).toBe(`Leave ${p.name}? You finished it. Its check-in readings are cleared.`);
    expect(stopQuestion(done)).toBe(`Stop ${p.name}? You finished it. Its check-in readings are cleared.`);
    expect(stopQuestion(done)).not.toContain("days wait");
  });

  it("keeps the break advice for a run under way, and names readings only when there are any", () => {
    const v = programById("vibrato-3w")!;
    expect(stopQuestion(active("vibrato-3w", 2))).toBe(
      `Stop ${v.name}? Your place in it is not kept. To take a break, just come back later: days wait for you.`,
    );
    expect(leaveQuestion(active("vibrato-3w", 2))).toBe(`Leave ${v.name}? Your place in it is not kept.`);
    const p = programById("foundations-2w")!;
    expect(leaveQuestion(active("foundations-2w", 5, undefined, undefined, undefined, readings.slice(0, 1)))).toBe(
      `Leave ${p.name}? Your place in it is not kept. Its check-in readings are cleared.`,
    );
  });
});

describe("going back a fortnight in the book's program", () => {
  const mv = programById("measured-voice-12w")!;
  const week = (n: number) => mv.chapters!.find((c) => c.fromWeek === n)!;
  const finished: ProgramToday = { status: "finished", index: mv.days.length - 1, completed: mv.days.length };
  const readings: ProgramReading[] = [
    { index: 0, day: "2026-06-01", range: { lowMidi: 48, highMidi: 67 }, sustainSec: 7 },
    { index: 41, day: "2026-07-12", range: { lowMidi: 47, highMidi: 69 }, sustainSec: 11 },
    { index: 77, day: "2026-08-17", range: { lowMidi: 47, highMidi: 70 }, sustainSec: 12 },
  ];

  it("gives chapter 19's next steps on the finished card, and keeps the restart", () => {
    plan.pro = true;
    try {
      const html = renderToStaticMarkup(
        <ProgramTodayCard active={active(mv.id, mv.days.length - 1, finished, [], [], readings)} onBrowse={null} />,
      );
      expect(html).toContain("Chapter 19 says what next");
      // Each of chapter 19's outcomes names its own fortnight.
      expect(html).toContain("if the transition never quite took, go back to weeks 5 and 6; if the top still frays, to weeks 7 and 8");
      expect(html).not.toContain("Run it again from day 1");
      // Each sings that fortnight again, not the weeks after it too.
      const text = html.replace(/<!-- -->/g, "");
      expect(text).toContain("Repeat weeks 5–6");
      expect(text).toContain("Repeat weeks 7–8");
      expect(text).not.toContain("Go back to week");
      expect(html).toContain("Start again from day 1");
      // Other programs keep their finished line and no go-back.
      const f = renderToStaticMarkup(
        <ProgramTodayCard
          active={active("foundations-2w", 13, { status: "finished", index: 13, completed: 14 })}
          onBrowse={null}
        />,
      );
      expect(f).toContain("Run it again from day 1, or pick another program.");
      expect(f).not.toContain("Go back to week");
      expect(f).not.toContain("Repeat weeks");
    } finally {
      plan.pro = false;
    }
  });

  it("does not read a sustain-only check-in's range cell as a test missed", () => {
    // Days 11, 60 and 67 take a sustain test and no range test (chapters 13,
    // 14 and 18 ask for no retest there); day 42's test is on record as none.
    const rows: ProgramReading[] = [
      readings[0],
      { index: 10, day: "2026-06-11", sustainSec: 9.9 },
      { index: 41, day: "2026-07-12", range: null, sustainSec: 11 },
      { index: 59, day: "2026-07-30", sustainSec: 12.4 },
    ];
    const html = renderToStaticMarkup(
      <ProgramTodayCard active={active(mv.id, mv.days.length - 1, finished, [], [], rows)} onBrowse={null} />,
    ).replace(/<!-- -->/g, "");
    const cells = [...html.matchAll(/<tr class="border-t[^"]*">([\s\S]*?)<\/tr>/g)].map((m) =>
      [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1].replace(/<[^>]+>/g, "")),
    );
    expect(cells.map((c) => c[1])).toEqual(["C3–G4", "—", "not logged", "—"]);
    expect(cells.map((c) => c[2])).toEqual(["7.0 s", "9.9 s", "11.0 s", "12.4 s"]);
  });

  it("says which readings are kept and which are sung again", () => {
    expect(goBackQuestion(week(5), readings)).toBe(
      "Go back to the start of weeks 5–6? Days from day 29 on are sung again, and the check-in readings before day 29 are kept. The readings from days 42 and 78 are cleared.",
    );
    expect(goBackQuestion(week(7), readings.slice(0, 2))).toBe(
      "Go back to the start of weeks 7–8? Days from day 43 on are sung again, and the check-in readings before day 43 are kept.",
    );
    expect(goBackQuestion(week(3), [])).toBe("Go back to the start of weeks 3–4? Days from day 15 on are sung again.");
    // A finished run's four later check-ins read as one list, and a lone one as a single day.
    const all: ProgramReading[] = [0, 10, 41, 59, 66, 77].map((index) => ({ index, day: "2026-08-01", range: null }));
    expect(goBackQuestion(week(5), all)).toContain("The readings from days 42, 60, 67 and 78 are cleared.");
    expect(goBackQuestion(week(7), readings.slice(0, 2).concat(readings[2]))).toContain(
      "The reading from day 78 is cleared.",
    );
  });

  it("says a finished run sings only the fortnight again and keeps every other reading", () => {
    expect(goBackQuestion(week(5), readings, 42)).toBe(
      "Go back to the start of weeks 5–6? Days 29 to 42 are sung again, then the run is finished again; the other days stay done, with their check-in readings. The reading from day 42 is cleared.",
    );
    expect(goBackQuestion(week(7), readings, 56)).toBe(
      "Go back to the start of weeks 7–8? Days 43 to 56 are sung again, then the run is finished again; the other days stay done, with their check-in readings.",
    );
    expect(goBackQuestion(week(3), [], 42)).toBe(
      "Go back to the start of weeks 3–4? Days 15 to 42 are sung again, then the run is finished again; the other days stay done.",
    );
  });

  it("asks first, and goes back only on yes", () => {
    const progress = {
      programId: mv.id,
      startedDay: "2026-06-01",
      startedAt: "2026-06-01T08:00:00.000Z",
      // Days 1 to 45, one a calendar day from 2026-06-01.
      done: Array.from({ length: 45 }, (_, i) => ({ index: i, day: new Date(Date.UTC(2026, 5, 1 + i)).toISOString().slice(0, 10) })),
    };
    let answer = false;
    vi.stubGlobal("window", { confirm: () => answer });
    try {
      saved.calls.length = 0;
      expect(goBackTo(progress, readings.slice(0, 2), week(5))).toBe(false);
      expect(saved.calls).toEqual([]);
      answer = true;
      expect(goBackTo(progress, readings.slice(0, 2), week(5))).toBe(true);
      expect(saved.calls).toHaveLength(1);
      const next = saved.calls[0] as typeof progress;
      expect(next.done).toHaveLength(28);
      expect(next.done[0]).toMatchObject({ range: { lowMidi: 48, highMidi: 67 }, sustainSec: 7 });
      expect(next.startedAt).not.toBe(progress.startedAt);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("sings only the fortnight again from a finished run", () => {
    const progress = {
      programId: mv.id,
      startedDay: "2026-06-01",
      startedAt: "2026-06-01T08:00:00.000Z",
      // Every day, one a calendar day from 2026-06-01.
      done: Array.from({ length: mv.days.length }, (_, i) => ({
        index: i,
        day: new Date(Date.UTC(2026, 5, 1 + i)).toISOString().slice(0, 10),
      })),
    };
    const asked: string[] = [];
    vi.stubGlobal("window", { confirm: (q: string) => (asked.push(q), true) });
    try {
      saved.calls.length = 0;
      expect(goBackTo(progress, readings, week(5), true)).toBe(true);
      expect(asked[0]).toContain("Days 29 to 42 are sung again, then the run is finished again");
      const next = saved.calls[0] as typeof progress & { until?: number; later?: { index: number }[] };
      expect(next.done).toHaveLength(28);
      expect(next.until).toBe(42);
      expect(next.later?.map((d) => d.index)).toEqual(Array.from({ length: mv.days.length - 42 }, (_, i) => 42 + i));
      // Day 78's reading stays on its day.
      expect(next.later?.find((d) => d.index === 77)).toMatchObject({ range: { lowMidi: 47, highMidi: 70 }, sustainSec: 12 });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("says on the card that a second pass finishes the run again", () => {
    const p = active(mv.id, 28, { status: "todo", index: 28, completed: 70 });
    p.progress = { programId: mv.id, startedDay: "2026-06-01", done: [], until: 42, later: [] };
    plan.pro = true;
    try {
      const html = renderToStaticMarkup(<ProgramTodayCard active={p} onBrowse={null} />).replace(/<!-- -->/g, "");
      expect(html).toContain("70 of 84 days done");
      expect(html).toContain("once day 42 is done, the run is finished again. Days 43 to 84 stay done.");
      // Not on an ordinary run.
      const plain = renderToStaticMarkup(
        <ProgramTodayCard active={active(mv.id, 28, { status: "todo", index: 28, completed: 28 })} onBrowse={null} />,
      );
      expect(plain).not.toContain("data-program-repeat");
    } finally {
      plan.pro = false;
    }
  });
});

describe("today's rows a second time, in the calendar", () => {
  it("carry the card's ticks and carry-on links without repeating the step lists", () => {
    const p = programById("foundations-2w")!;
    const index = p.days.findIndex((d) => d.items.some((it) => it.kind === "routine" && it.id === "quick"));
    const day = p.days[index];
    const at = day.items.findIndex((it) => it.kind === "routine" && it.id === "quick");
    const stepsDone = day.items.map((it, i) => (i === at ? itemSteps(it).map((_, k) => k < 2) : []));
    const html = renderToStaticMarkup(
      <DayItems day={day} done={day.items.map(() => false)} stepsDone={stepsDone} compact />,
    ).replace(/<!-- -->/g, "");
    expect(html).toContain("/warmups?routine=quick&amp;step=3");
    expect(html).toContain("carries on from step 3");
    expect(html).not.toContain("one at a time");
    // The full card's list still has them.
    const full = renderToStaticMarkup(<DayItems day={day} done={day.items.map(() => false)} stepsDone={stepsDone} />);
    expect(full).toContain("one at a time");
  });
});


describe("a ticked row, read aloud", () => {
  it("says done, not done today: the day's ticks count from the day it opened", () => {
    // A day still open the next morning keeps yesterday's tick (countsFrom),
    // so "(done today)" was false for it.
    const day = programById("foundations-2w")!.days[0];
    const html = renderToStaticMarkup(
      <DayItems day={day} done={day.items.map((_, i) => i === 0)} />,
    );
    expect(html).toContain('<span class="sr-only">(done)</span>');
    expect(html).not.toContain("done today");
    if (day.items.length > 1) expect(html).toContain('<span class="sr-only">(not done yet)</span>');
  });
});
