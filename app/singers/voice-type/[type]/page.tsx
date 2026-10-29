import type { Metadata } from "next";
import { singerVoiceTypeKeywords } from "@/lib/keywords";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VOICE_TYPES, midiToLabel } from "@/lib/audio/notes";
import {
  SINGERS,
  VOICE_KINDS,
  joinNames,
  pluralVoice,
  rangeLabel,
  singersByVoiceType,
  spanOctaves,
  voiceTypeFromSlug,
  voiceTypeSlug,
} from "@/lib/singers";
import { REFERENCE_BANDS, statsFor } from "@/lib/singers-analysis";
import { withCanonicalOpenGraph } from "@/lib/og";
import { VOICE_TYPE_NOTES, VOICE_TYPE_PASSAGGIO } from "@/lib/voice-types";
import { HUB_FIGURES_NOTE, VOICE_TYPE_HUB_COPY, fillTokens, splitContrast } from "@/lib/singer-hub-copy";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { SITE_URL, rangeTestHref } from "@/lib/site";
import { HubChart } from "@/components/singers/hub-chart";
import { LinkedNames } from "@/components/singers/linked-names";
import { Card, LinkButton, PageShell, SectionLabel, Stat } from "@/components/ui";

interface Params {
  type: string;
}

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return VOICE_KINDS.map((v) => ({ type: voiceTypeSlug(v) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { type } = await params;
  const voice = voiceTypeFromSlug(type);
  if (!voice) return {};
  const copy = VOICE_TYPE_HUB_COPY[voice];
  const band = REFERENCE_BANDS[voice];
  const count = singersByVoiceType(voice).length;
  // The keyword lead stays in front; what follows it is this category's own, so
  // no two hubs share a title or a description (lib/singer-hub-copy.test.tsx).
  const title = voice === "Contralto"
    ? `Contralto Singers and Vocal Ranges: ${copy.titleTag}`
    : `Famous ${voice} Vocal Ranges: ${copy.titleTag}`;
  // Short enough that fitDescription never drops it (longest hub: 152
  // characters). The longer sentence was cut whole on four hubs, leaving a
  // snippet with no band, no singer count and, on some, no "vocal range".
  const description = `${copy.summary} Conventional band ${midiToLabel(band.low)}–${midiToLabel(band.high)}; catalog ranges for ${count} famous ${pluralVoice(voice.toLowerCase())}.`;
  return withCanonicalOpenGraph({
    title: { absolute: title },
    description,
    keywords: singerVoiceTypeKeywords(voice),
    alternates: { canonical: `${SITE_URL}/singers/voice-type/${type}` },
    openGraph: { title, description, type: "website" },
  });
}

export default async function VoiceTypePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { type } = await params;
  const voice = voiceTypeFromSlug(type);
  if (!voice) notFound();

  const list = singersByVoiceType(voice);
  const stats = statsFor(list);
  if (!stats) notFound();
  const note = VOICE_TYPE_NOTES[voice];
  const band = REFERENCE_BANDS[voice];
  const copy = VOICE_TYPE_HUB_COPY[voice];
  const passaggio = VOICE_TYPE_PASSAGGIO[voice];
  const intro = fillTokens(copy.intro, {
    low: midiToLabel(band.low),
    high: midiToLabel(band.high),
    pLow: midiToLabel(passaggio.low),
    pHigh: midiToLabel(passaggio.high),
  });
  const neighbour = voiceTypeFromSlug(copy.neighbour);
  const [contrastBefore, contrastAfter] = splitContrast(copy.contrast);
  const lower = voice.toLowerCase();
  // Bass-baritone and countertenor are editorial categories: the range test
  // classifies into six bands, bass to soprano, and can never return them.
  const rangeTestCanName = VOICE_TYPES.some((t) => t.label === voice);
  const share = Math.round((list.length / SINGERS.length) * 100);

  const axisLow = Math.floor(stats.lowest.lowMidi / 12) * 12;
  const axisHigh = Math.ceil(stats.highest.highMidi / 12) * 12;

  // "How high can a tenor sing" / "how low can a bass sing" are asked in
  // those words, and the honest answer has two parts: the conventional band,
  // and what recorded voices in this category are actually cited doing. Both
  // figures already render elsewhere on the page, so the Q&A introduces no
  // new claims — and one array feeds the visible section and the FAQPage
  // markup, so the two can never drift.
  // Every tied holder is named, so a shared endpoint is not credited to
  // whichever name sorts first.
  const names = (singers: typeof list) => joinNames(singers.map((s) => s.name));
  const faq = [
    {
      q: `How high can a ${lower} sing?`,
      a: `The conventional ${lower} band tops out around ${midiToLabel(band.high)}. Among ${list.length} catalog profiles labeled ${pluralVoice(lower)}, the highest listed endpoint is ${midiToLabel(stats.highest.highMidi)} for ${names(stats.highestAll)}; it is not a verified individual maximum.`,
    },
    {
      q: `How low can a ${lower} sing?`,
      a: `Conventionally the ${lower} band bottoms out around ${midiToLabel(band.low)}. The lowest listed endpoint in this catalog category is ${midiToLabel(stats.lowest.lowMidi)} for ${names(stats.lowestAll)}; check ${stats.lowestAll.length === 1 ? "the profile" : "each profile"} before treating it as a verified performance.`,
    },
  ];

  const pageUrl = `${SITE_URL}/singers/voice-type/${type}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#collection`,
        name: `Famous ${pluralVoice(voice)} and their vocal ranges`,
        url: pageUrl,
        description: intro,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        publisher: ORG_PUBLISHER_NODE,
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Famous vocal ranges",
              item: `${SITE_URL}/singers`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: pluralVoice(voice),
              item: pageUrl,
            },
          ],
        },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: list.length,
          itemListElement: list.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}/singers/${s.slug}`,
            name: `${s.name}: ${rangeLabel(s)}`,
          })),
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        isPartOf: { "@id": `${pageUrl}#collection` },
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <PageShell
      kicker="Voice type"
      title={
        voice === "Contralto"
          ? "Famous contralto singers and the contralto vocal range"
          : `${voice} vocal range and famous ${lower} singers`
      }
      subtitle={`A ${lower}'s conventional range runs from about ${midiToLabel(band.low)} to ${midiToLabel(band.high)}. Below are reported catalog ranges for ${list.length} singers labeled ${pluralVoice(lower)}: ${note.summary}.`}
      actions={
        // Own wrapping row: two md buttons are wider than a 320px phone.
        <div className="flex flex-wrap items-center gap-2">
          <LinkButton href={rangeTestHref()} size="md">
            Find my vocal range →
          </LinkButton>
          <LinkButton href="/singers" prefetch={false} variant="outline" size="md">
            ← All singers
          </LinkButton>
        </div>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-6">
        <Card>
          <h2 className="text-xl">The {lower} voice at a glance</h2>
          <p className="mt-3 max-w-3xl text-mut">{intro}</p>
          <p className="mt-3 max-w-3xl text-sm text-mut">
            {contrastBefore}
            <Link
              href={`/singers/voice-type/${copy.neighbour}`}
              prefetch={false}
              className="text-violet-ink underline decoration-violet/40 underline-offset-2"
            >
              {neighbour?.toLowerCase()}
            </Link>
            {contrastAfter}
          </p>
          {/* "Am I a {type}?" is the next question on every one of these
              hubs, and the range test answers it with an estimate. Outline,
              because the header's "Find my vocal range" button, a few lines
              up, is the page's one primary action and goes to the same test.
              Two hubs, bass-baritone and countertenor, name a type the
              classifier cannot return, so they say so under the buttons
              rather than promise an answer the test can't give. */}
          <div className="mt-4 flex flex-wrap gap-3">
            <LinkButton href={rangeTestHref()} variant="outline" size="sm">
              Estimate my voice type
            </LinkButton>
            {voice === "Contralto" && (
              <LinkButton href="/atlas/vocal-range-by-voice-type" variant="outline" size="sm">
                Compare contralto, mezzo-soprano and soprano ranges
              </LinkButton>
            )}
          </div>
          {!rangeTestCanName && (
            <p className="mt-2 max-w-3xl text-xs text-dim">
              The range test estimates one of six types, bass to soprano, and never
              names {lower}: compare the notes it finds with this page&apos;s{" "}
              {midiToLabel(band.low)}–{midiToLabel(band.high)} band.
            </p>
          )}
        </Card>

        <Card>
          <div className="flex flex-wrap gap-8">
            <Stat
              label="Median span"
              value={`${spanOctaves(stats.medianSpanSemitones)} oct`}
              tone="ink"
            />
            <Stat
              label="Conventional band"
              value={`${midiToLabel(band.low)}–${midiToLabel(band.high)}`}
              tone="cool"
            />
            <Stat
              label="Share of library"
              value={`${share}%`}
              tone="ink"
              sub="of the library"
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-xl">What a {lower} is</h2>
          <p className="mt-3 max-w-3xl text-mut">{note.body}</p>
          <p className="mt-3 max-w-3xl text-sm text-mut">{note.challenge}</p>

          <h3 className="mt-7 font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-dim">
            What the {pluralVoice(lower)} here show
          </h3>
          <ul className="mt-3 max-w-3xl space-y-2 text-sm text-mut">
            <li>
              {/* Ties name every holder; a shared record has no single
                  holder to crown. */}
              {stats.widestAll.length === 1 ? (
                <>
                  Largest reported catalog span:{" "}
                  <LinkedNames singers={stats.widestAll} /> at{" "}
                  {rangeLabel(stats.widest)} (
                  {spanOctaves(stats.widest.highMidi - stats.widest.lowMidi)}{" "}
                  octaves)
                </>
              ) : (
                <>
                  Largest reported catalog span, shared at{" "}
                  {spanOctaves(stats.widest.highMidi - stats.widest.lowMidi)}{" "}
                  octaves:{" "}
                  <LinkedNames
                    singers={stats.widestAll}
                    after={(s) => ` (${rangeLabel(s)})`}
                  />
                </>
              )}
              {stats.narrowestAll.length === 1
                ? "; narrowest is "
                : "; tied for narrowest are "}
              <LinkedNames
                singers={stats.narrowestAll}
                after={(s) => ` at ${rangeLabel(s)}`}
              />
              .
            </li>
            <li>
              {stats.lowestAll.length === 1 &&
              stats.highestAll.length === 1 &&
              stats.lowest.slug === stats.highest.slug ? (
                <>
                  Both listed endpoints belong to the same profile:{" "}
                  <Link
                    href={`/singers/${stats.lowest.slug}`}
                    prefetch={false}
                    className="text-violet-ink underline decoration-violet/40 underline-offset-2"
                  >
                    {stats.lowest.name}
                  </Link>{" "}
                  has the category&rsquo;s listed floor at{" "}
                  {midiToLabel(stats.lowest.lowMidi)} and its ceiling at{" "}
                  {midiToLabel(stats.highest.highMidi)}, {""}
                  {stats.highest.highMidi - stats.lowest.lowMidi} semitones
                  apart.
                </>
              ) : (
                <>
                  The catalog group starts at {midiToLabel(stats.lowest.lowMidi)} (
                  <LinkedNames singers={stats.lowestAll} />
                  ) and ends at {midiToLabel(stats.highest.highMidi)} (
                  <LinkedNames singers={stats.highestAll} />
                  ), a span of {stats.highest.highMidi - stats.lowest.lowMidi} semitones
                  from the floor of the category to its ceiling.
                </>
              )}
            </li>
            <li>
              Prominence spans {stats.eraFrom} to {stats.eraTo}, and the median
              catalog span is {stats.medianSpanSemitones} semitones against{" "}
              {midiToLabel(band.low)}–{midiToLabel(band.high)} for the
              conventional {lower} band.
            </li>
          </ul>
          <p className="mt-5 max-w-prose text-xs text-dim">
            Voice categories are guides borrowed from choral and operatic
            practice. {HUB_FIGURES_NOTE}
          </p>
        </Card>

        <Card>
          <h2>
            <SectionLabel>Every {lower} on one axis</SectionLabel>
          </h2>
          <div className="mt-4">
            <HubChart list={list} axisLow={axisLow} axisHigh={axisHigh} />
          </div>
        </Card>

        {/* The question families, in the words people search — same array as
            the FAQPage markup above. */}
        <Card>
          <h2 className="text-xl">
            How high and how low {pluralVoice(lower)} sing
          </h2>
          <div className="mt-4 max-w-3xl space-y-5">
            {faq.map((f) => (
              <div key={f.q}>
                <h3 className="text-sm">{f.q}</h3>
                <p className="mt-1 text-sm text-mut">{f.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <LinkButton href={rangeTestHref()} variant="outline" size="sm">
              Find your lowest and highest notes
            </LinkButton>
          </div>
        </Card>

        <Card>
          <SectionLabel>Other voice types</SectionLabel>
          <ul className="mt-4 flex flex-wrap gap-2">
            {VOICE_KINDS.filter((v) => v !== voice).map((v) => (
              <li key={v}>
                {/* No prefetch here or on the contrast link above: each hub's
                    payload is its whole chart (the tenor hub's is about
                    0.4 MB decoded), fetched in the background for nobody. */}
                <Link
                  href={`/singers/voice-type/${voiceTypeSlug(v)}`}
                  prefetch={false}
                  className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm transition-colors hover:border-violet"
                >
                  {v}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </PageShell>
  );
}
