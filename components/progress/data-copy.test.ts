/**
 * After "Erase", the record is paused for good (lib/progress.ts clearProgress)
 * until Pro sync or an account backup resumes it. A free singer with neither
 * has no backup to pause, so the copy must not say one exists.
 */
import { describe, expect, it } from "vitest";
import { dataControlsCopy } from "./data-copy";

const free = { isPro: false, accountBackup: false };

describe("data controls copy", () => {
  it("keeps the only-copy warning for a free singer without an account, erased or not", () => {
    for (const paused of [false, true]) {
      const copy = dataControlsCopy({ ...free, paused });
      expect(copy.backup).toContain("Progress lives only in this browser.");
      expect(copy.backup).not.toContain("paused");
    }
  });

  it("promises a free singer without an account no backup, cloud copy or restore", () => {
    const copy = dataControlsCopy({ ...free, paused: true });
    expect(copy.danger).toContain("isn't backed up automatically");
    expect(copy.danger).not.toMatch(/cloud|restore|pauses/i);
    expect(copy.erased).toBe("Progress erased from this browser.");
  });

  it.each([
    ["Pro", { isPro: true, accountBackup: false }],
    ["a signed-in free singer", { isPro: false, accountBackup: true }],
  ])("tells %s the backup is paused after an erase, and that cloud copies are kept", (_who, who) => {
    const copy = dataControlsCopy({ ...who, paused: true });
    expect(copy.backup).toContain("Automatic backup and cloud sync are paused here.");
    expect(copy.danger).toContain("Cloud copies, other devices, and recordings are kept.");
    // e2e/progress-reset.mjs matches this prefix.
    expect(copy.erased).toMatch(/^Progress erased from this browser\. Automatic backup/);
  });

  it("describes the live backup when nothing is paused", () => {
    expect(dataControlsCopy({ isPro: true, accountBackup: false, paused: false }).backup)
      .toContain("syncs to the cloud automatically");
    expect(dataControlsCopy({ isPro: false, accountBackup: true, paused: false }).backup)
      .toContain("Your account keeps a copy");
  });
});

describe("what a restore brings back", () => {
  it("says on every backup line that song mastery and program place stay in this browser", () => {
    // Mastery opens the songbook's later bands and lives outside the progress
    // record, so neither the file nor Pro sync carries it.
    for (const who of [
      { isPro: false, accountBackup: false },
      { isPro: true, accountBackup: false },
      { isPro: false, accountBackup: true },
    ]) {
      for (const paused of [false, true]) {
        const copy = dataControlsCopy({ ...who, paused });
        expect(copy.backup, JSON.stringify({ who, paused })).toContain("Song mastery");
        expect(copy.backup).toContain("your place in a program stay in this browser");
      }
    }
  });
});
