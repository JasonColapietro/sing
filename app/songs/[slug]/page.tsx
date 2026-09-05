import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { midiToName } from "@/lib/audio/notes";
import {
  ALL_SONGS,
  PRO_SONGS,
  SONGS,
  isProSong,
  songBySlug,
} from "@/components/songs/data";
import {
  LyricSheet,
  PublicDomainNote,
  SongLinkList,
  SongSectionMap,
  SongStats,
  SongTags,
  relatedSongs,
  songFacts,
  songLyricText,
} from "@/components/songs/song-page";
import { formatMinSec } from "@/components/songs/lib";
import type { Song } from "@/components/songs/types";
import { Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";
import { withCanonicalOpenGraph } from "@/lib/og";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { SITE_URL } from "@/lib/site";

interface Params {
  slug: string;
}

// The songbook is a fixed data module, so every URL that exists is known at
// build time. Anything else is a typo or a dead link and should 404 rather than
// render on demand.
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return ALL_SONGS.map((s) => ({ slug: s.slug }));
}

/** One sentence that answers "what is this song, musically" from the data. */
function answerSentence(song: Song): string {
  const f = songFacts(song);
  return `“${song.title}” is transcribed here with its tonic on ${f.tonic} at ${song.bpm} bpm in ${song.beatsPerBar} beats to the bar. The ${f.noteCount} notes span ${f.lowLabel} to ${f.highLabel} — ${f.rangeSemis} semitones — which rates ${f.difficulty} to sing, and a full ${f.loops}-pass session runs about ${formatMinSec(f.sessionSec)}.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const song = songBySlug(slug);
  if (!song) return {};
  const f = songFacts(song);
  const pro = isProSong(song.id);
  const title = `${song.title}: Lyrics, Key & Vocal Range`;
  const description = pro
    ? `“${song.title}” in ${f.tonic} at ${song.bpm} bpm, ranging ${f.lowLabel}–${f.highLabel}. Lyrics, structure and why it is public domain. Part of the Suede Pro songbook.`
    : `“${song.title}” in ${f.tonic} at ${song.bpm} bpm, ranging ${f.lowLabel}–${f.highLabel} (${f.difficulty}). Full lyrics, why it is public domain, and free browser practice with live pitch feedback.`;
  return withCanonicalOpenGraph({
    title,
    description,
    alternates: { canonical: `${SITE_URL}/songs/${song.slug}` },
    openGraph: { title, description, type: "article" },
    // Same call the atlas makes for gated chapters: a Pro song page is a real
    // page worth sharing, but it is not the page we want ranking for "sing
    // <title> free" when the practice room behind it is paid.
    robots: pro ? { index: false, follow: true } : undefined,
  });
}

export default async function SongPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const song = songBySlug(slug);
  if (!song) notFound();

  const pro = isProSong(song.id);
  const f = songFacts(song);
  const pageUrl = `${SITE_URL}/songs/${song.slug}`;
  const answer = answerSentence(song);
  const lyrics = songLyricText(song);

  // Free pages link free pages, Pro pages link Pro pages — see relatedSongs.
  const related = relatedSongs(song, pro ? PRO_SONGS : SONGS);

  // The two directions of the phrase/full pairing. `arrangementOf` points from
  // the full arrangement down to the phrase; the reverse has to be searched.
  const phraseVersion = song.arrangementOf
    ? ALL_SONGS.find((s) => s.id === song.arrangementOf)
    : undefined;
  const fullVersions = ALL_SONGS.filter((s) => s.arrangementOf === song.id);

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
        name: `${song.title}: Lyrics, Key & Vocal Range`,
        description: answer,
        inLanguage: "en",
        // Joins each song to the practice room's page and to the estate graph,
        // so a consumer landing here can resolve both the hub and the publisher.
        isPartOf: { "@id": `${SITE_URL}/songs#webpage` },
        publisher: { "@id": "https://suedeai.ai/#organization" },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Songs",
              item: `${SITE_URL}/songs`,
            },
            { "@type": "ListItem", position: 2, name: song.title, item: pageUrl },
          ],
        },
        mainEntity: { "@id": `${pageUrl}#composition` },
      },
      {
        // The melody itself, as data. MusicComposition earns no rich result —
        // it is here so a machine reading the page does not have to parse the
        // key, the tempo and the range back out of prose.
        "@type": "MusicComposition",
        "@id": `${pageUrl}#composition`,
        name: song.title,
        url: pageUrl,
        description: `${song.origin}. ${answer}`,
        inLanguage: song.language,
        genre: [song.genre, ...song.tags],
        // `musicalKey` wants a key name, so it gets the pitch class without the
        // octave; the octave-specific tonic the page actually prints goes in
        // additionalProperty below. No mode is asserted — several of these are
        // modal rather than major or minor.
        musicalKey: midiToName(song.defaultKeyRootMidi),
        lyrics: { "@type": "CreativeWork", text: lyrics },
        // Every field below is stated on the page. Nothing is inferred, and
        // there is deliberately no composer or lyricist claim: `origin` is an
        // attribution line, not a parsed name, and asserting the wrong person
        // as an entity is worse than asserting nobody.
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "Tonic",
            value: f.tonic,
          },
          {
            "@type": "PropertyValue",
            name: "Tempo",
            value: song.bpm,
            unitText: "bpm",
          },
          {
            "@type": "PropertyValue",
            name: "Beats per bar",
            value: song.beatsPerBar,
          },
          {
            "@type": "PropertyValue",
            name: "Lowest note",
            value: f.lowLabel,
          },
          {
            "@type": "PropertyValue",
            name: "Highest note",
            value: f.highLabel,
          },
          {
            "@type": "PropertyValue",
            name: "Range",
            value: f.rangeSemis,
            unitText: "semitones",
          },
          {
            "@type": "PropertyValue",
            name: "Note count",
            value: f.noteCount,
          },
          {
            "@type": "PropertyValue",
            name: "Difficulty",
            value: f.difficulty,
          },
          {
            "@type": "PropertyValue",
            name: "Public domain rationale",
            value: song.publicDomain,
          },
        ],
      },
    ],
  };

  return (
    <PageShell
      kicker={pro ? "Pro songbook" : "Free songbook"}
      title={song.title}
      subtitle={`${song.genre} · ${song.era} · ${song.origin}`}
      actions={
        <LinkButton href="/songs" variant="outline" size="md">
          ← All songs
        </LinkButton>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-6">
        {/* The one thing a visitor came to do, or the reason they can't yet. */}
        {pro ? (
          <Card className="border-violet/40">
            <SectionLabel className="border-violet/40 text-violet-ink">
              Included with Pro
            </SectionLabel>
            <h2 className="mt-3 text-xl">
              {song.title} is in the Pro songbook
            </h2>
            <p className="mt-3 max-w-2xl text-mut">
              The melody is public domain and the facts below are free to read,
              but this arrangement sits in the paid songbook alongside the rest
              of the extended catalog. The free songbook has{" "}
              {SONGS.length} melodies you can sing right now.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <LinkButton href="/pro" size="md">
                See what Pro includes
              </LinkButton>
              <LinkButton href="/songs" variant="outline" size="md">
                Sing the free songbook
              </LinkButton>
            </div>
          </Card>
        ) : (
          <Card>
            <h2 className="text-xl">Sing {song.title} with pitch feedback</h2>
            <p className="mt-3 max-w-2xl text-mut">{answer}</p>
            {/*
              Deep-links into the practice room so a reader who arrived from
              search lands on this melody rather than on the library, having
              already told us which song they wanted.
            */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <LinkButton href={`/songs?song=${song.slug}`} size="lg">
                Sing this song
              </LinkButton>
              <span className="text-xs text-dim">
                Free, in the browser. Opens {song.title} straight in the
                practice room, transposed into a key that suits your voice.
              </span>
            </div>
          </Card>
        )}

        <SongStats song={song} />
        <LyricSheet song={song} />
        <PublicDomainNote song={song} />
        <SongSectionMap song={song} />

        {/* The other version of the same melody, in whichever direction it exists. */}
        {(phraseVersion || fullVersions.length > 0) && (
          <Card>
            <SectionLabel>Other versions of this melody</SectionLabel>
            <h2 className="mt-3 text-xl">
              {phraseVersion
                ? "The short phrase version"
                : "The full arrangement"}
            </h2>
            <ul className="mt-4 space-y-2">
              {[...(phraseVersion ? [phraseVersion] : []), ...fullVersions].map(
                (other) => (
                  <li key={other.slug}>
                    <Link
                      href={`/songs/${other.slug}`}
                      className="flex flex-wrap items-baseline justify-between gap-3 rounded-xl border border-line bg-bg px-4 py-3 transition-colors hover:border-violet"
                    >
                      <span className="text-sm font-medium">{other.title}</span>
                      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-dim">
                        {other.form === "full"
                          ? "full arrangement"
                          : "opening phrase"}
                      </span>
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </Card>
        )}

        <Card>
          <SectionLabel>How it is filed</SectionLabel>
          <h2 className="mt-3 text-xl">Genre, era and what it drills</h2>
          <div className="mt-4">
            <SongTags song={song} />
          </div>
          <p className="mt-5 max-w-3xl text-sm text-mut">
            Tags describe what the melody asks of a voice, not what it sounds
            like — &ldquo;{song.tags[0] ?? song.genre.toLowerCase()}&rdquo; is
            the reason to pick it on a given day.
          </p>
        </Card>

        {related.length > 0 && (
          <Card>
            <SectionLabel>Sing next</SectionLabel>
            <h2 className="mt-3 text-xl">
              {pro
                ? "More from the Pro songbook"
                : `Other ${f.difficulty.toLowerCase()} songs and more ${song.genre}`}
            </h2>
            <div className="mt-4">
              <SongLinkList songs={related} />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <LinkButton href="/songs" variant="outline" size="sm">
                Every song
              </LinkButton>
              <LinkButton href="/range" variant="ghost" size="sm">
                Find your range first
              </LinkButton>
            </div>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
