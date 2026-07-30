import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { midiToLabel } from "@/lib/audio/notes";
import {
  HUB_GENRES,
  SINGERS,
  genreFromSlug,
  genreSlug,
  rangeLabel,
  singersByGenre,
  spanOctaves,
  voiceTypeSlug,
} from "@/lib/singers";
import { statsFor } from "@/lib/singers-analysis";
import { SITE_URL } from "@/lib/site";
import { HubChart } from "@/components/singers/hub-chart";
import { Card, LinkButton, PageShell, SectionLabel, Stat } from "@/components/ui";

interface Params {
  genre: string;
}

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return HUB_GENRES.map((g) => ({ genre: genreSlug(g) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { genre } = await params;
  const g = genreFromSlug(genre);
  if (!g) return {};
  const list = singersByGenre(g);
  const stats = statsFor(list);
  const title = `${g} Singers' Vocal Ranges: ${list.length} Voices Compared`;
  const description = `The cited vocal ranges of ${list.length} famous ${g} singers on one keyboard, from ${stats ? midiToLabel(stats.lowest.lowMidi) : ""} to ${stats ? midiToLabel(stats.highest.highMidi) : ""}. Compare spans and overlay your own range free.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/singers/genre/${genre}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function GenrePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { genre } = await params;
  const g = genreFromSlug(genre);
  if (!g) notFound();

  const list = singersByGenre(g);
  const stats = statsFor(list);
  if (!stats) notFound();

  const axisLow = Math.floor(stats.lowest.lowMidi / 12) * 12;
  const axisHigh = Math.ceil(stats.highest.highMidi / 12) * 12;
  const libraryMedian = statsFor(SINGERS)!.medianSpanSemitones;
  const vsLibrary = stats.medianSpanSemitones - libraryMedian;

  // Voice-category mix, which is the genuinely interesting thing about a genre.
  const mix = new Map<string, number>();
  for (const s of list) mix.set(s.voiceType, (mix.get(s.voiceType) ?? 0) + 1);
  const mixSorted = [...mix.entries()].sort((a, b) => b[1] - a[1]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${g} singers and their vocal ranges`,
    url: `${SITE_URL}/singers/genre/${genre}`,
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
          name: g,
          item: `${SITE_URL}/singers/genre/${genre}`,
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
      kicker="Genre"
      title={`${g} vocal ranges`}
      subtitle={`${list.length} ${g} voices on one keyboard, ${midiToLabel(stats.lowest.lowMidi)} to ${midiToLabel(stats.highest.highMidi)}.`}
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
            <Stat label="Singers" value={list.length} tone="amber" />
            <Stat
              label="Median span"
              value={`${spanOctaves(stats.medianSpanSemitones)} oct`}
              tone="ink"
              sub={
                vsLibrary === 0
                  ? "same as the library"
                  : `${vsLibrary > 0 ? "+" : ""}${vsLibrary} st vs library`
              }
            />
            <Stat
              label="Range covered"
              value={`${midiToLabel(stats.lowest.lowMidi)}–${midiToLabel(stats.highest.highMidi)}`}
              tone="cool"
            />
            <Stat label="Era" value={`${stats.eraFrom}–${stats.eraTo}`} tone="ink" />
          </div>
        </Card>

        <Card>
          <h2 className="text-xl">How ranges sit in {g}</h2>
          <ul className="mt-4 max-w-3xl space-y-2 text-sm text-mut">
            <li>
              The median cited span across these {list.length} voices is{" "}
              {stats.medianSpanSemitones} semitones —{" "}
              {vsLibrary === 0
                ? "level with the library as a whole"
                : vsLibrary > 0
                  ? `${vsLibrary} semitones wider than the library median of ${libraryMedian}`
                  : `${-vsLibrary} semitones narrower than the library median of ${libraryMedian}`}
              .
            </li>
            <li>
              Widest here is{" "}
              <Link
                href={`/singers/${stats.widest.slug}`}
                className="text-amber-ink underline decoration-amber/40 underline-offset-2"
              >
                {stats.widest.name}
              </Link>{" "}
              ({rangeLabel(stats.widest)}); the deepest floor belongs to{" "}
              <Link
                href={`/singers/${stats.lowest.slug}`}
                className="text-amber-ink underline decoration-amber/40 underline-offset-2"
              >
                {stats.lowest.name}
              </Link>{" "}
              at {midiToLabel(stats.lowest.lowMidi)} and the highest ceiling to{" "}
              <Link
                href={`/singers/${stats.highest.slug}`}
                className="text-amber-ink underline decoration-amber/40 underline-offset-2"
              >
                {stats.highest.name}
              </Link>{" "}
              at {midiToLabel(stats.highest.highMidi)}.
            </li>
            <li>
              Voice categories break down as{" "}
              {mixSorted
                .map(([type, n]) => `${n} ${type.toLowerCase()}${n === 1 ? "" : "s"}`)
                .join(", ")}
              .
            </li>
          </ul>
        </Card>

        <Card>
          <SectionLabel>All {list.length} on one axis</SectionLabel>
          <div className="mt-4">
            <HubChart list={list} axisLow={axisLow} axisHigh={axisHigh} />
          </div>
        </Card>

        <Card>
          <SectionLabel>Browse another way</SectionLabel>
          <ul className="mt-4 flex flex-wrap gap-2">
            {mixSorted.slice(0, 4).map(([type]) => (
              <li key={type}>
                <Link
                  href={`/singers/voice-type/${voiceTypeSlug(type as never)}`}
                  className="inline-flex items-center rounded-full border border-line px-3 py-1.5 text-sm transition-colors hover:border-amber"
                >
                  All {type.toLowerCase()}s
                </Link>
              </li>
            ))}
            {HUB_GENRES.filter((x) => x !== g)
              .slice(0, 10)
              .map((x) => (
                <li key={x}>
                  <Link
                    href={`/singers/genre/${genreSlug(x)}`}
                    className="inline-flex items-center rounded-full border border-line px-3 py-1.5 text-sm text-mut transition-colors hover:border-amber hover:text-ink"
                  >
                    {x}
                  </Link>
                </li>
              ))}
          </ul>
        </Card>
      </div>
    </PageShell>
  );
}
