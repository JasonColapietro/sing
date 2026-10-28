import type { ReactElement, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Run the routed cue drill itself, keeping hook state and effect cleanup.
// Only microphone/breath observations and persistence are mocked.
const hooks = vi.hoisted(() => {
  type Slot = { value?: unknown; deps?: unknown[]; cleanup?: void | (() => void) };
  let slots: Slot[] = [];
  let cursor = 0;
  let pending: (() => void)[] = [];
  let dirty = false;
  const same = (a?: unknown[], b?: unknown[]) =>
    !!a && !!b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  return {
    reset() { slots = []; },
    unmount() { slots.forEach((slot) => { if (typeof slot.cleanup === "function") slot.cleanup(); }); slots = []; },
    render<T>(component: () => T): T {
      let out: T;
      let remaining = 20;
      do {
        cursor = 0; pending = []; dirty = false;
        out = component();
        pending.forEach((effect) => effect());
        if (!remaining--) throw new Error("Effects did not settle");
      } while (dirty);
      return out!;
    },
    useState<S>(init: S | (() => S)) {
      const i = cursor++;
      if (!slots[i]) slots[i] = { value: typeof init === "function" ? (init as () => S)() : init };
      return [slots[i].value as S, (next: S | ((previous: S) => S)) => {
        const value = typeof next === "function" ? (next as (previous: S) => S)(slots[i].value as S) : next;
        if (!Object.is(value, slots[i].value)) { slots[i].value = value; dirty = true; }
      }] as const;
    },
    useRef<T>(value: T) {
      const i = cursor++;
      slots[i] ??= { value: { current: value } };
      return slots[i].value as { current: T };
    },
    useMemo<T>(create: () => T, deps: unknown[]) {
      const i = cursor++;
      if (!slots[i] || !same(slots[i].deps, deps)) slots[i] = { value: create(), deps };
      return slots[i].value as T;
    },
    useEffect(effect: () => void | (() => void), deps?: unknown[]) {
      const i = cursor++;
      if (slots[i] && same(slots[i].deps, deps)) return;
      pending.push(() => {
        const cleanup = slots[i]?.cleanup;
        if (typeof cleanup === "function") cleanup();
        slots[i] = { deps, cleanup: effect() };
      });
    },
  };
});

vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  useState: hooks.useState,
  useRef: hooks.useRef,
  useMemo: hooks.useMemo,
  useCallback: <T,>(fn: T, deps: unknown[]) => hooks.useMemo(() => fn, deps),
  useEffect: hooks.useEffect,
}));

import type { UsePitchResult } from "@/lib/audio/use-pitch";
import { InhaleDetector, type BreathFeatures, type InhaleEvent } from "@/lib/audio/breath-detect";

const fixture = vi.hoisted(() => ({
  inhale: null as InhaleEvent | null,
  log: vi.fn(() => ({ xpGained: 0, newAchievements: [] })),
  best: vi.fn(),
  complete: vi.fn(),
}));
vi.mock("@/lib/audio/use-breath-detect", () => ({
  useBreathDetect: () => ({ inhaling: false, lastInhale: fixture.inhale }),
}));
vi.mock("@/lib/progress", () => ({ logSession: fixture.log }));
vi.mock("./store", () => ({ recordBreathBest: fixture.best }));
import { BreathCueDrill } from "./breath-cue-drill";
import { BreathGatePanel } from "./breath-gate";
import { BREATH_FALLBACK_SEC } from "./routines";

