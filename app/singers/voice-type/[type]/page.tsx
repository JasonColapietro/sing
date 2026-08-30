import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { midiToLabel } from "@/lib/audio/notes";
import {
  SINGERS,
  VOICE_KINDS,
  pluralVoice,
  rangeLabel,
  singersByVoiceType,
  spanOctaves,
  voiceTypeFromSlug,
  voiceTypeSlug,
} from "@/lib/singers";
import { REFERENCE_BANDS, statsFor } from "@/lib/singers-analysis";
import { withCanonicalOpenGraph } from "@/lib/og";
import { VOICE_TYPE_NOTES } from "@/lib/voice-types";
import { SITE_URL } from "@/lib/site";
import { HubChart } from "@/components/singers/hub-chart";
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
  const note = VOICE_TYPE_NOTES[voice];
  const title = `Famous ${voice} Vocal Ranges Compared`;
  const description = `The cited vocal ranges of famous ${pluralVoice(voice.toLowerCase())} on one keyboard — ${note.summary}. Compare spans, full-voice ceilings and your own range.`;
  return withCanonicalOpenGraph({
    title,
    description,
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
  const lower = voice.toLowerCase();
  const share = Math.round((list.length / SINGERS.length) * 100);

  const axisLow = Math.floor(stats.lowest.lowMidi / 12) * 12;
  const axisHigh = Math.ceil(stats.highest.highMidi / 12) * 12;

  // "How high can a tenor sing" / "how low can a bass sing" are asked in
  // those words, and the honest answer has two parts: the conventional band,
  // and what recorded voices in this category are actually cited doing. Both
  // figures already render elsewhere on the page, so the Q&A introduces no
  // new claims — and one array feeds the visible section and the FAQPage
  // markup, so the two can never drift.
  const faq = [
    {
      q: `How high can a ${lower} sing?`,
      a: `The conventional ${lower} band tops out around ${midiToLabel(band.high)}, but recorded ${pluralVoice(lower)} are cited well past it: the highest note among the ${list.length} ${pluralVoice(lower)} indexed here is ${midiToLabel(stats.highest.highMidi)}, cited for ${stats.highest.name}.`,
    },
    {
      q: `How low can a ${lower} sing?`,
      a: `Conventionally the ${lower} band bottoms out around ${midiToLabel(band.low)}. The lowest cited note among the ${pluralVoice(lower)} here is ${midiToLabel(stats.lowest.lowMidi)}, cited for ${stats.lowest.name}.`,
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
        description: note.summary,
        isPartOf: { "@type": "WebSite", name: "Suede Sing", url: SITE_URL },
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
            name: `${s.name} — ${rangeLabel(s)}`,
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
      title={`Famous ${pluralVoice(lower)}`}
      subtitle={`Cited ranges on one keyboard — ${note.summary}.`}
      actions={
        <LinkButton href="/singers" variant="outline" size="md">
          ← All singers
        </LinkButton>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-6">
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

          <h3 className="mt-7 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            What the {pluralVoice(lower)} here show
          </h3>
          <ul className="mt-3 max-w-3xl space-y-2 text-sm text-mut">
            <li>
              Widest cited span:{" "}
              <Link
                href={`/singers/${stats.widest.slug}`}
                className="text-violet-ink underline decoration-violet/40 underline-offset-2"
              >
                {stats.widest.name}
              </Link>{" "}
              at {rangeLabel(stats.widest)} (
              {spanOctaves(stats.widest.highMidi - stats.widest.lowMidi)}{" "}
              octaves); narrowest is{" "}
              <Link
                href={`/singers/${stats.narrowest.slug}`}
                className="text-violet-ink underline decoration-violet/40 underline-offset-2"
              >
                {stats.narrowest.name}
              </Link>{" "}
              at {rangeLabel(stats.narrowest)}.
            </li>
            <li>
              {stats.lowest.slug === stats.highest.slug ? (
                <>
                  Both extremes belong to the same singer:{" "}
                  <Link
                    href={`/singers/${stats.lowest.slug}`}
                    className="text-violet-ink underline decoration-violet/40 underline-offset-2"
                  >
                    {stats.lowest.name}
                  </Link>{" "}
                  holds the category&rsquo;s floor at{" "}
                  {midiToLabel(stats.lowest.lowMidi)} and its ceiling at{" "}
                  {midiToLabel(stats.highest.highMidi)}, {""}
                  {stats.highest.highMidi - stats.lowest.lowMidi} semitones
                  apart.
                </>
              ) : (
                <>
                  The group bottoms out at {midiToLabel(stats.lowest.lowMidi)} (
                  <Link
                    href={`/singers/${stats.lowest.slug}`}
                    className="text-violet-ink underline decoration-violet/40 underline-offset-2"
                  >
                    {stats.lowest.name}
                  </Link>
                  ) and tops out at {midiToLabel(stats.highest.highMidi)} (
                  <Link
                    href={`/singers/${stats.highest.slug}`}
                    className="text-violet-ink underline decoration-violet/40 underline-offset-2"
                  >
                    {stats.highest.name}
                  </Link>
                  ) — {stats.highest.highMidi - stats.lowest.lowMidi} semitones
                  from the floor of the category to its ceiling.
                </>
              )}
            </li>
            <li>
              Prominence spans {stats.eraFrom} to {stats.eraTo}, and the median
              cited span is {stats.medianSpanSemitones} semitones against{" "}
              {midiToLabel(band.low)}–{midiToLabel(band.high)} for the
              conventional {lower} band.
            </li>
          </ul>
          <p className="mt-5 text-xs text-dim">
            Voice categories are guides borrowed from choral and operatic
            practice, not boxes. Plenty of these singers are filed differently
            by different sources, and a category says more about where a voice
            is comfortable than about the notes it can reach.
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
            How high — and how low — {pluralVoice(lower)} sing
          </h2>
          <div className="mt-4 max-w-3xl space-y-5">
            {faq.map((f) => (
              <div key={f.q}>
                <h3 className="text-sm font-semibold">{f.q}</h3>
                <p className="mt-1 text-sm text-mut">{f.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <LinkButton href="/range" variant="outline" size="sm">
              Find out how high you can sing
            </LinkButton>
          </div>
        </Card>

        <Card>
          <SectionLabel>Other voice types</SectionLabel>
          <ul className="mt-4 flex flex-wrap gap-2">
            {VOICE_KINDS.filter((v) => v !== voice).map((v) => (
              <li key={v}>
                <Link
                  href={`/singers/voice-type/${voiceTypeSlug(v)}`}
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
