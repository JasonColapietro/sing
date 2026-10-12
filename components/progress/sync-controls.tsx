"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { lastSyncError, lastSyncedAt, syncNow } from "@/lib/sync";
import { resumeProgressCloud, useProgressCloudState } from "@/lib/progress-cloud";

export function SyncControls() {
  const { paused } = useProgressCloudState();
  const [notice, setNotice] = useState<
    { kind: "ok" | "err"; text: string } | null
  >(null);
  const [working, setWorking] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  // Why the last automatic sync was refused. The background syncs never
  // interrupt practice, so without this a refused push only showed as a
  // "Last synced" date that stopped moving.
  const [autoError, setAutoError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads localStorage, so it can only run after hydration
    setLastSync(lastSyncedAt());
    setAutoError(lastSyncError());
  }, []);

  const runSync = async () => {
    setWorking(true);
    setNotice(null);
    try {
      if (paused) resumeProgressCloud();
      const { mergedRemote } = await syncNow();
      setLastSync(lastSyncedAt());
      setAutoError(lastSyncError());
      setNotice({
        kind: "ok",
        text: mergedRemote
          ? "Synced — progress from your other devices is merged in."
          : "Synced — this device's progress is backed up.",
      });
    } catch (error) {
      setNotice({
        kind: "err",
        text:
          error instanceof Error && error.message
            ? error.message
            : "Sync failed. Try again in a moment.",
      });
    } finally {
      setWorking(false);
    }
  };

  const lastLabel = lastSync
    ? new Date(lastSync).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="mt-3">
      {paused && (
        <p className="mb-3 text-sm text-mut">
          Cloud sync is paused on this browser. Your other devices and cloud copy
          are still saved. Resuming restores your saved cloud progress and merges
          any new practice.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2.5">
        <Button variant="outline" size="sm" onClick={runSync} disabled={working}>
          {working ? "Syncing…" : paused ? "Resume sync and restore" : "Sync now"}
        </Button>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          {paused ? "Paused on this browser" : lastLabel ? `Last synced ${lastLabel}` : "Syncs automatically as you practice"}
        </span>
      </div>
      {autoError && !notice && !paused && (
        <p className="mt-3 rounded-lg border border-rec/40 bg-rec/10 px-3 py-2 text-xs text-rec" role="status">
          {/* The route's messages already end in a full stop, and some say
              "Try again", so the next step here is the button above. */}
          The last automatic sync did not go through: {autoError} Your practice is still saved on
          this browser, and Sync now tries again.
        </p>
      )}
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
