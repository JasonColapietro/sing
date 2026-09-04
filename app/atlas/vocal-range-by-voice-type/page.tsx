import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/og";
import Link from "next/link";
import { midiToLabel } from "@/lib/audio/notes";
import {
  SINGERS,
  VOICE_KINDS,
  pluralVoice,
  rangeLabel,
  singersByVoiceType,
  voiceTypeSlug,
  type VoiceKind,
} from "@/lib/singers";
import { REFERENCE_BANDS, representativeSingers } from "@/lib/singers-analysis";
import { VOICE_TYPE_NOTES, VOICE_TYPE_PASSAGGIO } from "@/lib/voice-types";
import { ORG_ID } from "@/lib/organization";
import { SITE_URL } from "@/lib/site";
import { Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";

/**
 * "What's a tenor's range?" — the question the site had no page for.
 *
 * The atlas chapter on voice types deliberately refuses to print this table.
 * That refusal is correct *as a chapter*: its argument is that range and type
 * are different measurements, and opening with a tidy grid of numbers would
 * undercut the argument before making it. But a reader who types the question
 * into a search bar is not refusing to be told — they are going to get an
 * answer from somewhere, and the somewhere that answers it is the page that
 * gets cited. Declining to answer does not make the number go away; it makes
 * the number come from a source that omits the caveat.
 *
 * So this page answers first and hedges immediately, rather than hedging first
 * and never answering. Every figure is already in the codebase — the bands are
 * REFERENCE_BANDS, the examples are computed from the library — so the page
 * cannot drift from the pages it links to.
 */

const QUESTION_TITLE =
  "Vocal Range by Voice Type: Tenor, Soprano, Bass and the Rest";

const DESCRIPTION =
  "What is a tenor's vocal range? A bass's, a mezzo-soprano's? The conventional two-octave band for all eight voice types, the passaggio zone where each one changes gear, and real singers who sit inside each band — with the caveat that range and voice type are different measurements.";

export const metadata: Metadata = {
  title: { absolute: QUESTION_TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/atlas/vocal-range-by-voice-type` },
  openGraph: {
    title: QUESTION_TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/atlas/vocal-range-by-voice-type`,
    siteName: "Suede Sing",
    type: "article",
    locale: "en_US",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: QUESTION_TITLE,
    description: DESCRIPTION,
  },
};

/* ------------------------------------------------------------------ rows --- */

/** Example singers shown per row. */
const EXAMPLE_COUNT = 3;

interface Row {
  voice: VoiceKind;
  lower: string;
  slug: string;
  /** "E2–E4" for the conventional band. */
  band: string;
  /** "G3–C4" for the transition zone. */
  passaggio: string;
  caveat?: string;
  examples: ReturnType<typeof representativeSingers>;
  /** How many of this type the singer library actually holds. */
  count: number;
}

/** Row lookup by category, so prose never depends on VOICE_KINDS' ordering. */
function row(voice: VoiceKind): Row {
  const found = ROWS.find((r) => r.voice === voice);
  if (!found) throw new Error(`no row for voice type ${voice}`);
  return found;
}

const ROWS: Row[] = VOICE_KINDS.map((voice) => {
  const band = REFERENCE_BANDS[voice];
  const p = VOICE_TYPE_PASSAGGIO[voice];
  return {
    voice,
    lower: voice.toLowerCase(),
    slug: voiceTypeSlug(voice),
    band: `${midiToLabel(band.low)}–${midiToLabel(band.high)}`,
    passaggio: `${midiToLabel(p.low)}–${midiToLabel(p.high)}`,
    caveat: p.caveat,
    examples: representativeSingers(voice, EXAMPLE_COUNT),
    count: singersByVoiceType(voice).length,
  };
});

/**
 * Categories too small for "closest to the band" to be a selection at all.
 *
 * With three basses in the library, picking the three closest to the band
 * returns all three, and the footnote's claim that they are illustrative
 * rather than exceptional would be doing no work. Derived, not listed, so it
 * corrects itself when the library grows.
 */
const SMALL_CATEGORIES = ROWS.filter((r) => r.count <= EXAMPLE_COUNT);

/* ------------------------------------------------------------------- faq --- */

/**
 * One entry per voice type, phrased as the query it answers.
 *
 * Written to stand alone, because an AI Overview or a chat answer quotes a
 * single one of these with none of the page around it — so each answer repeats
 * the category, the number, and the caveat rather than relying on the row
 * above it. Generated from the same data the table renders, so the answer a
 * model quotes and the answer a reader sees cannot disagree.
 */
interface Faq {
  q: string;
  a: string;
}

function typeAnswer(row: Row): string {
  const note = VOICE_TYPE_NOTES[row.voice];
  const group = singersByVoiceType(row.voice);
  const lows = group.map((s) => s.lowMidi);
  const highs = group.map((s) => s.highMidi);
  const observed = `${midiToLabel(Math.min(...lows))} to ${midiToLabel(Math.max(...highs))}`;
  const plural = pluralVoice(row.lower);

  return [
    `A ${row.lower} is ${note.summary}.`,
    `The conventional ${row.lower} range is ${row.band} — two octaves, the span these categories are traditionally defined across.`,
    row.caveat
      ? `${row.caveat} It is usually placed around ${row.passaggio}.`
      : `The passaggio, where the voice changes gear between registers, usually falls around ${row.passaggio}.`,
    `Range and voice type are different measurements, though: the type describes where a voice sits comfortably, not the furthest notes it can reach. The ${row.count} ${plural} in Suede Sing's library of ${SINGERS.length} singers carry cited ranges running ${observed}, well outside the conventional band at both ends.`,
  ].join(" ");
}

const FAQ: Faq[] = [
  ...ROWS.map((row) => ({
    q: `What is a ${row.lower}'s vocal range?`,
    a: typeAnswer(row),
  })),
  {
    q: "What is the difference between vocal range and voice type?",
    a: "They are two different measurements and neither one implies the other. Vocal range is the distance between the lowest and highest notes a singer can produce at all — a pair of extremes, often one-off moments on a record. Voice type is a judgment about tessitura: the band of pitches where the voice sits comfortably for a long time, together with its timbre and weight. A soprano with a practiced low extension can show a lower floor than a contralto who never records down there, and neither label is wrong. This is why a range test tells you your range but can only estimate your type.",
  },
  {
    q: "How do I find out my own voice type?",
    a: "Sing from your lowest comfortable note to your highest and back, and note where the voice is easy rather than where it stops. Suede Sing's free browser range test at https://sing.suedeai.ai/range does this in about sixty seconds and reports your lowest note, your highest note, your span in semitones, and the voice type that range best fits. Treat the type as a starting shelf, not a verdict: voices reclassify with training, with age, and with repertoire, and plenty of working tenors spent their first years labelled baritone.",
  },
  {
    q: "What is a passaggio?",
    // The only FAQ answer that names pitches outside a row, so it is the
    // one that can drift from the table. Built from the same constant the
    // table renders: the hand-typed version of this sentence outlived a
    // correction to the figures once already.
    a: `The passaggio is the pitch zone where a singing voice changes gear between registers — it runs from where the voice has to start shedding weight up to where chest voice stops working the way it did and a lighter production has to take over. It is a few notes wide rather than a single note, and it is felt as a break, a wobble, or a sudden need to push. Each voice type has its own zone: roughly ${row("Bass").passaggio} for a bass, ${row("Baritone").passaggio} for a baritone, ${row("Tenor").passaggio} for a tenor, ${row("Mezzo-soprano").passaggio} for a mezzo-soprano, and ${row("Soprano").passaggio} for a soprano. Most of the difficulty in a song lives at or just under the singer's passaggio, which is why two singers with identical ranges can find completely different songs hard.`,
  },
];

/* ----------------------------------------------------------------- graph --- */

const PAGE_URL = `${SITE_URL}/atlas/vocal-range-by-voice-type`;

/**
 * Entities are referenced by `@id`, never redeclared.
 *
 * suedeai.ai is the authoritative home of the Organization and the founder
 * Person, and the site homepage declares the WebSite. Restating those nodes
 * here with a subset of their properties would publish a second, thinner
 * description of the same `@id` and give a consumer two things to reconcile.
 * A bare `@id` reference is the whole point of the identifier: it adds this
 * page to an entity that already exists rather than forking it.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${PAGE_URL}#webpage`,
      url: PAGE_URL,
      name: QUESTION_TITLE,
      description: DESCRIPTION,
      inLanguage: "en",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      publisher: { "@id": ORG_ID },
      author: { "@id": "https://suedeai.ai/founder#person" },
      about: ROWS.map((r) => ({
        "@type": "Thing",
        name: r.voice,
        url: `${SITE_URL}/singers/voice-type/${r.slug}`,
      })),
      mainEntity: { "@id": `${PAGE_URL}#faq` },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "The Voice Atlas",
            item: `${SITE_URL}/atlas`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Vocal range by voice type",
            item: PAGE_URL,
          },
        ],
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${PAGE_URL}#faq`,
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

/* ------------------------------------------------------------------ page --- */

export default function VocalRangeByVoiceTypePage() {
  return (
    <PageShell
      kicker="Reference · free"
      title="What is a tenor's vocal range? Every voice type, bass to soprano"
      subtitle="The conventional band for each of the eight voice types, the passaggio zone where each one changes gear, and singers whose cited ranges actually sit there."
      actions={
        <LinkButton href="/range" size="md">
          Test your own range
        </LinkButton>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-6">
        <Card>
          <h2 className="text-xl">The short answer</h2>
          <p className="mt-3 max-w-3xl text-mut">
            A tenor&rsquo;s conventional range is {row("Tenor").band}; a
            soprano&rsquo;s is {row("Soprano").band}; a bass&rsquo;s is {row("Bass").band}.
            Each of the eight traditional categories is defined across two
            octaves, and the table below gives all eight along with the{" "}
            <em>passaggio</em> — the zone where that voice changes gear between
            registers, which predicts what a singer finds hard far better than
            the extremes do.
          </p>
          <p className="mt-3 max-w-3xl text-mut">
            Read those numbers as a description of where a voice{" "}
            <em>lives</em>, not a fence around what it can reach. Range and
            voice type are different measurements: the type tracks the band
            where a voice works comfortably for hours, while the range tracks
            the furthest it has ever been photographed. A soprano with a
            practiced low extension can show a floor below a contralto who never
            records down there, and the{" "}
            <Link
              href="/singers"
              className="text-violet-ink underline decoration-violet/40 underline-offset-2"
            >
              library of {SINGERS.length} cited singers
            </Link>{" "}
            behind this page is full of exactly that pattern. The categories are
            a starting shelf, not a verdict — and in popular music, sung into a
            microphone, they are looser still.
          </p>
        </Card>

        <Card>
          <SectionLabel>All eight voice types</SectionLabel>
          {/* A real table: this is tabular data, a crawler and a screen reader
              both need the row/column relationships, and an answer engine
              lifting one row needs the header association to keep the number
              attached to the right category. Horizontal scroll is on the
              wrapper so the page body never scrolls sideways on a phone. */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Conventional vocal range and passaggio zone for the eight
                traditional voice types, with example singers from the Suede
                Sing library.
              </caption>
              <thead>
                <tr className="border-b border-line">
                  <th
                    scope="col"
                    className="py-3 pr-4 font-mono text-[11px] uppercase tracking-[0.12em] text-dim"
                  >
                    Voice type
                  </th>
                  <th
                    scope="col"
                    className="py-3 pr-4 font-mono text-[11px] uppercase tracking-[0.12em] text-dim"
                  >
                    Typical range
                  </th>
                  <th
                    scope="col"
                    className="py-3 pr-4 font-mono text-[11px] uppercase tracking-[0.12em] text-dim"
                  >
                    Passaggio zone
                  </th>
                  <th
                    scope="col"
                    className="py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-dim"
                  >
                    Example singers
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/50">
                {ROWS.map((row) => (
                  <tr key={row.voice} className="align-baseline">
                    <th scope="row" className="py-3 pr-4 font-medium text-ink">
                      <Link
                        href={`/singers/voice-type/${row.slug}`}
                        className="hover:text-violet-ink hover:underline"
                      >
                        {row.voice}
                      </Link>
                    </th>
                    <td className="tabular py-3 pr-4 font-mono text-mut">
                      {row.band}
                    </td>
                    <td className="tabular py-3 pr-4 font-mono text-mut">
                      {row.passaggio}
                      {row.caveat && (
                        <span className="ml-1 text-dim" aria-hidden="true">
                          *
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-mut">
                      {row.examples.map((s, i) => (
                        <span key={s.slug}>
                          {i > 0 && ", "}
                          <Link
                            href={`/singers/${s.slug}`}
                            className="text-violet-ink underline decoration-violet/40 underline-offset-2"
                          >
                            {s.name}
                          </Link>{" "}
                          <span className="tabular font-mono text-[11px] text-dim">
                            {rangeLabel(s)}
                          </span>
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-5 max-w-3xl text-xs text-dim">
            Example singers are not the most famous of each category — they are
            the three whose cited ranges sit closest to the conventional band,
            which is what makes them illustrative rather than exceptional. Their
            figures are commonly cited approximations compiled from recordings
            and public discussion, not lab measurements.
            {SMALL_CATEGORIES.length > 0 && (
              <>
                {" "}
                For{" "}
                {SMALL_CATEGORIES.map((r, i) => (
                  <span key={r.voice}>
                    {i > 0 &&
                      (i === SMALL_CATEGORIES.length - 1 ? " and " : ", ")}
                    {pluralVoice(r.lower)}
                  </span>
                ))}{" "}
                the library holds {EXAMPLE_COUNT} voices or fewer, so those rows
                are the whole population rather than a selection from it — true
                to the record, in which these categories really are that rare,
                but not a claim that the singers named are typical.
              </>
            )}
            {ROWS.some((r) => r.caveat) && (
              <>
                {" "}
                <span aria-hidden="true">*</span>{" "}
                {ROWS.find((r) => r.caveat)?.caveat}
              </>
            )}
          </p>
        </Card>

        <Card>
          <SectionLabel>Questions</SectionLabel>
          <h2 className="mt-3 text-xl">Every voice type, one at a time</h2>
          <dl className="mt-5 max-w-3xl space-y-6">
            {FAQ.map((f) => (
              <div key={f.q}>
                <dt className="font-medium text-ink">{f.q}</dt>
                <dd className="mt-1.5 text-sm text-mut">{f.a}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <SectionLabel>Keep reading</SectionLabel>
          <ul className="mt-4 max-w-3xl space-y-2 text-sm text-mut">
            <li>
              <Link
                href="/atlas/voice-types-in-the-wild"
                className="text-violet-ink hover:underline"
              >
                Voice types in the wild
              </Link>{" "}
              — the atlas chapter behind this page: why a pop mezzo and an opera
              mezzo are different claims, and how to guess your own type without
              a teacher. Free.
            </li>
            <li>
              <Link href="/range" className="text-violet-ink hover:underline">
                The free range test
              </Link>{" "}
              — sixty seconds in the browser gives you your own two numbers to
              read this table with.
            </li>
            <li>
              <Link href="/singers" className="text-violet-ink hover:underline">
                All {SINGERS.length} singers
              </Link>{" "}
              — or jump to{" "}
              {ROWS.map((row, i) => (
                <span key={row.voice}>
                  {i > 0 && (i === ROWS.length - 1 ? " and " : ", ")}
                  <Link
                    href={`/singers/voice-type/${row.slug}`}
                    className="text-violet-ink hover:underline"
                  >
                    {pluralVoice(row.lower)}
                  </Link>
                </span>
              ))}
              .
            </li>
            <li>
              <Link href="/glossary" className="text-violet-ink hover:underline">
                The glossary
              </Link>{" "}
              — passaggio, tessitura, fach, belt and the rest, defined.
            </li>
          </ul>
        </Card>

        <p className="max-w-3xl text-xs text-dim">
          Voice categories are guides borrowed from choral and operatic
          practice, not boxes, and plenty of singers are filed differently by
          different sources. Nothing here is medical advice — a voice that
          hurts, stays hoarse, or loses easy notes is a question for a doctor or
          a speech-language pathologist, not a practice plan.
        </p>
      </div>
    </PageShell>
  );
}
