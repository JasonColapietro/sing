import { describe, expect, it } from "vitest";
import { PLAN_ROWS, PRICING, PRO_PERKS } from "./pro";
import { PRICING as SHARED_PRICING } from "./pro-shared";
import { ATLAS_CONTENTS } from "./atlas-data";
import { BOOK_CONTENTS } from "./book-data";
import { PRO_SONGS, SONGS } from "@/components/songs/data";

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
    // The original rule was "quote no song count at all", because the Pro
    // songbook was six titles against twenty free ones and any bare number
    // argued against buying. The songbook is now entirely free, which turns the
    // count from a liability into the strongest thing this row can say — so the
    // rule is no longer "say nothing", it is "any number you say must be the
    // whole catalogue, and there must be no Pro-only catalogue to compare it
    // against". If a genuinely Pro song ever lands, this fails and the copy has
    // to be reconsidered rather than quietly inheriting a number that has
    // stopped being true.
    const quoted = claims.flatMap((c) =>
      [...c.matchAll(/\b(\d+)\s+songs\b/gi)].map((m) => Number(m[1])),
    );
    if (PRO_SONGS.length > 0) {
      expect(quoted).toEqual([]);
    } else {
      for (const n of quoted) expect(n).toBe(SONGS.length);
    }
  });

  it("describes each book's free tier by its actual free-chapter count", () => {
    // The `free` flags on the checked-in chapter arrays are the source of
    // truth; this copy is the only place the counts are restated by hand.
    const freeChapters = (entries: Array<{ free: boolean }>) =>
      entries.filter((c) => c.free).length;
    // "first N" is only honest when the free chapters really are the opening
    // run. The Measured Voice now samples chapters 1, 8 and 12 — the two that
    // teach a reader to take an honest measurement and to spot a bad one — so
    // calling that "the first 3 chapters" would send a buyer looking for
    // chapters 2 and 3 and find them locked.
    const describe_ = (entries: Array<{ free: boolean; order: number }>) => {
      const free = entries.filter((c) => c.free).map((c) => c.order).sort((a, b) => a - b);
      const contiguousFromOne = free.every((order, i) => order === i + 1);
      if (free.length === 1) return "Contents + first chapter";
      return contiguousFromOne
        ? `Contents + first ${free.length} chapters`
        : `Contents + ${free.length} chapters`;
    };
    const expected: Record<string, string> = {
      "The Measured Voice (book)": describe_(BOOK_CONTENTS),
      "The Voice Atlas (book)": describe_(ATLAS_CONTENTS),
    };
    for (const [label, free] of Object.entries(expected)) {
      const row = PLAN_ROWS.find((r) => r.label === label);
      expect(row, `missing PLAN_ROWS entry: ${label}`).toBeDefined();
      expect(row?.free).toBe(free);
    }
  });
});
