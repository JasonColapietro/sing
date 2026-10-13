import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// SessionShell is a portal and renders nothing on the server, so the slide's
// contents are rendered in place here.
vi.mock("@/components/practice/session-shell", () => ({
  SESSION_FOCUS: "",
  SessionShell: ({ children, bottom }: { children: ReactNode; bottom?: ReactNode }) => (
    <div>
      {children}
      {bottom}
    </div>
  ),
}));

import type { UsePitchResult } from "@/lib/audio/use-pitch";
import type { VocalRange } from "@/lib/progress";
import { RoutineRunner } from "./routine-runner";
import { SKIP_INTRO_SEC, STEP_INTRO_SEC, routineById } from "./routines";

/** Quick's third step is the N run, a twelfth. */
function slide(range: VocalRange): string {
  const html = renderToStaticMarkup(
    <RoutineRunner
      routine={routineById("quick")!}
      startStep={2}
      pitch={{} as UsePitchResult}
      range={range}
      onDone={() => {}}
      onQuit={() => {}}
    />,
  );
  // Adjacent text nodes may carry empty comment separators; read the text.
  return html.replace(/<!-- -->/g, "");
}

describe("the slide for a step the saved range cannot hold", () => {
  it("says why it is skipped, in place of the how-to, and offers only Next", () => {
    const html = slide({ lowMidi: 45, highMidi: 62 });
    expect(html).toContain("Skipping");
    expect(html).toContain("N run");
    expect(html).toContain("every rep would reach the highest note your range test found and start below the lowest");
    // The step is never sung: no tip, no rep count, no Start or Skip.
    expect(html).not.toContain("tongue on the roof of the mouth");
    expect(html).not.toContain("13 reps");
    expect(html).not.toContain("Start now");
    expect(html).not.toContain("</svg> Skip</button>");
    expect(html).toContain("</svg> Next</button>");
    expect(html).toContain(`Next step in ${SKIP_INTRO_SEC}<`);
  });

  it("is the usual intro when the range holds the run", () => {
    const html = slide({ lowMidi: 45, highMidi: 69 });
    expect(html).toContain("Up next");
    expect(html).toContain("13 reps");
    expect(html).toContain("Start now");
    expect(html).toContain("</svg> Skip</button>");
    expect(html).not.toContain("Skipping");
    expect(html).toContain(`Starting in ${STEP_INTRO_SEC}<`);
  });
});
