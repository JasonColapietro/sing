import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProgressState } from "./progress-shape";

vi.mock("./pro", () => ({ getProState: () => ({ active: true, proKey: "test-key" }) }));

function record(id: string): ProgressState {
  return {
    xp: 10,
    sessions: [{ id, type: "pitch", day: "2026-10-10", date: "2026-10-10T12:00:00Z", durationSec: 60, xp: 10 }],
    streak: { current: 1, best: 1, lastDay: "2026-10-10" },
    range: {},
    rangeHistory: [],
    achievements: [],
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

async function setup() {
  vi.resetModules();
  const storage = new Map<string, string>();
  const events = new Map<string, ((event: { key: string | null }) => void)[]>();
  const localStorage = {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { storage.set(key, value); }),
  };
  vi.stubGlobal("window", {
    localStorage,
    setTimeout: (...args: Parameters<typeof setTimeout>) => setTimeout(...args),
    clearTimeout: (timer: ReturnType<typeof setTimeout>) => clearTimeout(timer),
    addEventListener: (name: string, callback: (event: { key: string | null }) => void) => {
      events.set(name, [...(events.get(name) ?? []), callback]);
    },
  });
  const [progress, cloud, backup, sync] = await Promise.all([
    import("./progress"), import("./progress-cloud"), import("./account-backup"), import("./sync"),
  ]);
  progress.importProgress(JSON.stringify(record("local")));
  return { storage, events, localStorage, progress, cloud, backup, sync };
}

type Setup = Awaited<ReturnType<typeof setup>>;
type Client = "account" | "pro";
const run = (client: Client, env: Setup) => client === "account"
  ? env.backup.reconcileBackup()
  : env.sync.syncNow();
const lastKey = (client: Client) => client === "account" ? "suede-sing:backup:last" : "suede-sing:sync:last";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("browser-only progress reset", () => {
  it("pauses before progress subscribers run and keeps new practice local", async () => {
    const env = await setup();
    const observed: boolean[] = [];
    env.progress.subscribe(() => observed.push(env.cloud.getProgressCloudState().paused));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    env.progress.clearProgress();
    env.progress.logSession({ type: "pitch", durationSec: 60 });
    await env.backup.maybeBackup();
    await expect(env.backup.reconcileBackup()).rejects.toBeInstanceOf(env.cloud.ProgressCloudPausedError);
    await expect(env.sync.syncNow()).rejects.toBeInstanceOf(env.cloud.ProgressCloudPausedError);

    expect(observed).toEqual([true, true]);
    expect(env.progress.getState().sessions).toHaveLength(1);
    expect(fetchMock).not.toHaveBeenCalled();
    vi.resetModules();
    const fresh = await import("./progress-cloud");
    expect(fresh.getProgressCloudState().paused).toBe(true);
  });

  it("invalidates the previous operation even after pause followed by resume", async () => {
    const { cloud } = await setup();
    const before = cloud.requireProgressCloudGeneration();
    cloud.pauseProgressCloud();
    const paused = cloud.getProgressCloudState().generation;
    const reset = cloud.getProgressCloudState().resetGeneration;
    cloud.resumeProgressCloud();
    const resumed = cloud.requireProgressCloudGeneration();
    expect(new Set([before, paused, resumed]).size).toBe(3);
    expect(cloud.isProgressCloudGenerationCurrent(before)).toBe(false);
    expect(cloud.isProgressCloudGenerationCurrent(resumed)).toBe(true);
    expect(cloud.getProgressCloudState().resetGeneration).toBe(reset);
  });

  it("keeps a memory-only pause when storage is blocked and old bytes become readable", async () => {
    const { cloud, localStorage } = await setup();
    localStorage.getItem.mockImplementation(() => { throw new Error("blocked"); });
    localStorage.setItem.mockImplementation(() => { throw new Error("blocked"); });
    cloud.pauseProgressCloud();
    const paused = cloud.getProgressCloudState();
    localStorage.getItem.mockImplementation(() => null);
    expect(cloud.getProgressCloudState()).toEqual(paused);
    expect(cloud.captureProgressCloudGeneration()).toBeNull();
  });

  it.each([false, true])("retains new in-memory practice through resume and sync when storage writes fail (reads blocked=%s)", async (blockReads) => {
    const env = await setup();
    if (blockReads) env.localStorage.getItem.mockImplementation(() => { throw new Error("blocked"); });
    env.localStorage.setItem.mockImplementation(() => { throw new Error("quota"); });
    env.progress.clearProgress();
    env.progress.logSession({ type: "pitch", durationSec: 90, detail: "after reset" });
    const local = env.progress.getState();
    const writes: ProgressState[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      if (body.state) writes.push(body.state);
      return Response.json(body.state ? { ok: true } : { state: record("remote") });
    }));

    env.cloud.resumeProgressCloud();
    await env.sync.syncNow();
    expect(env.progress.getState().sessions.map(({ id }) => id)).toContain(local.sessions[0].id);
    expect(writes[0].sessions.map(({ id }) => id).sort()).toEqual([local.sessions[0].id, "remote"].sort());
  });

  it("retries persisting the pause after clearing a quota-filling progress record", async () => {
    const env = await setup();
    env.localStorage.setItem.mockImplementationOnce(() => { throw new Error("quota"); });
    env.progress.clearProgress();
    expect(JSON.parse(env.storage.get(env.cloud.PROGRESS_CLOUD_STORAGE_KEY)!)).toMatchObject({ paused: true });
    expect(env.progress.getState().sessions).toEqual([]);
  });

  it("reloads another tab's cleared progress before its storage event arrives", async () => {
    const env = await setup();
    env.storage.set(env.cloud.PROGRESS_CLOUD_STORAGE_KEY, JSON.stringify({ paused: true, generation: "other-tab-reset" }));
    env.storage.set(env.progress.PROGRESS_STORAGE_KEY, JSON.stringify({ ...record("old"), xp: 0, sessions: [] }));
    expect(env.progress.getState().sessions).toEqual([]);
  });

  it("does not revive an unsaved old record after another tab resets", async () => {
    const env = await setup();
    env.localStorage.setItem.mockImplementationOnce(() => { throw new Error("quota"); });
    env.progress.logSession({ type: "pitch", durationSec: 90 });
    expect(env.progress.getState().sessions).toHaveLength(2);
    env.storage.set(env.cloud.PROGRESS_CLOUD_STORAGE_KEY, JSON.stringify({ paused: true, generation: "other-tab-reset" }));
    env.storage.set(env.progress.PROGRESS_STORAGE_KEY, JSON.stringify({ ...record("old"), xp: 0, sessions: [] }));
    expect(env.progress.getState().sessions).toEqual([]);
    env.progress.logSession({ type: "pitch", durationSec: 30 });
    expect(env.progress.getState().sessions).toHaveLength(1);
  });

  it("keeps unsaved post-reset practice when another tab only resumes", async () => {
    const env = await setup();
    env.progress.clearProgress();
    const paused = env.cloud.getProgressCloudState();
    env.localStorage.setItem.mockImplementationOnce(() => { throw new Error("quota"); });
    env.progress.logSession({ type: "pitch", durationSec: 90, detail: "new practice" });
    const local = env.progress.getState();
    env.storage.set(env.cloud.PROGRESS_CLOUD_STORAGE_KEY, JSON.stringify({
      ...paused, paused: false, generation: "other-tab-resume",
    }));
    expect(env.progress.getState()).toBe(local);
    expect(env.progress.getState().sessions).toHaveLength(1);
  });

  it("notices another tab's erase even if that tab resumed before the next read", async () => {
    const env = await setup();
    env.localStorage.setItem.mockImplementationOnce(() => { throw new Error("quota"); });
    env.progress.logSession({ type: "pitch", durationSec: 90 });
    env.storage.set(env.cloud.PROGRESS_CLOUD_STORAGE_KEY, JSON.stringify({
      paused: false, generation: "other-tab-resume", resetGeneration: "other-tab-reset",
    }));
    env.storage.set(env.progress.PROGRESS_STORAGE_KEY, JSON.stringify({ ...record("old"), xp: 0, sessions: [] }));
    expect(env.progress.getState().sessions).toEqual([]);
  });
});

