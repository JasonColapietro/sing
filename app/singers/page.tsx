import type { Metadata } from "next";
import Link from "next/link";
import { SingersDirectory } from "@/components/singers/directory";
import { LinkButton, PageShell } from "@/components/ui";
import {
  HUB_GENRES,
  SINGERS,
  VOICE_KINDS,
  genreSlug,
  rangeLabel,
  singersByGenre,
  singersByVoiceType,
  voiceTypeSlug,
} from "@/lib/singers";
import { SITE_URL } from "@/lib/site";

const DESCRIPTION = `The vocal ranges of ${SINGERS.length} famous singers on one keyboard — whistle notes to the deepest basses. Overlay your own range free.`;

export const metadata: Metadata = {
  title: "Famous Singers' Vocal Ranges",
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/singers` },
  openGraph: {
    title: `Famous Singers' Vocal Ranges — ${SINGERS.length} voices on one keyboard`,
    description: DESCRIPTION,
    type: "website",
    url: `${SITE_URL}/singers`,
  },
};

export default function SingersPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Famous Singers' Vocal Ranges",
    url: `${SITE_URL}/singers`,
    description: DESCRIPTION,
    isPartOf: {
      "@type": "WebSite",
      name: "Suede Sing",
      url: SITE_URL,
    },
    // The page is a list of 357 people; without an ItemList none of that is
    // machine-readable. Alphabetical, matching the default render order.
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: SINGERS.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: [...SINGERS]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE_URL}/singers/${s.slug}`,
          name: `${s.name} — ${rangeLabel(s)}`,
        })),
    },
  };

  return (
    <PageShell
      kicker="Reference"
      title="Famous vocal ranges"
      subtitle={`The commonly cited ranges of ${SINGERS.length} famous singers, every one on the same keyboard.`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SingersDirectory />

      {/* Hubs: the filters above are client state and invisible to a crawler,
          so the same cuts exist as real pages — and they carry content the
          directory can't (what a voice type is, how a genre distributes). */}
      <section className="mt-12">
        <h2 className="text-xl">Browse by voice type</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {VOICE_KINDS.map((v) => {
            const n = singersByVoiceType(v).length;
            return (
              <li key={v}>
                <Link
                  href={`/singers/voice-type/${voiceTypeSlug(v)}`}
                  className="flex items-baseline justify-between gap-3 rounded-xl border border-line bg-panel px-4 py-3 transition-colors hover:border-amber"
                >
                  <span className="text-sm font-medium">{v}</span>
                  <span className="tabular font-mono text-xs text-dim">{n}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <h2 className="mt-8 text-xl">Browse by genre</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {HUB_GENRES.map((g) => (
            <li key={g}>
              <Link
                href={`/singers/genre/${genreSlug(g)}`}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-sm transition-colors hover:border-amber"
              >
                {g}
                <span className="tabular font-mono text-[10px] text-dim">
                  {singersByGenre(g).length}
                </span>
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

      <p className="mt-10 max-w-2xl text-xs text-mut">
        These are the approximate figures fans and music journalists commonly
        cite — the widest notes a singer has recorded, not the comfortable
        range they sing in every night, and not lab measurements. Treat them
        as a fun reference, not a target.
      </p>
    </PageShell>
  );
}