let now: number;
function nodes(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as ReactElement<Record<string, unknown>>;
  return [element, ...nodes(element.props.children as ReactNode)];
}
function mount() {
  let tree: ReactNode;
  const pitch = {
    listening: true, error: null,
    frame: { t: now, volume: 0 }, latest: { current: { t: now, volume: 0 } },
    start: vi.fn(async () => true),
  } as unknown as UsePitchResult;
  // Matches /breath?drill=cue: six four-second holds, setup first, onComplete
  // supplied by BreathDrillSession (the drill remains mounted at its retry gate).
  const render = () => {
    tree = hooks.render(() => BreathCueDrill({ pitch, preset: { reps: 6, holdSec: 4 }, onComplete: fixture.complete, onExit() {} }));
  };
  render();
  const advance = (ms: number) => { now += ms; vi.advanceTimersByTime(ms); render(); };
  const frame = (ms: number, volume: number) => {
    advance(ms);
    pitch.frame = { ...pitch.frame, t: now, volume };
    pitch.latest.current = pitch.frame;
    render();
  };
  return {
    advance, frame,
    observation(ms: number, features: BreathFeatures, detector: InhaleDetector, frameFirst = false) {
      now += ms; vi.advanceTimersByTime(ms);
      const event = detector.push(features, now).inhale;
      pitch.frame = { ...pitch.frame, t: now, volume: features.rms };
      pitch.latest.current = pitch.frame;
      if (frameFirst) render();
      if (event) fixture.inhale = event;
      render();
      return event;
    },
    begin() { (nodes(tree).find((n) => n.props.children === "Start")!.props.onClick as () => void)(); render(); },
    inhale(hiss = false) {
      if (hiss) { pitch.frame = { ...pitch.frame, t: now, volume: 0.1 }; pitch.latest.current = pitch.frame; }
      fixture.inhale = { endMs: now, durationSec: 0.5, endedByHiss: hiss } as InhaleEvent;
      render();
    },
    gate() { return nodes(tree).find((n) => n.type === BreathGatePanel)?.props; },
    fallback() { (this.gate()!.onFallback as () => void)(); render(); },
    sensitivity(value: number) {
      (nodes(tree).find((n) => n.props.id === "cue-sensitivity")!.props.onChange as (event: unknown) => void)({ target: { value: String(value) } }); render();
    },
    threshold() { return nodes(tree).find((n) => n.props.id === "cue-sensitivity")?.props.value; },
    mic(listening: boolean) {
      pitch.listening = listening;
      if (!listening) { pitch.frame = { ...pitch.frame, t: 0, volume: 0 }; pitch.latest.current = pitch.frame; }
      render();
    },
    visibility(state: DocumentVisibilityState) {
      Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
      document.dispatchEvent(new Event("visibilitychange")); render();
    },
    done() { return nodes(tree).find((n) => n.props.role === "img")?.props["aria-label"]; },
  };
}

