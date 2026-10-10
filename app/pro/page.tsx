import { ProClient } from "@/components/pro/pro-client";
import { AUTHOR_ID, AUTHOR_NODE } from "@/lib/author";
import { withCanonicalOpenGraph } from "@/lib/og";
import {
  formatPrice,
  PRICING,
  PRO_FAQ,
  type CheckoutPlan,
} from "@/lib/pro-shared";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { SITE_URL } from "@/lib/site";
import { routeKeywords } from "@/lib/keywords";

export const metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/pro"),
  title: "Suede Pro: An Online Vocal Coach for Singers",
  description:
    "Suede Pro Early Access is $79 once for lifetime access (the $4.99 monthly plan is sold out): adaptive coach, per-note analytics, take analysis, warmup packs and two books.",
  alternates: { canonical: `${SITE_URL}/pro` },
});

function offerFor(plan: CheckoutPlan) {
  const { amount } = PRICING[plan];
  // Schema wants a plain decimal string, so "79" is written "79.00" here even
  // though the page shows it without the cents.
  const price = amount.toFixed(2);
  const offer = {
    "@type": "Offer",
    url: `${SITE_URL}/pro`,
    name:
      plan === "lifetime"
        ? "Suede Pro lifetime access"
        : "Suede Pro monthly",
    description:
      plan === "lifetime"
        ? "One payment for lifetime access. No renewal."
        : `Sold out. Renews monthly at ${formatPrice(amount)} for existing subscribers only.`,
    price,
    priceCurrency: "USD",
    availability:
      plan === "monthly"
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
    priceSpecification: {
      "@type":
        plan === "monthly" ? "UnitPriceSpecification" : "PriceSpecification",
      price,
      priceCurrency: "USD",
    },
  };

  if (plan === "monthly") {
    // "4.99 USD per one month" — recurring, not a one-off price that
    // happens to read 4.99. Lifetime deliberately has no reference quantity.
    return {
      ...offer,
      priceSpecification: {
        ...offer.priceSpecification,
        referenceQuantity: {
          "@type": "QuantitativeValue",
          value: 1,
          unitCode: "MON",
        },
      },
    };
  }

  return offer;
}

/** Lifetime is the only purchasable offer; monthly is listed as SoldOut. */
const OFFERS = [offerFor("monthly"), offerFor("lifetime")];

/**
 * The page that states the price carried no structured data at all, so the
 * question an answer engine is most likely to be asked about this app — what
 * Pro costs — had no machine-readable answer anywhere on the site. The
 * homepage's SoftwareApplication offer is the free studio, priced 0, which
 * says nothing about the paid tier.
 *
 * The prices here are the prices the page renders — both read PRICING. The
 * FAQ is built from PRO_FAQ, the same array the page displays, so the marked-up
 * answers cannot drift from the visible ones.
 */
const PRO_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    // The publisher, spelled out rather than pointed at. Every template on
    // this site referenced this @id without defining it, so a crawler
    // reading one page on its own resolved the pointer to nothing.
    ORG_PUBLISHER_NODE,
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
      // SoftwareApplication, not Product. A subscription is not a shippable
      // good: typing it Product is what enrols the page in Google's Merchant
      // listings report, which then demands shippingDetails and
      // hasMerchantReturnPolicy — fields that do not honestly exist for a
      // monthly plan, so the warnings would sit open forever. Matches the
      // free tier's node on the homepage and the rest of the Suede estate.
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/pro#product`,
      name: "Suede Sing Pro",
      description:
        "An adaptive daily practice plan, per-note accuracy and range history, pitch analysis on every recorded take, pro warmup packs, scoring history for every song, cloud sync, and two books with PDFs.",
      applicationCategory: "MusicApplication",
      operatingSystem: "Web Browser",
      publisher: { "@id": "https://suedeai.ai/#organization" },
      // isPartOf, not isRelatedTo: isRelatedTo only takes Product and Service
      // on both ends, and neither this node nor /#app is either one.
      isPartOf: { "@id": `${SITE_URL}/#app` },
      url: `${SITE_URL}/pro`,
      offers: OFFERS,
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
