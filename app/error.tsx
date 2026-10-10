"use client";

import { useEffect } from "react";
import { Button, LinkButton, SectionLabel } from "@/components/ui";

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
 */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[room error]", error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-24 text-center sm:px-6">
      {/* The same tape label not-found.tsx gets from PageShell, so the two
          dead ends read as one family. */}
      <SectionLabel>Something broke</SectionLabel>
      <h1 className="mt-4 text-3xl sm:text-4xl">This room stopped working</h1>
      <p className="mx-auto mt-4 max-w-md text-mut">
        Not your microphone and not your practice — an error in the page itself.
        Trying again usually clears it, since most causes are momentary.
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm text-mut">
        Everything you have logged is stored on this device and is untouched by
        this.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {/* The shared rec button: it was a one-off in the mono face with no
            44px floor, the only primary action on the site drawn that way. */}
        <Button type="button" variant="rec" onClick={() => unstable_retry()}>
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
