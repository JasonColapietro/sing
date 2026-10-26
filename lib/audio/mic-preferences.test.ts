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

type Prefs = { inputId: string; monitoring: "headphones" | "speakers" };
type Stream = { id: string; getTracks: () => Array<{ stop: () => void }> };
type Reply = { stream: Stream | null; error: string | null };
const audio = vi.hoisted(() => ({
  prefs: { inputId: "A", monitoring: "headphones" } as Prefs,
  requests: [] as Array<{ prefs: Prefs; resolve: (reply: Reply) => void; reject: (error: Error) => void }>,
  sources: [] as string[],
  actualMic: false,
}));
vi.mock("./devices", () => ({
  useAudioPrefs: () => audio.prefs, getAudioPrefs: () => audio.prefs,
  getInputDeviceId: () => audio.prefs.inputId, getMonitoring: () => audio.prefs.monitoring,
  clearInputDevice: () => { audio.prefs = { ...audio.prefs, inputId: "" }; },
}));
vi.mock("@/lib/account-gate", () => ({ requireAccountToUse: () => true }));
vi.mock("./mic", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./mic")>();
  return {
  openMic: (options?: { deviceId: string; monitoring: Prefs["monitoring"] }) => {
    if (audio.actualMic) return actual.openMic(options);
    const prefs = options ? { inputId: options.deviceId, monitoring: options.monitoring } : { ...audio.prefs };
    return new Promise<Reply>((resolve, reject) => audio.requests.push({ prefs, resolve, reject }));
  },
  watchMicEnd: () => () => {},
  };
});
vi.mock("./vocal-dose", () => ({ doseDay: () => "2026-10-26" }));
vi.mock("./context", () => ({ getAudioContext: () => ({
  sampleRate: 48000,
  createMediaStreamSource: (stream: Stream) => { audio.sources.push(stream.id); return { connect() {}, disconnect() {} }; },
  createAnalyser: () => ({ fftSize: 4096, frequencyBinCount: 2048 }),
}) }));
import { usePitch } from "./use-pitch";
import { useAnalyser } from "./use-analyser";

function microphone(id: string) { const stop = vi.fn(); return { stream: { id, getTracks: () => [{ stop }] }, stop }; }
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
beforeEach(() => {
  runtime.reset(); audio.prefs = { inputId: "A", monitoring: "headphones" }; audio.requests = []; audio.sources = []; audio.actualMic = false;
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1)); vi.stubGlobal("cancelAnimationFrame", vi.fn());
});
afterEach(() => { runtime.unmount(); vi.unstubAllGlobals(); });

