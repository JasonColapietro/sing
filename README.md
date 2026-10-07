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

Pro is sold at Early Access pricing: a $4.99 monthly subscription or a $79
lifetime purchase. `STRIPE_SECRET_KEY` decides which Stripe account and mode
the app talks to; see [Going live](#going-live) for where production points.
Locally: `vercel link && vercel env pull`.

There are no accounts and no database, so **Stripe is the only source of
truth** and the flow is built around that:

| Route | Job |
|---|---|
| `POST /api/checkout` | Creates a hosted Stripe Checkout Session. No card field is ever rendered by this app. |
| `POST /api/entitlement` | Resolves entitlement from a `session_id` (right after paying), `subscription_id`, or lifetime `payment_intent_id`. |
| `POST /api/restore` | Unlocks Pro on a new device from the purchaser's Pro key. |
| `POST /api/portal` | Opens Stripe's billing portal for monthly and legacy annual subscribers. Lifetime purchases do not use the portal. |
| `POST /api/redeem` | Turns a comp code into a 30-day pass, as a real trialing subscription with no card. |

### Comp codes

`PRO_COMP_CODES` is a comma-separated list; handing a code out and revoking it
are both an env var edit. Matching is case- and whitespace-insensitive.

**A code is reusable without limit by default.** That suits a code sent to a
mailing list and is dangerous for one that ends up somewhere public, because
every redemption mints a real Stripe customer and subscription — so an
uncapped leaked code is both unbounded free Pro and unbounded object creation.

Set a total per code to bound it:

```bash
PRO_COMP_MAX_REDEMPTIONS=50
```

The counter is atomic and lives in the same Upstash store as cloud sync, keyed
`comp:used:<CODE>`. It only runs when the cap is set, so the store stays
optional otherwise. Raising the cap later resumes from the true count; to reset
a code, delete its key. If a cap is configured and the store can't be reached,
redemption fails closed with a 503 rather than silently granting uncapped
passes — the opposite of what setting the cap asked for.

### Pro keys

Entitlement lives in one browser, so purchasers get a **Pro key**, an HMAC over
their Stripe customer and billing reference (`lib/pro-key.ts`, signed with
`PRO_KEY_SECRET`). The billing reference is a subscription id for monthly or
legacy annual access and a PaymentIntent id for lifetime access. The key is
shown on `/pro` while Pro is active and is what `/api/restore` accepts.

A key is proof of *purchase*, not a grant: restore verifies the signature and
then asks Stripe whether the subscription is still live or the lifetime charge
remains unreversed. A cancelled subscription or refunded lifetime purchase
stops unlocking anything. Keys are derived rather than stored, so a lost one is
regenerated, not looked up:

```bash
node --env-file=.env.local scripts/pro-key.mjs sub_123…      # subscription
node --env-file=.env.local scripts/pro-key.mjs pi_123…       # lifetime
node --env-file=.env.local scripts/pro-key.mjs singer@example.com
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
re-checks with Stripe twice a day so a cancellation, failed payment, refund, or
dispute revokes access. New prices resolve by lookup key
(`suede_pro_monthly_early_access` and
`suede_pro_lifetime_early_access`), never by hardcoded id. Legacy monthly and
annual lookup keys remain recognized for existing subscriptions.

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
| Monthly Early Access | $4.99/mo, lookup key `suede_pro_monthly_early_access` |
| Lifetime Early Access | $79 once, lookup key `suede_pro_lifetime_early_access` |
| Billing portal | the account's existing live default config, cancel-at-period-end enabled for subscriptions |

New checkout sells monthly and lifetime only. The former $9.99 monthly price
and old $30/yr `suede_pro_annual` price are left untouched and recognized for
existing subscribers. `/api/checkout` hard-rejects annual before any Stripe
lookup or Checkout Session call.

**Production is live.** `STRIPE_SECRET_KEY` on the `sing` project holds the LLC's
live secret key, and `/api/checkout` uses the prices above. Monthly Checkout is
in subscription mode; lifetime Checkout is in one-time payment mode. No code
differs between modes because both prices resolve by lookup key.

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
  product, both sellable prices and a portal config against whichever key it is given.
  It does not repoint or archive legacy monthly or annual prices. Use it if the
  live catalog ever needs rebuilding:

  ```bash
  vercel env run -e production -- node scripts/stripe-setup.mjs  # live
  npm run stripe:setup                                           # test mode
  ```

  It prints which mode it touched and reports `charges_enabled`.

Verify the catalog by inspecting the two lookup-key prices. Verify the deployed
annual prohibition with a single POST containing `{ "plan": "annual" }`; the
route must return 409 before Stripe is called. Do not create a live Checkout
Session merely as a deployment smoke test.

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
