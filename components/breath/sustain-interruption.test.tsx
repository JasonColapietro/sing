import type { ReactElement, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Run the routed sustain test itself, keeping hook state and effect cleanup.
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
import type { InhaleEvent } from "@/lib/audio/breath-detect";

const fixture = vi.hoisted(() => ({
  inhale: null as InhaleEvent | null,
  log: vi.fn(() => ({ xpGained: 1, newAchievements: [] })),
  attempt: vi.fn(() => ({ attempts: [], bestSec: 0 })),
  best: vi.fn(), complete: vi.fn(),
}));
vi.mock("@/lib/audio/use-breath-detect", () => ({ useBreathDetect: () => ({ inhaling: false, lastInhale: fixture.inhale }) }));
vi.mock("@/lib/audio/use-pitch", () => ({ usePitch: () => ({}) }));
vi.mock("@/lib/progress", () => ({ logSession: fixture.log }));
vi.mock("./store", () => ({ loadBreath: () => ({ attempts: [], bestSec: 0 }), recordAttempt: fixture.attempt, recordBreathBest: fixture.best }));
import { SustainTest } from "./sustain-test";
import { BreathGatePanel } from "./breath-gate";

let now: number;
function nodes(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as ReactElement<Record<string, unknown>>;
  return [element, ...nodes(element.props.children as ReactNode)];
}
function mount(attempts = 1) {
  let tree: ReactNode;
  const pitch = { listening: true, error: null, frame: { t: now, volume: 0 }, latest: { current: { t: now, volume: 0 } } } as unknown as UsePitchResult;
  const render = () => {
    tree = hooks.render(() => SustainTest({ variant: "session", pitch, preset: { attempts }, onComplete: fixture.complete, onExit() {} }));
  };
  render();
  const advance = (ms: number) => { now += ms; vi.advanceTimersByTime(ms); render(); };
  const frame = (ms: number, volume: number) => {
    advance(ms); pitch.frame = { ...pitch.frame, t: now, volume }; pitch.latest.current = pitch.frame; render();
  };
  return {
    advance, frame,
    inhale(hiss = false) {
      now += 10;
      if (hiss) { pitch.frame = { ...pitch.frame, t: now, volume: 0.1 }; pitch.latest.current = pitch.frame; }
      fixture.inhale = { endMs: now, durationSec: 0.5, endedByHiss: hiss } as InhaleEvent; render();
    },
    gate() { return nodes(tree).find((n) => n.type === BreathGatePanel)?.props; },
    fallback() { (this.gate()!.onFallback as () => void)(); render(); },
    mic(listening: boolean) {
      pitch.listening = listening;
      if (!listening) { pitch.frame = { ...pitch.frame, t: 0, volume: 0 }; pitch.latest.current = pitch.frame; }
      render();
    },
    visibility(state: DocumentVisibilityState) {
      Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
      document.dispatchEvent(new Event("visibilitychange")); render();
    },
  };
}
function frames(player: ReturnType<typeof mount>, ms: number, volume: number) {
  for (let elapsed = 0; elapsed < ms; elapsed += 100) player.frame(100, volume);
}
function hold(player: ReturnType<typeof mount>, ms = 6000) {
  player.frame(10, 0.1); frames(player, ms, 0.1);
}
function endNote(player: ReturnType<typeof mount>) { frames(player, 800, 0); }

beforeEach(() => {
  hooks.reset(); vi.clearAllMocks(); vi.useFakeTimers(); now = 1000; fixture.inhale = null;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.stubGlobal("window", Object.assign(new EventTarget(), { setTimeout, clearTimeout }));
  vi.stubGlobal("document", Object.assign(new EventTarget(), { visibilityState: "visible" }));
});
afterEach(() => { hooks.unmount(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("routed sustain continuity", () => {
  it("discards an unfinished hold after a long sample gap without saving or logging the absence", () => {
    const player = mount(); player.inhale(); hold(player, 500);
    player.frame(60_000, 0.1); endNote(player);
    expect(fixture.attempt).not.toHaveBeenCalled();
    expect(fixture.log).not.toHaveBeenCalled();
    expect(fixture.complete).not.toHaveBeenCalled();
    expect(player.gate()).toBeDefined();
    player.inhale(); hold(player); endNote(player);
    expect(fixture.attempt).toHaveBeenCalledExactlyOnceWith(6, 100);
    expect(fixture.complete).toHaveBeenCalledWith(expect.objectContaining({ best: 6, durationSec: 6 }));
  });

  it("requires a fresh breath after backgrounding even when the returned sample is loud", () => {
    const player = mount(); player.inhale(); hold(player, 500);
    player.visibility("hidden"); player.advance(60_000);
    player.visibility("visible"); player.frame(10, 0.1); endNote(player);
    expect(fixture.attempt).not.toHaveBeenCalled();
    expect(fixture.best).not.toHaveBeenCalled();
    expect(player.gate()).toBeDefined();
  });

  it("preserves completed attempts when the next attempt is interrupted", () => {
    const player = mount(2); player.inhale(); hold(player); endNote(player);
    expect(fixture.attempt).toHaveBeenCalledExactlyOnceWith(6, 100);
    frames(player, 3000, 0); player.inhale(); hold(player, 500);
    player.visibility("hidden"); player.advance(60_000); player.visibility("visible");
    player.frame(10, 0.1); endNote(player);
    expect(fixture.attempt).toHaveBeenCalledTimes(1);
    expect(fixture.complete).not.toHaveBeenCalled();
    player.inhale(); hold(player); endNote(player);
    expect(fixture.attempt).toHaveBeenCalledTimes(2);
    expect(fixture.complete).toHaveBeenCalledWith(expect.objectContaining({ best: 6, durationSec: 12 }));
  });

  it("requires a fresh breath after mic loss and ignores disconnected time", () => {
    const player = mount(); player.inhale(); hold(player, 500);
    player.mic(false); player.advance(60_000); player.mic(true); player.frame(10, 0.1);
    expect(player.gate()).toBeDefined();
    expect(fixture.attempt).not.toHaveBeenCalled();
    player.inhale(); hold(player); endNote(player);
    expect(fixture.attempt).toHaveBeenCalledExactlyOnceWith(6, 100);
  });

  it("pauses between-attempt timers while hidden and preserves completed results", () => {
    const player = mount(2); player.inhale(); hold(player); endNote(player);
    player.visibility("hidden"); player.advance(60_000);
    expect(vi.getTimerCount()).toBe(0);
    expect(fixture.attempt).toHaveBeenCalledTimes(1);
    player.visibility("visible");
    expect(player.gate()).toBeUndefined();
    frames(player, 3000, 0);
    expect(player.gate()?.stale).toBe(false);
    hooks.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps normal volume scoring and tolerates a short scheduling hitch", () => {
    const player = mount(); player.inhale(); hold(player);
    player.frame(400, 0.1); endNote(player);
    expect(fixture.attempt).toHaveBeenCalledExactlyOnceWith(6.4, 100);
  });

  it("still measures a hiss opened by breath detection", () => {
    const player = mount(); player.inhale(true); frames(player, 6000, 0.1); endNote(player);
    expect(fixture.attempt).toHaveBeenCalledExactlyOnceWith(6, 100);
  });

  it("keeps the sound-only fallback through interruption and restarts on a fresh note", () => {
    const player = mount(); player.fallback(); hold(player, 500);
    player.visibility("hidden"); player.advance(60_000); player.visibility("visible");
    // Quiet frames establish the next note's own start after the interruption.
    frames(player, 200, 0); hold(player); endNote(player);
    expect(fixture.attempt).toHaveBeenCalledExactlyOnceWith(6, 100);
  });
});
