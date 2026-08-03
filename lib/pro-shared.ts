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
    a: "No. Free covers real, daily practice. Pro is for singers who want a coach's ear on top: it finds your weak notes, plans tomorrow's session, and shows the long arc of your range.",
  },
  {
    q: "Is my voice uploaded?",
    a: "No. Pitch analysis runs on your device on both tiers, and recordings never leave it. Pro's cloud sync backs up your progress numbers — scores, streaks, range — never audio.",
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
