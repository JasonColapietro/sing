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
    unmount() {
      for (const slot of slots) {
        const effect = slot as Effect | undefined;
        if (typeof effect?.cleanup === "function") effect.cleanup();
      }
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

type MicReply = { stream: { getTracks: () => Array<{ stop: () => void }> } | null; error: string | null };
const audio = vi.hoisted(() => ({
  failAt: "context", stop: vi.fn(), disconnect: vi.fn(), opens: 0,
  deferred: false,
  requests: [] as Array<{ resolve: (reply: MicReply) => void; reject: (error: Error) => void }>,
}));
vi.mock("./mic", () => ({
  openMic: async () => {
    audio.opens++;
    if (audio.deferred) return new Promise<MicReply>((resolve, reject) => audio.requests.push({ resolve, reject }));
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
  audio.deferred = false;
  audio.requests = [];
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});
afterEach(() => vi.unstubAllGlobals());

for (const [name, hook] of [["usePitch", usePitch], ["useAnalyser", useAnalyser]] as const) {
  describe(name, () => {
    it.each(["stop", "unmount"])("releases permission granted after %s without reactivating the mic", async (action) => {
      audio.deferred = true; audio.failAt = "";
      const mic = runtime.render(() => hook());
      const pending = mic.start();
      if (action === "stop") mic.stop();
      else runtime.unmount();
      const updates = runtime.counts.stateUpdates;
      const trackStop = vi.fn();
      audio.requests[0].resolve({ stream: { getTracks: () => [{ stop: trackStop }] }, error: null });
      await expect(pending).resolves.toBe(false);
      expect(trackStop).toHaveBeenCalledOnce();
      expect(requestAnimationFrame).not.toHaveBeenCalled();
      expect(runtime.counts.stateUpdates).toBe(updates);
      if (action === "stop") expect(runtime.render(() => hook()).listening).toBe(false);
    });

    for (const outcome of ["grant", "refusal", "reject"] as const) {
      it.each(["before", "after"])(`ignores an old ${outcome} arriving %s a replacement stream opens`, async (order) => {
        audio.deferred = true; audio.failAt = "";
        const mic = runtime.render(() => hook());
        const first = mic.start();
        mic.stop();
        const next = mic.start();
        expect(audio.opens).toBe(2);
        const oldStop = vi.fn(); const newStop = vi.fn();
        const finishOld = () => {
          if (outcome === "reject") audio.requests[0].reject(new Error("Old request failed"));
          else audio.requests[0].resolve(outcome === "grant"
            ? { stream: { getTracks: () => [{ stop: oldStop }] }, error: null }
            : { stream: null, error: "Old permission denied" });
        };
        const finishNew = () => audio.requests[1].resolve({ stream: { getTracks: () => [{ stop: newStop }] }, error: null });
        if (order === "before") {
          finishOld(); await expect(first).resolves.toBe(false);
          // The old finally must not erase the replacement's pending promise.
          const concurrent = mic.start(); expect(audio.opens).toBe(2);
          finishNew(); await expect(concurrent).resolves.toBe(true);
        } else {
          finishNew(); await expect(next).resolves.toBe(true);
          finishOld(); await expect(first).resolves.toBe(false);
        }
        await expect(next).resolves.toBe(true);
        const active = runtime.render(() => hook());
        expect(active.listening).toBe(true); expect(active.error).toBeNull();
        expect(newStop).not.toHaveBeenCalled();
        expect(audio.disconnect).not.toHaveBeenCalled();
        expect(requestAnimationFrame).toHaveBeenCalledOnce();
        expect(oldStop).toHaveBeenCalledTimes(outcome === "grant" ? 1 : 0);
        active.stop(); expect(newStop).toHaveBeenCalledOnce();
      });
    }

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
