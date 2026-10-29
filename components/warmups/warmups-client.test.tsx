import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FreeCap } from "@/lib/free-cap";
import { DEFAULT_PROGRESS, type ProgressState } from "@/lib/progress-shape";
import { localDay } from "@/lib/progress";
import { programById } from "@/lib/programs";
import type { ActiveProgram } from "@/components/programs/use-program";
import { routineById, routineSeconds } from "./routines";

const state = vi.hoisted(() => ({
  cap: { isPro: false, usedSec: 0, leftSec: 300, capped: false, capSec: 300 } as FreeCap,
  pro: false,
  ready: true,
  progress: null as ProgressState | null,
  program: null as ActiveProgram | null,
}));

vi.mock("@/lib/progress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/progress")>();
  return {
    ...actual,
    useProgress: () => state.progress ?? actual.useProgress(),
  };
});

vi.mock("@/lib/free-cap", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/free-cap")>(),
  useFreeCap: () => state.cap,
}));

vi.mock("@/components/programs/use-program", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/components/programs/use-program")>(),
  useActiveProgram: () => state.program,
}));

vi.mock("@/lib/pro", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/pro")>(),
  useIsPro: () => state.pro,
  useProReady: () => state.ready,
}));

// `ready: false` is the server HTML and the hydration render, where the
// cap-dependent parts are all present behind pre-paint markers.
vi.mock("@/components/prepaint", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/components/prepaint")>(),
  useHydrated: () => state.ready,
}));

import { SilentStopNote, WarmupsClient, linkedRepCount } from "./warmups-client";
import { paintedFor } from "@/components/prepaint.testing";

const morning = routineById("morning")!;
const daily = routineById("daily")!;
const quick = routineById("quick")!;

/**
 * The recommended routine's title: the h2 right after its kicker, which is
 * "Today's warmup" for a returning singer and "Start here" for a newcomer,
 * whose first card is that routine.
 */
function todaysWarmup(html: string): string | undefined {
  const kicker = html.includes("Today&#x27;s warmup") ? "Today&#x27;s warmup" : "Start here";
  const at = html.indexOf(kicker);
  return html.slice(at).match(/<h2[^>]*>([^<]*)<\/h2>/)?.[1];
}

/** A singer with one warmup logged today, so the room plans a top-up. */
function practisedToday(): ProgressState {
  const day = localDay();
  return {
    ...DEFAULT_PROGRESS,
    sessions: [
      { id: "t1", type: "warmup", date: `${day}T09:00:00.000Z`, day, durationSec: 240, score: 70, detail: "First hum", xp: 20 },
    ],
  };
}

beforeEach(() => {
  state.cap = { isPro: false, usedSec: 0, leftSec: 300, capped: false, capSec: 300 };
  state.pro = false;
  state.ready = true;
  state.progress = null;
  state.program = null;
});

