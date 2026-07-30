import type { Metadata } from "next";
import { SingersDirectory } from "@/components/singers/directory";
import { PageShell } from "@/components/ui";
import { SINGERS, rangeLabel } from "@/lib/singers";
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
      <p className="mt-10 max-w-2xl text-xs text-mut">
        These are the approximate figures fans and music journalists commonly
        cite — the widest notes a singer has recorded, not the comfortable
        range they sing in every night, and not lab measurements. Treat them
        as a fun reference, not a target.
      </p>
    </PageShell>
  );
}
