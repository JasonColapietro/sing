# Fleet pass 5 · Conversion funnel and Pro asks

Scope: `app/page.tsx`, `components/landing/*`, `components/pro/*`, `lib/pro.ts`, `lib/pro-shared.ts`, `components/practice/free-cap.tsx`, `components/nav.tsx`, `components/site-footer.tsx`, plus every Pro-ask render site in `app/` and `components/`, found with grep. Branch `fleet-pass-5` (HEAD `ef801f4`, which includes #263). Read-only. Line numbers come from `cat -n`/`grep -n` on this tree. The offer is fixed ($79 once, lifetime; 5 free guided minutes a day; pitch meter and range test free). The footer's open-source credentials line stays at the owner's request.

---

## 1. Status of pass-4 findings

| # | Pass-4 finding | Status | Evidence now |
|---|---|---|---|
| P1 | Hero: seven text blocks, six clickables | **FIXED** | `hero-split.tsx:63-119`: pill (63-73), kicker, H1 lead-in, headline (84), 2 buttons (89-96), 1 paragraph ("Hear a note, sing it back, and watch where your voice lands. The pitch meter and range test are free with no time limit; guided practice gives you 5 free minutes a day.", 97-101), 1 mono line ("No install · No ads · Audio stays on your device", 102-106). Price link and famous-singers link are gone. One leftover: two mono labels stacked above the headline, "SUEDE SING" (75) and "ONLINE SINGING PRACTICE WITH LIVE PITCH FEEDBACK" (81) (see P3-4). |
| P1 | 4.0 announced three times | **FIXED** | `components/v2-banner.tsx` is deleted. The pill (`hero-split.tsx:63-73`) and the footer link (`site-footer.tsx:217-219`) remain, as pass 4 recommended. |
| P1 | /pro repeats "pay once" nine times, Stripe line three times | **FIXED** | `pro-client.test.tsx:404-423` now pins each phrase to one occurrence: "One payment. Lifetime Pro. No renewal." once (672), "One payment · Never renews" once (1503-1504), no "gold channel". "Secure checkout by Stripe" appears once (877). The hero exit is a text link (1024-1029). |
| P1 | /pro itemises the perks five times | **PARTLY** | The perk descriptions are one line each now (`lib/pro.ts:559-602`). The perks still appear six times for a free visitor: the hero paragraph (`pro-client.tsx:1005-1007`, 5 perks), the perks grid (1053-1073, 7), the buy card (`PRO_CARD_POINTS` 76-93, 8), the UnlockStack tiles (`unlock-stack.tsx:48-61`), the table (`PLAN_ROWS`, 15 rows), and FAQ Q5 (`pro-shared.ts:179`). |
| P1 | "not just the first two steps" sold as a benefit | **PARTLY** | The homepage, paths, PRO_PERKS, the /pro lede and the modal are fixed, and `pro-claims.test.tsx:32,40` guards them. **The phrase is still in** `components/warmups/session-summary.tsx:406` and `components/warmups/routine-summary.tsx:190` ("Pro shows the full daily coach plan, not just its first two steps"), which every free warmup result shows. It is also in **the product description on Stripe Checkout**, `lib/stripe.ts:174` ("…the full adaptive daily plan (free shows its first two steps)…"), pinned by `lib/stripe-provision.test.ts:149`. See P1-1. |
| P1 | Homepage cut list | **FIXED** | Order is now hero → paths → grid → Pro teaser → 7-row comparison → Famous voices (8 cards with range bars, no chips) → one-strip iOS band → final CTA (`app/page.tsx:203-357`). The v4.0 card and the privacy strip are gone. |
| P2 | Hedges in sales paths | **FIXED** | `paths.tsx:49` "Leave with your range measured and a clearer picture of your pitch."; `:60` "Sustain a comfortable note and watch whether your pitch rises or falls."; `famous-voices.tsx:50-51` is plain; homepage cards show only name and range; the iOS disclaimer moved to FAQ (`pro-shared.ts:172`); the PRO_PERKS songs/takes/history lines are each one line. |
| P2 | Cap wall says "5" four times, four buttons | **FIXED** | `free-cap.tsx:82-107`: h2 "That's today's 5 free minutes", one sentence, Pro button, "Open the free studio", and restore as a text link. The "5:00 of 5:00" line and "See your streak" are cut. |
| P2 | "Gold channel" jargon | **FIXED** | It no longer appears anywhere. `nav.tsx:337` reads "Pro is active · manage your plan", and `pro-client.tsx:523` reads "Welcome to Suede Pro". |
| P2 | Label headings | **FIXED** (mostly) | "Start where you are" (`paths.tsx:86`), "Open any room and sing" (`page.tsx:216`), "Know what to sing tomorrow" (`page.tsx:250`), "Pricing" / "One plan, for life." (`pro-client.tsx:1085-1087`). "Where the apps differ" (`page.tsx:300`) is still a label, and its lede says the same thing again (P3-3). |
| P2 | Exits compete with buy on /pro | **FIXED** | The hero exit is a text link "or keep practicing free" (1028), the final CTA exit is in the mono line (1508-1513), and the Free card keeps its one button. |
| P2 | Footer CV sentence | **KEPT (owner decision)** | `site-footer.tsx:240-257`. Out of scope. |
| P2 | Nav/footer duplicate the body | **PARTLY** | The hero famous link, the chips, the privacy strip and the teaser mono price are cut. Still open: "coach on top of the studio" appears in the teaser paragraph (`page.tsx:253`), the nav drawer (`nav.tsx:338`) and the /pro hero (`pro-client.tsx:1005`). The homepage prints the price 3 times (teaser paragraph 253, teaser button 280, footer 61); pass 4 asked for 2. |
| P2 | Comment bloat | **PARTLY** | v2-banner is gone, the footer's duplicate comment is gone, and the unlock-stack and moments headers are trimmed. Still long: `gate.tsx:91-101` (11 lines for `crescendoCount`), `nav.tsx:295-306` and `:536-551`. The **new stale comments** in `weekly-report-card.tsx:39` ("the release banner is an in-flow card on the homepage") and `:154` ("pattern from v2-banner.tsx") name a component that no longer exists. |
| P3 | /extension privacy ×5, no screenshot | **STILL OPEN** | `app/extension/page.tsx:190, 205, 234` are unchanged. The page has 0 `<Image>`. |
| P3 | Changelog engineer voice | **PARTLY** | Each story now leads with the singer's view; the engineering moved to a trailing sentence (`changelog/page.tsx:150` "a 2048-point spectral classifier…", `:159` "the NSDF detector…", `:248`). |
| P3 | Contact page passive | **FIXED** | `contact/page.tsx:34,54` "We check the evidence and update the page when it holds up." |
| P3 | Six range-test CTA labels | **STILL OPEN** | `grep` finds "Find my vocal range", "Take the 2-minute range test", "Take the range test", "Test my range", "Start free range test", "Free vocal range test", "free 2-minute range test" and "Retake the range test" across about 60 sites. |
| P3 | Song grid card conditional | **STILL OPEN (worse)** | `page.tsx:88` is now 31 words ("Real songs, scored line by line. With a range test saved, songs open fitted to your range; without one they open in the written key and are scored in either octave."). The description is still `hidden sm:block` (234). It is pinned by `lib/song-page.test.ts:353` ("open in the written key and are scored in either octave"). |

---

## 2. New findings (ranked)

### P1

**P1-1 · "First two steps" survives on every free warmup result and on the Stripe Checkout page**
`components/warmups/session-summary.tsx:406`, `components/warmups/routine-summary.tsx:190`, `lib/stripe.ts:174`
Quoted: `line="Pro shows the full daily coach plan, not just its first two steps"`; Stripe product description: "The coach on top of the free vocal studio: the full adaptive daily plan (free shows its first two steps), no daily limit…". The UpgradeCard body beside it explains internal logic: "Tomorrow's three and Today's warmup already read your recent scores on the free plan, this one included." (`session-summary.tsx:408`, `routine-summary.tsx:192`).
Why: pass 4 fixed this on the sales pages, but a free singer sees the line after every warmup. The Stripe description is the last copy a buyer reads before paying.
Fix: line → "Pro lays out every step of tomorrow's plan"; body → "Pro plans every step of tomorrow from scores like these, charts each note's accuracy, and removes the daily limit."; Stripe → "The coach on top of the free vocal studio: every step of the adaptive daily plan, no daily limit on guided practice, …".
Effort: S. Pins: `components/warmups/session-summary.test.tsx:277` ("Pro adds the full daily coach plan, a per-note accuracy chart and no daily limit.", checked in both files) and `lib/stripe-provision.test.ts:149` ("the full adaptive daily plan (free shows its first two steps)").

**P1-2 · UpgradeCard prints the price twice, side by side**
`components/pro/gate.tsx:140` + `components/pro/ui.tsx:94-97`
`ProCrescendoNudge` passes `cta={`Go Pro: ${proHeadline()}`}`, so the button reads "Go Pro: $79 once for lifetime access". UpgradeCard then prints, right beside it, "{proHeadline()} · Never renews" → "$79 ONCE FOR LIFETIME ACCESS · NEVER RENEWS". This happens on every even-numbered free result: range retest, warmups, songs and breath.
Fix: in `gate.tsx:140` set `cta={`Go Pro: ${formatPrice(PRICING.lifetime.amount)} once`}`, the label every other priced button uses (homepage teaser, cap wall), and keep the mono line as the terms. Better still, change the mono line to "Lifetime access · Never renews".
Effort: S. Pins: `components/pro/ui.test.tsx:11-12` ("$79 once for lifetime access", "Never renews"); both survive the first variant.

**P1-3 · The homepage Pro teaser says each perk twice, and its top benefit only once**
`app/page.tsx:252-275`
The paragraph "Suede Pro is the coach on top of the free studio, $79 once for life: no daily practice limit, the full daily plan, per-note accuracy, pitch analysis on every take, and both books." is followed by four bullets: books, full daily plan, per-note chart, pitch analysis. Four of the five perks appear twice within 15 lines. The one benefit a capped singer wants, "no daily limit", is only in the paragraph. The paragraph also repeats the /pro hero (`pro-client.tsx:1005-1007`) almost word for word, so a visitor who clicks through reads it a second time.
Fix: paragraph → "Free shows you today's score. Pro plans every step of tomorrow and lifts the daily limit." (the price stays on the button). Bullets: "No daily limit on guided practice" first, then the existing three pinned strings. Drop "Pitch analysis on every recorded take" or keep it as the fourth.
Effort: S. Pins: `components/landing/pro-claims.test.tsx:26` and `:31` pin two bullet strings (keep them). Nothing pins the paragraph.

### P2

**P2-1 · The /pro hero's priced button is a scroll, not a purchase**
`components/pro/pro-client.tsx:1015-1023`
"Get lifetime Pro: $79 once" is `href="#buy"` and only jumps to the buy card. That card's button has the same label (1206-1209) and is the one that opens Stripe. Anyone who arrives from the nav "Pro" pill clicks a purchase-worded button and lands on a second, identical one: 3 clicks to Stripe instead of 2.
Fix: make the hero a `Button` that calls `goPro("hero")` (add `"hero"` to `BuySpot`, and render the start error beside it as the "end" spot does). The alternative is to keep the jump with an honest label: "See the plan · $79 once".
Effort: S. Pins: `pro-client.test.tsx:79` (hero is `<a href="#buy">`), `:409` (the label appears exactly 3 times), and `:440-445` (button/paragraph order).

**P2-2 · ProInlineNudge and FreeAllowance put full sentences in 11px uppercase mono**
`components/pro/gate.tsx:156`, `components/practice/free-cap.tsx:37`
Rendered as `font-mono text-[11px] uppercase tracking-[0.14em]`: "GUIDED PRACTICE IS 5 FREE MINUTES A DAY; PRO REMOVES THE LIMIT AND UNLOCKS THE FULL COACH PLAN · GO PRO" (`singer-actions.tsx:262`, 17 words, on about 636 landing pages), "PRO CHARTS YOUR RANGE TESTS OVER TIME AND REMOVES THE GUIDED-PRACTICE LIMIT" (`:150`), "PRO CHARTS EACH RETEST, SO YOU CAN SEE WHETHER EITHER EDGE MOVES" (`result-view.tsx:62`), and "N OLDER SESSIONS ARE STORED; PRO SHOWS ALL OF THEM" (`progress-client.tsx:1035`). PRODUCT.md lists "dense caption-sized instructions" as an anti-reference.
Fix: render the sentence in sentence case at `text-xs text-mut` and keep mono only for the chip and the "Go Pro" link, or cap the lines at 8 words. For example: singer page "Pro lifts the daily limit and plans every step"; range "Pro charts every retest on one chart".
Effort: S. Pins: `lib/singer-funnel-regressions.test.tsx` (range-history label), `components/pro/gate.test.tsx`.

**P2-3 · The Pro moment modal says "every step" twice and states its terms four ways**
`components/pro/moments.tsx:231-268`
The body says "…lays out what to sing next: the full daily plan, every step of it, with your accuracy note by note…", and the bullet two lines below says "The coach's full daily plan: every step, built from your own scores." The button reads "Go Pro: $79 once for lifetime access", and the mono line under it adds "One payment · Never renews · Voice stays on device". That is "once", "lifetime", "One payment" and "Never renews" inside one dialog.
Fix: body → "Pro reads results like this one and plans what to sing next, with your accuracy note by note and your range tests charted over time."; button → "Go Pro: $79 once"; mono → "Never renews · Voice stays on device".
Effort: S. No test pins these strings (grep found no moments test).

**P2-4 · /pro repeats its own hero clause in the final CTA**
`pro-client.tsx:1008-1010` "the pitch meter, range test and recorder stay free, with no clock." and `:1455` "The pitch meter, range test and recorder stay free, with no clock." are verbatim. The same fact is also in the Free card (97), FAQ Q1 (`pro-shared.ts:160`) and the hero 7 lines up.
Fix: cut the clause from the hero paragraph, which leaves it at 2 sentences and 33 words. Keep it in the final CTA.
Effort: S. Pins: `pro-client.test.tsx:445` pins only the paragraph's opening words.

**P2-5 · The perks grid still restates the buy card directly above the buy card**
`pro-client.tsx:1041-1075`, then the plans section at 1077
Seven cards ("Adaptive coach plan", "Deep vocal analytics", …), then the buy card's eight bullets, then UnlockStack's tiles, then the 15-row table. "Every song, no daily limit" / "Sing every song past the daily limit" (`lib/pro.ts:581-583`) also repeats itself inside a single card.
Fix: this is pass 4's structural move. Delete section 2 and lift its lede ("Free shows you today's score. Pro shows you the months behind it and plans every step of tomorrow.") into the hero as its one sentence. Or move the grid below the table. Change the songs desc to "Every scored note feeds your accuracy chart."
Effort: M (word-cap test `lib/seo-section-structure.test.tsx` only gets easier).

**P2-6 · Two priced buttons on a capped song summary**
`components/songs/session-summary.tsx:429-437` + `components/songs/songs-client.tsx:519-523`
`ProCrescendoNudge` checks only `!listenMode && !silent`, not the cap, so on an even session it renders a full UpgradeCard ("Go Pro: …") directly above the CapWall ("Keep practicing today with Pro: $79 once"). `warmups/session-summary.tsx:404` behaves the same way and adds a third ask at the cap: its own "Pro has no daily limit" link (476-483). `routine-summary.tsx:186` and `breath-runner.tsx:307` already hide the nudge when capped.
Fix: pass `capped` into both summaries and wrap the nudge in `{!capped && …}`, as routine-summary does. This is rule R5 below.
Effort: S. Pins: `components/warmups/session-summary.test.tsx:93` (the capped link stays).

**P2-7 · /range tells a "Start singing" arrival to switch modes**
`components/range/voice-test.tsx:164-170`
The homepage's main button lands on `/range#start` in Pitch mode, under an intro that says "Find your vocal range free in about two minutes… Choose Range test to start, or Pitch to check a single note live." The pitch gate below then shows a figure captioned "What the range test draws for you" (`pitch-meter.tsx:609-611`). The visitor asked to sing and is pointed at a different tool.
Fix: make the intro fit both modes: "Sing a note to see it live, or take the 2-minute range test for your lowest and highest notes and a voice-type estimate." Under the pitch gate, show the TraceFigure (the one the studio uses) rather than the RangeFigure.
Effort: S. Pins: `components/range/voice-test.test.tsx:68` (comment only; check its assertion).

**P2-8 · The iPhone band shows the website, and has no Android badge**
`components/landing/ios-band.tsx:15-50`
The heading is "Also on iPhone: Suede Voice" and the prose says "Suede Voice for iPhone and Android". The only image is `/room-range.png`, the web range room, captioned in code "the result the app and the browser both start from", and the only badge is the App Store one. A Play listing exists (`lib/app-store.ts:21`).
Fix: either label it honestly ("Same range test, also in Suede Voice") or capture an app screenshot at 2x. Add the Play badge, or drop "and Android" from the sentence.
Effort: S copy / M image. Pins: `ios-band.test.tsx:24,33,39-42` (one `room-range.png`, exactly 2 `<img>`, no `shot-0\d`).

### P3

**P3-1 · "Early Access" is printed four times and never explained** · `page.tsx:247`, `pro-client.tsx:675` ("Early Access is the lifetime plan. The $4.99 monthly plan is sold out."), `:933`, `:1166`. The plans blurb spends its only sentence on a plan nobody can buy. Fix: blurb → "One payment, and Pro is yours for good." Keep the badge on the card and the SectionLabel, and drop the sold-out sentence (the FAQ already carries it, `pro-shared.ts:189`). Effort S. Pins: `pro-client.test.tsx:56,417` and `app/pro/page.test.tsx:24` need "Early Access" somewhere, and the badge keeps it.

**P3-2 · Locked catalogue items link to the top of /pro, not the buy card** · `components/warmups/routine-home.tsx:152, 251`, `app/songs/page.tsx:93`, `components/book/cta.tsx:33`, `components/atlas/cta.tsx:32`, `components/learn/module-practice.tsx:45, 83, 200`, `components/programs/today-card.tsx:559`, `app/learn/page.tsx:270`. Every priced ask goes to `/pro#buy`. These unpriced ones land on the hero and cost one extra click. Fix: keep `/pro` for "See what Pro includes"; send the locked routine and pack cards and the "Pro removes the cap" links to `/pro#buy`. Effort S.

**P3-3 · The comparison heading and its lede say the same thing** · `page.tsx:298-300`: "Suede Sing beside the apps you would compare it to, on the rows where the answers differ." / "Where the apps differ". Fix: h2 "What Suede Sing does free in a browser", lede cut or "Rechecked August 2026." Effort S.

**P3-4 · Two stacked mono kickers above the hero headline** · `hero-split.tsx:74-82`: "SUEDE SING" in violet, then "ONLINE SINGING PRACTICE WITH LIVE PITCH FEEDBACK" in dim, both 12px uppercase mono. Fix: one line inside the H1 span: "Suede Sing · online singing practice with live pitch feedback". The SEO term stays in the H1 (`lib/on-page-seo.test.tsx`). Effort S.

**P3-5 · The grid lede re-lists the grid** · `page.tsx:214`: "Every practice room runs in your browser: live pitch feedback, range testing, warmups, ear training, breath work and song practice." The 11 cards below then name those rooms. Fix: "No install. Open a room, allow the mic, and sing." Effort S.

**P3-6 · The second path's payoff mixes three structures in one sentence** · `paths.tsx:76`: "Then let the coach keep score: Pro adds a per-note accuracy chart, charts your range tests over months, and the coach's full daily plan: every step, built from your own scores." It uses two colons, says "coach" twice, and mixes a noun list with a verb. Fix: "Then let Pro keep score: a per-note accuracy chart, your range tests charted over months, and every step of the coach's daily plan." Effort S. Pins: `pro-claims.test.tsx:37-39` (verbatim; update it with the copy, OVERCLAIM-safe).

**P3-7 · Lesson pages show Pro asks to Pro owners** · `components/learn/module-practice.tsx:41-50, 79-87, 198-203` is a server component with no `NotPro`, so an owner reads "Guided practice is 5 free minutes a day; Pro removes the limit." Fix: wrap the Pro clause in `<NotPro>` from `components/pro/gate.tsx`, as the footer price does. Effort S.

**P3-8 · Stale comments name the deleted banner** · `components/weekly-report-card.tsx:39, 154`. Fix: delete both references. Effort S.

---

## 3. Pro-ask matrix (a free visitor, one screen)

"Linked" means an element that links to /pro or opens it. "Prose" means a free-plan sentence with no link. The nav "Pro" pill is on every page and is not counted. The modal is the one-time ProMoments dialog.

| Route / state | Asks on the page (file:line) | Max on one screen |
|---|---|---|
| `/` | Pro teaser button + ghost (`page.tsx:279-285`); paths payoff, prose (`paths.tsx:76`); footer price link (`site-footer.tsx:61`) | **1** |
| `/range` pitch mode, cold | none linked; after exploring, a prose note (`pitch-meter.tsx:727-733` or `755-760`) | 0 linked + 1 prose |
| `/range` range intro | ProWhisper (`range-test.tsx:500`) | **1** |
| `/range` first result | prose note (`result-view.tsx:802-808`) + ProInlineNudge (`:988`) + LockedPanel "Unlock with Pro" (`:1036`) | **2 linked + 1 prose** (nudge sits directly above the panel) |
| `/range` retest, even session | UpgradeCard with violet priced button (`:990`) + LockedPanel violet button (`:1036`) + modal on leave (`range-test.tsx:327`) | **2 violet buttons + modal** |
| `/studio` cold | ProWhisper (`studio-client.tsx:419`) | 1 |
| `/studio` after Stop | toast ProInlineNudge (`:396`) + gate ProWhisper (`:419`) | **2** |
| `/warmups` home, newcomer | FreeAllowance link (`warmups-client.tsx:618`) + gate ProWhisper (`:740`) | **2** |
| `/warmups` home, returning | FreeAllowance + locked routine cards → /pro (`routine-home.tsx:152`) + "Pro packs" path (`:239-253`) + ProgramEntryCard unlock when paywalled (`warmups-client.tsx:636/710`) | 2–3 |
| `/warmups` single-exercise summary | FreeAllowance (`warmups-client.tsx:844`) + ProCrescendoNudge (`session-summary.tsx:405`) + modal on leave (`:149`); capped: nudge + "Pro has no daily limit" (`:476`) | **2 + modal** |
| `/warmups` routine summary | ProCrescendoNudge (`routine-summary.tsx:189`) + modal (`:121`); capped: CappedAgainNote only | 1 + modal |
| `/songs` gate / library | ProWhisper (`mic-gate.tsx:88`) + prose allowance (`:76-78`); library: FreeAllowance (`songs-client.tsx:401`) + bottom nudge (`library.tsx:707`, far) | 1 linked + 1 prose |
| `/songs` summary | FreeAllowance (`songs-client.tsx:401`) + ProCrescendoNudge (`session-summary.tsx:431`) + modal on leave (`:190`); capped: nudge + CapWall (`songs-client.tsx:521`) | **2 (+ modal); capped: 2 priced buttons** |
| `/ear-training` home | FreeAllowance or CapWall (`ear-training-client.tsx:235-236`) | 1 |
| `/ear-training` results | none inline + modal (`ear/session.tsx:407`); capped: CappedAgainNote (`ear-runner.tsx:202`) | 0–1 + modal |
| `/breath` home | FreeAllowance (`breath-studio.tsx:242`) + prose (`:190`) | 1 + prose |
| `/breath` results | BreathProNudge (`breath-runner.tsx:307/479`) + modal (`:271/437`); capped: CappedAgainNote | 1 + modal |
| `/recorder` before mic | ProWhisper (`recorder-page.tsx:828`) + LockedPanel (`:1181`) | **2** |
| `/recorder` with takes | LockedPanel (`:1181`) + ProInlineNudge (`:1355`) | **2** |
| `/progress` returning | coach nudge (`coach.tsx:490`) or ProgramEntryCard unlock (`progress-client.tsx:925`); LockedPanel "Accuracy by note" (`:990`); log nudge (`:1034`); sync nudge (`:614`) + restore link; WeeklyReportCard capped link on Mondays (`weekly-report-card.tsx:229-239`); modal mount pass (`moments.tsx:140`) | page **4–5 + modal**; screen ≤2 |
| `/programs` program view | priced prose link (`programs-client.tsx:335` or `:342`); paywalled day: "Unlock with Pro: $79 once" (`today-card.tsx:497/525`) + note | 1–2 |
| `/learn` | prose link (`app/learn/page.tsx:270`) | 1 |
| lesson pages | GuidedCapNote + "Part of Suede Pro" links (`module-practice.tsx:45, 83, 200`), shown to owners too | 1–3 |
| `/book` | BookCta "See what Pro includes" + priced mono (`book/cta.tsx:33-39`), twice per page (`app/book/page.tsx:81,182`) | 1 |
| `/singers/[slug]` | ProInlineNudge, one branch at a time (`singer-actions.tsx:150` / `:262`) | **1** |
| `/tools` | standalone ProWhisper (`app/tools/page.tsx:113`) | 1 |

Screens with 2 or more linked asks: range result (both states), studio after Stop, warmups newcomer home, warmups single summary, songs summary (uncapped and capped), recorder (both states), progress. Three rooms already ration their asks: `routine-summary.tsx:186`, `breath-runner.tsx:307` (`!capped`) and `coach.tsx:486` (`hideProNudge`). The rules below generalise those.

### Proposed rule set (minimal)

There are two layers, because two of the asks (ProWhisper and FreeAllowance) are in the server HTML behind prepaint markers to avoid CLS. They have to be suppressed by **static props at the call site**, not by a context that resolves after hydration. A context-based suppression would remove them after first paint and bring the shift back.

**Static rules (props or conditions, no new runtime):**

- **R1 · At the cap, only cap surfaces ask.** In `components/warmups/session-summary.tsx:404` and `components/songs/session-summary.tsx:429`, render `ProCrescendoNudge` only when `!capped` (routine-summary and breath already do). `WeeklyReportCard` (`weekly-report-card.tsx:226`) drops its "Pro has no daily limit" link when a cap surface is on the page; simplest is to keep the sentence and drop the link.
- **R2 · Never ProWhisper beside FreeAllowance.** Delete `<ProWhisper>` from the warmups gate (`warmups-client.tsx:740`); FreeAllowance at `:618` already makes that page's ask. Update `recorder-prepaint.test.tsx` only if the recorder changes too.
- **R3 · Never an inline or crescendo nudge in the same card stack as a LockedPanel.** `result-view.tsx:987-996`: delete the nudge branch and give the LockedPanel the line, using `cta="See every retest on one chart"` and `label="Range over time"`. `recorder-page.tsx:1352-1357`: delete the takes-footer nudge (the panel already asks). On the recorder gate, drop `ProWhisper` (`:828`) while the LockedPanel is rendered.
- **R4 · FreeAllowance on a results view shows the clock without the link.** Add `proLink?: boolean` (default true) to `FreeAllowance` in `components/practice/free-cap.tsx:31`, and pass `proLink={false}` at `warmups-client.tsx:844`, `songs-client.tsx:401` (when `view === "summary"`) and `:441`. The results nudge is that view's one ask.
- **R5 · One ask after Stop in the studio.** `studio-client.tsx:419`: render `ProWhisper` only when `!toast`.
- **R6 · Owners never see an ask.** Wrap the Pro clauses in `components/learn/module-practice.tsx` in `NotPro`.

**Runtime rule (for the client-only asks, which already wait for `useProReady` and so have no SSR presence):**

- **R7 · `ProSlot`: one client-rendered ask per page.** Add `components/pro/slot.tsx` with `ProSlotProvider`, reset on `usePathname()` change and mounted in `app/layout.tsx` around `{children}` next to `<ProMoments />` (`layout.tsx:121`). It exposes `useProSlot(priority)` and returns `granted`. Priority, high to low: `LockedPanel` (3) > `ProCrescendoNudge` (2) > `ProInlineNudge` (1). The highest registered priority wins and ties go to the first registration. Because the choice is by priority, render order does not matter. Wire it into `components/pro/gate.tsx` (`ProInlineNudge` and `ProCrescendoNudge` return `null` when not granted) and `components/pro/ui.tsx` (`LockedPanel` registers at 3; a panel that loses still shows its preview but drops its CTA row). On /progress this leaves one of coach nudge / log nudge / sync nudge / locked panel. `CapWall`, `CapSlide`, `CappedAgainNote` and the ProMoments modal stay outside the slot. The cap surfaces always render (R1 handles them). The modal already makes the crescendo card hold back until it has been seen (`gate.tsx:133`).

Tests to touch: `components/pro/gate.test.tsx` (add slot cases), `components/warmups/session-summary.test.tsx:93` (capped link unchanged), `components/weekly-report-card.test.tsx:120` (link assertion changes with R1), `components/recorder/recorder-prepaint.test.tsx:20-26` (if R3 drops the gate whisper), and `components/songs/mic-gate.test.tsx` (unchanged; the songs gate keeps its whisper).

Result: every screen in the matrix drops to **1 linked ask**, except /progress (1 per page from the slot) and capped screens (the cap surface only).

---

## 4. Funnel click counts (cold free visitor, homepage)

**(a) First sung note**
- Hero "Start singing" → `/range#start` (Pitch mode) → MicGate "Start singing" (`pitch-meter.tsx:603`) → browser permission → sing. **2 clicks + permission.** No ProWhisper on this gate. Good.
- Hero "Find my vocal range" → `/range?mode=range#start` → "Start free range test" (`range-test.tsx:486`) → permission → guided hums. **2 clicks + permission.**
- Friction: the intro over Pitch mode says "Choose Range test to start" (P2-7), and the pitch gate's figure shows the range test.

**(b) Stripe Checkout**
- Teaser "Go Pro: $79 once" (`page.tsx:280`) → `/pro#buy` (focused card) → "Get lifetime Pro: $79 once" → Stripe. **2 clicks.** On a phone the teaser comes after the hero, two path cards with 6 steps, and the 11-card grid.
- Footer "Suede Pro vocal coach, $79 once" → `/pro#buy` → buy. **2 clicks.**
- Header "Pro" pill (`nav.tsx:490`) → `/pro` → hero "Get lifetime Pro: $79 once" (only a jump, P2-1) → the same label on the card → Stripe. **3 clicks.**
- Phone drawer: Menu → "Suede Pro" card → `/pro` → hero jump → buy. **4 clicks.**
- From any cap wall: "Keep practicing today with Pro: $79 once" → `/pro#buy` → buy. **2 clicks.**

**Dead ends and loops**
1. The /pro hero's purchase-worded button does not purchase (P2-1).
2. Locked routine and pack cards and the learn/program "Pro" links land on the /pro hero, not the card (P3-2).
3. At the cap, the songs and warmups summaries show two different Pro buttons (P2-6).
4. The weekly report links to `/pro#buy` from any room on a Monday. That is harmless alone, but it stacks with a CapWall (R1).

---

## 5. Image spots from pass 4

| # | Spot | Status |
|---|---|---|
| 1 | Hero product shot instead of the portrait | **Open.** The portrait remains (`hero-split.tsx:42-52`). |
| 2 | Two-ways-in thumbnails | Open |
| 3 | Feature grid UI crops | Open (glyphs only) |
| 4 | Famous voices on one keyboard | **Partly done.** Each of the 8 cards now draws a `RangeMini` bar on a shared C2–C6 axis (`famous-voices.tsx:81-85`). It is not one keyboard, but it shows the comparison. |
| 5 | iOS band sharp shots | **Partly.** One sharp `room-range.png` replaced the three blurry app shots, but it shows the web room, not the app (P2-8). |
| 6 | Pro teaser / /pro hero book covers | Open (ProVisual sample chart only) |
| 7 | UnlockStack covers | Open |
| 8 | Perks grid crops | Open (moot if the grid goes, P2-5) |
| 9 | /extension screenshots | Open (0 images) |
| 10 | Modal crop of the coach plan | Open |
| 11 | Cap wall "see you tomorrow" mark | Open |
| 12 | Changelog before/after | Open (0 images) |

New since pass 4, outside the 12: "What a session looks like" with `room-studio.png` and `room-progress.png` (`page.tsx:182-193, 334-355`), and the room figures `TraceFigure` (studio gate), `PianoRollFigure` (songs gate) and `RangeFigure` (pitch/range gate), with `components/figures/frame.tsx`.

**Highest-value image left:**
1. **Homepage hero (spot 1).** The assets now exist. Move `room-studio.png`, or the `TraceFigure` in a `FigureFrame`, into the hero's right column at `sm`+ and move the portrait to /pro's "Pro is what keeps free free" strip (`pro-client.tsx:1410-1427`). Today the only product image sits *below* the final CTA buttons (`page.tsx:334`), where almost nobody reaches it. The headline promises "See exactly what came out", and that picture should be the first thing a visitor sees. Effort S.
2. **Book covers on the /pro buy card or UnlockStack and the homepage teaser (spots 6/7).** "Both books in full" is the largest concrete asset Pro sells and still has no picture. Effort M (cover art needed).

---

## 6. What is good (keep)

- **The pass-4 cuts held, and tests now guard them.** `pro-client.test.tsx:404-423` counts each purchase phrase on /pro, `pro-claims.test.tsx` guards the homepage claims, and `ios-band.test.tsx` guards the band. This is the right way to keep sales copy from creeping back.
- **The cap wall** (`free-cap.tsx:62-113`) has a single priced button, the streak in a sentence, the midnight reset, and what is still open. It reads as "see you tomorrow".
- **/pro's buy card** puts the price, then the button, then the bullets (`pro-client.tsx:1192-1222`). Every priced ask lands on `#buy`, with focus. Secure checkout appears once, with the two buyer questions answered under the button (896-902).
- **"Exactly where free ends / No asterisks."** (`pro-client.tsx:1326-1328`) and PLAN_ROWS remain the most honest itemisation on the site.
- **"Pro is what keeps free free. One musician builds this…"** (`:1413-1424`) is still the best why-paid line.
- **Asks already rationed in code:** `ProCrescendoNudge` waits for the modal to be seen (`gate.tsx:133`), `range-test` skips the modal on a first test (`offerPro`), `routine-summary` and `breath-runner` hide the nudge at the cap, `coach.tsx` has `hideProNudge`, the singer page shows one branch at a time, and `NotPro`/`FreeOnly` keep owners out of nearly every surface.
- **First note in 2 clicks** from the homepage, and the pitch meter gate carries no Pro line.
- **The homepage reads cleanly now.** It has one Pro section, one price button, and a 7-row comparison where every row differs.
