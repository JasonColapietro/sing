/** Keep the free studio's offer consistent wherever its app node is defined. */
export const FREE_STUDIO_OFFER = {
  "@type": "Offer",
  name: "Free pitch meter and vocal range test",
  description:
    "Guided practice includes five free minutes a day; additional practice and Pro features require a paid plan.",
  price: "0",
  priceCurrency: "USD",
  availability: "https://schema.org/InStock",
} as const;
