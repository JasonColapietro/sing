import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * usePitch run under a minimal hook runtime: React's four hooks it uses,
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

const audio = vi.hoisted(() => ({ failAt: "context", stop: vi.fn(), disconnect: vi.fn(), opens: 0 }));
vi.mock("./mic", () => ({
  openMic: async () => {
    audio.opens++;
    return { stream: { getTracks: () => [{ stop: audio.stop }] }, error: null };
  },
  watchMicEnd: () => () => {},
}));
vi.mock("./devices", () => ({ useAudioPrefs: () => ({}) }));
vi.mock("./vocal-dose", () => ({ doseDay: () => "2026-10-26" }));
vi.mock("./context", () => ({
  getAudioContext: () => {
    if (audio.failAt === "context") throw new Error("Audio initialization failed");
    return {
      sampleRate: 48000,
      createMediaStreamSource: () => {
        if (audio.failAt === "source") throw new Error("Source initialization failed");
        return {
          disconnect: audio.disconnect,
          connect: () => { if (audio.failAt === "connect") throw new Error("Connection failed"); },
        };
      },
      createAnalyser: () => {
        if (audio.failAt === "analyser") throw new Error("Analyser initialization failed");
        return { fftSize: 4096, frequencyBinCount: 2048 };
      },
    };
  },
}));
import { usePitch } from "./use-pitch";
import { useAnalyser } from "./use-analyser";

beforeEach(() => {
  runtime.reset();
  audio.stop.mockClear();
  audio.disconnect.mockClear();
  audio.opens = 0;
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});
afterEach(() => vi.unstubAllGlobals());

for (const [name, hook] of [["usePitch", usePitch], ["useAnalyser", useAnalyser]] as const) {
  describe(name, () => {
    it.each(["context", "connect"])("does not report a partially initialized stream ready after %s fails", async (failure) => {
      audio.failAt = failure;
      const mic = runtime.render(() => hook());
      const first = mic.start();
      // Acquisition has completed and ownership transferred, but the failure
      // handler has not released the partial setup yet.
      await Promise.resolve();
      const second = mic.start();
      expect(await Promise.all([first, second])).toEqual([false, false]);
      expect(audio.opens).toBe(1);
      expect(audio.stop).toHaveBeenCalledOnce();
      if (failure === "connect") expect(audio.disconnect).toHaveBeenCalledOnce();
    });

    it.each(["context", "connect"])("shares a handled %s failure between concurrent starts", async (failure) => {
      audio.failAt = failure;
      const mic = runtime.render(() => hook());
      const results = await Promise.allSettled([mic.start(), mic.start()]);
      expect(results).toEqual([
        { status: "fulfilled", value: false },
        { status: "fulfilled", value: false },
      ]);
      expect(audio.opens).toBe(1);
      expect(audio.stop).toHaveBeenCalledOnce();
      if (failure === "connect") expect(audio.disconnect).toHaveBeenCalledOnce();
    });

    it.each(["context", "source", "analyser", "connect"])("releases the microphone after %s startup fails and lets the singer retry", async (failure) => {
      audio.failAt = failure;
      let mic = runtime.render(() => hook());
      await expect(mic.start()).resolves.toBe(false);
      mic = runtime.render(() => hook());
      expect(mic.listening).toBe(false);
      expect(mic.error).toMatch(/microphone.*try again/i);
      expect(audio.stop).toHaveBeenCalledOnce();
      if (failure === "analyser" || failure === "connect") expect(audio.disconnect).toHaveBeenCalledOnce();

      audio.failAt = "";
      await expect(mic.start()).resolves.toBe(true);
      mic = runtime.render(() => hook());
      expect(mic.listening).toBe(true);
      expect(mic.error).toBeNull();
      expect(audio.opens).toBe(2);
      mic.stop();
      expect(audio.stop).toHaveBeenCalledTimes(2);
    });
  });
}
