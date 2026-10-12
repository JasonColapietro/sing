/**
 * The words /progress's Backup & transfer and Danger zone cards use, by what
 * actually holds a copy of this browser's record.
 *
 * Erasing (lib/progress.ts clearProgress) pauses automatic backup and cloud
 * sync for good, until Pro's SyncControls or a signed-in AccountBackupControls
 * resumes it. A free singer with neither — every free singer while accounts are
 * off — has no backup to pause and nothing to restore, so telling them a
 * backup is "paused" or that "cloud copies are kept" was a false sense of
 * safety about the only copy of their record. Copy must be true with or
 * without accounts.
 */
export function dataControlsCopy({
  paused,
  isPro,
  accountBackup,
}: {
  paused: boolean;
  isPro: boolean;
  /** Signed in, and not Pro (Pro's own sync supersedes the account backup). */
  accountBackup: boolean;
}): { backup: string; danger: string; erased: string } {
  const hasRemoteCopy = isPro || accountBackup;
  return {
    backup:
      paused && hasRemoteCopy
        ? "Progress is saved in this browser. Automatic backup and cloud sync are paused here. Export a copy to keep a separate backup."
        : isPro
          ? "Progress syncs to the cloud automatically and follows your Pro key to any device. Export still works if you want a file of your own."
          : accountBackup
            ? "Your account keeps a copy of this record, so clearing this browser doesn't put you back at zero. Export still works if you want a file of your own."
            : "Progress lives only in this browser. Export a copy to back it up or move it to another device, then import it there. An import adds to what that browser already holds.",
    danger: hasRemoteCopy
      ? "Erase XP, sessions, streaks, range data, and achievements from this browser. Export a backup first if you want one. This also pauses automatic backup and cloud sync here, so saved progress stays erased until you choose to restore it. Cloud copies, other devices, and recordings are kept."
      : "Erase XP, sessions, streaks, range data, and achievements from this browser. Progress here isn't backed up automatically, so export a backup first if you might want it back. Recordings are kept.",
    erased: hasRemoteCopy
      ? "Progress erased from this browser. Automatic backup and cloud sync are paused here."
      : "Progress erased from this browser.",
  };
}
