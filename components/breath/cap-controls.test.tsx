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

import { BreathStudio } from "./breath-studio";
import { paintedFor } from "@/components/prepaint.testing";

const CAPPED: FreeCap = { isPro: false, usedSec: 300, leftSec: 0, capped: true, capSec: 300 };
const OPEN: FreeCap = { isPro: false, usedSec: 0, leftSec: 300, capped: false, capSec: 300 };

beforeEach(() => {
  cap.current = OPEN;
  hydration.done = true;
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
