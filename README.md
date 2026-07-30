This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Payments (Suede Pro)

Pro is a Stripe subscription — $4/month or $30/year. `STRIPE_SECRET_KEY` decides
which Stripe account and mode the app talks to; see [Going live](#going-live) for
where production points. Locally: `vercel link && vercel env pull`.

There are no accounts and no database, so **Stripe is the only source of
truth** and the flow is built around that:

| Route | Job |
|---|---|
| `POST /api/checkout` | Creates a hosted Stripe Checkout Session. No card field is ever rendered by this app. |
| `POST /api/entitlement` | Resolves entitlement from a `session_id` (right after paying) or a `subscription_id` (re-checks later). |
| `POST /api/restore` | Unlocks Pro on a new device from the subscriber's Pro key. |
| `POST /api/portal` | Opens Stripe's billing portal — this is what makes "cancel in one click" true. |

### Pro keys

Entitlement lives in one browser, so subscribers get a **Pro key** — an HMAC
over their Stripe customer and subscription ids (`lib/pro-key.ts`, signed with
`PRO_KEY_SECRET`). It is shown on `/pro` while Pro is active and is what
`/api/restore` accepts.

A key is proof of *purchase*, not a grant: restore verifies the signature and
then asks Stripe whether that subscription is still live, so a cancelled or
leaked key stops unlocking anything. Keys are derived rather than stored, so a
lost one is regenerated, not looked up:

```bash
node --env-file=.env.local scripts/pro-key.mjs sub_123…      # or an email
```

Restoring by email was removed deliberately: it let anyone who knew a
subscriber's address unlock Pro, and the endpoint doubled as an oracle for
"is this person a subscriber?".

### Rate limiting

Two layers, and the edge one does the real work.

`lib/rate-limit.ts` caps bursts inside the function (429 with `Retry-After`,
8–40 per route). It's free but opportunistic: counters live per function
instance, so a parallel burst that lands on fresh instances can slip past it
entirely. Treat it as a floor, not a guarantee.

The durable layer is a Vercel WAF rule, live on this project:

```
Rate limit Stripe API — path starts with /api/ — 40 requests / 60s per IP — deny
```

Requests denied there never reach the functions and aren't billed. A real
session makes one or two API calls (entitlement revalidation is throttled to
twice a day), so 40/min leaves roughly 20× headroom.

```bash
vercel firewall rules inspect "Rate limit Stripe API"
vercel firewall diff && vercel firewall publish --yes
```

Two things to know before editing it. Changes are **staged** until you publish,
and `edit` silently reports "No changes detected" if you pass only the field you
want to change — re-pass the whole rate-limit config or nothing happens:

```bash
vercel firewall rules edit "Rate limit Stripe API" \
  --action rate_limit --rate-limit-window 60 --rate-limit-requests 40 \
  --rate-limit-keys ip --rate-limit-action deny --yes
```

Passing `--condition` **replaces** the rule's conditions, so omit it unless you
mean to rewrite the path match. WAF counters are per region, so a distributed
caller can exceed the limit by roughly the number of regions it hits.

`lib/pro.ts` caches the last answer in `localStorage`; `components/pro/sync.tsx`
re-checks with Stripe twice a day so a cancellation or failed payment actually
revokes access. Prices are resolved by **lookup key** (`suede_pro_monthly`,
`suede_pro_annual`), never by hardcoded id.

### Going live

Real money goes to the existing **JC INVESTMENT GROUP LLC** Stripe account
(`acct_1SHG7dRdcsaZ58FL`), not to a claimed sandbox.

The Marketplace resource `suede-sing-pro` was deliberately left **unclaimed**.
Claiming it would have minted a *second* Stripe account, starting unactivated
and needing its own business details, bank account, identity verification and
tax setup — splitting Suede Sing's revenue, payouts and 1099s away from the LLC
that already does all of that. The sandbox stays as the test-mode environment
instead.

Live mode is already provisioned in the LLC account:

| | |
|---|---|
| Product | `prod_UymwMKT9x94n1k` — Suede Pro |
| Monthly | `price_1TypNARdcsaZ58FLZkhbk6mJ` — $4.00/mo, lookup key `suede_pro_monthly` |
| Annual | `price_1TypNIRdcsaZ58FLFr5kdy7p` — $30.00/yr, lookup key `suede_pro_annual` |
| Billing portal | the account's existing live default config, cancel-at-period-end enabled |

**Production is live.** `STRIPE_SECRET_KEY` on the `sing` project holds the LLC's
live secret key, and `/api/checkout` mints `cs_live_…` sessions against the
prices above — verified with `livemode: true`, correct amounts, and
`subscription` mode. No code differs between modes: prices resolve by lookup
key, which is exactly why the same build serves both.

`.env.local` still carries the sandbox key, so local development stays in test
mode. That is deliberate — don't pull the live key onto a laptop.

Two traps to know:

- **The Marketplace resource `suede-sing-pro` still exists and originally set
  `STRIPE_SECRET_KEY`.** A re-sync or reinstall of it can overwrite the live key
  and quietly drop production back into test mode. If checkout starts minting
  `cs_test_…` sessions, that is what happened — reset the variable and redeploy.
  Env changes need a rebuild to take effect (`bash scripts/deploy-prod.sh`);
  editing the variable alone changes nothing until then.
- **Test and live are separate data spaces.** Anything created in one is invisible
  to the other, so a live account with no prices under the lookup keys makes
  `/api/checkout` fail. `scripts/stripe-setup.mjs` is idempotent and creates the
  product, both prices and a portal config against whichever key it is given —
  use it if the live catalogue ever needs rebuilding:

  ```bash
  STRIPE_SECRET_KEY=sk_live_… node scripts/stripe-setup.mjs   # live
  npm run stripe:setup                                        # test mode
  ```

  It prints which mode it touched and reports `charges_enabled`.

Verify with one small real purchase — test cards are declined against live keys.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy

Production is **https://sing.suedeai.ai**, served by the Vercel project `sing`
(team `suede-ai-64d39175`). Pushing `main` deploys it; previews are disabled by
the `ignoreCommand` in `vercel.json`.

To force a rebuild — the only way to pick up a changed `NEXT_PUBLIC_*` variable,
since those are inlined at build time:

```bash
bash scripts/deploy-prod.sh
```

It refuses to run unless the tree is clean and at `origin/main`. That guard
exists because `vercel --prod` uploads the working directory rather than a git
ref, so running it from a stale worktree silently rolls production back.

### Domain and canonical URLs

`suedeai.ai` is on GoDaddy nameservers, so each subdomain needs an
`A <sub> 76.76.21.21` record there (GoDaddy gates the save behind an identity
check, so it can't be automated). Every absolute URL — canonicals, `sitemap.xml`,
JSON-LD, OG images — comes from `NEXT_PUBLIC_SITE_URL` via `lib/site.ts`, which
falls back to the `.vercel.app` host when the variable is unset.

Search Console is verified for the whole domain as the `sc-domain:suedeai.ai`
property, so new subdomains need no separate verification — just submit their
sitemap.