describe.each<Client>(["account", "pro"])("%s cloud operation fencing", (client) => {
  it.each([false, true])("does not restore a pending response after erase (resume=%s)", async (resume) => {
    const env = await setup();
    const pull = deferred<Response>();
    const fetchMock = vi.fn(() => pull.promise);
    vi.stubGlobal("fetch", fetchMock);
    const result = run(client, env).catch((error: unknown) => error);

    env.progress.clearProgress();
    if (resume) env.cloud.resumeProgressCloud();
    pull.resolve(Response.json({ state: record("remote") }));

    expect(await result).toBeInstanceOf(env.cloud.ProgressCloudInterruptedError);
    expect(env.progress.getState().sessions).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(env.storage.has(lastKey(client))).toBe(false);
  });

  it("observes another tab's reset without waiting for a storage event", async () => {
    const env = await setup();
    const pull = deferred<Response>();
    const fetchMock = vi.fn(() => pull.promise);
    vi.stubGlobal("fetch", fetchMock);
    const result = run(client, env).catch((error: unknown) => error);
    env.storage.set(env.cloud.PROGRESS_CLOUD_STORAGE_KEY, JSON.stringify({ paused: true, generation: "other-tab-reset" }));
    pull.resolve(Response.json({ state: record("remote") }));

    expect(await result).toBeInstanceOf(env.cloud.ProgressCloudInterruptedError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(env.progress.getState().sessions.map(({ id }) => id)).toEqual(["local"]);
  });

  it("does not push if a subscriber resets during the merge", async () => {
    const env = await setup();
    const fetchMock = vi.fn(async () => Response.json({ state: record("remote") }));
    vi.stubGlobal("fetch", fetchMock);
    let reset = false;
    env.progress.subscribe(() => {
      if (reset) return;
      reset = true;
      env.progress.clearProgress();
    });

    await expect(run(client, env)).rejects.toBeInstanceOf(env.cloud.ProgressCloudInterruptedError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(env.progress.getState().sessions).toEqual([]);
  });

  it("ignores a completed in-flight write after reset and resume", async () => {
    const env = await setup();
    const push = deferred<Response>();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ state: record("remote") }))
      .mockImplementationOnce(() => push.promise);
    vi.stubGlobal("fetch", fetchMock);
    const result = run(client, env).catch((error: unknown) => error);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const sent = JSON.parse(String((fetchMock.mock.calls[1][1] as RequestInit).body));
    expect(sent.state.sessions).toHaveLength(2);

    env.progress.clearProgress();
    env.cloud.resumeProgressCloud();
    push.resolve(Response.json({ ok: true, savedAt: "2026-10-11T12:00:00Z" }));

    expect(await result).toBeInstanceOf(env.cloud.ProgressCloudInterruptedError);
    expect(env.storage.has(lastKey(client))).toBe(false);
    expect(env.progress.getState().sessions).toEqual([]);
  });
});

describe("Pro background sync", () => {
  it("cancels an already queued push when progress is erased", async () => {
    vi.useFakeTimers();
    const env = await setup();
    env.storage.set("suede-sing:sync:last", new Date().toISOString());
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    env.sync.startAutoSync();
    env.progress.logSession({ type: "pitch", durationSec: 60 });
    env.progress.clearProgress();
    await vi.advanceTimersByTimeAsync(45_000);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps future practice subscribed when the page starts paused", async () => {
    vi.useFakeTimers();
    const env = await setup();
    env.progress.clearProgress();
    const fetchMock = vi.fn(async () => Response.json({ state: null, ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    env.sync.startAutoSync();
    expect(fetchMock).not.toHaveBeenCalled();
    env.cloud.resumeProgressCloud();
    env.progress.logSession({ type: "pitch", durationSec: 60 });
    await vi.advanceTimersByTimeAsync(45_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(env.storage.has("suede-sing:sync:last")).toBe(true);
  });
});
