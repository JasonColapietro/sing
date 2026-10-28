import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROGRESS, type ProgressState, type SessionLog } from "@/lib/progress-shape";
import { localDay } from "@/lib/progress";
import { songBySlug } from "./data";
import type { SessionSummaryData } from "./lib";

const state = vi.hoisted(() => ({ progress: null as ProgressState | null }));
vi.mock("@/lib/progress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/progress")>();
  return { ...actual, useProgress: () => state.progress ?? actual.useProgress() };
});
vi.mock("@/lib/pro", () => ({ useIsPro: () => false, useProReady: () => true }));

import { SessionSummary } from "./session-summary";

const song = songBySlug("amazing-grace-full")!;

function data(score: number | undefined): SessionSummaryData {
  return {
    song,
    mode: "rehearsal",
    pass: "guided",
    mastered: false,
    score,
    perLoopScores: score === undefined ? [] : [score],
    hardest: [],
    xpGained: 12,
    newAchievements: [],
    listenMode: score === undefined,
    maxCombo: 0,
    judgments: { perfect: 0, great: 0, good: 0, miss: 0 },
    sectionScores: [],
    transpose: 0,
    tempo: 1,
    loops: 1,
    points: 0,
    topMultiplier: 1,
  };
}

function log(n: number, detail: string, score: number): SessionLog {
  const day = localDay();
  return { id: `s${n}`, type: "song", date: `${day}T12:0${n}:00.000Z`, day, durationSec: 90, score, detail, xp: 10 };
}

const render = (d: SessionSummaryData) =>
  renderToStaticMarkup(<SessionSummary data={d} onAgain={() => {}} onLibrary={() => {}} />);

describe("the song summary", () => {
  beforeEach(() => {
    state.progress = null;
  });

  it("names the streak and the reason to come back tomorrow, like every other room", () => {
    state.progress = { ...DEFAULT_PROGRESS, streak: { current: 3, best: 3, lastDay: localDay() } };
    const html = render(data(undefined));
    expect(html).toContain("3-day streak");
    expect(html).toContain("Sing tomorrow to make it 4.");
  });

  it("names no streak once it has lapsed", () => {
    state.progress = { ...DEFAULT_PROGRESS, streak: { current: 5, best: 5, lastDay: "2020-01-01" } };
    const html = render(data(undefined));
    expect(html).not.toContain("-day streak");
    expect(html).not.toContain("Sing tomorrow");
  });

  it("compares a run with a best logged under the song's old title", () => {
    // Newest first: this run (70) was just logged under the current title;
    // the 88 was sung before the round-1 rename.
    state.progress = {
      ...DEFAULT_PROGRESS,
      sessions: [log(2, song.title, 70), log(1, "Amazing Grace (Verse 1 & 2)", 88)],
    };
    const html = render(data(70));
    expect(html).not.toContain("First time singing this one");
    expect(html).toContain("Personal best is 88");
  });
});

describe("a summary reached at the free cap", () => {
  it("demotes Sing again to an outline button that says why it cannot start", () => {
    // The filled violet button scrolled to a wall below the fold; a primary button that cannot do its job.
    const reason = "Free practice is used for today. It resets at midnight; the free studio is still open.";
    const html = renderToStaticMarkup(
      <SessionSummary data={data(70)} onAgain={() => {}} onLibrary={() => {}} againUnavailable={reason} />,
    );
    const again = html.match(/<button[^>]*>Sing again<\/button>/)![0];
    expect(again).toContain('aria-disabled="true"');
    expect(again).toMatch(/aria-describedby="([^"]+)"/);
    expect(again).not.toContain("bg-violet ");
    const id = again.match(/aria-describedby="([^"]+)"/)![1];
    expect(html).toContain(`<p id="${id}" class="w-full text-sm text-mut">${reason}</p>`);
    // Under the cap the button is the filled primary and nothing describes it.
    expect(render(data(70))).not.toContain('aria-disabled="true"');
  });
});

describe("an unscored song summary", () => {
  beforeEach(() => {
    state.progress = null;
  });

  const unscored = (pass: SessionSummaryData["pass"]): SessionSummaryData => ({ ...data(undefined), pass });

  it("carries the control its advice asks for while the mic is off", () => {
    const html = renderToStaticMarkup(
      <SessionSummary data={unscored("listen")} onAgain={() => {}} onLibrary={() => {}} onEnableMic={() => {}} />,
    );
    expect(html).toContain("with your microphone enabled to get scored");
    expect(html).toContain("Enable microphone and sing again");
  });

  it("shows why the mic failed under that control", () => {
    const html = renderToStaticMarkup(
      <SessionSummary
        data={unscored("listen")}
        onAgain={() => {}}
        onLibrary={() => {}}
        onEnableMic={() => {}}
        micError="Microphone access was blocked."
      />,
    );
    expect(html).toMatch(/Enable microphone and sing again.*role="alert"[^>]*>Microphone access was blocked\./);
  });

  it("offers no microphone control when the room has not passed one", () => {
    const html = render(unscored("listen"));
    expect(html).not.toContain("Enable microphone");
    expect(html).not.toContain('role="alert"');
  });

  it("does not call a Sing along run with the mic off a listen pass", () => {
    const html = render(unscored("guided"));
    expect(html).toContain("Sing along pass");
    expect(html).toContain("Your microphone was off, so there’s no pitch score this time.");
    expect(html).not.toContain("This was a listen pass");
  });
});

describe("a rehearsal stopped part-way through a loop", () => {
  beforeEach(() => {
    state.progress = null;
  });

  it("counts whole loops sung and says the last one is scored on the part sung", () => {
    const html = render({ ...data(96), perLoopScores: [96, 98, 95], partialLastLoop: true, loops: 3 });
    expect(html).toMatch(/Loops sung<\/div><div[^>]*>2<\/div>/);
    expect(html).toContain("loop 3");
    expect(html).toContain("You stopped part-way through loop 3, so it is scored on the part you sang.");
  });

  it("says nothing of the kind when every loop listed was whole", () => {
    const html = render({ ...data(96), perLoopScores: [96, 98] });
    expect(html).toMatch(/Loops sung<\/div><div[^>]*>2<\/div>/);
    expect(html).not.toContain("part-way");
  });
});
