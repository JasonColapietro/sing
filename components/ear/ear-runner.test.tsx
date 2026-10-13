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

import { EarRunResults } from "./ear-runner";
import { EAR_ROUTINES } from "./routines";
import type { EarStepResult } from "./session";

const quick = EAR_ROUTINES.find((r) => r.id === "quick")!;
const played: EarStepResult = {
  score: 80,
  bestStreak: 5,
  results: Array(10).fill(true),
  xpGained: 20,
  newAchievements: [],
  newBest: false,
};

function render(capped: boolean) {
  return renderToStaticMarkup(
    <EarRunResults
      routine={quick}
      // The free minutes ran out after the first game: the rest never ran.
      results={[played]}
      capped={capped}
      onContinue={() => {}}
      onAgain={() => {}}
    />,
  );
}

describe("a workout the free minutes stopped", () => {
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
