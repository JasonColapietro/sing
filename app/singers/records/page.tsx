import type { Metadata } from "next";
import Link from "next/link";
import { withCanonicalOpenGraph } from "@/lib/og";
import { midiToLabel } from "@/lib/audio/notes";
import { SINGERS, rangeLabel, spanOctaves, type Singer } from "@/lib/singers";
import { SITE_URL } from "@/lib/site";
import { Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";

const TITLE = "Who Has the Widest Vocal Range? Reported Catalog Rankings";
const DESCRIPTION = `Compare the widest reported spans and lowest and highest catalog endpoints. Individual records require source review.`;

export const metadata: Metadata = withCanonicalOpenGraph({
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/singers/records` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
});

const span = (s: Singer) => s.highMidi - s.lowMidi;

function Table({
  rows,
  value,
}: {
  rows: Singer[];
  value: (s: Singer) => string;
}) {
  return (
    <ol className="mt-4 divide-y divide-line/50">
      {rows.map((s, i) => (
        <li key={s.slug}>
          <Link
            href={`/singers/${s.slug}`}
            className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-baseline gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-panel"
          >
            <span className="tabular font-mono text-xs text-dim">{i + 1}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {s.name}
              </span>
              <span className="block truncate font-mono text-[10px] uppercase tracking-[0.1em] text-mut">
                Catalog label: {s.voiceType} · reported {rangeLabel(s)}
              </span>
            </span>
            <span className="tabular shrink-0 font-mono text-sm text-violet-ink">
              {value(s)}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export default function RecordsPage() {
  const widest = [...SINGERS].sort((a, b) => span(b) - span(a)).slice(0, 15);
  const lowest = [...SINGERS].sort((a, b) => a.lowMidi - b.lowMidi).slice(0, 15);
  const highest = [...SINGERS]
    .sort((a, b) => b.highMidi - a.highMidi)
    .slice(0, 15);

  // The absolute phrasings people actually type — "ever", "in the world",
  // "biggest" — answered from the same computed rankings the tables render,
  // with the hedge these numbers deserve stated inside the answer rather than
  // near it. One array feeds the visible section and the FAQPage markup.
  const w = widest[0];
  const hi = highest[0];
  const lo = lowest[0];
  const faq = [
    {
      q: "Who has the biggest vocal range in the world?",
      a: `This catalog cannot establish a world record. Among its ${SINGERS.length} profiles, the largest reported span is ${w.name}'s ${rangeLabel(w)} — about ${spanOctaves(span(w))} octaves. Individual endpoint evidence must be checked before treating that as a verified performance.`,
    },
    {
      q: "What is the highest note ever sung?",
      a: `This catalog does not establish the highest note ever sung. Its highest listed endpoint is ${midiToLabel(hi.highMidi)} for ${hi.name}; check that profile's evidence status before repeating the note as a verified performance.`,
    },
    {
      q: "What is the lowest note ever sung?",
      a: `This catalog does not establish the lowest note ever sung. Its lowest listed endpoint is ${midiToLabel(lo.lowMidi)} for ${lo.name}; individual source review is needed to verify the performance and note.`,
    },
  ];

  const pageUrl = `${SITE_URL}/singers/records`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#collection`,
        name: TITLE,
        url: pageUrl,
        description: DESCRIPTION,
        isPartOf: { "@type": "WebSite", name: "Suede Sing", url: SITE_URL },
        mainEntity: {
          "@type": "ItemList",
          name: "Largest reported catalog spans",
          numberOfItems: widest.length,
          itemListOrder: "https://schema.org/ItemListOrderDescending",
          itemListElement: widest.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}/singers/${s.slug}`,
            name: `${s.name} — ${spanOctaves(span(s))} octaves`,
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
      kicker="Extremes"
      title="Reported range extremes"
      subtitle="The largest catalog spans and note endpoints, ranked with their evidence limits in view."
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
        <Card className="border-violet/40">
          <h2 className="text-xl">Read these with the most caution</h2>
          <p className="mt-3 max-w-3xl text-mut">
            These rankings compare catalog values. Many profiles still await
            individual endpoint review, so a position here is not a verified
            performance record or a physiological limit.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-mut">
            Open an artist profile for its source status and scope. A written
            song arrangement, a single recording, and a repeatable working
            range answer different questions.
          </p>
        </Card>

        <Card>
          <h2>
            <SectionLabel>Largest reported catalog span</SectionLabel>
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-mut">
            Calculated from each profile&apos;s listed endpoints. It does not
            verify that both notes were sung in the same performance or register.
          </p>
          <Table
            rows={widest}
            value={(s) => `${spanOctaves(span(s))} oct`}
          />
        </Card>

        <Card>
          <h2>
            <SectionLabel>Lowest listed endpoint</SectionLabel>
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-mut">
            The source and recording for a low endpoint need individual review
            before it can be described as a singer&apos;s lowest note.
          </p>
          <Table
            rows={lowest}
            value={(s) => midiToLabel(s.lowMidi)}
          />
        </Card>

        <Card>
          <h2>
            <SectionLabel>Highest listed endpoint</SectionLabel>
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-mut">
            The source, performance, and register for a high endpoint need
            individual review before it can be described as a singer&apos;s
            highest note.
          </p>
          <Table
            rows={highest}
            value={(s) => midiToLabel(s.highMidi)}
          />
        </Card>

        {/* The absolute questions, in the words people search — same array as
            the FAQPage markup above. */}
        <Card>
          <h2 className="text-xl">The questions these tables get asked</h2>
          <div className="mt-4 max-w-3xl space-y-5">
            {faq.map((f) => (
              <div key={f.q}>
                <h3 className="text-sm font-semibold">{f.q}</h3>
                <p className="mt-1 text-sm text-mut">{f.a}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2>
            <SectionLabel>Where you fit</SectionLabel>
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-mut">
            None of these numbers is a target. The useful comparison is your own
            measured range against singers whose repertoire you actually want to
            sing — which the range test and the main chart do together.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <LinkButton href="/range" size="sm">
              Find my range
            </LinkButton>
            <LinkButton href="/singers" variant="outline" size="sm">
              The full chart
            </LinkButton>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
