import { exportProgress, localDay } from "@/lib/progress";

/**
 * When this browser last saved a backup file, from either button that saves
 * one: the save prompt's "Download a backup" or the Export button on
 * /progress. The save prompt reads it to stay quiet while the file is fresh,
 * and to say how far behind the file is once practice has moved past it.
 * Recorded here, in the one function both buttons call, so a singer who
 * exported from /progress is never told this browser holds the only copy.
 */
export const BACKUP_FILE_AT_KEY = "suede-sing:backup-file-at:v1";

/**
 * The stored time, read through useSyncExternalStore by the save prompt (the
 * same pattern as its dismissal flag): null on the server and through
 * hydration, the stored value right after.
 */
const listeners = new Set<() => void>();
/** undefined: not read yet; null: no backup file on record. */
let fileAtCache: string | null | undefined;
let storageBound = false;

export function readBackupFileAt(): string | null {
  if (fileAtCache !== undefined) return fileAtCache;
  if (typeof window === "undefined") return null;
  try {
    fileAtCache = window.localStorage.getItem(BACKUP_FILE_AT_KEY);
  } catch {
    fileAtCache = null;
  }
  return fileAtCache;
}

export function subscribeBackupFileAt(cb: () => void): () => void {
  if (!storageBound && typeof window !== "undefined") {
    storageBound = true;
    // A backup saved in one tab settles the card in the others too. A null key
    // is storage cleared wholesale, which takes the record of the file with it.
    window.addEventListener("storage", (e) => {
      if (e.key !== BACKUP_FILE_AT_KEY && e.key !== null) return;
      fileAtCache = undefined;
      for (const l of listeners) l();
    });
  }
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function recordBackupFile(): void {
  fileAtCache = new Date().toISOString();
  try {
    window.localStorage.setItem(BACKUP_FILE_AT_KEY, fileAtCache);
  } catch {
    // ignore — the in-memory cache still holds it for this page session
  }
  for (const l of listeners) l();
}

/**
 * Saves the practice record as a dated JSON file, the same file the Export
 * button on /progress produces and its Import button reads back.
 *
 * With accounts off this is the only backup a free singer has, so the save
 * prompt offers it directly instead of leaving it deep in /progress.
 */
export function downloadProgressBackup(): void {
  const json = exportProgress();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `suede-sing-progress-${localDay(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  recordBackupFile();
  // Not revoked in the same tick: WebKit can still be reading the blob when
  // click() returns, and Safari is exactly the browser this backup is for.
  setTimeout(() => URL.revokeObjectURL(url), 40_000);
}
