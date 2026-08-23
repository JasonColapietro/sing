"use client";

import { getProState } from "./pro";
import { getState, mergeRemoteProgress, subscribe } from "./progress";

/**
 * Cloud sync client. Pull-merge-push against /api/sync, authenticated by
 * the Pro key. The merge (lib/progress.ts) is commutative and idempotent,
 * so devices can sync in any order without losing work.
 */

const LAST_KEY = "suede-sing:sync:last";
const AUTO_SYNC_AFTER_MS = 30 * 60 * 1000;
const PUSH_DEBOUNCE_MS = 45 * 1000;

/** True while a sync-driven save is happening, so the change feed skips it. */
let applyingRemote = false;
let pushTimer: number | null = null;

async function post<T>(body: unknown): Promise<T> {
  const res = await fetch("/api/sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!res.ok) throw new Error(data?.error ?? "Sync failed. Try again.");
  if (!data) throw new Error("Sync returned an empty response.");
  return data;
}

export function lastSyncedAt(): string | null {
  try {
    return window.localStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}

function markSynced() {
  try {
    window.localStorage.setItem(LAST_KEY, new Date().toISOString());
  } catch {
    // storage unavailable — auto-sync just runs more often
  }
}

function proKeyOrNull(): string | null {
  const pro = getProState();
  return pro.active && pro.proKey ? pro.proKey : null;
}

/** Full pull → merge → push round trip. Throws with a readable message. */
export async function syncNow(): Promise<{ mergedRemote: boolean }> {
  const key = proKeyOrNull();
  if (!key) throw new Error("Cloud sync needs an active Pro subscription.");

  const remote = await post<{ state: unknown }>({ key });
  const hadRemote = remote.state !== null && remote.state !== undefined;
  if (hadRemote) {
    applyingRemote = true;
    try {
      mergeRemoteProgress(remote.state);
    } finally {
      applyingRemote = false;
    }
  }

  await post<{ ok: boolean }>({
    key,
    state: getState(),
    updatedAt: new Date().toISOString(),
  });
  markSynced();
  return { mergedRemote: hadRemote };
}

/**
 * The debounced write after local practice. Reconciles before it writes.
 *
 * This used to push without pulling, and `/api/sync` stores with an
 * unconditional `redis.set`, so the cloud copy became whichever device wrote
 * last rather than the union of all of them. The full round trip runs once per
 * page load and only when the last sync is over thirty minutes old, so a
 * long-lived tab pulled once and then overwrote every other device for the
 * rest of the day: practise on the phone at ten, practise on the laptop at
 * eleven, and the phone's ten o'clock session is gone from the cloud. It
 * survived only on the phone, until that phone cleared its storage.
 *
 * `lib/account-backup.ts` already worked this out and fixed it the same way —
 * for the *free* backup path. The paid one never got the fix, which is the
 * wrong way round.
 *
 * The merge in lib/progress.ts is a genuine commutative union, so pulling
 * first costs one GET and makes the write safe.
 */
async function pushOnly(): Promise<void> {
  const key = proKeyOrNull();
  if (!key) return;

  // A failed pull must not become a blind push — that is the exact overwrite
  // this function exists to avoid. Let it throw; the caller swallows it and the
  // next practice write tries again.
  const remote = await post<{ state: unknown }>({ key });
  if (remote.state !== null && remote.state !== undefined) {
    applyingRemote = true;
    try {
      mergeRemoteProgress(remote.state);
    } finally {
      applyingRemote = false;
    }
  }

  await post<{ ok: boolean }>({
    key,
    state: getState(),
    updatedAt: new Date().toISOString(),
  });
  markSynced();
}

/**
 * Called once per page load (from ProSync): a full round trip when the last
 * sync is stale, plus a debounced push whenever practice writes new data.
 * Every failure is swallowed — sync must never break practice.
 */
export function startAutoSync(): void {
  const key = proKeyOrNull();
  if (!key) return;

  const last = lastSyncedAt();
  if (!last || Date.now() - Date.parse(last) > AUTO_SYNC_AFTER_MS) {
    syncNow().catch(() => {});
  }

  subscribe(() => {
    if (applyingRemote || !proKeyOrNull()) return;
    if (pushTimer !== null) window.clearTimeout(pushTimer);
    pushTimer = window.setTimeout(() => {
      pushTimer = null;
      pushOnly().catch(() => {});
    }, PUSH_DEBOUNCE_MS);
  });
}
