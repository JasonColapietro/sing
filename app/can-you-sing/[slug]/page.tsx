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
import { VOICE_KINDS, describeSpan, rangeLabel, voiceTypeSlug, type VoiceKind } from "@/lib/singers-core";
import { REFERENCE_BANDS } from "@/lib/singers-analysis";
import { getSingerReviewStatus, singerReviewLabel } from "@/lib/singer-evidence";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { SITE_URL, rangeTestHref } from "@/lib/site";

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
  const opening = `“${song.title}” by ${song.artist} is in ${song.key}, and the commonly cited lead-vocal range is ${popRangeLabel(song)}, ${span} semitones`;
  const rating = popDifficulty(song).toLowerCase();
  const reason = popDifficultyReason(song);
  if (reason === "override") {
    return `${opening}. Its top, held in full voice above the tenor passaggio, rates it ${rating} for an untrained voice.`;
  }
  if (reason === "top") {
    return `${opening}. Its top note, ${popNoteLabel(song, song.highMidi)}, rates it ${rating} for an untrained voice.`;
  }
  return `${opening}, which on span and top note rates ${rating} for an untrained voice.`;
}

/**
 * The line under the H1: who sang it, and what decided the rating. The key and
 * range are in the stat row right below, so it does not restate them; the
 * full answerSentence is the structured-data description.
 */
function ratingLine(song: PopSong): string {
  const rating = popDifficulty(song).toLowerCase();
  const reason = popDifficultyReason(song);
  const why =
    reason === "override"
      ? `Its top, held in full voice above the tenor passaggio, rates it ${rating} for an untrained voice.`
      : reason === "top"
        ? `Its top note, ${popNoteLabel(song, song.highMidi)}, rates it ${rating} for an untrained voice.`
        : `On span and top note it rates ${rating} for an untrained voice.`;
  return `By ${song.artist}, ${song.year}. ${why}`;
}


/**
 * The conventional voice-type bands (REFERENCE_BANDS, the same spans
 * /atlas/vocal-range-by-voice-type prints) that hold the song's whole cited
 * range when it is moved by `shift` semitones. Pure arithmetic on two stored
 * figures, so it says nothing about who may sing the song.
 */
function bandsHolding(song: PopSong, shift: number): VoiceKind[] {
  return VOICE_KINDS.filter((v) => {
    const band = REFERENCE_BANDS[v];
    return band.low <= song.lowMidi + shift && band.high >= song.highMidi + shift;
  });
}

const BANDS_NOTE =
  "The bands are the conventional spans on vocal range by voice type, not a rule about who may sing a song. Your own range test is the better guide.";

function shiftedRange(song: PopSong, shift: number): string {
  return `${popNoteLabel(song, song.lowMidi + shift)}–${popNoteLabel(song, song.highMidi + shift)}`;
}

