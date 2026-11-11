# Software-app warning follow-up — 2026-11-11

Google's live Rich Results Test found seven valid application items across the
homepage (three), `/voice` (two), and `/pro` (two). All issues were non-critical.

## Observed warnings

- All seven application occurrences: missing optional `aggregateRating`.
- `/pro`, free Suede Sing node: missing optional `offers`.
- `/pro`, Suede Pro monthly offer: invalid object type for optional
  `priceSpecification` (`UnitPriceSpecification`). This type is Schema.org
  vocabulary, but Google's software-app parser does not accept it here.

Original results:

- [Homepage](https://search.google.com/test/rich-results/result/r%2Fsoftware-apps?id=4fCq4ZbSBo8_Nnm4puki9g)
- [Native apps](https://search.google.com/test/rich-results/result/r%2Fsoftware-apps?id=RZgPMvQXonxKzEqYVwJXUw)
- [Pro](https://search.google.com/test/rich-results/result/r%2Fsoftware-apps?id=4S5wyQWWspgdwLgJrJNskg)

## Correction

Share the homepage's existing accurate free offer with `/pro`. Keep the free
pitch meter and range test distinct from the five-minute guided-practice limit.

Use Google's supported `Offer.price` and `priceCurrency` directly for paid
offers. Remove redundant price-specification nodes; retain the monthly name,
sold-out status, legacy-subscriber explanation, and the one-time lifetime offer.
Prices still come from the same `PRICING` constants as the page.

## Ratings require real data

Leave `aggregateRating` and `review` absent until genuine reviews of the specific
app are collected and displayed on the corresponding page. Do not fabricate a
rating, substitute the organization's rating, or aggregate App Store/Google Play
ratings into the site's markup. Google's [review guidelines](https://developers.google.com/search/docs/appearance/structured-data/review-snippet#guidelines)
prohibit aggregating ratings from other websites and require visible review
content. These optional warnings are expected to remain.

Regression coverage checks the shared free offer, paid prices/currency/status,
absence of unsupported price specifications, and absence of invented ratings.
