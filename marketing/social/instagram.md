# Suede Sing — Instagram launch package

Prepared 2026-08-27 by an Instagram-growth expert agent under the
`suede-instagram-growth` skill, from repo-verified product facts. The account
does not exist yet, so no field below cites account Insights; audience
statements are **Inferred** until Insights exist, platform specs were checked
2026-08-27 against the cited sources (**Observed-public**), and Meta's own UI
is the final authority at creation. Nothing here publishes anything: every
item awaits Jason's approval of exact content and visible identity.

**Verified platform specs used below (Observed-public):** bio 150 characters;
username and name field 30 characters each; the name field and bio are indexed
for search ([Sendible](https://www.sendible.com/insights/instagram-character-limit),
[Replug](https://replug.io/blog/instagram-character-limits)). Reels:
1080×1920, 9:16; multiple 2026 guides report Instagram does not recommend
Reels over 3 minutes to non-followers
([Zeely](https://zeely.ai/blog/how-long-can-instagram-reels-be/),
[Postfast](https://postfa.st/sizes/instagram/reels)). Business vs creator:
both get Insights and ads; business accounts are limited to commercially
licensed audio while creator accounts get the full music library; switching
later loses nothing
([Sociality.io](https://sociality.io/blog/instagram-creator-account/),
[SocialRails](https://socialrails.com/blog/instagram-creator-vs-business-account)).

---

## 1. Handle

Probed 2026-08-27 with a one-shot headless-browser view of each public
profile URL, calibrated against a known-existing control (@suedeai → profile
title) and a known-nonexistent control (→ "Profile isn't available"). "Likely
free" = same signature as the nonexistent control; a banned or reserved
handle can look identical, so the signup screen is the final authority.

1. **@suedesing** — recommended; **likely free (probed)**. Matches the
   product name and the domain (sing.suedeai.ai), 9 characters, distinct
   from @suedeai at a glance because "sing" is the operative word.
2. **@suede.sing** — likely free (probed). Same read with a dot; costs a
   little in verbal mentions ("suede dot sing"), and Facebook would collapse
   it to `suedesing` anyway.
3. **@singwithsuede** — likely free (probed). Verb-first; slightly weaker
   brand-name match.
4. **@suedesingstudio** — likely free (probed). Adds the product's own noun;
   longer, but unambiguous.
5. **@suedesingapp** — likely free (probed). Fine as a last resort.
6. ~~@singsuede~~ — **taken** (probed: an unrelated account, "Gohan
   SingSuede"). Ruled out.

**Recommendation: @suedesing.** If the signup screen contradicts the probe,
take @suede.sing and keep the name field identical either way so search is
unaffected.

## 2. Profile setup

**Name field (searchable, 30-char limit):** `Suede Sing | Vocal Training`
(27 chars). "Vocal Training" is the search keyword; the name field is indexed
(Observed-public, sources above), and this is the highest-intent term the
account can own on day zero (Inferred: matches the site's SEO posture —
glossary, range pages).

**Bio options (150-char limit, line breaks shown):**

Option A — recommended (117 chars):

```
The vocal studio in your browser.
Free. No install. Sing into your mic, watch your pitch live.
Find your range first.
```

Option B — feature-forward (115 chars):

```
Free vocal training in your browser.
Pitch trace, range test, warmups, ear training.
No account needed to practice.
```

Option C — privacy-forward (112 chars):

```
The vocal studio in your browser. Free, no install.
Mic audio is analyzed on-device and never leaves the device.
```

A is recommended: it leads with the site's own tagline, removes the two
biggest objections (cost, install), and ends on the single highest-intent
action. C becomes the bio if comment questions about mic privacy recur (a
labeled swap, logged as a test).

**Category:** Education, with Software Company as fallback. The exact label
list appears only inside account setup; pick the closest to "learning to
sing," not "music/band," so the account is not misread as an artist page.

**Professional account type: Business.** This is a product account for a
brand, the category label and contact surface fit that, and the one real cost
of business accounts — the restricted music library (Observed-public, sources
above) — is neutralized here because every planned post uses original audio:
product sound from screen recordings plus founder voiceover. No planned
content depends on trending licensed audio. If that changes, switching to
creator later loses no followers (Observed-public, same sources).

**Link strategy: one URL —**
`https://sing.suedeai.ai/?utm_source=instagram&utm_medium=social&utm_campaign=profile`.
No link-in-bio aggregator: the objective is qualified traffic to the free
studio, the studio's own homepage routes to every room, and a second hop only
adds drop-off (Inferred). The UTM makes profile taps attributable from day
one; without it, attribution source is "none." A later labeled test may swap
the destination to `/range` (the highest-intent single room); change one
variable, keep the UTM scheme.

**Profile photo:** `assets/avatar-512.png` — the existing app icon (blue
circle, white S of arcs). It is the mark users will see again on the App
Store listing, it survives the small render, and it matches the Facebook
avatar exactly (entity consistency; see geo-wiring.md). Never redraw, trace,
or recolor the S mark. The founder portrait is a content asset (post 8,
collabs, press), not the avatar — this is a product account.

## 3. Content pillars

No observed posts exist, so every "Observed supporting posts" field starts
empty and populates after launch. Allocation is ranked by launch objective,
not split equally.

```
Pillar: Find your voice
Audience job: "What's my vocal range?" / "What voice type am I?" — the question beginners actually search
Proof the account can own it: the product ships a range test that outputs lowest note, highest note, and voice type, free, in a browser
Observed supporting posts: none yet (pre-creation)
Primary format hypothesis: screen-recording Reels with a reveal beat; carousel explainers as the save-format companion
Business bridge: direct — the CTA is the range test at sing.suedeai.ai
Stop condition: after 6 posts, if this pillar's site-tap and follow rates sit below the account's format medians, cut to 1 in 4 posts
```

```
Pillar: See your pitch
Audience job: "Am I actually on pitch?" — self-taught singers with no feedback loop
Proof the account can own it: the live pitch trace against target notes is the product's core surface and is inherently screen-recordable
Observed supporting posts: none yet (pre-creation)
Primary format hypothesis: raw screen-recording Reels, real voice, visible mistakes and corrections
Business bridge: pitch studio and warmups are free rooms; Pro's per-note analytics is the upgrade path once the free loop lands
Stop condition: if average watch time on this pillar trails the account Reel median across 6 posts, rework the opening beat before cutting the pillar
```

```
Pillar: Famous voices, measured
Audience job: "How does my voice compare to singers I know?" — the shareable version of the range question
Proof the account can own it: the /singers room puts famous voices on one keyboard and shows whose range matches yours
Observed supporting posts: none yet (pre-creation)
Primary format hypothesis: Reels — screen recording of a named singer's range on the keyboard, then the overlap reveal
Business bridge: the room itself is a free landing page; SEO singer pages already exist, so IG and search compound
Stop condition: if share rate does not lead the account's Reel median after 5 posts, this pillar loses its distribution job and drops to occasional
```

```
Pillar: Building the studio
Audience job: "Who makes this, and is it legit?" — trust, plus the build-in-public audience
Proof the account can own it: solo founder with a portrait asset, a shipped product, and two written books ("The Measured Voice," 23 chapters; "The Voice Atlas") to excerpt
Observed supporting posts: none yet (pre-creation)
Primary format hypothesis: static founder photo posts and typographic carousels from book material, on the paper-and-ink brand look
Business bridge: Pro ($4.99/month or $79 lifetime) and the iOS app "Suede Studio Voice" are named here, not in every post
Stop condition: hold at 1 in 5 posts regardless of performance; this pillar supports trust, it is not the growth engine
```

## 4. Launch grid: first 9 posts

All nine are producible from the listed ready assets or a screen recording of
the live product. Rights: every asset is owned; famous-singer posts show only
the product's own UI, never photos or recordings of the singers themselves.

**1. Reel — "This is what your voice looks like"** (See your pitch).
Production: screen-record the pitch studio while singing; the fully scripted
version is in section 5. Hook: "This is what your voice looks like." CTA:
"Free at sing.suedeai.ai. Link in bio."

Caption:

```
This is what your voice looks like.

The lanes are target notes. The teal line is my pitch, read live from the mic. Flat sits below the lane. On pitch sits inside it.

It runs free in the browser. No install, and practice works without an account. Mic audio is analyzed on-device and never leaves the device.

Link in bio. Find your range first.
```

**2. Carousel — "What's my vocal range?"** (Find your voice). Production:
6 slides — 1 type-card hook on paper background, 4 screen captures of the
range test flow with one-line ink captions, 1 CTA card. Hook (slide 1):
"What's my vocal range? Answer it in one take." CTA: "Take the test. Link in
bio."

Caption:

```
Your range is two notes: the lowest you can sing and the highest. Everything else is derived.

The range test listens while you slide down, then up, and returns both notes plus your voice type. Free, in the browser, no account needed.

Saved for later is fine. Singing it now is faster. Link in bio.
```

**3. Carousel — the three App Store screenshots** (See your pitch).
Production: post the three dark-green framed screenshots in their existing
order (`public/shot-01…`, `shot-02…`, `shot-05…`). Hook (slide 1 is the
existing "start the session" screenshot; caption line carries the hook):
"Start the session. Hear it. Track the work." CTA: "sing.suedeai.ai — and the
same studio on iOS as Suede Studio Voice."

**4. Reel — range test, start to reveal** (Find your voice). Production: one
continuous screen recording of a real range test, trimmed; the reveal of
lowest note, highest note, and voice type is the final beat. Hook: "Finding
my vocal range in one take." CTA: "Your turn. Link in bio."

Caption:

```
One take: slide down to the floor of your voice, then up to the ceiling.

The test returns your lowest note, your highest note, and your voice type. Mine are on screen. No install, no account, and mic audio is analyzed on-device and never leaves the device.

Link in bio. It takes about as long as this Reel.
```

**5. Reel — "Whose range matches yours?"** (Famous voices, measured).
Production: screen-record the /singers room; pick one singer already present
in the room (verify in-product before recording; do not name a singer the
room does not list), show their range on the keyboard, then the overlap with
a real tested range. Hook: "[Singer]'s range, on a keyboard. Here's where
mine overlaps." CTA: "See whose range matches yours. Link in bio."

**6. Carousel — from The Measured Voice** (Building the studio). Production:
5 typographic slides on the paper background, Instrument Serif display, one
idea from a real chapter of the book (pull the excerpt from the actual text;
no paraphrase presented as quote). Hook: "The Measured Voice: building a
voice you can measure." CTA: "The book ships with Pro. The studio is free
either way."

**7. Reel — warmup scored live** (See your pitch). Production: screen-record
one guided warmup with the real-time score visible; keep one visible miss in
the take. Hook: "A warmup that scores you while you sing it." CTA: "Warmups
are free. Link in bio."

**8. Static — founder introduction** (Building the studio). Production: the
existing founder portrait, no new shoot.

Caption:

```
I'm Jason. I build Suede Sing alone and in public.

It started as a question: why does pitch feedback require a teacher in the room? Now it's a vocal studio in the browser. Pitch trace, range test, warmups, ear training, breath work, a recorder, song practice.

The studio is free. This account is where I show the work.
```

**9. Reel — ear training game** (Find your voice, ear edition). Production:
screen-record one interval or pitch-matching round, including one wrong
answer. Hook: "Sing the interval back. The game knows if you got it." CTA:
"Ear training is free. Link in bio."

Posting order is 1 through 9; posts 1, 2, and 4 land in week zero so the
profile's top row makes the pitch before any outreach begins.

## 5. Reels engine

Duration note: with no account history, 15–45 seconds is a starting test
range, not an optimum (skill default; account evidence will replace it). All
ten hooks map to real product moments.

1. "This is what your voice looks like." (pitch trace, cold open)
2. "Find your vocal range in about a minute. Free, in a browser." (range test)
3. "The lanes are the target. The teal line is me." (pitch studio anatomy)
4. "Your voice type isn't a guess. It's two notes." (range reveal)
5. "[Singer]'s range on one keyboard. Where does yours land?" (famous ranges; verified in-room singer only)
6. "A warmup that scores you while you sing it." (warmups)
7. "Watch me go flat, then fix it." (pitch correction beat)
8. "No install. No account. Just sing." (objection removal over any room)
9. "How long can you hold one note? The timer doesn't round up." (breath control sustain)
10. "Same melody, moved into my range automatically." (song practice auto-transpose)

**Scripted Reel — hook 1, target 28 seconds, 1080×1920, original audio only.**

| Time | Visual | Voiceover | On-screen text | Retention job |
|---|---|---|---|---|
| 0:00–0:02 | Cold open: teal trace already moving across note lanes, mid-exercise | "This is what your voice looks like." | your voice, live | Unfamiliar image plus a claim inside 2 seconds |
| 0:02–0:06 | Cursor reaches a target note; trace locks into the lane | "The lanes are target notes. The teal line is my pitch, live from the mic." | teal = my pitch | Decode the image the viewer is already watching |
| 0:06–0:12 | Deliberately sing flat; trace dips visibly below the lane | "Watch what happens when I go flat." [pause: 0.3s] "There it is." | flat = below the lane | A real mistake, on screen, sets up the fix |
| 0:12–0:18 | Slide up; trace settles inside the lane and holds | "Slide up until the line sits in the lane. That's the note." | that's on pitch | Payoff of the mistake; the product visibly works |
| 0:18–0:24 | Zoom out to the full exercise with accuracy visible | "It runs free in a browser. No install, and practice works without an account." | free · browser · no install | Remove the two objections before the ask |
| 0:24–0:28 | End card: paper background, app icon, URL in ink | "sing dot suede a-i dot a-i. Find your range first." | sing.suedeai.ai | One CTA, one destination |

Rights and claims check: all audio and visuals are owned (own voice, own
product UI); every VO claim maps to a verified product fact; no music track
needed. Experiment variable: this hook family vs hook 2 in week two. Primary
metric: average watch time vs the account's Reel median once one exists;
until then, record raw values only. Readback: log permalink, watch time,
reach split, site taps at the first review checkpoint.

## 6. Keywords & hashtags

**Keyword placement (search surface):** name field carries "Vocal Training";
bio carries "vocal studio," "pitch," "range" naturally inside real sentences;
captions carry the phrase the post answers ("vocal range," "voice type,"
"vocal warmup," "ear training") in the first two lines, because bio and
caption text are indexed (Observed-public, sources above). Alt text on every
image describes the actual screen ("range test result showing lowest note,
highest note, voice type") — accessibility first, and one more indexed
description.

**Hashtag plan — a test, not a quota.** No fixed count is prescribed and no
"best time" is claimed; both are account-level tests (skill rule). Candidate
tags, **Inferred** from audience search language, meaning and current use to
be checked in-app before first use: #vocalrange #voicetype #learntosing
#singinglessons #vocalwarmup #vocalexercises #eartraining #singingpractice.

Test structure, one variable at a time:

- Arm A: 0–3 exact-topic tags. Arm B: 5–8 topical tags. Arm C: Arm B plus
  format tags.
- Rotate arms by post within the same format, holding pillar and posting slot
  constant.
- Primary metric: non-follower share of reach (Computed: non-follower
  accounts reached / total accounts reached, from Insights).
- Decision checkpoint: once each arm has n ≥ 3 Reels, compare medians; keep
  the leading arm, retire the trailing one, log the result. With n this small
  the read is directional, and it is labeled that way in the log.

## 7. 30-day calendar

Timezone America/New_York throughout. Cadence: 2 posts per week after launch
week, plus roughly 30 minutes of engagement on posting days. That is the
lowest cadence that preserves review quality at 2–4 hrs/week (Inferred
capacity math: one screen-recorded Reel ≈ 60–90 min including caption and QA;
one carousel or static ≈ 45–60 min). Tue/Thu 12:00 ET is a held constant so
other variables stay readable; it is not claimed as a best time. Asset owner
is Jason on every row. Every row ships only after his approval of exact
content and identity.

```
Week 0 | Reel + carousel + Reel (grid posts 1, 2, 4) | See your pitch + Find your voice | "no feedback loop when I practice" | hooks per grid | see the product work live | link in bio
Evidence source: product facts 2026-08-26; no account history | variable: none — baseline seeding | primary metric: raw reach + site taps recorded as baseline | Jason
Production: scripts above, record + edit | approval: pending Jason | readback: permalink, reach, watch time, taps per post
```

```
Week 1 | carousel + Reel (grid posts 3, 5) | See your pitch + Famous voices | "how do I compare to real singers" | screenshots hook + singer-overlap hook | recognition + overlap reveal | link in bio
Evidence source: week 0 raw values (n=3, directional only) | variable: pillar (famous-voices debut) | primary metric: share rate = shares / accounts reached | Jason
Production: verify singer exists in /singers before recording | approval: pending Jason | readback: permalink, shares, reach split, taps
```

```
Week 2 | carousel + Reel (grid posts 6, 7) | Building the studio + See your pitch | "is this teachable without a teacher" | book type-card hook + scored-warmup hook | one real idea from the book; a scored rep | book: none hard; warmup: link in bio
Evidence source: weeks 0–1 readbacks | variable: hook family (hook 1 family vs hook 6 family on Reels) | primary metric: average watch time vs Reel median to date | Jason
Production: pull book excerpt from the real text | approval: pending Jason | readback: permalink, watch time, saves, taps
```

```
Week 3 | static + Reel (grid posts 8, 9) | Building the studio + Find your voice | "who makes this" + "is my ear the problem" | founder intro + ear-game hook | trust + a playable game | follow + link in bio
Evidence source: weeks 0–2 readbacks | variable: format (static founder photo vs screen-recording norm) | primary metric: follow rate = follows attributed / accounts reached | Jason
Production: portrait exists; record one ear-training round | approval: pending Jason | readback: permalink, follows, profile actions, taps
```

```
Week 4 | 2 Reels from the hook list (hooks 9, 10) | See your pitch + Find your voice | "breath gives out" + "songs sit wrong in my voice" | sustain-timer hook + auto-transpose hook | a measurable sustain; a song moved into range | link in bio
Evidence source: full 30-day readback table | variable: repeat the leading hook family from week 2's test | primary metric: site taps per post vs account median | Jason
Production: two screen recordings | approval: pending Jason | readback: full day-30 table (section 9)
```

## 8. Day-zero growth tactics

**Sequence matters: seed the grid first.** Posts 1, 2, and 4 go live before
any outreach, so a profile visit converts.

**Follow and engage (manual, by Jason, never automated — skill boundary).**
Follow 30–50 accounts in the singing-education niche over the first two
weeks, not in one burst: vocal coaches who post technique Reels, choir and
a cappella ensembles, musical-theater audition-prep educators, karaoke
communities, worship vocal-team educators. These map to the Inferred audience
segments; treat the mix as a hypothesis and rebalance from who actually
engages back.

**Comment strategy.** 15 minutes on posting days, comments that answer real
questions in vocal-coach comment sections with specifics (what a passaggio
is, how range is measured, why a note reads flat). No link drops; link only
when someone asks where. The account's value in comments is that it talks
like the product: plain, measured, numeric.

**Cross-promo from @suedeai (requires separate approval — parent-account
changes are their own action).** One feed post and one Story with a link
sticker introducing the product account; a "Suede Sing" line in the @suedeai
bio if Jason approves editing it. Keep the visual systems distinct:
paper-and-ink for Suede Sing, so the two accounts never read as duplicates.

**Collab candidates, by type, not name** (no named accounts are proposed
because none were verified this session): independent vocal coaches (product
demo in their voice, collab post), music-education newsletters or YouTube
educators with IG presence (range-test walkthrough), choir or theater program
accounts (group range-test content). Vet each for real audience overlap and
organic engagement before outreach; log outreach and outcomes so collab
performance becomes evidence, not anecdote.

## 9. Measurement

**Objective:** awareness plus qualified traffic to sing.suedeai.ai. The
primary metric is attributed site taps: bio-link taps from Insights
(Observed-owned once the account exists), cross-checked against UTM-tagged
sessions in site analytics. Reach alone is not the goal; taps are the
qualified version of it.

**Diagnostics (Computed, denominators explicit):**

- profile-action rate = profile actions / accounts reached
- follow rate = follows attributed to post / accounts reached
- share rate = shares / accounts reached (distribution check, Famous-voices pillar especially)
- save rate = saves / accounts reached (education check, carousels especially)

No blended engagement score; each rate is read against its own format median,
never across formats (skill rule).

**Day-30 read.** Build the readback table per post: post ID, format, pillar,
hook family, test variable, published at; reach, views, average watch time,
saves, shares, comments, follows; profile actions, site taps; comparable
baseline, result, next decision. Then answer four questions: which pillar
produced the most site taps per post; which hook family led Reel watch time;
did any pillar trip its stop condition; what did the hashtag arms show on
non-follower reach share. Expect n ≈ 11 posts — every conclusion is
directional and labeled Inferred, and the only decisions taken at day 30 are
the pre-committed ones: pillar allocation shifts, the winning hook family
repeated, one new single-variable test queued for days 31–60.

Sources:
[Sendible — Instagram character limits](https://www.sendible.com/insights/instagram-character-limit) ·
[Replug — 2026 character limits](https://replug.io/blog/instagram-character-limits) ·
[Zeely — Reels length 2026](https://zeely.ai/blog/how-long-can-instagram-reels-be/) ·
[Postfast — Reels size](https://postfa.st/sizes/instagram/reels) ·
[Sociality.io — creator vs business](https://sociality.io/blog/instagram-creator-account/) ·
[SocialRails — creator vs business 2026](https://socialrails.com/blog/instagram-creator-vs-business-account)
