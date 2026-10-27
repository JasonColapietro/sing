import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, withCanonicalOpenGraph } from "@/lib/og";
import { Suspense } from "react";
import { PRO_SONGS, SONGS } from "@/components/songs/data";
import { SongLinkList } from "@/components/songs/song-page";
import { SongsClient } from "@/components/songs/songs-client";
import { SongsMicGate } from "@/components/songs/mic-gate";
import { SITE_URL } from "@/lib/site";
import { ToolGuide } from "@/components/guide";
import { SONGS_GUIDE } from "@/lib/guides";
import { LinkButton, SectionLabel } from "@/components/ui";
import { RoomRailBand } from "@/components/discover/room-rail";
import { routeKeywords } from "@/lib/keywords";

// Derived from the arrays rather than written down, so the counts cannot go
// stale as the songbook grows. A longer arrangement of a melody already in the
// book is not another melody, so it is not counted as one.
const TITLE = SONGS_GUIDE.pageName;
const MELODIES = SONGS.filter((s) => !s.arrangementOf).length;
const DESCRIPTION = `Public domain songs to sing with live pitch feedback: ${MELODIES} melodies, fitted to your range once you take the range test. 5 free minutes a day.`;

export const metadata: Metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/songs"),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/songs` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
});

export default function SongsPage() {
  return (
    <>
      {/*
        SongsClient reads ?song=<slug> so a song page can hand off to the
        practice room. useSearchParams client-side-renders the tree up to the
        nearest Suspense boundary, so the boundary sits here rather than around
        the page: everything below stays prerendered, which is the half a
        crawler reads.

        The fallback is the mic gate itself, not null. Every visitor meets that
        gate first — usePitch never auto-starts — so it is a real prerender of
        the page's own first screen, not a placeholder standing in for one, and
        it carries the <h1> this hub previously had nowhere in its static HTML.
        It also holds the space: a null fallback let hydration insert 494px of
        gate above the prerendered songbook and push all of it down, which was
        this page's CLS 0.36. SongsClient renders the same component, so the
        real gate lands in the box the fallback already drew. A singer at
        the free cap gets the wall over the library instead, so the fallback
        carries that too, shown by the pre-paint state (`prepaint`).
      */}
      <Suspense fallback={<SongsMicGate prepaint />}>
        <SongsClient />
      </Suspense>

      {/*
        The library above is a client component: its list exists only after
        hydration, so nothing crawls it and no internal link leaves it. This
        section is the hub's actual link surface into the per-song pages. Pro
        songs are listed the way the atlas contents page lists its gated
        chapters — visible and linked, with the pages themselves noindexed.
      */}
      <section id="songbook" className="mt-16 scroll-mt-20 border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <SectionLabel className="mb-4">Every song</SectionLabel>
          <h2 className="max-w-3xl text-2xl sm:text-3xl">The songbook, one page each</h2>
          <p className="mt-4 max-w-3xl text-mut">
            Every melody here is public domain, and every page says why. Each also gives
            the phrase you sing, the tonic it is transcribed on, its tempo, and
            its note span.
          </p>

          <h3 className="mt-10 font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-dim">
            Free to sing ({SONGS.length})
          </h3>
          <div className="mt-4">
            <SongLinkList songs={SONGS} />
          </div>

          {PRO_SONGS.length > 0 && (
            <>
              <h3 className="mt-10 font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-dim">
                Pro songbook ({PRO_SONGS.length})
              </h3>
              <div className="mt-4">
                <SongLinkList songs={PRO_SONGS} />
              </div>
              <div className="mt-6">
                <LinkButton href="/pro" variant="outline" size="sm">
                  What Pro includes
                </LinkButton>
              </div>
            </>
          )}
        </div>
      </section>

      <RoomRailBand current="/songs" />
      <ToolGuide guide={SONGS_GUIDE} />
    </>
  );
}
