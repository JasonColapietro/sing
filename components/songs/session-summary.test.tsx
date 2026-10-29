import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROGRESS, type ProgressState, type SessionLog } from "@/lib/progress-shape";
import { localDay } from "@/lib/progress";
import { songBySlug } from "./data";
import type { SessionSummaryData } from "./lib";

const state = vi.hoisted(() => ({
  progress: null as ProgressState | null,
  /** What each render told the one-time Pro moment: is this a result? */
  proResult: [] as boolean[],
}));
vi.mock("@/lib/progress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/progress")>();
  return { ...actual, useProgress: () => state.progress ?? actual.useProgress() };
});
vi.mock("@/lib/pro", () => ({ useIsPro: () => false, useProReady: () => true }));
vi.mock("@/lib/use-pro-result-on-leave", () => ({
  useProResultOnLeave: (active: boolean) => {
    state.proResult.push(active);
  },
}));

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

  it("demotes Sing again on a silent mid-setlist run too", () => {
    const html = renderToStaticMarkup(
      <SessionSummary
        data={{ ...data(0), silent: true, xpGained: 0 }}
        onAgain={() => {}}
        onLibrary={() => {}}
        onNext={() => {}}
        nextInSetlist="Twinkle"
        againUnavailable="Free practice is used for today."
      />,
    );
    const again = html.match(/<button[^>]*>Sing again<\/button>/)![0];
    expect(again).toContain('aria-disabled="true"');
    expect(again).not.toContain("bg-violet ");
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

describe("a song run the mic heard nothing of", () => {
  beforeEach(() => {
    state.progress = null;
  });

  // What finalize hands over for a silent run: scored at 0, nothing logged.
  const silent = (): SessionSummaryData => ({
    ...data(0),
    silent: true,
    xpGained: 0,
    judgments: { perfect: 0, great: 0, good: 0, miss: 12 },
  });

  it("says no sound was picked up and offers the audio setup, instead of a grade", () => {
    const html = renderToStaticMarkup(
      <SessionSummary data={silent()} onAgain={() => {}} onLibrary={() => {}} listening level={0} />,
    );
    expect(html).toContain("Rehearsal complete");
    expect(html).toContain("No sound picked up");
    expect(html).toContain("Nothing was scored or logged.");
    // The audio setup (its summary reads "Audio"), open on the live level.
    expect(html).toMatch(/<details[^>]*>[\s\S]*Audio[\s\S]*aria-label="Microphone input level"/);
    expect(html).toContain("Sing again");
    for (const graded of ["Trickiest notes", "Grade", "Score", "Loops sung", "Per-loop score", "Judgment breakdown"]) {
      expect(html, graded).not.toContain(graded);
    }
  });

  it("names nothing as saved, since nothing was logged", () => {
    // A streak earned earlier today is still live, but this run added nothing to it.
    state.progress = { ...DEFAULT_PROGRESS, streak: { current: 3, best: 3, lastDay: localDay() } };
    const html = render(silent());
    expect(html).not.toContain("Saved to your progress");
    expect(html).not.toContain("+0 XP");
    expect(html).not.toContain("-day streak");
    expect(html).not.toContain("Personal best");
  });

  it("carries the control to turn off the mic it keeps open for the level", () => {
    const withMic = renderToStaticMarkup(
      <SessionSummary data={silent()} onAgain={() => {}} onLibrary={() => {}} listening level={0} onMicOff={() => {}} />,
    );
    expect(withMic).toContain("Turn off the mic");
    const micOff = renderToStaticMarkup(
      <SessionSummary data={silent()} onAgain={() => {}} onLibrary={() => {}} listening={false} onMicOff={() => {}} />,
    );
    expect(micOff).not.toContain("Turn off the mic");
    expect(micOff).not.toContain("Microphone input level");
    // A graded run never shows it.
    expect(
      renderToStaticMarkup(
        <SessionSummary data={data(40)} onAgain={() => {}} onLibrary={() => {}} listening onMicOff={() => {}} />,
      ),
    ).not.toContain("Turn off the mic");
  });

  it("keeps Sing again first in a setlist, since the next song would go the same way", () => {
    const html = renderToStaticMarkup(
      <SessionSummary data={silent()} onAgain={() => {}} onLibrary={() => {}} nextInSetlist="Silent Night" onNext={() => {}} />,
    );
    expect(html.indexOf("Sing again")).toBeGreaterThan(-1);
    expect(html.indexOf("Sing again")).toBeLessThan(html.indexOf("Next: Silent Night"));
    // The one filled button on the screen.
    expect(html).toMatch(/bg-violet-ink[^"]*">Sing again</);
    expect(html).not.toMatch(/bg-violet-ink[^"]*">Next: /);
    // A heard run moves the setlist on first, as before.
    const heard = renderToStaticMarkup(
      <SessionSummary data={data(40)} onAgain={() => {}} onLibrary={() => {}} nextInSetlist="Silent Night" onNext={() => {}} />,
    );
    expect(heard.indexOf("Next: Silent Night")).toBeLessThan(heard.indexOf("Sing again"));
  });

  it("is not a result for the one-time Pro moment", () => {
    state.proResult = [];
    render(silent());
    render(data(0));
    expect(state.proResult).toEqual([false, true]);
  });

  it("still grades a heard run that scored 0", () => {
    const html = render({ ...data(0), hardest: [{ index: 0, midi: 67, lyric: "Home", ratio: 0 }] });
    expect(html).not.toContain("No sound picked up");
    expect(html).toContain("Trickiest notes");
    expect(html).toContain("Grade");
    expect(html).toContain("Saved to your progress");
  });
});
