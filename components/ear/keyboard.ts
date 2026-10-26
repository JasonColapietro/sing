/** Let focused controls own Enter without disabling the games' number keys. */
export function ignoreEarShortcut(event: KeyboardEvent): boolean {
  if (event.defaultPrevented) return true;
  if (event.key !== "Enter") return false;
  const target = event.target as HTMLElement | null;
  return !!(target?.isContentEditable || target?.closest?.(
    'button, a[href], input, textarea, select, summary, [role="button"]',
  ));
}
