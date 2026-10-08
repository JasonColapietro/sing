# Sing search-intent review — 2026-10-08

Scope: source review against `main` at `c759668`, public homepage/analyzer inspection, and public search results. This is a reviewable optimization proposal, not a deployed change or a ranking forecast.

## Keyword-to-page decisions

| Page | Primary intent / candidate query | Supporting evidence | Change and boundary |
| --- | --- | --- | --- |
| `/` | online singing practice; live pitch feedback; Suede Sing | The [live homepage](https://sing.suedeai.ai/) exposes pitch, songs, lessons, range and analyzer tools. [Clearsing](https://clearsing.app/) appears for browser singing-practice searches and describes live pitch feedback and exercises. | Title/H1/body describe singing practice and live feedback. First screen and SoftwareApplication offer distinguish the free meter/test from the guided-practice limit. Keep this the product overview, not a second range-test landing page. |
| `/range` | vocal range test; find my vocal range; voice type estimate | [ToneGym's vocal range test](https://www.tonegym.co/tool/item?id=vocal-range-test-tool) uses low/high note capture. [Voice Type Test](https://vocalrangecalculator.com/voice-type-test/) shows note, octave and category intent, with a range-versus-type distinction. Sing's source already implements the low/high guided test and a pitch meter. | Shorter title describes a voice-type estimate. Initial rendered H1 names both tools; visible instructions tell search visitors to choose Range test. Default Pitch mode, query behavior and microphone activation remain unchanged. Link to the existing voice-type reference instead of creating a competing page. |
| `/analyze` | voice spectrogram; tone analyzer online | The [live analyzer](https://sing.suedeai.ai/analyze) and `components/analyze/analyze-client.tsx` expose a spectrogram, harmonic energy and cycle-dose estimates. | Shorter title and description retain live-spectrogram intent. First-screen copy describes what the microphone produces and calls load an estimate. No new diagnostic, accuracy or voice-classification promise. |
| `/atlas/vocal-range-by-voice-type` | vocal ranges by voice type; voice type reference | Existing range guide explains that type involves more than endpoints; the existing reference provides the informational destination. | Add one contextual link from the range guide. Keep the guide informational and `/range` transactional. |
| `/singers/*`, including contralto and artist pages | singer-specific range/type references | Existing titles and evidence require page-specific query analysis before changing them. Public references and category labels alone do not justify new artist claims. | No artist metadata/facts changed; retain existing source and uncertainty treatment. |

Public search results are qualitative intent and competition proxies. They are not keyword volume, difficulty scores, stable rank measurements or evidence of future traffic. Results vary by engine, date and locale. No search volume or traffic uplift is invented. Private analytics and email identifiers are deliberately excluded from this repository.

## Concrete audit findings

- Homepage metadata and first screen presented broad free singing lessons/studio language, while the same page discloses a three-minute daily guided-practice limit. New copy moves the boundary into the first screen and describes it in the existing free offer.
- `/range` had range-test metadata but initially rendered only “Pitch meter” as its H1. The heading now identifies both tools before hydration, and both the first screen and how-to explain the tab selection.
- `/range` said it “shows your voice type”; the guide already correctly treated the result as an overlap estimate. The metadata now agrees with that limit.
- `/analyze` had an expansive title and a first-screen statement about actual vocal-fold work. The entry copy now names the observable display and estimated load.
- URLs, canonicals, indexing rules, sitemap, payment behavior and microphone permission flow are preserved. No extra FAQ or HowTo schema is introduced. Existing guide schema continues to derive from the same visible content.

## Source and claim checks

The existing keyword target map now assigns “online singing practice” to the homepage; `/studio` retains “pitch training”. Historical unlinked volume/difficulty comments were removed rather than carried forward as verified evidence.

Implementation checked: `app/page.tsx`, `app/range/page.tsx`, `components/range/voice-test.tsx`, `components/range/range-test.tsx`, `components/analyze/analyze-client.tsx`, `lib/guides.ts`, `lib/free-cap.ts`, `lib/query-ownership.ts`.

The public primary brand appears as **Suede AI** in homepage copy; Suede Sing remains the product name. The proposal adds no “best”, offline, accuracy or unlimited-free claim. Vocal range is a session measurement; voice type is an estimate. Existing audio/privacy and paid-plan boundaries remain intact.

Official review guidance: [Google title links](https://developers.google.com/search/docs/appearance/title-link), [helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), and [structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies). A distinct useful page is the target, not keyword repetition or additional schema for its own sake. No rich-result eligibility or Google-selected snippet is promised.

## Measurement after an approved release

Record the release date. Compare 28-day windows by exact landing page and query, with device/country and average position alongside clicks, impressions and CTR. Keep branded queries separate from non-branded tool queries. Check whether range visitors reach the guided test and analyzer visitors enable the microphone, using existing consented measurement only. Low CTR alone does not establish a title problem. Do not change artist claims without reviewing the page's queries and evidence.

## Verification receipt

- `npm test -- --maxWorkers=2`: 105 files passed, 1 file skipped; 1,312 tests passed, 5 skipped.
- `npm run lint` and `npx tsc --noEmit`: passed. Changed metadata/keyword files were linted again after keyword-map alignment.
- `npm run build -- --webpack`: passed, 965 static pages generated. Default Turbopack build was blocked locally: sandboxed Google Fonts requests failed; a retry with network access hit an environment process/port permission failure while evaluating an existing CSS module. No repository build setting was changed.
- Generated HTML for `/`, `/range`, `/analyze`: each has one H1, one canonical, expected title/description, and parseable JSON-LD.
- Isolated headless Playwright browser, 375 × 812: all three routes returned HTTP 200, no horizontal overflow and no page errors. Range/Pitch tab switching and `?mode=range` deep-link selection passed. The microphone was not enabled; this is a content/navigation check, not a pitch-accuracy test.
- Read-only production check: all three public routes currently return HTTP 200 and self-canonicalize to `https://sing.suedeai.ai`.
- The local build used no production environment. Existing `lib/site.ts` falls back to `https://sing-red.vercel.app` unless `NEXT_PUBLIC_SITE_URL` is set. Consequently the local HTML canonical uses that fallback; this proposal preserves the existing production environment behavior and makes no canonical migration.

Ship gate: reviewable draft; no deployment performed. Search impact remains unmeasured until an approved release is crawled and comparable query/page data exists.
