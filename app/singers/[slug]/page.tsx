import type { Metadata } from "next";
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
import {
  getSingerEvidence,
  groupEvidenceSources,
  isSingerReviewed,
  singerReviewLabel,
  voiceTypeEvidenceCopy,
} from "@/lib/singer-evidence";
import { SINGER_RANGE_DISCLAIMER } from "@/lib/singer-editorial";
import { popRangeLabel, popSongsByArtistSlug } from "@/lib/pop-songs";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
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
  SectionLabel,
  Stat,
} from "@/components/ui";

interface Params {
  slug: string;
}

type SearchIntent = "voice-type" | "vocal-range";

type SingerRecord = (typeof SINGERS)[number];

/** September 27 CTR pilot; keep recently revised singer snippets stable. */
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

function queryAlignedTitle(s: SingerRecord): string {
  if (COMPARISON_SEARCH_SLUGS.has(s.slug)) {
    return `${s.name} Vocal Range & Voice Type | Compare Yours`;
  }
  if (isPending(s)) {
    const answer = `${s.name} Vocal Range: Reported ${rangeLabel(s)}`;
    const challenge = `${answer} | Compare Yours`;
    return challenge.length <= 60 ? challenge : answer;
  }
  const reviewedTitles: Record<string, string> = {
    "olivia-rodrigo": "Olivia Rodrigo Vocal Range & Voice Type | Test Yours",
    "reba-mcentire": "Reba McEntire Voice Type: Classifications Vary | Reported Vocal Range E3–F5",
    "alex-warren": "Alex Warren Voice Type: Evidence Does Not Establish a Definitive Type | Reported Vocal Range A2–F#4",
    "sam-smith": "Sam Smith Voice Type: Baritone-to-Tenor Territory | Reported Vocal Range G2–C6",
    "arijit-singh": "Arijit Singh Vocal Range: Reported C3–C5 — Compare Yours",
  };
  if (hasReviewedVoiceTypeCorrection(s)) return reviewedTitles[s.slug];
  return `${s.name} Vocal Range: Reported ${rangeLabel(s)} | Compare Yours`;
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
  return `${voiceTypeEvidenceCopy(s)} The displayed range of ${midiToLabel(s.lowMidi)} to ${midiToLabel(s.highMidi)} is a reported reference span, not an independently verified physiological limit.`;
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
  const description = s.slug === "olivia-rodrigo"
    ? "Explore Olivia Rodrigo's reported vocal range, disputed voice-type labels, and song-level sources. Take the free range test to compare your notes."
    : COMPARISON_SEARCH_SLUGS.has(s.slug) && isPending(s)
      ? `Explore ${s.name}'s reported vocal range and catalog voice type. Take the free range test to compare yours. Individual endpoint review is pending.`
      : queryAlignedDescription(s);
  const canonical = `${SITE_URL}/singers/${s.slug}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "profile",
      url: canonical,
    },
  };
}

function answerSentence(s: SingerRecord): string {
  const semis = s.highMidi - s.lowMidi;
  if (isPending(s)) {
    return `Our catalog reports ${s.name} from ${midiToLabel(s.lowMidi)} to ${midiToLabel(s.highMidi)}, a reference span of about ${spanOctaves(semis)} octaves (${semis} semitones). Individual endpoint review is pending; these are not verified physiological limits.`;
  }
  return `The displayed range of ${midiToLabel(s.lowMidi)} to ${midiToLabel(s.highMidi)} is a reported reference span of about ${spanOctaves(semis)} octaves (${semis} semitones), not an independently verified physiological limit. ${voiceTypeEvidenceCopy(s)}`;
}

/**
 * The other question families searchers type — "what is X's highest note",
 * "what is X's lowest note", "how many octaves can X sing" — answered from the
 * same fields the page renders. One array feeds both the visible section and
 * the FAQPage markup, so the marked-up answer can never drift from the read one.
 * Typographic apostrophes throughout, for the same reason `question` uses one.
 */
function singerFaq(s: SingerRecord): Array<{ q: string; a: string }> {
  const semis = s.highMidi - s.lowMidi;
  if (isPending(s)) {
    const referenceSpan = `Our catalog reports ${s.name} from ${midiToLabel(s.lowMidi)} to ${midiToLabel(s.highMidi)}; individual endpoint review is pending.`;
    return [
      { q: `How high can ${s.name} sing?`, a: `${referenceSpan} The upper endpoint is not a verified individual maximum.` },
      { q: `What is ${s.name}’s highest note?`, a: `${referenceSpan} No reviewed source here establishes the upper endpoint as ${s.name}’s highest note.` },
      { q: `What is ${s.name}’s lowest note?`, a: `${referenceSpan} No reviewed source here establishes the lower endpoint as ${s.name}’s lowest note.` },
      { q: `How many octaves can ${s.name} sing?`, a: `${referenceSpan} It covers about ${spanOctaves(semis)} octaves (${semis} semitones) in this catalog, not a verified measurement of ${s.name}’s working range.` },
      { q: `What voice type is ${s.name}?`, a: voiceTypeEvidenceCopy(s) },
    ];
  }
  const referenceSpan = `The catalog lists ${midiToLabel(s.lowMidi)} to ${midiToLabel(s.highMidi)} as a reported reference span, not an independently verified physiological limit.`;
  return [
    {
      q: `How high can ${s.name} sing?`,
      a: `${referenceSpan} Its upper endpoint should not be read as a verified individual maximum.`,
    },
    {
      q: `What is ${s.name}’s highest note?`,
      a: `${referenceSpan} The reviewed sources do not independently establish the upper endpoint as an individual highest note.`,
    },
    {
      q: `What is ${s.name}’s lowest note?`,
      a: `${referenceSpan} The reviewed sources do not independently establish the lower endpoint as an individual physiological limit.`,
    },
    {
      q: `How many octaves can ${s.name} sing?`,
      a: `${referenceSpan} It covers about ${spanOctaves(semis)} octaves (${semis} semitones) in the catalog, not a reviewed measurement of the singer's full working range.`,
    },
  ];
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
  const lowMates = sharesLow(s).slice(0, 8);
  const highMates = sharesHigh(s).slice(0, 8);

  const pageUrl = `${SITE_URL}/singers/${s.slug}`;
  const answer = answerSentence(s);
  const faq = singerFaq(s);
  const intent = searchIntentFor(s.slug);
  const evidence = getSingerEvidence(s.slug);
  const reviewed = isSingerReviewed(s.slug);
  const breadcrumbs = [
    { name: "Famous vocal ranges", href: "/singers", url: `${SITE_URL}/singers` },
    { name: s.name, href: `/singers/${s.slug}`, url: pageUrl },
  ];
  const reviewedPageFields = reviewed
    ? {
        dateModified: evidence.reviewedAt,
        reviewedBy: { "@type": "Person", name: evidence.reviewedBy },
        citation: evidence.sources.map((source) => ({
          "@type": "CreativeWork",
          name: source.title,
          publisher: source.publisher,
          url: source.url,
          description: source.scope,
        })),
      }
    : {};
  // Rendered below AND used verbatim in the FAQPage markup. Google requires the
  // marked-up question to match what the reader sees; sharing one string is the
  // only way that stays true. Note the typographic apostrophe — the heading used
  // &rsquo;, so a straight quote here would have been a silent mismatch.
  const question = `What is ${s.name}’s vocal range?`;

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
        name: queryAlignedHeading(s, intent),
        url: pageUrl,
        description: answer,
        ...reviewedPageFields,
        // Joins each singer to the hub and to the estate graph, so a consumer
        // landing here can resolve the collection and the publisher.
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
        mainEntity: { "@id": `${pageUrl}#person` },
      },
      {
        "@type": "Person",
        "@id": `${pageUrl}#person`,
        name: s.name,
        jobTitle: "Singer",
        nationality: s.country,
        description: voiceTypeEvidenceCopy(s),
        // Without an external identifier these are hundreds of unresolvable
        // strings; the Wikipedia URL is the cheapest anchor to the real entity.
        // Derived via wikipediaUrl() rather than raw name-mangling — 18 singers
        // have names that mangle onto a disambiguation page, which asserts the
        // wrong entity instead of failing loudly. Null means no personal
        // article exists (band-only artists) — then the node carries no sameAs
        // rather than a wrong one.
        ...(wikipediaUrl(s) ? { sameAs: wikipediaUrl(s) } : {}),
      },
      {
        // The page already asks and answers this question in these exact words.
        // Marking the pair up is what lets an answer engine quote it as an
        // answer rather than infer one. Not a bid for FAQ rich results — Google
        // limits those to government and health sites.
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        isPartOf: { "@id": `${pageUrl}#webpage` },
        mainEntity: [
          {
            "@type": "Question",
            name: question,
            acceptedAnswer: { "@type": "Answer", text: answer },
          },
          ...faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        ],
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
          <LinkButton href={`/range?compare=${s.slug}`} size="md">
            {COMPARISON_SEARCH_SLUGS.has(s.slug)
              ? "Compare my range — free test →"
              : "Test my range →"}
          </LinkButton>
          <LinkButton href="/singers" variant="outline" size="md">
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
                  <Link href={breadcrumb.href} className="inline-flex min-h-11 items-center hover:text-violet-ink">
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
            <a href="#evidence" className="text-violet-ink underline underline-offset-4">
              Read sources and limitations
            </a>
          </p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <SectionLabel>Reported reference span</SectionLabel>
              <div className="tabular mt-3 font-mono text-5xl font-bold sm:text-6xl">
                {midiToLabel(s.lowMidi)}
                <span className="text-dim"> — </span>
                {midiToLabel(s.highMidi)}
              </div>
            </div>
            <div className="flex flex-wrap gap-8">
              <Stat label="Octaves" value={spanOctaves(semis)} tone="violet" />
              <Stat label="Semitones" value={semis} tone="ink" />
              <Stat
                label={isPending(s) || hasReviewedVoiceTypeCorrection(s) ? "Catalog label" : "Voice type"}
                value={s.voiceType}
                tone="cool"
              />
            </div>
          </div>
          <div className="mt-6">
            <ChromaticStrip
              low={s.lowMidi}
              high={s.highMidi}
              label={`Keyboard showing ${s.name}'s reported reference span from ${midiToLabel(s.lowMidi)} to ${midiToLabel(s.highMidi)}.`}
            />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <PlayRangeButton s={s} />
          </div>
        </Card>

        {/* The profile's unique value is the personal comparison, so it sits
            directly under the answer rather than below the editorial detail. */}
        <CompareWithMe s={s} />

        <Card>
          <SectionLabel>Evidence and review</SectionLabel>
          <h2 id="evidence" className="mt-3 scroll-mt-24 text-xl">Evidence and review</h2>
          {reviewed ? (
            <>
              <p className="mt-3 max-w-3xl text-sm text-mut">
                Reviewed {evidence.reviewedAt} · Dataset editor: {evidence.reviewedBy}
              </p>
              <p className="mt-3 max-w-3xl text-sm text-mut">
                Reported reference span: the displayed catalog range is not an independently
                verified physiological limit. {voiceTypeEvidenceCopy(s)}
              </p>
              <div className="mt-5 space-y-5">
                {groupEvidenceSources(evidence.sources).map((group) => (
                  <section key={group.label}>
                    <h3 className="text-sm font-semibold">{group.label}</h3>
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
                reference span, not an independently verified physiological limit.
              </p>
              {isPending(s) && (
                <p className="mt-3 max-w-3xl text-sm text-mut">
                  The catalog has not verified recordings or scores for both endpoints.
                  These figures cannot establish a repeatable singing range or an absolute
                  highest or lowest note.
                </p>
              )}
              {evidence.sources.length > 0 && (
                <div className="mt-5 space-y-3">
                  <h3 className="text-sm font-semibold">Source context awaiting individual review</h3>
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
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          <p className="mt-3 max-w-3xl text-sm text-mut">{SINGER_RANGE_DISCLAIMER}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <LinkButton href="/singers/methodology" variant="outline" size="sm">
              Methodology
            </LinkButton>
            <LinkButton href="/contact" variant="ghost" size="sm">
              Suggest a correction
            </LinkButton>
          </div>
        </Card>

        {/* The answer, in prose a search snippet can lift */}
        <Card>
          <h2 className="text-xl">{question}</h2>
          <p className="mt-3 max-w-3xl text-mut">{answer}</p>
          <dl className="mt-5">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Signature song
              </dt>
              <dd className="mt-1 text-sm">{s.signatureSong}</dd>
            </div>
          </dl>
          <p className="mt-5 text-xs text-dim">
            Reported catalog figures, not lab measurements — an endpoint may be
            an isolated performance and does not describe an everyday singing range.
          </p>
        </Card>

        {intent === "voice-type" && (
          <Card>
            <h2 className="text-xl">What voice type is {s.name}?</h2>
            <p className="mt-3 max-w-3xl text-mut">{voiceTypeEvidenceCopy(s)}</p>
          </Card>
        )}

        {/* The highest-note / lowest-note / octaves question families, in the
            words people search. Same array as the FAQPage markup above. */}
        <Card>
          <h2 className="text-xl">More about {s.name}&rsquo;s voice</h2>
          <div className="mt-4 max-w-3xl space-y-5">
            {faq.map((f) => (
              <div key={f.q}>
                <h3 className="text-sm font-semibold">{f.q}</h3>
                <p className="mt-1 text-sm text-mut">{f.a}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Who else touches the same extremes — the pages a reader who cares
            about one specific note actually wants next. */}
        {(lowMates.length > 0 || highMates.length > 0) && (
          <Card>
            <SectionLabel>Same reported notes, other voices</SectionLabel>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {lowMates.length > 0 && (
                <div>
                  <h2 className="text-base">
                    Also listed from {midiToLabel(s.lowMidi)}
                  </h2>
                  <p className="mt-1 text-sm text-mut">
                    {sharesLow(s).length} other{" "}
                    {sharesLow(s).length === 1 ? "voice" : "voices"} here{" "}
                    {sharesLow(s).length === 1 ? "has" : "have"} the same
                    reported floor in this catalog.
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {lowMates.map((m) => (
                      <li key={m.slug}>
                        <Link
                          href={`/singers/${m.slug}`}
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
                  <h2 className="text-base">
                    Also listed up to {midiToLabel(s.highMidi)}
                  </h2>
                  <p className="mt-1 text-sm text-mut">
                    {sharesHigh(s).length} other{" "}
                    {sharesHigh(s).length === 1 ? "voice" : "voices"} here{" "}
                    {sharesHigh(s).length === 1 ? "has" : "have"} the same
                    reported ceiling in this catalog.
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {highMates.map((m) => (
                      <li key={m.slug}>
                        <Link
                          href={`/singers/${m.slug}`}
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
            <div className="mt-5 flex flex-wrap gap-3">
              <LinkButton
                href={`/singers/voice-type/${voiceTypeSlug(s.voiceType)}`}
                variant="outline"
                size="sm"
              >
                All {pluralVoice(s.voiceType.toLowerCase())}
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

        {/* Songs in the range catalog by this artist */}
        {popSongsByArtistSlug(s.slug).length > 0 && (
          <Card>
            <SectionLabel>Can you sing their songs?</SectionLabel>
            <ul className="mt-4 space-y-2">
              {popSongsByArtistSlug(s.slug).map((song) => (
                <li key={song.slug} className="text-sm">
                  <Link
                    className="text-violet-ink underline-offset-4 hover:underline"
                    href={`/can-you-sing/${song.slug}`}
                  >
                    {song.title} vocal range: {popRangeLabel(song)} in {song.key}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Similar voices */}
        <Card>
          <SectionLabel>Similar voices</SectionLabel>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/singers/${r.slug}`}
                  className="flex items-baseline justify-between gap-3 rounded-xl border border-line bg-bg px-4 py-3 transition-colors hover:border-violet"
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
