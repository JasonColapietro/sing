import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Pro keys — the credential that restores Pro on a new device.
 *
 * A key is an HMAC over the Stripe customer and billing ids, so it is
 * unguessable and needs no database to verify. It is proof of *purchase*, not
 * a grant: `verifyProKey` only tells you which billing record the holder paid
 * for, and the caller still asks Stripe whether it remains entitled. A
 * cancelled subscription or refunded lifetime purchase stops working.
 *
 * This replaced restoring by email address, which let anyone who knew a
 * subscriber's email unlock Pro in their own browser.
 */

const PREFIX = "suede-pro";

function secret(): string {
  const value = process.env.PRO_KEY_SECRET;
  if (!value) {
    throw new Error(
      "PRO_KEY_SECRET is not set. Run `vercel env pull`, or add it with `vercel env add PRO_KEY_SECRET`.",
    );
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret())
    .update(`${PREFIX}.v1.${payload}`)
    .digest("base64url");
}

function encode(customerId: string, billingId: string): string {
  return Buffer.from(`${customerId}:${billingId}`, "utf8").toString(
    "base64url",
  );
}

/** Builds the key shown after a subscription or lifetime checkout. */
export function mintProKey(customerId: string, billingId: string): string {
  const payload = encode(customerId, billingId);
  return `${PREFIX}_${payload}.${sign(payload)}`;
}

export interface SubscriptionProKeyClaims {
  kind: "subscription";
  customerId: string;
  subscriptionId: string;
}

export interface LifetimeProKeyClaims {
  kind: "lifetime";
  customerId: string;
  paymentIntentId: string;
}

export type ProKeyClaims = SubscriptionProKeyClaims | LifetimeProKeyClaims;

/**
 * Returns the ids a valid key vouches for, or null. Never throws on bad
 * input — a malformed key is just an invalid key.
 */
export function verifyProKey(key: unknown): ProKeyClaims | null {
  if (typeof key !== "string" || key.length > 512) return null;

  const trimmed = key.trim();
  if (!trimmed.startsWith(`${PREFIX}_`)) return null;

  const body = trimmed.slice(PREFIX.length + 1);
  const dot = body.lastIndexOf(".");
  if (dot <= 0) return null;

  const payload = body.slice(0, dot);
  const provided = body.slice(dot + 1);
  if (!/^[A-Za-z0-9_-]+$/.test(payload) || !/^[A-Za-z0-9_-]+$/.test(provided)) {
    return null;
  }

  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return null;
  }

  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const decoded = Buffer.from(payload, "base64url")
    .toString("utf8")
    .split(":");
  if (decoded.length !== 2) return null;
  const [customerId, billingId] = decoded;
  if (!customerId?.startsWith("cus_")) return null;
  if (billingId?.startsWith("sub_")) {
    return { kind: "subscription", customerId, subscriptionId: billingId };
  }
  if (billingId?.startsWith("pi_")) {
    return { kind: "lifetime", customerId, paymentIntentId: billingId };
  }
  return null;
}
