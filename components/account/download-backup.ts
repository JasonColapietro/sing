import { exportProgress, localDay } from "@/lib/progress";

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
  // Not revoked in the same tick: WebKit can still be reading the blob when
  // click() returns, and Safari is exactly the browser this backup is for.
  setTimeout(() => URL.revokeObjectURL(url), 40_000);
}
