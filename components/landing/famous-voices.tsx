import Link from "next/link";
import { SectionLabel } from "@/components/ui";
import { isSingerReviewed, voiceTypeEvidenceCopy } from "@/lib/singer-evidence";
import { rangeLabel, singerBySlug } from "@/lib/singers";

/** A compact set of direct homepage paths into the singer catalog.
 * Damiano David joins the established cohort after September's Search Console
 * report showed four clicks for his exact vocal-range query.
 */
const FEATURED = [
  "damiano-david",
  "freddie-mercury",
  "whitney-houston",
  "mariah-carey",
  "jeff-buckley",
  "adele",
  "beyonce",
  "michael-jackson",
  "aretha-franklin",
  "taylor-swift",
  "billie-eilish",
  "ariana-grande",
  "bruno-mars",
  "celine-dion",
  "stevie-wonder",
  "prince",
  "axl-rose",
  "chris-cornell",
  "dimash-kudaibergen",
  "olivia-rodrigo",
  "reba-mcentire",
  "alex-warren",
  "sam-smith",
  "arijit-singh",
] as const;

const EVIDENCE_FEATURED = new Set<string>([
  "olivia-rodrigo",
  "reba-mcentire",
  "alex-warren",
  "sam-smith",
  "arijit-singh",
]);

/**
 * Resolved at module load so a slug that stops existing — a rename in a
 * data/singers batch, a singer dropped from the library — breaks the build
 * instead of silently thinning the homepage's outbound links, which is exactly
 * the failure this section exists to prevent.
 */
const VOICES = FEATURED.map((slug) => {
  const singer = singerBySlug(slug);
  if (!singer) {
    throw new Error(
      `famous-voices: no singer for slug "${slug}". Update FEATURED when a data/singers batch renames or drops an entry.`,
    );
  }
  const needsEvidenceCopy = EVIDENCE_FEATURED.has(singer.slug);
  if (needsEvidenceCopy && !isSingerReviewed(singer.slug)) {
    throw new Error(
      `famous-voices: missing reviewed evidence for promoted singer "${singer.slug}".`,
    );
  }
  return {
    singer,
    evidenceCopy: needsEvidenceCopy ? voiceTypeEvidenceCopy(singer) : undefined,
  };
});

export function FamousVoices() {
  return (
    <section className="border-t border-line">
      {/* py-12 on a phone, where the page's own section gap is mt-12 too; the
          bottom padding is the whole gap to the Pro panel that follows. */}
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            {/* The same tape label the Pro panel below wears; this was the one
                section label on the page drawn as a grey mono box. */}
            <SectionLabel className="mb-4">Measured voices</SectionLabel>
            <h2 className="text-2xl sm:text-3xl">
              Start with a voice you already know
            </h2>
            <p className="mt-3 text-mut">
              Every range below is the span a singer is commonly cited as
              covering, low note to high. Open one to see it drawn on a
              keyboard, then run the range test and put your own voice beside
              it.
            </p>
          </div>
          <Link
            href="/singers"
            className="inline-flex min-h-11 items-center font-mono text-xs uppercase tracking-[0.14em] text-violet-ink underline decoration-violet/50 underline-offset-4 transition-colors hover:decoration-violet"
          >
            Browse every voice
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/singers/voice-type/contralto"
            className="inline-flex min-h-11 items-center rounded-xl border border-line bg-panel px-4 py-3 text-sm font-medium text-violet-ink transition-colors hover:border-violet hover:bg-panel2"
          >
            Contralto singers and their vocal ranges
          </Link>
          <Link
            href="/atlas/vocal-range-by-voice-type"
            className="inline-flex min-h-11 items-center rounded-xl border border-line bg-panel px-4 py-3 text-sm font-medium text-violet-ink transition-colors hover:border-violet hover:bg-panel2"
          >
            Compare vocal ranges by voice type
          </Link>
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {VOICES.map(({ singer, evidenceCopy }) => (
            <li key={singer.slug}>
              {/* A reviewed singer carries a sentence of evidence and a longer
                  range label. Side by side, the shrink-0 label left that
                  sentence a column a few words wide — fourteen lines tall on a
                  phone — so those rows stack: name, evidence, then the span. */}
              <Link
                href={`/singers/${singer.slug}`}
                className={`lift group flex h-full rounded-xl border border-line bg-panel px-4 py-3 hover:border-violet/50 ${
                  evidenceCopy
                    ? "flex-col gap-2"
                    : "items-baseline justify-between gap-3"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-ink transition-colors group-hover:text-violet-ink">
                    {singer.name}{singer.slug === "damiano-david" ? " vocal range" : ""}
                  </span>
                  <span
                    className={`mt-0.5 block text-xs text-dim ${evidenceCopy ? "leading-relaxed" : ""}`}
                  >
                    {evidenceCopy ?? singer.voiceType}
                  </span>
                </span>
                <span className="tabular shrink-0 font-mono text-xs text-mut">
                  {evidenceCopy
                    ? `Reported reference span: ${rangeLabel(singer)}`
                    : rangeLabel(singer)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
