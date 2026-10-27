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

- Committed on `funnel-polish` as `90af45e` (author Jason Colapietro),
  63 files, full suite green (3412 passed), tsc, lint and build clean.
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
- Suede Voice screenshot /shot-01-start-the-session.png shows "Suede Labs"
  inside the image; needs a re-export.
- lib/organization.ts alternateName includes "Suede Labs" for entity
  reconciliation; left as is.
