import { describe, expect, it } from "vitest";
import { localDay } from "./progress";

describe("localDay", () => {
  it("formats the local calendar day, zero-padded", () => {
    expect(localDay(new Date(2026, 0, 5, 13, 0, 0))).toBe("2026-01-05");
    expect(localDay(new Date(2026, 11, 31, 23, 59, 0))).toBe("2026-12-31");
  });

  it("uses local time, not UTC — late-night practice counts for that night", () => {
    // 23:30 local on the 14th is already the 15th in UTC at any negative offset.
    expect(localDay(new Date(2026, 7, 14, 23, 30, 0))).toBe("2026-08-14");
  });

  it("defaults to now, which is what the streak compares against", () => {
    expect(localDay()).toBe(localDay(new Date()));
  });
});
