import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// SessionShell is a portal and renders nothing on the server, so the screen's
// contents are rendered in place here.
vi.mock("./session-shell", () => ({
  SESSION_FOCUS: "",
  SessionShell: ({ children, bottom }: { children: ReactNode; bottom?: ReactNode }) => (
    <div>
      {children}
      {bottom}
    </div>
  ),
}));

import { ResultsScreen, starsForScore } from "./results-screen";

function render(score: number) {
  return renderToStaticMarkup(
    <ResultsScreen
      title="Daily warmup"
      score={score}
      stars={starsForScore(score)}
      xp={40}
      streakDays={3}
      goal={{ doneSec: 300, goalSec: 600 }}
      onContinue={() => {}}
      share={{ title: "Daily warmup" }}
    />,
  );
}

/**
 * One end screen, one star count. The share card under a practice room's
 * results used the songbook's five-star scale, so a 72 showed one star at the
 * top of the screen and "★★★★☆ (4/5)" on the card below it.
 */
describe("practice results share card", () => {
  it("rates the run on the same three-star scale as the row above it", () => {
    const html = render(72);
    expect(starsForScore(72)).toBe(1);
    expect(html).toContain('aria-label="1 of 3 stars"');
    expect(html).toContain("★☆☆");
    expect(html).toContain(">1 of 3 stars<");
    expect(html).not.toContain("of 5 stars");
    expect(html).not.toContain("★★★★☆");
  });

  it("gives no stars on the card when the row above gives none", () => {
    const html = render(40);
    expect(html).toContain('aria-label="0 of 3 stars"');
    expect(html).toContain("☆☆☆");
    expect(html).not.toContain("of 5 stars");
  });
});
