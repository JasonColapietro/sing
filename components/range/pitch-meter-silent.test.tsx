import type { ReactElement, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Runs the real pitch meter's state and effects through a silent session and
// a Stop, the way /range#start on a phone sees it.
const hooks = await vi.hoisted(async () => (await import("@/tests/hooks-harness")).createHooks());
vi.mock("react", async (original) => hooks.mockReact(await original<typeof import("react")>()));

const fixture = vi.hoisted(() => ({
  log: vi.fn(() => ({ xpGained: 8, newAchievements: [] })),
  pitch: {
    listening: false,
    error: null as string | null,
    frame: { freq: null, note: null, volume: 0, t: 0 },
    latest: { current: { freq: null, note: null, volume: 0, t: 0 } },
    start: vi.fn(async () => true),
    stop: vi.fn(),
  },
}));
vi.mock("@/lib/audio/use-pitch", () => ({ usePitch: () => fixture.pitch }));
vi.mock("@/lib/pro", () => ({ useIsPro: () => false, useProReady: () => true }));
vi.mock("@/lib/progress", () => ({
  useProgress: () => ({ range: {} }),
  rangeRetestDue: () => true,
  logSession: fixture.log,
}));
vi.mock("@/lib/use-flush-on-exit", () => ({ useFlushOnExit: () => {} }));
vi.mock("next/dynamic", () => ({ default: () => "program-range-probe" }));

import { PitchMeter } from "./pitch-meter";

const SILENT = "No note was heard, so nothing was logged.";
let now = 0;

function text(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(text).join("");
  if (!node || typeof node !== "object" || !("props" in node)) return "";
  return text((node as ReactElement<{ children?: ReactNode }>).props.children);
}

beforeEach(() => {
  hooks.reset(); vi.clearAllMocks();
  now = 1_000;
  fixture.pitch.listening = false;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.spyOn(Date, "now").mockImplementation(() => 1_790_000_000_000 + now);
  vi.stubGlobal("window", Object.assign(new EventTarget(), { setTimeout, clearTimeout }));
  vi.stubGlobal("document", Object.assign(new EventTarget(), { visibilityState: "visible" }));
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.stubGlobal("cancelAnimationFrame", () => {});
});
afterEach(() => { hooks.unmount(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("the pitch meter after a silent Stop", () => {
  it("brings the 'No note was heard' card into view once it is on the page", () => {
    let tree: ReactNode = null;
    const draw = () => hooks.render(() => (tree = PitchMeter({})));
    draw();
    // The stopped view's wrapper; the harness has no DOM to attach the ref.
    const wrapper = tree as unknown as ReactElement<{ ref: { current: unknown } }>;
    const scrolledOver: boolean[] = [];
    wrapper.props.ref.current = { scrollIntoView: () => scrolledOver.push(text(tree).includes(SILENT)) };

    fixture.pitch.listening = true;
    draw();
    now += 20_000; // nothing heard, past the live hint's wait
    fixture.pitch.listening = false;
    draw();

    expect(fixture.log).not.toHaveBeenCalled();
    expect(text(tree)).toContain(SILENT);
    // The stop's own scroll happens before the flush puts the card in, and
    // the card then sat above the screen under the sticky header. The last
    // scroll must be over the page that has the card.
    expect(scrolledOver.at(-1)).toBe(true);
  });

  it("does not scroll on the first visit, before any Stop", () => {
    let tree: ReactNode = null;
    const scrolls = vi.fn();
    hooks.render(() => (tree = PitchMeter({})));
    (tree as unknown as ReactElement<{ ref: { current: unknown } }>).props.ref.current = { scrollIntoView: scrolls };
    hooks.render(() => (tree = PitchMeter({})));
    expect(scrolls).not.toHaveBeenCalled();
    expect(text(tree)).not.toContain(SILENT);
  });
});