beforeEach(() => {
  hooks.reset(); vi.clearAllMocks(); vi.useFakeTimers(); now = 1000; fixture.inhale = null;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.stubGlobal("window", Object.assign(new EventTarget(), { setTimeout, clearTimeout }));
  vi.stubGlobal("document", Object.assign(new EventTarget(), { visibilityState: "visible" }));
});
afterEach(() => { hooks.unmount(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

function waitWithQuietFrames(player: ReturnType<typeof mount>, ms: number) {
  for (let elapsed = 0; elapsed < ms; elapsed += 100) player.frame(100, 0);
}

function hold(player: ReturnType<typeof mount>, ms = 4000) {
  player.frame(10, 0.1);
  for (let elapsed = 0; elapsed < ms; elapsed += 100) player.frame(100, 0.1);
}

describe("routed Breathe and sing interruptions", () => {
  it("requires a new breath and a full hold after a microphone disconnect", () => {
    const player = mount(); player.begin(); player.inhale(); hold(player, 500);
    player.mic(false); player.advance(10_000); player.mic(true); player.frame(10, 0.1);
    expect(player.done()).toBe("0 of 6 reps done");
    expect(player.gate()).toBeDefined();
    expect(fixture.complete).not.toHaveBeenCalled();
    player.inhale(); hold(player);
    expect(player.done()).toBe("1 of 6 reps done");
  });

  it("preserves completed reps, sensitivity and fallback while restarting the interrupted rep", () => {
    const player = mount(); player.begin(); player.sensitivity(0.03); player.fallback(); hold(player);
    expect(player.done()).toBe("1 of 6 reps done");
    waitWithQuietFrames(player, 1500); // rest ends; the next timed breath begins
    waitWithQuietFrames(player, 2500); hold(player, 500);
    player.mic(false); player.advance(10_000); player.mic(true); player.frame(10, 0.1);
    expect(player.done()).toBe("1 of 6 reps done");
    expect(player.threshold()).toBe(0.03);
    expect(player.gate()).toBeUndefined(); // fallback remains selected
    waitWithQuietFrames(player, 2500); hold(player);
    expect(player.done()).toBe("2 of 6 reps done");
  });

  it("does not run the breath-wait timer behind the retry gate", () => {
    const player = mount(); player.begin(); player.advance(1000);
    player.mic(false); player.advance(60_000);
    expect(vi.getTimerCount()).toBe(0);
    player.mic(true);
    expect(player.gate()?.stale).toBe(false);
    player.advance(BREATH_FALLBACK_SEC * 1000);
    expect(player.gate()?.stale).toBe(true);
  });

  it("restarts an incomplete hold after backgrounding without crediting the hidden gap", () => {
    const player = mount(); player.begin(); player.inhale(); hold(player, 500);
    player.visibility("hidden"); player.advance(60_000);
    expect(vi.getTimerCount()).toBe(0);
    player.visibility("visible"); player.frame(10, 0.1);
    expect(player.done()).toBe("0 of 6 reps done");
    expect(player.gate()).toBeDefined();
    expect(fixture.log).not.toHaveBeenCalled();
  });

  it("drops a long unobserved gap even if the page stayed visible", () => {
    const player = mount(); player.begin(); player.inhale(); hold(player, 500);
    player.frame(60_000, 0.1);
    expect(player.done()).toBe("0 of 6 reps done");
    expect(player.gate()).toBeDefined();
    player.inhale(); hold(player);
    expect(player.done()).toBe("1 of 6 reps done");
  });

  it("counts a normal hold with a short scheduling hitch", () => {
    const player = mount(); player.begin(); player.inhale(); hold(player, 3500);
    player.frame(400, 0.1);
    expect(player.done()).toBe("0 of 6 reps done");
    player.frame(100, 0.1);
    expect(player.done()).toBe("1 of 6 reps done");
  });

  it("counts a continuous hiss from the detected breath split", () => {
    const player = mount(); player.begin(); player.inhale(true);
    for (let elapsed = 0; elapsed < 4000; elapsed += 100) player.frame(100, 0.1);
    expect(player.done()).toBe("1 of 6 reps done");
  });

  it("cancels rest when the mic disconnects and keeps its completed rep", () => {
    const player = mount(); player.begin(); player.inhale(); hold(player);
    player.mic(false); player.advance(60_000);
    expect(vi.getTimerCount()).toBe(0);
    player.mic(true);
    expect(player.done()).toBe("1 of 6 reps done");
    expect(player.gate()?.stale).toBe(false);
  });

  it("removes a pending rep timer when the routed drill unmounts", () => {
    const player = mount(); player.begin();
    expect(vi.getTimerCount()).toBe(1);
    hooks.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

// A real detector waits 400ms to confirm the inhale-to-hiss split. A resumed
// frame can confirm a split from before the gap; the drill must reject it.
function pendingHiss(player: ReturnType<typeof mount>) {
  const detector = new InhaleDetector();
  const room: BreathFeatures = { rms: 0.0005, lowPower: 1, highPower: 1, flatness: 0.5, centroidHz: 2000, clarity: 0 };
  const breath = { ...room, rms: 0.01, highPower: 30, centroidHz: 3000 };
  const hiss = { ...breath, rms: 0.1, highPower: 150, centroidHz: 4500 };
  for (let i = 0; i < 30; i++) player.observation(20, room, detector);
  for (let i = 0; i < 30; i++) player.observation(20, breath, detector);
  for (let i = 0; i < 10; i++) expect(player.observation(20, hiss, detector)).toBeNull();
  return { detector, hiss };
}

describe("hiss confirmation continuity", () => {
  it.each([
    { gap: 901, frameFirst: false }, { gap: 60_000, frameFirst: false },
    { gap: 901, frameFirst: true }, { gap: 60_000, frameFirst: true },
  ])("rejects an old split after $gap ms (frame first: $frameFirst)", ({ gap, frameFirst }) => {
    const player = mount();
    player.begin();
    const { detector, hiss } = pendingHiss(player);
    const event = player.observation(gap, hiss, detector, frameFirst);
    expect(event?.endedByHiss).toBe(true);
    expect(now - event!.endMs).toBeGreaterThan(gap);
    if (gap === 60_000) expect(player.gate()?.stale).toBe(true);
    expect(player.done()).toBe("0 of 6 reps done");
    expect(player.gate()).toBeDefined();
    expect(fixture.log).not.toHaveBeenCalled();
    player.inhale(); hold(player);
    expect(player.done()).toBe("1 of 6 reps done");
  });

  it("accepts the real detector's normal delayed hiss confirmation", () => {
    const player = mount();
    player.begin();
    const { detector, hiss } = pendingHiss(player);
    const event = player.observation(400, hiss, detector);
    expect(event?.endedByHiss).toBe(true);
    expect(player.gate()).toBeUndefined();
    for (let i = 0; i < 40; i++) player.frame(100, 0.1);
    expect(player.done()).toBe("1 of 6 reps done");
  });
});
