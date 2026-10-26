/** Recorder-wide shortcuts yield to focused controls and handled events. */
export function recorderShortcut(event: KeyboardEvent): "play" | "record" | null {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return null;
  const target = event.target as HTMLElement | null;
  if (target?.isContentEditable || target?.closest?.(
    'button, a, input, textarea, select, summary, [role="button"], [role="slider"], [role="radio"], [role="tab"]',
  )) return null;
  if (event.key === " ") return "play";
  if (event.key.toLowerCase() === "r") return "record";
  return null;
}
