/**
 * Types shared by the client entitlement store and the Stripe API routes.
 * No "use client" / "server-only" directive here on purpose — both sides
 * import it.
 */

/** Every plan an existing entitlement can carry. */
export type ProPlan = "monthly" | "annual" | "lifetime";

/** Plans that may begin a new Checkout Session. Annual is legacy-only. */
export type CheckoutPlan = "monthly" | "lifetime";

export function isProPlan(value: unknown): value is ProPlan {
  return value === "monthly" || value === "annual" || value === "lifetime";
}

export function isCheckoutPlan(value: unknown): value is CheckoutPlan {
  return value === "monthly" || value === "lifetime";
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
  paymentIntentId: string | null;
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
  paymentIntentId: null,
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
  /** Whether Stripe bills monthly or exactly once. */
  interval: "month" | "one_time";
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
export const PRICING: Record<CheckoutPlan, PlanPrice> = {
  monthly: {
    amount: 4.99,
    interval: "month",
    note: "billed monthly",
  },
  lifetime: {
    amount: 79,
    interval: "one_time",
    note: "one payment",
  },
};

/** "$4.99", "$79": a trailing ".00" on a whole-dollar price reads as a typo. */
export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2).replace(/\.00$/, "")}`;
}

/**
 * The one price line every teaser surface prints.
 */
export function proHeadline(
  pricing: Record<CheckoutPlan, PlanPrice> = PRICING,
): string {
  return `${formatPrice(pricing.monthly.amount)} a month or ${formatPrice(
    pricing.lifetime.amount,
  )} for life`;
}

/** The expanded line used when Early Access needs to be explicit. */
export function proHeadlineLong(
  pricing: Record<CheckoutPlan, PlanPrice> = PRICING,
): string {
  return `Early Access: ${formatPrice(pricing.monthly.amount)} a month or ${formatPrice(
    pricing.lifetime.amount,
  )} once`;
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
    q: "What do I get the moment I upgrade?",
    a: "Both books in full — 50 chapters and 82,734 words across The Measured Voice and The Voice Atlas — plus both PDFs to keep, the pro warmup packs, pitch analysis on every take, your full range history, and cloud sync. Nothing is drip-fed and nothing is on a waitlist.",
  },
  {
    q: "How does billing work?",
    a: "Monthly renews at $4.99 and can be cancelled from the billing portal. Lifetime is a single $79 payment with no renewal. Either way, your recordings, scores, and streaks remain yours.",
  },
  {
    q: "Why does a free app sell anything?",
    a: "Suede Sing is built by one musician. Pro is what keeps the free studio free — instead of ads, trackers, or selling your data. One tier, and the price is on this page.",
  },
];
