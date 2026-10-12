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
