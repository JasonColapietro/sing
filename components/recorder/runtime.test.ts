import { afterEach, describe, expect, it, vi } from "vitest";
import { createRecorderMic, startRecorder, createTakeMutations } from "./runtime";
import type { TakeRecord, TakesStore } from "./db";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function microphone() {
  // A track is an EventTarget: an unplugged mic fires "ended" on it.
  const track = Object.assign(new EventTarget(), { kind: "audio", readyState: "live", stop: vi.fn() });
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] } as unknown as MediaStream;
  const source = { connect: vi.fn(), disconnect: vi.fn() };
  const analyser = {} as AnalyserNode;
  const context = {
    createMediaStreamSource: () => source,
    createAnalyser: () => analyser,
  } as unknown as AudioContext;
  return { track, stream, source, analyser, context };
}

afterEach(() => vi.unstubAllGlobals());

describe("recorder microphone ownership", () => {
  it("releases permission granted after the recorder has been left", async () => {
    const mic = microphone();
    const permission = deferred<{ stream: MediaStream; error: null }>();
    const session = createRecorderMic(() => permission.promise, () => mic.context);
    const opening = session.start();
    session.dispose();
    permission.resolve({ stream: mic.stream, error: null });
    expect(await opening).toBeNull();
    expect(mic.track.stop).toHaveBeenCalledOnce();
    expect(session.getStream()).toBeNull();
  });

  it("shares an outstanding prompt and one stream between repeated presses", async () => {
    const mic = microphone();
    const permission = deferred<{ stream: MediaStream; error: null }>();
    const open = vi.fn(() => permission.promise);
    const session = createRecorderMic(open, () => mic.context);
    const first = session.start();
    const second = session.start();
    expect(open).toHaveBeenCalledOnce();
    permission.resolve({ stream: mic.stream, error: null });
    expect(await first).toEqual({ analyser: mic.analyser, error: null });
    expect(await second).toEqual(await first);
    session.dispose();
    expect(mic.track.stop).toHaveBeenCalledOnce();
    expect(mic.source.disconnect).toHaveBeenCalledOnce();
  });

  it("releases the acquired stream and allows retry if audio setup fails", async () => {
    const mic = microphone();
    const context = vi.fn().mockImplementationOnce(() => { throw new Error("closed context"); }).mockReturnValue(mic.context);
    const session = createRecorderMic(async () => ({ stream: mic.stream, error: null }), context);
    expect((await session.start())?.error).toMatch(/microphone.*try again/i);
    expect(mic.track.stop).toHaveBeenCalledOnce();
    expect(session.getStream()).toBeNull();
    expect((await session.start())?.error).toBeNull();
  });

  it("lets go of a microphone that ends on its own, and opens a fresh one on the next start", async () => {
    // An unplugged USB mic or a dropped headset: the recorder used to sit on
    // "Ready" with REC live on a stream that could record nothing.
    const first = microphone();
    const second = microphone();
    const open = vi
      .fn()
      .mockResolvedValueOnce({ stream: first.stream, error: null })
      .mockResolvedValueOnce({ stream: second.stream, error: null });
    const onEnded = vi.fn();
    const session = createRecorderMic(open, () => first.context, { onEnded });
    expect((await session.start())?.error).toBeNull();
    first.track.dispatchEvent(new Event("ended"));
    expect(onEnded).toHaveBeenCalledOnce();
    expect(session.getStream()).toBeNull();
    expect(first.source.disconnect).toHaveBeenCalledOnce();
    expect((await session.start())?.error).toBeNull();
    expect(open).toHaveBeenCalledTimes(2);
    expect(session.getStream()).toBe(second.stream);
    // The page's own release never reports itself as the mic going away.
    session.dispose();
    second.track.dispatchEvent(new Event("ended"));
    expect(onEnded).toHaveBeenCalledOnce();
  });
});

class FakeRecorder {
  static fail: "constructor" | "start" | null = null;
  static instance: FakeRecorder;
  static isTypeSupported = () => true;
  state = "inactive";
  mimeType = "audio/webm";
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor() {
    if (FakeRecorder.fail === "constructor") throw new Error("unsupported");
    FakeRecorder.instance = this;
  }
  start() {
    if (FakeRecorder.fail === "start") throw new Error("inactive input");
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["voice"]) });
    this.onstop?.();
  }
}

