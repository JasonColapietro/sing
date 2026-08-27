# Launch handoff

Paste the "Prompt for Claude" block below into a fresh Claude Code session in
this repo. The section above it is the part only Jason can do.

Do not ask a Claude session to create the accounts. It will decline — signing
up means entering credentials and accepting Meta's terms as the account owner,
which is not something an agent does on someone's behalf. That is the whole
reason this file splits the work the way it does.

Routing it to Codex does not change that, and it also does not work
mechanically: `codex exec` runs in a workspace sandbox with no browser session
and no way to receive the SMS or email verification Meta requires, so a
signup attempt stalls at the first verification step whatever it is told.
Codex is useful *after* the accounts exist — see Part 2b.

---

## Part 1 — Jason, about fifteen minutes

Every field below is tap-to-copy in the launch artifact, or in
`marketing/social/instagram.md` §2 and `marketing/social/facebook.md` §§1–2.

1. **Instagram**: new account, username `suedesing` (the signup screen
   confirms availability live; fallbacks are ranked in instagram.md §1).
2. Settings → **professional account → Business**. Category: Education.
3. Paste the name field, bio option A, and the UTM'd link. Upload
   `marketing/social/assets/avatar-512.png`.
4. **Facebook**: from your personal profile, create a Page named `Suede Sing`.
   Paste categories, Intro, About, website, and set the CTA to Learn More.
   Upload the same avatar plus `assets/fb-cover-1640x720.png`.
   Claim the username `suedesing` when Facebook offers it — new Pages
   sometimes wait a few days, and it may be refused because it fuzzy-matches
   an unrelated page. `suedesingapp` is the fallback.
5. Page **Settings → Linked accounts → Instagram → Connect**.
6. Day-zero settings per facebook.md §3: instant reply on, profanity filter
   on, Reviews tab hidden, Videos above Photos.

Then hand the session the prompt below, with the real handles filled in.

---

## Part 2 — Prompt for Claude

```
The Suede Sing social accounts now exist:
  Instagram: @<handle>
  Facebook Page: <full URL, numeric is fine if the vanity was not granted>

Work in ~/sing (this repo, not ~/code/sing). Do these in order:

1. Wire the profiles into the site's entity graph, following
   marketing/social/geo-wiring.md exactly. Verify each profile URL resolves
   before adding it — a sameAs pointing at a 404 is worse than no sameAs.
   That means: ORG_SAME_AS in lib/organization.ts, the official-profiles line
   in lib/llms-txt.ts, and the matching addition to SUEDE_ORG_SAME_AS at
   ~/code/Suede-AI-App/suede-home/src/lib/seo-entity.ts:61 (which has its own
   guard test, tests/seo-entity-source.test.mjs).

2. Deploy, then run the verification checklist at the end of geo-wiring.md.

3. Run every URL in the launch calendars through Facebook's Sharing Debugger
   to force a fresh scrape. Eight pages shared with no image until commit
   f1adce0, and Facebook caches the old scrape — so any link shared before
   that keeps previewing wrong until it is re-scraped. Details in
   geo-wiring.md.

4. Confirm the UTM'd bio link registers in site analytics once there is real
   traffic.

Do not post anything, schedule anything, or edit the accounts. The carousels
are uploaded by hand — 26 slides in marketing/social/assets/carousel-*/, each
folder with its caption and per-slide alt text in its README.
```

### Part 2b — same work, routed to Codex

The repo-side half of Part 2 runs fine on the Codex CLI, and costs nothing
against the Anthropic weekly limit. It cannot do the suede-home mirror (that
is a second repo) or the Sharing Debugger pass (needs a browser session), so
those stay with Claude or with you.

```bash
codex exec --sandbox workspace-write -C ~/sing "The Suede Sing social accounts
now exist: Instagram @<handle>, Facebook <full URL>.

Apply patches 1 and 2 of marketing/social/geo-wiring.md — ORG_SAME_AS in
lib/organization.ts and the official-profiles line in lib/llms-txt.ts — using
those exact URLs. Before adding either URL, curl it and confirm it resolves;
a sameAs pointing at a 404 is worse than no sameAs, and that rule is written
at the top of lib/organization.ts.

Then run: npx vitest run, and npm run build. Commit to a branch cut from
origin/main and open a PR. Do not push to main, do not touch the accounts,
and do not edit geo-wiring.md itself."
```

---

## Part 3 — posting the carousels

Four finished carousels, uploaded by hand, captions and alt text in each
folder's README:

| Folder | Slides | Post |
|---|---|---|
| `carousel-range/` | 6 | "What's my vocal range?" — the opener |
| `carousel-range-test/` | 7 | Reading your range test |
| `carousel-book/` | 6 | Your voice is not an instrument you own |
| `carousel-numbers/` | 7 | When the numbers lie to you |

**Do not post all four in one week.** The range carousel goes first — it
answers the question beginners actually search, and the profile needs
something in the grid before any outreach. The other three are spaced across
the 30-day calendar in instagram.md §7, one variable changing at a time, so
that at day 30 there is something to read: which pillar earned site taps,
which hook family held watch time. Posting the whole library at once burns it
and produces no signal.

Five of the nine launch posts are screen recordings — the studio, the range
test, the famous-ranges keyboard, a warmup, an ear-training round. Post 1 is
scripted second by second in instagram.md §5.
