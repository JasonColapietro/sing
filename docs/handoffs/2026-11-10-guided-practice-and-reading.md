# Handoff: more guided practice and more reading, 2026-11-10

Written for a fresh Claude Code session. Nothing in the plan is built yet.

## What the owner decided

- More guided practice and more reading on sing.suedeai.ai: approved.
- Songs: no new songs. The iPhone songbook was synced to the web songbook
  (done, see below) and the owner wants no more time spent on songs.
- iPhone annual price to $39.99: done in code (see below); the live price is
  the owner's to change in App Store Connect.
- "Be sure to test it."

## Where things are

This repo, branch `guided-practice-and-reading` (pushed, no PR yet):

- Design, approved by the owner:
  `docs/superpowers/specs/2026-11-10-guided-practice-and-reading-design.md`
- Plan, written but not yet confirmed by the owner:
  `docs/superpowers/plans/2026-11-10-guided-practice-and-reading.md`

The owner was asked whether the plan captures what they want and how to run
it (one session building it all, or a worker per task). They answered by
asking for this handoff, so confirm both with them before starting.

Suede-AI/suede-voice, branch `annual-price-39-99` (pushed, no PR yet), two
commits on top of `sing/v1.0`:

- Annual price $29.99 to $39.99 in both `SuedeVoice.storekit` copies and in
  `SubscriptionReviewPathTests.swift`. Android fixtures and
  `docs/play-store/BILLING_SETUP.md` still say $29.99; the owner has not said
  whether Android follows.
- `Resources/songs.json` regenerated from this repo's
  `components/songs/data.ts` (same 26 ids and order, `excerpt` dropped, file
  formatting preserved). The Scarborough Fair snapshot in
  `V14FeatureTests.swift` and the breath-mark snapshot in
  `SongLyricsTests.swift` were updated by hand to the new data.

**Neither suede-voice commit has been tested.** They were made in a Linux
cloud workspace with no Xcode. First job on a Mac: run
`xcodebuild test ... -only-testing:SuedeVoiceTests` (command in that repo's
README) and fix whatever the song sync or price change broke.

## What to do next

1. On a Mac, run the iPhone tests on `annual-price-39-99`; fix; open a PR.
2. In this repo, execute the plan task by task. Task 1 (npm ci, tests, lint,
   build) has not been run, so the baseline is unverified.
3. Task 7 of the plan is the full test pass the owner asked for. It ends in a
   PR; do not merge or deploy without the owner's word.
4. After that merges, write the iPhone plan the design calls project 2: the
   five packs as a seed file and routines, the five chapters in `book.json`,
   the rebuilt PDF. The iPhone app has no multi-week programs; building them
   is out of scope.

## Things found while planning that the plan depends on

- `PRO_PACKS` order today is `belt-prep`, `head-voice-builder`, `mix`.
- `lib/programs.test.ts` caps the program count at six and snapshots the Mix
  and Measured Voice calendars; the plan widens the first and keeps the second.
- Week 1 of every Pro program must be free content only, 90 to 300 capped
  seconds a day; Pro days must total 10 to 20 minutes.
- Finished program cards have per-program pre-paint sizes
  (`lib/prepaint-config.ts`, `e2e/cls.mjs`).
- The glossary and vocal contracts are generated; regenerate, never hand-edit
  (`contracts/README.md`).

## Risk the owner accepted knowingly

The new exercises and chapters will be AI-written from general vocal pedagogy
and the existing book, with an independent read but no voice teacher's review.
