"use client";

import { useEffect, useRef } from "react";
import { Button, LinkButton, SectionLabel } from "@/components/ui";

/**
 * A part of the room that never downloaded, as the bundler names it: the
 * connection dropped after the page loaded. Trying again cannot help until
 * it is back, so the page says that instead of blaming the page itself.
 * Module-private: an error file exports its component and nothing else.
 */
function isChunkLoadError(error: { name?: string; message?: string }): boolean {
  return (
    error.name === "ChunkLoadError" ||
    /Failed to load chunk|Loading chunk [\w-]+ failed/.test(error.message ?? "")
  );
}

/**
 * Route-level error boundary.
 *
 * There was none, so an uncaught render error in a practice room dropped the
 * singer onto Next's built-in fallback — an unbranded page reading
 * "Application error: a client-side exception has occurred", with no nav and
 * no way onward but the back button. Every room is a heavy client component
 * doing live audio work, which is exactly where an unexpected throw is most
 * likely, and the funnel ended there.
 *
 * The nav and footer survive this, because error.tsx replaces the page rather
 * than the layout above it.
 *
 * It opens at the top of the page. The room it replaces could be scrolled a
 * long way down (a phone singer pressing "Start singing" on /range sits about
 * 390px in), and the scroll was kept, so the heading and "Try this room again"
 * were above the screen and only the footer links were in view. Focus moves
 * to the heading as well: the control that was pressed is gone.
 *
 * "Try this room again" calls `retry`, the prop Next 16.3 passes (with
 * `reset`). The 16.2 name, `unstable_retry`, is no longer passed, so a button
 * wired to it threw "is not a function" and the page's main way out was dead.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    console.error("[room error]", error);
  }, [error]);
  useEffect(() => {
    window.scrollTo(0, 0);
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  const offline = isChunkLoadError(error);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-24 text-center sm:px-6">
      {/* The same tape label not-found.tsx gets from PageShell, so the two
          dead ends read as one family. */}
      <SectionLabel>Something broke</SectionLabel>
      <h1 ref={headingRef} tabIndex={-1} className="mt-4 text-3xl outline-none sm:text-4xl">
        This room stopped working
      </h1>
      <p className="mx-auto mt-4 max-w-md text-mut">
        {offline
          ? "Part of this room did not download, which usually means the connection dropped. Once you are back online, try this room again."
          : "Not your microphone and not your practice: an error in the page itself. Trying again usually clears it, since most causes are momentary."}
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm text-mut">
        Everything you have logged is stored on this device and is untouched by
        this.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {/* The shared rec button: it was a one-off in the mono face with no
            44px floor, the only primary action on the site drawn that way. */}
        <Button type="button" variant="rec" onClick={() => retry()}>
          Try this room again
        </Button>
        <LinkButton href="/studio" variant="outline" size="md">
          Go to the studio
        </LinkButton>
        <LinkButton href="/" variant="ghost" size="md">
          Back to the start
        </LinkButton>
      </div>
      {error.digest && (
        <p className="mt-8 font-mono text-label uppercase tracking-[0.14em] text-dim">
          Reference {error.digest}
        </p>
      )}
    </main>
  );
}
