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

const PRO_TITLE = "Online Vocal Coach for Singers: Suede Pro";

export const metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/pro"),
  title: PRO_TITLE,
  description: `Online vocal coach for singers: the full adaptive plan, per-note analytics, take analysis and two books on top of the free studio. ${formatPrice(PRICING.lifetime.amount)} once, for life.`,
  alternates: { canonical: `${SITE_URL}/pro` },
  // Declared, with no `images`: the helper then leaves the sitewide card out
  // and Next attaches the route's own opengraph-image.tsx beside this file
  // (versioned URL, alt, size and type), copying it to twitter:image. Title
  // and description still come from the helper.
  openGraph: { type: "website" },
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
        : // Legacy subscribers renew at their own (older) price, so the
          // renewal clause names no amount; the price field still carries 4.99.
          "Sold out. Existing subscribers keep renewing at the price they signed up at.",
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
      // The site the WebPage below says it is part of. Only the homepage
      // defined this node, so a crawler reading /pro on its own resolved the
      // pointer to nothing. Same shape as app/page.tsx's.
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: "Suede Sing",
      publisher: { "@id": "https://suedeai.ai/#organization" },
    },
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/pro#webpage`,
      url: `${SITE_URL}/pro`,
      name: PRO_TITLE,
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
      // The free studio the paid tier is part of: the identifying properties
      // of the homepage's WebApplication node, so the `isPartOf` below
      // resolves on this page. The full node (feature list, the free offer)
      // stays on the homepage, as ORG_PUBLISHER_NODE does for the publisher.
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: "Suede Sing",
      url: `${SITE_URL}/`,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web Browser",
      publisher: { "@id": "https://suedeai.ai/#organization" },
    },
    {
      // SoftwareApplication, not Product. A subscription is not a shippable
      // good: typing it Product is what enrols the page in Google's Merchant
      // listings report, which then demands shippingDetails and
      // hasMerchantReturnPolicy — fields that do not honestly exist for a
      // monthly plan, so the warnings would sit open forever. Matches the
      // free tier's node on the homepage and the rest of the Suede estate.
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/pro#product`,
      name: "Suede Pro",
      description:
        // Song scores and their trend are free on every song summary, so the
        // paid tier is not described by them. The free plan shows the first
        // two coach steps each day, so planning is described as the full plan,
        // not as something only Pro has (lib/pro.ts PLAN_ROWS "Coach plan").
        "The full adaptive daily practice plan (the free plan shows its first two steps), per-note accuracy and range history, pitch analysis on every recorded take, pro warmup packs, no daily limit on guided practice, cloud sync, and two books with PDFs.",
      applicationCategory: "EducationalApplication",
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
