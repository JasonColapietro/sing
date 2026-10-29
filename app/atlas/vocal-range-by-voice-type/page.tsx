import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/og";
import Link from "next/link";
import { midiToLabel } from "@/lib/audio/notes";
import {
  SINGERS,
  VOICE_KINDS,
  joinNames,
  pluralVoice,
  rangeLabel,
  singersByVoiceType,
  voiceTypeSlug,
  type VoiceKind,
} from "@/lib/singers";
import { REFERENCE_BANDS, representativeSingers } from "@/lib/singers-analysis";
import { getSingerReviewStatus } from "@/lib/singer-evidence";
import { VOICE_TYPE_NOTES, VOICE_TYPE_PASSAGGIO } from "@/lib/voice-types";
import { AUTHOR_NAME, AUTHOR_NODE } from "@/lib/author";
import { ORG_ID, ORG_PUBLISHER_NODE } from "@/lib/organization";
import { SITE_URL, rangeTestHref } from "@/lib/site";
import { SafetyLine } from "@/components/learn/safety-note";
import { Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";
import { routeKeywords } from "@/lib/keywords";

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
  "What is a tenor's vocal range? A bass's? The conventional band for all eight voice types, where each changes gear, and real singers in each.";

export const metadata: Metadata = {
  keywords: routeKeywords("/atlas/vocal-range-by-voice-type"),
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

/**
 * The singers closest to the conventional band, minus any whose catalog label
 * was disputed on individual review. A page that defines the categories must
 * not illustrate one with a singer this repo has found does not belong in it.
 * Ranks the whole category before filtering, so a disputed name near the top
 * never leaves a row short.
 */
function exampleSingers(voice: VoiceKind): Row["examples"] {
  return representativeSingers(voice, singersByVoiceType(voice).length)
    .filter((s) => getSingerReviewStatus(s.slug) !== "disputed")
    .slice(0, EXAMPLE_COUNT);
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
    examples: exampleSingers(voice),
    count: singersByVoiceType(voice).length,
  };
});

/**
 * Categories too small for "closest to the band" to be a selection at all:
 * picking the three closest returns every voice the library holds, so the
 * footnote says the row is the whole population. Derived, not listed, so it
 * corrects itself when the library grows.
 */
const SMALL_CATEGORIES = ROWS.filter((r) => r.count <= EXAMPLE_COUNT);

/** Low-end gap plus high-end gap, in semitones, past which an example is not close to its band. */
const MAX_EXAMPLE_DISTANCE = 6;

/**
 * Examples that are only the nearest the library has, so the footnote must not
 * let them pass as typical. Being among the closest is not the same as being
 * close: when this was written the third-closest of five basses was Avi
 * Kaplan, whose cited floor sits more than an octave under the band. The
 * footnote used to call every example "illustrative rather than exceptional",
 * which that row made false. Named per singer rather than per row, and
 * derived, so it clears itself as the library fills in.
 */
const STRETCHED_EXAMPLES = ROWS.flatMap((r) => {
  const band = REFERENCE_BANDS[r.voice];
  return r.examples
    .filter(
      (s) =>
        Math.abs(s.lowMidi - band.low) + Math.abs(s.highMidi - band.high) >
        MAX_EXAMPLE_DISTANCE,
    )
    .map((s) => `${s.name} (${r.lower}, ${rangeLabel(s)})`);
});

/* ------------------------------------------------------------------- faq --- */

/**
 * One entry per voice type, phrased as the query it answers.
 *
 * Each answer names its category and numbers, so one quoted alone still
 * answers its question; the caveat every row shares (range is not type) is
 * the section's lede, FAQ_LEDE, said once rather than eight times. Generated
 * from the same data the table renders, so the answer a model quotes and the
 * answer a reader sees cannot disagree.
 */
interface Faq {
  q: string;
  a: string;
}

/**
 * The female passaggio zones are the commercial belt-or-mix break, not the
 * first flip out of chest voice (see VOICE_TYPE_PASSAGGIO). A woman who does a
 * quiet slide will find that first flip several notes lower, so every answer
 * that prints a female zone names it too, with the same E4-G4 band book
 * chapter three gives.
 */
const CCM_ZONE_TYPES: ReadonlySet<VoiceKind> = new Set<VoiceKind>([
  "Contralto",
  "Mezzo-soprano",
  "Soprano",
]);
const EARLIER_SHIFT =
  "most women also meet an earlier, lighter shift out of chest voice somewhere around E4 to G4";

