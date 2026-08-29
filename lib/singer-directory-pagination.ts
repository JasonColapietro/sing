/** The directory stays useful without making its initial interactive render a full catalog dump. */
export const INITIAL_RICH_SINGER_ROWS = 48;

export function visibleRichSingerRows<T>(rows: readonly T[], visibleCount: number): T[] {
  return rows.slice(0, Math.max(0, visibleCount));
}

export function nextRichSingerRowCount(
  visibleCount: number,
  totalRows: number,
  batchSize = INITIAL_RICH_SINGER_ROWS,
): number {
  return Math.min(totalRows, visibleCount + batchSize);
}
