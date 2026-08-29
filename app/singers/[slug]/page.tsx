import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { altSpelling, midiToLabel } from "@/lib/audio/notes";
import {
  SINGERS,
  rangeLabel,
  genreSlug,
  hasUsefulPercentile,
  relatedSingers,
  singerBySlug,
  spanOctaves,
  spanPercentile,
  pluralVoice,
  voiceTypeSlug,
  wikipediaUrl,
} from "@/lib/singers";
import {
  observationsFor,
  sharesHigh,
  sharesLow,
} from "@/lib/singers-analysis";
import {
  getSingerEvidence,
  groupEvidenceSources,
  isSingerReviewed,
  voiceTypeEvidenceCopy,
} from "@/lib/singer-evidence";
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

type SearchIntent = "voice-type" | "vocal-range";

type SingerRecord = (typeof SINGERS)[number];

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

function queryAlignedTitle(s: SingerRecord, intent: SearchIntent): string {
  const reviewedTitles: Record<string, string> = {
    "olivia-rodrigo": "Olivia Rodrigo Voice Type: Classifications Vary | Reported Vocal Range B2–A#5",
    "reba-mcentire": "Reba McEntire Voice Type: Classifications Vary | Reported Vocal Range E3–F5",
    "alex-warren": "Alex Warren Voice Type: Evidence Does Not Establish a Definitive Type | Reported Vocal Range A2–F#4",
    "sam-smith": "Sam Smith Voice Type: Baritone-to-Tenor Territory | Reported Vocal Range G2–C6",
    "arijit-singh": "Arijit Singh Vocal Range: Reported C3–C5 | Voice Type: Described as Rich Baritone",
  };
  if (hasReviewedVoiceTypeCorrection(s)) return reviewedTitles[s.slug];
  const voice = `Voice Type: ${s.voiceType}`;
  return intent === "voice-type"
    ? `${s.name} ${voice} | Vocal Range ${rangeLabel(s)}`
    : `${s.name} Vocal Range: ${rangeLabel(s)} | ${voice}`;
}

function queryAlignedHeading(s: SingerRecord, intent: SearchIntent): string {
  return intent === "voice-type"
    ? `${s.name} Voice Type and Vocal Range`
    : `${s.name} Vocal Range and Voice Type`;
}

