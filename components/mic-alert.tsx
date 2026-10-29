"use client";

import { useEffect, useRef } from "react";

/** Gap left between the message and the top of the phone tab bar. */
const TAB_BAR_CLEARANCE = 8;

/**
 * How far to scroll so `el` sits clear of the phone's fixed tab bar, or 0.
 *
 * `scrollIntoView({ block: "nearest" })` counts the strip under the fixed bar
 * as on screen (and Chromium ignores scroll-margin for it), so on a 375×667
 * phone a blocked mic on /studio or /songs rendered its instructions at
 * 625–667px, behind the bar at 610, and the press looked dead. Only measured
 * when the bar is what is actually on top there: it is `sm:hidden` on
 * desktop, and a full-screen session (z-[70]) covers it, where scrolling
 * would move the hidden page underneath instead of the message.
 */
export function tabBarOverlap(el: Element, doc: Document = document): number {
  const bar = doc.querySelector('nav[aria-label="Tabs"]');
  if (!bar) return 0;
  const barTop = bar.getBoundingClientRect().top;
  const view = doc.defaultView;
  if (!view || barTop >= view.innerHeight) return 0;
  const onTop = doc.elementFromPoint(view.innerWidth / 2, barTop + 1);
  if (!onTop || !bar.contains(onTop)) return 0;
  const overlap = el.getBoundingClientRect().bottom - barTop + TAB_BAR_CLEARANCE;
  return overlap > 0 ? overlap : 0;
}

/**
 * The one way a microphone failure is shown in a practice room.
 *
 * A room's mic card is not always what the singer pressed. /warmups puts a
 * catalogue of exercises under its gate card and starts the mic from any of
 * them; /range starts it again from the saved-result card. In both, the
 * message rendered in the card while the singer was looking somewhere else —
 * up to 843px above the fold on /warmups — so the press read as a dead button.
 * `role="alert"` announced it, which is why this stayed invisible to everyone
 * except the people who could see the page.
 *
 * Scrolling to `nearest` costs nothing when the line is already on screen, so
 * every room can render this wherever the message belongs and stop reasoning
 * about whether that spot is in view. On a phone it then lifts the line clear
 * of the tab bar (tabBarOverlap), which `nearest` treats as visible. Nothing
 * here animates — the default behaviour is an instant jump with no global
 * `scroll-behavior: smooth` to inherit — so there is no motion to opt out of.
 *
 * Rendering it in exactly one place at a time is the caller's job: two of these
 * on a page is two announcements of the same failure.
 */
export function MicAlert({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  // Keyed on the message, not just on mount: a second attempt that fails a
  // different way (blocked, then busy) rewrites this line in place, and
  // `role="alert"` re-announces it. The scroll has to follow.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollIntoView({ block: "nearest" });
    // `nearest` can leave the line flush with (or a fraction past) the screen's bottom edge; keep the same clearance there.
    const edge = el.getBoundingClientRect().bottom - (window.innerHeight - TAB_BAR_CLEARANCE);
    const lift = Math.max(tabBarOverlap(el), edge > 0 ? edge : 0);
    if (lift > 0) window.scrollBy(0, lift);
  }, [message]);

  return (
    <p ref={ref} role="alert" className={className}>
      {message}
    </p>
  );
}