function typeAnswer(row: Row): string {
  const note = VOICE_TYPE_NOTES[row.voice];
  const group = singersByVoiceType(row.voice);
  const lows = group.map((s) => s.lowMidi);
  const highs = group.map((s) => s.highMidi);
  const observed = `${midiToLabel(Math.min(...lows))} to ${midiToLabel(Math.max(...highs))}`;
  const plural = pluralVoice(row.lower);

  return [
    `A ${row.lower} is ${note.summary}.`,
    `The conventional ${row.lower} range is ${row.band}: two octaves, the span these categories are traditionally defined across.`,
    row.caveat
      ? `${row.caveat} It is usually placed around ${row.passaggio}.`
      : `The passaggio, where the voice changes gear between registers, usually falls around ${row.passaggio}.`,
    ...(CCM_ZONE_TYPES.has(row.voice)
      ? [`That is the commercial-singing zone where a belt or mix changes gear; ${EARLIER_SHIFT}.`]
      : []),
    `The ${row.count} ${plural} in Suede Sing's library of ${SINGERS.length} singers carry cited ranges running ${observed}.`,
  ].join(" ");
}

/** The caveat every voice-type answer shares, stated once above them. */
const FAQ_LEDE =
  "Range and voice type are different measurements: a type describes where a voice sits comfortably, not the furthest notes it can reach, so the singers filed under each type carry cited ranges well outside its conventional band.";

