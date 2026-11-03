# Funnel polish handoff, 2026-10-26

Branch `funnel-polish` off `main` at `8ba2504`. Goal from the owner: make
sing.suedeai.ai the most pristine, crisp offering and funnel visitors into
paying, with a payment ask at every acceptable spot. This file is the running
record; update it at each milestone so a fresh session can continue.

## How this round was run

Five read-only audit agents (funnel, copy, visual via Playwright screenshots,
technical/SEO, payment path), then fix lanes with disjoint file sets:

| Lane | Files | Status |
|---|---|---|
| Pro page, upsell primitives, homepage, payment API (main session) | components/pro/*, components/practice/free-cap.tsx, lib/pro-shared.ts, lib/pro.ts, lib/pro-signal.ts, app/page.tsx, components/landing/*, components/v2-banner.tsx, app/api/checkout, lib/pro.ts post() | done |
| Room asks (agent) | breath-runner, app/tools, analyze-client, site-footer, programs, book/atlas chapter CTAs, progress-client, range/result-view, songs/mic-gate | done, tests green |
| Technical hardening (agent) | next.config.ts headers, proxy.ts matcher, app/pro/opengraph-image.tsx, /pro JSON-LD | done, build green |
| Room visual polish (agent) | warmups-client, routine-home, learn-home, daily-three-card, audio-setup, singer-actions | done, tests green |

Audit reports (full text) are only in the session transcript; the findings
that were acted on are listed below.

## Decisions made

- "Monthly plan sold out" stays on /pro (plans blurb, FAQ, JSON-LD SoldOut)
  and comes off every other sales surface: UpgradeCard, the one-time modal,
  the homepage teaser, the /pro hero line and the under-cards strip. The
  first pricing fact a free singer reads is the $79 lifetime price.
- Every priced ask links to `/pro#buy`. The buy card's button now sits under
  the price, above the bullet list, so the jump lands on price plus button at
  375px. `/pro#plans` remains for the restore path.
- The /pro final call to action is a real Stripe buy button for free
  visitors (`goPro("end")`), not a jump back up the page.
- "The gold channel" stays only as post-purchase identity (welcome panel,
  active hero, buy card row). Pre-purchase labels say "Suede Pro · Early
  Access" and "What Pro adds".
- The session nudge (ProCrescendoNudge) keeps its quiet line until the
  one-time modal has been seen (`proMomentSeen()` in lib/pro-signal.ts), so
  the modal and a full upgrade card never stack.
- Payment path verified live: POST /api/checkout lifetime returns a Stripe
  session; monthly returns 409. No code change to Checkout params.

## Done so far (main lane)

- lib/pro-shared.ts: FAQ tightened, em dashes out, Q6 ("Why does a free app
  sell anything?") removed (duplicated the "Pro is what keeps free free" strip).
- lib/pro.ts: songs perk copy.
- lib/pro-signal.ts: PRO_MOMENT_SEEN_KEY, proMomentSeen().
- components/pro/ui.tsx: UpgradeCard footer prints the price; links to #buy.
- components/pro/gate.tsx: links to #buy, "Go Pro:" colon, modal stacking guard.
- components/pro/moments.tsx: footer line without "sold out".
- components/pro/pro-client.tsx: hero label/paragraph/mono line, perks label
  and lede, plans heading and blurb, buy card restructure (button above
  bullets, chip stack reduced), card points merged, under-cards strip gone,
  why-paid strip without em dashes or "(Johnny Suede)", final CTA buy button
  with its own error alert (`buySpot` state), em dashes out of notices.
- Tests updated: components/pro/ui.test.tsx, gate.test.tsx, pro-client.test.tsx.

## Verification state

- `npx tsc --noEmit` and `npm run lint`: clean.
- `npm run build`: clean (the /pro share card prerenders at /pro/opengraph-image/<version>).
- `npm test`: the singer-page template changed (comparison card), so
  SINGER_PAGE_REVISED in lib/singer-evidence.ts is 2026-10-26 and the pins in
  lib/singer-page-freshness.test.tsx, lib/singer-page-evidence.test.tsx and
  lib/singer-editorial-routes.test.tsx follow it. Re-run the full suite after
  any further singer-page edit and re-pin the same way.
- Ear-game hint reworded to "under Audio" after the audio panel's collapsed
  label became "Audio".

## Commit and push state

- Committed on `funnel-polish`: `90af45e` (the polish, 63 files), `9f43b35`
  (this handoff), then the Pro hero's secondary link as an outline button.
  Author Jason Colapietro. Full suite green (3412 passed), tsc, lint and
  build clean; the built site was served locally and screenshotted at 375
  and 1280 (hero price at y=555 on a phone, the buy card's button inside
  the first screen after the #buy jump, homepage 11.7k px tall on a phone,
  down from 16.8k).
- `git push -u origin funnel-polish` returned 403 from the session's git
  proxy: the repository is not in this session's authorized sources
  (attaching it was denied by the permission classifier). The same commit is
  saved as a patch at /home/user/funnel-polish.patch (and in the session
  scratchpad). From any clone: `git checkout -b funnel-polish origin/main &&
  git am /path/to/funnel-polish.patch`, then push and open the PR.

## Still to do

1. Push the branch once the repository is attached to a session, or apply
   the patch locally; open a PR against main (CI runs typecheck, lint, tests,
   build and the browser suites).
2. Optional follow-up, not started: pre-park the checkout session id before
   the Stripe redirect so a lost redirect can still unlock Pro (needs
   /api/checkout to return the id, a separate "started" storage key, and
   /api/entitlement to report the session status so an abandoned checkout is
   cleared quietly).
3. Optional: the proxy matcher could also skip `icon`/`apple-icon` metadata
   routes if those ever become generated instead of static files.

## Flagged for the owner, not changed

- Stripe receipt email is a Dashboard toggle (Settings > Emails > Successful
  payments); unverified. The app sends no email of its own, so the Pro key is
  shown once on one page.
- Checkout session omits `adaptive_pricing`; the confirm check requires USD
  and 7900 cents. If the Dashboard enables Adaptive Pricing, verify a non-US
  card in sandbox, or pass `adaptive_pricing: { enabled: false }`.
- The Stripe webhook route is intake-only and answers 503 unless intake env
  vars are set; if it is registered in the Dashboard, Stripe will log it as
  failing.
- Naming rule (owner, 2026-10-27): Suede AI is the primary name and Suede
  Labs stays as the alternate, always. Never scrub Suede Labs out; keep it
  where it already works as the alternate: `alternateName` in
  lib/organization.ts, the "Older profiles may say Suede Labs" line in
  lib/llms-txt.ts, the sameAs profile URLs, and the Suede Voice app's own
  credit line in /shot-01-start-the-session.png.

## Round two, 2026-10-27: checkout recovery and the screenshot

Branch `checkout-recovery` off `main` at `e543c4b` (the merged funnel polish).

- **Lost-redirect recovery.** `/api/checkout` now returns the session id with
  the URL. `startCheckout` parks it under `suede-sing:pro:started-checkout`
  before leaving for Stripe. Stripe's return parks the real id as before
  (`rememberPendingCheckout`, which clears the started one) and the cancel
  address clears it. A plain visit to /pro with a started id and nothing else
  asks Stripe once (`resolveStartedCheckout`): paid unlocks Pro with the usual
  welcome; "open" or "processing" waits for the next visit; anything else,
  an expired session above all, is forgotten without a word. A success
  address that lost its id is confirmed from the started one. `/api/entitlement`
  reports an unpaid session's own status (open, expired) and a not-yet-ours
  payment's status (processing), instead of a bare inactive. The confirm
  path treats "processing" as retryable rather than definitive.
- **Screenshot.** #257 painted over the app's own credit line ("A Suede
  Labs ...") at the bottom of `public/shot-01-start-the-session.png`. That
  was reverted on 2026-10-27 (branch `restore-suede-labs-credit`): the
  original capture is back, byte for byte, under the naming rule above.
- **Not done, needs the owner.** The Stripe receipt email is a Dashboard-only
  setting (Settings, Emails, Successful payments); there is no API for it.
  The intake-only webhook, if registered in the Dashboard, should be
  unregistered or intake enabled.
- Tests: app/api/checkout/route.test.ts, app/api/entitlement/route.test.ts,
  lib/pro.test.ts, components/pro/pro-client.test.tsx cover the new paths.

## Round three, 2026-10-27: second fleet pass

Branch `fleet-pass-3` off `main` at `78e58a8` (#256, #257, #258 merged).
Pushing from the cloud session is blocked (the repository is not attached);
each round ships as a patch the owner applies with `git am -3`, then a PR
with auto-merge.

Audits launched (read-only): funnel as a returning free singer with seeded
localStorage states; copy across every room and hub page; visuals on the
routes the first pass skipped; the repo's own e2e suites against a local
production build; technical, performance, SEO/AI visibility and a live check
that /api/checkout returns the session id.

Done so far:
- components/pro/gate.tsx: `crescendoCount()`. The session nudge alternated
  on `sessions.length`, which stops at MAX_SESSIONS (500), so past the cap
  every summary showed the full card. It now reads the newest session's id
  there, about half odd, half even. Tested in gate.test.tsx.
- Funnel fixes from the seeded-state audit (main lane):
  - The one-time Pro moment used to drop any result that arrived while a
    full-screen results screen held the scroll lock, which is every ear
    game, routine and breath set. moments.tsx now waits for the lock to be
    released (MutationObserver on body style) and runs the gate again.
    Routine and breath results now send the signal (routine-summary.tsx,
    breath-runner.tsx). The modal also lost its red focus ring and gained
    "No daily limit on guided practice" as its first bullet.
  - `NotPro` (components/pro/gate.tsx): shared sales copy in the server HTML
    behind the not-pro pre-paint marker, null for an owner after hydration.
    Wraps the homepage's three priced asks and the footer's price clause; the
    footer link now lands on /pro#buy. Footer heading "More from Suede AI".
  - Program day wall on /warmups and /progress is priced and violet, like
    the wall in the program view. The coach card drops its Pro line when the
    program card's unlock is on the same screen, and says "Pro has no daily
    limit" when today's minutes are used. The recorder's extra Pro line shows
    only once a take exists.
  - Em dashes out of coach reasons, progress and chart labels, recorder copy.
- Lanes running: copy in text/data modules (guides, exercises, glossary,
  llms-txt, pop-songs, song data, voice types, weekly report, chapter
  summaries); copy in page templates (singer, can-you-sing, songs, hubs, nav,
  mic errors, error pages, glossary, atlas/book index, changelog, breath
  drills); technical (image cache header, /singers crawl index weight,
  sitemap lastmod from hub members, /ai-instructions offer, Pro schema name,
  404 Pro line, API no-store, mono font preload off).
- Singer template punctuation edits re-pin fingerprints only; SINGER_PAGE_REVISED
  stays 2026-10-26 (a sitewide lastmod bump for punctuation erodes trust in it).

### Round three status at the usage-limit stop (2026-10-27, ~04:10 UTC)

Everything is committed on `fleet-pass-3` (WIP snapshots get squashed before
the patch). tsc was clean at the stop.

Finished lanes:
- Text-module copy: lib/guides.ts, components/warmups/exercises.ts,
  lib/glossary.ts, lib/llms-txt.ts, lib/pop-songs.ts, components/songs/data.ts,
  lib/voice-types.ts, lib/weekly-report.ts, components/weekly-report-card.tsx,
  33 book/atlas chapter summaries (PDFs unaffected: the builders never read
  the summary). contracts/glossary.json and contracts/suede-vocal.json
  regenerated (values only, logged in contracts/README.md; consumers re-sync).
- Technical: image cache header (a day plus a week stale-while-revalidate,
  never immutable), /singers crawl index on plain anchors (~478 KB to ~275 KB
  HTML estimated), sitemap lastmod for hubs and /changelog, /ai-instructions
  offer block plus Suede Labs alternate (dated 2026-10-27 in all three
  places), Pro schema name "Suede Pro", 404 Pro line, API `private, no-store`,
  Plex Mono not preloaded.
- Main lane: Pro moment waits for result screens; NotPro; program wall
  priced; coach/recorder de-stacked; footer phone length and 24px targets;
  path-row descriptions no longer clamped (the e2e suite's 7 majors);
  book/atlas subtitles and "Suede Sing Pro" fixed in the compile scripts;
  102 lesson files: practise/practised/practising to the American spelling
  (lib/lesson-data.ts recompiled, word counts unchanged).
- Browser suites (local build of 01:13): 0 blockers; programs, breath,
  pitch, vibrato, mic-gate and share-card suites all pass.

Interrupted lanes (resume these):
1. Template copy lane. Its list follows. Its last step was re-pinning the
   singer freshness fingerprints after the singer-template edits; check
   lib/singer-page-freshness.test.tsx first (re-pin fingerprints only, keep
   SINGER_PAGE_REVISED at 2026-10-26: punctuation-only changes). Extra
   items it was given: songs/[slug] card button outline; verdict.tsx outline
   and kicker "Your fit"; /learn "What is free?" moved below the problem map;
   /atlas rosters collapsed below sm; /book repeat hero buttons at the end;
   analyze mic button variant="rec"; neutral Stat tones on can-you-sing,
   book, atlas; bylines without "(Johnny Suede)" on book and atlas; kicker
   "Included with Pro · 3 chapters free"; learn/voice duration nowrap;
   glossary chips min-h-11 and nbsp before arrows; changelog meta nowrap and
   action-link targets; max-w-prose on long paragraphs (extension, analyze,
   genre and voice-type footnotes, song-page).
2. Visual lane. It was making the (b) removals after wrapping the h1/h2/h3
   rules in app/globals.css in `@layer base`; its inventory is in the
   session scratchpad as heading-inventory.md (lost if the container goes).
   Remaining after that: SectionHeading level 3 and guide.tsx h3 to
   font-display; /singers duplicate CTAs; breath-studio buttons outline;
   ear-training streak line once; programs-client duplicate sentence,
   program-view subtitle, duplicate note; /voice duplicate store buttons and
   ink tagline; guide "Vocal health" tone="rec" via a SectionLabel tone prop;
   piano scrollbar on phones; learn/voice/[stage] durations, lesson and
   module links 44px; breadcrumbs 24px; lesson-list label; FREE pill on book
   and atlas chapter titles; EmptyState title in the display face; book and
   atlas chapter pages render " — " before summaries.
3. Main lane: weekly report free-plan line now ends on "Pro has no daily
   limit" (/pro#buy), skipped in the four guided rooms. Done 2026-10-27.
Both interrupted lanes were resumed at 05:00 UTC.

After the lanes: full `npm test`, tsc, lint, a production build, a
screenshot pass on /, /pro, /warmups, /breath, /singers, /progress at 375 and
1280 (the heading layer fix changes type site-wide), squash the WIP commits,
write the patch.

Template copy list as handed to that lane:

# Round 3 copy items held for the template lane (from the copy audit)
Rules: no em dashes in visible copy; en dash for ranges; American spelling; Suede AI naming.
Singer template change => bump SINGER_PAGE_REVISED (lib/singer-evidence.ts) and re-pin lib/singer-page-freshness.test.tsx, lib/singer-page-evidence.test.tsx, lib/singer-editorial-routes.test.tsx.

1. site-footer.tsx:227 "practice loud — your voice never leaves this device" -> colon. :144 heading "More from Suede" -> "More from Suede AI".
3. Range separator " — " -> en dash "–" at singers/[slug]/page.tsx:450, songs/song-page.tsx:114, range/result-view.tsx:619, range/range-test.tsx:418; result-view.tsx:419 canvas text too.
4. singers/[slug]/page.tsx:657 "not lab measurements — an endpoint may be" -> ". An endpoint may be". :122 title "… — Compare Yours" -> "… · Compare Yours".
5. singer-actions.tsx:138-139 "— your mic finds your lowest and / highest notes, then compare your measured notes with X's" -> ". Your mic finds your lowest and / highest notes; then compare them with X's".
6. singer-actions.tsx:61 "Compare my range — free test →" -> "Compare my range · free test →" (pins: components/singers/singer-actions.test.tsx:102; lib/singer-page-search-intent.test.tsx:279,309).
7. singers/[slug]/opengraph-image.tsx:134 "suede sing — test your own range free" -> " · "; result-view.tsx:489 "sing.suedeai.ai — online singing practice" -> " · ".
8. can-you-sing/[slug]/page.tsx:52 "is ${popRangeLabel(song)} — ${span} semitones" -> ", "; :61 "${opening} — which, on span and top note, rates ${rating} for an untrained voice." -> "${opening}, which on span and top note rates ${rating} for an untrained voice." (pins lib/pop-songs.test.ts:328 and regex :350).
9. can-you-sing/[slug]/page.tsx :206 "reproduced here — this page" -> "; this page"; :233 "{" "}— reported {rangeLabel(s)}" -> ": reported"; :243 "different facts — the catalog page explains" -> ". The catalog page explains"; :261 "{r.title} — {r.artist}" -> "{r.title} by {r.artist}"; verdict.tsx:90 "sits inside your voice — and" -> ", and".
10. songs/[slug]/page.tsx:154 "${f.highLabel} — ${f.rangeSemis} semitones, with ${leapPhrase(f.leaps)} — and the span" -> "${f.highLabel} (${f.rangeSemis} semitones, with ${leapPhrase(f.leaps)}), and the span" (pins lib/song-page.test.ts:364,368).
11. song-page.tsx:153 "{formatMinSec(f.sessionSec)} — {f.loops}" -> " · "; :242 licence -> license; :243 "under copyright — this is" -> "; this is".
12. songs/page.tsx:72 "every page says why — plus" -> "every page says why. Each also gives".
13. voice-type/[type]/page.tsx:357 "How high — and how low — {pluralVoice(lower)} sing" -> "How high and how low ... sing".
14. voice-type :325 ") — {…} semitones" -> "), a span of {…} semitones"; genre :210 "semitones —{" "}" -> "semitones,{" "}"; records :131 "} — about ${…} octaves." -> "}, about …"; records :286 "sing — which the range test and the main chart do together." -> "sing. The range test and the main chart show you that together."
21. lib/audio/mic.ts :43 "Plug one in — or if" -> ", or if"; :47 "using it — a call, a recorder, another tab — and try again." -> parentheses; :173 -> "The practice rooms need Chrome, Safari, Edge or Firefox."
22. app/error.tsx:70 "not your practice — an error in the page itself." -> colon; app/global-error.tsx:63 "affected — it is stored on" -> "; it is stored on".
23. range-test.tsx:458 "Slide up the same way — falsetto counts." -> ". Falsetto counts."; :506 "Any easy pitch — an “ahh”," -> colon.
24. atlas/page.tsx :214 "what is their vocal range — and how" -> ", and how"; :218 "voice — cited range," -> colon; :235 "every singer covered —" -> ". They are".
25. atlas/page.tsx:295 "manual — how the voice works," -> colon; book/page.tsx:161 "is the reference —" -> colon; book/page.tsx:109 "chapters — read" -> ". Read".
26. glossary/page.tsx :118-119 "in this app — on the / singer pages — and" -> parentheses; :255-256 "other side — how / own numbers — and" -> parentheses; :247,:268 "<span> — {c.summary}</span>" -> "<span>: {c.summary}</span>".
28. nav.tsx:336 "Gold channel active — manage your plan" -> " · "; :518 "at risk — nothing practiced today" -> ", " (pin components/nav.test.tsx:176).
29. learn/page.tsx:98 "one skill—not five—to carry" -> ", not five,"; :109 "comfortable—its tessitura—plus timbre" -> "(its tessitura), plus".
30. tools-page.tsx:116 and analyze-client.tsx:251 "practice XP — sessions" -> "practice XP. Sessions".
31. coach.tsx:454 "recent practice — no AI," -> ". No AI,"; progress-client.tsx:405 -> "Every exercise you finish shows up here: a warmup, a range test, an ear-training round."; :681 -> "Finish any exercise (a warmup, a range test, an ear-training round) and it starts filling in your XP, streak, and charts below." coach.tsx reasons :102-334 (12 dashes) also.
32. changelog :348 "Warmups sing with you — a continuous guide" -> colon; :367 "Ten focused tabs — Recorder" -> colon; :375 "can measure — and says" -> ", and says"; :178 "under your voice — taught once, then continuous — with" -> parentheses; :129 "practise" and "Suede voice course".
33. box-breathing.tsx:333,:408 "hold — equal" -> "hold, with equal". Breath rooms: farinelli-drill 5, sustain-test 5, breath-cue-drill 2, routines 2.
Also: practise -> practice in learn/voice/page.tsx:75, coach.tsx:109, module-practice.tsx:133-136; extension page.tsx:94 "analyses".
Genre hub descriptions (genre/[genre]/page.tsx:61): lead with "Catalog ranges for N <genre> singers, X to Y." then summary (<=155 chars; re-run route-metadata.test.tsx).
progress-client.tsx 8 dashes, charts.tsx 3.

### Round three, final (2026-10-27)

All lanes finished and resumed cleanly after the usage-limit stop. The
WIP snapshots are squashed into one commit on `fleet-pass-3`, shipped as
a patch (pushing from the cloud session is still blocked).

Added after the interruption:
- Heading layer: app/globals.css wraps the h1/h2/h3 rules in `@layer base`
  and sets `--tw-leading: 1.08` so every display heading keeps its line
  height. Classes that the old unlayered rules had silently overridden, and
  that would now change an approved look, were removed (singer, records,
  voice-type, glossary, extension, atlas h3 weights; leading-none and
  leading-tight on today-card, breath-runner and /pro h1s). Mono tape-label
  h3s got font-normal. Footer column heads now render in Plex Mono as
  intended.
- Atlas rosters: closed <details> at every width, no script (a fold that
  changed state after load would shift the page).
- Weekly report free-plan line links to /pro#buy outside the guided rooms.
- Learn page: the template lane moved "What is free?" below the problem map
  and added one line above the map so the daily cap is still disclosed before
  the first exercise link (a pinned regression requires that).

Verified: tsc, lint, full unit suite (3441 passed), production build;
/singers HTML 478 KB to 276 KB; screenshots of /, /pro, /warmups, /breath,
/singers, /progress, /atlas, /book, /changelog, /learn, a singer page and the
404 at 375 and 1280 (no overflow; /atlas 35 phone screens to 12); the Pro
moment checked in a browser: closed while a results screen holds the scroll
lock, open once it is released.

Open, for the owner:
- Programs list starts with Recovery week (lib/programs.ts PROGRAMS order is
  pinned by contracts); reordering is a product call.
- The homepage shows both the "v4.0 · What's new" pill and the violet v4.0
  card; keep both only if the release should stay that loud.
- Consumers of contracts/glossary.json and contracts/suede-vocal.json re-sync
  (values only; see contracts/README.md).
- Book and atlas chapter bodies still carry em dashes and British spellings
  (255 and 202 dashes); content/atlas/21 says "seamless". Editorial pass.
- Design-system follow-ups not attempted: one label size (11px vs 12px),
  one back-navigation pattern, one wording for the range-test CTA, ghost
  buttons indented when stacked.
- Stripe Dashboard: receipt emails on; the intake-only webhook either
  unregistered or intake enabled.

## Round four, 2026-10-27: third fleet pass

Branch `fleet-pass-4` off `main` at `94193d4` (#259 merged and deployed;
Vercel shows the production deployment READY and no runtime errors since).
The environment's network policy now denies sing.suedeai.ai, so this round
audits a local production build of the same commit served at
http://localhost:3400 (stop it when the round ends). Fewer agents than round
three, which hit the usage limit with seven running at once.

Audits launched (read-only), each on ground no earlier round covered:
1. Bug review of #256-#259 (moments wait, NotPro, checkout recovery, buy
   card, heading layer, crawl index, sitemap, headers, proxy matcher,
   result signals, progress gating).
2. Accessibility: axe-core (WCAG 2.2 A/AA) on 25 routes at two widths, plus
   keyboard and screen-reader checks (tab order, menu drawer, Pro dialog,
   headings, landmarks, keyboard path to the buy button).
3. In-session experience with Chrome's fake microphone: routine to results,
   single exercise summary, ear and breath results, the cap slide mid-session,
   range test first and second results, the Pro moment after closing results.
4. Offer and answer-first review: /pro, cap wall, modal copy (facts already on
   the site only; anything new goes to the owner as a question) and the
   first 40-60 words of the top landing templates.

If a limit stops the round: each auditor's report arrives as a message; fixes
have not started until this section says so.

### Round four progress

Done (main lane, committed as WIP snapshots on fleet-pass-4):
- Bug-review fixes: a "processing" card on return keeps its parked checkout
  id (main fixed this first in #260, which this round keeps as merged);
  an old answer from resolveStartedCheckout cannot wipe a newer started id;
  /api/entitlement reports an open session's status when the payment attempt
  has no customer yet; the footer Pro link is one span (it had split into
  two columns); the static image cache rule skips /_next/ so hashed build
  fonts keep Next's immutable header.
- Offer copy: hero names the price and what the coach is built from; a line
  under the buy button answers phone, other computers and recordings; FAQ
  "How much does Suede Pro cost?" and "Can I use Pro on my phone and my
  computer?"; cap button "Keep practicing today with Pro: $79 once"; cap
  slide and modal copy (modal bullet: both books).
- Answer-first: singer pages open "<Name>’s reported vocal range is X to Y,
  about N octaves (S semitones)." and link their Atlas chapter
  (SINGER_PAGE_REVISED 2026-10-27, fingerprints re-pinned; a real content
  change); warmups, studio and range openings; "Is “<song>” hard to sing?"
  heading on song-range pages; song pages list each line's notes.

Accessibility lane and in-session fixes: done (see "Round four, final").

Needs the owner (from the offer review): is there a refund policy for the
$79 lifetime purchase and may /pro state it; does web Pro unlock anything in
the Suede Voice app; may /pro say Pro needs no sign-in (a test currently
forbids that line); what "lifetime" covers; is the Stripe receipt email on;
does Early Access have a planned end.

### Round four, final (2026-10-27)

All lanes finished. Squashed into one commit on `fleet-pass-4` off
`94193d4` and handed to the owner as `fleet-pass-4.patch` (push from this
environment is still refused).

Also in the commit, beyond "Round four progress" above:
- Accessibility (15 items): focus after a failed checkout and on #buy and
  #content, underlined prose links, ProgressBar names, label and name
  mismatches, session-stage dim text contrast, locked achievement contrast,
  studio piano key size, guides as labelled regions, homepage and banner
  focus order, the Pro dialog named by its heading, nav logo and menu names.
- In-session fixes from the fake-microphone audit: result cards and ear
  wrong answers pass contrast; no second unpriced Pro ask under a capped
  result; breath drill stars follow the score on screen; step chips only
  turn green from 50; result rows keep their labels and "not reached" on
  one line.
- Pro moment timing: page-style results (single warmup, song, range retest)
  now send the result signal when the singer leaves them
  (lib/use-pro-result-on-leave.ts), so the modal no longer covers a score
  nobody has read; it opens two frames after a results screen lets go, and
  returns focus to the page content when its opener is gone. Kicker reads
  "Result saved".
- The microphone closes after the idle wait on breath results and on both
  cap slides (it stayed live behind them).
- Session header on a 375px phone: the title column keeps half the row, the
  right-hand slot wraps, and the subtitle truncates before the title loses a
  letter ("Morning reset" in full, was "M…").
- Octave buttons in the studio use aria-disabled so focus stays put at the
  ends of the keyboard.

Verification on the squashed tree: `npx tsc --noEmit` clean, `npm run lint`
clean, `npm test` 3449 passed (plus 12 node tests), production build OK
(974 pages). axe-core WCAG 2.2 A/AA: zero violations on 25 routes at 375
and 1280. Fake-microphone journeys rerun: the cap slide releases the mic
after 15 s, the modal waits on a single-exercise summary and opens on
"Back to library", the modal opens after a capped routine's Continue.
The local server on :3400 is stopped.

QA scripts note: the journey scripts in the session scratchpad look for a
dialog named "Go Pro"; the dialog is now named by its heading ("Turn this
result into a plan"), so update that locator before reusing them.

Rebased onto `5378079` (#260). Its confirmCheckout keeps a processing
payment parked and applies the inactive "processing" reply; this round's
throw-and-retry version was dropped in its favor, and the /pro processing
message it relies on is kept. One edge left for the owner: applying that
reply replaces whatever this browser held, so a 30-day pass or ending plan
holder who buys while a slow payment method is still processing loses the
pass (and its stored Pro key) here until the payment settles.

Still open for the owner (unchanged): the six offer questions above;
programs order; the v4.0 pill and card; em dashes in chapter bodies; contract
consumers re-sync; Stripe Dashboard settings; allowing sing.suedeai.ai in
this environment's network policy; deleting the stale remote
`funnel-polish` branch.

## Singer pages as thick vocal-range answers, 2026-10-30

Branch `seo/singer-vocal-range-pages` off `main` at `a8604eb`. Search Console
(Aug 18) listed 284 of the ~421 profiles then live as "Discovered, currently
not indexed". The pages were already server-rendered, indexable, canonical and
in the sitemap; the problem was substance. Visible text ran 576 to 965 words
(median 614), and only about 9% of it survived masking the name, notes and
numbers: the same caveat sentences with values swapped in.

- `lib/singer-range-profile.ts` builds the explainer from catalog numbers
  only: 88-key piano key numbers, white/black key counts, each endpoint against
  middle C, endpoint frequencies and their ratio, octaves touched, the whistle
  flag; the singer against the median floor and ceiling of their catalog
  voice-type group (left out for the five reviewed voice-type corrections) and
  which of the eight textbook bands the span covers; songs from POP_SONGS that
  fit as written; keyboard neighbors.
- The profile renders three new sections (`#piano`, `#voice-type-comparison`,
  `#practice` with one range-test CTA), shared semitones on each similar-voice
  card, a "Nearest reported floors" chip row, and a sixth FAQ question, "Who
  has a similar vocal range to X?", in the visible list and the FAQPage markup.
  WebPage JSON-LD gains `about` pointing at the Person node.
- Keyboard neighbors use a window that shifts at the ends of the order, so
  every profile is linked from at least three others. Before, 50 profiles had
  fewer than three inbound profile links and 11 had none.
- Titles, H1s and snippets are unchanged: they already lead with
  "<Singer> Vocal Range: Reported <low>–<high>" and are pinned by
  lib/singer-page-search-intent.test.tsx, the CTR pilot included.
- SINGER_PAGE_REVISED is 2026-10-30; freshness pins re-pinned.
- Built site: median 1,091 visible words per profile (min 936), median
  page-unique 6-word sequences 132 to 242.
- Guard: lib/singer-range-profile.test.tsx renders all 636 profiles.
