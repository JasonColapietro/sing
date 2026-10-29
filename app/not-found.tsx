import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, LinkButton, PageShell } from "@/components/ui";
import { PRICING, formatPrice } from "@/lib/pro-shared";
import { NOINDEX_FOLLOW } from "@/lib/robots-meta";
import { rangeTestHref } from "@/lib/site";

// Without the title the tab and history entry carry the home page's title, so
// a dead link reads as the studio until the page itself says otherwise.
//
// robots: Next injects its own `noindex` on every 404, but the root layout's
// INDEXABLE_ROBOTS is still inherited, so without this key the page shipped a
// second, contradicting `index, follow` tag beside it. Setting it here keeps
// the one directive a missing page should carry; links stay followed so the
// recovery buttons below still pass crawlers on.
export const metadata: Metadata = { title: "Page not found", robots: NOINDEX_FOLLOW };

// The likeliest dead links on a song-range site are guessed or mistyped
// /can-you-sing/<song> and /songs/<song> URLs, so recovery offers a tool and
// the song lookup rather than the landing page.
export default function NotFound() {
  return (
    <PageShell kicker="404" title="That page isn't here">
      <EmptyState
        title="Try one of these"
        hint="The page may have moved, or the link had a typo. The range test, the song lookup and the pitch studio are each one tap away."
        action={
          <>
            <div className="flex flex-wrap justify-center gap-3">
              <LinkButton href={rangeTestHref()}>Find your vocal range</LinkButton>
              <LinkButton href="/can-you-sing" variant="outline">
                Look up a song&apos;s key and range
              </LinkButton>
              <LinkButton href="/studio" variant="outline">
                Open the pitch studio
              </LinkButton>
            </div>
            {/* One quiet line below the practice links: the free tools stay
                the recovery, and the paid tier is named once, with its price
                read from the pricing code. A priced ask lands on the buy card. */}
            <p className="mt-4 text-sm text-mut">
              Or see{" "}
              <Link href="/pro#buy" className="text-violet-ink underline underline-offset-4">
                what Suede Pro adds
              </Link>
              , {formatPrice(PRICING.lifetime.amount)} once.
            </p>
          </>
        }
      />
    </PageShell>
  );
}
