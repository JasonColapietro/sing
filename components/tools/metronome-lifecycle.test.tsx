import type { ReactElement, ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

// Exercise the real metronome scheduler and effect cleanup with fake timers.
// Audio groups model whether scheduled sounds remain connected to live output.
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


type GroupNode = { cancelled: boolean };
const audio = vi.hoisted(() => ({
  now: 0,
  queue: [] as { at: number; kind: string; out?: GroupNode }[],
  groups: [] as GroupNode[],
}));
vi.mock("@/lib/audio/context", () => ({
  audioNow: () => audio.now,
  getAudioContext: () => ({ currentTime: audio.now }),
}));
vi.mock("@/lib/audio/synth", () => ({
  createToneGroup: () => {
    const node = { cancelled: false };
    audio.groups.push(node);
    return { node, cancel: () => { node.cancelled = true; } };
  },
  clickAt: (at: number, _accent: boolean, out?: GroupNode) => audio.queue.push({ at, kind: "click", out }),
  playTone: (_midi: number, opts: { at: number; out?: GroupNode }) =>
    audio.queue.push({ at: audio.now + opts.at, kind: "subdivision", out: opts.out }),
}));
import { Metronome } from "@/components/tools/metronome";

let tree: ReactNode;
function nodes(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as ReactElement<Record<string, unknown>>;
  return [element, ...nodes(element.props.children as ReactNode)];
}
const onActive = vi.fn();
const render = () => { tree = hooks.render(() => Metronome({ onActive })); };
const press = (name: string) => {
  (nodes(tree).find((node) => node.props.children === name)!.props.onClick as () => void)();
  render();
};
beforeEach(() => {
  hooks.reset();
  vi.useFakeTimers();
  audio.now = 0;
  audio.queue = [];
  audio.groups = [];
  vi.stubGlobal("window", { setInterval, clearInterval });
  vi.stubGlobal("requestAnimationFrame", () => 1);
  vi.stubGlobal("cancelAnimationFrame", () => {});
  render();
});
afterEach(() => {
  hooks.unmount();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it.each(["stop", "unmount"])("cancels the future eighth click on %s", (action) => {
  const bpm = nodes(tree).find((node) => node.props.id === "met-bpm")!;
  (bpm.props.onChange as (event: unknown) => void)({ target: { value: "30" } });
  render();
  press("Eighths");
  press("Start metronome");
  audio.now = 0.1;
  vi.advanceTimersByTime(100);
  render();
  expect(audio.queue.some((tone) => tone.kind === "subdivision" && tone.at > 1)).toBe(true);
  if (action === "stop") press("Stop metronome");
  else hooks.unmount();
  expect(audio.queue.filter((tone) => tone.at > audio.now + 0.04 && !tone.out?.cancelled)).toHaveLength(0);
  expect(audio.queue.every((tone) => tone.out?.cancelled)).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});

it("uses a fresh output group on restart without reviving old clicks", () => {
  press("Eighths");
  press("Start metronome");
  audio.now = 0.1;
  vi.advanceTimersByTime(100);
  render();
  const old = audio.groups[0];
  press("Stop metronome");
  press("Start metronome");
  audio.now = 0.2;
  vi.advanceTimersByTime(100);
  render();
  expect(audio.groups).toHaveLength(2);
  expect(old.cancelled).toBe(true);
  expect(audio.groups[1].cancelled).toBe(false);
  expect(audio.queue.filter((tone) => !tone.out?.cancelled).map((tone) => tone.out))
    .toEqual([audio.groups[1], audio.groups[1]]);
});

it("keeps the current run and beat schedule when settings change", () => {
  press("Start metronome");
  audio.now = 0.1;
  vi.advanceTimersByTime(100);
  render();
  const group = audio.groups[0];
  press("Eighths");
  press("3/4");
  expect(audio.groups).toHaveLength(1);
  expect(group.cancelled).toBe(false);
  expect(audio.queue[0]).toMatchObject({ at: 0.12, kind: "click", out: group });
  audio.now = 0.7;
  vi.advanceTimersByTime(25);
  render();
  const remaining = audio.queue.slice(1);
  expect(remaining.map((tone) => tone.kind)).toEqual(["click", "subdivision"]);
  expect(remaining[0].at).toBeCloseTo(0.745);
  expect(remaining[1].at).toBeCloseTo(1.0575);
});
