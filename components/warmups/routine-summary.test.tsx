import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROGRESS, type ProgressState } from "@/lib/progress-shape";
import { localDay } from "@/lib/progress";
import { EXERCISES } from "./exercises";
import { routineById } from "./routines";
import type { SessionSummaryData } from "./lib";
import type { RoutineSummaryData } from "./routine-runner";

const stored = vi.hoisted(() => ({ progress: null as ProgressState | null }));

vi.mock("@/lib/pro", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/pro")>(),
  useIsPro: () => false,
}));

vi.mock("@/lib/progress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/progress")>();
  return {
    ...actual,
    useProgress: () => stored.progress ?? actual.useProgress(),
  };
});

// The real results screen portals into document.body, which a server render
// has not got; this stand-in prints what the summary hands it.
vi.mock("@/components/practice/results-screen", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/practice/results-screen")>();
  return {
    ...actual,
    ResultsScreen: (props: {
      streakDays: number;
      onAgain?: () => void;
      onPractice?: () => void;
      children?: ReactNode;
    }) => (
      <div>
        <span data-streak={props.streakDays} />
        <button type="button">Continue</button>
        {props.onAgain && <button type="button">Play again</button>}
        {props.onPractice && <button type="button">Practice</button>}
        {props.children}
      </div>
    ),
  };
});

import { RoutineSummary, routineSummaryRows } from "./routine-summary";

const noop = () => {};
const routine = routineById("quick")!;

function sung(exerciseId: string, avgScore: number): SessionSummaryData {
  const ex = EXERCISES.find((e) => e.id === exerciseId)!;
  const rep = { root: 50, score: avgScore, avgCentsErr: 12, skipped: false };
  return { ex, results: [rep], avgScore, best: rep, xpGained: 20, newAchievements: [], mode: "sing-along" };
}

function render(data: RoutineSummaryData, capped?: boolean): string {
  return renderToStaticMarkup(
    <RoutineSummary data={data} onRepeat={noop} onHome={noop} onPractice={noop} capped={capped} />,
  );
}

const allSung: RoutineSummaryData = {
  routine,
  steps: routine.steps.map((s, i) => sung(s.exerciseId, 60 + i * 5)),
  completed: true,
};

beforeEach(() => {
  stored.progress = null;
});

describe("the routine summary", () => {
  it("offers another run and the weakest step while free practice is left", () => {
    const html = render(allSung);
    expect(html).toContain("Play again");
    expect(html).toContain("Practice");
    expect(html).not.toContain("free minutes of guided practice");
  });

  it("never offers a start that does nothing once the free minutes are used", () => {
    const html = render(allSung, true);
    expect(html).not.toContain("Play again");
    expect(html).not.toMatch(/>Practice</);
    expect(html).toContain("Continue");
    expect(html).toContain("That&#x27;s today&#x27;s 5 free minutes of guided practice.");
    expect(html).toContain("opens at midnight");
    // The way out names the limit just reached, as ear and breath's notes do.
    expect(html).toMatch(/<a[^>]*href="\/pro#buy"[^>]*>Pro has no daily limit<\/a>/);
  });

  it("shows no lapsed streak as alive when nothing was logged", () => {
    stored.progress = { ...DEFAULT_PROGRESS, streak: { current: 12, best: 12, lastDay: "2020-01-01" } };
    const skipped: RoutineSummaryData = { routine, steps: routine.steps.map(() => null), completed: false };
    const html = render(skipped);
    expect(html).toContain('data-streak="0"');
  });

  it("keeps a streak that is live today", () => {
    stored.progress = { ...DEFAULT_PROGRESS, streak: { current: 4, best: 6, lastDay: localDay() } };
    const html = render(allSung);
    expect(html).toContain('data-streak="4"');
  });

  it("says why nothing scored, and what to try, when every step closed unsung", () => {
    const silent: RoutineSummaryData = { routine, steps: routine.steps.map(() => null), completed: true };
    const html = render(silent);
    expect(html).toContain("Nothing was scored this run. If you were singing, the mic didn&#x27;t pick up a clear note");
    expect(html).toContain("then press Play again.");
    expect(html).toContain("Play again");
    // Not on a run that scored, and not once Play again is gone at the cap.
    expect(render(allSung)).not.toContain("Nothing was scored this run");
    expect(render(silent, true)).not.toContain("Nothing was scored this run");
  });
});

describe("a run that warmed in before a later step", () => {
  // Quick from step 3 on a cold day: a few reps of step 1's exercise, then 3 on.
  const first = routine.steps[0].exerciseId;
  const third = routine.steps[2].exerciseId;
  const steps = [sung(first, 70), null, sung(third, 64), ...routine.steps.slice(3).map((s) => sung(s.exerciseId, 66))];

  it("names the warm-in row, and leaves the step it skipped past out of this run", () => {
    const rows = routineSummaryRows({ routine, steps, completed: true, startStep: 2, warmIn: true });
    expect(rows[0]).toMatchObject({ label: `Warm-in: ${EXERCISES.find((e) => e.id === first)!.title}`, score: 70 });
    expect(rows[1]).toMatchObject({ score: null, note: "not in this run" });
    expect(rows[2]).toMatchObject({ score: 64 });
  });

  it("keeps the plain title when there was no warm-in, or it was skipped", () => {
    const title = EXERCISES.find((e) => e.id === first)!.title;
    expect(routineSummaryRows(allSung)[0].label).toBe(title);
    const skippedWarmIn = routineSummaryRows({ routine, steps: [null, ...steps.slice(1)], completed: true, startStep: 2, warmIn: true });
    expect(skippedWarmIn[0]).toMatchObject({ label: title, score: null, note: "not in this run" });
  });
});