describe("today's warmup on the free plan", () => {
  it("recommends a set that finishes inside the free minutes, and says so", () => {
    const html = renderToStaticMarkup(<WarmupsClient />);
    expect(todaysWarmup(html)).toBe(morning.name);
    expect(html).toContain("Fits in today&#x27;s 5 free minutes.");
  });

  it("names the time left when part of the allowance is used", () => {
    state.cap = { isPro: false, usedSec: 30, leftSec: 270, capped: false, capSec: 300 };
    const html = renderToStaticMarkup(<WarmupsClient />);
    expect(todaysWarmup(html)).toBe(morning.name);
    expect(html).toContain("Fits in the 4:30 of free practice left today.");
  });

  it("names no free minutes before the entitlement is read", () => {
    // The prerender: a Pro singer sees this HTML until hydration, with what
    // the pre-paint state hides for Pro (the cap wall, the allowance line)
    // already gone.
    state.ready = false;
    const html = paintedFor(renderToStaticMarkup(<WarmupsClient />), { plan: "pro" });
    expect(todaysWarmup(html)).toBe(morning.name);
    expect(html).not.toContain("free minutes");
    expect(html).not.toContain("free practice left");
    expect(html).not.toContain("Free guided practice today");
  });

  it("paints the cap wall in place of the mic gate before hydration for a capped singer", () => {
    state.ready = false;
    const html = renderToStaticMarkup(<WarmupsClient />);
    const capped = paintedFor(html, { plan: "capped" });
    expect(capped).toContain('id="free-cap"');
    expect(capped).not.toContain('id="warmup-gate"');
    const free = paintedFor(html, { plan: "free" });
    expect(free).not.toContain('id="free-cap"');
    expect(free).toContain('id="warmup-gate"');
    expect(free).toContain("Free guided practice today");
  });

  it("holds a leading program card's place before hydration only for a day still to do", () => {
    state.ready = false;
    const html = renderToStaticMarkup(<WarmupsClient />);
    const slot = 'data-prepaint-slot="program-lead"';
    expect(paintedFor(html, { plan: "free", program: null })).not.toContain(slot);
    expect(paintedFor(html, { plan: "free", program: "todo" })).toContain(slot);
    expect(paintedFor(html, { plan: "capped", program: "todo waits" })).toContain(slot);
    expect(paintedFor(html, { plan: "free", program: "todo locked" })).not.toContain(slot);
    expect(paintedFor(html, { plan: "free", program: "done rest next-locked" })).not.toContain(slot);
    // Empty and out of the accessibility tree: a frame, not content.
    expect(html).toMatch(/<div aria-hidden="true" class="[^"]*" data-prepaint-slot="program-lead"><\/div>/);
    // Before the room's first card, where the card leads.
    expect(html.indexOf(slot)).toBeLessThan(html.indexOf("Start here"));
  });

  it("says where a set that cannot fit the minutes left will stop, rather than calling it short", () => {
    // 60 s left: Quick (~6 min) is the top-up, and nothing shorter fits.
    state.progress = practisedToday();
    state.cap = { isPro: false, usedSec: 240, leftSec: 60, capped: false, capSec: 300 };
    const html = renderToStaticMarkup(<WarmupsClient />);
    expect(todaysWarmup(html)).toBe(quick.name);
    expect(html).toContain("1:00 of free practice left today: this routine stops after the step that uses it up.");
    expect(html).not.toContain("A short top-up after today&#x27;s practice.");
  });

  it("calls nothing a top-up once today's free practice is used", () => {
    // The button says "Available tomorrow"; the reason line under it keeps
    // its height with a no-break space rather than offering the set now.
    const blankReason = '<p class="text-xs text-dim sm:text-right"> </p>';
    state.progress = practisedToday();
    state.cap = { isPro: false, usedSec: 330, leftSec: 0, capped: true, capSec: 300 };
    const html = renderToStaticMarkup(<WarmupsClient />);
    expect(html).toContain("Today&#x27;s warmup");
    expect(html).toContain("Available tomorrow");
    expect(html).not.toContain("A short top-up after today&#x27;s practice.");
    expect(html).toContain(blankReason);

    // A newcomer capped by another guided room gets the same "Start here" card.
    const day = localDay();
    state.progress = {
      ...DEFAULT_PROGRESS,
      sessions: [
        { id: "e1", type: "ear", date: `${day}T09:00:00.000Z`, day, durationSec: 330, score: 70, detail: "Interval ID", xp: 20 },
      ],
    };
    const newcomer = renderToStaticMarkup(<WarmupsClient />);
    expect(newcomer).toContain("Start here");
    expect(newcomer).toContain("Available tomorrow");
    expect(newcomer).not.toContain("A short top-up after today&#x27;s practice.");
    expect(newcomer).toContain(blankReason);
  });

  it("offers no other exercise for now on the path card once today's free practice is used", () => {
    const choice = "You can still choose any exercise below.";
    state.progress = practisedToday();
    const open = renderToStaticMarkup(<WarmupsClient />);
    expect(open).toContain("Continue your path");
    expect(open).toContain(choice);

    // Every row below is disabled at the cap, so the card names only its own pick.
    state.cap = { isPro: false, usedSec: 330, leftSec: 0, capped: true, capSec: 300 };
    const capped = renderToStaticMarkup(<WarmupsClient />);
    expect(capped).toContain("Continue your path");
    expect(capped).toContain("The next exercise in your lowest unfinished tier.");
    expect(capped).toContain("Available tomorrow");
    expect(capped).not.toContain(choice);
  });

  it("keeps the top-up reason when the set fits, and on Pro", () => {
    state.progress = practisedToday();
    state.pro = true;
    state.cap = { isPro: true, usedSec: 240, leftSec: Number.POSITIVE_INFINITY, capped: false, capSec: 300 };
    const html = renderToStaticMarkup(<WarmupsClient />);
    expect(todaysWarmup(html)).toBe(quick.name);
    expect(html).toContain("A short top-up after today&#x27;s practice.");
    expect(html).not.toContain("this routine stops after");
  });

  it("keeps the full recommendation on Pro", () => {
    state.pro = true;
    state.cap = { isPro: true, usedSec: 0, leftSec: Number.POSITIVE_INFINITY, capped: false, capSec: 300 };
    const html = renderToStaticMarkup(<WarmupsClient />);
    expect(todaysWarmup(html)).toBe(daily.name);
    expect(html).not.toContain("free minutes");
  });
});

