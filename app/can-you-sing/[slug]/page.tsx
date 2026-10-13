import type { Metadata } from "next";
import { popSongKeywords } from "@/lib/keywords";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CanYouSingAction, CanYouSingVerdict } from "@/components/can-you-sing/verdict";
import { Card, PageShell, SectionLabel, Stat } from "@/components/ui";
import { firstFit } from "@/lib/meta-fit";
import { DEFAULT_OG_IMAGE, withCanonicalOpenGraph } from "@/lib/og";
import {
  POP_SONGS,
  popDifficulty,
  popDifficultyReason,
  popNoteLabel,
  popRangeLabel,
  popSongBySlug,
  popSongSingers,
  relatedPopSongs,
  type PopSong,
} from "@/lib/pop-songs";
import { rangeLabel } from "@/lib/singers-core";
import { getSingerReviewStatus, singerReviewLabel } from "@/lib/singer-evidence";
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

/**
 * The answer to the search query, from the data alone.
 *
 * popDifficulty reads the span and the top note, so the sentence names
 * whichever decided (popDifficultyReason). An editorial override rates a song
 * above what its numbers say, so the answer names the reason the override
 * exists; a top note that alone made the rating names that note; every other
 * song credits its span, read with its top. Crediting the span every time put
 * Good Luck, Babe!'s "21 semitones — which rates hard" (hard for its F#5)
 * beside two other songs' "21 semitones — which rates medium". "On span and
 * top note" also tells a reader this is not the songbook's scale, which rates
 * short practice phrases on span and leaps and is stricter.
 */
function answerSentence(song: PopSong): string {
  const span = song.highMidi - song.lowMidi;
  const opening = `“${song.title}” by ${song.artist} is in ${song.key}, and the commonly cited lead-vocal range is ${popRangeLabel(song)} — ${span} semitones`;
  const rating = popDifficulty(song).toLowerCase();
  const reason = popDifficultyReason(song);
  if (reason === "override") {
    return `${opening}. Its top, held in full voice above the tenor passaggio, rates it ${rating} for an untrained voice.`;
  }
  if (reason === "top") {
    return `${opening}. Its top note, ${popNoteLabel(song, song.highMidi)}, rates it ${rating} for an untrained voice.`;
  }
  return `${opening} — which, on span and top note, rates ${rating} for an untrained voice.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const song = popSongBySlug(slug);
  if (!song) return {};
  // The artist disambiguates one-word titles ("Creep", "Flowers") when it fits.
  const title = firstFit([
    `${song.title} Vocal Range & Key (${song.artist})`,
    `${song.title} Vocal Range & Key: Can You Sing It?`,
    `${song.title} Vocal Range & Key`,
  ]);
  // Short enough to survive the snippet budget whole, so the call to action
  // ships; "cited" keeps the figures framed as sources, not measurements.
  const description = `“${song.title}” by ${song.artist}: ${song.key}, cited range ${popRangeLabel(song)} (${song.highMidi - song.lowMidi} semitones), rated ${popDifficulty(song).toLowerCase()}. Take the free range test to see if it fits you.`;
  return withCanonicalOpenGraph({
    title,
    description,
    keywords: popSongKeywords(song),
    alternates: { canonical: `${SITE_URL}/can-you-sing/${song.slug}` },
    // Title and description are filled in, fitted, by withCanonicalOpenGraph.
    openGraph: { type: "article", images: [DEFAULT_OG_IMAGE] },
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
      title={`Can you sing “${song.title}” by ${song.artist}? Key and vocal range`}
      subtitle={answer}
      actions={<CanYouSingAction song={song} />}
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
              {/* Spelled for the key, as the cited source spells them (Ab3, not G#3). */}
              <Stat label="Low note" value={popNoteLabel(song, song.lowMidi)} tone="cool" />
              <Stat label="High note" value={popNoteLabel(song, song.highMidi)} tone="cool" />
              <Stat label="Span" value={span} sub="semitones" tone="ink" />
              <Stat label="Difficulty" value={popDifficulty(song)} tone="rec" />
            </div>
          </Card>

          {/*
            The personal answer, straight after the figures: on a phone the
            sidebar column stacks below everything else, which put the page's
            only action under the stats, the blurb and the singer cards. The
            header action points here once a range is saved; Card takes no
            id, so the anchor is on the wrapper.
          */}
          <div id="fit" className="scroll-mt-20">
            <CanYouSingVerdict song={song} />
          </div>

          <Card>
            <SectionLabel heading>What the voice is asked to do</SectionLabel>
            <p className="mt-3 max-w-prose text-sm text-mut">{song.blurb}</p>
            <p className="mt-4 text-xs text-dim">
              Figures are the cited key and lead-vocal range ({song.sourceUrl ? (
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
              <SectionLabel heading>
                {singers.length === 1 ? "The voice behind it" : "The voices behind it"}
              </SectionLabel>
              {/*
                Catalog figures for real singers, framed as reported and, until
                a singer's record is individually reviewed, labelled so. A
                voice type is printed only where a review stands behind it —
                not for a pending record, and not for a disputed one.
              */}
              <ul className="mt-3 space-y-2">
                {singers.map((s) => (
                  <li key={s.slug} className="text-sm">
                    <Link
                      className="text-violet-ink underline-offset-4 hover:underline"
                      href={`/singers/${s.slug}`}
                    >
                      {s.name}&apos;s catalog range
                    </Link>
                    <span className="text-mut">
                      {" "}— reported {rangeLabel(s)}
                      {getSingerReviewStatus(s.slug) === "reviewed"
                        ? ` (${s.voiceType})`
                        : ` · ${singerReviewLabel(s.slug)}`}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-mut">
                A song&apos;s written range and a singer&apos;s reported
                catalog range are different facts — the catalog page explains
                what is and is not verified.
              </p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {related.length > 0 && (
            <Card>
              <SectionLabel heading>Songs with similar vocal demands</SectionLabel>
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

          <Link
            href="/can-you-sing"
            className="inline-flex min-h-11 items-center text-sm text-violet-ink underline-offset-4 hover:underline"
          >
            ← Every popular song&apos;s key and vocal range
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
