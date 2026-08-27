# Suede Sing — social launch kit (Instagram + Facebook)

Assembled 2026-08-27 by two platform-expert agents running the
`suede-instagram-growth` and `suede-social` skills against repo-verified
product facts. Everything is paste-ready; nothing is published. Claude cannot
create the accounts (account creation and credential entry are outside what
the agent is permitted to do), so the creation step is Jason's — everything
around it is done.

| File | What's in it |
|---|---|
| [instagram.md](instagram.md) | Handle, bio, pillars, first 9 posts, scripted Reel, hashtag test, 30-day calendar, growth tactics, measurement |
| [facebook.md](facebook.md) | Page identity, setup fields, IG↔FB linking, first 5 posts, Groups strategy, 30-day calendar, measurement |
| [geo-wiring.md](geo-wiring.md) | Entity-consistency rules + staged `sameAs` / llms.txt patches (apply after the accounts exist) |
| [assets/](assets/) | `avatar-512.png` (both platforms), `fb-cover-1640x720.png` (+ HTML source and re-render script) |
| [assets/carousel-range/](assets/carousel-range/README.md) | **Post 2, finished** — six 1080×1350 slides, caption, and per-slide alt text. Upload and go. |
| [assets/carousel-book/](assets/carousel-book/README.md) | **Post 6, finished** — six slides from chapter one of The Measured Voice, quotation-checked. |

## What's ready vs. what needs your voice

Of the nine Instagram launch posts, **four need no production work**:

| Post | State |
|---|---|
| 2 — What's my vocal range? | Slides rendered, caption written |
| 3 — The three App Store screenshots | Assets already in `public/`, caption in instagram.md |
| 6 — From The Measured Voice | Slides rendered, caption written, quotes verified |
| 8 — Founder introduction | `public/founder-portrait.jpg` + caption in instagram.md |

The other five — 1, 4, 5, 7, 9 — are screen recordings of you singing into
the studio, the range test, the famous-ranges keyboard, a warmup, and an ear
training round. Nobody can make those but you; post 1 is fully scripted
second-by-second in [instagram.md](instagram.md) §5.

Facebook's first five posts reuse the same material: (a) and (b) want the same
recordings, (c) and (d) are screenshots, (e) is the portrait.

## Decisions already made

- **Name:** `Suede Sing` on both platforms (IG name field: `Suede Sing | Vocal Training`).
- **Handle:** `@suedesing` on both. A headless-browser probe on 2026-08-27
  found no active account at instagram.com/suedesing (same "Profile isn't
  available" signature as a known-nonexistent control), so it is very likely
  free — the signup screen is the final authority. Facebook takes the same
  string; FB ignores dots and case, so claim IG first.
- **Avatar:** the app icon (`assets/avatar-512.png`) on both — one mark, one
  entity.
- **Cover (FB):** `assets/fb-cover-1640x720.png` — paper, wordmark, tagline,
  teal trace locking into the amber lane. Regenerate:
  `node marketing/social/assets/render-cover.mjs`.
- **Account types:** IG professional → Business (full reasoning in
  instagram.md §2); FB Page categories: App page + Education.
- **Link discipline:** profiles point at `https://sing.suedeai.ai`; IG bio
  link carries `?utm_source=instagram&utm_medium=social&utm_campaign=profile`;
  FB post links carry `utm_source=facebook` with `utm_medium=organic|group`.

## Known before you start

- **Facebook's `suedesing` vanity already fuzzy-matches an unrelated Budapest
  design firm** ("SueDesign"). It may still be grantable at Page creation —
  if it is refused, `suedesingapp` is the ranked fallback in
  [facebook.md §1](facebook.md).
- **Link previews were broken sitewide and are now fixed** (2026-08-28,
  commit `f1adce0`): eight pages, `/range` among them, shared with no image.
  Details and the re-audit command are in [geo-wiring.md](geo-wiring.md).

## Jason's part — creating the accounts (~15 minutes)

1. **Instagram** (in the app): create a new account with the accounts email
   you run the Suede properties from. Username `suedesing` — the signup
   screen confirms availability live; fallbacks in instagram.md §1.
2. Settings → switch to a **professional account → Business**. Category per
   instagram.md §2.
3. Paste from instagram.md §2: name field, bio option A, link (with UTM).
   Upload `assets/avatar-512.png`.
4. **Facebook**: from your personal profile, create a Page named
   `Suede Sing`. Paste category, Intro, About, website, CTA from
   facebook.md §§1–2. Upload the avatar and `assets/fb-cover-1640x720.png`.
   Claim username `suedesing` when the option appears (new Pages sometimes
   wait a few days).
5. Page **Settings → Linked accounts → Instagram → Connect** the new IG.
   Day-zero settings per facebook.md §3 (instant reply, moderation, hide
   Reviews, Videos above Photos).
6. Post the pinned FB intro (facebook.md §5a) and IG posts 1–2
   (instagram.md §4) whenever the first screen recording is ready.

## After the accounts exist

Tell Claude the final handles and say **"wire the socials in"** — that
applies geo-wiring.md: `ORG_SAME_AS` + llms.txt patches here, the matching
sameAs addition on suedeai.ai (suede-home), and the verification checklist.
Until then the site intentionally makes no claim about these profiles.
