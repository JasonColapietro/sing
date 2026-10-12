"use client";

import { getProState } from "./pro";
import { getState, mergeRemoteProgress, subscribe } from "./progress";
import { fitForCloud } from "./progress-cloud-fit";
import {
  assertProgressCloudGeneration,
  captureProgressCloudGeneration,
  requireProgressCloudGeneration,
  subscribeProgressCloud,
} from "./progress-cloud";

/**
 * Cloud sync client. Pull-merge-push against /api/sync, authenticated by
 * the Pro key. The merge (lib/progress.ts) is commutative and idempotent,
 * so devices can sync in any order without losing work.
 */

const LAST_KEY = "suede-sing:sync:last";
/** Why the last automatic sync was refused, until a sync succeeds. */
const ERROR_KEY = "suede-sing:sync:error";
const AUTO_SYNC_AFTER_MS = 30 * 60 * 1000;
const PUSH_DEBOUNCE_MS = 45 * 1000;

/** True while a sync-driven save is happening, so the change feed skips it. */
let applyingRemote = false;
let pushTimer: number | null = null;

/**
 * The sync route answered and said no: a lapsed purchase, a record over its
 * size limit, the store down. Unlike a dropped connection, trying again in
 * the background will not fix most of these, so the page has to say so.
 */
export class SyncRefusedError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SyncRefusedError";
    this.status = status;
  }
}

async function post<T>(body: unknown): Promise<T> {
  const res = await fetch("/api/sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!res.ok) throw new SyncRefusedError(data?.error ?? "Sync failed. Try again.", res.status);
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

function markSynced(at: string) {
  try {
    window.localStorage.setItem(LAST_KEY, at);
    window.localStorage.removeItem(ERROR_KEY);
  } catch {
    // storage unavailable — auto-sync just runs more often
  }
}

/**
 * Why the last automatic sync was refused, or null when the last one that
 * reached the route succeeded. The automatic syncs swallow their errors so
 * practice never breaks; this is how a refusal still reaches the page.
 */
export function lastSyncError(): string | null {
  try {
    return window.localStorage.getItem(ERROR_KEY);
  } catch {
    return null;
  }
}

/**
 * The automatic syncs' error handler. Keeps a refusal for the page to show;
 * a dropped connection, or a pause or reset that interrupted the round trip,
 * is left for the next attempt.
 */
function noteAutoSyncFailure(error: unknown): void {
  // A rate limit clears itself within the minute.
  if (!(error instanceof SyncRefusedError) || error.status === 429) return;
  try {
    window.localStorage.setItem(ERROR_KEY, error.message);
  } catch {
    // storage unavailable — the manual Sync now still shows the error
  }
}

function proKeyOrNull(): string | null {
  const pro = getProState();
  return pro.active && pro.proKey ? pro.proKey : null;
}

/** Full pull → merge → push round trip. Throws with a readable message. */
export async function syncNow(): Promise<{ mergedRemote: boolean }> {
  const generation = requireProgressCloudGeneration();
  const key = proKeyOrNull();
  if (!key) throw new Error("Cloud sync needs an active Pro subscription.");

  const remote = await post<{ state: unknown }>({ key });
  assertProgressCloudGeneration(generation);
  const hadRemote = remote.state !== null && remote.state !== undefined;
  if (hadRemote) {
    applyingRemote = true;
    try {
      mergeRemoteProgress(remote.state);
    } finally {
      applyingRemote = false;
    }
  }

  assertProgressCloudGeneration(generation);
  // The marker records when the pushed snapshot was read, not when the push
  // came back. startAutoSync treats any session dated after it as unsynced,
  // so a session logged while the push was in flight must not land before it.
  const snapshotAt = new Date().toISOString();
  // The route refuses a record over its size limit, which a daily-routine
  // singer's full log of per-note tallies passes; the oldest sessions' tallies
  // stay on this device and out of the push.
  const state = fitForCloud(getState());
  assertProgressCloudGeneration(generation);
  await post<{ ok: boolean }>({
    key,
    state,
    updatedAt: snapshotAt,
  });
  assertProgressCloudGeneration(generation);
  markSynced(snapshotAt);
  return { mergedRemote: hadRemote };
}

/**
 * The debounced write after local practice. Reconciles before it writes.
 *
 * This used to push without pulling, and `/api/sync` stores with an
 * unconditional `redis.set`, so the cloud copy became whichever device wrote
 * last rather than the union of all of them. The full round trip runs at most
 * once per page load, when the last sync is stale, so a
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
  if (!key || captureProgressCloudGeneration() === null) return;

  // A failed pull must not become a blind push — that is the exact overwrite
  // this function exists to avoid. Let it throw; the caller swallows it and the
  // next practice write tries again.
  await syncNow();
}

/**
 * True when this device holds a session logged after its last completed sync.
 *
 * The debounced push below is a window timer, and a timer dies with its tab.
 * Practise soon after a sync, close the tab inside the debounce, and that
 * session used to stay local until this device next loaded more than thirty
 * minutes after the sync, while the other device showed the streak at risk.
 */
function hasUnsyncedPractice(last: string): boolean {
  const lastMs = Date.parse(last);
  return getState().sessions.some((s) => Date.parse(s.date) > lastMs);
}

let exitFlushBound = false;

/**
 * Called once per page load (from ProSync): a full round trip when the last
 * sync is stale or this device has practice newer than it, plus a debounced
 * push whenever practice writes new data, flushed early when the page is
 * hidden. Every failure is swallowed — sync must never break practice — but
 * a refusal from the route is kept for SyncControls to show.
 */
export function startAutoSync(): void {
  const key = proKeyOrNull();
  if (!key) return;

  const last = lastSyncedAt();
  if (captureProgressCloudGeneration() !== null &&
      (!last ||
        hasUnsyncedPractice(last) ||
        Date.now() - Date.parse(last) > AUTO_SYNC_AFTER_MS)) {
    syncNow().catch(noteAutoSyncFailure);
  }

  const cancelPush = () => {
    if (pushTimer !== null) window.clearTimeout(pushTimer);
    pushTimer = null;
  };

  // Best effort: the page may be frozen or discarded before the round trip
  // finishes, which is why the load-time check above is the reliable half.
  // Only a push that is already queued is flushed, so hiding the tab with
  // nothing new to send costs nothing. pushOnly still checks the cloud
  // generation and pulls before it writes.
  const flushQueuedPush = () => {
    if (pushTimer === null) return;
    window.clearTimeout(pushTimer);
    pushTimer = null;
    pushOnly().catch(noteAutoSyncFailure);
  };
  if (!exitFlushBound && typeof document !== "undefined") {
    exitFlushBound = true;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushQueuedPush();
    });
    window.addEventListener("pagehide", flushQueuedPush);
  }

  subscribeProgressCloud(() => {
    if (captureProgressCloudGeneration() === null) cancelPush();
  });

  // Keep this subscription while paused: an explicit resume must allow future
  // practice to sync without reloading the page.
  subscribe(() => {
    if (captureProgressCloudGeneration() === null) {
      cancelPush();
      return;
    }
    if (applyingRemote || !proKeyOrNull()) return;
    if (pushTimer !== null) window.clearTimeout(pushTimer);
    pushTimer = window.setTimeout(() => {
      pushTimer = null;
      pushOnly().catch(noteAutoSyncFailure);
    }, PUSH_DEBOUNCE_MS);
  });
}
