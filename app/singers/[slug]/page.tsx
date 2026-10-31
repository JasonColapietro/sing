import type { Metadata } from "next";
import { singerKeywords } from "@/lib/keywords";
import Link from "next/link";
import { notFound } from "next/navigation";
import { midiToLabel } from "@/lib/audio/notes";
import {
  SINGERS,
  rangeLabel,
  genreSlug,
  relatedSingers,
  singerBySlug,
  spanOctaves,
  pluralVoice,
  voiceTypeSlug,
  wikipediaUrl,
} from "@/lib/singers";
import { sharesHigh, sharesLow } from "@/lib/singers-analysis";
import { catalogPositionFor, catalogSpanHistogram } from "@/lib/singer-catalog-position";
import {
  getSingerEvidence,
  getSingerPageLastModified,
  groupEvidenceSources,
  isSingerReviewed,
  singerReviewLabel,
  voiceTypeEvidenceCopy,
} from "@/lib/singer-evidence";
import { popRangeLabel, popSongsByArtistSlug } from "@/lib/pop-songs";
import { fitDescription } from "@/lib/meta-fit";
import { OG_LOCALE, OG_SITE_NAME } from "@/lib/og";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { pageRobots } from "@/lib/robots-meta";
import { SITE_URL, rangeTestHref } from "@/lib/site";
import {
  keyboardNeighbors,
  keyboardParagraphs,
  sharedSemitones,
  similarRangeAnswer,
  songsInRange,
  songsInRangeCount,
  voiceTypeParagraphs,
} from "@/lib/singer-range-profile";
import { POP_SONGS } from "@/lib/pop-songs";
import { ATLAS_CONTENTS } from "@/lib/atlas-data";
import { ChromaticStrip } from "@/components/singers/chromatic-strip";
import { RangeMini } from "@/components/singers/range-mini";
import { SpanHistogramFigure } from "@/components/singers/span-histogram";
import {
  CompareWithMe,
  PlayRangeButton,
  SingerRangeAction,
} from "@/components/singers/singer-actions";
import {
  Card,
  LinkButton,
  PageShell,
  SectionLabel,
  Stat,
} from "@/components/ui";

interface Params {
  slug: string;
}

type SearchIntent = "voice-type" | "vocal-range";

type SingerRecord = (typeof SINGERS)[number];

/** September 27 CTR pilot; keep these titles stable. */
const COMPARISON_SEARCH_SLUGS: ReadonlySet<string> = new Set([
  "celine-dion",
  "peter-steele",
  "michael-jackson",
]);

function isPending(s: SingerRecord): boolean {
  return !isSingerReviewed(s.slug);
}

/** Exact-page GSC voice-type intent observed for Jul 30–Aug 26, 2026. */
const VOICE_TYPE_QUERY_SLUGS: ReadonlySet<string> = new Set([
  "olivia-rodrigo",
  "reba-mcentire",
  "alex-warren",
  "sam-smith",
]);

/** Vocal range remains the established primary intent for every other page. */
function searchIntentFor(slug: string): SearchIntent {
  return VOICE_TYPE_QUERY_SLUGS.has(slug) ? "voice-type" : "vocal-range";
}

function hasReviewedVoiceTypeCorrection(s: SingerRecord): boolean {
  return [
    "olivia-rodrigo",
    "reba-mcentire",
    "alex-warren",
    "sam-smith",
    "arijit-singh",
  ].includes(s.slug);
}

/** Position facts that read the catalog voice label as settled; reviewed corrections omit them. */
const LABEL_DEPENDENT_FACTS: ReadonlySet<string> = new Set([
  "type-rank",
  "band",
  "belt",
]);

/** Google cuts titles at roughly 60 characters. */
const TITLE_MAX = 60;

