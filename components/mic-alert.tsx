"use client";

import { useEffect, useRef } from "react";

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
 * about whether that spot is in view. Nothing here animates — the default
 * behaviour is an instant jump with no global `scroll-behavior: smooth` to
 * inherit — so there is no motion to opt out of.
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
    ref.current?.scrollIntoView({ block: "nearest" });
  }, [message]);

  return (
    <p ref={ref} role="alert" className={className}>
      {message}
    </p>
  );
}
