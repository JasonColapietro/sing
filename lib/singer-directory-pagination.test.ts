import { describe, expect, it } from "vitest";

import {
  INITIAL_RICH_SINGER_ROWS,
  nextRichSingerRowCount,
  shownRowCountFromParam,
  visibleRichSingerRows,
} from "@/lib/singer-directory-pagination";

describe("singer directory pagination", () => {
  const rows = Array.from({ length: 636 }, (_, index) => ({ slug: `singer-${index}` }));

  it("starts the rich directory at 48 rows", () => {
    expect(INITIAL_RICH_SINGER_ROWS).toBe(48);
    expect(visibleRichSingerRows(rows, INITIAL_RICH_SINGER_ROWS)).toHaveLength(48);
  });

  it("adds one accessible batch at a time and never exceeds the filtered result", () => {
    expect(nextRichSingerRowCount(48, rows.length)).toBe(96);
    expect(nextRichSingerRowCount(624, rows.length)).toBe(636);
    expect(visibleRichSingerRows(rows.slice(0, 17), 48)).toHaveLength(17);
  });

  it("reads the loaded row count back from ?shown=, so Back returns to the same rows", () => {
    expect(shownRowCountFromParam("96", rows.length)).toBe(96);
    expect(shownRowCountFromParam("5000", rows.length)).toBe(636);
    for (const bad of [null, "", "abc", "12.5", "-96", "48", "10"]) {
      expect(shownRowCountFromParam(bad, rows.length)).toBe(INITIAL_RICH_SINGER_ROWS);
    }
  });
});
