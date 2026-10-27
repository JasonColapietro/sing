import type { ReactNode } from "react";

/**
 * One chapter's singer roster on the atlas contents page, closed behind a
 * summary that names its size. The rosters were most of the page's length on
 * a phone (about 35 screens).
 *
 * Closed at every width, from the server HTML on, with no script: a fold that
 * opened from `sm` up, or closed on a phone after load, would move everything
 * below it once the page had painted (a layout shift for every visitor on one
 * side of the breakpoint). Every link is still in the HTML, and a closed
 * <details> keeps its contents in the document for crawlers.
 */
export function RosterFold({
  count,
  children,
}: {
  count: number;
  children: ReactNode;
}) {
  return (
    <details className="mt-2">
      <summary className="cursor-pointer rounded-lg px-2 py-3 text-sm text-mut transition-colors hover:text-ink">
        {count === 1 ? "1 singer" : `${count} singers`} in this chapter
      </summary>
      {children}
    </details>
  );
}
