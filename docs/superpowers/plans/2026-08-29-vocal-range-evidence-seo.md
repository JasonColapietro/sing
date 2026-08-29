# Vocal-range evidence and exposure implementation plan

## Objective

Implement every actionable finding from the 2026-08-29 three-agent SEO audit so Suede Sing can earn broader exposure for the query family "vocal range of X artist" without inventing facts, hiding disagreements, or sacrificing the crawlability of all 636 artist pages.

## Global Constraints

- Canonical repository: `/Users/jasoncolapietro/sing`; implementation worktree: `/private/tmp/sing-vocal-range-evidence-20260829`; base branch: `main` at `173cb5b1080ef42ab4cdba7a41dcabcf3d085bee`.
- Preserve the canonical checkout's user-owned untracked `.suede-graph-flo-xr/` directory. Do not edit or remove it.
- Never install, connect, authenticate, or use OpenSEO.
- Use test-driven development: add a focused failing test, run it and record the expected failure, then implement the minimum production change and record the passing run.
- Do not present an unsupported career-wide range endpoint or classical voice type as independently verified. Existing catalog endpoints may remain visible only as explicitly reported reference spans until claim-level evidence supports them.
- The evidence layer is sparse and server-only. It must not be added to `SINGERS_LITE` or the client bundle.
- All 636 artist pages must remain indexable, sitemap-listed, server-rendered, and reachable through raw-HTML internal links.
- The five GSC opportunity pages are `olivia-rodrigo`, `reba-mcentire`, `alex-warren`, `sam-smith`, and `arijit-singh`. Adele is included in the evidence pilot as a representative head artist.
- Jason Colapietro may be identified only as dataset editor/reviewer. Do not imply that he is a physician, speech pathologist, vocal scientist, conservatory classifier, or licensed vocal coach.
- Current title tests remain frozen except for factual/dispute corrections on the five GSC opportunity pages. Do not perform another site-wide title rewrite.
- Sitemap `lastModified` values must come only from explicit human review dates. Never use build time or `new Date()` as a fallback for singer URLs.
- Every externally linked evidence source must be visible to readers, must have a direct HTTP(S) URL, and must state the limited scope it supports. Licensed song scores prove an arrangement's written compass, not an artist's physiological or full-career range.
- No content publication, Search Console submission, deployment, or legacy-domain mutation occurs until the branch passes focused tests, the full test suite, lint, type checking, production build, task reviews, and a final whole-branch review.

## Task 1: Build the human-reviewed singer evidence layer

Create a sparse, server-only evidence model and the first six reviewed/disputed records.

### Required behavior

- Add `data/singer-evidence.json` outside `data/singers/`, keyed by singer slug.
- Add `lib/singer-evidence.ts` with strict types and helpers for looking up evidence, determining review status, choosing honest voice-type copy, grouping song/source evidence, and returning an explicit singer `lastModified` date only when reviewed.
- Add `lib/singer-evidence.test.ts` first and watch it fail before implementation.
- Validation must reject unknown slugs, invalid dates, non-HTTP(S) URLs, missing source scope, missing reviewer/date for reviewed or disputed records, and evidence that silently claims a licensed score proves a full-career range.
- Every one of the five GSC opportunity slugs plus Adele must have an explicit `reviewed` or `disputed` record. Every other artist must resolve to a truthful `pending` fallback rather than appearing individually verified.
- Record source title, publisher, direct URL, accessed date, supported claim, limited scope, confidence, and optional song/performance details.
- Research conclusions to encode:
  - Olivia Rodrigo: voice type disputed; published `GUTS` arrangements and HumMatch's researched cohort support song/corpus ranges, not the existing full-career B2-A#5 span.
  - Reba McEntire: her first-person MasterClass statement supports a peak-career span of about three octaves but no endpoints or definitive type; `Fancy` supports only that song's arrangement range.
  - Alex Warren: published arrangements support song-specific written compasses; no adequate source establishes a definitive baritone classification or full-career endpoints.
  - Sam Smith: a long-time-coach interview supports a baritone-to-tenor description, not a definitive countertenor classification; `Lay Me Down` supports only one song and must disclose octave convention.
  - Arijit Singh: a public artist bio supports "described as a rich baritone"; `Tum Hi Ho` supports one song; the existing definitive tenor wording is disputed.
  - Adele: expert analysis supports mezzo-soprano and chest mix to E5; `Rolling in the Deep` supports one song; no reviewed source in this task proves the full C3-A#5 career endpoints.
- Keep the existing generated singer catalog unchanged in this task. Evidence may challenge catalog classifications without silently rewriting source data.

### Verification

- Focused evidence tests pass with pristine output.
- Existing singer compile/data tests still pass.
- Commit the task and write the required implementer report with RED and GREEN evidence.

## Task 2: Make every artist page transparent, sourced, and structurally valid

Use the Task 1 evidence API in the shared artist template, covering all 636 pages.

### Required behavior

- Add focused failing page tests before production changes.
- Render a visible semantic breadcrumb `Famous vocal ranges > Artist name` and derive the JSON-LD BreadcrumbList from the same items.
- Remove unsupported `additionalProperty` from every `Person` JSON-LD node.
- Render an `Evidence and review` card on every artist page:
  - reviewed/disputed pages show review date, Jason Colapietro as dataset editor, confidence, visible source links, source scope, song/performance details, methodology link, and correction link;
  - pending pages explicitly state that individual evidence review is pending and that the displayed range is a reported reference span, not an independently verified physiological limit.
