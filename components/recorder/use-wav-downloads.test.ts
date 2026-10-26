import { afterEach, beforeEach, expect, it, vi } from "vitest";

/*
 * WAV downloads run under a minimal hook runtime: React's four hooks it uses,
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

const decode = vi.hoisted(() => vi.fn());
const encoded = new Blob(["wav"]);
vi.mock("./wav", () => ({ decodeTakeBlob: decode, encodeWavMono: () => encoded }));
import { useWavDownloads } from "./use-wav-downloads";
import type { TakeRecord } from "./db";
const take = { id: "one", name: "Take 1", blob: new Blob(["recording"]) } as TakeRecord;
const save = vi.fn();
const render = () => runtime.render(() => useWavDownloads(save));
beforeEach(() => { runtime.reset(); decode.mockReset(); save.mockReset(); });
afterEach(() => runtime.unmount());

it("reports decode failure and lets a retry export the original take as WAV", async () => {
  decode.mockRejectedValueOnce(new Error("EncodingError")).mockResolvedValueOnce({});
  let downloads = render();
  await downloads.download(take);
  downloads = render();
  expect(downloads.errors.has(take.id)).toBe(true);
  expect(downloads.busyIds.has(take.id)).toBe(false);
  expect(save).not.toHaveBeenCalled();
  await downloads.download(take);
  downloads = render();
  expect(downloads.errors.has(take.id)).toBe(false);
  expect(save).toHaveBeenCalledExactlyOnceWith(encoded, take);
});

it("deduplicates one take while tracking another conversion independently", async () => {
  let finish!: (buffer: object) => void;
  decode.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; })).mockResolvedValueOnce({});
  let downloads = render();
  const first = downloads.download(take);
  await downloads.download(take);
  await downloads.download({ ...take, id: "two" });
  downloads = render();
  expect(decode).toHaveBeenCalledTimes(2);
  expect(downloads.busyIds.has("one")).toBe(true);
  expect(downloads.busyIds.has("two")).toBe(false);
  finish({});
  await first;
  expect(render().busyIds.size).toBe(0);
});

it.each(["delete", "unmount"])("does not trigger a late download after %s", async (action) => {
  let finish!: (buffer: object) => void;
  decode.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  const downloads = render();
  const running = downloads.download(take);
  if (action === "delete") downloads.forget(take.id);
  else runtime.unmount();
  const before = runtime.counts.stateUpdates;
  finish({});
  await running;
  expect(save).not.toHaveBeenCalled();
  expect(runtime.counts.stateUpdates).toBe(before);
});