const FAQ: Faq[] = [
  ...ROWS.map((row) => ({
    q: `What is a ${row.lower}'s vocal range?`,
    a: typeAnswer(row),
  })),
  {
    q: "What is the difference between vocal range and voice type?",
    a: "They are two different measurements and neither one implies the other. Vocal range is the distance between the lowest and highest notes a singer can produce at all: a pair of extremes, often one-off moments on a record. Voice type is a judgment about tessitura: the band of pitches where the voice sits comfortably for a long time, together with its timbre and weight. A soprano with a practiced low extension can show a lower floor than a contralto who never records down there, and neither label is wrong. This is why a range test tells you your range but can only estimate your type.",
  },
  {
    q: "How do I find out my own voice type?",
    a: "Start with your range: Suede Sing's free browser range test at https://sing.suedeai.ai/range takes about two minutes and reports the lowest and highest clear notes it hears in that session, your span in semitones, and an estimate of which of six of these types, bass to soprano, has the band that overlaps that span most closely (it never names bass-baritone or countertenor). The test finds the edges of your voice, not where it is easy, so afterwards sing a few phrases you know and note where the voice feels comfortable: that band, together with your tone and where the voice changes gear, is what a voice type describes. Treat the type as a starting shelf, not a verdict: voices reclassify with training, with age, and with repertoire, and plenty of working tenors spent their first years labeled baritone.",
  },
  {
    q: "What is a passaggio?",
    // The only FAQ answer that names pitches outside a row, so it is the
    // one that can drift from the table. Built from the same constant the
    // table renders: the hand-typed version of this sentence outlived a
    // correction to the figures once already.
    a: `The passaggio is the pitch zone where a singing voice changes gear between registers. It runs from where the voice has to start shedding weight up to where chest voice stops working the way it did and a lighter production has to take over. It is a few notes wide rather than a single note, and it is felt as a break, a wobble, or a sudden need to push. Each voice type has its own zone: roughly ${row("Bass").passaggio} for a bass, ${row("Baritone").passaggio} for a baritone, ${row("Tenor").passaggio} for a tenor, ${row("Mezzo-soprano").passaggio} for a mezzo-soprano, and ${row("Soprano").passaggio} for a soprano. For mezzo-sopranos and sopranos those figures are the commercial-singing zone where a belt or mix changes gear; ${EARLIER_SHIFT}. Most of the difficulty in a song lives at or just under the singer's passaggio, which is why two singers with identical ranges can find completely different songs hard.`,
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
    // The publisher, spelled out rather than pointed at. Every template on
    // this site referenced this @id without defining it, so a crawler
    // reading one page on its own resolved the pointer to nothing.
    ORG_PUBLISHER_NODE,
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
      title="Vocal range by voice type: what range does a tenor, soprano or bass sing?"
      subtitle={`A tenor's conventional range is ${row("Tenor").band}, a soprano's ${row("Soprano").band} and a bass's ${row("Bass").band}. Below are all eight voice types, the passaggio zone where each one changes gear, and singers whose cited ranges sit there.`}
      actions={
        <LinkButton href={rangeTestHref()} size="md">
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
          {/* The visible author the JSON-LD's author pointer names, as on the
              free chapters, /atlas and /glossary. */}
          <p className="mb-4 text-sm text-mut">
            By{" "}
            <a
              href={AUTHOR_NODE.url}
              rel="author"
              className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet"
            >
              {AUTHOR_NAME}
            </a>{" "}
            · a free reference from{" "}
            <Link href="/atlas" prefetch={false} className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet">
              The Voice Atlas
            </Link>
          </p>
          <h2 className="text-xl">The short answer</h2>
          <p className="mt-3 max-w-3xl text-mut">
            Each of the eight traditional categories is defined across two
            octaves, from the bass at {row("Bass").band} to the soprano at{" "}
            {row("Soprano").band}, and the table below gives all eight along with the{" "}
            <em>passaggio</em>, the zone where that voice changes gear between
            registers, which predicts what a singer finds hard far better than
            the extremes do.
          </p>
          <p className="mt-3 max-w-3xl text-mut">
            Read those numbers as the span a trained voice of each type is
            conventionally expected to cover. They are not a fence around what
            it can reach, and not where it lives: where a voice works
            comfortably for hours, its <em>tessitura</em>, is a much narrower
            band inside that span, clear of both ends. Range and voice type are
            different measurements: the type is judged by that comfortable
            band, the voice&apos;s timbre and where it changes gear, while a
            cited range tracks the furthest it has ever been photographed. A
            soprano with a practiced low extension can show a floor below a
            contralto who never records down there, and the{" "}
            <Link
              href="/singers"
              prefetch={false}
              className="text-violet-ink underline decoration-violet/40 underline-offset-2"
            >
              library of {SINGERS.length} cited singers
            </Link>{" "}
            behind this page is full of exactly that pattern. The categories are
            a starting shelf, not a verdict, and in popular music, sung into a
            microphone, they are looser still.
          </p>
        </Card>

        <Card>
          <SectionLabel>All eight voice types</SectionLabel>
          {/* A real table: this is tabular data, a crawler and a screen reader
              both need the row/column relationships, and an answer engine
              lifting one row needs the header association to keep the number
              attached to the right category. Horizontal scroll is on the
              wrapper so the page body never scrolls sideways on a phone.
              A phone shows only the first three columns and no scrollbar at
              rest, so a cue says the example singers are a swipe away; the
              table's headers and cells stay untouched. */}
          <p
            aria-hidden="true"
            className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-dim sm:hidden"
          >
            Swipe the table sideways for example singers →
          </p>
          <div className="mt-2 overflow-x-auto sm:mt-4">
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
                      {/* No prefetch on this table's links or the hub links
                          under Keep reading: each hub's payload is its whole
                          chart, and this page fetched eight of them twice. */}
                      <Link
                        href={`/singers/voice-type/${row.slug}`}
                        prefetch={false}
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
                            prefetch={false}
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
            Example singers are not the most famous of each category; they are
            the three whose cited ranges sit closest to the conventional band.
            Singers whose catalog label was disputed on individual review are
            left out. Their figures are commonly cited approximations compiled
            from recordings and public discussion, not lab measurements.
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
                are the whole population rather than a selection from it: true
                to the record, in which these categories really are that rare,
                but not a claim that the singers named are typical.
              </>
            )}
            {STRETCHED_EXAMPLES.length > 0 && (
              <>
                {" "}
                Closest is not always close: {joinNames(STRETCHED_EXAMPLES)}{" "}
                {STRETCHED_EXAMPLES.length === 1
                  ? "is the nearest the library has for that row, not a typical example."
                  : "are the nearest the library has for those rows, not typical examples."}
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
          <p className="mt-2 max-w-3xl text-sm text-mut">{FAQ_LEDE}</p>
          {/* Each question is a real heading rather than a <dt>, so the eleven
              Question nodes in the FAQPage markup above have eleven visible
              counterparts. As one description list the whole block read as a
              single ~1,176-word passage, which is more than three times the
              375-word ceiling the rest of the site holds to. */}
          <div className="mt-5 max-w-3xl space-y-6">
            {FAQ.map((f) => (
              <div key={f.q}>
                <h3 className="text-ink">{f.q}</h3>
                <p className="mt-1.5 text-sm text-mut">{f.a}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionLabel>Keep reading</SectionLabel>
          <ul className="mt-4 max-w-3xl space-y-2 text-sm text-mut">
            <li>
              <Link
                href="/atlas/voice-types-in-the-wild"
                className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet"
              >
                Voice types in the wild
              </Link>
              : the atlas chapter behind this page: why a pop mezzo and an opera
              mezzo are different claims, and how to guess your own type without
              a teacher. Free.
            </li>
            <li>
              <Link href={rangeTestHref()} className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet">
                The free range test
              </Link>
              : about two minutes in the browser gives you your own two numbers to
              read this table with.
            </li>
            <li>
              <Link href="/singers" prefetch={false} className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet">
                All {SINGERS.length} singers
              </Link>
              , or jump to{" "}
              {ROWS.map((row, i) => (
                <span key={row.voice}>
                  {i > 0 && (i === ROWS.length - 1 ? " and " : ", ")}
                  <Link
                    href={`/singers/voice-type/${row.slug}`}
                    prefetch={false}
                    className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet"
                  >
                    {pluralVoice(row.lower)}
                  </Link>
                </span>
              ))}
              .
            </li>
            <li>
              <Link href="/glossary" className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet">
                The glossary
              </Link>
              : passaggio, tessitura, belt and the rest, defined.
            </li>
          </ul>
        </Card>

        <p className="max-w-3xl text-xs text-dim">
          Voice categories are guides borrowed from choral and operatic
          practice, not boxes, and plenty of singers are filed differently by
          different sources.
        </p>
        <SafetyLine />
      </div>
    </PageShell>
  );
}
