# GEO wiring for the Suede Sing social profiles

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
   "https://www.linkedin.com/company/suede-labs-ai",
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
suedeai.ai." When patch 1 lands, make the matching addition to the parent
site's organization schema in the `suede-home` project (inside the
Suede-AI-App monorepo) so both surfaces assert the same profile set.

## Optional, later

- **@suedeai IG bio** gains a "Suede Sing" mention when cross-promoting
  (parent-account edit — Jason's call, separate approval).
- **Wikidata** (Q141169484 is the org): product-profile claims there are a
  manual, human edit if ever wanted; not part of this pass.

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
