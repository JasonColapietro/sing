/**
 * The words /progress's Backup & transfer and Danger zone cards use, by what
 * actually holds a copy of this browser's record.
 *
 * Erasing (lib/progress.ts clearProgress) pauses automatic backup and cloud
 * sync for good, until Pro's SyncControls or a signed-in AccountBackupControls
 * resumes it. A free singer with neither — every free singer while accounts are
 * off — has no backup to pause and nothing to restore (the Danger zone's
 * eraseBrowserProgress lifts the pause again for them), so telling them a
 * backup is "paused" or that "cloud copies are kept" was a false sense of
 * safety about the only copy of their record. Copy must be true with or
 * without accounts.
 */
/**
 * What a backup file and a cloud copy leave behind. Song mastery
 * (suede-sing:mastered:v2), the ear-training and breath path bests that draw
 * those paths' stars (suede-sing:ear-best:v1, suede-sing:breath-bests:v1) and
 * a program's place are kept in their own browser keys, outside the progress
 * record that exportProgress() writes and Pro sync pushes. A restore brings
 * back every score but locks the songbook's later bands again and shows the
 * paths' games as not played yet, and the ear log has no difficulty to
 * rebuild those bests from. Said wherever a restore is promised.
 */
export const NOT_IN_BACKUP_FILE =
  "Song mastery (which opens the songbook’s later bands), the stars on the ear-training and breath paths, and your place in a program stay in this browser and are not in the file.";
const KEPT_HERE_FILE = NOT_IN_BACKUP_FILE;
const KEPT_HERE_SYNC =
  "Song mastery (which opens the songbook’s later bands), the stars on the ear-training and breath paths, and your place in a program stay in this browser.";

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
        ? `Progress is saved in this browser. Automatic backup and cloud sync are paused here. Export a copy to keep a separate backup. ${KEPT_HERE_FILE}`
        : isPro
          ? `Progress syncs to the cloud automatically and follows your Pro key to any device. ${KEPT_HERE_SYNC} Export still works if you want a file of your own.`
          : accountBackup
            ? `Your account keeps a copy of this record, so clearing this browser doesn't put you back at zero. ${KEPT_HERE_SYNC} Export still works if you want a file of your own.`
            : `Progress lives only in this browser. Export a copy to back it up or move it to another device, then import it there. An import adds to what that browser already holds. ${KEPT_HERE_FILE}`,
    danger: hasRemoteCopy
      ? "Erase XP, sessions, streaks, range data, and achievements from this browser. Export a backup first if you want one. This also pauses automatic backup and cloud sync here, so saved progress stays erased until you choose to restore it. Cloud copies, other devices, and recordings are kept."
      : "Erase XP, sessions, streaks, range data, and achievements from this browser. Progress here isn't backed up automatically, so export a backup first if you might want it back. Recordings are kept.",
    erased: hasRemoteCopy
      ? "Progress erased from this browser. Automatic backup and cloud sync are paused here."
      : "Progress erased from this browser.",
  };
}
