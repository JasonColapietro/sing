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

import { BreathRunResults } from "./breath-runner";
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
