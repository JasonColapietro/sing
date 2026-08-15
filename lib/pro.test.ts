import { describe, expect, it } from "vitest";
import { PLAN_ROWS, PRICING, PRO_PERKS } from "./pro";
import { PRICING as SHARED_PRICING } from "./pro-shared";
import { ATLAS_CONTENTS } from "./atlas-data";
import { BOOK_CONTENTS } from "./book-data";

describe("PRICING", () => {
  it("re-exports the shared price rather than keeping a second copy", () => {
    // A local copy here is how the page and the Stripe checkout drift apart:
    // this module is what every client-side upgrade CTA reads.
    expect(PRICING).toBe(SHARED_PRICING);
  });
});

describe("Pro sales copy", () => {
  const claims = [
    ...PRO_PERKS.map((p) => `${p.title} ${p.desc}`),
    ...PLAN_ROWS.map((r) => `${r.label} ${r.free} ${r.pro}`),
  ];

  it("promises no content cadence the catalog cannot keep", () => {
    // Songs and chapters are checked-in arrays. "New songs every week" is a
    // promise only a weekly deploy could keep, and a subscriber falsifies it in
    // ten seconds by opening the library twice.
    const cadence = /\bweekly\b|\bevery week\b|\beach week\b|\bevery month\b|\bdrops\b/i;
    expect(claims.filter((c) => cadence.test(c))).toEqual([]);
  });

  it("never sells the paid catalog by a number smaller than the free one", () => {
    // The free songbook is larger than the Pro one. Any bare count in this copy
    // argues against buying.
    expect(claims.filter((c) => /\b\d+\s+songs\b/i.test(c))).toEqual([]);
  });

  it("describes each book's free tier by its actual free-chapter count", () => {
    // The `free` flags on the checked-in chapter arrays are the source of
    // truth; this copy is the only place the counts are restated by hand.
    const freeChapters = (entries: Array<{ free: boolean }>) =>
      entries.filter((c) => c.free).length;
    const expected: Record<string, string> = {
      "The Measured Voice (book)":
        freeChapters(BOOK_CONTENTS) === 1
          ? "Contents + first chapter"
          : `Contents + first ${freeChapters(BOOK_CONTENTS)} chapters`,
      "The Voice Atlas (book)":
        freeChapters(ATLAS_CONTENTS) === 1
          ? "Contents + first chapter"
          : `Contents + first ${freeChapters(ATLAS_CONTENTS)} chapters`,
    };
    for (const [label, free] of Object.entries(expected)) {
      const row = PLAN_ROWS.find((r) => r.label === label);
      expect(row, `missing PLAN_ROWS entry: ${label}`).toBeDefined();
      expect(row?.free).toBe(free);
    }
  });
});