describe("the warmups mic gate", () => {
  it("describes a ladder that climbs and comes back down", () => {
    const html = renderToStaticMarkup(<WarmupsClient />);
    expect(html).toContain('id="warmup-gate"');
    expect(html).not.toContain("The key climbs a semitone every rep");
    expect(html).toContain("most exercises climb and");
  });

  it("promises a self-advancing set only for routines, and says a single exercise runs until End", () => {
    const html = renderToStaticMarkup(<WarmupsClient />);
    expect(html).not.toContain("you never have to pick what comes next");
    expect(html).toContain("In a routine, after the set number of reps");
    expect(html).toContain("A single exercise keeps going until you press End.");
  });
});

describe("a rep count on an exercise link", () => {
  it("reads a whole number from 1 to 30 and ignores anything else", () => {
    expect(linkedRepCount("5")).toBe(5);
    expect(linkedRepCount("1")).toBe(1);
    expect(linkedRepCount("30")).toBe(30);
    for (const raw of [null, undefined, "", " ", "0", "31", "4.5", "-2", "five", "1e1x"]) {
      expect(linkedRepCount(raw), String(raw)).toBeNull();
    }
  });
});

describe("the first card a newcomer sees", () => {
  it("does not offer a path to continue to someone who has never sung a warmup", () => {
    const html = renderToStaticMarkup(<WarmupsClient />);
    expect(html).toContain("Start here");
    expect(html).not.toContain("Continue your path");
    // Its start opens the recommended routine, which ends on its own, not
    // one endless ladder; and the routine is offered once, not twice.
    expect(html).not.toContain("it keeps going until you press End");
    expect(html).not.toContain("Today&#x27;s warmup");
    expect(todaysWarmup(html)).toBe(morning.name);
    // The first start button on the page is that routine's: nothing but
    // its own card sits between the kicker and the button.
    const start = html.indexOf("Start here");
    const button = html.indexOf("Enable mic and start");
    expect(start).toBeGreaterThan(-1);
    expect(button).toBeGreaterThan(start);
    const card = html.slice(start, button);
    expect(card).toContain(morning.name);
    expect(card).not.toContain("Today&#x27;s three");
    expect(card).not.toContain("Your program");
  });

  it("keeps 'Continue your path' for a singer with warmups behind them", () => {
    state.progress = {
      ...DEFAULT_PROGRESS,
      sessions: [
        { id: "s1", type: "warmup", date: "2026-09-01T09:00:00.000Z", day: "2026-09-01", durationSec: 120, score: 70, detail: "First hum", xp: 20 },
      ],
    };
    const html = renderToStaticMarkup(<WarmupsClient />);
    expect(html).toContain("Continue your path");
    expect(html).not.toContain("it keeps going until you press End");
  });

  it("gives a returning singer one filled start button and one streak chip", () => {
    state.progress = {
      ...DEFAULT_PROGRESS,
      sessions: [
        { id: "s1", type: "warmup", date: "2026-09-01T09:00:00.000Z", day: "2026-09-01", durationSec: 120, score: 70, detail: "First hum", xp: 20 },
      ],
    };
    const html = renderToStaticMarkup(<WarmupsClient />);
    expect(html).toContain("Continue your path");
    expect(html).toContain("Today&#x27;s warmup");
    const starts = [...html.matchAll(/<button[^>]*class="([^"]*)"[^>]*>(Enable mic and start|Start exercise|Start routine|Start)<\/button>/g)];
    expect(starts).toHaveLength(2);
    // Today's warmup, the finite daily routine, is the one filled start.
    expect(starts.filter((m) => m[1].includes("bg-rec"))).toHaveLength(1);
    const path = html.slice(html.indexOf("Continue your path"), html.indexOf("Today&#x27;s warmup"));
    expect(path).toMatch(/<button[^>]*border-field[^>]*>(Enable mic and start|Start exercise)<\/button>/);
    expect(html.match(/Start a streak today|-day streak|Best streak/g) ?? []).toHaveLength(1);
  });

  it("claims only that the audio stays on the device", () => {
    const html = renderToStaticMarkup(<WarmupsClient />);
    expect(html).toContain("your audio never leaves this device");
    expect(html).not.toContain("nothing leaves this device");
  });
});

