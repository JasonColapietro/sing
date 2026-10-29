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
import { recoveryRangeNote } from "@/components/practice/program-range-note";

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
      `Your range was last measured ${RANGE_RETEST_DAYS} days ago. A fresh test adds a current point to your range over time.`,
    );
    expect(due?.reason).not.toMatch(/growth/i);
  });

  // A singer on The Measured Voice a week behind the calendar, day 37 to do,
  // with the day-1 range 45 days old. Chapter 13: "Do not retest between
  // those points"; the program's next test is day 42.
  const scheduled = { name: PROGRAM, day: 42, today: false };

  it("leaves the retest to a running program that schedules one", () => {
    const plan = buildPlan(withRange(RANGE_RETEST_DAYS + 3), NOW, null, scheduled);
    expect(plan.items.map((i) => i.title)).not.toContain("Retake the range test");
    expect(plan.rangeNote).toBe(
      `Your range was last measured ${RANGE_RETEST_DAYS + 3} days ago. Your next range test is on day 42 of ${PROGRAM}. Wait for that day: a test taken earlier does not count toward it.`,
    );
    // Today's own program day takes it.
    const today = buildPlan(withRange(RANGE_RETEST_DAYS + 3), NOW, null, { ...scheduled, today: true });
    expect(today.items.map((i) => i.title)).not.toContain("Retake the range test");
    expect(today.rangeNote).toBe(
      `Your range was last measured ${RANGE_RETEST_DAYS + 3} days ago. Today's program day is day 42 of ${PROGRAM}. It takes your next range test after its warm-up, so take the test there.`,
    );
    // A current range needs no note, and no program keeps the coach's own retest.
    expect(buildPlan(withRange(3), NOW, null, scheduled).rangeNote).toBeNull();
    expect(buildPlan(withRange(RANGE_RETEST_DAYS + 3), NOW).rangeNote).toBeNull();
    // A singer with no range is still asked to measure one.
    expect(buildPlan(state(), NOW, null, scheduled).items[0].title).toBe("Vocal range test");
  });

  it("says so on the card, under the plan's heading", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const html = renderToStaticMarkup(<CoachCard state={withRange(RANGE_RETEST_DAYS + 3)} programRange={scheduled} />);
    expect(html).toContain("Your next range test is on day 42 of");
    expect(html).not.toContain("Retake the range test");
    expect(renderToStaticMarkup(<CoachCard state={withRange(RANGE_RETEST_DAYS + 3)} />)).toContain("Retake the range test");
  });
});

