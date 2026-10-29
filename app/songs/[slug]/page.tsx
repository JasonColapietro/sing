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
import { freeLessonsUsingSong } from "@/lib/lesson-readings";
import { LessonList } from "@/components/learn/lesson-list";

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

/** The second input computeDifficulty rates on, as the page's stat counts it. */
function leapPhrase(n: number): string {
  return n === 0
    ? "no leaps of a major third or more"
    : `${n} ${n === 1 ? "leap" : "leaps"} of a major third or more`;
}

/**
 * The structured-data description: "what is this song, musically", from the
 * data. The page itself shows these facts once, in SongStats.
 *
 * The rating names both of its inputs. computeDifficulty adds how densely a
 * melody leaps to its span, so "9 semitones — which rates Medium" on Loch
 * Lomond sat beside "9 semitones — which rates Hard" on Down in the Valley.
 * app/can-you-sing/[slug]/page.tsx names its own rule's inputs the same way
 * (span and top note, through popDifficultyReason); its scale is a different
 * one, for whole popular songs, and the /can-you-sing hub says so.
 */
function answerSentence(song: Song): string {
  const f = songFacts(song);
  const what = isPhrase(song)
    ? `The ${phraseName(song)} of “${song.title}”`
    : song.arrangementOf
      ? `The selected lines of “${song.title}”`
      : `“${song.title}”`;
  const transcription = !isPhrase(song) && song.arrangementOf
    ? "are transcribed here with their"
    : "is transcribed here with its";
  return `${what} ${transcription} tonic on ${f.tonic} at ${song.bpm} bpm, ${song.beatsPerBar} beats to the bar. Its ${f.noteCount} notes run ${f.lowLabel} to ${f.highLabel}: ${f.rangeSemis} semitones with ${leapPhrase(f.leaps)}. That span and those leaps rate it ${f.difficulty.toLowerCase()} to sing. A full ${f.loops}-pass session takes about ${formatMinSec(f.sessionSec)}.`;
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

  // The free course modules that practise on this song: the way back from a
  // song a visitor found first to the lessons built on it, as chapters have.
  const lessons = freeLessonsUsingSong(song.id);

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
        // The melody's identity, language and genre. Whole-song transcriptions
        // also expose their key and lyrics through supported properties.
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
        // octave. The octave-specific tonic and measured note range remain in
        // the visible text and description. No mode is asserted — some songs are
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
        // MusicComposition does not support additionalProperty. The measured
        // notes, tempo, meter and difficulty remain in the visible text and
        // description above, qualified to the transcribed phrase or lines.
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
      // The facts live once, in SongStats; the subtitle carries the origin,
      // which the page does not print anywhere else.
      subtitle={/[.!?)]$/.test(song.origin) ? song.origin : `${song.origin}.`}
      actions={
        // The singing action sits in the first screen, above the facts, so a
        // visitor who came to sing does not scroll past two paragraphs of
        // numbers on a phone to find it.
        pro ? (
          <LinkButton href="/songs" variant="outline" size="md">
            ← All songs
          </LinkButton>
        ) : (
          <div className="flex flex-col items-start gap-2">
            {/*
              Deep-links into the practice room so a reader who arrived from
              search lands on this melody rather than on the library. The
              practice room honours the link whatever band the song sits in
              (songs-client.tsx).
            */}
            <div className="flex flex-wrap items-center gap-2">
              <LinkButton href={`/songs?song=${song.slug}`} size="md">
                Sing {song.title}
              </LinkButton>
              <LinkButton href="/songs" variant="outline" size="md">
                ← All songs
              </LinkButton>
            </div>
            <p className="max-w-xl text-xs text-dim">
              Opens fitted to your measured range if you have taken the range
              test. Without one it opens in the written key and is scored in
              either octave, so a lower voice can sing it an octave down and a
              higher voice an octave up. Song practice counts toward{" "}
              {FREE_DAILY_MINUTES} free minutes of guided practice a day.
            </p>
          </div>
        )
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-6">
        {/* Why a Pro song cannot be sung here; a free one's button is in the header. */}
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
        ) : null}

        <SongStats song={song} />
        <LyricSheet song={song} />
        <PublicDomainNote song={song} />
        <SongSectionMap song={song} />

        {lessons.length > 0 && (
          <Card>
            <LessonList lessons={lessons} label="Free lessons that use this song" />
          </Card>
        )}

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
