import type { Metadata } from "next";
import { songKeywords } from "@/lib/keywords";
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
import { formatMinSec, phraseName } from "@/components/songs/lib";
import type { Song } from "@/components/songs/types";
import { Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";
import { firstFit, MAX_DESCRIPTION, MAX_TITLE } from "@/lib/meta-fit";
import { withCanonicalOpenGraph } from "@/lib/og";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import { pageRobots } from "@/lib/robots-meta";
import { SITE_URL, rangeTestHref } from "@/lib/site";

interface Params {
  slug: string;
}

// The songbook is a fixed data module, so every URL that exists is known at
// build time. Anything else is a typo or a dead link and should 404 rather than
// render on demand.
export const dynamicParams = false;

/** Distinct free melodies: a longer arrangement of one is not another melody (as on /songs). */
const FREE_MELODIES = SONGS.filter((s) => !s.arrangementOf).length;

export function generateStaticParams(): Params[] {
  return ALL_SONGS.map((s) => ({ slug: s.slug }));
}

/**
 * Most entries transcribe a song's opening phrase, not the whole song. Their
 * range, tonic and words are facts about that phrase, so every claim the page
 * makes — title, heading, snippet, structured data — says so rather than
 * presenting them as the song's lyrics and vocal range. One phrase entry is
 * not the opening (Home on the Range holds its chorus hook), so the phrase is
 * named by `phraseName`, never by a literal.
 */
function isPhrase(song: Song): boolean {
  return song.form === "phrase";
}

/** The phrase's name in title case, for the page title. */
function phraseTitle(song: Song): string {
  return phraseName(song).replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * A longer arrangement (`arrangementOf`) sings selected lines, not every
 * verse, so like a phrase it is a partial transcription: its words are not the
 * song's lyrics and its tonic is where this transcription sits, not the
 * song's key.
 */
function isPartial(song: Song): boolean {
  return song.form === "phrase" || song.arrangementOf !== undefined;
}

/**
 * Tags that name what a melody asks of a voice, as opposed to its genre,
 * occasion or origin ("christmas", "scottish", "hymn"), its meter ("waltz"),
 * its scale ("modal", "dorian", "pentatonic") or its shape ("chorus hook",
 * "pickup").
 * Those describe where a melody comes from or how it sounds; only these say
 * what singing it takes.
 */
const DEMAND_TAGS = new Set([
  "stepwise",
  "narrow range",
  "wide range",
  "leap",
  "octave leap",
  "long tones",
  "legato",
  "repeated note",
  "dotted rhythm",
]);

/** The page's title: what the page actually answers, in the 60-character budget. */
function songTitle(song: Song): string {
  if (song.arrangementOf) {
    return firstFit([`Sing ${song.title}: Key & Note Range`, `Sing ${song.title}`], MAX_TITLE);
  }
  return isPhrase(song)
    ? firstFit(
        [
          `Sing ${song.title}: ${phraseTitle(song)}, Key & Range`,
          `Sing ${song.title}: ${phraseTitle(song)} & Key`,
          `Sing ${song.title}: ${phraseTitle(song)}`,
          `Sing ${song.title}`,
        ],
        MAX_TITLE,
      )
    : // The lyrics term leads every tail variant, so a long song name sheds
      // the trailing words rather than the keyword.
      firstFit(
        [
          `${song.title}: Lyrics, Key & Vocal Range`,
          `${song.title}: Lyrics, Key & Range`,
          `${song.title}: Lyrics & Key`,
          `${song.title}: Lyrics`,
        ],
        MAX_TITLE,
      );
}

/** One sentence that answers "what is this song, musically" from the data. */
function answerSentence(song: Song): string {
  const f = songFacts(song);
  const what = isPhrase(song)
    ? `The ${phraseName(song)} of “${song.title}”`
    : `“${song.title}”`;
  return `${what} is transcribed here with its tonic on ${f.tonic} at ${song.bpm} bpm in ${song.beatsPerBar} beats to the bar. The ${f.noteCount} notes span ${f.lowLabel} to ${f.highLabel} — ${f.rangeSemis} semitones — which rates ${f.difficulty} to sing, and a full ${f.loops}-pass session runs about ${formatMinSec(f.sessionSec)}.`;
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
  const title = songTitle(song);
  // What the title promises leads; whole sentences only, so a long song name
  // sheds the tail rather than a clause.
  const phraseFacts = `${f.lowLabel} to ${f.highLabel}, tonic ${f.tonic}, rated ${f.difficulty.toLowerCase()}.`;
  // A partial transcription leads with singing, not "<song> lyrics". A longer
  // arrangement's own title already names the lines it holds.
  const partialName = song.arrangementOf
    ? song.title
    : `the ${phraseName(song)} of ${song.title}`;
  const description = isPartial(song)
    ? pro
      ? `${song.arrangementOf ? song.title : `The ${phraseName(song)} of ${song.title}`}: ${phraseFacts} Public domain; the practice arrangement is in the Suede Pro songbook.`
      : firstFit(
          [
            `Sing ${partialName} with live pitch feedback: ${phraseFacts} Public domain; fitted to your range after the range test.`,
            `Sing ${partialName} with live pitch feedback: ${phraseFacts} Public domain.`,
          ],
          MAX_DESCRIPTION,
        )
    : pro
      ? `${song.title} lyrics, key and vocal range: ${f.lowLabel} to ${f.highLabel} with its tonic on ${f.tonic}. Public domain; the practice arrangement is in the Suede Pro songbook.`
      : `${song.title} lyrics, key and vocal range: ${f.lowLabel} to ${f.highLabel} with its tonic on ${f.tonic}, rated ${f.difficulty.toLowerCase()}. Public domain, with browser practice and live pitch feedback.`;
  return withCanonicalOpenGraph({
    title: { absolute: title },
    description,
    // Form-aware: a phrase page leads with "sing <song>", not "<song> lyrics".
    keywords: songKeywords(song),
    alternates: { canonical: `${SITE_URL}/songs/${song.slug}` },
    // Title and description come from withCanonicalOpenGraph, already fitted;
    // the image is this route's own opengraph-image file.
    openGraph: { type: "article" },
    // Same call the atlas makes for gated chapters: a Pro song page is a real
    // page worth sharing, but it is not the page we want ranking for "sing
    // <title> free" when the practice room behind it is paid.
    robots: pageRobots(!pro),
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
  const phrase = isPhrase(song);
  const partial = isPartial(song);
  const f = songFacts(song);
  const drill = song.tags.find((t) => DEMAND_TAGS.has(t));
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
        name: songTitle(song),
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
        // The genre alone. Tags such as "narrow range" or "two verses" say what
        // the melody asks of a voice or how it is arranged, not where it comes
        // from, and the lowercase genre tags would repeat the genre.
        genre: song.genre,
        // `musicalKey` wants a key name, so it gets the pitch class without the
        // octave; the octave-specific tonic the page actually prints goes in
        // additionalProperty below. No mode is asserted — several of these are
        // modal rather than major or minor. A partial transcription (a phrase,
        // or a longer arrangement of selected lines) carries neither: its tonic
        // is where this transcription sits, not the song's key, and its words
        // are some lines, not the song's lyrics.
        ...(partial
          ? {}
          : {
              musicalKey: midiToName(song.defaultKeyRootMidi),
              lyrics: { "@type": "CreativeWork", text: lyrics },
            }),
        // Every field below is stated on the page. Nothing is inferred, and
        // there is deliberately no composer or lyricist claim: `origin` is an
        // attribution line, not a parsed name, and asserting the wrong person
        // as an entity is worse than asserting nobody.
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: partial ? "Transcription tonic" : "Tonic",
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
            name: phrase
              ? `Lowest note (${phraseName(song)})`
              : song.arrangementOf
                ? "Lowest note (these lines)"
                : "Lowest note",
            value: f.lowLabel,
          },
          {
            "@type": "PropertyValue",
            name: phrase
              ? `Highest note (${phraseName(song)})`
              : song.arrangementOf
                ? "Highest note (these lines)"
                : "Highest note",
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
      kicker={`${pro ? "Pro songbook" : "Free songbook"} · ${song.genre} · ${song.era}`}
      title={
        phrase
          ? `Sing ${song.title}: the ${phraseName(song)}, its key and note range`
          : song.arrangementOf
            ? `Sing ${song.title}: the lines, their key and note range`
            : `Sing ${song.title}: lyrics, key and vocal range`
      }
      subtitle={`${phrase ? `The ${phraseName(song)} of “${song.title}”` : `“${song.title}”`} runs from ${f.lowLabel} to ${f.highLabel}, ${f.rangeSemis} semitones, with its tonic on ${f.tonic} at ${song.bpm} bpm, and rates ${f.difficulty.toLowerCase()} to sing. Origin: ${song.origin}.`}
      actions={
        // The singing action sits in the first screen, above the facts, so a
        // visitor who came to sing does not scroll past two paragraphs of
        // numbers on a phone to find it.
        pro ? (
          <LinkButton href="/songs" variant="outline" size="md">
            ← All songs
          </LinkButton>
        ) : (
          <>
            <LinkButton href={`/songs?song=${song.slug}`} size="md">
              Sing {song.title}
            </LinkButton>
            <LinkButton href="/songs" variant="outline" size="md">
              ← All songs
            </LinkButton>
          </>
        )
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
              {FREE_MELODIES} melodies you can sing right now.
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
              already told us which song they wanted. The practice room honours
              the link whatever band the song sits in (songs-client.tsx).
            */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <LinkButton href={`/songs?song=${song.slug}`} size="lg">
                Sing this song
              </LinkButton>
              <span className="text-xs text-dim">
                Opens {song.title} in the practice room, fitted to your
                measured range if you have taken the range test; if not, it
                opens in the written key and is scored in either octave. Free
                in the browser: song practice counts
                toward {FREE_DAILY_MINUTES} free minutes of guided practice a
                day.
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
                : "The longer version"}
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
                          ? "longer version"
                          : phraseName(other)}
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
          <h2 className="mt-3 text-xl">
            {drill ? "Genre, era and what it drills" : "Genre, era and tags"}
          </h2>
          <div className="mt-4">
            <SongTags song={song} />
          </div>
          {drill && (
            <p className="mt-5 max-w-3xl text-sm text-mut">
              Genre and era say where the melody comes from; &ldquo;{drill}&rdquo;
              is what it asks of a voice.
            </p>
          )}
        </Card>

        {related.length > 0 && (
          <Card>
            <SectionLabel>Sing next</SectionLabel>
            <h2 className="mt-3 text-xl">
              {pro
                ? "More from the Pro songbook"
                : related.some((r) => r.genre === song.genre)
                  ? `Other ${f.difficulty.toLowerCase()} songs and more ${song.genre}`
                  : `Other ${f.difficulty.toLowerCase()} songs`}
            </h2>
            <div className="mt-4">
              <SongLinkList songs={related} />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <LinkButton href="/songs" variant="outline" size="sm">
                Every song
              </LinkButton>
              <LinkButton href={rangeTestHref()} variant="ghost" size="sm">
                Find your range first
              </LinkButton>
            </div>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
