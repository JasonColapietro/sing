import type { Metadata } from "next";
import Link from "next/link";
import { SingersDirectory } from "@/components/singers/directory";
import { SingerCrawlIndex } from "@/components/singers/crawl-index";
import { Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";
import {
  HUB_GENRES,
  SINGERS,
  VOICE_KINDS,
  genreSlug,
  joinNames,
  rangeLabel,
  recordHolders,
  spanOctaves,
  voiceTypeSlug,
} from "@/lib/singers";
import { SINGER_RANGE_DISCLAIMER } from "@/lib/singer-editorial";
import { hasDocumentedSourceReview, singerReviewLabel } from "@/lib/singer-evidence";
import { VOCAL_RANGE_PRIORITY_SLUGS } from "@/lib/singer-search-priority";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { OG_LOCALE, OG_SITE_NAME } from "@/lib/og";
import { SITE_URL, rangeTestHref } from "@/lib/site";
import { routeKeywords } from "@/lib/keywords";

const DESCRIPTION = `Reported catalog ranges for famous singers on one keyboard. Check each profile's evidence status and compare your own range free.`;

const VOCAL_RANGE_PRIORITY_SINGERS = VOCAL_RANGE_PRIORITY_SLUGS.map((slug) => {
  const singer = SINGERS.find((candidate) => candidate.slug === slug);
  if (!singer) throw new Error(`Unknown vocal-range search priority: ${slug}`);
  return singer;
});

/**
 * Profiles whose sources a person has reviewed (status reviewed or disputed).
 * Give these a named place on the hub as an editorial recommendation;
 * every public singer profile is also indexable and linked in the A–Z list.
 */
const REVIEWED_SINGERS = SINGERS.filter((s) => hasDocumentedSourceReview(s.slug)).sort(
  (a, b) => a.name.localeCompare(b.name),
);

/**
 * The questions people actually type before they land here, answered from the
 * same data the page renders — so an answer engine quoting us cannot quote a
 * figure the page contradicts, and neither can drift as SINGERS changes.
 *
 * These pair with FAQPage markup below. Note that is NOT a play for FAQ rich
 * results: Google restricts those to government and health sites. It is for
 * answer engines, which read the Q&A pairing directly.
 */
function buildFaq() {
  // Every holder of each record, so a tie is never reported as one winner.
  const r = recordHolders(SINGERS);
  const total = SINGERS.length;
  const w = r.widest[0];
  const octaves = spanOctaves(w.highMidi - w.lowMidi);
  const names = (list: typeof SINGERS) => joinNames(list.map((s) => s.name));
  return [
    {
      q: "Who has the widest vocal range?",
      a:
        r.widest.length === 1
          ? `Among ${total} catalog profiles, ${w.name} has the largest reported span: ${rangeLabel(w)}, about ${octaves} octaves. This is a catalog ranking, not a verified individual record.`
          : `Among ${total} catalog profiles, ${joinNames(r.widest.map((s) => `${s.name} (${rangeLabel(s)})`))} share the largest reported span, about ${octaves} octaves. This is a catalog ranking, not a verified individual record.`,
    },
    {
      q: "What is the lowest note sung by a famous singer?",
      a: `The lowest catalog endpoint is ${rangeLabel(r.lowest[0]).split("–")[0]}, listed for ${names(r.lowest)}. ${r.lowest.length === 1 ? "The profile's" : "Each profile's"} evidence status determines what the source material actually supports.`,
    },
    {
      q: "What is the highest note sung by a famous singer?",
      a: `The highest catalog endpoint is ${rangeLabel(r.highest[0]).split("–")[1]}, listed for ${names(r.highest)}. It is not a verified highest note without individual source review.`,
    },
    {
      q: "What does a singer's reported range mean?",
      a: SINGER_RANGE_DISCLAIMER,
    },
    {
      q: "How do I find my own vocal range?",
      a: "Slide down to the lowest note you can hold clearly, then up to the highest, into your microphone. Suede Sing's free range test detects both in about two minutes and marks them on the same keyboard as every singer in this index, so you can overlay yours against theirs.",
    },
  ];
}

export const metadata: Metadata = {
  keywords: routeKeywords("/singers"),
  title: "Famous Singers' Vocal Ranges: Vocal Range Chart",
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/singers` },
  openGraph: {
    title: `Famous Singers' Vocal Ranges and Vocal Range Chart: each voice on one keyboard`,
    description: DESCRIPTION,
    type: "website",
    url: `${SITE_URL}/singers`,
    siteName: OG_SITE_NAME,
    locale: OG_LOCALE,
  },
};

