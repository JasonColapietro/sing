import { NotPro } from "@/components/pro/gate";

/** The id on the homepage's Pro teaser section (app/page.tsx). */
export const PRO_TEASER_ID = "pro";

/**
 * The quiet route from a free call to action to the homepage's Pro teaser: a
 * text link, never a button, so the actions beside it stay the primary ones,
 * and unpriced, because the homepage prints the price once, on the teaser's
 * button (pro-claims.test.tsx).
 *
 * In the server HTML behind NotPro's pre-paint marker: a Pro browser hides it
 * before the first paint, so it neither shows nor moves anything for an
 * owner. A plain anchor: the browser makes the jump and InPageJumps
 * (app/layout.tsx) keeps the history entry usable.
 */
export function SeeWhatProAdds({ className }: { className?: string }) {
  return (
    <NotPro as="p" className={className}>
      <a
        href={`#${PRO_TEASER_ID}`}
        className="inline-flex min-h-11 items-center text-sm text-mut underline decoration-line2 underline-offset-4 transition-colors hover:text-violet-ink hover:decoration-violet"
      >
        See what Pro adds to this
      </a>
    </NotPro>
  );
}