/** "{Singer} Vocal Range" leads (the query), then the longest tail that fits. */
function queryAlignedTitle(s: SingerRecord): string {
  if (COMPARISON_SEARCH_SLUGS.has(s.slug)) {
    return `${s.name} Vocal Range & Voice Type | Compare Yours`;
  }
  // Reviewed corrections dispute the catalog label, so these never print it as settled.
  const reviewedTitles: Record<string, string> = {
    "olivia-rodrigo": "Olivia Rodrigo Vocal Range & Voice Type | Test Yours",
    "reba-mcentire": "Reba McEntire Vocal Range & Voice Type: Classifications Vary",
    "alex-warren": "Alex Warren Vocal Range & Voice Type: No Definitive Type",
    "sam-smith": "Sam Smith Vocal Range & Voice Type: Baritone-to-Tenor",
    "arijit-singh": "Arijit Singh Vocal Range: Reported C3–C5 · Compare Yours",
  };
  if (hasReviewedVoiceTypeCorrection(s)) return reviewedTitles[s.slug];
  const answer = `${s.name} Vocal Range: Reported ${rangeLabel(s)}`;
  const candidates = [
    `${answer}, ${s.voiceType} | Suede Sing`,
    `${answer}, ${s.voiceType}`,
    `${answer} | Suede Sing`,
    `${answer} | Compare Yours`,
  ];
  return candidates.find((t) => t.length <= TITLE_MAX) ?? answer;
}

function queryAlignedHeading(s: SingerRecord, intent: SearchIntent): string {
  if (isPending(s)) {
    return `${s.name} Vocal Range: Reported ${rangeLabel(s)}`;
  }
  if (intent === "voice-type") return `${s.name} Voice Type and Vocal Range`;
  return `${s.name} Vocal Range: Reported ${rangeLabel(s)}`;
}

function queryAlignedDescription(s: SingerRecord): string {
  if (isPending(s)) {
    return `Our catalog reports ${s.name} at ${midiToLabel(s.lowMidi)} to ${midiToLabel(s.highMidi)} (${spanOctaves(s.highMidi - s.lowMidi)} octaves). Individual endpoint review is pending. Compare your range free.`;
  }
  // The answer first, in a sentence that names the singer; the caveat follows.
  const semis = s.highMidi - s.lowMidi;
  return `${s.name}’s reported vocal range is ${midiToLabel(s.lowMidi)} to ${midiToLabel(s.highMidi)}, about ${spanOctaves(semis)} octaves (${semis} semitones). That is a reported reference span, not an independently verified physiological limit. ${voiceTypeEvidenceCopy(s)}`;
}

/** The search snippet: span, size and catalog voice type, then the offer; "Reported" carries the caveat. */
function snippetDescription(s: SingerRecord): string {
  if (s.slug === "olivia-rodrigo") {
    return "Explore Olivia Rodrigo's reported vocal range, disputed voice-type labels, and song-level sources. Take the free range test to compare your notes.";
  }
  if (COMPARISON_SEARCH_SLUGS.has(s.slug)) {
    return `Explore ${s.name}'s reported vocal range and catalog voice type. Take the free range test to compare yours.`;
  }
  const span = `${s.name}'s reported vocal range is ${midiToLabel(s.lowMidi)} to ${midiToLabel(s.highMidi)}, about ${spanOctaves(s.highMidi - s.lowMidi)} octaves`;
  // Reviewed corrections dispute the catalog label, so the snippet omits it.
  if (hasReviewedVoiceTypeCorrection(s)) {
    return `${span}. Reviewed sources don't settle the voice type. See why, then test your own range free.`;
  }
  const typed = `${span} (${s.voiceType.toLowerCase()}).`;
  const full = `${typed} See the highest and lowest notes, then test your own range free.`;
  return full.length <= 155 ? full : fitDescription(`${typed} Test your own range free.`);
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
  const title = queryAlignedTitle(s);
  const description = snippetDescription(s);
  const canonical = `${SITE_URL}/singers/${s.slug}`;
  return {
    title: { absolute: title },
    description,
    keywords: singerKeywords(s),
    alternates: { canonical },
    // Every public profile is indexable; evidence status shapes claims, never indexing.
    robots: pageRobots(true),
    openGraph: {
      title,
      description,
      type: "profile",
      url: canonical,
      siteName: OG_SITE_NAME,
      locale: OG_LOCALE,
    },
  };
}

