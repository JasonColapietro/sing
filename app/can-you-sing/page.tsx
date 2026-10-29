import type { Metadata } from "next";
import Link from "next/link";
import { RangeMini } from "@/components/singers/range-mini";
import { Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";
import { DEFAULT_OG_IMAGE, withCanonicalOpenGraph } from "@/lib/og";
import {
  POP_SONGS,
  popDifficulty,
  popRangeLabel,
} from "@/lib/pop-songs";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { SITE_URL, rangeTestHref } from "@/lib/site";
import { routeKeywords } from "@/lib/keywords";

const TITLE = "Can I Sing This Song? Popular Song Vocal Ranges";
const DESCRIPTION = `Can I sing this song? The key, vocal range and difficulty of ${POP_SONGS.length} popular songs, and whether each one fits your voice, measured against your free range test.`;

export const metadata: Metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/can-you-sing"),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/can-you-sing` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
});

/** Hard songs sort to the top read order last: easiest first sells the click. */
function sorted() {
  const rank = { Easy: 0, Medium: 1, Hard: 2 } as const;
  return [...POP_SONGS].sort(
    (a, b) =>
      rank[popDifficulty(a)] - rank[popDifficulty(b)] ||
      a.highMidi - a.lowMidi - (b.highMidi - b.lowMidi),
  );
}

export default function CanYouSingHub() {
  const songs = sorted();
  const pageUrl = `${SITE_URL}/can-you-sing`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      // The publisher, spelled out rather than pointed at. Every template on
      // this site referenced this @id without defining it, so a crawler
      // reading one page on its own resolved the pointer to nothing.
      ORG_PUBLISHER_NODE,
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: TITLE,
        description: DESCRIPTION,
        inLanguage: "en",
        publisher: { "@id": "https://suedeai.ai/#organization" },
        mainEntity: { "@id": `${pageUrl}#list` },
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#list`,
        numberOfItems: songs.length,
        itemListElement: songs.map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${s.title} — ${s.artist}`,
          url: `${pageUrl}/${s.slug}`,
        })),
      },
    ],
  };

  return (
    <PageShell
      kicker="Song ranges"
      title="Can I sing this song? Vocal ranges and keys of popular songs"
      subtitle={`A song is within reach when its vocal range sits inside yours, and it is easier to sing with room to spare at both ends. Here are the key, range and difficulty of ${songs.length} popular songs, from the commonly cited lead-vocal figures; take the free range test and every page answers for your voice specifically.`}
      actions={<LinkButton href={rangeTestHref()}>Find your range free</LinkButton>}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h2 className="mb-4 text-xl">Popular song vocal ranges, easiest first</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {songs.map((s) => (
          <Link key={s.slug} href={`/can-you-sing/${s.slug}`} className="group">
            <Card tone="raised" className="h-full">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-lg text-ink group-hover:text-violet-ink">
                  {s.title}
                </h3>
                <span className="font-mono text-xs text-dim">{s.year}</span>
              </div>
              <div className="mt-1 text-sm text-mut">{s.artist}</div>
              <div className="tabular mt-3 font-mono text-sm text-cool">
                {popRangeLabel(s)}
              </div>
              {/* One shared C2-C6 axis on every card, so "easiest first" reads by eye. */}
              <RangeMini low={s.lowMidi} high={s.highMidi} className="mt-2" />
              <div className="mt-1 text-xs text-dim">
                {s.key} · {popDifficulty(s)}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card tone="well" className="mt-8">
        <SectionLabel heading>How these figures work</SectionLabel>
        <p className="mt-3 max-w-prose text-sm text-mut">
          Each page cites the published key and the commonly circulated
          lead-vocal range, usually from a named original-key sheet-music
          arrangement; runs and ad-libs on the recording can go past its top
          note. Sources can differ by a note
          or two at either end, so treat these as approximations, never lab
          measurements. No lyrics or melodies are reproduced. Easy, Medium and
          Hard here come from the span and the top note: Easy is 14 semitones
          or fewer topping out at C5 or lower, Hard is 22 semitones or more or
          a top of F#5 or higher, and Medium is everything between; a few
          songs sung in the male octave, whose top is held in full voice above
          the tenor passaggio (D4–G4), are rated Hard for that reason. The
          free songbook rates its short practice phrases on its own, stricter
          scale, from span and leaps, so its labels do not carry over to this
          list. For what the artists themselves can do beyond one song, see
          the{" "}
          <Link
            className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet"
            href="/singers"
            prefetch={false}
          >
            famous singers&apos; vocal ranges
          </Link>{" "}
          library.
        </p>
      </Card>
    </PageShell>
  );
}
