"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui";
import {
  BackupError,
  backupNow,
  lastBackupAt,
  maybeBackup,
  reconcileBackup,
} from "@/lib/account-backup";

/**
 * Wiring for the free-tier account backup. Two pieces: a silent component that
 * keeps the snapshot fresh, and the visible controls on /progress.
 *
 * This is not the Pro cloud sync. Pro's continuous multi-device sync lives in
 * lib/sync.ts and is mounted by ProSync in the layout; nothing here touches it
 * or its Redis namespace. An account buys one thing, a second copy of the
 * practice record, and everything below is bounded by that promise.
 */

/**
 * Which account this browser's record has already been folded together with.
 *
 * Reconciling is a two-way merge and a push, so it is worth doing once per
 * account rather than on every page load. After that a throttled snapshot is
 * all the free tier promises.
 */
const RECONCILED_KEY = "suede-sing:backup:account";

/**
 * Runs the backup for whoever is signed in. Renders nothing, blocks nothing,
 * and reports nothing: a failed backup must never interrupt practice, and a
 * signed-out visitor must never notice this exists.
 *
 * Mounted on /progress and in the recorder, which are the two rooms where the
 * record is most likely to have moved. Both calls are safe to repeat, so a
 * singer who visits both in one sitting still does at most one round trip.
 */
export function AccountBackupSync() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  // Guards against a second run inside one page life; the localStorage key
  // below is what guards across page loads.
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    if (handled.current === userId) return;
    handled.current = userId;

    void (async () => {
      let reconciled: string | null = null;
      try {
        reconciled = window.localStorage.getItem(RECONCILED_KEY);
      } catch {
        // Storage blocked. Reconciling again is harmless, so fall through.
      }

      if (reconciled === userId) {
        await maybeBackup();
        return;
      }

      try {
        // First load under this account on this browser: pull whatever the
        // account holds and fold it in, then push the union back. The merge
        // only ever adds, so a device with practice on it keeps all of it.
        await reconcileBackup();
        try {
          window.localStorage.setItem(RECONCILED_KEY, userId);
        } catch {
          // Without the key we reconcile again next load. Idempotent, so the
          // cost is a round trip, not a wrong record.
        }
      } catch {
        // Offline, signed out mid-flight, or the store is down. Next load.
      }
    })();
  }, [isLoaded, isSignedIn, userId]);

  return null;
}

/**
 * The manual half, for the Backup & transfer card on /progress.
 *
 * Deliberately shaped like the Pro SyncControls beside it so the page reads as
 * one idea at two tiers, but the words stay honest about the difference: this
 * is a snapshot the singer can take and pull back, not a live mirror.
 */
export function AccountBackupControls() {
  const [notice, setNotice] = useState<
    { kind: "ok" | "err"; text: string } | null
  >(null);
  const [working, setWorking] = useState<"backup" | "restore" | null>(null);
  const [last, setLast] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads localStorage, so it can only run after hydration
    setLast(lastBackupAt());
  }, []);

  const run = async (kind: "backup" | "restore") => {
    setWorking(kind);
    setNotice(null);
    try {
      if (kind === "backup") {
        await backupNow();
        setNotice({
          kind: "ok",
          text: "Backed up. Your account now holds a copy of this record.",
        });
      } else {
        // reconcileBackup merges the stored copy in and pushes the result, so
        // pulling a backup onto a device that has been practicing keeps both.
        const { restored } = await reconcileBackup();
        setNotice({
          kind: "ok",
          text: restored
            ? "Restored. Your stored copy is merged in and nothing on this device was replaced."
            : "Nothing stored yet, so this device's record is now the copy.",
        });
      }
      setLast(lastBackupAt());
    } catch (error) {
      setNotice({
        kind: "err",
        text:
          error instanceof BackupError && error.message
            ? error.message
            : "Backup failed. Try again in a moment.",
      });
    } finally {
      setWorking(null);
    }
  };

  const lastLabel = last
    ? new Date(last).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void run("backup")}
          disabled={working !== null}
        >
          {working === "backup" ? "Backing up…" : "Back up now"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void run("restore")}
          disabled={working !== null}
        >
          {working === "restore" ? "Restoring…" : "Restore from account"}
        </Button>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          {lastLabel
            ? `Last backed up ${lastLabel}`
            : "Backs up in the background"}
        </span>
      </div>
      {notice && (
        <p
          className={
            notice.kind === "ok"
              ? "mt-3 rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-xs text-ok-ink"
              : "mt-3 rounded-lg border border-rec/40 bg-rec/10 px-3 py-2 text-xs text-rec"
          }
          role="status"
        >
          {notice.text}
        </p>
      )}
    </div>
  );
}
