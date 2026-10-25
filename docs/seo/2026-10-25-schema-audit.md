# Schema markup audit — 2026-10-25

Audited current main after the earlier application/composition vocabulary fixes
and PR #248. Those fixes were already present and were not duplicated.

## Scope and findings

Rendered 949 public page variants in memory, including the singer and song
catalogs, voice-course pages, books, guides, and product pages. All 949 emitted
parseable JSON-LD. Checked the emitted types and properties, their domains, and
typed property values against Schema.org's current vocabulary. URL references,
enumeration URLs, and ISO durations were treated as their supported values.
No remaining unknown vocabulary, domain, or checked value-type issues were found.
This vocabulary check does not establish Google rich-result eligibility.

Three confirmed issues were fixed:

| Location | Before | After |
| --- | --- | --- |
| Singer profiles: `Person.nationality` | A country-name string, including slash-joined dual nationalities | Named `Country` entities; dual nationalities remain separate entities |
| Singer evidence: `CreativeWork.publisher` | A publisher-name string | A named `Organization`, preserving the visible source name |
| Popular-song pages: `MusicRecording.byArtist` | Every artist was a `MusicGroup`, including solo singers and duets | Solo `Person` entities, the two actual groups, and individual collaboration credits |

Artist credits are explicit where the display credit names a group or multiple
people. They do not come from singer-library links: those links may name only
one member of a band or one vocalist in a collaboration. Existing visible
credits and source facts are preserved.

Reference: [nationality](https://schema.org/nationality),
[publisher](https://schema.org/publisher),
[byArtist](https://schema.org/byArtist), and
[Google's structured-data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

## Verification

- Eleven new rendering regressions failed before the fixes and passed after.
- Targeted schema, popular-song, and singer-evidence tests: 85 passed.
- Full local suite: 3,235 Vitest tests passed, 8 skipped; 12 Node tests passed.
- TypeScript, ESLint, and whitespace checks passed.
- The 949-page in-memory audit completed without rendering or JSON parsing errors.
- Local production builds could not finish because the disk filled up during
  page export (`ENOSPC`). The PR must pass the complete CI production build and
  browser suites before merging.

The temporary audit harness and downloaded vocabulary are not shipped. No
pricing, indexing policy, visible copy, or account/payment behavior was changed.