/** "tenor and baritone", "bass, baritone and tenor". */
function joinTypes(types: VoiceKind[]): string {
  const names = types.map((t) => t.toLowerCase());
  return names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/** Plain sentences for the voice-type card and its FAQ answer. */
function voiceTypeSentences(song: PopSong): { written: string; octaves: string[] } {
  const span = song.highMidi - song.lowMidi;
  const asWritten = bandsHolding(song, 0);
  const written =
    asWritten.length > 0
      ? `As written, ${popRangeLabel(song)} sits inside the conventional band for ${asWritten.length === 1 ? "one voice type" : `${asWritten.length} voice types`}: ${joinTypes(asWritten)}.`
      : span > 24
        ? `As written, ${popRangeLabel(song)} fits inside none of the eight conventional voice-type bands: its span of ${describeSpan(span)} is wider than the two octaves each band covers.`
        : `As written, ${popRangeLabel(song)} fits inside none of the eight conventional voice-type bands: it straddles the edge between two of them.`;
  const octaves = ([-12, 12] as const).flatMap((shift) => {
    const types = bandsHolding(song, shift);
    return types.length > 0
      ? [`Sung an octave ${shift < 0 ? "lower" : "higher"} (${shiftedRange(song, shift)}), it sits inside the band for ${joinTypes(types)}.`]
      : [];
  });
  return { written, octaves };
}

/**
 * The questions a searcher brings to a song page, answered from the entry's
 * own fields. Each renders as a visible h3 and as the FAQPage node, from the
 * same strings, so the markup cannot drift from the page.
 */
function songFaq(song: PopSong): { q: string; a: string }[] {
  const span = song.highMidi - song.lowMidi;
  const name = `“${song.title}”`;
  return [
    {
      q: `What key is ${name} in?`,
      a: `${name} by ${song.artist} (${song.year}) is in ${song.key}, the original key as published. The low and high notes on this page are spelled for that key.`,
    },
    {
      q: `What is the vocal range of ${name}?`,
      a: `The commonly cited lead-vocal range is ${popNoteLabel(song, song.lowMidi)} to ${popNoteLabel(song, song.highMidi)}, a span of ${span} semitones (${describeSpan(span)}). These are cited figures for the lead line, not a measurement taken from the recording.`,
    },
    {
      q: `Can I sing ${name} in a lower or higher key?`,
      a: `Yes. Changing the key moves every note by the same distance. Two semitones down, the cited range becomes ${shiftedRange(song, -2)}; two semitones up, it becomes ${shiftedRange(song, 2)}. Once you have taken the range test, this page works out how far to move it for your voice.`,
    },
    {
      q: `How do I find out if ${name} fits my voice?`,
      a: `Take the free vocal range test. It listens while you slide down and then up, keeps your lowest and highest clear notes on this device, and this page then compares them with ${popRangeLabel(song)}. A range test finds your limits rather than your comfortable band, so a song whose top or bottom lands at the edge of your result will still be work.`,
    },
  ];
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
  const faq = songFaq(song);
  const types = voiceTypeSentences(song);

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
        // Singer-library links name vocalists, which can be only one member
        // of a band or duet. Use the recording's full credits for its artists.
        byArtist: (song.artistCredits ?? [{ name: song.artist, type: "Person" }]).map((artist) => ({
          "@type": artist.type,
          name: artist.name,
        })),
        datePublished: String(song.year),
        genre: song.genre,
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        url: pageUrl,
        isPartOf: { "@id": `${pageUrl}#webpage` },
        mainEntity: [
          // These two render under their own card headings above the list.
          { q: `Is “${song.title}” hard to sing?`, a: song.blurb },
          {
            q: `Which voice types does “${song.title}” sit in?`,
            a: [...[types.written, ...types.octaves], BANDS_NOTE].join(" "),
          },
          ...faq,
        ].map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };

  return (
    <PageShell
      kicker="Can you sing it?"
      title={`Can you sing “${song.title}”?`}
      subtitle={ratingLine(song)}
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
              <Stat label="Key" value={song.key} tone="ink" />
              {/* Spelled for the key, as the cited source spells them (Ab3, not G#3). */}
              <Stat label="Low note" value={popNoteLabel(song, song.lowMidi)} tone="cool" />
              <Stat label="High note" value={popNoteLabel(song, song.highMidi)} tone="cool" />
              <Stat label="Span" value={span} sub="semitones" tone="ink" />
              <Stat label="Difficulty" value={popDifficulty(song)} tone="ink" />
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
            <SectionLabel heading>{`Is “${song.title}” hard to sing?`}</SectionLabel>
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
              lyrics or melody are reproduced here; this page is about what
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
                reviewed or owner-confirmed record shows its voice type as a
                catalog label, as /singers/records does, never as a bare fact;
                a pending or disputed record shows its review status instead.
              */}
              <ul className="mt-3 space-y-2">
                {singers.map((s) => (
                  <li key={s.slug} className="text-sm">
                    <Link
                      className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet"
                      href={`/singers/${s.slug}`}
                      prefetch={false}
                    >
                      {s.name}&apos;s catalog range
                    </Link>
                    <span className="text-mut">
                      : reported {rangeLabel(s)}
                      {getSingerReviewStatus(s.slug) === "reviewed"
                        ? ` (catalog label: ${s.voiceType})`
                        : ` · ${singerReviewLabel(s.slug)}`}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-mut">
                A song&apos;s written range and a singer&apos;s reported
                catalog range are different facts. The catalog page explains
                what is and is not verified.
              </p>
            </Card>
          )}

          <Card>
            <SectionLabel heading>{`Which voice types does “${song.title}” sit in?`}</SectionLabel>
            <p className="mt-3 max-w-prose text-sm text-mut">{types.written}</p>
            {types.octaves.map((line) => (
              <p key={line} className="mt-2 max-w-prose text-sm text-mut">{line}</p>
            ))}
            <p className="mt-3 max-w-prose text-sm text-mut">
              The bands are the conventional spans on{" "}
              <Link
                className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet"
                href="/atlas/vocal-range-by-voice-type"
                prefetch={false}
              >
                vocal range by voice type
              </Link>
              , not a rule about who may sing a song. Your own{" "}
              <Link
                className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet"
                href={rangeTestHref({ check: song.slug })}
              >
                range test
              </Link>{" "}
              is the better guide.
            </p>
            {bandsHolding(song, 0).length > 0 && (
              <p className="mt-3 text-xs text-dim">
                Singers by voice type:{" "}
                {bandsHolding(song, 0).map((v, i) => (
                  <span key={v}>
                    {i > 0 && ", "}
                    <Link
                      className="underline underline-offset-2 hover:text-violet-ink"
                      href={`/singers/voice-type/${voiceTypeSlug(v)}`}
                      prefetch={false}
                    >
                      {v.toLowerCase()}
                    </Link>
                  </span>
                ))}
              </p>
            )}
          </Card>

          <Card>
            <h2 className="text-xl">{`Questions about “${song.title}”`}</h2>
            <div className="mt-4 space-y-5">
              {faq.map(({ q, a }) => (
                <div key={q}>
                  <h3 className="text-base text-ink">{q}</h3>
                  <p className="mt-1 max-w-prose text-sm text-mut">{a}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-mut">
              To practice the skills a song like this asks for, try the{" "}
              <Link className="text-violet-ink underline-offset-4 hover:underline" href="/warmups">
                guided warmups
              </Link>{" "}
              or a{" "}
              <Link className="text-violet-ink underline-offset-4 hover:underline" href="/songs">
                public domain song with live pitch feedback
              </Link>
              .
            </p>
          </Card>
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
                      {r.title} by {r.artist} ({popRangeLabel(r)})
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
