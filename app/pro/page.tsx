import { ProClient } from "@/components/pro/pro-client";
import { AUTHOR_ID, AUTHOR_NODE } from "@/lib/author";
import { PRO_FAQ } from "@/lib/pro-shared";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Suede Pro — The Vocal Coach on Top of the Free Studio",
  description:
    "Suede Pro adds an adaptive coach, per-note analytics, take analysis, pro warmup packs, the full songbook, and two books with PDFs — while the browser studio stays free.",
  alternates: { canonical: `${SITE_URL}/pro` },
};

/**
 * The page that states the price carried no structured data at all, so the
 * question an answer engine is most likely to be asked about this app — what
 * Pro costs — had no machine-readable answer anywhere on the site. The
 * homepage's SoftwareApplication offer is the free studio, priced 0, which
 * says nothing about the paid tier.
 *
 * The price here is the price the page renders. The FAQ is built from PRO_FAQ,
 * the same array the page displays, so the marked-up answers cannot drift from
 * the visible ones.
 */
const PRO_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/pro#webpage`,
      url: `${SITE_URL}/pro`,
      name: "Suede Pro",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      publisher: { "@id": "https://suedeai.ai/#organization" },
      inLanguage: "en",
      mainEntity: { "@id": `${SITE_URL}/pro#product` },
      // The page's own byline names the person who builds this; the node makes
      // that machine-readable instead of leaving the app unattributed.
      author: { "@id": AUTHOR_ID },
    },
    AUTHOR_NODE,
    {
      "@type": "Product",
      "@id": `${SITE_URL}/pro#product`,
      name: "Suede Sing Pro",
      description:
        "An adaptive daily practice plan, per-note accuracy and range history, pitch analysis on every recorded take, pro warmup packs, the full songbook, cloud sync, and two books with PDFs.",
      brand: { "@id": "https://suedeai.ai/#organization" },
      category: "Vocal training subscription",
      isRelatedTo: { "@id": `${SITE_URL}/#app` },
      offers: {
        "@type": "Offer",
        url: `${SITE_URL}/pro`,
        price: "9.99",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        // "9.99 USD per one month" — the recurring shape, rather than a
        // one-off price that happens to read 9.99.
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "9.99",
          priceCurrency: "USD",
          referenceQuantity: {
            "@type": "QuantitativeValue",
            value: 1,
            unitCode: "MON",
          },
        },
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/pro#faq`,
      isPartOf: { "@id": `${SITE_URL}/pro#webpage` },
      mainEntity: PRO_FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

export default function ProPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PRO_JSON_LD) }}
      />
      <ProClient />
    </>
  );
}
