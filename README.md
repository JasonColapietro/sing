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
| `POST /api/restore` | Unlocks Pro on a new device from the email that paid. |
| `POST /api/portal` | Opens Stripe's billing portal — this is what makes "cancel in one click" true. |

`lib/pro.ts` caches the last answer in `localStorage`; `components/pro/sync.tsx`
re-checks with Stripe twice a day so a cancellation or failed payment actually
revokes access. Prices are resolved by **lookup key** (`suede_pro_monthly`,
`suede_pro_annual`), never by hardcoded id.

### Going live

The Marketplace resource starts as a Stripe **sandbox** (test mode — real card
numbers are declined). To take real money:

```bash
vercel integration resource claim suede-sing-pro
```

Then recreate the two prices in the live account with the same lookup keys and
enable the billing portal. No code changes are needed.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
