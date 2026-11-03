# Audit loop handoff, 2026-11-03

`main` is at `7e1c8b6` (#279), live on https://sing.suedeai.ai. This file is
the running record of the audit swarm loop and the owner's final pass. The
loop has stopped; nothing is scheduled or running. The previous handoff
(funnel polish, 2026-10-26) is in docs/archive/handoffs/.

## How the loop ran

Each round audited every route with 14 read-only auditors in four batches:

- SEO: tools, technical, learn, songs, singers and atlas, conversion.
- Funnel: activation, monetization, retention, content-to-tool bridges.
- Singing critics: exercises, voice science, curriculum, singers and songs.

Every finding was adversarially verified before it counted. Each round then:

1. Fixed the verified findings, using subagents for the bigger ones, each on
   disjoint files.
2. Had an independent reviewer check the diff.
3. Ran the unit gate and all six CI browser suites (`e2e/suite.mjs`) against
   a production build.
4. Opened a PR, squash-merged it on green CI and confirmed the Vercel deploy.

Earlier rounds' findings, rejections and owner decisions were fed to each
round's auditors, so nothing was re-reported without new evidence.

| Round | PR | Verified findings |
|---|---|---|
| 22 | #272 | 11 |
| 23 | #273 | 6 |
| 24 | #274 | 6 |
| 25 | #275 | 11 |
| 26 | #276 | 8 |

Each round's independent review added a few more fixes on top of these
counts. The owner asked to stop after round 26.

## Final pass (#277) and follow-ups (#278, #279)

These are owner decisions, all live:

- **Capped program card:** the card on /warmups and /progress now names the
  rows that stay open after the free minutes run out (range test, recorded
  take). A new pre-paint token, `waits-open` (lib/prepaint.ts and
  lib/prepaint-config.ts), reserves room for that line in app/globals.css.
  The CLS states `program-capped-open` and `program-capped-open-book` cover
  it in CI.
- **Paid prose:** all em dashes are removed from the book and the atlas.
  lib/singer-reading-copy.test.tsx now guards paid chapters and atlas
  entries too.
- **Grit and support in atlas entries:** atlas technique lines no longer
  credit grit, rasp, intensity or pitch height to breath pressure,
  compression or the folds. They now describe a focused tone on steady
  support, consistent with book ch.1, ch.4 and ch.17 and atlas ch.6. This
  took #277 and #279.
- **PDFs:** both rebuilt from the current chapters; they contain no em dashes.
- **"Musical Theater":** used everywhere, with slugs `/singers/genre/musical-theater`
  and `/atlas/musical-theater`. The old URLs redirect permanently in one hop;
  #278 fixed a double hop on Vercel.
- **Streak:** a program rest day the singer reached is a bridge. It neither
  adds a day nor breaks the streak. See `bridgeRestDays` in lib/progress.ts,
  `programRestDays` in lib/programs.ts and components/programs/streak-bridge.tsx.
- **Copy and UI:**
  - The /pro H1 leads with "Online vocal coach", which is now in
    `HEAD_TERM_OWNERS`.
  - The footer reads "Suede Pro online vocal coach".
  - The singer closing-card H2 asks how much of the singer's range yours
    covers.
- **/range:** a second silent run in a row on the pitch meter now points the
  singer to the audio setup.
- **Warmups:** a start now checks the live mic stream. CI had caught a race
  where the idle release closed the mic just before a press.
- **Songbook:** titles wrap. Yankee Doodle has its G3 pickup back, which
  makes it Hard. Danny Boy stays the Londonderry Air with "call-" on D4.
- **Stripe:** the live product sync was not run; live billing stays with the
  owner. The offline dry run is in the #277 description.

## Contracts

Values changed, but `version` stays 9:

- **suede-vocal.json:** book 32,430 words and atlas 70,658 words. Atlas
  chapter 22 is now `musical-theater`.
- **suede-progress.json:** the streak definition adds the rest-day bridge.

The changelog is in contracts/README.md.

GuitarHub's sync workflow copied the contracts at edc5b68. Whether it has
picked up the later values has not been confirmed from here.

## Open items for the owner

- **GuitarHub:** confirm the contract re-sync (repo JasonColapietro/suede-guitar-hub).
- **iOS songbook (Suede-AI/suede-voice):** out of step with the web songbook.
  The owner said not to spend more time on the songs.
- **Desktop warmups at 1280px:** the room's own free filled start sits about
  260px above a Pro-locked program day's unlock. Two filled controls on one
  screen; left as is.
- **First load after a rest day:** the nav streak chip and the cap-wall
  streak text briefly show the lapsed streak until the bridge chunk writes.
  This changes text only; there is no layout shift.

## Working notes for a fresh session

- **Local server:** build, then `npx next start --port 3100` with Stripe and
  Clerk env vars unset.
- **Browser suites:** run them with
  `SING_BROWSER_EXECUTABLE=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node e2e/suite.mjs <suite>`.
  checkout-recovery can time out on reload with that local Chromium (141)
  and pass in CI (151).
- **Content edits:** never hand-edit lib/*-data.ts. Rerun
  scripts/compile-{book,lessons,singers,atlas}.mjs, then update the word
  counts in contracts/suede-vocal.json and lib/pro-inventory.ts.
- **Singer pages:** a visible change to the profile template needs
  SINGER_PAGE_REVISED bumped and the fingerprints in
  lib/singer-page-freshness.test.tsx re-pinned.
- **Commits:** they go in as the owner (scripts/git-identity.sh), with no
  attribution trailers.
