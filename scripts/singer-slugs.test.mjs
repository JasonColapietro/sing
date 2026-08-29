import { describe, expect, it } from "vitest";

import { SINGERS } from "../lib/singers-data.ts";
import {
  RESERVED_SINGER_SLUGS,
  assertNoReservedSingerSlugs,
} from "./singer-slugs.mjs";

describe("reserved singer slugs", () => {
  it("rejects a fixture that would collide with a static singer route", () => {
    expect([...RESERVED_SINGER_SLUGS]).toEqual(
      expect.arrayContaining(["records", "genre", "voice-type", "methodology"]),
    );
    expect(() => assertNoReservedSingerSlugs([{ slug: "methodology" }])).toThrow(
      'reserved singer slug "methodology"',
    );
  });

  it("accepts the real generated singer catalog", () => {
    expect(() => assertNoReservedSingerSlugs(SINGERS)).not.toThrow();
  });
});
