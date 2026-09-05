import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CanYouSingVerdict } from "@/components/can-you-sing/verdict";
import { Card, PageShell, SectionLabel, Stat } from "@/components/ui";
import { midiToLabel } from "@/lib/audio/notes";
import { DEFAULT_OG_IMAGE, withCanonicalOpenGraph } from "@/lib/og";
import {
  POP_SONGS,
  popDifficulty,
  popRangeLabel,
  popSongBySlug,
  popSongSingers,
  relatedPopSongs,
  type PopSong,
} from "@/lib/pop-songs";
import { rangeLabel } from "@/lib/singers-core";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { SITE_URL } from "@/lib/site";

interface Params {
  slug: string;
}

// The catalog is a fixed data module, so every URL that exists is known at
// build time. Anything else is a typo or a dead link and should 404.
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return POP_SONGS.map((s) => ({ slug: s.slug }));
}

/** One sentence that answers the search query from the data alone. */
function answerSentence(song: PopSong): string {
  const span = song.highMidi - song.lowMidi;
  return `“${song.title}” by ${song.artist} is in ${song.key}, and the commonly cited lead-vocal range is ${popRangeLabel(song)} — ${span} semitones — which rates ${popDifficulty(song).toLowerCase()} for an untrained voice.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const song = popSongBySlug(slug);
  if (!song) return {};
  const title = `${song.title} Vocal Range & Key: Can You Sing It?`;
  const description = `${answerSentence(song)} Test your own range free and see whether it fits your voice.`;
  return withCanonicalOpenGraph({
    title,
    description,
    alternates: { canonical: `${SITE_URL}/can-you-sing/${song.slug}` },
    openGraph: { title, description, type: "article", images: [DEFAULT_OG_IMAGE] },
  });
}

export default async function CanYouSingSongPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const song = popSongBySlug(slug);
  if (!song) notFound();

  const pageUrl = `${SITE_URL}/can-you-sing/${song.slug}`;
  const answer = answerSentence(song);
  const singers = popSongSingers(song);
  const related = relatedPopSongs(song);
  const span = song.highMidi - song.lowMidi;

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
        name: `${song.title} Vocal Range & Key`,
        description: answer,
        inLanguage: "en",
        isPartOf: { "@id": `${SITE_URL}/can-you-sing#webpage` },
        publisher: { "@id": "https://suedeai.ai/#organization" },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Can you sing it?",
              item: `${SITE_URL}/can-you-sing`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: song.title,
              item: pageUrl,
            },
          ],
        },
        mainEntity: { "@id": `${pageUrl}#recording` },
      },
      {
        "@type": "MusicRecording",
        "@id": `${pageUrl}#recording`,
        name: song.title,
        byArtist: { "@type": "MusicGroup", name: song.artist },
        datePublished: String(song.year),
        genre: song.genre,
      },
    ],
  };

  return (
    <PageShell
      kicker="Can you sing it?"
      title={`${song.title} — ${song.artist}`}
      subtitle={answer}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-5">
              <Stat label="Key" value={song.key} tone="violet" />
              <Stat label="Low note" value={midiToLabel(song.lowMidi)} tone="cool" />
              <Stat label="High note" value={midiToLabel(song.highMidi)} tone="cool" />
              <Stat label="Span" value={span} sub="semitones" tone="ink" />
              <Stat label="Difficulty" value={popDifficulty(song)} tone="rec" />
            </div>
          </Card>

          <Card>
            <SectionLabel>What the voice is asked to do</SectionLabel>
            <p className="mt-3 max-w-prose text-sm text-mut">{song.blurb}</p>
            <p className="mt-4 text-xs text-dim">
              Figures are the commonly cited range and published key for the
              studio version ({song.sourceUrl ? (
                <a
                  className="underline underline-offset-2 hover:text-violet-ink"
                  href={song.sourceUrl}
                  rel="noreferrer"
                >
                  {song.sourceNote}
                </a>
              ) : song.sourceNote}), not lab measurements. No
              lyrics or melody are reproduced here — this page is about what
              the song demands of a voice.
            </p>
          </Card>

          {singers.length > 0 && (
            <Card>
              <SectionLabel>
                {singers.length === 1 ? "The voice behind it" : "The voices behind it"}
              </SectionLabel>
              <ul className="mt-3 space-y-2">
                {singers.map((s) => (
                  <li key={s.slug} className="text-sm">
                    <Link
                      className="text-violet-ink underline-offset-4 hover:underline"
                      href={`/singers/${s.slug}`}
                    >
                      {s.name} vocal range: {rangeLabel(s)} ({s.voiceType})
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-mut">
                A song&apos;s written range and its singer&apos;s full range are
                different facts — the library page shows what the artist can do
                beyond this song.
              </p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <CanYouSingVerdict song={song} />

          {related.length > 0 && (
            <Card>
              <SectionLabel>Similar demands</SectionLabel>
              <ul className="mt-3 space-y-2">
                {related.map((r) => (
                  <li key={r.slug} className="text-sm">
                    <Link
                      className="text-violet-ink underline-offset-4 hover:underline"
                      href={`/can-you-sing/${r.slug}`}
                    >
                      {r.title} — {r.artist} ({popRangeLabel(r)})
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}