for (const [name, hook] of [["usePitch", usePitch], ["useAnalyser", useAnalyser]] as const) {
  describe(name + " latest microphone preferences", () => {
    it.each(["success", "refusal", "rejection"])("keeps C selected when the pending switch to B finishes with %s", async (outcome) => {
      let mic = runtime.render(() => hook());
      const first = mic.start();
      const a = microphone("A"); audio.requests[0].resolve({ stream: a.stream, error: null }); await first;
      runtime.render(() => hook());
      audio.prefs = { ...audio.prefs, inputId: "B" }; runtime.render(() => hook());
      audio.prefs = { ...audio.prefs, inputId: "C" }; mic = runtime.render(() => hook());
      expect(mic.listening).toBe(false);
      expect(audio.requests).toHaveLength(2);
      const b = microphone("B");
      if (outcome === "success") audio.requests[1].resolve({ stream: b.stream, error: null });
      else if (outcome === "refusal") audio.requests[1].resolve({ stream: null, error: "B is unavailable" });
      else audio.requests[1].reject(new Error("B failed"));
      await settle();
      expect(audio.requests).toHaveLength(3);
      expect(audio.requests[2].prefs.inputId).toBe("C");
      expect(b.stop).toHaveBeenCalledTimes(outcome === "success" ? 1 : 0);
      const waiting = mic.start(); // joins the reconciled opening
      const c = microphone("C"); audio.requests[2].resolve({ stream: c.stream, error: null });
      await expect(waiting).resolves.toBe(true);
      mic = runtime.render(() => hook());
      expect(mic.listening).toBe(true); expect(mic.error).toBeNull();
      expect(audio.sources).toEqual(["A", "C"]);
      expect(a.stop).toHaveBeenCalledOnce(); expect(c.stop).not.toHaveBeenCalled();
    });

    it("keeps initial callers waiting until the latest input and monitoring choice opens", async () => {
      const mic = runtime.render(() => hook());
      const first = mic.start(); const second = mic.start();
      audio.prefs = { inputId: "C", monitoring: "speakers" }; runtime.render(() => hook());
      const stale = microphone("A"); audio.requests[0].resolve({ stream: stale.stream, error: null }); await settle();
      expect(audio.requests).toHaveLength(2);
      expect(audio.requests[1].prefs).toEqual({ inputId: "C", monitoring: "speakers" });
      expect(stale.stop).toHaveBeenCalledOnce();
      const latest = microphone("C"); audio.requests[1].resolve({ stream: latest.stream, error: null });
      expect(await Promise.all([first, second])).toEqual([true, true]);
      expect(audio.sources).toEqual(["C"]);
    });

    it.each(["stop", "unmount"])("does not reopen newer preferences after %s", async (action) => {
      const mic = runtime.render(() => hook()); const first = mic.start();
      audio.prefs = { ...audio.prefs, inputId: "C" }; runtime.render(() => hook());
      if (action === "stop") mic.stop(); else runtime.unmount();
      const old = microphone("A"); audio.requests[0].resolve({ stream: old.stream, error: null });
      await expect(first).resolves.toBe(false);
      expect(audio.requests).toHaveLength(1); expect(old.stop).toHaveBeenCalledOnce();
    });

    it("does not reopen an already-current stream when React observes the preference change later", async () => {
      const mic = runtime.render(() => hook()); const first = mic.start();
      audio.prefs = { inputId: "C", monitoring: "speakers" };
      const old = microphone("A"); audio.requests[0].resolve({ stream: old.stream, error: null }); await settle();
      const current = microphone("C"); audio.requests[1].resolve({ stream: current.stream, error: null });
      await expect(first).resolves.toBe(true);
      const active = runtime.render(() => hook());
      expect(active.listening).toBe(true);
      expect(audio.requests).toHaveLength(2);
      expect(current.stop).not.toHaveBeenCalled();
    });

    it("preserves C through B's actual overconstrained fallback and applies C's echo settings", async () => {
      audio.actualMic = true;
      audio.prefs = { inputId: "B", monitoring: "headphones" };
      let reject!: (error: unknown) => void;
      const fallback = microphone("default"); const current = microphone("C");
      const getUserMedia = vi.fn()
        .mockReturnValueOnce(new Promise((_resolve, no) => { reject = no; }))
        .mockResolvedValueOnce(fallback.stream)
        .mockResolvedValueOnce(current.stream);
      vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
      const mic = runtime.render(() => hook()); const first = mic.start();
      audio.prefs = { inputId: "C", monitoring: "speakers" }; runtime.render(() => hook());
      reject({ name: "OverconstrainedError" });
      await expect(first).resolves.toBe(true);
      runtime.render(() => hook());
      expect(audio.prefs).toEqual({ inputId: "C", monitoring: "speakers" });
      expect(audio.sources).toEqual(["C"]);
      expect(fallback.stop).toHaveBeenCalledOnce(); expect(current.stop).not.toHaveBeenCalled();
      expect(getUserMedia).toHaveBeenCalledTimes(3);
      expect(getUserMedia.mock.calls[2][0].audio).toMatchObject({ deviceId: { exact: "C" }, echoCancellation: true });
    });

    it("settles after an unavailable device falls back to the default", async () => {
      const mic = runtime.render(() => hook()); const first = mic.start();
      audio.prefs = { ...audio.prefs, inputId: "" }; runtime.render(() => hook());
      const fallback = microphone("default"); audio.requests[0].resolve({ stream: fallback.stream, error: null }); await settle();
      expect(audio.requests).toHaveLength(2);
      expect(audio.requests[1].prefs.inputId).toBe("");
      const current = microphone("default"); audio.requests[1].resolve({ stream: current.stream, error: null });
      await expect(first).resolves.toBe(true); await settle();
      expect(audio.requests).toHaveLength(2);
    });
  });
}
