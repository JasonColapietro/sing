import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FreeCap } from "@/lib/free-cap";
import { DEFAULT_PROGRESS, type ProgressState } from "@/lib/progress-shape";
import { localDay } from "@/lib/progress";

const cap = vi.hoisted(() => ({
  current: { isPro: false, usedSec: 0, leftSec: 300, capped: false, capSec: 300 } as FreeCap,
}));

// The stored log unless a test sets one.
const stored = vi.hoisted(() => ({ progress: null as ProgressState | null }));
vi.mock("@/lib/progress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/progress")>();
  return { ...actual, useProgress: () => stored.progress ?? actual.useProgress() };
});

vi.mock("@/lib/free-cap", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/free-cap")>(),
  useFreeCap: () => cap.current,
}));

// The room as it renders once hydrated, unless a test asks for the server
// HTML, where every state's version of the cap-dependent parts is present
// behind a pre-paint marker (components/prepaint.tsx).
const hydration = vi.hoisted(() => ({ done: true }));
vi.mock("@/components/prepaint", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/components/prepaint")>(),
  useHydrated: () => hydration.done,
}));

import { BreathStudio } from "./breath-studio";
import { paintedFor } from "@/components/prepaint.testing";

const CAPPED: FreeCap = { isPro: false, usedSec: 300, leftSec: 0, capped: true, capSec: 300 };
const OPEN: FreeCap = { isPro: false, usedSec: 0, leftSec: 300, capped: false, capSec: 300 };

beforeEach(() => {
  cap.current = OPEN;
  hydration.done = true;
  stored.progress = null;
});

/** A singer with a breath set logged today, so the room's card is a second set. */
function breathPracticedToday(): ProgressState {
  const day = localDay();
  return {
    ...DEFAULT_PROGRESS,
    sessions: [
      { id: "b1", type: "breath", date: `${day}T09:00:00.000Z`, day, durationSec: 300, score: 80, detail: "Quick breath", xp: 20 },
    ],
  };
}

describe("the breath room's card for a singer who practiced breath today", () => {
  it("offers a second set while the allowance is open", () => {
    stored.progress = breathPracticedToday();
    const html = renderToStaticMarkup(<BreathStudio />);
    expect(html).toContain("Back for more");
    expect(html).toContain("second set today");
    expect(html).toContain(">Top up<");
  });

  it("offers no second set at the cap, where the button says Available tomorrow", () => {
    // The same rule as /warmups and /ear-training: no return greeting and no
    // second set over a start that cannot start.
    stored.progress = breathPracticedToday();
    cap.current = CAPPED;
    const html = renderToStaticMarkup(<BreathStudio />);
    expect(html).toContain("Available tomorrow");
    expect(html).not.toContain("second set today");
    expect(html).not.toContain("Back for more");
    expect(html).not.toContain(">Top up<");
    expect(html).toContain("Start here");
    expect(html).toContain("breath work done today");
  });

  it("still says no breath work yet to a capped singer who has not done any", () => {
    // Capped by another room's minutes: the card is a newcomer's, waiting for tomorrow.
    cap.current = CAPPED;
    const html = renderToStaticMarkup(<BreathStudio />);
    expect(html).toContain("no breath work yet today");
    expect(html).not.toContain("breath work done today");
  });
});

describe.each([["breath", () => <BreathStudio />, "Start breathing"]])("the %s room once the free minutes are used", (_room, room, openLabel) => {
  it("shows the wall and a disabled, explained start instead of a dead button", () => {
    cap.current = CAPPED;
    const html = renderToStaticMarkup(room());
    expect(html).toContain('id="free-cap"');
    expect(html).toContain("Available tomorrow");
    expect(html).not.toContain(`>${openLabel}<`);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Available tomorrow<\/button>/);
    expect(html).toContain("Free practice is used for today.");
  });

  it("keeps the start live while the allowance is open", () => {
    const html = renderToStaticMarkup(room());
    expect(html).not.toContain('id="free-cap"');
    expect(html).toContain(openLabel);
    expect(html).not.toContain("Available tomorrow");
  });

  it("paints the wall from the server HTML for a capped singer, and only for one", () => {
    // The prerender has the newcomer's empty log, so the room is uncapped
    // there; the pre-paint state picks the wall or the allowance line before
    // the first paint, so neither one pushes the room down at hydration.
    hydration.done = false;
    const html = renderToStaticMarkup(room());
    const capped = paintedFor(html, { plan: "capped" });
    expect(capped).toContain('id="free-cap"');
    expect(capped).not.toContain("Free guided practice today");
    const free = paintedFor(html, { plan: "free" });
    expect(free).not.toContain('id="free-cap"');
    expect(free).toContain("Free guided practice today");
    const pro = paintedFor(html, { plan: "pro" });
    expect(pro).not.toContain('id="free-cap"');
    expect(pro).not.toContain("Free guided practice today");
    // The wall comes first, ahead of the room's own start card.
    expect(capped.indexOf('id="free-cap"')).toBeLessThan(capped.indexOf(openLabel));
  });
});
