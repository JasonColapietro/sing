import type { Metadata } from "next";
import Link from "next/link";
import { midiToLabel } from "@/lib/audio/notes";
import { SINGERS, rangeLabel, spanOctaves, type Singer } from "@/lib/singers";
import { SITE_URL } from "@/lib/site";
import { Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";

const TITLE = "Who Has the Widest Vocal Range? The Extremes, Ranked";
const DESCRIPTION = `The widest cited vocal ranges, deepest low notes and highest high notes among famous singers — ranked, with the caveats that belong on figures like these.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/singers/records` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
};

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
                {s.voiceType} · {rangeLabel(s)}
              </span>
            </span>
            <span className="tabular shrink-0 font-mono text-sm text-amber-ink">
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
  const belters = SINGERS.filter((s) => s.beltMidi != null)
    .sort((a, b) => b.beltMidi! - a.beltMidi!)
    .slice(0, 15);
  const whistlers = SINGERS.filter((s) => s.whistle);

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
      a: `No figure like this is lab-verified, so "in the world" claims are really "in circulation" claims. Among the ${SINGERS.length} famous voices indexed here, the widest commonly cited range is ${w.name}'s ${rangeLabel(w)} — about ${spanOctaves(span(w))} octaves. Spans that wide run from growled subharmonics to whistle register, not one continuous singing voice.`,
    },
    {
      q: "What is the highest note ever sung?",
      a: `Claims vary and the extremes are one-off recorded moments rather than repeatable notes. The highest note cited in this collection is ${midiToLabel(hi.highMidi)}, for ${hi.name} — whistle register, a different mechanism from the voice doing the work an octave down.`,
    },
    {
      q: "What is the lowest note ever sung?",
      a: `The lowest note cited in this collection is ${midiToLabel(lo.lowMidi)}, for ${lo.name}. Notes this low carry almost no acoustic power, so cited floors depend on a microphone doing much of the work — the deeper the claim, the more that caveat applies.`,
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
          name: "Widest cited vocal ranges",
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
      title="The record holders"
      subtitle="The widest spans, deepest floors and highest ceilings among famous voices — and why these particular numbers deserve the most scepticism."
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
        <Card className="border-amber/40">
          <h2 className="text-xl">Read these with the most caution</h2>
          <p className="mt-3 max-w-3xl text-mut">
            Record figures are the least reliable entries in any range
            collection, and for a structural reason: a number only becomes a
            record by being the most extreme claim in circulation, so the
            selection process actively favours whichever source exaggerated
            most. The rankings below are the figures fans and journalists
            repeat, not measurements.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-mut">
            The two specific things to distrust: a span this wide usually splits
            across registers a listener would not call the same voice — a
            six-octave figure typically runs from a growled subharmonic to a
            whistle — and the extreme note is often a single recorded moment,
            sometimes one produced with studio help, rather than anything the
            singer performs nightly.
          </p>
        </Card>

        <Card>
          <SectionLabel>Widest cited span</SectionLabel>
          <p className="mt-3 max-w-3xl text-sm text-mut">
            Measured from the lowest cited note to the highest, regardless of
            register. This is the number people mean by &ldquo;who has the
            widest vocal range&rdquo;, and the one that rewards the most
            generous source.
          </p>
          <Table
            rows={widest}
            value={(s) => `${spanOctaves(span(s))} oct`}
          />
        </Card>

        <Card>
          <SectionLabel>Deepest cited floor</SectionLabel>
          <p className="mt-3 max-w-3xl text-sm text-mut">
            Very low notes are easier to claim than to use: below roughly F2 the
            voice loses volume fast, so many cited floors are audible only in
            isolation or with a microphone doing much of the work.
          </p>
          <Table
            rows={lowest}
            value={(s) => midiToLabel(s.lowMidi)}
          />
        </Card>

        <Card>
          <SectionLabel>Highest cited ceiling</SectionLabel>
          <p className="mt-3 max-w-3xl text-sm text-mut">
            Nearly everything at the top of this list is whistle register or
            developed falsetto rather than full voice — a different mechanism
            from the one doing the work lower down.
          </p>
          <Table
            rows={highest}
            value={(s) => midiToLabel(s.highMidi)}
          />
        </Card>

        <Card>
          <SectionLabel>Highest full voice</SectionLabel>
          <p className="mt-3 max-w-3xl text-sm text-mut">
            The more meaningful ranking for most singers: the top of the belted,
            chest-dominant register rather than the top of the whole range.
            Restricted to the voices here with a cited full-voice ceiling.
          </p>
          <Table
            rows={belters}
            value={(s) => midiToLabel(s.beltMidi!)}
          />
        </Card>

        <Card>
          <SectionLabel>Whistle register</SectionLabel>
          <p className="mt-3 max-w-3xl text-sm text-mut">
            The singers here are documented using whistle register — a separate
            mechanism above the head voice, and the reason the top of this
            library reaches as far as it does.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {whistlers
              .sort((a, b) => b.highMidi - a.highMidi)
              .map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/singers/${s.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm transition-colors hover:border-amber"
                  >
                    {s.name}
                    <span className="tabular font-mono text-[10px] text-amber-ink">
                      {midiToLabel(s.highMidi)}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
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
          <SectionLabel>Where you fit</SectionLabel>
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
