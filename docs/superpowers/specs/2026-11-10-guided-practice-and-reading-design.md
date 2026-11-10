# More guided practice and more reading: design

Date: 2026-11-10. Status: awaiting owner approval. Nothing here is built yet.

## Intent and why

The owner wants Suede Sing to give a paying singer far more to do and read,
so that Pro is plainly worth its price on the site and a $39.99 year is
plainly worth it on iPhone. Both products are already paywalled; the gap is
depth. Today Pro adds 3 exercise packs (19 exercises), 2 programs and 2 books.
A subscriber who finishes "Mix in 4 weeks" has one long program left.

The owner chose, in conversation on 2026-11-10:

- More guided practice: yes.
- More reading material: yes.
- Songs: hold. No new songs of any kind in this work.
- iPhone annual price to $39.99: done separately on branch
  `annual-price-39-99` in Suede-AI/suede-voice.

Everything below the choices above is the designer's proposal, marked "call".

## Goals

1. Pro exercise packs go from 3 to 8, and Pro exercises from 19 to about 59.
2. Pro programs go from 2 to 7. Every existing and new Pro pack has a program
   that teaches it.
3. The Measured Voice gains one chapter per new program (5 chapters), and the
   free glossary roughly doubles from 42 terms.
4. Every number on /pro, the homepage and llms.txt that counts these things
   stays derived and test-checked, as `lib/pro-inventory.ts` requires.
5. The iPhone app gets the same new packs and chapters in a second project.

## Non-goals

- Songs, the songbook, and the popular-song range pages.
- Any change to prices, plans, Stripe, or where the free tier ends
  (5 guided minutes a day, week 1 of a Pro program free, 3 free chapters per
  book all stay as they are).
- Visual redesign of any room or page.
- Android, the Chrome extension, GuitarHub.
- New audio analysis. Nothing new is measured.

## Anti-goals

These make the work a failure even if it ships:

- Padding. A new exercise that is an existing one renamed or transposed, or a
  program that is another program's calendar reshuffled.
- Any claim the app cannot back. The app scores pitch against a target and
  measures vibrato rate on a hold. It does not hear register, loudness, strain
  or tone. New copy must not say or imply otherwise
  (`contracts/strain-prohibition.test.ts`, `lib/voice-lessons.test.tsx`).
- Unsafe instruction. Belt, low-note and stamina content must stay inside what
  book chapters 1, 4, 6 and 17 already teach: stop on pain or hoarseness, no
  pushing air for volume, no grit or rasp taught.
- A count on a marketing surface that the data does not produce.
- Breaking the cross-surface contracts for the iPhone app or GuitarHub.

## Constraints found in the repo

- Next.js here is 16.4.1 with breaking changes; read
  `node_modules/next/dist/docs/` before touching framework code (AGENTS.md).
  This work should need almost none.
- Never hand-edit `lib/*-data.ts`. Edit `content/`, then run the matching
  `scripts/compile-*.mjs`, then update word counts in
  `contracts/suede-vocal.json` and `lib/pro-inventory.ts`.
- Paid prose (book, atlas) contains no em dashes; a test enforces it.
- `lib/pro-inventory.test.ts` re-derives every published count.
- Published content stays indexable; paid-content shells keep their existing
  exclusions.
- Both PDFs are rebuilt from chapters; The Measured Voice PDF must be rebuilt.
- Commits go in as the owner via `scripts/git-identity.sh`, no AI trailers.
- Programs only link to things rooms already run: a routine id, an exercise id
  with reps, a breath set or drill, the range test, the recorder, ear
  training. A program cannot introduce behaviour of its own.
- At most one program day completes per calendar day; week 1 of a Pro program
  is free and must fit the free plan's rules the way Mix week 1 does.

## Approaches considered

1. **More guided practice (chosen by the owner).** New Pro packs and the
   programs that teach them. This is what a subscriber opens daily, so it does
   the most for renewal.
2. **A bigger songbook.** Rejected for now. The owner does not want public
   domain songs, and commercial songs need publisher licences. On hold.
3. **More reading (also chosen, as the companion to 1).** Cheapest to produce
   and good for search, but weakest alone as a reason to renew, so it is tied
   to the programs rather than grown for its own sake.

Within approach 1 there was a second choice, where to put the new practice:

- a. New rooms or new exercise mechanics. Rejected: new scoring behaviour is
  new measurement risk and a redesign, both non-goals.
- b. **New packs and programs inside the existing warmup and program system
  (call).** Each pack is data in `components/warmups/exercises.ts`, each
  program is data in `lib/programs.ts`, and every existing test, e2e suite and
  paywall rule applies unchanged.
