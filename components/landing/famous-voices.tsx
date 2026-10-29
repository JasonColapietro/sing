import Link from "next/link";
import { SectionLabel } from "@/components/ui";
import { RangeMini } from "@/components/singers/range-mini";
import { hasDocumentedSourceReview } from "@/lib/singer-evidence";
import { rangeLabel, singerBySlug } from "@/lib/singers";

/**
 * Eight direct homepage paths into the singer catalog: a name, the reported
 * span in words, and the span as a bar on the shared C2-C6 axis. Every
 * public profile is indexable; the evidence status lives on the profile.
 */
const FEATURED = [
  "adele",
  "olivia-rodrigo",
  "reba-mcentire",
  "alex-warren",
  "sam-smith",
  "arijit-singh",
  "freddie-mercury",
  "whitney-houston",
] as const;

/**
 * Resolved at module load so a slug that stops existing (a rename in a
 * data/singers batch) breaks the build instead of thinning the homepage's
 * outbound links.
 */
const VOICES = FEATURED.map((slug) => {
  const singer = singerBySlug(slug);
  if (!singer) {
    throw new Error(
      `famous-voices: no singer for slug "${slug}". Update FEATURED when a data/singers batch renames or drops an entry.`,
    );
  }
  return { singer, reviewed: hasDocumentedSourceReview(singer.slug) };
  // Stable: reviewed profiles first, FEATURED order within each.
}).sort((a, b) => Number(b.reviewed) - Number(a.reviewed));

export function FamousVoices() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <SectionLabel hairline className="mb-4">Reported ranges</SectionLabel>
            <h2 className="text-2xl sm:text-3xl">
              Start with a voice you already know
            </h2>
            <p className="mt-3 text-mut">
              Open any singer to see their range on a keyboard, then take the
              range test and put yours beside it.
            </p>
          </div>
          <Link
            href="/singers"
            prefetch={false}
            className="inline-flex min-h-11 items-center font-mono text-xs uppercase tracking-[0.14em] text-violet-ink underline decoration-violet/50 underline-offset-4 transition-colors hover:decoration-violet"
          >
            Browse every voice
          </Link>
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {VOICES.map(({ singer }) => (
            <li key={singer.slug}>
              {/* prefetch={false}: a grid of cards scrolling into view would
                  fetch eight singer routes in the background. */}
              <Link
                href={`/singers/${singer.slug}`}
                prefetch={false}
                className="lift group flex h-full flex-col gap-3 rounded-xl border border-line bg-panel px-4 py-3 hover:border-violet/50"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-ink transition-colors group-hover:text-violet-ink">
                    {singer.name}
                  </span>
                  <span className="tabular shrink-0 font-mono text-xs text-mut">
                    {rangeLabel(singer)}
                  </span>
                </span>
                <RangeMini
                  low={singer.lowMidi}
                  high={singer.highMidi}
                  beltMidi={singer.beltMidi}
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