const VOICE_TYPE_QUESTION = (s: SingerRecord) => `What voice type is ${s.name}?`;
const SIMILAR_QUESTION = (s: SingerRecord) => `Who has a similar vocal range to ${s.name}?`;

interface SingerFaq {
  /** The shared caveat, said once above the list. */
  lede: string;
  items: Array<{ q: string; a: string }>;
}

/**
 * The highest-note / lowest-note / octaves questions searchers type, answered
 * from the fields the page renders. One array feeds the visible section and
 * the FAQPage markup, so the two cannot drift; each answer carries only its
 * own clause and the lede carries the shared caveat once.
 */
function singerFaq(s: SingerRecord): SingerFaq {
  const semis = s.highMidi - s.lowMidi;
  const low = midiToLabel(s.lowMidi);
  const high = midiToLabel(s.highMidi);
  if (isPending(s)) {
    return {
      lede: `Our catalog reports ${s.name} from ${low} to ${high}; individual endpoint review is pending.`,
      items: [
        { q: `How high can ${s.name} sing?`, a: `Up to ${high} in this catalog; that upper endpoint is not a verified individual maximum.` },
        { q: `What is ${s.name}’s highest note?`, a: `${high} is the reported ceiling. No reviewed source here establishes it as ${s.name}’s highest note.` },
        { q: `What is ${s.name}’s lowest note?`, a: `${low} is the reported floor. No reviewed source here establishes it as ${s.name}’s lowest note.` },
        { q: `How many octaves can ${s.name} sing?`, a: `About ${spanOctaves(semis)} octaves (${semis} semitones) in this catalog, not a verified measurement of ${s.name}’s working range.` },
        { q: VOICE_TYPE_QUESTION(s), a: voiceTypeEvidenceCopy(s) },
        { q: SIMILAR_QUESTION(s), a: similarRangeAnswer(s, !hasReviewedVoiceTypeCorrection(s)) },
      ],
    };
  }
  const sourceScope = getSingerEvidence(s.slug).reviewConfirmation
    ? "The catalog record does not independently establish"
    : "The reviewed sources do not independently establish";
  return {
    lede: `The catalog lists ${low} to ${high} as a reported reference span, not an independently verified physiological limit.`,
    items: [
      {
        q: `How high can ${s.name} sing?`,
        a: `Up to ${high} in this catalog; that upper endpoint should not be read as a verified individual maximum.`,
      },
      {
        q: `What is ${s.name}’s highest note?`,
        a: `${high} is the reported ceiling. ${sourceScope} the upper endpoint as an individual highest note.`,
      },
      {
        q: `What is ${s.name}’s lowest note?`,
        a: `${low} is the reported floor. ${sourceScope} the lower endpoint as an individual physiological limit.`,
      },
      {
        q: `How many octaves can ${s.name} sing?`,
        a: `About ${spanOctaves(semis)} octaves (${semis} semitones) in the catalog, not a reviewed measurement of the singer’s full working range.`,
      },
      { q: VOICE_TYPE_QUESTION(s), a: voiceTypeEvidenceCopy(s) },
      { q: SIMILAR_QUESTION(s), a: similarRangeAnswer(s, !hasReviewedVoiceTypeCorrection(s)) },
    ],
  };
}

/** One sentence on what the figures are, for the evidence card. */
function evidenceParagraph(s: SingerRecord, confirmed: boolean): string {
  const limits = `Read it as a reference for comparison, not as ${s.name}’s limits or everyday range.`;
  return confirmed
    ? `The span is the figure that circulates in public discussion, not a measurement: no recording or score has been checked for both endpoints. ${limits}`
    : `The span is a reported reference figure, not an independently verified physiological limit; the sources below say what each one supports. ${limits}`;
}

