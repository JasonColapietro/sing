/**
 * Types shared by the client entitlement store and the Stripe API routes.
 * No "use client" / "server-only" directive here on purpose — both sides
 * import it.
 */

export type ProPlan = "monthly" | "annual";

export function isProPlan(value: unknown): value is ProPlan {
  return value === "monthly" || value === "annual";
}

/**
 * Subscription states that grant Pro. `past_due` is included so a singer
 * whose card just failed keeps access through Stripe's retry window
 * instead of being locked out mid-practice; the UI warns them instead.
 */
export const ENTITLING_STATUSES = ["active", "trialing", "past_due"] as const;

/** What every entitlement route returns, and what the client persists. */
export interface Entitlement {
  active: boolean;
  plan: ProPlan | null;
  /** Raw Stripe subscription status, so the UI can flag payment trouble. */
  status: string | null;
  subscriptionId: string | null;
  customerId: string | null;
  email: string | null;
  /** ISO timestamp of the end of the paid period, when known. */
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  /** Signed key that restores Pro on another device. Null when inactive. */
  proKey: string | null;
}

export const INACTIVE: Entitlement = {
  active: false,
  plan: null,
  status: null,
  subscriptionId: null,
  customerId: null,
  email: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  proKey: null,
};

/* ---------------------------------------------------------------- pricing */

export interface PlanPrice {
  /** What Stripe charges once per interval, in dollars. */
  amount: number;
  /** The Stripe recurring interval this plan bills on. */
  interval: "month" | "year";
  /** Amortised monthly cost, so the two plans compare on one number. */
  perMonth: number;
  /** The billing line that sits beside the price. */
  note: string;
}

/**
 * The one place the Pro price is written down — the pricing page, the JSON-LD
 * offer, the homepage teaser and every upgrade CTA read from here.
 *
 * Display copy only: checkout resolves the real Stripe price id from a lookup
 * key at request time, so nothing here charges anyone. It does have to match
 * what Stripe holds, and both ends enforce that rather than trust it —
 * `scripts/stripe-setup.mjs` exits non-zero on a price that differs, and
 * resolvePriceId() refuses to open a session against one.
 */
export const PRICING: Record<ProPlan, PlanPrice> = {
  monthly: {
    amount: 9.99,
    interval: "month",
    perMonth: 9.99,
    note: "billed monthly",
  },
  annual: {
    amount: 29,
    interval: "year",
    perMonth: 29 / 12,
    note: "billed yearly",
  },
};

/** "$9.99", "$79" — a trailing ".00" on a whole-dollar price reads as a typo. */
export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2).replace(/\.00$/, "")}`;
}

/** How much a year on the annual plan undercuts twelve monthly charges. */
export function annualSavingsPct(pricing: Record<ProPlan, PlanPrice> = PRICING): number {
  const twelve = pricing.monthly.amount * 12;
  return Math.round(((twelve - pricing.annual.amount) / twelve) * 100);
}

/**
 * Whether the annual plan is on sale.
 *
 * Annual is only offered once an active Stripe price carrying the
 * `suede_pro_annual` lookup key charges the amount above — `npm run
 * stripe:setup -- annual` creates it and fails loudly if some other price
 * already holds that key, and setting NEXT_PUBLIC_PRO_ANNUAL=1 turns the UI
 * on. Until then every surface shows monthly alone rather than a button that
 * resolves to no price, or to the wrong one.
 */
export function annualEnabled(
  flag: string | undefined = process.env.NEXT_PUBLIC_PRO_ANNUAL,
): boolean {
  return flag === "1" || flag === "true";
}

/**
 * The questions on /pro, rendered there and marked up as FAQPage from these
 * same strings — Google requires the marked-up answer to match what a reader
 * sees, and sharing one array is the only way that stays true.
 */
export const PRO_FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Does the free studio stay free?",
    a: "Yes — permanently. All ten rooms, live pitch feedback, the range test, the recorder: none of it moves behind Pro. Pro only adds things that don't exist today.",
  },
  {
    q: "Do I need Pro to get better?",
    a: "Not to practice — the studio, the range test and the warmups are free and stay free. Pro is for the singer who wants the record: every test charted, every take analysed, and the two books that explain what the numbers mean.",
  },
  {
    q: "Is my voice uploaded?",
    a: "No. Pitch analysis runs on your device on both tiers, and recordings never leave it. Pro's cloud sync backs up your progress numbers — scores, streaks, range — never audio.",
  },
  {
    q: "What do I get the moment I subscribe?",
    a: "Both books in full — 50 chapters and 82,734 words across The Measured Voice and The Voice Atlas — plus both PDFs to keep, the pro warmup packs, pitch analysis on every take, your full range history, and cloud sync. Nothing is drip-fed and nothing is on a waitlist.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Anytime, in one click, no email required. You drop back to free and keep every recording, score, and streak you earned.",
  },
  {
    q: "Why does a free app sell anything?",
    a: "Suede Sing is built by one musician. Pro is what keeps the free studio free — instead of ads, trackers, or selling your data. One tier, and the price is on this page.",
  },
];
