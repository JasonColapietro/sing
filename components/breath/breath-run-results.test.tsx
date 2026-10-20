import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// SessionShell is a portal and renders nothing on the server, so the screen's
// contents are rendered in place here.
vi.mock("@/components/practice/session-shell", () => ({
  SESSION_FOCUS: "",
  SessionButton: ({ children }: { children: ReactNode }) => <button type="button">{children}</button>,
  SessionShell: ({ children, bottom }: { children: ReactNode; bottom?: ReactNode }) => (
    <div>
      {children}
      {bottom}
    </div>
  ),
}));

import type { LogResult } from "@/lib/progress";
import { withStepResult } from "@/components/practice/step-results";
import { BreathRunResults, breathStepDone, shortSustainHold } from "./breath-runner";
import { breathRoutineById, type BreathDrillResult } from "./routines";

const quick = breathRoutineById("quick")!;
const box: BreathDrillResult = {
  durationSec: 60,
  score: null,
  logged: null,
  label: "1 min",
};

function render(capped: boolean) {
  return renderToStaticMarkup(
    <BreathRunResults
      routine={quick}
      // The free minutes ran out after box breathing: the rest never ran.
      results={[box]}
      firstStep={0}
      capped={capped}
      onContinue={() => {}}
      onAgain={() => {}}
    />,
  );
}

describe("a breath set the free minutes stopped", () => {
  it("offers no Play again, which could only reopen the cap slide, and says why the set stopped", () => {
    const html = render(true);
    expect(html).not.toContain("Play again");
    expect(html).toContain("free minutes of guided practice");
    expect(html).toMatch(/<a[^>]*href="\/pro#buy"[^>]*>Pro has no daily limit<\/a>/);
  });

  it("keeps Play again, and no cap note, while the allowance is open", () => {
    const html = render(false);
    expect(html).toContain("Play again");
    expect(html).not.toContain("Pro has no daily limit");
  });
});

const logged = (xpGained: number): LogResult => ({ xpGained, newAchievements: [], state: {} as LogResult["state"] });
const farinelli: BreathDrillResult = { durationSec: 90, score: null, logged: logged(40), label: "1:30 · top count 8" };
const boxLogged: BreathDrillResult = { ...box, logged: logged(46) };
const sustain = (best: number, xp: number | null): BreathDrillResult => ({
  durationSec: best,
  score: 92,
  logged: xp === null ? null : logged(xp),
  label: `${best.toFixed(1)} s`,
  best,
});

function renderRun(results: (BreathDrillResult | null)[], opts: { firstStep?: number; capStoppedAt?: number | null; capped?: boolean } = {}) {
  return renderToStaticMarkup(
    <BreathRunResults
      routine={quick}
      results={results}
      firstStep={opts.firstStep ?? 0}
      capStoppedAt={opts.capStoppedAt}
      capped={opts.capped ?? false}
      onContinue={() => {}}
      onAgain={() => {}}
    />,
  ).replace(/<!-- -->/g, "");
}

describe("a breath set resumed at a later step", () => {
  it("reaches its results after two steps, with no hole read as a step", () => {
    // /breath?routine=quick&step=2: Farinelli then the sustain, written at 1 and 2.
    let results: (BreathDrillResult | null)[] = [];
    results = withStepResult(results, 1, farinelli, quick.steps.length);
    results = withStepResult(results, 2, sustain(12, 30), quick.steps.length);
    const html = renderRun(results, { firstStep: 1 });
    expect(html).toContain("Steps 2–3 done");
    expect(html).toContain("Not in this run");
    expect(html).toContain("+70");
  });

  it("survives the holey shape the old copy-and-assign produced", () => {
    const holey = [undefined, farinelli, sustain(12, 30)] as unknown as (BreathDrillResult | null)[];
    expect(() => renderRun(holey, { firstStep: 1 })).not.toThrow();
  });
});

describe("a sustain held under the five seconds that are logged", () => {
  it("still counts as a step done, so a set that ran every step is complete", () => {
    const step = quick.steps[2];
    expect(breathStepDone(step, sustain(4.4, null))).toBe(true);
    expect(breathStepDone(step, { ...sustain(0.6, null), best: 0.6 })).toBe(false);
    expect(breathStepDone(step, null)).toBe(false);
    // The guided drills still count only once they ran long enough to log.
    expect(breathStepDone(quick.steps[0], box)).toBe(false);
    expect(breathStepDone(quick.steps[0], boxLogged)).toBe(true);
    const html = renderRun([boxLogged, farinelli, sustain(4.4, null)]);
    expect(html).toContain("Routine complete");
    expect(html).not.toContain("2 of 3 steps");
  });

  it("says why the sustain earned no XP", () => {
    expect(shortSustainHold(quick, [boxLogged, farinelli, sustain(4.4, null)])).toBe(4.4);
    expect(shortSustainHold(quick, [boxLogged, farinelli, sustain(7, 20)])).toBeNull();
    const html = renderRun([boxLogged, farinelli, sustain(4.4, null)]);
    expect(html).toContain("Your longest sustain hold was 4.4 s. It counts as done, but only holds of 5 seconds or more are logged for XP and today&#x27;s minutes.");
    const full = renderRun([boxLogged, farinelli, sustain(7, 20)]);
    expect(full).not.toContain("longest sustain hold");
    // Nothing to say leaves no empty spaced block under the rows.
    expect(full).not.toContain('<div class="mt-6"></div>');
  });
});

describe("a breath set the cap stopped between steps", () => {
  it("marks the steps it never reached, and says so above them", () => {
    const html = renderRun([boxLogged], { capStoppedAt: 1, capped: true });
    expect(html.match(/Not reached/g)).toHaveLength(2);
    expect(html).not.toContain(">Skipped<");
    expect(html).toContain("ran out before the last 2 steps of this run.");
    // Above the step rows, so a phone shows the reason before the rows.
    expect(html.indexOf("ran out before")).toBeLessThan(html.indexOf("Step by step"));
  });

  it("keeps a step skipped by hand as skipped", () => {
    const html = renderRun([boxLogged, null], { capStoppedAt: 2, capped: true });
    expect(html).toContain(">Skipped<");
    expect(html.match(/Not reached/g)).toHaveLength(1);
    expect(html).toContain("ran out before the last step of this run.");
  });
});
