"use client";

import { useEffect, useState } from "react";
import { useAccountAuth } from "@/lib/use-account-auth";
import { Button } from "@/components/ui";
import { accountsReady } from "@/lib/accounts";
import { resumeProgressCloud, useProgressCloudState } from "@/lib/progress-cloud";
import {
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
 * The account this page life has already run the backup for. Module scope
 * rather than a ref, so a second mount (a stale page-level copy, or a remount)
 * cannot reconcile twice; the localStorage key below is what guards across
 * page loads.
 */
let handledUserId: string | null = null;

/**
 * Runs the backup for whoever is signed in. Renders nothing, blocks nothing,
 * and reports nothing: a failed backup must never interrupt practice, and a
 * signed-out visitor must never notice this exists.
 *
 * Mounted once, in the root layout, so a singer who signs up from any room is
 * reconciled and backed up there. It used to be mounted only on /progress and
 * in the recorder, so someone who created an account to back up their
 * progress from warmups, ear training, breath or songs got no backup until
 * they happened to open one of those two pages.
 *
 * Besides the once-per-load run, hiding the page asks for the throttled
 * refresh, so a long single-page session is captured too. maybeBackup does
 * nothing inside its six-hour window, which makes repeating it free.
 */
export function AccountBackupSync() {
  const { isLoaded, isSignedIn, userId } = useAccountAuth();

  useEffect(() => {
    // A development Clerk instance never resolves a session on a custom domain,
    // so the throttled background push would only ever 401. Checked in here
    // rather than as an early return so the hook order cannot change.
    if (!accountsReady()) return;
    if (!isLoaded || !isSignedIn || !userId) return;
    if (handledUserId === userId) return;
    handledUserId = userId;

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

  useEffect(() => {
    if (!accountsReady()) return;
    if (!isLoaded || !isSignedIn || !userId) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") void maybeBackup();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
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
  const { paused } = useProgressCloudState();
  const [notice, setNotice] = useState<
    { kind: "ok" | "err"; text: string } | null
  >(null);
  const [working, setWorking] = useState<"backup" | "restore" | null>(null);
  const [last, setLast] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads localStorage, so it can only run after hydration
    setLast(lastBackupAt());
  }, []);

  // After the hooks, never before: an early return above them would change the
  // hook order between deployments that have real keys and ones that do not.
  if (!accountsReady()) return null;

  const run = async (kind: "backup" | "restore", resume = false) => {
    setWorking(kind);
    setNotice(null);
    try {
      if (resume) resumeProgressCloud();
      if (kind === "backup") {
        // Another device may have backed up since this browser last loaded.
        // Merge that record before writing so a manual backup keeps both.
        await reconcileBackup();
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
          error instanceof Error && error.message
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
      {paused && (
        <p className="mb-3 text-sm text-mut">
          Backup is paused on this browser. Your account copy is still saved.
          Resuming restores your saved account progress and merges any new practice.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void run(paused ? "restore" : "backup", paused)}
          disabled={working !== null}
        >
          {working === "backup"
            ? "Backing up…"
            : working === "restore"
              ? "Restoring…"
              : paused ? "Resume backup and restore" : "Back up now"}
        </Button>
        {!paused && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void run("restore")}
            disabled={working !== null}
          >
            {working === "restore" ? "Restoring…" : "Restore from account"}
          </Button>
        )}
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          {paused ? "Paused on this browser" : lastLabel
            ? `Last backed up ${lastLabel}`
            : "Backs up in the background"}
        </span>
      </div>
      {notice && !paused && (
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
