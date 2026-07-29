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
};
