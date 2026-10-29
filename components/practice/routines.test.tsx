import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// SessionShell is a portal and renders nothing on the server: render it in
// place, with its close label, so the labels can be read.
vi.mock("@/components/practice/session-shell", () => ({
  SESSION_FOCUS: "",
  SessionShell: ({ children, bottom, closeLabel }: { children: ReactNode; bottom?: ReactNode; closeLabel?: string }) => (
    <div data-close={closeLabel}>
      {children}
      {bottom}
    </div>
  ),
}));

import { findRoutine, recommendQuickOrDaily, routineMinutesOf, routineTotalSeconds } from "./routines";
import { ROUTINE_LABELS, RoutineStepContext, StepIntroSlide, useStepCloseLabel } from "./step-intro";
import { breathPrevChip } from "@/components/breath/breath-runner";
import { breathRoutineById } from "@/components/breath/routines";
import { revealInFolds } from "@/components/warmups/warmups-client";

const CATALOG = [
  { id: "quick", steps: [10, 20] },
  { id: "daily", steps: [30, 40, 50] },
];

describe("the shared routine helpers", () => {
  it("finds by id and is null for a missing one", () => {
    expect(findRoutine(CATALOG, "daily")?.id).toBe("daily");
    expect(findRoutine(CATALOG, "nope")).toBeNull();
    expect(findRoutine(CATALOG, null)).toBeNull();
  });

  it("adds each step's seconds and its intro hold", () => {
    expect(routineTotalSeconds(CATALOG[0], (s) => s, 4)).toBe(38);
    expect(routineMinutesOf(10)).toBe(1);
    expect(routineMinutesOf(150)).toBe(3);
  });

  it("tops up with the quick routine after practice today, the daily one otherwise", () => {
    expect(recommendQuickOrDaily(CATALOG, { practicedToday: true }).id).toBe("quick");
    expect(recommendQuickOrDaily(CATALOG, { practicedToday: false }).id).toBe("daily");
  });
});

function CloseLabel({ alone }: { alone: string }) {
  return <span>{useStepCloseLabel(alone)}</span>;
}

describe("the X on a routine step", () => {
  it("reads Finish step inside a routine in every room, and the room's own exit alone", () => {
    for (const alone of ["Exit drill", "Exit game"]) {
      expect(renderToStaticMarkup(<CloseLabel alone={alone} />)).toContain(alone);
      expect(
        renderToStaticMarkup(
          <RoutineStepContext.Provider value>
            <CloseLabel alone={alone} />
          </RoutineStepContext.Provider>,
        ),
      ).toContain(ROUTINE_LABELS.finishStep);
    }
  });
});

describe("the step intro slide", () => {
  const slide = (prev?: { label: string; score: number | null; scoreLabel?: string } | null) =>
    renderToStaticMarkup(
      <StepIntroSlide
        routineName="Daily"
        stepIndex={1}
        stepCount={3}
        title="Lip trills"
        prev={prev}
        holdSec={4}
        onStart={() => {}}
        onSkip={() => {}}
        onQuit={() => {}}
      />,
    );

  it("names the step on a focusable heading, so a screen reader hears it on each slide", () => {
    const html = slide();
    expect(html).toContain('aria-label="Up next: Lip trills"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain(`data-close="${ROUTINE_LABELS.exit}"`);
  });

  it("shows an unscored step's own label, and skipped only when it did not run", () => {
    const daily = breathRoutineById("daily")!;
    const box = daily.steps[0];
    const ran = breathPrevChip(box, { durationSec: 180, score: null, logged: null, label: "3:00" });
    expect(slide(ran)).toContain("3:00");
    expect(slide(breathPrevChip(box, null))).toContain("skipped");
  });
});

describe("a link into the folded catalogue", () => {
  it("opens every closed fold around the target", () => {
    const outer = { tagName: "DETAILS", open: false, parentElement: null };
    const inner = { tagName: "DIV", parentElement: outer };
    const target = { tagName: "ARTICLE", parentElement: inner };
    expect(revealInFolds(target)).toBe(true);
    expect(outer.open).toBe(true);
    expect(revealInFolds(null)).toBe(false);
  });
});
