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
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/singers/voice-type/${type}` },
    openGraph: { title, description, type: "website" },
  };
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Famous ${pluralVoice(voice)} and their vocal ranges`,
    url: `${SITE_URL}/singers/voice-type/${type}`,
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
          item: `${SITE_URL}/singers/voice-type/${type}`,
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
                className="text-amber-ink underline decoration-amber/40 underline-offset-2"
              >
                {stats.widest.name}
              </Link>{" "}
              at {rangeLabel(stats.widest)} (
              {spanOctaves(stats.widest.highMidi - stats.widest.lowMidi)}{" "}
              octaves); narrowest is{" "}
              <Link
                href={`/singers/${stats.narrowest.slug}`}
                className="text-amber-ink underline decoration-amber/40 underline-offset-2"
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
                    className="text-amber-ink underline decoration-amber/40 underline-offset-2"
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
                    className="text-amber-ink underline decoration-amber/40 underline-offset-2"
                  >
                    {stats.lowest.name}
                  </Link>
                  ) and tops out at {midiToLabel(stats.highest.highMidi)} (
                  <Link
                    href={`/singers/${stats.highest.slug}`}
                    className="text-amber-ink underline decoration-amber/40 underline-offset-2"
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
          <SectionLabel>Every {lower} on one axis</SectionLabel>
          <div className="mt-4">
            <HubChart list={list} axisLow={axisLow} axisHigh={axisHigh} />
          </div>
        </Card>

        <Card>
          <SectionLabel>Other voice types</SectionLabel>
          <ul className="mt-4 flex flex-wrap gap-2">
            {VOICE_KINDS.filter((v) => v !== voice).map((v) => (
              <li key={v}>
                <Link
                  href={`/singers/voice-type/${voiceTypeSlug(v)}`}
                  className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm transition-colors hover:border-amber"
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
