import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/progress", () => ({
  exportProgress: () => "{}",
  localDay: () => "2026-10-12",
}));

import {
  BACKUP_FILE_AT_KEY,
  downloadProgressBackup,
  readBackupFileAt,
  subscribeBackupFileAt,
} from "./download-backup";

/**
 * The /progress Export button and the save prompt's download both call
 * downloadProgressBackup, so recording the file's date there is what keeps
 * the prompt from telling a singer who exported on /progress that this
 * browser holds the only copy.
 */
describe("downloadProgressBackup", () => {
  const stored: Record<string, string> = {};
  const clicked = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => stored[k] ?? null,
        setItem: (k: string, v: string) => {
          stored[k] = v;
        },
      },
      addEventListener: () => {},
    });
    vi.stubGlobal("document", {
      createElement: () => ({ click: clicked, remove: () => {} }),
      body: { appendChild: () => {} },
    });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:backup");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("records when the file was saved and tells the save prompt", () => {
    vi.setSystemTime(new Date("2026-10-12T09:30:00.000Z"));
    const listener = vi.fn();
    const unsubscribe = subscribeBackupFileAt(listener);

    expect(readBackupFileAt()).toBeNull();
    downloadProgressBackup();
    unsubscribe();

    expect(clicked).toHaveBeenCalledOnce();
    expect(stored[BACKUP_FILE_AT_KEY]).toBe("2026-10-12T09:30:00.000Z");
    expect(readBackupFileAt()).toBe("2026-10-12T09:30:00.000Z");
    expect(listener).toHaveBeenCalledOnce();
  });
});

/**
 * Importing a backup file on /progress restores from a file the singer holds,
 * so the save prompt must not then call this browser "the only copy". The
 * import records the file as of its newest session; practice after that is
 * still counted against it.
 */
describe("recording an imported backup file", () => {
  const stored: Record<string, string> = {};
  type Mod = typeof import("./download-backup");
  let mod: Mod;

  const session = (date: string) => ({ id: date, type: "warmup", date, day: date.slice(0, 10), durationSec: 60, xp: 5 });
  const file = (...dates: string[]) => JSON.stringify({ sessions: dates.map(session) });

  beforeEach(async () => {
    for (const k of Object.keys(stored)) delete stored[k];
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T12:00:00.000Z"));
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => stored[k] ?? null,
        setItem: (k: string, v: string) => {
          stored[k] = v;
        },
      },
      addEventListener: () => {},
    });
    // A fresh module per test: the stored date is cached at module level.
    vi.resetModules();
    mod = await import("./download-backup");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("keeps the save prompt off 'the only copy' after an import", async () => {
    const { backupFileStatus } = await import("./save-state");
    const json = file("2026-10-01T09:00:00.000Z", "2026-10-15T09:00:00.000Z");
    const sessions = JSON.parse(json).sessions;

    mod.recordImportedBackupFile(json);

    expect(mod.readBackupFileAt()).toBe("2026-10-15T09:00:00.000Z");
    // Into an empty browser: the file holds everything, so the card stays quiet.
    expect(backupFileStatus(sessions, mod.readBackupFileAt())).toEqual({
      hasFile: true,
      stale: false,
      sessionsSince: 0,
    });
    // Merged into a browser with newer practice: the file is counted as behind,
    // which is the card's "Your last backup file is from …" copy, not the stake.
    const merged = [...sessions, session("2026-10-18T09:00:00.000Z")];
    expect(backupFileStatus(merged, mod.readBackupFileAt())).toMatchObject({ hasFile: true, sessionsSince: 1 });
  });

  it("never moves a newer recorded backup date backwards", () => {
    mod.recordBackupFile("2026-10-16T00:00:00.000Z");
    mod.recordImportedBackupFile(file("2026-10-01T09:00:00.000Z"));
    mod.recordBackupFile("2026-10-02T00:00:00.000Z");
    expect(mod.readBackupFileAt()).toBe("2026-10-16T00:00:00.000Z");
    expect(stored[mod.BACKUP_FILE_AT_KEY]).toBe("2026-10-16T00:00:00.000Z");

    mod.recordBackupFile("2026-10-17T00:00:00.000Z");
    expect(mod.readBackupFileAt()).toBe("2026-10-17T00:00:00.000Z");
  });

  it("caps a future-dated file at now and ignores a file with no dated sessions", () => {
    mod.recordImportedBackupFile(file());
    mod.recordImportedBackupFile("not json");
    expect(mod.readBackupFileAt()).toBeNull();

    mod.recordImportedBackupFile(file("2030-01-01T00:00:00.000Z"));
    expect(mod.readBackupFileAt()).toBe("2026-10-20T12:00:00.000Z");
  });
});
