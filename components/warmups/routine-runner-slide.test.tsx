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
import { RoutineRunner, WARM_IN_MAX_REPS, warmInStep } from "./routine-runner";
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
    expect(html).not.toContain("</svg> Start</button>");
    expect(html).not.toContain("</svg> Skip</button>");
    expect(html).toContain("</svg> Next</button>");
    expect(html).toContain(`Next step in ${SKIP_INTRO_SEC}<`);
  });

  it("is the usual intro when the range holds the run", () => {
    const html = slide({ lowMidi: 45, highMidi: 69 });
    expect(html).toContain("Up next");
    expect(html).toContain("13 reps");
    expect(html).toContain("</svg> Start</button>");
    expect(html).toContain("</svg> Skip</button>");
    expect(html).not.toContain("Skipping");
    expect(html).toContain(`Starting in ${STEP_INTRO_SEC}<`);
  });
});

/** Daily's third step is the Octave siren; its first is the Lip-trill arpeggio. */
function dailyFromStep3(warmIn: boolean, range: VocalRange = {}): string {
  return renderToStaticMarkup(
    <RoutineRunner
      routine={routineById("daily")!}
      startStep={2}
      warmIn={warmIn}
      pitch={{} as UsePitchResult}
      range={range}
      onDone={() => {}}
      onQuit={() => {}}
    />,
  ).replace(/<!-- -->/g, "");
}

describe("a routine opened part-way through on a cold day", () => {
  it("warms in on a few reps of its first exercise before the linked step", () => {
    const html = dailyFromStep3(true);
    expect(html).toContain("Warm-in: Lip-trill arpeggio");
    expect(html).toContain(`${WARM_IN_MAX_REPS} reps`);
    expect(html).toContain("No warmup yet today, so a few easy reps come first. Then step 3.");
    expect(html).not.toContain("Octave siren");
  });

  it("opens on the linked step when the voice is already warm", () => {
    const html = dailyFromStep3(false);
    expect(html).toContain("Octave siren");
    expect(html).not.toContain("Warm-in");
  });

  it("is never longer than the routine's own first step", () => {
    expect(warmInStep(routineById("daily")!)).toEqual({ exerciseId: "lip-trill-scale", reps: 6 });
    expect(warmInStep(routineById("high-notes")!)).toEqual({ exerciseId: "lip-trill-scale", reps: 6 });
    expect(warmInStep(routineById("morning")!).reps).toBe(6);
    expect(warmInStep(routineById("recovery")!).reps).toBe(6);
  });
});