describe("recorder capture failures", () => {
  it.each(["constructor", "start"] as const)("reports %s failures without leaving a running capture", (failure) => {
    FakeRecorder.fail = failure;
    vi.stubGlobal("MediaRecorder", FakeRecorder);
    const onStop = vi.fn();
    const result = startRecorder({} as MediaStream, { onData: vi.fn(), onStop, onError: vi.fn() });
    expect(result.recorder).toBeNull();
    expect(result.error).toMatch(/recording.*try again/i);
    expect(onStop).not.toHaveBeenCalled();
  });

  it("reports an interrupted recording and retains the final audio chunk", () => {
    FakeRecorder.fail = null;
    vi.stubGlobal("MediaRecorder", FakeRecorder);
    const chunks: Blob[] = [];
    const onError = vi.fn();
    const onStop = vi.fn();
    const result = startRecorder({} as MediaStream, { onData: (blob) => chunks.push(blob), onStop, onError });
    expect(result.error).toBeNull();
    FakeRecorder.instance.onerror?.();
    FakeRecorder.instance.stop();
    expect(onError).toHaveBeenCalledOnce();
    expect(chunks).toHaveLength(1);
    expect(onStop).toHaveBeenCalledWith("audio/webm");
  });
});

describe("take mutation ordering", () => {
  it("ignores save retries during and after deletion so they cannot restore the take", async () => {
    const take = { id: "one" } as TakeRecord;
    const written = new Map([[take.id, take]]);
    const deleting = deferred<void>();
    const mutations = createTakeMutations(async () => ({
      persistent: true, getAll: async () => [...written.values()],
      put: async (value) => { written.set(value.id, value); },
      remove: async (id) => { await deleting.promise; written.delete(id); },
    }));
    const removal = mutations.remove(take.id);
    const retry = mutations.put(take);
    deleting.resolve();
    await Promise.all([removal, retry]);
    await mutations.put(take);
    expect(written.has(take.id)).toBe(false);
  });

  it("does not resurrect a take when a pending write finishes after delete", async () => {
    const written = new Map<string, TakeRecord>();
    const pending = deferred<void>();
    const store: TakesStore = {
      persistent: true, getAll: async () => [...written.values()],
      put: async (take) => { await pending.promise; written.set(take.id, take); },
      remove: async (id) => { written.delete(id); },
    };
    const mutations = createTakeMutations(async () => store);
    const save = mutations.put({ id: "one" } as TakeRecord);
    const remove = mutations.remove("one");
    await Promise.resolve();
    await Promise.resolve();
    pending.resolve();
    await Promise.all([save, remove]);
    expect(written.size).toBe(0);
  });

  it("lets a failed save be retried and makes delete wait for an in-flight save", async () => {
    const written = new Map<string, TakeRecord>();
    const first = deferred<void>();
    let attempts = 0;
    const store: TakesStore = {
      persistent: true,
      getAll: async () => [...written.values()],
      put: async (take) => {
        attempts += 1;
        if (attempts === 1) await first.promise;
        written.set(take.id, take);
      },
      remove: async (id) => { written.delete(id); },
    };
    const mutations = createTakeMutations(async () => store);
    const take = { id: "one" } as TakeRecord;
    const failed = mutations.put(take);
    const retry = mutations.put(take);
    const deletion = mutations.remove(take.id);
    const failure = expect(failed).rejects.toThrow("full");
    first.reject(new Error("full"));
    await failure;
    await retry;
    await deletion;
    expect(written.size).toBe(0);
    expect(attempts).toBe(2);
  });

  it("rejects deletion failure so the caller can keep the downloadable take", async () => {
    const mutations = createTakeMutations(async () => ({
      persistent: true, getAll: async () => [], put: async () => {},
      remove: async () => { throw new Error("unavailable"); },
    }));
    await expect(mutations.remove("one")).rejects.toThrow("unavailable");
  });
});
