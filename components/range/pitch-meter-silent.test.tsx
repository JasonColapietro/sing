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

import { PitchMeter, RangeNextStep } from "./pitch-meter";

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
  fixture.pitch.latest = { current: { freq: null, note: null, volume: 0, t: 0 } };
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

type Found = ReactElement<Record<string, unknown>>;
/** The first element that matches in a component's own tree (child components are not run). */
function find(node: ReactNode, match: (el: Found) => boolean): Found | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = find(child, match);
      if (hit) return hit;
    }
    return null;
  }
  if (!node || typeof node !== "object" || !("props" in node)) return null;
  const el = node as ReactElement<{ children?: ReactNode }>;
  if (match(el as Found)) return el as Found;
  return find(el.props.children, match);
}

describe("the pitch meter after a saved Stop that held no note", () => {
  const SAVED = "+8 XP, saved to your progress.";

  it("says what was saved and offers the range test, not the first-visit gate alone", () => {
    const frames: { next?: () => void } = {};
    vi.stubGlobal("requestAnimationFrame", (cb: () => void) => ((frames.next = cb), 1));
    let tree: ReactNode = null;
    const onTryRange = vi.fn();
    const draw = () => hooks.render(() => (tree = PitchMeter({ onTryRange })));
    draw();
    const scrolledOver: boolean[] = [];
    (tree as unknown as ReactElement<{ ref: { current: unknown } }>).props.ref.current = {
      scrollIntoView: () => scrolledOver.push(text(tree).includes(SAVED)),
    };

    fixture.pitch.listening = true;
    draw();
    // The harness attaches no refs: give the lane a canvas, then re-run its
    // loop (a new `latest` re-runs the effect) so it can hear frames.
    const ctx = new Proxy({} as Record<string | symbol, unknown>, {
      get: (target, key) => (key in target ? target[key] : () => ({ addColorStop() {} })),
    });
    const canvas = find(tree, (el) => el.type === "canvas") as ReactElement<{ ref: { current: unknown } }>;
    canvas.props.ref.current = { clientWidth: 320, clientHeight: 300, width: 0, height: 0, getContext: () => ctx };
    const latest = { current: fixture.pitch.latest.current as unknown };
    fixture.pitch.latest = latest as typeof fixture.pitch.latest;
    // A siren: voiced every frame, on a new semitone every 100 ms, so no note
    // is held the 300 ms that marks the lowest and highest.
    let midi = 50;
    const sing = () => {
      latest.current = { freq: 200, note: { midi: midi++, cents: 0, name: "A", octave: 3 }, volume: 0.1, t: now };
    };
    sing();
    draw();
    for (let i = 0; i < 20; i++) {
      now += 100;
      sing();
      frames.next?.();
    }
    now += 50_000;
    fixture.pitch.listening = false;
    draw();

    expect(fixture.log).toHaveBeenCalledTimes(1);
    const page = text(tree);
    expect(page).not.toContain("Held so far");
    expect(page).toContain(SAVED);
    expect(page).toContain("No note was held long enough to mark your lowest and highest");
    expect(page).not.toContain("No note was heard");
    expect(page).not.toMatch(/\u2014/);
    // The save is announced, as the silent card's word is.
    const status = find(tree, (el) => el.props.role === "status");
    expect(text(status)).toContain(SAVED);
    // The same next step the held-notes card gives: the range test, due with
    // no saved range, with its reason beside the button.
    const step = find(tree, (el) => el.type === RangeNextStep) as ReactElement<Parameters<typeof RangeNextStep>[0]>;
    expect(step).not.toBeNull();
    expect(step.props.retestDue).toBe(true);
    expect(step.props.explain).toBe(true);
    expect(text(step.props.tryRange)).toBe("Take the 2-minute range test");
    (step.props.tryRange as ReactElement<{ onClick: () => void }>).props.onClick();
    expect(onTryRange).toHaveBeenCalledTimes(1);
    // The card comes in with the flush, a render after the stop's scroll: the
    // last scroll must be over the page that has it.
    expect(scrolledOver.at(-1)).toBe(true);
  });
});