describe("the coach during Recovery week", () => {
  // Seven quiet days for a voice that feels tired, with no range test of its
  // own. Chapter 12: "A range test taken with a cold measures the cold … start
  // measuring again when you are back to ordinary." A finished test saves its
  // reading as the range every warmup and song fits to.
  const RECOVERY = "Recovery week";
  const DAY = 86_400_000;
  const LINE = `${RECOVERY} is for a voice that feels tired, so leave the range test until the week is over and your voice feels back to ordinary.`;
  const RANGE_TESTS = ["Retake the range test", "Vocal range test"];
  const withRange = (ageDays: number, notes?: Record<string, { sec: number; hitSec: number; cents: number; frames: number }>): ProgressState => {
    const base = state();
    return {
      ...base,
      range: { lowMidi: 45, highMidi: 69, testedAt: new Date(NOW.getTime() - ageDays * DAY).toISOString() },
      sessions: notes ? base.sessions.map((s) => ({ ...s, notes })) : base.sessions,
    };
  };

  it("leaves the range test and the octave siren out during Recovery week", () => {
    const stale = buildPlan(withRange(49), NOW, null, null, RECOVERY);
    for (const i of stale.items) expect(RANGE_TESTS).not.toContain(i.title);
    expect(stale.rangeNote).toContain("leave the range test");
    expect(stale.rangeNote).toBe(`Your range was last measured 49 days ago. ${LINE}`);
    expect(stale.items.length).toBeGreaterThanOrEqual(3);
    // Outside the week the same singer is asked to retake it.
    expect(buildPlan(withRange(49), NOW).items[0].title).toBe("Retake the range test");

    // F#4 within five semitones of the top of a 24-semitone A2–A4 range.
    const top = withRange(0, { "66": { sec: 5, hitSec: 2, cents: 35, frames: 100 } });
    expect(buildPlan(top, NOW).items[0].id).toBe("octave-siren");
    const gentle = buildPlan(top, NOW, null, null, RECOVERY);
    const siren = gentle.items.find((i) => i.reason.includes("weakest note"));
    expect(siren?.id).toBe("ng-siren-fifth");
    expect(siren?.title).toBe("Ng siren to the fifth");
    for (const i of gentle.items) expect(i.id).not.toBe("octave-siren");
    // A current range needs no note.
    expect(gentle.rangeNote).toBeNull();
  });

  it("does not ask a singer with no saved range to measure one until the week is over", () => {
    const plan = buildPlan(state(), NOW, null, null, RECOVERY);
    for (const i of plan.items) expect(RANGE_TESTS).not.toContain(i.title);
    expect(plan.rangeNote).toBe(`You haven't measured your range yet. ${LINE}`);
    expect(plan.items.length).toBeGreaterThanOrEqual(3);
  });

  it("says it in the same words as the /range pitch meter", () => {
    // Both rooms build the note in components/practice/program-range-note.ts,
    // so the meter never offers the test the coach says to leave.
    for (const s of [withRange(49), state()]) {
      const note = buildPlan(s, NOW, null, null, RECOVERY).rangeNote;
      expect(note).not.toBeNull();
      expect(note).toBe(recoveryRangeNote(s.range, RECOVERY, NOW.getTime()));
    }
    // A current range needs no note in either.
    expect(recoveryRangeNote(withRange(0).range, RECOVERY, NOW.getTime())).toBeNull();
  });

  it("keeps the rest-day line on the week's rest day", () => {
    const plan = buildPlan(withRange(49), NOW, RECOVERY, null, RECOVERY);
    expect(plan.banner).toBeNull();
    expect(plan.restNote).toBe(
      `Today is a rest day in ${RECOVERY}, and the program counts it as done. Nothing below is required. Your streak counts only days you practice, so if you rest today it starts again from 1 at your next session.`,
    );
    expect(plan.rangeNote).toBe(`Your range was last measured 49 days ago. ${LINE}`);
  });

  it("says so on the card, and offers only the studio once the free minutes are used", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    capState.capped = true;
    const html = renderToStaticMarkup(<CoachCard state={withRange(49)} recovering={RECOVERY} />);
    expect(html).toContain("leave the range test until the week is over");
    expect(html).not.toContain("Retake the range test");
    expect(html).not.toContain('href="/range?mode=range#start"');
    expect(html).toMatch(/The <a [^>]*href="\/studio"[^>]*>pitch studio<\/a> is open now\.<\/p>/);
    // Outside the week the range test is still open now.
    expect(renderToStaticMarkup(<CoachCard state={withRange(49)} />)).toContain('href="/range?mode=range#start"');
  });

  it("does not name the range test in the free plan's footnote during the week", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    capState.capped = false;
    const html = renderToStaticMarkup(<CoachCard state={withRange(0)} recovering={RECOVERY} />).replace(/<!-- -->/g, "");
    expect(html).toContain("guided minutes a day; the pitch studio has no clock.");
    expect(html).not.toContain("the range test");
    expect(html).not.toContain('href="/range?mode=range#start"');
    // Outside the week it still says the range test has no clock.
    expect(renderToStaticMarkup(<CoachCard state={withRange(0)} />).replace(/<!-- -->/g, "")).toContain(
      "guided minutes a day; the range test and the pitch studio have no clock.",
    );
  });

  it("opens the week's box breathing, not a breath set that ends on the sustain test", () => {
    // The breath room leads with a set, and every set ends on the sustain
    // test; Recovery week breathes in single drills and takes no sustain test.
    const breathing = (s: ProgressState, recovering: string | null = RECOVERY) =>
      buildPlan(s, NOW, null, null, recovering).items.find((i) => i.title === "Breathing")!;
    const quiet = breathing(withRange(0));
    expect(quiet.href).toBe("/breath?drill=box&side=4&minutes=1");
    expect(quiet.reason).toBe(
      `Box breathing, which opens each practice day of ${RECOVERY}: no held note to time, and no sustain test while the voice is tired.`,
    );
    // A free singer sees two steps; with no weak note and no range test the
    // breathing step leads.
    expect(buildPlan(withRange(0), NOW, null, null, RECOVERY).items[0].title).toBe("Breathing");
    // After a heavy day, the week's longer square ("Breath and hums").
    const heavy = withRange(0);
    heavy.sessions = [
      { id: "heavy", type: "warmup", date: "2026-10-13T18:00:00.000Z", day: "2026-10-13", durationSec: 1800, score: 80, detail: "Morning hum", xp: 10 },
      ...heavy.sessions,
    ];
    const tired = breathing(heavy);
    expect(tired.href).toBe("/breath?drill=box&side=4&minutes=3");
    expect(tired.reason).toMatch(/^Yesterday was a heavy one \(35 min\)/);
    // The step states the drill's own length, as the week's row does: the
    // minute's square (64 s), or the three-minute one (192 s).
    expect(quiet.minutes).toBe(1);
    expect(tired.minutes).toBe(3);
    // Outside the week the step opens the breath room as before.
    expect(breathing(withRange(0), null).href).toBe("/breath");
    expect(breathing(withRange(0), null).reason).toBe("Low, steady breaths set up the rest of the session.");
    expect(breathing(heavy, null).href).toBe("/breath");
    expect(breathing(withRange(0), null).minutes).toBe(2);
    expect(breathing(heavy, null).minutes).toBe(4);
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
    // Ng siren to the fifth's glides from 52 to 57 span B3–E4, through C4.
    expect(weak?.id).toBe("ng-siren-fifth");
    expect(weak?.reason).toContain("Ladder through it slowly.");
    const songs = items.find((i) => i.title === "Sing a song");
    expect(songs?.reason).toBe(
      "Finish on real music: you're within 50 cents of the target 40% of the scored time lately, and songs are where that shows.",
    );
    for (const i of items) expect(i.reason, i.title).not.toMatch(/in tune/i);
  });

  // C3–F#4, a span of 18: the fifth's ladder runs E3–F#3, so its glides peak
  // on C#4 and never sing E4. The plan must not tell the singer to ladder
  // through a note the exercise it opens never reaches.
  const narrow = (midi: number): ProgressState => {
    const base = tallied();
    return {
      ...base,
      range: { lowMidi: 48, highMidi: 66, testedAt: NOW.toISOString() },
      sessions: base.sessions.map((s) => ({ ...s, notes: { [String(midi)]: { sec: 5, hitSec: 2, cents: 35, frames: 100 } } })),
    };
  };

  it("does not promise a ladder through a weak note the siren never reaches", () => {
    const weak = buildPlan(narrow(64), NOW).items.find((i) => i.reason.includes("weakest note"));
    expect(weak?.id).toBe("ng-siren-fifth");
    expect(weak?.reason).toContain("its glides stop short of E4");
    expect(weak?.reason).not.toContain("Ladder through it slowly");
    // Below the ladder's lowest glide, it says the glides stay above it.
    const low = buildPlan(narrow(49), NOW).items.find((i) => i.reason.includes("weakest note"));
    expect(low?.reason).toContain("its glides stay above C#3");
    expect(low?.reason).not.toContain("Ladder through it slowly");
    // A note the glides do sing keeps the instruction.
    const mid = buildPlan(narrow(58), NOW).items.find((i) => i.reason.includes("weakest note"));
    expect(mid?.reason).toContain("Ladder through it slowly.");
  });

  it("names no weak note when every note lands at the two-star floor or better", () => {
    // Every note at 100% but A3 at 97%: the quietest note of a strong
    // fortnight is not a weakness, and the plan must not open with six
    // minutes of sirens for it.
    const strong = (): ProgressState => {
      const base = tallied();
      return {
        ...base,
        sessions: base.sessions.map((s) => ({
          ...s,
          notes: {
            "52": { sec: 5, hitSec: 5, cents: 6, frames: 100 },
            "57": { sec: 100, hitSec: 97, cents: 8, frames: 2000 },
            "60": { sec: 5, hitSec: 5, cents: 5, frames: 100 },
          },
        })),
      };
    };
    const items = buildPlan(strong(), NOW).items;
    for (const i of items) expect(i.reason, i.title).not.toMatch(/weakest note/);
    const warmups = items.find((i) => i.title === "Warmups");
    expect(warmups?.reason).toBe(
      "No stand-out weak note in the last two weeks, so a general ladder keeps the whole range honest.",
    );
    // A note under the floor is still named, alone.
    const shaky = buildPlan(
      {
        ...strong(),
        sessions: strong().sessions.map((s) => ({
          ...s,
          notes: { ...s.notes, "64": { sec: 5, hitSec: 3.5, cents: 30, frames: 100 } },
        })),
      },
      NOW,
    ).items.find((i) => i.reason.includes("weakest note"));
    expect(shaky?.reason).toMatch(/^E4 is your weakest note right now: E4 lands within 50 cents of the target just 70% of the time/);
  });

  it("says a weak note outside the measured range is outside it, not that the siren keeps clear", () => {
    // Sung above F#4 (a song's top note, say): no fitted ladder goes there.
    const high = buildPlan(narrow(68), NOW).items.find((i) => i.reason.includes("weakest note"));
    expect(high?.reason).toContain(
      "G#4 is above the top of your measured range (F#4), so this siren's glides stop short of it: let them carry you toward it lightly rather than pushing up to reach it.",
    );
    expect(high?.reason).not.toContain("keeps clear");
    const low = buildPlan(narrow(46), NOW).items.find((i) => i.reason.includes("weakest note"));
    expect(low?.reason).toContain("A#2 is below the bottom of your measured range (C3), so this siren's glides stay above it");
    // In a span of 11 the fifth's glides run right up to the measured top, so
    // only a note above the range is out of their reach.
    const tight = (midi: number): ProgressState => ({
      ...narrow(midi),
      range: { lowMidi: 48, highMidi: 59, testedAt: NOW.toISOString() },
    });
    expect(buildPlan(tight(59), NOW).items.find((i) => i.reason.includes("weakest note"))?.reason).toContain(
      "Ladder through it slowly.",
    );
    expect(buildPlan(tight(60), NOW).items.find((i) => i.reason.includes("weakest note"))?.reason).toContain(
      "C4 is above the top of your measured range (B3)",
    );
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
