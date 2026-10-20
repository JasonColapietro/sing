/**
 * Where keyboard focus goes once a room's microphone is on.
 *
 * Every room asks for the mic from a gate card, and the gate unmounts the
 * moment the stream opens, taking the button that was pressed with it. Focus
 * then fell to <body>: a screen reader heard nothing about the room changing,
 * and the next Tab started from wherever the browser guessed (the studio's
 * "Shuffle off", the songs hub's banner above the quiz). /analyze and /tools
 * never had the problem because their start button turns into the stop button
 * in place. The other rooms move focus to their new live control instead.
 *
 * Only when focus was actually dropped: a singer who has already moved on
 * (tabbed into a picker, or restarted the mic with a shortcut key) keeps it.
 * No scroll: each room already scrolls where it wants the singer to look.
 */
export function focusIfDropped(
  target: HTMLElement | null | undefined,
  doc: Pick<Document, "activeElement" | "body"> = document,
): boolean {
  if (!target || !target.isConnected) return false;
  const active = doc.activeElement;
  if (active && active !== doc.body && active.isConnected) return false;
  target.focus({ preventScroll: true });
  return true;
}
