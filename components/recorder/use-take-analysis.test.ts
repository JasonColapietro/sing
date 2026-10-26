import { afterEach, beforeEach, expect, it, vi } from "vitest";

/*
 * Analysis cache run under a minimal hook runtime: React's four hooks it uses,
 * re-implemented here so the effects, the animation loop and the state
 * updates it makes can be counted without a DOM. One component, one hook.
 */
const runtime = vi.hoisted(() => {
  type Effect = { deps?: unknown[]; cleanup?: void | (() => void) };
  const slots: unknown[] = [];
  let cursor = 0;
  let queued: Array<() => void> = [];
  const counts = { stateUpdates: 0 };
  const same = (a?: unknown[], b?: unknown[]) =>
    !!a && !!b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  return {
    counts,
    unmount() {
      for (const slot of slots) {
        const effect = slot as Effect | undefined;
        if (typeof effect?.cleanup === "function") effect.cleanup();
      }
    },
    reset() {
      slots.length = 0;
      counts.stateUpdates = 0;
    },
    render<T>(hook: () => T): T {
      cursor = 0;
      queued = [];
      const out = hook();
      for (const run of queued) run();
      return out;
    },
    useState<S>(init: S | (() => S)) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof init === "function" ? (init as () => S)() : init;
      const set = (next: S | ((prev: S) => S)) => {
        counts.stateUpdates++;
        slots[i] = typeof next === "function" ? (next as (prev: S) => S)(slots[i] as S) : next;
      };
      return [slots[i] as S, set] as const;
    },
    useRef<V>(init: V) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = { current: init };
      return slots[i] as { current: V };
    },
    useCallback<F>(fn: F, deps: unknown[]) {
      const i = cursor++;
      const prev = slots[i] as { fn: F; deps: unknown[] } | undefined;
      if (prev && same(prev.deps, deps)) return prev.fn;
      slots[i] = { fn, deps };
      return fn;
    },
    useEffect(fn: () => void | (() => void), deps?: unknown[]) {
      const i = cursor++;
      const prev = slots[i] as Effect | undefined;
      if (prev && same(prev.deps, deps)) return;
      queued.push(() => {
        if (typeof prev?.cleanup === "function") prev.cleanup();
        slots[i] = { deps, cleanup: fn() };
      });
    },
  };
});

vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useState: runtime.useState,
  useRef: runtime.useRef,
  useCallback: runtime.useCallback,
  useEffect: runtime.useEffect,
}));

const analyze = vi.hoisted(() => vi.fn());
vi.mock("@/lib/audio/analyze-take", () => ({ analyzeTake: analyze }));
import { useTakeAnalysis } from "./use-take-analysis";
import type { TakeAnalysis } from "@/lib/audio/analyze-take";

const take = { id: "take-1", blob: new Blob(["recording"]) };
const analysis = { points: [], medianMidi: null, inTunePct: null, durationSec: 1, truncated: false, longestVoicedRunSec: null } satisfies TakeAnalysis;
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };
beforeEach(() => { runtime.reset(); analyze.mockReset(); });
afterEach(() => runtime.unmount());

it("reports a failed analysis, waits for an explicit retry, then displays the result", async () => {
  analyze.mockRejectedValueOnce(new Error("Decode failed")).mockResolvedValueOnce(analysis);
  let cache = runtime.render(useTakeAnalysis);
  cache.ensureAnalysis(take);
  cache.ensureAnalysis(take);
  expect(analyze).toHaveBeenCalledOnce();
  await settle();
  cache = runtime.render(useTakeAnalysis);
  expect(cache.analysisErrors.has(take.id)).toBe(true);
  expect(cache.analysisMap.has(take.id)).toBe(false);
  cache.ensureAnalysis(take);
  expect(analyze).toHaveBeenCalledOnce();
  cache.ensureAnalysis(take, true);
  cache = runtime.render(useTakeAnalysis);
  expect(cache.analysisErrors.has(take.id)).toBe(false);
  await settle();
  cache = runtime.render(useTakeAnalysis);
  expect(cache.analysisMap.get(take.id)).toEqual(analysis);
  expect(cache.analysisErrors.has(take.id)).toBe(false);
  expect(analyze).toHaveBeenCalledTimes(2);
});

it.each(["resolve", "reject"])("ignores a deleted take's late %s", async (outcome) => {
  let resolve!: (value: TakeAnalysis) => void;
  let reject!: (error: Error) => void;
  analyze.mockReturnValue(new Promise<TakeAnalysis>((yes, no) => { resolve = yes; reject = no; }));
  let cache = runtime.render(useTakeAnalysis);
  cache.ensureAnalysis(take);
  cache.forgetAnalysis(take.id);
  if (outcome === "resolve") resolve(analysis);
  else reject(new Error("Decode failed"));
  await settle();
  cache = runtime.render(useTakeAnalysis);
  expect(cache.analysisMap.has(take.id)).toBe(false);
  expect(cache.analysisErrors.has(take.id)).toBe(false);
});

it("does not publish analysis after the recorder unmounts", async () => {
  let resolve!: (value: TakeAnalysis) => void;
  analyze.mockReturnValue(new Promise<TakeAnalysis>((yes) => { resolve = yes; }));
  const cache = runtime.render(useTakeAnalysis);
  cache.ensureAnalysis(take);
  runtime.unmount();
  const before = runtime.counts.stateUpdates;
  resolve(analysis);
  await settle();
  expect(runtime.counts.stateUpdates).toBe(before);
});
