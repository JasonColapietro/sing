/**
 * Free-tier backup round trip, against a REAL Upstash instance.
 *
 * Everything else about this feature is unit-tested with the store mocked,
 * which proves the handler's branches but not the thing that actually matters:
 * that signing in on a second device folds the stored record into local
 * practice instead of replacing it. mergeRemoteProgress is only commutative
 * and idempotent if the bytes that survive a real Redis round trip still say
 * what they said going in, so this exercises the real handlers, the real
 * client, and the real store.
 *
 * SKIPPED without credentials, which is how CI sees it - a suite that silently
 * needs secrets is worse than one that says it is skipping. To run it:
 *   set -a; . ./.env.local; set +a; npx vitest run lib/account-backup.test.ts
 *
 * It writes one key under a DELETE_ME user id and removes it in afterAll.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const TEST_USER = "user_integrationRoundTrip_DELETE_ME";
// lib/redis.ts imports "server-only", which vitest resolves to the build that
// throws outside a Server Component. Stub it; we want the real Redis client.
vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: TEST_USER }) }));

// localStorage shim so the "use client" modules load under node.
class Store {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
const storage = new Store();
// @ts-expect-error test shim
globalThis.window = { localStorage: storage, addEventListener() {} };
// @ts-expect-error test shim
globalThis.localStorage = storage;

const { GET, PUT } = await import("../app/api/account/progress/route");
const { getRedis } = await import("./redis");

// Route the client's fetch() at the real handlers.
//
// Keep the real fetch for everything else: Upstash's client uses fetch too, and
// a blanket override sends its REST calls into this shim, which answers with
// the app's own error JSON and surfaces as a bogus UpstashError.
let call_n = 0;
const realFetch = globalThis.fetch.bind(globalThis);
// @ts-expect-error test shim
globalThis.fetch = async (url: string, init: RequestInit = {}) => {
  if (!String(url).includes("/api/account/progress")) return realFetch(url, init);
  // The route rate-limits 30/window per forwarded IP. A shim with no IP puts
  // every call in one bucket, so vary it per call.
  const headers = new Headers(init.headers as HeadersInit);
  headers.set("x-forwarded-for", `203.0.113.${++call_n % 250}`);
  const req = new Request("https://sing.suedeai.ai/api/account/progress", {
    method: init.method ?? "GET",
    headers,
    body: init.body as BodyInit,
  });
  return (init.method === "PUT" ? PUT(req) : GET(req)) as Promise<Response>;
};

const progress = await import("./progress");
const backup = await import("./account-backup");

const iso = (n: number) => new Date(Date.UTC(2026, 7, 21 - n)).toISOString();
const session = (id: string, n: number) => ({
  id, type: "warmup" as const, date: iso(n), day: iso(n).slice(0, 10),
  durationSec: 300, score: 80, xp: 40,
});
function writeLocal(ids: [string, number][], xp: number, streak: number) {
  // importProgress is the exported path that writes storage AND refreshes the
  // module cache, which a bare setItem would not do.
  const ok = progress.importProgress(JSON.stringify({
    xp, sessions: ids.map(([i, n]) => session(i, n)),
    streak: { current: streak, best: streak, lastDay: iso(0).slice(0, 10) },
    range: { lowMidi: 48, highMidi: 69, voiceType: "baritone", voiceTypeLabel: "Baritone", testedAt: iso(2) },
    rangeHistory: [], achievements: ["first-session"],
  }));
  if (!ok) throw new Error("seed rejected by importProgress");
}

/**
 * A fresh browser holding `ids` and nothing else. The clear() matters as much
 * as the write: it drops "suede-sing:backup:last", which is what decides
 * whether maybeBackup() is inside its throttle window.
 */
function seed(ids: [string, number][], xp: number, streak: number) {
  storage.clear();
  writeLocal(ids, xp, streak);
}

const CONFIGURED = Boolean(
  (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL) &&
    (process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN),
);

describe.skipIf(!CONFIGURED)("free backup round trip against real Redis", () => {
  beforeEach(() => storage.clear());

  afterAll(async () => {
    const r = getRedis();
    if (r) { await r.del(`account:progress:${TEST_USER}`); console.log("cleaned up test key"); }
  });

  it("stores and returns the record", async () => {
    expect(getRedis(), "REAL Redis must be configured for this test").not.toBeNull();
    seed([["a", 1], ["b", 2], ["c", 3]], 1200, 4);
    const savedAt = await backup.backupNow();
    expect(savedAt).toBeTruthy();
    const remote = await backup.fetchBackup();
    expect(remote.state).not.toBeNull();
    expect(remote.state!.sessions.map((s) => s.id).sort()).toEqual(["a", "b", "c"]);
  });

  it("NEVER loses practice done signed out on another device", async () => {
    // Device B: different local work, has never seen a/b/c.
    seed([["d", 0], ["e", 1]], 300, 1);
    const before = progress.getState().sessions.map((s) => s.id).sort();
    expect(before).toEqual(["d", "e"]);

    const { restored } = await backup.reconcileBackup();
    expect(restored).toBe(true);

    const after = progress.getState().sessions.map((s) => s.id).sort();
    // The whole point: the union, not a replacement in either direction.
    expect(after).toEqual(["a", "b", "c", "d", "e"]);

    // And the push half means the next restore cannot lose d/e.
    const remote = await backup.fetchBackup();
    expect(remote.state!.sessions.map((s) => s.id).sort()).toEqual(["a", "b", "c", "d", "e"]);
  });

  /**
   * The regression that shipped: every test above drives reconcileBackup(),
   * but AccountBackupSync only calls that once per browser per account. Every
   * later visit lands on maybeBackup(), which used to be a bare PUT of this
   * device's state — so the device that reconciled longest ago quietly erased
   * everything the others had backed up since.
   */
  it("a background refresh cannot erase another device's backup", async () => {
    // What the account holds, from some other device.
    seed([["p", 1], ["q", 2]], 800, 3);
    await backup.backupNow();

    // This device: different practice, and it reconciled with the account long
    // enough ago that AccountBackupSync sends it straight past the merge.
    seed([["z", 0]], 100, 1);
    await backup.maybeBackup();

    const remote = await backup.fetchBackup();
    expect(remote.state!.sessions.map((s) => s.id).sort()).toEqual(["p", "q", "z"]);
  });

  it("still leaves the stored copy alone inside the throttle window", async () => {
    seed([["t", 0]], 100, 1);
    await backup.backupNow();
    const before = await backup.fetchBackup();

    // New local work, but no clear(), so the throttle key from the push above
    // survives and this refresh is inside the window.
    writeLocal([["t", 0], ["u", 1]], 200, 2);
    await backup.maybeBackup();

    const after = await backup.fetchBackup();
    expect(after.savedAt).toBe(before.savedAt);
    expect(after.state!.sessions.map((s) => s.id)).not.toContain("u");
  });

  it("is idempotent - reconciling twice changes nothing", async () => {
    seed([["d", 0], ["e", 1]], 300, 1);
    await backup.reconcileBackup();
    const once = progress.getState().sessions.map((s) => s.id).sort();
    await backup.reconcileBackup();
    const twice = progress.getState().sessions.map((s) => s.id).sort();
    expect(twice).toEqual(once);
  });
});