describe("a program day the singer cannot open", () => {
  const mix = programById("mix-4w")!;
  const onDay = (index: number): ActiveProgram => ({
    program: mix,
    progress: { programId: mix.id, startedOn: "2026-09-01", completed: [] } as unknown as ActiveProgram["progress"],
    today: "2026-10-12",
    view: { status: "todo", index, completed: index },
    itemsDone: [],
    stepsDone: [],
    stepsWaived: [],
    countsFrom: "2026-10-12",
    readings: [],
  });

  it("does not lead the room for a free singer past the free week", () => {
    state.program = onDay(7);
    const html = renderToStaticMarkup(<WarmupsClient />);
    const card = html.indexOf("Your program: day 8");
    expect(card).toBeGreaterThan(-1);
    expect(card).toBeGreaterThan(html.indexOf("Start here"));
  });

  it("still leads in the free week, and for Pro", () => {
    state.program = onDay(2);
    let html = renderToStaticMarkup(<WarmupsClient />);
    expect(html.indexOf("Your program: day 3")).toBeLessThan(html.indexOf("Start here"));
    state.program = onDay(7);
    state.pro = true;
    state.cap = { isPro: true, usedSec: 0, leftSec: Number.POSITIVE_INFINITY, capped: false, capSec: 300 };
    html = renderToStaticMarkup(<WarmupsClient />);
    expect(html.indexOf("Your program: day 8")).toBeLessThan(html.indexOf("Start here"));
  });
});

describe("one filled start while a program day leads", () => {
  const mix = programById("mix-4w")!;
  const onDay = (index: number): ActiveProgram => ({
    program: mix,
    progress: { programId: mix.id, startedOn: "2026-09-01", completed: [] } as unknown as ActiveProgram["progress"],
    today: "2026-10-12",
    view: { status: "todo", index, completed: index },
    itemsDone: [],
    stepsDone: [],
    stepsWaived: [],
    countsFrom: "2026-10-12",
    readings: [],
  });
  const filled = (html: string) =>
    [...html.matchAll(/<(?:a|button)[^>]*class="([^"]*)"[^>]*>([^<]*)<\/(?:a|button)>/g)]
      .filter((m) => /(?:^|\s)bg-(?:rec|violet-ink)(?:\s|$)/.test(m[1]))
      .map((m) => m[2]);

  it("lets the program's 'Open today's plan' be the filled start, for a newcomer and a returning singer", () => {
    state.program = onDay(1);
    let html = renderToStaticMarkup(<WarmupsClient />);
    expect(html).toContain("Start here");
    expect(html).toContain("Open today’s plan");
    expect(filled(html)).toEqual(["Open today’s plan"]);
    state.progress = practisedToday();
    html = renderToStaticMarkup(<WarmupsClient />);
    expect(html).toContain("Today&#x27;s warmup");
    expect(filled(html)).toEqual(["Open today’s plan"]);
  });

  it("keeps the room's start filled on a rest day, and once the free minutes are used", () => {
    state.program = onDay(3);
    let html = renderToStaticMarkup(<WarmupsClient />);
    expect(html).toContain("See the calendar");
    // The rest day's "See the calendar" is outline: the room's start is the one filled action.
    expect(filled(html)).toEqual(["Enable mic and start"]);
    state.program = onDay(1);
    state.cap = { isPro: false, usedSec: 300, leftSec: 0, capped: true, capSec: 300 };
    html = renderToStaticMarkup(<WarmupsClient />);
    expect(html).toContain("See today’s plan");
    expect(filled(html)).not.toContain("See today’s plan");
    expect(filled(html)).toContain("Available tomorrow");
  });
});

