# Popular-Song Vocal Pages — MVP Scope

Mode: MVP Scope. Date: 2026-09-01. Target: sing.suedeai.ai.

## Full request

An SEO surface of factual pages about modern popular songs: original key, vocal range required, difficulty, and a "can you sing it" comparison against the visitor's saved range test. Zero licensed content (no lyrics, no melody transcription, no audio). Cross-linked with the 357-singer library. Long-term this could cover hundreds of songs, aggregation hubs ("songs for tenors", by decade, by genre), transposition advice, and playlist-style collections.

## Hypothesis

We believe singers searching for a specific popular song's vocal facts ("what key is X in", "X vocal range", "is X hard to sing") will land on these pages and try the range test, because the page answers the factual question and then makes it personal.

## MVP slice (the thinnest shippable thing)

A launch catalog of roughly two dozen popular songs, each with one indexable page of vocal facts (key, range, span, difficulty, year, artist) plus a personal "can you sing it" verdict for visitors with a saved range test, listed from one hub section and cross-linked with the singer library.

## SPIDR cuts

| Axis | Shipped | Deferred |
|---|---|---|
| Path | One page type: the song vocal-fact page, plus one simple hub listing | Aggregation hubs ("songs for tenors", by decade), collections |
| Interface | Web (the product's only surface) | none |
| Data | ~24 songs, every one by an artist already in the singer library, skewed to currently searched titles | Catalog scale-out beyond artists in the library; automated data pipelines |
| Rules | Difficulty derived deterministically from the song's range facts | Per-voice-type transposition advice ("sing it in D instead"); alternate-key data |
| Spike | none needed: the singer library already proved the cited-approximate-facts pattern | |

## Requirements

- R1. Each catalog song has a page presenting: title, artist, year, original key, lowest and highest commonly cited note, range span, a difficulty read, and a short editorial paragraph on what makes it easy or hard to sing.
- R2. Pages contain zero licensed content: no lyric lines, no melody notation, no audio of the song. Titles, artist names, and musical facts only.
- R3. Range and key figures are presented as commonly cited approximations with the same disclaimer framing the singer library uses, and each song names the source context for its cited extremes where known.
- R4. When the song's artist exists in the singer library, the song page links to that singer's page.
- R5. A visitor with a saved range test sees a personal verdict on the song page: whether the song's cited range fits inside their saved range, and by how much it misses when it does not.
- R6. A visitor with no saved range sees an invitation to take the range test instead of an empty comparison.
- R7. All song pages are indexable, present in the sitemap, and listed from a hub section that is reachable from existing navigation.
- R8. The popular-song pages are visually and verbally distinct from the public-domain songbook: they never promise sing-along playback, and the songbook's pages are unchanged.
- R9. An unknown song slug returns a 404.

## Acceptance criteria for the slice

- Given any catalog song page, When it renders, Then key, low note, high note, span, difficulty, year, and artist all appear, and no lyric line or melody notation appears anywhere on the page.
- Given a song whose artist is in the singer library, When the page renders, Then a link to that singer's library page is present.
- Given a visitor with a saved range test covering the song's cited range, When they open the page, Then the verdict states the song fits their range.
- Given a visitor whose saved range misses the song's cited range, When they open the page, Then the verdict states which end misses and by how many semitones.
- Given a visitor with no saved range, When they open the page, Then a link to the range test appears where the verdict would be.
- Given the live sitemap after deploy, Then every catalog song URL appears in it, and the existing sitemap noindex guard test still passes.
- Given any catalog song URL on the live site, Then it returns 200 with no robots noindex in headers or markup.
- Given a slug not in the catalog, Then the route 404s.

## Deferred

- Aggregation hubs (by voice type, decade, genre): wait until the catalog is big enough for a hub to be more than a stub.
- Transposition advice and alternate keys: needs a settled difficulty model first.
- Catalog scale-out beyond library artists: cross-linking is the launch moat; scale after the pattern proves.
- Any playback, audio preview, or melody rendering: licensing wall, permanently out unless licensed.

## Success metrics

- GSC impressions and clicks on the new URLs. Baseline 0 by definition.
- Percent of song-page visitors who start the range test. Baseline none, target `[TBD]` pending first data.

## Ambiguity table

| ID | Requirement | Score | Note / Question |
|----|-------------|-------|-----------------|
| R1 | Facts per song page | 1 | Clear. |
| R2 | Zero licensed content | 1 | Clear. Facts and titles are not copyrightable; lyrics and melodies are. |
| R3 | Data provenance | 2 | Assuming commonly cited published figures (sheet-music keys, circulated range notes), framed as approximate exactly like the singer library. |
| R5 | Personal verdict source | 1 | Clear. The saved range test already stores the needed figures. |
| R7 | Catalog selection | 2 | Assuming ~24 songs by library artists, skewed to currently searched titles. Easy to amend after launch. |
| — | Difficulty model | 2 | Assuming a deterministic read derived from span and where the range sits. Exact thresholds are a plan detail. |

No requirement scores 3. Both 2s proceed on stated assumptions.

## Open questions

1. [Clarify] Catalog list is an editorial pick of ~24. Amendments welcome after launch; adding a song is a data-only change.
2. [Clarify] Difficulty thresholds are assumed deterministic from range facts. If a song feels mis-rated, the model gets tuned, not the data.
3. [TBD] Target for song-page visitors starting the range test. No baseline until first GSC/analytics data.

## Recommended next step

suede-plan, then build in this worktree. No unresolved 3s.
