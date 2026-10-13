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

/**
 * The loaded row count read back from the directory's `?shown=` param, so
 * browser Back from a singer page returns to as many rows as were loaded.
 * Anything missing, malformed or not past the first batch is the first batch.
 */
export function shownRowCountFromParam(value: string | null, totalRows: number): number {
  const shown = Number(value);
  return Number.isInteger(shown) && shown > INITIAL_RICH_SINGER_ROWS
    ? Math.min(shown, totalRows)
    : INITIAL_RICH_SINGER_ROWS;
}
