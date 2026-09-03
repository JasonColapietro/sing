# GEO wiring for the Suede Sing social profiles

> **Status 2026-08-27 — Instagram is wired and live. Facebook is not.**
> The account is `@suedesingapp` (not `suedesing`: `facebook.com/suedesing`
> already resolves to an unrelated page, so both platforms take the `-app`
> form to stay matched). Patch 1 landed in `sing@dbb5a81`, patch 2 in
> `10ddb15`, patch 3 in `Suede-AI-App#1038` — all three verified live.
> Facebook is deliberately absent: `facebook.com/suedesingapp` serves
> "content isn't available", and a sameAs that does not resolve is a worse
> claim than none. Add it when a Page URL resolves.
>
> Two things learned applying it: `${APP_NAME}` is **"Suede Voice"**, the
> iOS app's name and the site's retired brand — never interpolate it when
> you mean the site. And the Wikidata divergence noted in patch 3 below was
> an artefact of a stale local checkout; `origin/main` already had it.

The generative-engine side of this launch. The point: when the Instagram
account and Facebook Page exist, search and answer engines must resolve them
to the same entity as sing.suedeai.ai — one name, one mark, one set of claims,
bound by schema. None of this ships before the accounts exist: **a `sameAs`
pointing at a 404 is a worse claim than no `sameAs` at all** (that rule is
already written at the top of `lib/organization.ts`, and it governs here).

## Entity-consistency rules (apply at account creation)

These are what make the engines merge the profiles into one entity instead of
three weak ones:

