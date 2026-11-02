import { exportProgress, localDay } from "@/lib/progress";
import { sanitizeProgress, type ProgressState } from "@/lib/progress-shape";

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

/**
 * Records a backup file as of `at` (an ISO time, default now). A download
 * holds the record as of now. An imported file holds it as of its own newest
 * session, which can be older than a file already on record, so an explicit
 * date never moves the record backwards.
 */
export function recordBackupFile(at?: string): void {
  if (at !== undefined) {
    const when = Date.parse(at);
    if (!Number.isFinite(when)) return;
    const onRecord = Date.parse(readBackupFileAt() ?? "");
    if (Number.isFinite(onRecord) && onRecord >= when) return;
  }
  fileAtCache = at ?? new Date().toISOString();
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

/**
 * After /progress imports a backup file, records that file as of its newest
 * session, so the save prompt does not tell a singer who just restored from a
 * file that this browser holds the only copy. Practice newer than the file
 * still counts against it (backupFileStatus). A date past now (a hand-edited
 * file, or one from a device with a fast clock) is capped at now, so it cannot
 * hide later practice from the prompt.
 *
 * backupFileStatus judges by date alone, which only holds when the file has
 * everything this browser had. So `before` is this browser's progress just
 * before the import: if it held a session or a measured range the file lacks,
 * nothing is recorded and the prompt keeps saying what is only here. The date
 * comes from the sessions the import actually keeps (sanitizeProgress), not
 * from raw entries it drops.
 */
export function recordImportedBackupFile(
  json: string,
  before: Pick<ProgressState, "sessions" | "range">,
): void {
  let imported: ProgressState;
  try {
    imported = sanitizeProgress(JSON.parse(json));
  } catch {
    return;
  }
  const inFile = new Set(imported.sessions.map((s) => s.id));
  if (before.sessions.some((s) => !inFile.has(s.id))) return;
  const local = before.range;
  if (
    (local.lowMidi !== undefined || local.highMidi !== undefined) &&
    (imported.range.lowMidi !== local.lowMidi || imported.range.highMidi !== local.highMidi)
  ) {
    return;
  }
  let newest = -Infinity;
  for (const s of imported.sessions) {
    const when = Date.parse(s.date);
    if (Number.isFinite(when) && when > newest) newest = when;
  }
  if (!Number.isFinite(newest)) return;
  recordBackupFile(new Date(Math.min(newest, Date.now())).toISOString());
}
