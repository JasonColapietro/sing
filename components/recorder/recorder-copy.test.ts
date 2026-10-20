import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("./recorder-page.tsx", import.meta.url), "utf8");
const route = readFileSync(new URL("../../app/recorder/page.tsx", import.meta.url), "utf8");

describe("recorder copy and the take limit", () => {
  it("states the five-minute take limit the record clock enforces", () => {
    // Every take stops at MAX_SEC. "No time limit" on a recorder reads as
    // recording length, so the free claim is about the day, not the take.
    expect(page).toMatch(/const MAX_SEC = 300;/);
    expect(page).toContain("Record yourself singing in takes of up to five minutes");
    expect(page).toContain("Takes stop automatically at 5:00.");
  });

  it("never promises no time limit in the subtitle or the search snippet", () => {
    expect(page).not.toMatch(/no time limit/i);
    expect(route).not.toMatch(/no time limit/i);
    expect(page).toContain("Free with no daily limit, and every take stays on this device.");
    expect(route).toContain("Free with no daily limit, and every take stays on your device.");
  });
});