- Add a visible `What voice type is X?` answer to the four voice-type-led pages: Olivia Rodrigo, Reba McEntire, Alex Warren, and Sam Smith.
- Use attributed/disputed language rather than the catalog classification as settled fact for those four pages and for Arijit Singh.
- Correct only the five opportunity-page metadata/opening facts needed to remove unsupported certainty:
  - Olivia and Reba may say soprano/mezzo or contralto/mezzo classifications vary by source.
  - Alex must say published evidence does not establish a definitive classical type.
  - Sam must describe baritone-to-tenor territory and must not call the classification definitively countertenor.
  - Arijit must say he is described as a rich baritone and must not call him definitively tenor.
- Keep the current numeric catalog ranges labeled as reported reference spans; do not imply the six evidence records verify the full endpoints.
- Add WebPage `dateModified`, `reviewedBy`, and visible/schema citations only for records that actually carry review dates and sources.
- Do not add a Dataset node unless the implementation has a real tested consumer need; visible evidence is sufficient.

### Verification

- Tests render all six pilot pages and a pending artist page from the real server component.
- Tests prove dispute/attribution language is visible, source links resolve into rendered anchors, pending status is honest, visible/JSON-LD breadcrumbs match, and `Person.additionalProperty` is absent.
- The existing all-636 title/H1 coverage tests pass after updating only the five factual/dispute cases.
- Commit the task and write the required implementer report with RED and GREEN evidence.

## Task 3: Publish methodology, accountability, corrections, and accurate freshness

Create the shared editorial trust surface and connect it to the site.

### Required behavior

- Add focused failing tests before production changes.
- Extract the existing method disclaimer into a shared server-safe editorial module used by the singer hub, artist pages, and methodology page.
- Create `/singers/methodology` with canonical metadata and visible sections covering scope, source hierarchy, song-score limitations, studio/live/register distinctions, dispute handling, confidence, human review, corrections, and why reported range differs from comfortable tessitura.
- Create `/contact` with canonical metadata and a correction workflow pointing to the verified address `support@suedeai.ai`. Ask for artist/page URL, disputed claim, recording/version, timestamp, supporting URL, and suggested correction.
- Link methodology and contact/corrections from the site footer and every artist evidence card.
- Add both routes to the sitemap.
- Add accurate `lastModified` only to reviewed/disputed singer sitemap entries using the explicit evidence review date. Pending singer entries must omit it.
- Add a reserved-slug guard covering at least `records`, `genre`, `voice-type`, and `methodology` so a generated singer cannot collide with static singer routes.
- Render singer-hub FAQ questions as identifiable headings while keeping visible text and structured text synchronized.

### Verification

- Editorial-route tests prove metadata, canonical URLs, required methodology sections, correction fields, support address, footer links, and exactly one sitemap entry per new route.
- Sitemap tests prove dated singer entries use explicit review dates, pending entries have no `lastModified`, and no build-time fallback exists.
- Reserved-route collision tests fail on a fixture collision and pass on the real catalog.
- Commit the task and write the required implementer report with RED and GREEN evidence.

## Task 4: Promote opportunities and reduce singer-hub bloat without orphaning artists

Improve internal authority flow and initial rendering cost while preserving raw-HTML discovery of all 636 leaves.

### Required behavior

- Add focused failing tests before production changes.
- Add Olivia Rodrigo, Reba McEntire, Alex Warren, Sam Smith, and Arijit Singh to the curated homepage voice module with descriptive link context. Keep the existing build-breaking slug resolution guard.
- Fix the nearby stale `all 420` singer-count claim using the existing dynamic singer count. Do not alter Atlas-specific counts without separate proof.
- Remove the 636-entry `ItemList` and duplicate partial Organization declaration from singer-hub JSON-LD. Keep a lean CollectionPage, WebSite reference, publisher reference, and synchronized FAQ where useful.
- Keep all 636 raw-HTML artist anchors through a compact server-only A-Z crawl index rendered on `/singers`.
- Cap the initial rich interactive directory to 48 rows and add an accessible progressive `Load more` control. Search, sort, voice filters, and genre filters continue operating over the full catalog and reset visible batching appropriately.
- Do not make crawl discovery depend on JavaScript or the Load more button.
- Add a regression budget for hub JSON-LD and initial rich-row count. Test the compact crawl index contains every singer exactly once.

### Verification

- Homepage tests prove all five current opportunity artists have real links.
- Internal-linking tests prove every artist remains in raw server HTML through the compact crawl index.
- Directory tests prove 48 initial rich rows and progressive expansion behavior.
- Hub-schema tests prove no ItemList, no duplicate Organization body, synchronized FAQ headings/text, and a bounded JSON-LD payload.
- Run focused tests, then the full suite, lint, type checking, and production build.
- Commit the task and write the required implementer report with RED and GREEN evidence.

## Final integration and release gate

- Run a whole-branch review over the merge-base-to-head diff and resolve every Critical or Important finding through one reviewed fix wave.
- Verify the requirements above against current source and generated output, not against implementer reports alone.
- Push the branch, create a PR, read back CI and review state, merge only when green, wait for the exact production deployment, and verify deployed HTML, routes, sitemap, schema, internal-link counts, response codes, and deployment commit.
- Inspect `https://sing.vercel.app/singers/adele` and the owning Vercel project. If ownership and routing are unambiguous, permanently redirect or retire the stale legacy surface and verify the result. Do not mutate an ambiguous project.
- Record the exact code, PR, merge, deployment and live verification state separately.
