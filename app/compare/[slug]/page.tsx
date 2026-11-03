import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AppsTable,
  CompareBreadcrumbs,
  EdgeList,
  FaqList,
  JsonLd,
  KeepComparing,
  LINK_CLASS,
  SideBySideTable,
  SourceList,
  compareJsonLd,
} from "@/components/compare/parts";
import { Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";
import {
  COMPARE_PATH,
  COMPARISONS_AS_OF,
  SUEDE_EDGES,
  SUEDE_PRICE_LINE,
  allSources,
  alternativesAnswer,
  alternativesFaq,
  alternativesPath,
  comparisonBySlug,
  comparisonPages,
  otherCompetitors,
  vsAnswer,
  vsFaq,
  vsPath,
  type ComparisonKind,
  type Competitor,
} from "@/lib/comparisons";
import { comparisonPageKeywords } from "@/lib/keywords";
import { firstFit, MAX_TITLE } from "@/lib/meta-fit";
import { DEFAULT_OG_IMAGE, withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL, rangeTestHref } from "@/lib/site";

interface Params {
  slug: string;
}

// The comparison set is a fixed data module: every URL is known at build
// time, and anything else is a typo that should 404.
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return comparisonPages().map((p) => ({ slug: p.slug }));
}

function pageTitle(kind: ComparisonKind, c: Competitor): string {
  return kind === "vs"
    ? firstFit(
        [`Suede Sing vs ${c.name}: Singing Practice Compared`, `Suede Sing vs ${c.name}: Singing Apps Compared`, `Suede Sing vs ${c.name}`],
        MAX_TITLE,
      )
    : firstFit(
        [
          `${c.name} Alternatives for Singing Practice · Suede Sing`,
          `${c.name} Alternatives for Singers · Suede Sing`,
          `${c.name} Alternatives for Singers`,
        ],
        MAX_TITLE,
      );
}

function pagePath(kind: ComparisonKind, c: Competitor): string {
  return kind === "vs" ? vsPath(c) : alternativesPath(c);
}

