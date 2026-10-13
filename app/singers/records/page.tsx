import type { Metadata } from "next";
import Link from "next/link";
import { withCanonicalOpenGraph } from "@/lib/og";
import { midiToLabel } from "@/lib/audio/notes";
import {
  SINGERS,
  joinNames,
  rangeLabel,
  recordHolders,
  spanOctaves,
  type Singer,
} from "@/lib/singers";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { SITE_URL, rangeTestHref } from "@/lib/site";
import { Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";
import { routeKeywords } from "@/lib/keywords";

const TITLE = "Who Has the Widest Vocal Range? Reported Catalog Rankings";
const DESCRIPTION = `Who has the widest vocal range? Compare the widest reported spans and the lowest and highest catalog endpoints. Individual records require source review.`;

export const metadata: Metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/singers/records"),
  // Absolute, like the other singer hubs: with the " · Suede Sing" suffix the
  // fitter cut this to "Who Has the Widest Vocal Range? Reported".
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/singers/records` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
});

const span = (s: Singer) => s.highMidi - s.lowMidi;

/**
 * Competition ranking ("1, 1, 3"): one plus the number of profiles strictly
 * ahead. Equal values share a rank, as they do on each singer's own page
 * (lib/singer-catalog-position.ts), so a tie never reads as a second place.
 */
function rankBy(score: (s: Singer) => number) {
  return (s: Singer) => SINGERS.filter((o) => score(o) > score(s)).length + 1;
}
const lowScore = (s: Singer) => -s.lowMidi;
const highScore = (s: Singer) => s.highMidi;
const spanRank = rankBy(span);
const lowRank = rankBy(lowScore);
const highRank = rankBy(highScore);

/** Rows per table, before ties at the cut-off are added. */
const TABLE_ROWS = 15;

/**
 * The top TABLE_ROWS profiles by `score`, plus every profile tied with the
 * last of them. A hard cut at 15 kept whichever tied name sorted first and
 * dropped the rest, the same alphabetical accident the shared ranks fix.
 */
function topWithTies(score: (s: Singer) => number): Singer[] {
  const sorted = [...SINGERS].sort((a, b) => score(b) - score(a));
  const cut = score(sorted[Math.min(TABLE_ROWS, sorted.length) - 1]);
  return sorted.filter((s, i) => i < TABLE_ROWS || score(s) === cut);
}

function Table({
  rows,
  rank,
  value,
}: {
  rows: Singer[];
  rank: (s: Singer) => number;
  value: (s: Singer) => string;
}) {
  return (
    <ol className="mt-4 divide-y divide-line/50">
      {rows.map((s) => (
        <li key={s.slug}>
          {/* prefetch off: some 45 rows, mostly pending profiles nobody is about
              to open, would otherwise each fetch a page payload on scroll. */}
          <Link
            href={`/singers/${s.slug}`}
            prefetch={false}
            className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-baseline gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-panel"
          >
            <span className="tabular font-mono text-xs text-dim">{rank(s)}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {s.name}
              </span>
              {/* Wraps rather than truncates, range first: at phone widths the
                  truncated line cut the reported range off every row, so a
                  "6.0 oct" record showed no notes at all. */}
              <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-mut">
                Reported {rangeLabel(s)} · catalog label: {s.voiceType}
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
  const widest = topWithTies(span);
  const lowest = topWithTies(lowScore);
  const highest = topWithTies(highScore);

  // The absolute phrasings people actually type — "ever", "in the world",
  // "biggest" — answered from the same computed rankings the tables render,
  // with the hedge these numbers deserve stated inside the answer rather than
  // near it. One array feeds the visible section and the FAQPage markup.
  // Each answer names every profile tied for the record: naming only the
  // first would crown whoever sorts first alphabetically.
  const holders = recordHolders(SINGERS);
  const w = holders.widest[0];
  const hi = holders.highest[0];
  const lo = holders.lowest[0];
  const withRange = (s: Singer) => `${s.name} (${rangeLabel(s)})`;
  const names = (list: Singer[]) => joinNames(list.map((s) => s.name));
  const widestClause =
    holders.widest.length === 1
      ? `${w.name} has the widest reported span: ${rangeLabel(w)}, about ${spanOctaves(span(w))} octaves`
      : `${joinNames(holders.widest.map(withRange))} share the widest reported span, ${span(w)} semitones or about ${spanOctaves(span(w))} octaves`;
  const faq = [
    {
      q: "Who has the biggest vocal range in the world?",
      a: `This catalog cannot establish a world record. Among its ${SINGERS.length} profiles, ${
        holders.widest.length === 1
          ? `the largest reported span is ${w.name}'s ${rangeLabel(w)}`
          : `the largest reported span is shared by ${joinNames(holders.widest.map(withRange))}`
      } — about ${spanOctaves(span(w))} octaves. Individual endpoint evidence must be checked before treating that as a verified performance.`,
    },
    {
      q: "What is the highest note ever sung?",
      a: `This catalog does not establish the highest note ever sung. Its highest listed endpoint is ${midiToLabel(hi.highMidi)}, listed for ${names(holders.highest)}; check ${holders.highest.length === 1 ? "that profile's" : "each profile's"} evidence status before repeating the note as a verified performance.`,
    },
    {
      q: "What is the lowest note ever sung?",
      a: `This catalog does not establish the lowest note ever sung. Its lowest listed endpoint is ${midiToLabel(lo.lowMidi)}, listed for ${names(holders.lowest)}; individual source review is needed to verify the performance and note.`,
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
        isPartOf: { "@id": `${SITE_URL}/#website` },
        publisher: ORG_PUBLISHER_NODE,
        mainEntity: {
          "@type": "ItemList",
          name: "Largest reported catalog spans",
          numberOfItems: widest.length,
          itemListOrder: "https://schema.org/ItemListOrderDescending",
          // Tied spans share a position, matching the visible table.
          itemListElement: widest.map((s) => ({
            "@type": "ListItem",
            position: spanRank(s),
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
      title="Who has the widest vocal range? Reported catalog extremes"
      subtitle={`Among ${SINGERS.length} catalog profiles, ${widestClause}. The rankings below list the largest spans and the lowest and highest endpoints, with their evidence limits in view; none is a verified world record.`}
      actions={
        // Own wrapping row: two md buttons are wider than a 320px phone.
        <div className="flex flex-wrap items-center gap-2">
          <LinkButton href={rangeTestHref()} size="md">
            Find my vocal range →
          </LinkButton>
          <LinkButton href="/singers" variant="outline" size="md">
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
            rank={spanRank}
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
            rank={lowRank}
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
            rank={highRank}
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
            <LinkButton href={rangeTestHref()} size="sm">
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
