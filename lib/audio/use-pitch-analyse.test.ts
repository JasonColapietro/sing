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

const track = { stop: vi.fn() };
const stream = { getTracks: () => [track], getAudioTracks: () => [track] } as unknown as MediaStream;

vi.mock("./mic", () => ({
  MIC_ENDED_MESSAGE: "The microphone stopped.",
  openMic: async () => ({ stream, error: null }),
  watchMicEnd: () => () => {},
}));
vi.mock("./devices", () => ({
  useAudioPrefs: () => ({ inputId: null, monitoring: false }),
  getAudioPrefs: () => ({ inputId: "", monitoring: "headphones" }),
}));
vi.mock("./context", () => ({
  getAudioContext: () => ({
    sampleRate: 48000,
    createMediaStreamSource: () => ({ connect: () => {}, disconnect: () => {} }),
    createAnalyser: () => ({
      fftSize: 2048,
      // A steady A3, loud and clean, so every frame has a pitch.
      getFloatTimeDomainData: (buf: Float32Array) => {
        for (let i = 0; i < buf.length; i++) buf[i] = 0.3 * Math.sin((2 * Math.PI * 220 * i) / 48000);
      },
    }),
  }),
}));

import { EMPTY_FRAME, usePitch } from "./use-pitch";

/** The page's animation frames: queued, and run one round at a time. */
let frames = new Map<number, FrameRequestCallback>();
let nextId = 1;
function tick(rounds = 1) {
  for (let r = 0; r < rounds; r++) {
    const due = frames;
    frames = new Map();
    for (const cb of due.values()) cb(performance.now());
  }
}

beforeEach(() => {
  runtime.reset();
  frames = new Map();
  nextId = 1;
  track.stop.mockClear();
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    const id = nextId++;
    frames.set(id, cb);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("window", {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("usePitch with analysis paused", () => {
  it("keeps the stream open but runs no analysis and makes no per-frame update", async () => {
    // The ear workout holds one stream from its first singing step to its
    // results; through Interval ID, Higher or lower and the slides it used to
    // re-render on every animation frame.
    let pitch = runtime.render(() => usePitch({ analyse: true }));
    expect(await pitch.start()).toBe(true);
    pitch = runtime.render(() => usePitch({ analyse: true }));
    expect(pitch.listening).toBe(true);

    const before = runtime.counts.stateUpdates;
    tick(5);
    expect(runtime.counts.stateUpdates - before).toBe(5);
    expect(pitch.latest.current.freq).not.toBeNull();

    pitch = runtime.render(() => usePitch({ analyse: false }));
    expect(frames.size).toBe(0);
    expect(pitch.latest.current).toBe(EMPTY_FRAME);
    expect(pitch.frame).toBe(EMPTY_FRAME);
    const paused = runtime.counts.stateUpdates;
    tick(60);
    expect(runtime.counts.stateUpdates).toBe(paused);
    // Still open: no new permission prompt when a singing step comes back.
    expect(pitch.listening).toBe(true);
    expect(pitch.getStream()).toBe(stream);
    expect(track.stop).not.toHaveBeenCalled();

    pitch = runtime.render(() => usePitch({ analyse: true }));
    expect(frames.size).toBe(1);
    tick(3);
    expect(runtime.counts.stateUpdates - paused).toBe(3);
    expect(pitch.latest.current.freq).not.toBeNull();
  });

  it("opens a stream without analysing it until analysis is asked for", async () => {
    let pitch = runtime.render(() => usePitch({ analyse: false }));
    await pitch.start();
    pitch = runtime.render(() => usePitch({ analyse: false }));
    expect(pitch.listening).toBe(true);
    expect(frames.size).toBe(0);
    pitch = runtime.render(() => usePitch({ analyse: true }));
    expect(frames.size).toBe(1);
  });

  it("resumes nothing once the stream is stopped", async () => {
    let pitch = runtime.render(() => usePitch({ analyse: false }));
    await pitch.start();
    pitch = runtime.render(() => usePitch({ analyse: false }));
    pitch.stop();
    pitch = runtime.render(() => usePitch({ analyse: true }));
    expect(pitch.listening).toBe(false);
    expect(frames.size).toBe(0);
    expect(track.stop).toHaveBeenCalled();
  });

  it("analyses as before when the option is left out", async () => {
    let pitch = runtime.render(() => usePitch());
    await pitch.start();
    pitch = runtime.render(() => usePitch());
    expect(frames.size).toBe(1);
    tick(2);
    expect(pitch.latest.current.freq).not.toBeNull();
  });
});
