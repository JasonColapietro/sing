import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { altSpelling, midiToLabel } from "@/lib/audio/notes";
import {
  SINGERS,
  describeSpan,
  rangeLabel,
  genreSlug,
  hasUsefulPercentile,
  relatedSingers,
  singerBySlug,
  spanOctaves,
  spanPercentile,
  voiceTypeSlug,
} from "@/lib/singers";
import {
  observationsFor,
  sharesHigh,
  sharesLow,
} from "@/lib/singers-analysis";
import { SITE_URL } from "@/lib/site";
import { ChromaticStrip } from "@/components/singers/chromatic-strip";
import {
  CompareWithMe,
  PlayRangeButton,
} from "@/components/singers/singer-actions";
import {
  Card,
  LinkButton,
  PageShell,
  Pill,
  SectionLabel,
  Stat,
} from "@/components/ui";

interface Params {
  slug: string;
}

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return SINGERS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = singerBySlug(slug);
  if (!s) return {};
  const semis = s.highMidi - s.lowMidi;
  const title = `${s.name} Vocal Range: ${rangeLabel(s)} (${spanOctaves(semis)} Octaves)`;
  const description = `${s.name}'s vocal range is commonly cited as ${midiToLabel(s.lowMidi)} to ${midiToLabel(s.highMidi)} — ${describeSpan(semis)}, a ${s.voiceType.toLowerCase()}. See it on a keyboard, hear it, and test your own range for free.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/singers/${s.slug}` },
    openGraph: { title, description, type: "profile" },
  };
}

/** Voice categories whose upper register is head voice, not falsetto. */
const HEAD_VOICE_TYPES = new Set(["Contralto", "Mezzo-soprano", "Soprano"]);

/** "A#5 (Bb5)" where the two spellings differ, else just "A#5". */
function bothSpellings(midi: number): string {
  const alt = altSpelling(midi);
  return alt ? `${midiToLabel(midi)} (${alt})` : midiToLabel(midi);
}

function answerSentence(s: (typeof SINGERS)[number]): string {
  const semis = s.highMidi - s.lowMidi;
  const parts = [
    `${s.name}'s vocal range is commonly cited as ${bothSpellings(s.lowMidi)} to ${bothSpellings(s.highMidi)} — about ${spanOctaves(semis)} octaves, or ${semis} semitones, and is usually classified as ${s.voiceType.toLowerCase()}.`,
  ];
  if (s.beltMidi != null) {
    const upper = HEAD_VOICE_TYPES.has(s.voiceType)
      ? `head voice${s.whistle ? " or whistle register" : ""}`
      : s.whistle
        ? "falsetto, head voice, or whistle register"
        : "falsetto or head voice";
    parts.push(
      `Full voice is cited up to around ${bothSpellings(s.beltMidi)}; everything above that comes from ${upper}.`,
    );
  } else if (s.whistle) {
    parts.push(`The very top of that span sits in whistle register.`);
  }
  return parts.join(" ");
}