1. **Name:** exactly `Suede Sing` everywhere — IG name field, FB Page name,
   site header. (IG's name field appends the keyword: `Suede Sing | Vocal
   Training`; the leading token is still the exact name.)
2. **Handle:** identical on both platforms. Target `suedesing`; whatever IG
   grants at signup, Facebook takes the same string (FB ignores dots and
   case, so decide on IG first, where availability shows instantly).
3. **Mark:** the same avatar file on both — `assets/avatar-512.png`, the app
   icon. Never a different crop or recolor per platform.
4. **Claims:** bios and About text are already copied verbatim from site
   strings (tagline, feature line, the on-device privacy sentence). If a
   claim changes on the site, change it on the profiles the same week.
5. **Website field:** `https://sing.suedeai.ai` on both profiles. The IG bio
   link carries UTM (`?utm_source=instagram&utm_medium=social&utm_campaign=profile`);
   the FB website *field* stays clean (it's an identity signal, not a
   campaign link — FB post links carry the UTMs instead).
6. **Cross-linking:** site → profiles via `sameAs` (patch 1) and llms.txt
   (patch 2); profiles → site via the website fields. Both directions are
   required for confident entity resolution.

## Patch 1 — `lib/organization.ts` (this repo)

Apply when both profiles are live, substituting the final URLs. The array
feeds the Organization JSON-LD on every page that emits it (homepage, /pro,
/singers, /extension, and the rest).

```diff
 export const ORG_SAME_AS = [
   "https://suedeai.org/",
   "https://x.com/AISUEDE",
   "https://github.com/Suede-AI",
   "https://www.youtube.com/@aisuede",
   "https://www.instagram.com/suedeai/",
+  "https://www.instagram.com/suedesing/",
   "https://www.facebook.com/people/Suede-Labs-AI/61584534847516",
+  "https://www.facebook.com/suedesing",
   "https://t.me/SUEDEAI",
   "https://linktr.ee/suedelabsai",
   "https://www.crunchbase.com/organization/suede-labs-ai",
   "https://www.linkedin.com/company/suede-labs",
   "https://www.wikidata.org/wiki/Q141169484",
 ] as const;
```

Facebook note: until the Page is granted its username, its only URL is the
numeric one (`facebook.com/people/…/<id>` or `profile.php?id=…`). Ship the
numeric URL in the first pass if the vanity isn't granted yet, then swap to
the clean URL the day it lands — same rule, no 404s, no redirects-by-guess.

## Patch 2 — `lib/llms-txt.ts` (this repo)

Add one bullet to the official-surfaces list, directly after the App Store
line (currently line ~130):

```diff
 - [App Store listing](https://apps.apple.com/app/id6767763231): ${APP_NAME}: Vocal Range Test for iPhone
+- Official social profiles: Instagram (https://www.instagram.com/suedesing/) and Facebook (https://www.facebook.com/suedesing). These two are the only ${APP_NAME} accounts; the parent company posts separately as @suedeai.
```

llms.txt is the site's contract with AI crawlers; naming the only official
accounts there is what lets an answer engine say "the official Instagram is
@suedesing" instead of guessing — and refuse impostors.

## Patch 3 — suedeai.ai mirror (suede-home, separate repo)

`lib/organization.ts` says the sameAs list is maintained "here *and* on
suedeai.ai." Verified 2026-08-28 — the parent's list is:

```
~/code/Suede-AI-App/suede-home/src/lib/seo-entity.ts
export const SUEDE_ORG_SAME_AS = [ … ]   (line 61)
```

Add the same two profile URLs there. Three things to know before touching it:

1. **It has a guard test** — `tests/seo-entity-source.test.mjs` in suede-home.
   Run it after editing.
2. **That file states the stricter rule this repo also follows**: sameAs must
   list URLs that "resolve where they say they do." Four entries were deleted
   on 2026-08-09 for being redirects rather than identities, and five more on
   2026-08-19 for being Suede's own sub-brands rather than alternate profiles
   of the organization. A Suede Sing *profile* is a genuine alternate profile
   and belongs; the sing.suedeai.ai *site* would not.
3. **The two lists already diverge** and this patch does not close that.
   sing's `ORG_SAME_AS` carries twelve entries, the parent's ten — the parent
   omits `https://www.wikidata.org/wiki/Q141169484`, which is the strongest
   single identity edge in sing's list. Worth reconciling in its own pass;
   flagged here rather than fixed silently, because the parent's list is
   governed by that repo's audit history, not this one's.

## Optional, later

- **@suedeai IG bio** gains a "Suede Sing" mention when cross-promoting
  (parent-account edit — Jason's call, separate approval).
- **Wikidata** (Q141169484 is the org): product-profile claims there are a
  manual, human edit if ever wanted; not part of this pass.

## Done already: link previews (2026-08-28)

Before any post goes out, the link has to preview correctly — a Facebook post
whose card is a bare text link is a wasted post. A sweep with Facebook's own
crawler UA found **eight pages serving with no `og:image` at all**: `/range`,
`/songs`, `/extension`, `/changelog`, `/book`, `/glossary`, `/atlas` and
`/atlas/vocal-range-by-voice-type`. Two of those are the surfaces this launch
points at hardest — `/range` is the Instagram bio-link destination, and
`/extension` is the Chrome Web Store funnel.

Cause: Next replaces the `openGraph` object wholesale at the deepest segment
that declares one, so every page that set `openGraph` to carry its own title
silently dropped the sitewide card. Fixed in `f1adce0` — `lib/og.ts` owns the
card, the eight pages name it, and `lib/og.test.ts` fails the suite if a ninth
page repeats it. All 21 audited pages now serve the card from
`sing.suedeai.ai`.

Re-audit any time (the file tree will not show this — only the served HTML
does):

```bash
FB="facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"
curl -s -A "$FB" -H "Accept: text/html" https://sing.suedeai.ai/range | grep -c 'property="og:image"'
```

After the accounts exist, run each launch URL through Facebook's Sharing
Debugger once to force a fresh scrape — Facebook caches the old imageless
version, so a link shared before the fix keeps previewing wrong until it is
re-scraped.

## Verification checklist (run after patches deploy)

```bash
# profiles resolve
curl -s -o /dev/null -w '%{http_code}\n' -A "Mozilla/5.0" https://www.instagram.com/suedesing/
# sameAs is in the rendered page
curl -s https://sing.suedeai.ai/ | grep -o 'instagram.com/suedesing' | head -1
# llms.txt names the profiles
curl -s https://sing.suedeai.ai/llms.txt | grep -i 'instagram'
```

Then: Google Rich Results test on the homepage (Organization parses, no
errors), and a spot-check that the profiles' website fields still point at
sing.suedeai.ai. The fastest way to apply all of this: tell Claude the final
handles and say "wire the socials in" — patches 1–3 plus verification are one
short session.