- c. New lessons in the voice course. Rejected: the 102-lesson catalog is a
  shared contract with GuitarHub and every stage is free, so it adds no Pro
  value and carries contract risk.

## Design, project 1: the website (built and verified in this repo)

### New Pro packs (call)

Five packs of 8 exercises each, 40 new Pro exercises. Each exercise uses only
fields `WarmupExercise` already has (discrete notes, glides, ladders, range
caps, vibrato band on a single hold).

| Pack id | Name | What it drills |
|---|---|---|
| `runs` | Riffs and runs | Three- to seven-note pentatonic and blues-scale cells, slow then quick, turns and falls on discrete notes |
| `low-notes` | Low notes | Descending patterns, low holds, fry-onset slides into the bottom third of the range |
| `long-phrases` | Long phrases | Patterns that lengthen by a bar each rep on one breath, slow scales, held finals |
| `leaps` | Leaps and intervals | Fourths through octaves and tenths, up and down, landing without a scoop |
| `clear-words` | Clear words | Consonant-vowel patterns on moving pitch (the app scores the pitch; the words are the singer's to judge, and the copy says so) |

Each pack also becomes a Pro routine automatically through `PRO_ROUTINES`.

### New Pro programs (call)

Five programs. Week 1 free, as `FREE_WEEKS` already rules. Each opens and
closes with the range test warmed up the same way, as Mix does.

| Program id | Name | Packs it leans on |
|---|---|---|
| `belt-6w` | Belt in 6 weeks | existing `belt-prep`, plus `leaps` |
| `head-voice-4w` | Head voice in 4 weeks | existing `head-voice-builder` |
| `runs-4w` | Riffs and runs in 4 weeks | `runs`, existing Agility and runs routine |
| `low-notes-3w` | Low notes in 3 weeks | `low-notes` |
| `long-phrases-4w` | Longer phrases in 4 weeks | `long-phrases`, breath sets and drills |

`clear-words` is used inside `long-phrases-4w` and `runs-4w` rather than
getting a program of its own. Each program's `measures` line states what the
app scores and what stays the singer's judgment, in the manner of Mix.

### New reading (call)

- **The Measured Voice, 5 new chapters**, one per new program, about 1,500
  words each, added as a new closing part after chapter 23. Each is linked
  from its program as `readFirst` or `chapters`. They are Pro chapters; the 3
  free chapters do not change. Book total goes from 23 to 28 chapters.
- **Glossary, about 40 new terms**, free and indexable, drawn from the terms
  the new packs, programs and chapters use. The shared glossary contract
  (`contracts/glossary.json`) is extended, not restructured.
- The Voice Atlas does not change.

### What updates as a result

`lib/pro-inventory.ts` literals and its test; `contracts/suede-vocal.json`
word and chapter counts (value change; `version` handled per
contracts/README.md); `lib/book-data.ts` via compile; The Measured Voice PDF;
/pro's "exactly where free ends" table; `PRO_PROGRAM_NAMES`; changelog entry;
llms.txt and llms-full.txt if they carry the counts; sitemap entries for new
glossary terms and program pages.

### Verification

Unit gate (`npm test`), lint, production build, and the browser suites in
`e2e/suite.mjs`, with the programs suite extended to open each new program,
hit the day-8 Pro wall as a free singer, and run day 1 of each. Each new
exercise is rendered once in the warmup player in a browser to confirm it
plays and scores. The new prose gets one independent read against the
anti-goals before it is committed.

## Design, project 2: the iPhone app (second, needs the owner's Mac)

The iPhone app has routines and exercise seeds but no multi-week programs, no
glossary and only The Measured Voice. Call:

- Port the 5 packs as a new seed file and routines, Pro like every room.
- Ship the 5 new chapters in `Resources/book.json` and the rebuilt PDF.
- Do not build multi-week programs on iPhone in this work. That is a new
  feature with its own design; flag it as the natural next project.

iPhone code cannot be built or tested from this cloud workspace. Project 2
starts after project 1 ships and when the Mac is reachable, or the owner runs
the tests.

## Left to the builder

- Exact notes, reps, tempos and tips for each of the 40 exercises, and each
  program's day-by-day calendar.
- Chapter titles and the wording of all prose.
- Which glossary terms, as long as each is used by the new material.
- Whether contract `version` bumps, by the rule in contracts/README.md.

## Risks the owner should know

- The exercises and chapters will be written by an AI model from general
  vocal pedagogy and the existing book. They get an independent read, but a
  voice teacher has not reviewed them. The owner may want one to.
- 40 exercises is the target; if some fail the padding test the pack ships
  with fewer and the published count follows the data.
