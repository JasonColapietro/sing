// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_WARMUP_PREFS,
  getWarmupPrefs,
  resetWarmupPrefsForTest,
} from "./prefs";

/**
 * The store reads window.localStorage once and caches. Stub a window with the
 * given entries, reset the cache, and read.
 */
function withStored(entries: Record<string, string>) {
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => entries[key] ?? null,
      setItem: () => {},
      removeItem: () => {},
    },
  });
  resetWarmupPrefsForTest();
  return getWarmupPrefs();
}

afterEach(() => {
  vi.unstubAllGlobals();
  resetWarmupPrefsForTest();
});

describe("warmup prefs", () => {
  it("reads a stored call-and-response mode back", () => {
    const prefs = withStored({ "suede-sing:warmup:mode:v1": "call-response" });
    expect(prefs.mode).toBe("call-response");
  });

  it("falls back to sing-along for a mode that is not a mode", () => {
    const prefs = withStored({ "suede-sing:warmup:mode:v1": "banana" });
    expect(prefs.mode).toBe("sing-along");
  });

  it("clamps a stored guide level into 0..100", () => {
    expect(withStored({ "suede-sing:warmup:guide:v1": "250" }).guidePct).toBe(100);
    resetWarmupPrefsForTest();
    expect(withStored({ "suede-sing:warmup:guide:v1": "-4" }).guidePct).toBe(0);
  });

  it("falls back to the default level for a guide value that is not a number", () => {
    const prefs = withStored({ "suede-sing:warmup:guide:v1": "abc" });
    expect(prefs.guidePct).toBe(DEFAULT_WARMUP_PREFS.guidePct);
  });

  it("returns the defaults exactly when nothing is stored", () => {
    expect(withStored({})).toEqual(DEFAULT_WARMUP_PREFS);
  });

  it("reads the click toggle back as a boolean", () => {
    expect(withStored({ "suede-sing:warmup:click:v1": "0" }).click).toBe(false);
    resetWarmupPrefsForTest();
    expect(withStored({ "suede-sing:warmup:click:v1": "1" }).click).toBe(true);
  });
});
