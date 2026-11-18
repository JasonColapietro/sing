# Technical SEO audit — 2026-11-18

Scope: live Suede Sing crawl controls and high-intent entry pages, plus repository regressions at `c6b26f7`. No body, headline, layout, CSS, visual asset, pricing or production deployment changes.

## Verified live

- Homepage returns 200, title `Online Singing Practice with Live Pitch | Suede Sing`, one self-canonical, index/follow and large-image preview allowance. Description accurately separates free tools from five daily guided minutes.
- `/studio`: pitch training for singers and real-time feedback.
- `/range`: free vocal range test and voice-type estimate.
- `/warmups`: guided vocal warm-up exercises.
- `/voice`: iPhone/Android singing app downloads, distinct from browser practice.
- `/pro`: paid online vocal coaching offer.
- All five entry pages have unique titles/descriptions, one self-canonical, one H1, indexable robots and valid JSON-LD JSON. Schemas distinguish web and native applications and retain sourced organization/person identities.
- `robots.txt` allows public crawling, blocks `/api/` in wildcard and each named bot group, and advertises primary and AI-instructions sitemaps.
- Primary sitemap parses as XML and contains **945 unique HTTPS page URLs**, including **33 `/guides` URLs** and zero legacy `/blog` URLs. This is a sitemap integrity check, not a crawl of every listed page.
- Legacy `/blog` resolves to `/guides`; `/guides` returns 200.

## Regressions

On an isolated clean worktree of origin/main:

```
vitest run lib/on-page-seo.test.tsx lib/robots.test.ts lib/robots-meta.test.tsx lib/route-metadata.test.tsx lib/sitemap.test.ts
# 5 files, 161 tests passed
vitest run lib/schema-entities.test.tsx lib/seo-section-structure.test.tsx
# 2 files, 31 tests passed
```

Total: **192 passing assertions**. Published singer indexing is explicitly protected, including pending review-status fixtures; account/private/gated exclusions remain intentional.

## Outcome

No verified crawl or metadata defect requiring a code change was found in this scope. Existing page-level search intent is already differentiated; no keyword stuffing or visual/headline changes are warranted. Search Console impressions, indexing coverage and query volumes were not available in this audit, so this document does not claim ranking gains or demand estimates.

## Founder site spot-check

`https://jasoncolapietro.com/` exposes a self-canonical, descriptive founder/engineer/author title and description, one H1 and parseable Person, Organization, WebSite, ProfilePage/WebPage, Book and FAQPage JSON-LD. Public robots allows crawling and advertises both site and compendium sitemaps. Root sitemap is valid XML with 20 page URLs plus the homepage image entry. Missing explicit robots meta is not a defect: default indexing remains allowed. `JasonColapietro/JasonColapietro` is the GitHub profile repository, not verified as the founder site's source; no source edits were made there.