function crumbs(kind: ComparisonKind, c: Competitor) {
  return [
    { name: "Suede Sing", path: "/" },
    { name: "Compare singing apps", path: COMPARE_PATH },
    {
      name: kind === "vs" ? `Suede Sing vs ${c.name}` : `${c.name} alternatives`,
      path: pagePath(kind, c),
    },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = comparisonBySlug(slug);
  if (!page) return {};
  const { kind, competitor: c } = page;
  return withCanonicalOpenGraph({
    title: { absolute: pageTitle(kind, c) },
    description: kind === "vs" ? c.description.vs : c.description.alternatives,
    keywords: comparisonPageKeywords(kind, c.name),
    alternates: { canonical: `${SITE_URL}${pagePath(kind, c)}` },
    openGraph: { type: "article", images: [DEFAULT_OG_IMAGE] },
  });
}

function Actions() {
  return (
    <>
      <LinkButton href={rangeTestHref()} size="md">
        Test your range free
      </LinkButton>
      <LinkButton href="/pro#buy" variant="outline" size="md">
        {`Suede Pro: ${SUEDE_PRICE_LINE.replace(" for lifetime access", "")}`}
      </LinkButton>
    </>
  );
}

function VsPage({ competitor: c }: { competitor: Competitor }) {
  const faq = vsFaq(c);
  const trail = crumbs("vs", c);
  return (
    <PageShell
      kicker={`Comparison · ${COMPARISONS_AS_OF}`}
      title={`Suede Sing vs ${c.name}`}
      subtitle={vsAnswer(c)}
      actions={<Actions />}
    >
      <JsonLd
        data={compareJsonLd({
          path: vsPath(c),
          name: pageTitle("vs", c),
          description: c.description.vs,
          crumbs: trail,
          faq,
        })}
      />
      <CompareBreadcrumbs crumbs={trail} />

      <div className="space-y-6">
        <Card>
          <SectionLabel>Side by side</SectionLabel>
          <h2 className="mt-3 text-xl">How do Suede Sing and {c.name} compare?</h2>
          <p className="mt-3 max-w-3xl text-mut">
            Seven things a singer weighs before practicing, with {c.name}&apos;s price{" "}
            {COMPARISONS_AS_OF} and its facts taken from its own site and store listings.
          </p>
          <SideBySideTable competitor={c} />
        </Card>

        <Card>
          <SectionLabel>Why Suede Sing</SectionLabel>
          <h2 className="mt-3 text-xl">Why do singers choose Suede Sing over {c.name}?</h2>
          <EdgeList edges={c.edges} />
          <div className="mt-6 flex flex-wrap gap-2">
            <Actions />
          </div>
        </Card>

        <Card>
          <SectionLabel>About {c.name}</SectionLabel>
          <h2 className="mt-3 text-xl">What is {c.name}?</h2>
          <p className="mt-3 max-w-3xl text-mut">{c.about}</p>
          <p className="mt-3 max-w-3xl text-sm text-mut">
            Weighing more options?{" "}
            <Link href={alternativesPath(c)} prefetch={false} className={LINK_CLASS}>
              {c.name} alternatives for singing practice
            </Link>{" "}
            lines up five more apps.
          </p>
        </Card>

        <Card>
          <SectionLabel>Questions</SectionLabel>
          <h2 className="mt-3 text-xl">Suede Sing vs {c.name}: questions singers ask</h2>
          <FaqList faq={faq} />
        </Card>

        <Card>
          <SectionLabel>Sources</SectionLabel>
          <h2 className="mt-3 text-xl">Where do the {c.name} facts come from?</h2>
          <SourceList sources={c.sources} />
        </Card>

        <KeepComparing exclude={c.name} />
      </div>
    </PageShell>
  );
}

/** The checklist under an alternatives page, minus anything its top-pick list already said. */
function lookFor(c: Competitor) {
  const said = new Set(c.edges.map((e) => e.title));
  return [SUEDE_EDGES.scored, SUEDE_EDGES.measured, SUEDE_EDGES.private, SUEDE_EDGES.noAds, SUEDE_EDGES.free, SUEDE_EDGES.browser]
    .filter((e) => !said.has(e.title))
    .slice(0, 4);
}

function AlternativesPage({ competitor: c }: { competitor: Competitor }) {
  const faq = alternativesFaq(c);
  const trail = crumbs("alternatives", c);
  const others = otherCompetitors(c);
  return (
    <PageShell
      kicker={`Alternatives · ${COMPARISONS_AS_OF}`}
      title={`${c.name} alternatives for singing practice`}
      subtitle={alternativesAnswer(c)}
      actions={<Actions />}
    >
      <JsonLd
        data={compareJsonLd({
          path: alternativesPath(c),
          name: pageTitle("alternatives", c),
          description: c.description.alternatives,
          crumbs: trail,
          faq,
        })}
      />
      <CompareBreadcrumbs crumbs={trail} />

      <div className="space-y-6">
        <Card>
          <SectionLabel>Top pick</SectionLabel>
          <h2 className="mt-3 text-xl">Why is Suede Sing the top {c.name} alternative?</h2>
          <EdgeList edges={c.edges} />
          <p className="mt-6 max-w-3xl text-sm text-mut">
            Read the full{" "}
            <Link href={vsPath(c)} prefetch={false} className={LINK_CLASS}>
              Suede Sing vs {c.name}
            </Link>{" "}
            comparison, row by row.
          </p>
        </Card>

        <Card>
          <SectionLabel>Side by side</SectionLabel>
          <h2 className="mt-3 text-xl">What other {c.name} alternatives are there?</h2>
          <p className="mt-3 max-w-3xl text-mut">
            Suede Sing leads this list, and these are the other apps singers weigh against{" "}
            {c.name}. Prices are {COMPARISONS_AS_OF}, from each product&apos;s own site or store
            listing.
          </p>
          <AppsTable
            competitors={others}
            links="vs"
            caption={`${c.name} alternatives: Suede Sing and ${others.length} more apps, what each is built for, where it runs and its price ${COMPARISONS_AS_OF}.`}
          />
        </Card>

        <Card>
          <SectionLabel>What to look for</SectionLabel>
          <h2 className="mt-3 text-xl">What should you look for in a {c.name} alternative?</h2>
          <EdgeList edges={lookFor(c)} />
        </Card>

        <Card>
          <SectionLabel>Questions</SectionLabel>
          <h2 className="mt-3 text-xl">{c.name} alternatives: questions singers ask</h2>
          <FaqList faq={faq} />
        </Card>

        <Card>
          <SectionLabel>Sources</SectionLabel>
          <h2 className="mt-3 text-xl">Where do these app facts come from?</h2>
          <SourceList sources={allSources()} />
        </Card>

        <KeepComparing exclude={c.name} />
      </div>
    </PageShell>
  );
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const page = comparisonBySlug(slug);
  if (!page) notFound();
  return page.kind === "vs" ? (
    <VsPage competitor={page.competitor} />
  ) : (
    <AlternativesPage competitor={page.competitor} />
  );
}
