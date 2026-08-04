import type { Metadata } from "next";
import { PRO_SONGS, SONGS } from "@/components/songs/data";
import { SongLinkList } from "@/components/songs/song-page";
import { SongsClient } from "@/components/songs/songs-client";
import { SITE_URL } from "@/lib/site";
import { ToolGuide } from "@/components/guide";
import { SONGS_GUIDE } from "@/lib/guides";
import { LinkButton, SectionLabel } from "@/components/ui";

// Derived from the arrays rather than written down, so the counts cannot go
// stale as the songbook grows.
const TITLE = `Karaoke Practice: ${SONGS.length} Free Public-Domain Songs to Sing`;
const DESCRIPTION = `Sing ${SONGS.length} public-domain melodies with live pitch feedback in your browser. Each transposes to your range, and each has a page with its lyrics, key, tempo and note range.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/songs` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
};

export default function SongsPage() {
  return (
    <>
      <SongsClient />

      {/*
        The library above is a client component: its list exists only after
        hydration, so nothing crawls it and no internal link leaves it. This
        section is the hub's actual link surface into the per-song pages. Pro
        songs are listed the way the atlas contents page lists its gated
        chapters — visible and linked, with the pages themselves noindexed.
      */}
      <section className="mt-16 border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <SectionLabel className="mb-4">Every song</SectionLabel>
          <h2 className="max-w-3xl text-3xl">The songbook, one page each</h2>
          <p className="mt-4 max-w-3xl text-mut">
            Every melody here is public domain, and every page says why — plus
            its lyrics as transcribed, the key it sits in, its tempo, and the
            exact note range you need to sing it.
          </p>

          <h3 className="mt-10 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Free to sing ({SONGS.length})
          </h3>
          <div className="mt-4">
            <SongLinkList songs={SONGS} />
          </div>

          {PRO_SONGS.length > 0 && (
            <>
              <h3 className="mt-10 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
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

      <ToolGuide guide={SONGS_GUIDE} />
    </>
  );
}