function queryAlignedDescription(s: SingerRecord, intent: SearchIntent): string {
  if (hasReviewedVoiceTypeCorrection(s)) {
    return `${voiceTypeEvidenceCopy(s)} The displayed range of ${midiToLabel(s.lowMidi)} to ${midiToLabel(s.highMidi)} is a reported reference span, not an independently verified physiological limit.`;
  }
  const semis = s.highMidi - s.lowMidi;
  const voiceAnswer = `${s.name} is commonly classified as a ${s.voiceType.toLowerCase()}. The cited vocal range is ${midiToLabel(s.lowMidi)} to ${midiToLabel(s.highMidi)} (${spanOctaves(semis)} octaves).`;
  const rangeAnswer = `${s.name}'s cited vocal range is ${midiToLabel(s.lowMidi)} to ${midiToLabel(s.highMidi)} (${spanOctaves(semis)} octaves). ${s.name} is commonly classified as a ${s.voiceType.toLowerCase()}.`;
  return `${intent === "voice-type" ? voiceAnswer : rangeAnswer} See the notes and compare your range free.`;
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
  const intent = searchIntentFor(s.slug);
  const title = queryAlignedTitle(s, intent);
  const description = queryAlignedDescription(s, intent);
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

/** Voice categories whose upper register is head voice, not falsetto. */
const HEAD_VOICE_TYPES = new Set(["Contralto", "Mezzo-soprano", "Soprano"]);

/** "A#5 (Bb5)" where the two spellings differ, else just "A#5". */
function bothSpellings(midi: number): string {
  const alt = altSpelling(midi);
  return alt ? `${midiToLabel(midi)} (${alt})` : midiToLabel(midi);
}

function answerSentence(s: SingerRecord): string {
  const semis = s.highMidi - s.lowMidi;
  if (hasReviewedVoiceTypeCorrection(s)) {
    return `The displayed range of ${midiToLabel(s.lowMidi)} to ${midiToLabel(s.highMidi)} is a reported reference span of about ${spanOctaves(semis)} octaves (${semis} semitones), not an independently verified physiological limit. ${voiceTypeEvidenceCopy(s)}`;
  }
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

/**
 * The other question families searchers type — "what is X's highest note",
 * "what is X's lowest note", "how many octaves can X sing" — answered from the
 * same fields the page renders. One array feeds both the visible section and
 * the FAQPage markup, so the marked-up answer can never drift from the read one.
 * Typographic apostrophes throughout, for the same reason `question` uses one.
 */
function singerFaq(s: SingerRecord): Array<{ q: string; a: string }> {
  const semis = s.highMidi - s.lowMidi;
  // "How high can X sing" is its own query family, asked in those words, and
  // it wants the register story — how far full voice goes and what carries the
  // voice above it — not just the peak note (the next question owns that).
  const howHigh: string[] = [];
  if (s.beltMidi != null) {
    const upper = HEAD_VOICE_TYPES.has(s.voiceType)
      ? "head voice"
      : "falsetto or head voice";
    howHigh.push(
      `${s.name} is commonly cited singing up to around ${bothSpellings(s.beltMidi)} in full voice, and as high as ${bothSpellings(s.highMidi)} overall — the stretch above ${midiToLabel(s.beltMidi)} comes from ${s.whistle ? `${upper} and whistle register` : upper}.`,
    );
  } else {
    howHigh.push(
      `${s.name} is commonly cited singing as high as ${bothSpellings(s.highMidi)}, the top of a cited range that starts down at ${midiToLabel(s.lowMidi)}.`,
    );
    if (s.whistle) {
      howHigh.push("The very top of that span sits in whistle register.");
    }
  }
  const high = [
    `${s.name}’s highest note is commonly cited as ${bothSpellings(s.highMidi)}${s.highSource ? `, heard in ${s.highSource}` : ""}.`,
  ];
  if (s.whistle) {
    high.push("That note sits in whistle register.");
  } else if (s.beltMidi != null && s.beltMidi < s.highMidi) {
    high.push(
      `Full voice is cited up to around ${midiToLabel(s.beltMidi)}; the very top comes from ${HEAD_VOICE_TYPES.has(s.voiceType) ? "head voice" : "falsetto or head voice"}.`,
    );
  }
  const octaves = [
    `${s.name}’s commonly cited range spans about ${spanOctaves(semis)} octaves (${semis} semitones), from ${midiToLabel(s.lowMidi)} up to ${midiToLabel(s.highMidi)}.`,
  ];
  if (hasUsefulPercentile(s)) {
    octaves.push(
      `That span is wider than ${spanPercentile(s)}% of the ${SINGERS.length} voices in this library.`,
    );
  }
  return [
    { q: `How high can ${s.name} sing?`, a: howHigh.join(" ") },
    { q: `What is ${s.name}’s highest note?`, a: high.join(" ") },
    {
      q: `What is ${s.name}’s lowest note?`,
      a: `${s.name}’s lowest note is commonly cited as ${bothSpellings(s.lowMidi)}${s.lowSource ? `, heard in ${s.lowSource}` : ""}.`,
    },
    { q: `How many octaves can ${s.name} sing?`, a: octaves.join(" ") },
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
  const observations = observationsFor(s).slice(0, 5);
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
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        name: `${s.name} Vocal Range: ${rangeLabel(s)}`,
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
        description: hasReviewedVoiceTypeCorrection(s)
          ? voiceTypeEvidenceCopy(s)
          : `${s.voiceType} known for "${s.signatureSong}". ${s.blurb}`,
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
      subtitle={queryAlignedDescription(s, intent)}
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
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-mut">
          <ol className="flex flex-wrap items-center gap-2">
            {breadcrumbs.map((breadcrumb, index) => (
              <li key={breadcrumb.href} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden="true">/</span>}
                {index === breadcrumbs.length - 1 ? (
                  <span aria-current="page">{breadcrumb.name}</span>
                ) : (
                  <Link href={breadcrumb.href} className="hover:text-amber-ink">
                    {breadcrumb.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Big readout */}
        <Card>
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
              <Stat label="Octaves" value={spanOctaves(semis)} tone="amber" />
              <Stat label="Semitones" value={semis} tone="ink" />
              {s.beltMidi != null && (
                <Stat
                  label="Full voice to"
                  value={midiToLabel(s.beltMidi)}
                  tone="rec"
                />
              )}
              <Stat
                label={hasReviewedVoiceTypeCorrection(s) ? "Catalog label" : "Voice type"}
                value={s.voiceType}
                tone="cool"
              />
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

        <Card>
          <SectionLabel>Evidence and review</SectionLabel>
          <h2 className="mt-3 text-xl">Evidence and review</h2>
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
                            className="font-medium text-ink underline decoration-amber/60 underline-offset-4 hover:text-amber-ink"
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
            <p className="mt-3 max-w-3xl text-sm text-mut">
              Individual evidence review is pending. The displayed range is a reported
              reference span, not an independently verified physiological limit.
            </p>
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
          <h2 className="text-xl">{question}</h2>
          <p className="mt-3 max-w-3xl text-mut">{answer}</p>
          <p className="mt-3 max-w-3xl text-sm text-mut">{s.blurb}</p>
          <dl className="mt-5">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Signature song
              </dt>
              <dd className="mt-1 text-sm">{s.signatureSong}</dd>
            </div>
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
