"use client";

import { getState, mergeRemoteProgress, type ProgressState } from "./progress";

/**
 * Client for the free account backup (/api/account/progress).
 *
 * This is not the Pro cloud sync in lib/sync.ts and does not touch it. Pro
 * gets continuous two-way sync across devices, keyed by subscription. An
 * account gets one thing: a copy of the practice record, so a cleared browser
 * or a new laptop is recoverable. Keeping the two clients separate is what
 * makes it impossible for a free-tier change to break a paid one.
 *
 * Restores always go through mergeRemoteProgress, which is commutative and
 * idempotent, so pulling a backup can only ever add to what is on this device.
 * Nothing here overwrites local practice.
 */

const LAST_KEY = "suede-sing:backup:last";

/**
 * How stale a backup has to be before a background push refreshes it.
 *
 * Six hours, not seconds. A snapshot is all an account promises, and pushing
 * on every change would quietly turn this into the live sync that Pro pays
 * for. Explicit backupNow() is always available when someone wants it now.
 */
export const BACKUP_MIN_INTERVAL_MS = 6 * 60 * 60 * 1000;

export interface RemoteBackup {
  /** The stored snapshot, or null when this account has never backed up. */
  state: ProgressState | null;
  /** Client clock when the snapshot was taken. */
  updatedAt: string | null;
  /** Server clock when it was stored. */
  savedAt: string | null;
}

/**
 * A failed backup call, carrying the HTTP status so callers can tell "signed
 * out" (401) apart from "the store is down" (502/503) and stay quiet about the
 * first. Signing out is not an error worth showing anyone.
 */
export class BackupError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BackupError";
    this.status = status;
  }

  /** True when the only problem is that nobody is signed in. */
  get signedOut(): boolean {
    return this.status === 401;
  }
}

async function call<T>(init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch("/api/account/progress", init);
  } catch {
    throw new BackupError("Could not reach your backup. Check your connection.", 0);
  }
  const data = (await res.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!res.ok) {
    throw new BackupError(data?.error ?? "Backup failed. Try again.", res.status);
  }
  if (!data) throw new BackupError("Backup returned an empty response.", res.status);
  return data;
}

export function lastBackupAt(): string | null {
  try {
    return window.localStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}

function markBackedUp(savedAt: string) {
  try {
    window.localStorage.setItem(LAST_KEY, savedAt);
  } catch {
    // storage unavailable — the throttle just falls back to backing up more often
  }
}

/** Read the stored snapshot without touching local progress. */
export function fetchBackup(): Promise<RemoteBackup> {
  return call<RemoteBackup>({ method: "GET" });
}

/** Push the current local record. Resolves with the server's save time. */
export async function backupNow(): Promise<string> {
  const { savedAt } = await call<{ ok: boolean; savedAt: string }>({
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ state: getState(), updatedAt: new Date().toISOString() }),
  });
  markBackedUp(savedAt);
  return savedAt;
}

/**
 * Pull the backup and fold it into local progress. Returns false when the
 * account has nothing stored yet.
 *
 * Safe to call on a device that already has practice on it: the merge unions
 * sessions and achievements and takes the max of every counter, so a restore
 * can add work but never remove it.
 */
export async function restoreBackup(): Promise<boolean> {
  const remote = await fetchBackup();
  if (!remote.state) return false;
  mergeRemoteProgress(remote.state);
  return true;
}

/**
 * The sign-in round trip: merge whatever is stored into this device, then push
 * the merged result back.
 *
 * Both halves matter. Merging first means a returning singer sees their old
 * record; pushing after means the practice they did while signed out is now
 * backed up too, rather than being the thing the next restore quietly loses.
 */
export async function reconcileBackup(): Promise<{ restored: boolean }> {
  const restored = await restoreBackup();
  await backupNow();
  return { restored };
}

/**
 * Refresh the snapshot if it is older than BACKUP_MIN_INTERVAL_MS. Swallows
 * everything, including being signed out: a backup must never interrupt or
 * break a practice session.
 */
export async function maybeBackup(): Promise<void> {
  const last = lastBackupAt();
  if (last && Date.now() - Date.parse(last) < BACKUP_MIN_INTERVAL_MS) return;
  try {
    await backupNow();
  } catch {
    // next page load tries again
  }
}