export default async function SingerPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const s = singerBySlug(slug);
  if (!s) notFound();

  const semis = s.highMidi - s.lowMidi;
  const related = relatedSingers(s);
  const observations = observationsFor(s).slice(0, 5);
  const lowMates = sharesLow(s).slice(0, 8);
  const highMates = sharesHigh(s).slice(0, 8);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${s.name} Vocal Range: ${rangeLabel(s)}`,
    url: `${SITE_URL}/singers/${s.slug}`,
    description: answerSentence(s),
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
          name: s.name,
          item: `${SITE_URL}/singers/${s.slug}`,
        },
      ],
    },
    mainEntity: {
      "@type": "Person",
      "@id": `${SITE_URL}/singers/${s.slug}#person`,
      name: s.name,
      jobTitle: "Singer",
      nationality: s.country,
      description: `${s.voiceType} known for "${s.signatureSong}". ${s.blurb}`,
      // Without an external identifier these are 357 unresolvable strings;
      // the Wikipedia URL is the cheapest anchor to the real entity.
      sameAs: `https://en.wikipedia.org/wiki/${encodeURIComponent(s.name.replace(/ /g, "_"))}`,
    },
  };

  return (
    <PageShell
      kicker="Vocal range"
      title={s.name}
      subtitle={`${s.voiceType} · ${s.genres.join(" · ")} · ${s.country} · prominent since ${s.activeFrom}`}
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
        {/* Big readout */}
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <SectionLabel>Cited range</SectionLabel>
              <div className="tabular mt-3 font-mono text-5xl font-bold sm:text-6xl">
                {midiToLabel(s.lowMidi)}
                <span className="text-dim"> — </span>
                {midiToLabel(s.highMidi)}
              </div>
            </div>
            <div className="flex flex-wrap gap-8">
              <Stat label="Octaves" value={spanOctaves(semis)} tone="amber" />
              <Stat label="Semitones" value={semis} tone="ink" />
              {s.beltMidi != null && (
                <Stat
                  label="Full voice to"
                  value={midiToLabel(s.beltMidi)}
                  tone="rec"
                />
              )}
              <Stat label="Voice type" value={s.voiceType} tone="cool" />
            </div>
          </div>
          <div className="mt-6">
            <ChromaticStrip
              low={s.lowMidi}
              high={s.highMidi}
              beltMidi={s.beltMidi}
              label={`Keyboard showing ${s.name}'s cited range from ${midiToLabel(s.lowMidi)} to ${midiToLabel(s.highMidi)}.`}
            />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <PlayRangeButton s={s} />
            {s.whistle && <Pill tone="amber">Whistle register</Pill>}
            {s.beltMidi != null && (
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                red dash = top of full voice
              </span>
            )}
          </div>
        </Card>

        {/* How the voice works — the part a singer came for, and the only
            section here that is written rather than derived. */}
        {s.technique && (
          <Card>
            <h2 className="text-xl">
              How {s.name} uses that range
            </h2>
            <p className="mt-3 max-w-3xl text-mut">{s.technique}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <LinkButton href="/warmups" variant="outline" size="sm">
                Warm up for this
              </LinkButton>
              <span className="text-xs text-dim">
                A description of the sound, not a technique to copy wholesale —
                the top of anyone&rsquo;s cited range is the least imitable part
                of it.
              </span>
            </div>
          </Card>
        )}

        {/* The answer, in prose a search snippet can lift */}
        <Card>
          <h2 className="text-xl">
            What is {s.name}&rsquo;s vocal range?
          </h2>
          <p className="mt-3 max-w-3xl text-mut">{answerSentence(s)}</p>
          <p className="mt-3 max-w-3xl text-sm text-mut">
            {s.blurb}
            {hasUsefulPercentile(s) &&
              ` That cited span is wider than ${spanPercentile(s)}% of the voices in this library.`}
          </p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Signature song
              </dt>
              <dd className="mt-1 text-sm">{s.signatureSong}</dd>
            </div>
            {s.lowSource && (
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                  Low {midiToLabel(s.lowMidi)} heard in
                </dt>
                <dd className="mt-1 text-sm">{s.lowSource}</dd>
              </div>
            )}
            {s.highSource && (
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                  High {midiToLabel(s.highMidi)} heard in
                </dt>
                <dd className="mt-1 text-sm">{s.highSource}</dd>
              </div>
            )}
          </dl>
          {observations.length > 0 && (
            <>
              <h3 className="mt-7 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Reading the numbers
              </h3>
              <ul className="mt-3 max-w-3xl space-y-2">
                {observations.map((o) => (
                  <li key={o.id} className="flex gap-3 text-sm text-mut">
                    <span aria-hidden="true" className="text-amber-ink">
                      ·
                    </span>
                    <span>{o.text}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-5 text-xs text-dim">
            Commonly cited figures, not lab measurements — extreme notes are
            one-off recorded moments, not the singer&rsquo;s everyday range.
          </p>
        </Card>

        {/* You vs them */}
        <CompareWithMe s={s} />

        {/* Who else touches the same extremes — the pages a reader who cares
            about one specific note actually wants next. */}
        {(lowMates.length > 0 || highMates.length > 0) && (
          <Card>
            <SectionLabel>Same notes, other voices</SectionLabel>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {lowMates.length > 0 && (
                <div>
                  <h2 className="text-base">
                    Also bottoming out on {midiToLabel(s.lowMidi)}
                  </h2>
                  <p className="mt-1 text-sm text-mut">
                    {sharesLow(s).length} other{" "}
                    {sharesLow(s).length === 1 ? "voice" : "voices"} here{" "}
                    {sharesLow(s).length === 1 ? "is" : "are"} cited to the same
                    floor.
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {lowMates.map((m) => (
                      <li key={m.slug}>
                        <Link
                          href={`/singers/${m.slug}`}
                          className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs transition-colors hover:border-amber"
                        >
                          {m.name}
                          <span className="tabular font-mono text-[10px] text-dim">
                            {rangeLabel(m)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {highMates.length > 0 && (
                <div>
                  <h2 className="text-base">
                    Also topping out on {midiToLabel(s.highMidi)}
                  </h2>
                  <p className="mt-1 text-sm text-mut">
                    {sharesHigh(s).length} other{" "}
                    {sharesHigh(s).length === 1 ? "voice" : "voices"} here{" "}
                    {sharesHigh(s).length === 1 ? "reaches" : "reach"} the same
                    ceiling.
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {highMates.map((m) => (
                      <li key={m.slug}>
                        <Link
                          href={`/singers/${m.slug}`}
                          className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs transition-colors hover:border-amber"
                        >
                          {m.name}
                          <span className="tabular font-mono text-[10px] text-dim">
                            {rangeLabel(m)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <LinkButton
                href={`/singers/voice-type/${voiceTypeSlug(s.voiceType)}`}
                variant="outline"
                size="sm"
              >
                All {s.voiceType.toLowerCase()}s
              </LinkButton>
              {s.genres[0] && (
                <LinkButton
                  href={`/singers/genre/${genreSlug(s.genres[0])}`}
                  variant="ghost"
                  size="sm"
                >
                  {s.genres[0]} voices
                </LinkButton>
              )}
            </div>
          </Card>
        )}

        {/* Similar voices */}
        <Card>
          <SectionLabel>Similar voices</SectionLabel>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/singers/${r.slug}`}
                  className="flex items-baseline justify-between gap-3 rounded-xl border border-line bg-bg px-4 py-3 transition-colors hover:border-amber"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {r.name}
                    </span>
                    <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
                      {r.voiceType}
                    </span>
                  </span>
                  <span className="tabular shrink-0 font-mono text-[11px] text-mut">
                    {rangeLabel(r)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </PageShell>
  );
}
