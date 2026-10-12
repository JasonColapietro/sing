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

import { BreathStudio } from "./breath-studio";

const CAPPED: FreeCap = { isPro: false, usedSec: 300, leftSec: 0, capped: true, capSec: 300 };
const OPEN: FreeCap = { isPro: false, usedSec: 0, leftSec: 300, capped: false, capSec: 300 };

beforeEach(() => {
  cap.current = OPEN;
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
});