export default async function SingerPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const s = singerBySlug(slug);
  if (!s) notFound();
  // Client components get four fields: the full record carries the Pro atlas's entry prose.
  const rangeProps = { slug: s.slug, name: s.name, lowMidi: s.lowMidi, highMidi: s.highMidi };

  const semis = s.highMidi - s.lowMidi;
  const related = relatedSingers(s);
  const allLow = sharesLow(s);
  const allHigh = sharesHigh(s);
  // Up to eight chips across the two sub-rows.
  const lowMates = allLow.slice(0, allHigh.length ? 4 : 8);
  const highMates = allHigh.slice(0, allLow.length ? 4 : 8);
  // The range explainer, computed from the catalog's numbers (lib/singer-range-profile).
  const labelSettled = !hasReviewedVoiceTypeCorrection(s);
  const keyboard = keyboardParagraphs(s);
  const typeComparison = voiceTypeParagraphs(s, labelSettled);
  const neighbors = keyboardNeighbors(s);
  const fittingSongs = songsInRange(s);
  const fittingCount = songsInRangeCount(s);

  const pageUrl = `${SITE_URL}/singers/${s.slug}`;
  const answer = queryAlignedDescription(s);
  const faq = singerFaq(s);
  // The atlas chapter profiling this singer; rosters are public, entry prose is Pro.
  const atlasChapter = ATLAS_CONTENTS.find((c) => c.singers.some((row) => row.slug === s.slug));
  const intent = searchIntentFor(s.slug);
  const evidence = getSingerEvidence(s.slug);
  const reviewed = isSingerReviewed(s.slug);
  const breadcrumbs = [
    { name: "Famous vocal ranges", href: "/singers", url: `${SITE_URL}/singers` },
    { name: s.name, href: `/singers/${s.slug}`, url: pageUrl },
  ];
  // dateModified follows the sitemap lastmod; lastReviewed is the review date itself.
  const reviewedPageFields = reviewed
    ? {
        dateModified: getSingerPageLastModified(s.slug),
        lastReviewed: evidence.reviewedAt,
        ...(evidence.reviewedBy ? { reviewedBy: { "@type": "Person", name: evidence.reviewedBy } } : {}),
        ...(evidence.sources.length ? { citation: evidence.sources.map((source) => ({
          "@type": "CreativeWork",
          name: source.title,
          publisher: { "@type": "Organization", name: source.publisher },
          url: source.url,
          description: source.scope,
        })) } : {}),
      }
    : {};
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      // The publisher node itself: a bare @id pointer resolved to nothing on its own.
      ORG_PUBLISHER_NODE,
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        name: queryAlignedHeading(s, intent),
        url: pageUrl,
        description: answer,
        ...reviewedPageFields,
        isPartOf: { "@id": `${SITE_URL}/singers#collection` },
        publisher: { "@id": "https://suedeai.ai/#organization" },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs.map((breadcrumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: breadcrumb.name,
            item: breadcrumb.url,
          })),
        },
        about: { "@id": `${pageUrl}#person` },
        mainEntity: { "@id": `${pageUrl}#person` },
      },
      {
        "@type": "Person",
        "@id": `${pageUrl}#person`,
        name: s.name,
        jobTitle: "Singer",
        nationality: s.country.split("/").map((name) => ({ "@type": "Country", name })),
        description: voiceTypeEvidenceCopy(s),
        // wikipediaUrl() avoids disambiguation pages; null (band-only) means no sameAs.
        ...(wikipediaUrl(s) ? { sameAs: wikipediaUrl(s) } : {}),
      },
      {
        // The same words the page shows, so an answer engine can quote rather than infer.
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        isPartOf: { "@id": `${pageUrl}#webpage` },
        mainEntity: faq.items.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <PageShell
      kicker="Vocal range"
      title={queryAlignedHeading(s, intent)}
      subtitle={queryAlignedDescription(s)}
      actions={
        <>
          {/* "Compare my range · free test →" on the CTR pilot's pages, "Test my range →" elsewhere. */}
          <SingerRangeAction
            s={rangeProps}
            kind={COMPARISON_SEARCH_SLUGS.has(s.slug) ? "compare" : "test"}
          />
          <LinkButton href="/singers" prefetch={false} variant="outline" size="md">
            ← All singers
          </LinkButton>
        </>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-6">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-mut">
          <ol className="flex flex-wrap items-center gap-2">
            {breadcrumbs.map((breadcrumb, index) => (
              <li key={breadcrumb.href} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden="true">/</span>}
                {index === breadcrumbs.length - 1 ? (
                  <span aria-current="page">{breadcrumb.name}</span>
                ) : (
                  // No prefetch: the directory payload is heavy.
                  <Link
                    href={breadcrumb.href}
                    prefetch={false}
                    className="inline-flex min-h-11 items-center hover:text-violet-ink"
                  >
                    {breadcrumb.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Big readout */}
        <Card>
          <p className="mb-4 text-sm text-mut">
            {singerReviewLabel(s.slug)}{" · "}
            {/* Most confirmed records list no sources (/singers/methodology):
                the link names only what the evidence card holds. */}
            <a href="#evidence" className="text-violet-ink underline underline-offset-4">
              {evidence.sources.length > 0 ? "Read sources and limitations" : "Read the limitations"}
            </a>
          </p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <SectionLabel>Reported reference span</SectionLabel>
              <div className="tabular mt-3 font-mono text-5xl font-bold sm:text-6xl">
                {midiToLabel(s.lowMidi)}
                <span className="text-dim">–</span>
                {midiToLabel(s.highMidi)}
              </div>
            </div>
            <div className="flex flex-wrap gap-8">
              <Stat label="Octaves" value={spanOctaves(semis)} tone="violet" />
              <Stat label="Semitones" value={semis} tone="ink" />
              <Stat
                label={isPending(s) || evidence.reviewConfirmation || hasReviewedVoiceTypeCorrection(s) ? "Catalog label" : "Voice type"}
                value={s.voiceType}
                tone="cool"
              />
            </div>
          </div>
          <div className="mt-6">
            <ChromaticStrip
              low={s.lowMidi}
              high={s.highMidi}
              beltMidi={hasReviewedVoiceTypeCorrection(s) ? null : s.beltMidi}
              label={`Keyboard showing ${s.name}'s reported reference span from ${midiToLabel(s.lowMidi)} to ${midiToLabel(s.highMidi)}.`}
            />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <PlayRangeButton s={rangeProps} />
            <dl className="text-sm">
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Signature song
              </dt>
              <dd className="mt-1">{s.signatureSong}</dd>
            </dl>
          </div>
        </Card>

        {/* #you-vs: where the header action and the range result's "Compare" land. */}
        <div id="you-vs" className="scroll-mt-20">
          <CompareWithMe s={rangeProps} />
        </div>

        {/* The range explained from the catalog's numbers alone: keys, pitch, octaves. */}
        <Card>
          <h2 id="piano" className="scroll-mt-24 text-xl">
            {s.name}&rsquo;s vocal range on the piano
          </h2>
          <div className="mt-3 max-w-3xl space-y-3 text-sm text-mut">
            {keyboard.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </Card>

        <Card>
          <h2 id="voice-type-comparison" className="scroll-mt-24 text-xl">
            {labelSettled
              ? `How ${s.name}’s range compares with other ${pluralVoice(s.voiceType.toLowerCase())}`
              : `How ${s.name}’s range lines up with the textbook voice types`}
          </h2>
          <div className="mt-3 max-w-3xl space-y-3 text-sm text-mut">
            {typeComparison.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </Card>

        {/* Songs in the range catalog by this artist */}
        {popSongsByArtistSlug(s.slug).length > 0 && (
          <Card>
            <SectionLabel>Can you sing their songs?</SectionLabel>
            <ul className="mt-4 space-y-2">
              {popSongsByArtistSlug(s.slug).map((song) => (
                <li key={song.slug} className="text-sm">
                  <Link
                    className="inline-flex min-h-11 items-center text-violet-ink underline-offset-4 hover:underline"
                    href={`/can-you-sing/${song.slug}`}
                  >
                    {song.title}
                    {song.artist !== s.name ? ` (${song.artist} recording)` : ""} vocal range:{" "}
                    {popRangeLabel(song)} in {song.key}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* From the catalog's own numbers only, so each page says something specific. */}
        <Card>
          <h2 className="text-xl">
            Where {s.name}&rsquo;s reported span sits in the catalog
          </h2>
          <dl className="mt-4 max-w-3xl space-y-4">
            {/* A reviewed correction set the catalog label aside, so label-dependent facts stay out. */}
            {catalogPositionFor(s)
              .filter(
                (fact) =>
                  !hasReviewedVoiceTypeCorrection(s) ||
                  !LABEL_DEPENDENT_FACTS.has(fact.id),
              )
              .map((fact) => (
                <div key={fact.id}>
                  <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                    {fact.label}
                  </dt>
                  <dd className="mt-1 text-sm text-mut">{fact.text}</dd>
                </div>
              ))}
          </dl>
          <SpanHistogramFigure
            histogram={catalogSpanHistogram(s)}
            name={s.name}
            spanSemitones={semis}
          />
        </Card>

        <Card>
          <h2 id="evidence" className="scroll-mt-24 text-xl">Evidence and review</h2>
          {reviewed ? (
            <>
              <p className="mt-3 max-w-3xl text-sm text-mut">
                {evidence.reviewConfirmation
                  ? `Catalog review confirmed ${evidence.reviewConfirmation.confirmedAt} · Dataset editor: ${evidence.reviewConfirmation.confirmedBy}`
                  : `Reviewed ${evidence.reviewedAt} · Dataset editor: ${evidence.reviewedBy}`}
              </p>
              <p className="mt-3 max-w-3xl text-sm text-mut">
                {evidenceParagraph(s, Boolean(evidence.reviewConfirmation))}
              </p>
              {/* A confirmed record's sources predate the confirmation and were
                  not part of a source review: say what they can't do, as the
                  pending branch does. */}
              {evidence.reviewConfirmation && evidence.sources.length > 0 && (
                <p className="mt-3 max-w-3xl text-xs text-dim">
                  These sources support only the claims named below. They do not verify
                  the catalog&apos;s range endpoints.
                </p>
              )}
              <div className="mt-5 space-y-5">
                {groupEvidenceSources(evidence.sources).map((group) => (
                  <section key={group.label}>
                    <h3 className="text-sm">{group.label}</h3>
                    {group.performance && (
                      <p className="mt-1 text-xs text-dim">Performance: {group.performance}</p>
                    )}
                    <ul className="mt-3 space-y-3">
                      {group.sources.map((source) => (
                        <li key={source.url} className="border-l border-line pl-3 text-sm text-mut">
                          <a
                            href={source.url}
                            rel="noreferrer"
                            target="_blank"
                            className="font-medium text-ink underline decoration-violet/60 underline-offset-4 hover:text-violet-ink"
                          >
                            {source.title} <span className="text-dim">({source.publisher})</span>
                          </a>
                          <p className="mt-1">Supports: {source.supportedClaim}</p>
                          <p className="mt-1">Scope: {source.scope}</p>
                          <p className="mt-1 text-xs">Confidence: {source.confidence}</p>
                          {source.octaveConvention && (
                            <p className="mt-1 text-xs">Octave convention: {source.octaveConvention}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 max-w-3xl text-sm text-mut">
                Individual evidence review is pending. The displayed range is a reported
                reference span, not an independently verified physiological limit: no
                recording or score has been checked for both endpoints.
              </p>
              {evidence.sources.length > 0 && (
                <div className="mt-5 space-y-3">
                  <h3 className="text-sm">Source context awaiting individual review</h3>
                  <p className="text-xs text-dim">
                    These sources support only the claims named below. They do not verify
                    the catalog&apos;s range endpoints or complete the individual review.
                  </p>
                  <ul className="space-y-3">
                    {evidence.sources.map((source) => (
                      <li key={source.url} className="border-l border-line pl-3 text-sm text-mut">
                        <a
                          href={source.url}
                          rel="noreferrer"
                          target="_blank"
                          className="font-medium text-ink underline decoration-violet/60 underline-offset-4 hover:text-violet-ink"
                        >
                          {source.title} <span className="text-dim">({source.publisher})</span>
                        </a>
                        <p className="mt-1">Supports: {source.supportedClaim}</p>
                        <p className="mt-1">Scope: {source.scope}</p>
                        <p className="mt-1 text-xs">Confidence: {source.confidence}</p>
                        {source.octaveConvention && (
                          <p className="mt-1 text-xs">Octave convention: {source.octaveConvention}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <LinkButton href="/singers/methodology" variant="outline" size="sm">
              Methodology
            </LinkButton>
            <LinkButton href="/contact" variant="ghost" size="sm">
              Suggest a correction
            </LinkButton>
          </div>
        </Card>

        {intent === "voice-type" && (
          <Card>
            <h2 className="text-xl">{VOICE_TYPE_QUESTION(s)}</h2>
            <p className="mt-3 max-w-3xl text-mut">{voiceTypeEvidenceCopy(s)}</p>
          </Card>
        )}

        {/* The question families people search, in the same words as the FAQPage markup. */}
        <Card>
          <h2 className="text-xl">{s.name}&rsquo;s highest note, lowest note and octaves</h2>
          <p className="mt-2 max-w-3xl text-sm text-mut">{faq.lede}</p>
          <div className="mt-4 max-w-3xl space-y-5">
            {/* On voice-type intent pages that question has its own card above. */}
            {faq.items
              .filter((f) => intent !== "voice-type" || f.q !== VOICE_TYPE_QUESTION(s))
              .map((f) => (
              <div key={f.q}>
                <h3 className="text-sm">{f.q}</h3>
                <p className="mt-1 text-sm text-mut">{f.a}</p>
              </div>
            ))}
          </div>
          {/* The chapter roster is public; the chapter page carries the offer when paid. */}
          {atlasChapter && (
            <p className="mt-5 max-w-3xl text-sm text-mut">
              {s.name}&rsquo;s full entry (range, tone and technique) is in The
              Voice Atlas, chapter {atlasChapter.order}:{" "}
              <Link
                href={`/atlas/${atlasChapter.slug}`}
                className="text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet"
              >
                {atlasChapter.title}
              </Link>
              {atlasChapter.free ? ", free to read." : ", included with Pro."}
            </p>
          )}
        </Card>

        {/* Similar voices by type and nearest endpoints, then the voices sharing an exact endpoint. */}
        <Card>
          <SectionLabel>Similar voices</SectionLabel>
          <h2 className="mt-3 text-xl">Voices with a similar catalog range</h2>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/singers/${r.slug}`}
                  prefetch={false}
                  className="block rounded-xl border border-line bg-bg px-4 py-3 transition-colors hover:border-violet"
                >
                  <span className="flex items-baseline justify-between gap-3">
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
                  </span>
                  <RangeMini low={r.lowMidi} high={r.highMidi} className="mt-2" />
                  <span className="mt-2 block text-xs text-mut">
                    Shares {sharedSemitones(s, r)} of {s.name}&rsquo;s {semis} semitones
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {(lowMates.length > 0 || highMates.length > 0) && (
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {lowMates.length > 0 && (
                <div>
                  <h3 className="text-base">
                    Also listed from {midiToLabel(s.lowMidi)}
                  </h3>
                  <p className="mt-1 text-sm text-mut">
                    {allLow.length} other{" "}
                    {allLow.length === 1 ? "voice" : "voices"} here{" "}
                    {allLow.length === 1 ? "has" : "have"} the same
                    reported floor in this catalog.
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {lowMates.map((m) => (
                      <li key={m.slug}>
                        <Link
                          href={`/singers/${m.slug}`}
                          prefetch={false}
                          className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs transition-colors hover:border-violet"
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
                  <h3 className="text-base">
                    Also listed up to {midiToLabel(s.highMidi)}
                  </h3>
                  <p className="mt-1 text-sm text-mut">
                    {allHigh.length} other{" "}
                    {allHigh.length === 1 ? "voice" : "voices"} here{" "}
                    {allHigh.length === 1 ? "has" : "have"} the same
                    reported ceiling in this catalog.
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {highMates.map((m) => (
                      <li key={m.slug}>
                        <Link
                          href={`/singers/${m.slug}`}
                          prefetch={false}
                          className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs transition-colors hover:border-violet"
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
          )}
          {/* Nearest floors on the keyboard: a shifting window, so every profile is linked from others. */}
          {neighbors.length > 0 && (
            <div className="mt-6">
              <h3 className="text-base">
                Nearest reported floors to {midiToLabel(s.lowMidi)}
              </h3>
              <p className="mt-1 text-sm text-mut">
                The catalog ordered by lowest note, then highest: the voices on either side of {s.name}.
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {neighbors.map((m) => (
                  <li key={m.slug}>
                    <Link
                      href={`/singers/${m.slug}`}
                      prefetch={false}
                      className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs transition-colors hover:border-violet"
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
          {/* No prefetch: a hub's payload is its whole chart. */}
          <div className="mt-5 flex flex-wrap gap-3">
            <LinkButton
              href={`/singers/voice-type/${voiceTypeSlug(s.voiceType)}`}
              variant="outline"
              size="sm"
              prefetch={false}
            >
              All {pluralVoice(s.voiceType.toLowerCase())}
            </LinkButton>
            {s.genres[0] && (
              <LinkButton
                href={`/singers/genre/${genreSlug(s.genres[0])}`}
                variant="ghost"
                size="sm"
                prefetch={false}
              >
                {s.genres[0]} voices
              </LinkButton>
            )}
          </div>
        </Card>

        {/* One start, at the end of the read: the range test that overlays the visitor on this singer. */}
        <Card className="border-violet/40">
          <h2 id="practice" className="scroll-mt-24 text-xl">
            Sing in {s.name}&rsquo;s range with Suede Sing
          </h2>
          {fittingSongs.length > 0 && (
            <>
              <p className="mt-3 max-w-3xl text-sm text-mut">
                {fittingCount} of the {POP_SONGS.length} songs in the Suede Sing song catalog sit
                inside {s.name}&rsquo;s reported {rangeLabel(s)} as written. The widest of them:
              </p>
              <ul className="mt-3 space-y-1">
                {fittingSongs.map((song) => (
                  <li key={song.slug} className="text-sm">
                    <Link
                      href={`/can-you-sing/${song.slug}`}
                      prefetch={false}
                      className="inline-flex min-h-11 items-center text-violet-ink underline-offset-4 hover:underline"
                    >
                      {song.title} ({song.artist}): {popRangeLabel(song)} in {song.key}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-3 max-w-3xl text-sm text-mut">
            Take the free two-minute range test and Suede Sing lays your lowest and highest
            notes over {s.name}&rsquo;s {rangeLabel(s)} on the same keyboard. You see which of
            these notes you already own and which to train next, then warm up and practice
            right in your browser.
          </p>
          <div className="mt-5">
            <LinkButton href={rangeTestHref({ compare: s.slug })} size="md">
              Test my range against {s.name} →
            </LinkButton>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
