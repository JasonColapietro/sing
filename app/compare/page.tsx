import type { Metadata } from "next";
import Link from "next/link";
import {
  AppsTable,
  CompareBreadcrumbs,
  EdgeList,
  FaqList,
  JsonLd,
  LINK_CLASS,
  SourceList,
  compareJsonLd,
} from "@/components/compare/parts";
import { Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";
import {
  COMPARE_PATH,
  COMPARISONS_AS_OF,
  COMPETITORS,
  SUEDE_EDGES,
  SUEDE_PRICE_LINE,
  allSources,
  alternativesPath,
  hubFaq,
  listJoin,
  vsPath,
} from "@/lib/comparisons";
import { routeKeywords } from "@/lib/keywords";
import { DEFAULT_OG_IMAGE, withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL, rangeTestHref } from "@/lib/site";

const TITLE = `Singing App Comparison: Suede Sing vs ${COMPETITORS.length} Apps`;
const DESCRIPTION = `Singing app comparison: Suede Sing next to ${listJoin(COMPETITORS.map((c) => c.name))}, with prices checked in November 2026 and every source linked.`;

export const metadata: Metadata = withCanonicalOpenGraph({
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: routeKeywords("/compare"),
  alternates: { canonical: `${SITE_URL}${COMPARE_PATH}` },
  openGraph: { type: "website", images: [DEFAULT_OG_IMAGE] },
});

const CRUMBS = [
  { name: "Suede Sing", path: "/" },
  { name: "Compare singing apps", path: COMPARE_PATH },
];

const FAQ = hubFaq();

export default function ComparePage() {
  return (
    <PageShell
      kicker="Comparisons · November 2026"
      title="Singing app comparison: Suede Sing next to six popular apps"
      subtitle={`Suede Sing is the singing app built to measure and train your voice in the browser: a free pitch studio and range test with no daily limit, scored warmups, and Suede Pro at ${SUEDE_PRICE_LINE}. Here is how it lines up against ${listJoin(COMPETITORS.map((c) => c.name))}.`}
      actions={
        <>
          <LinkButton href={rangeTestHref()} size="md">
            Test your range free
          </LinkButton>
          <LinkButton href="/pro#buy" variant="outline" size="md">
            {`Suede Pro: ${SUEDE_PRICE_LINE.replace(" for lifetime access", "")}`}
          </LinkButton>
        </>
      }
    >
      <JsonLd
        data={compareJsonLd({
          path: COMPARE_PATH,
          name: TITLE,
          description: DESCRIPTION,
          crumbs: CRUMBS,
          faq: FAQ,
          type: "CollectionPage",
        })}
      />
      <CompareBreadcrumbs crumbs={CRUMBS} />

      <div className="space-y-6">
        <Card>
          <SectionLabel>Side by side</SectionLabel>
          <h2 className="mt-3 text-xl">How does Suede Sing compare with other singing apps?</h2>
          <p className="mt-3 max-w-3xl text-mut">
            Each app below is built around something different. Suede Sing is the one built
            around your own voice: it measures your range, scores every note you sing and runs
            in the browser you already have. Prices are {COMPARISONS_AS_OF} and come from each
            product&apos;s own site or store listing.
          </p>
          <AppsTable
            competitors={COMPETITORS}
            caption="Suede Sing and six singing apps: what each is built for, where it runs and its price as of November 2026."
          />
        </Card>

        <Card>
          <SectionLabel>Why Suede Sing</SectionLabel>
          <h2 className="mt-3 text-xl">Why do singers switch to Suede Sing?</h2>
          <EdgeList
            edges={[
              SUEDE_EDGES.browser,
              SUEDE_EDGES.free,
              SUEDE_EDGES.once,
              SUEDE_EDGES.private,
              SUEDE_EDGES.scored,
              SUEDE_EDGES.noAds,
            ]}
          />
        </Card>

        <Card>
          <SectionLabel>Every comparison</SectionLabel>
          <h2 className="mt-3 text-xl">Which comparison should you read?</h2>
          <ul className="mt-4 grid max-w-4xl gap-3 text-sm text-mut sm:grid-cols-2">
            {COMPETITORS.map((c) => (
              <li key={c.slug}>
                <Link href={vsPath(c)} prefetch={false} className={LINK_CLASS}>
                  Suede Sing vs {c.name}
                </Link>
                {" · "}
                <Link href={alternativesPath(c)} prefetch={false} className={LINK_CLASS}>
                  {c.name} alternatives
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionLabel>Questions</SectionLabel>
          <h2 className="mt-3 text-xl">Singing app questions, answered</h2>
          <FaqList faq={FAQ} />
        </Card>

        <Card>
          <SectionLabel>Sources</SectionLabel>
          <h2 className="mt-3 text-xl">Where do these facts come from?</h2>
          <SourceList sources={allSources()} />
        </Card>
      </div>
    </PageShell>
  );
}
