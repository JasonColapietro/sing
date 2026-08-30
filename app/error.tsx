"use client";

import { useEffect } from "react";
import { LinkButton } from "@/components/ui";

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
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-violet-ink">
        Something broke
      </p>
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
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="inline-flex items-center justify-center rounded-full bg-rec px-5 py-2.5 font-mono text-sm font-semibold text-bg transition-opacity hover:opacity-90"
        >
          Try this room again
        </button>
        <LinkButton href="/studio" variant="outline" size="md">
          Go to the studio
        </LinkButton>
        <LinkButton href="/" variant="ghost" size="md">
          Back to the start
        </LinkButton>
      </div>
      {error.digest && (
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          Reference {error.digest}
        </p>
      )}
    </main>
  );
}