describe("today's warmup during Recovery week", () => {
  const recovery = programById("recovery-week")!;
  const easy = routineById("recovery")!;
  const full = routineById("full")!;
  const day = localDay();
  const recoveryDay1: ActiveProgram = {
    program: recovery,
    progress: { programId: recovery.id, startedDay: day, startedAt: `${day}T08:00:00.000Z`, done: [] } as unknown as ActiveProgram["progress"],
    today: day,
    view: { status: "todo", index: 0, completed: 0 } as unknown as ActiveProgram["view"],
    itemsDone: [],
    stepsDone: [],
    stepsWaived: [],
    countsFrom: day,
    readings: [],
  };
  /** Three warmups on earlier days at 92%: the usual pick reads them as strong. */
  const wellSung = (): ProgressState => ({
    ...DEFAULT_PROGRESS,
    sessions: [1, 2, 3].map((n) => ({
      id: `w${n}`,
      type: "warmup" as const,
      date: `2026-10-0${n}T09:00:00.000Z`,
      day: `2026-10-0${n}`,
      durationSec: 240,
      score: 92,
      detail: "Easy recovery",
      xp: 20,
    })),
  });
  /** The "Today's warmup" card, up to the mic gate under it. */
  const todaysCard = (html: string) => html.slice(html.indexOf("Today&#x27;s warmup"), html.indexOf('id="warmup-gate"'));

  beforeEach(() => {
    state.progress = wellSung();
    state.pro = true;
    state.cap = { isPro: true, usedSec: 0, leftSec: Number.POSITIVE_INFINITY, capped: false, capSec: 300 };
  });

  it("would be the full set after three strong warmups, on an ordinary day", () => {
    const card = todaysCard(renderToStaticMarkup(<WarmupsClient />));
    expect(card).toContain(full.name);
    expect(card).toContain("Try a longer routine.");
  });

  it("is the week's quiet set while the week runs, not a longer, faster one", () => {
    state.program = recoveryDay1;
    const card = todaysCard(renderToStaticMarkup(<WarmupsClient />));
    expect(card).toContain(easy.name);
    expect(card).toContain("Recovery week is running, so today&#x27;s warmup is the quiet routine.");
    expect(card).not.toContain(full.name);
    expect(card).not.toContain("Try a longer routine");
  });

  it("stays a quiet set on the free plan, sized to the minutes left", () => {
    state.program = recoveryDay1;
    state.pro = false;
    state.cap = { isPro: false, usedSec: 0, leftSec: 300, capped: false, capSec: 300 };
    const card = todaysCard(renderToStaticMarkup(<WarmupsClient />));
    // Easy recovery when it fits the five minutes, else the Morning reset.
    expect(card).toContain(routineSeconds(easy) <= 300 ? easy.name : morning.name);
    expect(card).not.toContain(full.name);
    expect(card).not.toContain("Try a longer routine");
  });

  it("goes back to the usual pick once the week is finished", () => {
    state.program = { ...recoveryDay1, view: { status: "finished", index: 6, completed: 7 } as unknown as ActiveProgram["view"] };
    const card = todaysCard(renderToStaticMarkup(<WarmupsClient />));
    expect(card).toContain(full.name);
  });
});

describe("the warmups room on a deep link's first load", () => {
  // The server HTML, and every render until the room has read its address:
  // the room behind the deep-link marker, then the screen-tall block that
  // takes its place when the pre-paint script found a link the room will
  // open (/warmups?routine=morning), so the cards and the gate the link
  // waits on arrive together and nothing painted moves
  // (components/prepaint.tsx).
  it("keeps the heading, holds the room behind the marker, and puts the slot after it", () => {
    const html = renderToStaticMarkup(<WarmupsClient />);
    const marker = html.indexOf('<div class="space-y-8" data-prepaint-deeplink="warmups">');
    expect(marker).toBeGreaterThan(html.indexOf("Guided vocal warm-up exercises</h1>"));
    for (const part of ["Start here", 'id="warmup-gate"', "Free guided practice today"]) {
      expect(html.indexOf(part), part).toBeGreaterThan(marker);
    }
    expect(html).toMatch(/<\/div><div aria-hidden="true" class="min-h-screen" data-prepaint-slot="deeplink-warmups"><\/div><\/main>$/);
    // The gate stays under today's cards, link or not: moving it up once the
    // room reads a link would push every card down on a client-side visit,
    // which the pre-paint script never sees.
    expect(html.indexOf('id="warmup-gate"')).toBeGreaterThan(html.indexOf("Start here"));
  });
});

describe("an exercise the player ended for silence", () => {
  it("says why it stopped and that nothing was logged, beside the input level", () => {
    const html = renderToStaticMarkup(<SilentStopNote title="Five-note scale" listening level={0} />);
    expect(html).toContain("No sound picked up");
    expect(html).toMatch(/role="alert"[^>]*>Five-note scale stopped after two reps with no note heard, so nothing was logged\.</);
    expect(html).toContain("Sing a little louder or closer to the mic, or check the input below, then start it again.");
    expect(html).toContain('aria-label="Microphone input level"');
  });

  it("is not in the room until the player has ended something for silence", () => {
    expect(renderToStaticMarkup(<WarmupsClient />)).not.toContain("No sound picked up");
  });
});
