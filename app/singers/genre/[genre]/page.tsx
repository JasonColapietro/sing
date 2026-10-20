import type { Metadata } from "next";
import { singerGenreKeywords } from "@/lib/keywords";
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
  pluralVoice,
  spanOctaves,
  voiceTypeSlug,
} from "@/lib/singers";
import { statsFor } from "@/lib/singers-analysis";
import { GENRE_HUB_COPY, splitContrast } from "@/lib/singer-hub-copy";
import { withCanonicalOpenGraph } from "@/lib/og";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { SITE_URL, rangeTestHref } from "@/lib/site";
import { HubChart } from "@/components/singers/hub-chart";
import { LinkedNames } from "@/components/singers/linked-names";
import { Card, LinkButton, PageShell, SectionLabel, Stat } from "@/components/ui";

interface Params {
  genre: string;
}

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return HUB_GENRES.map((g) => ({ genre: genreSlug(g) }));
}

/** "Afrobeats singers", but "singer-songwriters" rather than "Singer-Songwriter singers". */
function genreSingers(g: string): string {
  return g === "Singer-Songwriter" ? "singer-songwriters" : `${g} singers`;
}

const upperFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

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
  const copy = GENRE_HUB_COPY[genre];
  // The keyword lead stays in front; what follows it is this genre's own, so no
  // two hubs share a title or a description (lib/singer-hub-copy.test.tsx).
  const title = `${g === "Singer-Songwriter" ? "Singer-Songwriters'" : `${g} Singers'`} Vocal Ranges: ${copy.titleTag}`;
  // Short enough that fitDescription never drops it: the longest hub comes to
  // 150 characters. A longer sentence was cut whole on ten hubs, leaving a
  // snippet with no singer count and no note span.
  const description = stats
    ? `${copy.summary} ${list.length} ${genreSingers(g)}' catalog ranges, ${midiToLabel(stats.lowest.lowMidi)} to ${midiToLabel(stats.highest.highMidi)}.`
    : copy.summary;
  return withCanonicalOpenGraph({
    title: { absolute: title },
    description,
    keywords: singerGenreKeywords(g),
    alternates: { canonical: `${SITE_URL}/singers/genre/${genre}` },
    openGraph: { title, description, type: "website" },
  });
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
  const copy = GENRE_HUB_COPY[genre];
  const neighbour = genreFromSlug(copy.neighbour);
  const [contrastBefore, contrastAfter] = splitContrast(copy.contrast);

  const axisLow = Math.floor(stats.lowest.lowMidi / 12) * 12;
  const axisHigh = Math.ceil(stats.highest.highMidi / 12) * 12;
  const libraryMedian = statsFor(SINGERS)!.medianSpanSemitones;
  const vsLibrary = stats.medianSpanSemitones - libraryMedian;

  // Voice-category mix, which is the genuinely interesting thing about a genre.
  const mix = new Map<string, number>();
  for (const s of list) mix.set(s.voiceType, (mix.get(s.voiceType) ?? 0) + 1);
  const mixSorted = [...mix.entries()].sort((a, b) => b[1] - a[1]);

  // Related hubs ranked by how many of this hub's singers they share, so Metal
  // links Rock and K-Pop links Pop, rather than every hub linking the same ten
  // alphabetically early genres.
  const relatedGenres = HUB_GENRES.filter((x) => x !== g)
    .map((x) => ({ x, shared: list.filter((s) => s.genres.includes(x)).length }))
    .filter(({ shared }) => shared > 0)
    .sort((a, b) => b.shared - a.shared || a.x.localeCompare(b.x))
    .slice(0, 10)
    .map(({ x }) => x);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${upperFirst(genreSingers(g))} and their vocal ranges`,
    url: `${SITE_URL}/singers/genre/${genre}`,
    description: copy.intro,
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
      title={`${upperFirst(genreSingers(g))}' vocal ranges`}
      subtitle={`Reported catalog ranges for ${list.length} ${genreSingers(g)} run from ${midiToLabel(stats.lowest.lowMidi)} to ${midiToLabel(stats.highest.highMidi)}, with a median span of about ${spanOctaves(stats.medianSpanSemitones)} octaves. ${copy.summary}`}
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
          <h2 className="text-xl">What sets {g} singing apart</h2>
          <p className="mt-3 max-w-3xl text-mut">{copy.intro}</p>
          <p className="mt-3 max-w-3xl text-sm text-mut">
            {contrastBefore}
            <Link
              href={`/singers/genre/${copy.neighbour}`}
              prefetch={false}
              className="text-violet-ink underline decoration-violet/40 underline-offset-2"
            >
              {neighbour}
            </Link>
            {contrastAfter}
          </p>
        </Card>

        <Card>
          <div className="flex flex-wrap gap-8">
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
              The median reported catalog span across these profiles is{" "}
              {stats.medianSpanSemitones} semitones —{" "}
              {vsLibrary === 0
                ? "level with the library as a whole"
                : vsLibrary > 0
                  ? `${vsLibrary} semitones wider than the library median of ${libraryMedian}`
                  : `${-vsLibrary} semitones narrower than the library median of ${libraryMedian}`}
              .
            </li>
            <li>
              {/* Every tied holder is named: on a shared record the first
                  name alphabetically is not the record holder. */}
              {stats.widestAll.length === 1
                ? "Largest reported span here is "
                : "Largest reported span here is shared by "}
              <LinkedNames
                singers={stats.widestAll}
                after={(s) => ` (${rangeLabel(s)})`}
              />
              ; the lowest listed endpoint belongs to{" "}
              <LinkedNames singers={stats.lowestAll} /> at{" "}
              {midiToLabel(stats.lowest.lowMidi)} and the highest listed
              endpoint to <LinkedNames singers={stats.highestAll} /> at{" "}
              {midiToLabel(stats.highest.highMidi)}.
            </li>
            <li>
              Catalog voice labels here, most common first:{" "}
              {mixSorted
                .map(([type, n]) =>
                  n === 1 ? type.toLowerCase() : pluralVoice(type.toLowerCase()),
                )
                .join(", ")}
              .
            </li>
          </ul>
          <p className="mt-5 text-xs text-dim">
            These comparisons use catalog values. Most individual endpoints and
            voice labels are pending evidence review; open a singer profile for
            its source status.
          </p>
        </Card>

        {/* The question this chart raises, answered by the free tool that
            measures it. Sits right above the chart it refers to. */}
        <Card className="border-violet/40">
          <h2 className="text-xl">Where would your voice sit on this chart?</h2>
          <p className="mt-2 max-w-2xl text-sm text-mut">
            The free range test runs in your browser in about two minutes and
            reports your lowest and highest notes in the same note names as
            every bar below.
          </p>
          <div className="mt-4">
            <LinkButton href={rangeTestHref()} size="md">
              Find my vocal range →
            </LinkButton>
          </div>
        </Card>

        <Card>
          <h2>
            <SectionLabel>Every voice on one axis</SectionLabel>
          </h2>
          <div className="mt-4">
            <HubChart list={list} axisLow={axisLow} axisHigh={axisHigh} />
          </div>
        </Card>

        <Card>
          <SectionLabel>Browse another way</SectionLabel>
          <ul className="mt-4 flex flex-wrap gap-2">
            {mixSorted.slice(0, 4).map(([type]) => (
              <li key={type}>
                {/* No prefetch on these chips or the contrast link above: each
                    hub's payload is its whole chart, fetched for nobody. */}
                <Link
                  href={`/singers/voice-type/${voiceTypeSlug(type as never)}`}
                  prefetch={false}
                  className="inline-flex items-center rounded-full border border-line px-3 py-1.5 text-sm transition-colors hover:border-violet"
                >
                  All {pluralVoice(type.toLowerCase())}
                </Link>
              </li>
            ))}
            {relatedGenres.map((x) => (
              <li key={x}>
                <Link
                  href={`/singers/genre/${genreSlug(x)}`}
                  prefetch={false}
                  className="inline-flex items-center rounded-full border border-line px-3 py-1.5 text-sm text-mut transition-colors hover:border-violet hover:text-ink"
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
