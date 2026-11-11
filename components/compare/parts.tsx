import Link from "next/link";
import type { ReactNode } from "react";
import { AUTHOR_ID } from "@/lib/author";
import {
  COMPARISONS_CHECKED,
  COMPARISONS_CHECKED_LABEL,
  COMPARE_PATH,
  PRICING_VARIES,
  ROW_KEYS,
  ROW_LABELS,
  SUEDE_FACTS,
  alternativesPath,
  vsPath,
  type Competitor,
  type Edge,
  type Faq,
  type Source,
} from "@/lib/comparisons";
import { ORG_ID, ORG_PUBLISHER_NODE } from "@/lib/organization";
import { SITE_URL } from "@/lib/site";

/**
 * Shared pieces of the /compare pages. Server components only: every table
 * cell, FAQ answer and source link is in the HTML a crawler reads.
 */

export const LINK_CLASS =
  "text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet";

const TH_CLASS = "py-3 pr-4 font-mono text-[11px] uppercase tracking-[0.12em] text-dim";

export interface Crumb {
  name: string;
  path: string;
}

/** The visible trail the BreadcrumbList markup describes. Links are 24px tall (WCAG 2.5.8). */
export function CompareBreadcrumbs({ crumbs }: { crumbs: readonly Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="-mt-4 mb-6 text-sm text-mut">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.path} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {last ? (
                <span aria-current="page" className="text-ink">
                  {c.name}
                </span>
              ) : (
                <Link href={c.path || "/"} prefetch={false} className="inline-flex min-h-6 items-center hover:text-ink">
                  {c.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** A table that scrolls inside its own box, so the page never scrolls sideways on a phone. */
function TableWrap({ cue, children }: { cue: string; children: ReactNode }) {
  return (
    <>
      <p
        aria-hidden="true"
        className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-dim sm:hidden"
      >
        {cue} →
      </p>
      <div className="mt-2 overflow-x-auto sm:mt-4">{children}</div>
    </>
  );
}

/** "Pricing varies" and a link to the competitor's own pricing page or store listing. */
export function CompetitorPrice({ competitor: c }: { competitor: Competitor }) {
  return (
    <>
      {PRICING_VARIES}.{" "}
      <a href={c.pricing.url} rel="nofollow noopener" className={`${LINK_CLASS} break-words`}>
        See {c.pricing.label}
      </a>
    </>
  );
}

/** Suede Sing and one competitor, row by row. */
export function SideBySideTable({ competitor: c }: { competitor: Competitor }) {
  return (
    <TableWrap cue={`Swipe the table sideways for ${c.name}`}>
      <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
        <caption className="sr-only">
          Suede Sing compared with {c.name}: platforms, price, free use, practice, range tools,
          songs and lessons.
        </caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className={`${TH_CLASS} w-40`}>
              <span className="sr-only">Feature</span>
            </th>
            <th scope="col" className={`${TH_CLASS} text-violet-ink`}>
              Suede Sing
            </th>
            <th scope="col" className={TH_CLASS}>
              {c.name}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/50">
          {ROW_KEYS.map((key) => (
            <tr key={key} className="align-top">
              <th scope="row" className="py-3 pr-4 font-medium text-ink">
                {ROW_LABELS[key]}
              </th>
              <td className="py-3 pr-4 text-ink">{SUEDE_FACTS[key]}</td>
              <td className="py-3 text-mut">
                {key === "price" ? <CompetitorPrice competitor={c} /> : c.facts[key]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

/** Suede Sing first, then the listed apps, one row each, with links to their pages. */
export function AppsTable({
  competitors,
  caption,
  links = "both",
  showSuedePrice = true,
}: {
  competitors: readonly Competitor[];
  caption: string;
  links?: "both" | "vs";
  /** The homepage states its price once, in the Pro teaser above this table. */
  showSuedePrice?: boolean;
}) {
  return (
    <TableWrap cue="Swipe the table sideways for more">
      <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className={TH_CLASS}>App</th>
            <th scope="col" className={TH_CLASS}>Built for</th>
            <th scope="col" className={TH_CLASS}>Where it runs</th>
            <th scope="col" className={TH_CLASS}>Price</th>
            <th scope="col" className={`${TH_CLASS} pr-0`}>Compare</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/50">
          <tr className="align-top">
            <th scope="row" className="py-3 pr-4 font-medium text-violet-ink">Suede Sing</th>
            <td className="py-3 pr-4 text-ink">Measuring and training your voice in the browser</td>
            <td className="py-3 pr-4 text-ink">Any modern browser, plus iPhone and Android apps</td>
            <td className="py-3 pr-4 text-ink">{showSuedePrice ? SUEDE_FACTS.price : "Free plan and optional Suede Pro"}</td>
            <td className="py-3 text-ink">
              <Link href="/pro" prefetch={false} className={LINK_CLASS}>
                See Suede Pro
              </Link>
            </td>
          </tr>
          {competitors.map((c) => (
            <tr key={c.slug} className="align-top">
              <th scope="row" className="py-3 pr-4 font-medium text-ink">{c.name}</th>
              <td className="py-3 pr-4 text-mut">{c.builtFor}</td>
              <td className="py-3 pr-4 text-mut">{c.facts.platforms}</td>
              <td className="py-3 pr-4 text-mut">
                <CompetitorPrice competitor={c} />
              </td>
              <td className="py-3 text-mut">
                <Link href={vsPath(c)} prefetch={false} className={LINK_CLASS}>
                  Suede Sing vs {c.name}
                </Link>
                {links === "both" && (
                  <>
                    <br />
                    <Link href={alternativesPath(c)} prefetch={false} className={LINK_CLASS}>
                      {c.name} alternatives
                    </Link>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

export function EdgeList({ edges }: { edges: readonly Edge[] }) {
  return (
    <div className="mt-5 grid max-w-4xl gap-5 sm:grid-cols-2">
      {edges.map((e) => (
        <div key={e.title}>
          <h3 className="text-ink">{e.title}</h3>
          <p className="mt-1.5 text-sm text-mut">{e.body}</p>
        </div>
      ))}
    </div>
  );
}

/** Each question a real heading, so every Question node in the FAQPage markup has a visible counterpart. */
export function FaqList({ faq }: { faq: readonly Faq[] }) {
  return (
    <div className="mt-5 max-w-3xl space-y-6">
      {faq.map((f) => (
        <div key={f.q}>
          <h3 className="text-ink">{f.q}</h3>
          <p className="mt-1.5 text-sm text-mut">{f.a}</p>
        </div>
      ))}
    </div>
  );
}

export function SourceList({ sources }: { sources: readonly Source[] }) {
  return (
    <>
      <p className="mt-3 max-w-3xl text-sm text-mut">
        Every competitor fact on this page comes from that product&apos;s own website, help
        center or app store listing, checked on{" "}
        <time dateTime={COMPARISONS_CHECKED}>{COMPARISONS_CHECKED_LABEL}</time>. Competitor
        pricing varies by country, platform and promotion, so each price links to that app&apos;s
        own listing. Suede Sing facts come from the product itself.
      </p>
      <ul className="mt-4 max-w-3xl space-y-2 text-sm text-mut">
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} rel="nofollow noopener" className={`${LINK_CLASS} break-words`}>
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Where the next comparison is: the hub and the sibling pages. */
export function KeepComparing({ exclude }: { exclude?: string }) {
  return (
    <p className="max-w-3xl text-sm text-mut">
      <Link href={COMPARE_PATH} prefetch={false} className={LINK_CLASS}>
        Every singing app comparison
      </Link>
      {exclude ? ` puts ${exclude} and five more apps side by side with Suede Sing.` : " puts six apps side by side with Suede Sing."}
    </p>
  );
}

/**
 * WebPage + BreadcrumbList + FAQPage, joined to the publisher node the rest of
 * the site uses. The breadcrumb describes the trail CompareBreadcrumbs renders.
 */
export function compareJsonLd(page: {
  path: string;
  name: string;
  description: string;
  crumbs: readonly Crumb[];
  faq: readonly Faq[];
  type?: "WebPage" | "CollectionPage";
}) {
  const url = `${SITE_URL}${page.path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      ORG_PUBLISHER_NODE,
      {
        "@type": page.type ?? "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: page.name,
        description: page.description,
        inLanguage: "en",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        publisher: { "@id": ORG_ID },
        author: { "@id": AUTHOR_ID },
        dateModified: COMPARISONS_CHECKED,
        mainEntity: { "@id": `${url}#faq` },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: page.crumbs.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            item: `${SITE_URL}${c.path}`,
          })),
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: page.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
}

/** JSON-LD as a script tag, with "<" escaped so no string can close the tag. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
