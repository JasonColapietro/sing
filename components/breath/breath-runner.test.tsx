import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatClock, type FreeCap } from "@/lib/free-cap";

const cap = vi.hoisted(() => ({
  current: { isPro: false, usedSec: 0, leftSec: 300, capped: false, capSec: 300 } as FreeCap,
}));

vi.mock("@/lib/free-cap", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/free-cap")>(),
  useFreeCap: () => cap.current,
}));

// SessionShell is a portal and renders nothing on the server, so its slots are
// rendered in place here, the top bar's right slot marked.
vi.mock("@/components/practice/session-shell", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/components/practice/session-shell")>(),
  SessionShell: ({ children, topRight }: { children: ReactNode; topRight?: ReactNode }) => (
    <div>
      <div data-slot="top-right">{topRight}</div>
      {children}
    </div>
  ),
}));

import { EMPTY_FRAME, type UsePitchResult } from "@/lib/audio/use-pitch";
import { BreathRunner, breathIntroFreeLeft } from "./breath-runner";
import { breathRoutineById, breathRoutineSeconds } from "./routines";

const daily = breathRoutineById("daily")!;
const quick = breathRoutineById("quick")!;

const mic: UsePitchResult = {
  frame: EMPTY_FRAME,
  latest: { current: EMPTY_FRAME },
  listening: false,
  error: null,
  start: async () => true,
  stop: () => {},
  getStream: () => null,
  subscribe: () => () => {},
};

const FREE = (leftSec: number): FreeCap => ({
  isPro: false,
  usedSec: 300 - leftSec,
  leftSec,
  capped: leftSec <= 0,
  capSec: 300,
});
const PRO: FreeCap = { isPro: true, usedSec: 0, leftSec: Number.POSITIVE_INFINITY, capped: false, capSec: 300 };

/** The top bar's right slot on the first step's intro card. */
function topRight(routine = daily, startStep = 0): string {
  const html = renderToStaticMarkup(
    <BreathRunner routine={routine} startStep={startStep} pitch={mic} onExit={() => {}} />,
  );
  return html.match(/<div data-slot="top-right">(.*?)<\/div>/)?.[1] ?? "";
}

beforeEach(() => {
  cap.current = FREE(300);
});

describe("a breath set opened straight from a program row", () => {
  it("shows the free minutes left on the step's intro card when the set outlasts them", () => {
    cap.current = FREE(100);
    expect(topRight()).toContain("1:40 free left today");
  });

  it("shows it on a fresh day too when the set runs past the five free minutes", () => {
    // Daily breath alone is longer than the allowance, so the cap slide would
    // otherwise take its sustain test's place with no warning.
    expect(breathRoutineSeconds(daily)).toBeGreaterThan(300);
    expect(topRight()).toContain("5:00 free left today");
  });

  it("shows nothing on Pro", () => {
    cap.current = PRO;
    expect(topRight()).not.toContain("free left");
  });

  it("shows nothing while the free minutes cover the rest of the set", () => {
    expect(breathRoutineSeconds(quick)).toBeLessThanOrEqual(300);
    expect(topRight(quick)).not.toContain("free left");
  });
});

describe("breathIntroFreeLeft", () => {
  it("counts only the steps still ahead, so a set carried on from its sustain fits more often", () => {
    const sustainLeft = breathRoutineSeconds({ ...daily, steps: daily.steps.slice(3) });
    expect(breathIntroFreeLeft(daily, 3, { isPro: false, leftSec: sustainLeft })).toBeNull();
    expect(breathIntroFreeLeft(daily, 3, { isPro: false, leftSec: sustainLeft - 1 })).toBe(
      `${formatClock(sustainLeft - 1)} free left today`,
    );
    expect(breathIntroFreeLeft(daily, 0, { isPro: false, leftSec: sustainLeft })).not.toBeNull();
  });

  it("is null on Pro however much of the set is left", () => {
    expect(breathIntroFreeLeft(daily, 0, { isPro: true, leftSec: 0 })).toBeNull();
  });
});
