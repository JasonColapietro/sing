import type { Metadata } from "next";
import Link from "next/link";
import { SingersDirectory } from "@/components/singers/directory";
import { SingerCrawlIndex } from "@/components/singers/crawl-index";
import { LinkButton, PageShell } from "@/components/ui";
import {
  HUB_GENRES,
  SINGERS,
  VOICE_KINDS,
  computeRecords,
  genreSlug,
  rangeLabel,
  spanOctaves,
  voiceTypeSlug,
} from "@/lib/singers";
import { SINGER_RANGE_DISCLAIMER } from "@/lib/singer-editorial";
import { SITE_URL } from "@/lib/site";

const DESCRIPTION = `The vocal ranges of famous singers on one keyboard — whistle notes to the deepest basses. Overlay your own range free.`;

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
  const r = computeRecords();
  const total = SINGERS.length;
  return [
    {
      q: "Who has the widest vocal range?",
      a: `Of the ${total} singers indexed here, ${r.widest.name} has the widest commonly cited range: ${rangeLabel(r.widest)}, about ${spanOctaves(r.widest.highMidi - r.widest.lowMidi)} octaves.`,
    },
    {
      q: "What is the lowest note sung by a famous singer?",
      a: `The lowest note in this index is ${r.lowest.name}'s ${rangeLabel(r.lowest).split("–")[0]}. ${r.lowest.name} is cited at ${rangeLabel(r.lowest)}.`,
    },
    {
      q: "What is the highest note sung by a famous singer?",
      a: `The highest note in this index is ${r.highest.name}'s ${rangeLabel(r.highest).split("–")[1]}. ${r.highest.name} is cited at ${rangeLabel(r.highest)}.`,
    },
    {
      q: "What does a singer's “cited range” actually mean?",
      a: SINGER_RANGE_DISCLAIMER,
    },
    {
      q: "How do I find my own vocal range?",
      a: "Sing your lowest comfortable note, then your highest, into your microphone. Suede Sing's free range test detects both and marks them on the same keyboard as every singer in this index, so you can overlay yours against theirs.",
    },
  ];
}

export const metadata: Metadata = {
  title: "Famous Singers' Vocal Ranges",
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/singers` },
  openGraph: {
    title: `Famous Singers' Vocal Ranges — every voice on one keyboard`,
    description: DESCRIPTION,
    type: "website",
    url: `${SITE_URL}/singers`,
  },
};

export default function SingersPage() {
  const faq = buildFaq();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
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
      title="Famous vocal ranges"
      subtitle="The commonly cited ranges of famous singers, every one on the same keyboard."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SingersDirectory />
      <SingerCrawlIndex />

      {/* Hubs: the filters above are client state and invisible to a crawler,
          so the same cuts exist as real pages — and they carry content the
          directory can't (what a voice type is, how a genre distributes). */}
      <section className="mt-12">
        <h2 className="text-xl">Browse by voice type</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {VOICE_KINDS.map((v) => (
            <li key={v}>
              <Link
                href={`/singers/voice-type/${voiceTypeSlug(v)}`}
                className="flex items-baseline justify-between gap-3 rounded-xl border border-line bg-panel px-4 py-3 transition-colors hover:border-violet"
              >
                <span className="text-sm font-medium">{v}</span>
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="mt-8 text-xl">Browse by genre</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {HUB_GENRES.map((g) => (
            <li key={g}>
              <Link
                href={`/singers/genre/${genreSlug(g)}`}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-sm transition-colors hover:border-violet"
              >
                {g}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <LinkButton href="/singers/records" variant="outline" size="sm">
            The widest, lowest and highest, ranked →
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
              <h3 className="text-sm font-medium">{f.q}</h3>
              <p className="mt-1 text-sm text-mut">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12" id="method">
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