export default function SingersPage() {
  const faq = buildFaq();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      // The publisher, spelled out rather than pointed at. Every template on
      // this site referenced this @id without defining it, so a crawler
      // reading one page on its own resolved the pointer to nothing.
      ORG_PUBLISHER_NODE,
      {
        "@type": "CollectionPage",
        // Stable @id so the hub can be referenced by the artist pages and by
        // the rest of the estate graph, which keys off suedeai.ai/#organization.
        "@id": `${SITE_URL}/singers#collection`,
        name: "Famous Singers' Vocal Ranges",
        url: `${SITE_URL}/singers`,
        description: DESCRIPTION,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        publisher: { "@id": "https://suedeai.ai/#organization" },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: "Suede Sing",
        publisher: { "@id": "https://suedeai.ai/#organization" },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/singers#faq`,
        isPartOf: { "@id": `${SITE_URL}/singers#collection` },
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
      kicker="Reference"
      title="Famous singers' vocal ranges on one chart"
      subtitle={`A vocal range chart of ${SINGERS.length} famous singers: each reported catalog range, lowest note to highest, drawn on the same keyboard so you can compare voices, and your own range, at a glance.`}
      actions={
        <LinkButton href={rangeTestHref()} size="md">
          Test my vocal range →
        </LinkButton>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* This page is the chart and the Voice Atlas is the book about the same
          voices. Both opened on "famous singers' vocal ranges", so each carried
          half of one query; the line below says which page answers what. */}
      <p className="max-w-3xl text-mut">
        This page is the chart: every reported catalog range on one keyboard, filterable,
        with your own range overlaid on top of them. It reports the figures
        rather than explaining them. The{" "}
        <Link href="/atlas" prefetch={false} className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet">
          Voice Atlas
        </Link>{" "}
        is the book that explains them, voice by voice. Come here for the number.
        Go there for how the voice does it.
      </p>

      {/* No button of its own: the hero's "Test my vocal range" sits just
          above, and a second and third copy of the same ask before the
          chart read as three competing primary actions. */}
      <Card className="mt-8 border-violet/40">
        <div className="max-w-2xl">
          <SectionLabel>Compare your voice</SectionLabel>
          <h2 className="mt-3 text-2xl">Can you sing it?</h2>
          <p className="mt-2 text-sm text-mut">
            Find your lowest and highest notes in about two minutes, then open
            any singer to see exactly how your range overlaps theirs. Free in
            your browser, nothing to install.
          </p>
        </div>
      </Card>

      {REVIEWED_SINGERS.length > 0 && (
        <section
          data-singer-reviewed="true"
          aria-labelledby="reviewed-singer-profiles"
          className="mt-10"
        >
          <h2 id="reviewed-singer-profiles" className="text-xl">
            Profiles with reviewed sources
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-mut">
            A person has checked the sources behind each of these profiles.
            Open one to see what those sources support.
          </p>
          {/* prefetch off on this page's link lists (profiles, voice types,
              genres): by default each fetched its route payload on scroll,
              about 70 background requests for pages nobody had opened. */}
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {REVIEWED_SINGERS.map((singer) => (
              <li key={singer.slug}>
                <Link
                  href={`/singers/${singer.slug}`}
                  prefetch={false}
                  className="flex h-full flex-col gap-1 rounded-xl border border-line bg-panel px-4 py-3 transition-colors hover:border-violet"
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium">
                      {singer.name} vocal range
                    </span>
                    <span className="tabular shrink-0 font-mono text-[11px] text-mut">
                      {rangeLabel(singer)}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
                    {singerReviewLabel(singer.slug)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Real voice-type destinations stay ahead of the long singer directory. */}
      <section className="mt-12">
        <h2 className="text-xl">Browse by voice type</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {VOICE_KINDS.map((v) => (
            <li key={v}>
              <Link
                href={`/singers/voice-type/${voiceTypeSlug(v)}`}
                prefetch={false}
                className="flex min-h-11 items-baseline justify-between gap-3 rounded-xl border border-line bg-panel px-4 py-3 transition-colors hover:border-violet"
              >
                <span className="text-sm font-medium">{v === "Contralto" ? "Contralto singers and their vocal ranges" : `${v} singers`}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <SingersDirectory />
      {/* After the chart, not above it: on a phone these cards put the chart
          five screens down. Keep the comparison tool ahead of this additional
          set of links. */}
      <section
        data-singer-search-priority="true"
        aria-labelledby="popular-vocal-range-lookups"
        className="mt-12"
      >
        <h2 id="popular-vocal-range-lookups" className="text-xl">
          Popular vocal range lookups
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-mut">
          Frequently looked-up singers, with the reported span visible before
          you open one.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {VOCAL_RANGE_PRIORITY_SINGERS.map((singer) => (
            <li key={singer.slug}>
              <Link
                href={`/singers/${singer.slug}`}
                prefetch={false}
                className="flex h-full items-baseline justify-between gap-3 rounded-xl border border-line bg-panel px-4 py-3 transition-colors hover:border-violet"
              >
                <span className="text-sm font-medium">
                  {singer.name} vocal range
                </span>
                <span className="tabular shrink-0 font-mono text-[11px] text-mut">
                  {rangeLabel(singer)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <SingerCrawlIndex />

      {/* data-singer-return: below the chart, so Back from these links needs
          the directory to bring the link back into view, as it does for the
          chart's rows (components/singers/directory.tsx RETURN_SCOPES). */}
      <section data-singer-return="browse" className="mt-12">
        <h2 className="mt-8 text-xl">Browse by genre</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {HUB_GENRES.map((g) => (
            <li key={g}>
              <Link
                href={`/singers/genre/${genreSlug(g)}`}
                prefetch={false}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-sm transition-colors hover:border-violet"
              >
                {g}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <LinkButton href="/singers/records" prefetch={false} variant="outline" size="sm">
            Widest vocal ranges and catalog extremes, ranked →
          </LinkButton>
        </div>
      </section>

      {/* The questions that bring people here, answered on the page in the same
          words as the FAQPage markup above. Every figure is computed from
          SINGERS, so the visible answer and the marked-up answer cannot
          disagree — which is the condition Google states for FAQ markup and
          the thing an answer engine checks before quoting you. */}
      <section className="mt-12" id="faq">
        <h2 className="text-xl">Common questions about vocal range</h2>
        <div className="mt-4 max-w-2xl space-y-5">
          {faq.map((f) => (
            <div key={f.q}>
              <h3 className="text-sm">{f.q}</h3>
              <p className="mt-1 text-sm text-mut">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section data-singer-return="method" className="mt-12" id="method">
        <h2 className="text-xl">How these ranges are sourced</h2>
        <p className="mt-3 max-w-2xl text-sm text-mut">{SINGER_RANGE_DISCLAIMER}</p>
        <Link
          href="/singers/methodology"
          className="mt-3 inline-block text-sm text-violet-ink underline underline-offset-4"
        >
          Read the source and review methodology
        </Link>
      </section>
    </PageShell>
  );
}
