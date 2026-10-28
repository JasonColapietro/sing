import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FreeCap } from "@/lib/free-cap";

const cap = vi.hoisted(() => ({
  current: { isPro: false, usedSec: 0, leftSec: 300, capped: false, capSec: 300 } as FreeCap,
}));

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

import EarTrainingClient from "@/components/ear/ear-training-client";
import { BreathStudio } from "@/components/breath/breath-studio";
import { paintedFor } from "@/components/prepaint.testing";
import { CAPPED_REASON, useCappedStart } from "./use-capped-start";

const CAPPED: FreeCap = { isPro: false, usedSec: 300, leftSec: 0, capped: true, capSec: 300 };
const OPEN: FreeCap = { isPro: false, usedSec: 0, leftSec: 300, capped: false, capSec: 300 };

beforeEach(() => {
  cap.current = OPEN;
  hydration.done = true;
});

describe("useCappedStart", () => {
  function Probe({ cap, fn }: { cap: FreeCap; fn: () => void }) {
    const { guard, reason } = useCappedStart(cap);
    guard(fn)();
    return <p>{reason ?? "open"}</p>;
  }

  it("runs the start while the allowance is open and gives no reason", () => {
    const fn = vi.fn();
    expect(renderToStaticMarkup(<Probe cap={OPEN} fn={fn} />)).toContain("open");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("scrolls to the wall instead of starting once the minutes are used, and names why", () => {
    const fn = vi.fn();
    const scrollIntoView = vi.fn();
    vi.stubGlobal("document", { getElementById: (id: string) => (id === "free-cap" ? { scrollIntoView } : null) });
    try {
      expect(renderToStaticMarkup(<Probe cap={CAPPED} fn={fn} />)).toContain(CAPPED_REASON);
    } finally {
      vi.unstubAllGlobals();
    }
    expect(fn).not.toHaveBeenCalled();
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
  });
});

// The two rooms whose cap controls are the shared hook end to end; the
// warmups room keeps its own test for its gate card and daily picks.
describe.each([
  ["ear training", () => <EarTrainingClient />, "Start routine"],
  ["breath", () => <BreathStudio />, "Start routine"],
])("the %s room once the free minutes are used", (_room, room, openLabel) => {
  it("shows the wall and a disabled, explained start instead of a dead button", () => {
    cap.current = CAPPED;
    const html = renderToStaticMarkup(room());
    expect(html).toContain('id="free-cap"');
    expect(html).toContain("Available tomorrow");
    expect(html).not.toContain(`>${openLabel}<`);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Available tomorrow<\/button>/);
    expect(html).toContain(CAPPED_REASON);
  });

  it("keeps the start live while the allowance is open", () => {
    const html = renderToStaticMarkup(room());
    expect(html).not.toContain('id="free-cap"');
    expect(html).toContain(`>${openLabel}<`);
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
