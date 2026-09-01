import type { Metadata } from "next";
import Link from "next/link";
import { Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";
import { DEFAULT_OG_IMAGE, withCanonicalOpenGraph } from "@/lib/og";
import {
  POP_SONGS,
  popDifficulty,
  popRangeLabel,
} from "@/lib/pop-songs";
import { SITE_URL } from "@/lib/site";

const TITLE = "Can You Sing It? Vocal Ranges of Popular Songs";
const DESCRIPTION = `The key, vocal range and difficulty of ${POP_SONGS.length} popular songs — and whether each one fits your voice, measured against your free range test.`;

export const metadata: Metadata = withCanonicalOpenGraph({
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/can-you-sing` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
});

/** Hard songs sort to the top read order last: easiest first sells the click. */
function sorted() {
  const rank = { Easy: 0, Medium: 1, Hard: 2 } as const;
  return [...POP_SONGS].sort(
    (a, b) =>
      rank[popDifficulty(a)] - rank[popDifficulty(b)] ||
      a.highMidi - a.lowMidi - (b.highMidi - b.lowMidi),
  );
}

export default function CanYouSingHub() {
  const songs = sorted();
  const pageUrl = `${SITE_URL}/can-you-sing`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: TITLE,
        description: DESCRIPTION,
        inLanguage: "en",
        publisher: { "@id": "https://suedeai.ai/#organization" },
        mainEntity: { "@id": `${pageUrl}#list` },
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#list`,
        numberOfItems: songs.length,
        itemListElement: songs.map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${s.title} — ${s.artist}`,
          url: `${pageUrl}/${s.slug}`,
        })),
      },
    ],
  };

  return (
    <PageShell
      kicker="Song ranges"
      title="Can you sing it?"
      subtitle={`The key, range and difficulty of ${songs.length} popular songs, from the commonly cited studio-version figures. Take the free range test and every page answers for your voice specifically.`}
      actions={<LinkButton href="/range">Find your range free</LinkButton>}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {songs.map((s) => (
          <Link key={s.slug} href={`/can-you-sing/${s.slug}`} className="group">
            <Card tone="raised" className="h-full">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg text-ink group-hover:text-violet-ink">
                  {s.title}
                </h2>
                <span className="font-mono text-xs text-dim">{s.year}</span>
              </div>
              <div className="mt-1 text-sm text-mut">{s.artist}</div>
              <div className="tabular mt-3 font-mono text-sm text-cool">
                {popRangeLabel(s)}
              </div>
              <div className="mt-1 text-xs text-dim">
                {s.key} · {popDifficulty(s)}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card tone="well" className="mt-8">
        <SectionLabel>How these figures work</SectionLabel>
        <p className="mt-3 max-w-prose text-sm text-mut">
          Each page cites the published key and the commonly circulated
          lead-vocal range for the studio version — the same figures
          sheet-music arrangements and fan transcriptions agree on, framed as
          approximations, never lab measurements. No lyrics or melodies are
          reproduced. For what the artists themselves can do beyond one song,
          see the{" "}
          <Link
            className="text-violet-ink underline-offset-4 hover:underline"
            href="/singers"
          >
            famous singers&apos; vocal ranges
          </Link>{" "}
          library.
        </p>
      </Card>
    </PageShell>
  );
}
