import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./pro", () => ({ getProState: () => ({ active: true, proKey: "test-key" }) }));

const ERROR_KEY = "suede-sing:sync:error";

/**
 * A mounted page (components/progress/sync-controls.tsx) reads the sync status
 * once; these pin that a background refusal, a later success and another
 * tab's write all reach it through subscribeSyncStatus.
 */
async function setup(response: { ok: boolean; status: number; body: unknown }) {
  vi.resetModules();
  const storage = new Map<string, string>();
  const listeners = new Map<string, Set<(event: { key: string | null }) => void>>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => void storage.set(key, value),
      removeItem: (key: string) => void storage.delete(key),
    },
    setTimeout: (...args: Parameters<typeof setTimeout>) => setTimeout(...args),
    clearTimeout: (timer: ReturnType<typeof setTimeout>) => clearTimeout(timer),
    addEventListener: (name: string, fn: (event: { key: string | null }) => void) => {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name)!.add(fn);
    },
    removeEventListener: (name: string, fn: (event: { key: string | null }) => void) => {
      listeners.get(name)?.delete(fn);
    },
  });
  vi.stubGlobal("fetch", vi.fn(async () => ({
    ok: response.ok,
    status: response.status,
    json: async () => response.body,
  })));
  const sync = await import("./sync");
  const fireStorage = (key: string | null) => {
    for (const fn of listeners.get("storage") ?? []) fn({ key });
  };
  return { storage, sync, fireStorage, storageListeners: () => listeners.get("storage")?.size ?? 0 };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("sync status subscription", () => {
  it("tells a mounted page when a background sync is refused", async () => {
    const env = await setup({ ok: false, status: 413, body: { error: "Your record is over the sync limit." } });
    const seen: (string | null)[] = [];
    env.sync.subscribeSyncStatus(() => seen.push(env.sync.lastSyncError()));
    env.sync.startAutoSync();
    await vi.waitFor(() => expect(seen).toContain("Your record is over the sync limit."));
  });

  it("clears a stale warning on the page when a later sync succeeds", async () => {
    const env = await setup({ ok: true, status: 200, body: { state: null } });
    env.storage.set(ERROR_KEY, "Old refusal");
    const seen: (string | null)[] = [];
    env.sync.subscribeSyncStatus(() => seen.push(env.sync.lastSyncError()));
    await env.sync.syncNow();
    expect(seen.at(-1)).toBeNull();
    expect(env.sync.lastSyncError()).toBeNull();
  });

  it("follows another tab's writes to the sync keys and stops after unsubscribe", async () => {
    const env = await setup({ ok: true, status: 200, body: { state: null } });
    const listener = vi.fn();
    const unsubscribe = env.sync.subscribeSyncStatus(listener);
    env.fireStorage("unrelated-key");
    expect(listener).not.toHaveBeenCalled();
    env.fireStorage(ERROR_KEY);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    expect(env.storageListeners()).toBe(0);
    env.fireStorage(ERROR_KEY);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
