import { describe, expect, it } from "vitest";

import {
  INITIAL_RICH_SINGER_ROWS,
  nextRichSingerRowCount,
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
});
