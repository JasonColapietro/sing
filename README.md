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

Pro is a Stripe subscription — $4/month or $30/year — provisioned through the
Vercel Marketplace, so `STRIPE_SECRET_KEY` and friends are set on the project
automatically. Locally: `vercel link && vercel env pull`.

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

Two layers. `lib/rate-limit.ts` is an in-process burst limiter on all four
routes (429 with `Retry-After`) — free, but its counters are per function
instance and per region, so treat it as a floor. The durable layer is Vercel
WAF `rate_limit` rules on `/api/*`; requests blocked there never reach the
functions and aren't billed. Stage rules in log mode, review the traffic, then:

```bash
vercel firewall diff
vercel firewall publish --yes
```

`lib/pro.ts` caches the last answer in `localStorage`; `components/pro/sync.tsx`
re-checks with Stripe twice a day so a cancellation or failed payment actually
revokes access. Prices are resolved by **lookup key** (`suede_pro_monthly`,
`suede_pro_annual`), never by hardcoded id.

### Going live

The Marketplace resource starts as a Stripe **sandbox** (test mode — real card
numbers are declined). No code changes are needed to go live; it's four steps,
and the first two can only be done by the account owner.

1. **Claim the sandbox.** `vercel integration resource claim suede-sing-pro`
   opens a Stripe URL. Sign in (or create the account) there.
2. **Finish Stripe activation** in the dashboard: business details, bank
   account for payouts, tax and identity verification. Until this is done
   `charges_enabled` stays false and live checkout will fail.
3. **Refresh the keys and set up live mode.** Test and live data are separate
   spaces in Stripe, so the product, prices, and portal config must be created
   again with live keys:

   ```bash
   vercel env pull
   STRIPE_SECRET_KEY=sk_live_… node scripts/stripe-setup.mjs
   ```

   The script is idempotent and prints which mode it's touching. For test mode
   it's just `npm run stripe:setup`.
4. **Confirm.** `vercel integration list` should show ownership as `linked`
   rather than `sandbox`, and the setup script should report
   `charges_enabled=true`.

Verify a real charge with a small live purchase you refund, not with a test
card — test cards are declined in live mode.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
