# Suede Sing — Facebook Page launch package

Prepared 2026-08-27 by a Facebook-marketing expert agent under the
`suede-social` skill, from repo-verified product facts. Nothing here is
published or scheduled; every draft is awaiting Jason's approval. Evidence
labels: **Observed-public** = verified against a cited source that day.
**Observed-repo** = verified in this repo. **Inferred** = assumption, marked as
such. Platform limits shift — re-check any spec inside the Page composer.

One edit was made to the agent's package during assembly: the profile photo is
the app icon (same as Instagram), not a wordmark card — one mark across both
platforms is what binds the profiles into a single entity for search and answer
engines. The wordmark + tagline treatment lives on the cover instead
(`assets/fb-cover-1640x720.png`).

---

## 1. Page identity

**Page name: `Suede Sing`.** Exact product name, matches the site header and
the IG account. Don't append the tagline to the name; taglines in Page names
read as spam and break search matching.

**Username options, ranked.** Observed-public rules
([Facebook Help: custom username guidelines](https://www.facebook.com/help/105399436216001)):
letters A–Z, numbers, and periods only; minimum 5 characters; **periods and
capitalization do not differentiate** — `suede.sing` and `suedesing` are the
same username, so a dot-variant is not a fallback; no generic terms or domain
extensions. Also Observed-public
([Help: Page usernames](https://www.facebook.com/help/121237621291199)):
**newly created Pages may not immediately be able to create a username** —
expect a short delay, then claim it the day the option appears.

1. `@suedesing` — clean, matches the IG handle. First choice.
2. `@suedesingapp` — if 1 is taken; still short, still scannable.
3. `@suedesingstudio` — ties to "vocal studio" positioning.
4. `@singsuedeai` — mirrors the domain; last resort, reads backwards aloud.

Whatever lands here should be claimed identically on the new Instagram account
first (IG availability is checkable instantly at signup; Facebook's isn't until
the Page is eligible).

**Categories.** Observed-public: the picker is a searchable, dynamic list of
1,300+ categories, up to three per Page, first is primary
([Mattercall](https://mattercall.com/facebook-pages-list-of-categories),
[oTechWorld](https://otechworld.com/facebook-page-categories-list/)). There is
no static official list, so treat these as search terms to type into the
picker: **primary — "App page"** (if it doesn't surface, "Software");
**secondary — "Education"**; optional third — "Music Lesson" if offered. Skip
"Musician/Band" — that category is for artists and would misfile the Page in
music-scene surfaces.

## 2. Page setup fields

**Intro/bio.** Observed-public caveat: third-party counters disagree on the
current Page bio limit —
[101 characters](https://howmanywords.app/blog/facebook-character-limits) vs.
[155/255 for short/full description](https://lettercounter.org/blog/facebook-character-limit-guide/).
Written to the strictest reported limit so it fits either. Paste-ready,
82 characters:

> The vocal studio in your browser. Free, no install, no account needed to practice.

Alternate (97 chars), if the composer allows and the pitch-trace line tests
better:

> Sing into your mic and watch your pitch trace against target notes, live. Free, in your browser.

**About / longer description** (fits the 255-char reported limit; 234 chars):

> A free vocal studio in your browser. Watch your pitch trace live, find your range, train your ear, practice songs in your key. No install; practice works without an account. Mic audio is analyzed on-device and never leaves the device.

**Website:** `https://sing.suedeai.ai`

**CTA button: "Learn More" → `https://sing.suedeai.ai`.** Observed-public:
available buttons vary by Page type and are chosen from a dropdown that
includes Learn More, Sign Up, Book Now, Contact Us, Send Message, Shop Now and
others ([SocialRails](https://socialrails.com/blog/facebook-cta-buttons-guide),
[ROI Hacks](https://roihacks.com/facebook-call-to-action-buttons/)). Why Learn
More: "Sign Up" would advertise friction the product doesn't have — practice
works without an account — and "Send Message" routes attention to an inbox a
solo founder checks twice a week. The honest promise is "click and you're in
the studio."

**Profile photo:** `assets/avatar-512.png` — the app icon (blue circle, white
S of arcs), identical to the Instagram avatar. The founder portrait carries the
build-in-public posts, not the avatar; the wordmark carries the cover.

**Cover photo:** `assets/fb-cover-1640x720.png` — warm paper, wordmark,
tagline, one teal pitch-trace line locking into an amber target lane.
Observed-public dimensions: displays about 820×312 on desktop and 640×360 on
mobile, with the reliable safe area the ~640×312 center; uploaded at 2×
(1640×720) with all text inside the safe center
([SocialSizes](https://socialsizes.io/facebook-cover-photo-size/),
[Postfast](https://postfa.st/sizes/facebook/cover)). A dense studio screenshot
was rejected for the cover: it loses ~90px per side on mobile and its UI text
becomes unreadable at 312px tall; the dark-green-framed screenshots earn
full-bleed treatment in posts instead. Regenerate the cover any time with
`node marketing/social/assets/render-cover.mjs`.

## 3. Linking & plumbing

**Order of operations (day zero):**

1. Create the Page from Jason's personal profile (profile stays the admin; no
   one else needs access).
2. Create the new Suede Sing Instagram account; set matching handle, avatar,
   and bio; convert it to a professional (business) account in IG settings —
   required for Business Suite management.
3. On the Facebook Page: **Settings → Linked accounts → Instagram → Connect
   account**, log into the new IG, accept the permissions. This is the direct
   path; it registers the pair in Meta Business Suite automatically.
4. Open **business.facebook.com**, confirm both the Page and IG appear under
   the same portfolio, and confirm the existing Suede Labs AI Page sits in the
   same Business Portfolio if one exists — same portfolio, separate Pages. Do
   not merge the Pages and do not rename the parent.
5. Composer check: with the accounts linked, Business Suite can cross-post one
   draft to both FB and IG — the practical win for a founder giving this
   channel ~1–2 hrs/week.

**What stays where:** Suede Labs AI Page = company umbrella (multi-product
announcements, hiring, press). Suede Sing Page = everything in this package.
The parent can share Suede Sing posts occasionally; product content never
originates there.

**Day-zero settings worth changing:**

- **Inbox:** turn on an instant reply in Business Suite inbox — honest
  version: "Thanks — this inbox is checked a few times a week. The studio
  itself is at sing.suedeai.ai, free, no account needed."
- **Moderation:** enable the profanity filter and add a hidden-words list
  (slurs, scam bait like "DM me to promote your page"). New Pages attract bot
  comments before they attract people.
- **Tabs:** hide Reviews (not meaningful for a web app; an empty Reviews tab
  invites drive-by ratings), keep About, Videos, Photos. Order Videos above
  Photos — video is the plan.
- **Notifications:** email digest only; per-event push notifications will eat
  the weekly time budget.

## 4. Content strategy — how Facebook differs from Instagram here

**Native video is the format bet.** The pitch trace is the product's one
visual that means something in two seconds: a voice drawing a teal line
against target notes. Screen recordings of real practice — not motion
graphics — are cheap to make and demonstrate the product without a single
claim. Always captioned; the post must survive mute.

**Link posts, honestly stated:** it is widely reported that outbound-link
posts reach fewer feeds than native media, but Meta publishes no numbers and
account-level results vary. Treat it as a variable to test, not a law. The
calendar alternates link-in-post against link-in-first-comment and lets the
account's own 30-day data decide. Never withhold the link entirely — traffic
is the objective.

**Longer captions work on Facebook.** IG rewards compression; FB tolerates a
100–150-word explainer, which suits a product that needs one paragraph of
"here's what this actually does." Same asset, longer caption on FB, shorter on
IG via cross-post editing.

**Shares are the loop.** The realistic growth path for a zero-follower Page is
not feed reach; it's a choir director sharing a genuinely useful post into
their group. Every post should be built to be worth forwarding to someone
who's learning to sing — that standard, not engagement mechanics, is the
filter.

**Pillars** (shares are starting hypotheses to reallocate at day 30):

| Pillar | Starting share hypothesis | Topics |
|---|---|---|
| Show the studio | 40–50% | Pitch-trace clips, range test walkthroughs, room tours (warmups, ear training, breath control, song practice); Pro/iOS posts fold in here, capped at ~1 in 5 posts |
| Learn to sing | 30–40% | Voice types and range explained, what a warmup is for, breath control basics, interval training — the shareable-into-groups material |
| Build in public | 10–20% | What shipped and why, honest numbers Jason owns, decisions behind rooms |

## 5. First five Page posts (drafts — all awaiting approval)

**(a) Pinned intro post.**
Asset: 30–45s screen recording — load sing.suedeai.ai, open the Pitch studio,
sing one phrase, the teal trace draws against target notes. Captioned.
Fallback: album of the three dark-green-framed screenshots.

> Suede Sing is a vocal studio that runs in your browser.
>
> Sing into your mic and watch your pitch trace against target notes, live. Find your lowest and highest notes and get your voice type. Train your ear with interval and pitch-matching games. Practice songs with the melody transposed into your comfortable range. Record takes. Track streaks and XP.
>
> It's free. No install, and practice works without an account. Mic audio is analyzed on-device and never leaves the device.
>
> Start here: https://sing.suedeai.ai

CTA: link in post (pinned posts are navigation; the link stays in the body).

**(b) Range test post.**
Asset: screen recording of the range test from first note to the voice-type
result screen.

> "What's my vocal range?" is usually where people start.
>
> The range test answers it in a few minutes: sing down to your lowest comfortable note, up to your highest, and the studio maps what it hears into your range and voice type. In your browser, free, no account needed.
>
> https://sing.suedeai.ai

CTA: link in post.

**(c) Famous-ranges post.** (Observed-repo: Freddie Mercury, Whitney Houston,
David Bowie, Mariah Carey all present in `data/singers/`; 26 category files,
hundreds of entries. No specific note data stated in the draft.)
Asset: screenshot of the /singers keyboard with several voices visible.

> Hundreds of famous voices, laid out on one keyboard.
>
> The famous-ranges page puts singers side by side — Freddie Mercury next to Whitney Houston next to David Bowie — so you can see how their ranges compare. Take the range test first, then see whose range matches yours.
>
> https://sing.suedeai.ai/singers

CTA: link in post. The most shareable of the five; expect it to be the one
worth re-cutting as video later.

**(d) Pro / books post.**
Asset: screenshot of a Pro analytics view, or the two books in-app on warm
paper.

> The free studio stays free.
>
> Pro is in Early Access: $4.99/month or $79 lifetime. It adds an adaptive coach that plans your practice, per-note analytics, take analysis, pro warmup packs, the full songbook, and two books with PDFs — The Measured Voice (23 chapters, about 31,000 words) and The Voice Atlas.
>
> Details: https://sing.suedeai.ai

CTA: link in post. (The iOS app, Suede Studio Voice, gets its own slot in
week 4 — iOS only; no Android claim anywhere, ever.)

**(e) Founder build-in-public post.**
Asset: the existing founder portrait (`public/founder-portrait.jpg`).

> Suede Sing is built by one person.
>
> I'm Jason Colapietro. I build in public — the pitch studio, the range test, the famous-ranges keyboard, the songbook, all of it ships from one desk, and this Page is where I'll post what ships and why.
>
> If you're learning to sing: the studio is free and runs in your browser. https://sing.suedeai.ai

CTA: link in post.

## 6. Groups strategy — the real distribution channel

**Join as Jason's personal profile**, not the Page. Most groups reject Pages,
and a founder posting as himself is credible where a brand is noise. Group
types worth finding (search these queries in Facebook's group search; no named
groups here — membership counts and rules must be checked live, not
fabricated): `learn to sing` · `singing tips for beginners` · `vocal coaches`
/ `voice teachers` · `choir directors` · `worship leaders` / `worship
vocalists` · `karaoke` (+ city) · `musical theatre performers` / `audition
prep` · `barbershop harmony` · `a cappella`. Prioritize 4–6 groups: at least
one beginner group, one teacher/pedagogy group, one worship or choir group.

**Value-first rules (many groups ban links — respect that):**

1. Read pinned rules before the first comment. "No self-promo" means none —
   contribute answers there and never link.
2. First two weeks in any group: answer questions with substance and zero
   links. A useful answer about finding your range needs no URL to be useful.
3. Link only when: the rules allow it, someone explicitly asks for a tool, or
   the group runs a designated promo thread. Always with disclosure: "I built
   a free browser tool for this" — undisclosed founder-linking is against most
   rules and corrosive when discovered.
4. Never DM group members. Never post the same text in multiple groups.

**Two-week participation test:** 15–30 minutes per session, 3–5 days/week, for
two weeks. Each session: triage replies on owned posts, draft 2–5 substantive
answers in the chosen groups, at most one link placement across the whole week
and only where legitimate. Measure: qualified replies received, profile
visits, and clicks on a group-specific UTM link
(`?utm_source=facebook&utm_medium=group`) vs. the Page's UTM. At day 14,
compare time cost per click against Page posting and decide where month 2's
hours go.

## 7. 30-day cadence & calendar (America/New_York)

Lowest sustainable cadence for ~1–2 hrs/week: **2 Page posts/week + 1–2 group
sessions/week.** Weeks run Mon–Sun from Page-creation day ("W1"). Every row's
approval status is **awaiting approval** and asset owner is **Jason**.

**W1 slot 1 (Tue ~12:00 ET)** | Facebook | Show the studio | pinned intro: "a vocal studio that runs in your browser" | reader understands the whole product in one post | Learn More → sing.suedeai.ai
Evidence: repo product facts 2026-08-26 | variable: none — baseline post | metric: link clicks (UTM)

**W1 slot 2 (Sat ~10:00 ET)** | Facebook | Show the studio | range test: "what's my vocal range?" | a few minutes to range + voice type, free | link in post
Evidence: repo product facts | variable: native video vs image | metric: link clicks

**W2 slot 1 (Tue ~12:00 ET)** | Facebook | Learn to sing | famous ranges: hundreds of voices on one keyboard | see whose range matches yours | link to /singers
Evidence: repo `data/singers/` verified 2026-08-27 | variable: link in post vs first comment | metric: shares

**W2 slot 2 (Sat ~10:00 ET)** | Facebook | Learn to sing | what a voice type actually tells you | plain explainer, shareable into groups | soft link, first comment
Evidence: drafted from the app's own copy — no outside pedagogy claims | variable: explainer text post vs graphic | metric: shares

**W3 slot 1 (Tue ~12:00 ET)** | Facebook | Show the studio (promo slot) | the free studio stays free; Pro adds the coach + 2 books | $4.99/mo or $79 lifetime, stated flat | link in post
Evidence: repo pricing facts | variable: books-led vs analytics-led framing | metric: link clicks

**W3 slot 2 (Sat ~10:00 ET)** | Facebook | Show the studio | 20s warmups clip: guided, scored as you sing along | the studio scores in real time | link in post
Evidence: repo product facts | variable: repost window (Sat vs Tue) for video | metric: 3-sec video views → clicks

**W4 slot 1 (Tue ~12:00 ET)** | Facebook | Build in public | founder post: built by one person | face + why behind the product | link in post
Evidence: founder facts; portrait exists | variable: portrait vs desk photo | metric: follows + clicks

**W4 slot 2 (Sat ~10:00 ET)** | Facebook | Show the studio (promo slot) | iOS companion: Suede Studio Voice | App Store link for iPhone users; iOS only | link to App Store listing
Evidence: verified listing id6767763231 | variable: FB → App Store click-through | metric: outbound clicks

Group sessions: 2×/week in W1–W2 (the participation test), then per test
results in W3–W4. Timing note: the Tue/Sat slots are a starting guess, not
account evidence; keep slots fixed for 30 days so day-30 comparisons are
clean, then adjust from Insights.

## 8. Small-budget note

Do not boost anything at day zero. A boost on a zero-history Page mostly buys
shallow likes from accounts that never return, and "Page like" campaigns are
the weakest spend on the platform. The one small test that can make sense:
after 2–3 weeks, if one post clearly leads on organic shares or clicks, put
$30–50 behind that post with a link-click objective targeted at interest
categories matching the group types above — as a creative test, not a growth
plan, judged on cost per UTM-verified click. Anything beyond that single test
routes to `suede-ads`.

## 9. Measurement

**Primary metric: UTM-tagged link clicks landing on sing.suedeai.ai from
Facebook** (`utm_source=facebook`, `utm_medium=organic` vs `group`) — measured
in site analytics, not FB's click count, because the objective is qualified
traffic, not reach.

**Diagnostics:**

1. **Shares per post** — the FB loop; the pillar that earns shares earns next
   month's slots.
2. **Native video vs link-post reach**, same-week pairs — settles the
   link-penalty question with this account's own data instead of folklore.
3. **Group test yield** — clicks and qualified replies per hour spent, vs the
   same for Page posting.
4. **Follower growth** — tracked but explicitly secondary; a 50-follower Page
   that sends 200 real visitors is beating plan.

**Day-30 read:** which pillar drove clicks; whether groups or the Page earned
more traffic per hour; whether link placement mattered. Those three answers
set the month-2 calendar. If Pro or App Store clicks show up organically,
that's the trigger to scope a paid test properly via `suede-ads`.

---

**Open approvals needed before anything goes live:** username choice, all copy
above verbatim, cover art, the instant-reply text, and Jason acting as himself
in groups. Nothing is scheduled.

Sources for platform specs:
[FB username guidelines](https://www.facebook.com/help/105399436216001) ·
[FB Page usernames](https://www.facebook.com/help/121237621291199) ·
[SocialSizes cover specs](https://socialsizes.io/facebook-cover-photo-size/) ·
[Postfast cover specs](https://postfa.st/sizes/facebook/cover) ·
[character-limit counters (conflicting)](https://lettercounter.org/blog/facebook-character-limit-guide/),
[howmanywords](https://howmanywords.app/blog/facebook-character-limits) ·
[SocialRails CTA guide](https://socialrails.com/blog/facebook-cta-buttons-guide) ·
[Mattercall categories](https://mattercall.com/facebook-pages-list-of-categories) ·
[oTechWorld categories](https://otechworld.com/facebook-page-categories-list/)
