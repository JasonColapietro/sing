import Link from "next/link";
import { isSingerReviewed, voiceTypeEvidenceCopy } from "@/lib/singer-evidence";
import { rangeLabel, singerBySlug } from "@/lib/singers";

/**
 * The voices people actually search for, linked from the homepage.
 *
 * Every singer page is reachable from /singers and /atlas, but those hubs each
 * carry 420 links, so a leaf inherits ~1/420 of a hub's weight — and the
 * homepage is the only page on this subdomain with an inbound external link
 * (suedeai.ai's nav). Google had discovered the leaves and declined to crawl
 * them: 422 URLs sat in "Discovered - currently not indexed" on 2026-08-27.
 * These few dozen names are the head queries, so they get a direct path from
 * the strongest page rather than a share of a 420-way split.
 *
 * The list is deliberately short. Adding all 420 here would rebuild the same
 * flat hub and concentrate nothing.
 */
const FEATURED = [
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
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="mb-4 inline-block rounded border border-line bg-panel px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              Measured voices
            </p>
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
            className="font-mono text-xs uppercase tracking-[0.14em] text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet"
          >
            Browse every voice
          </Link>
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {VOICES.map(({ singer, evidenceCopy }) => (
            <li key={singer.slug}>
              <Link
                href={`/singers/${singer.slug}`}
                className="lift group flex items-baseline justify-between gap-3 rounded-xl border border-line bg-panel px-4 py-3 hover:border-violet/50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-ink group-hover:text-violet-ink">
                    {singer.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-dim">
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
