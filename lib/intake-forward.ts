import "server-only";

import { createHmac } from "node:crypto";
import { SITE_URL } from "./site";

/**
 * Forwards an identified person to the Suede AI lead intake hub.
 *
 * A port of the reference sender in Agent Studio's docs/intake/CONTRACT.md
 * (source id `sing`): one signed POST per event, retried on 429, 5xx and
 * network errors (0 ms, 400 ms, 1,200 ms, 4 s timeout each) and never retried
 * on 400, 401 or 413. The hub stores the event before it answers 202, so a
 * 202 means delivery is its job from then on.
 *
 * Callers own two rules the sender cannot enforce. Await the result (or hand
 * it to `after`) before the route returns, because a serverless function stops
 * work after the response. And put nothing secret in an event: no passwords,
 * tokens, card data, Pro keys, checkout session ids, subscription or payment
 * intent ids, or comp codes. Each of those opens something in this app.
 */

export type IntakeKind =
  | "signup"
  | "login"
  | "lead"
  | "booking"
  | "purchase"
  | "application"
  | "waitlist";

export interface IntakePerson {
  readonly email?: string;
  readonly name?: string;
  readonly phone?: string;
}

export interface IntakeEvent {
  readonly id: string;
  readonly kind: IntakeKind;
  readonly property: string;
  readonly occurredAt: string;
  readonly summary: string;
  readonly person?: IntakePerson;
  readonly details?: Readonly<Record<string, string | number | boolean | null>>;
  readonly attribution?: Readonly<Record<string, string>>;
  readonly canary?: boolean;
  readonly suspectedSpam?: { readonly reason: string };
}

export type IntakeForwardResult =
  | { readonly ok: true; readonly duplicate: boolean }
  | {
      readonly ok: false;
      readonly reason: "not-configured" | "rejected" | "unreachable";
    };

export const DEFAULT_INTAKE_URL = "https://agents.suedeai.ai/api/intake/events";
const BACKOFF_MS = [0, 400, 1_200] as const;
const ATTEMPT_TIMEOUT_MS = 4_000;
const MIN_SECRET_BYTES = 32;
const SUMMARY_MAX_CHARS = 200;

export async function forwardToIntake(
  event: IntakeEvent,
  env: Readonly<Record<string, string | undefined>> = process.env,
  fetcher: typeof fetch = fetch,
): Promise<IntakeForwardResult> {
  const source = env.SUEDE_INTAKE_SOURCE?.trim();
  const secret = env.SUEDE_INTAKE_SECRET;
  if (!source || !secret || Buffer.byteLength(secret, "utf8") < MIN_SECRET_BYTES) {
    console.error(
      "[intake] not configured: set SUEDE_INTAKE_SOURCE and SUEDE_INTAKE_SECRET",
      { id: event.id },
    );
    return { ok: false, reason: "not-configured" };
  }
  const url = env.SUEDE_INTAKE_URL?.trim() || DEFAULT_INTAKE_URL;
  const body = JSON.stringify(event);
  for (const delay of BACKOFF_MS) {
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    // Signed per attempt, so a retry after a slow failure is never stale.
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = `v1=${createHmac("sha256", secret)
      .update(`${timestamp}.${body}`, "utf8")
      .digest("hex")}`;
    try {
      const response = await fetcher(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-suede-intake-source": source,
          "x-suede-intake-timestamp": timestamp,
          "x-suede-intake-signature": signature,
        },
        body,
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      });
      if (response.status === 202) {
        const json = (await response.json().catch(() => null)) as {
          duplicate?: unknown;
        } | null;
        return { ok: true, duplicate: json?.duplicate === true };
      }
      if (
        response.status === 400 ||
        response.status === 401 ||
        response.status === 413
      ) {
        console.error("[intake] rejected", {
          id: event.id,
          status: response.status,
        });
        return { ok: false, reason: "rejected" };
      }
    } catch {
      // Network error or timeout: retry.
    }
  }
  console.error("[intake] unreachable after retries", { id: event.id });
  return { ok: false, reason: "unreachable" };
}

/**
 * The host singers use, lowercase, as the contract's `property` wants it.
 * Follows NEXT_PUBLIC_SITE_URL like every other absolute URL in the app.
 */
export function intakeProperty(): string {
  try {
    return new URL(SITE_URL).host.toLowerCase();
  } catch {
    return "sing.suedeai.ai";
  }
}

/**
 * The `person` block from whatever a provider handed over, keeping only
 * non-empty strings. Undefined when nothing is left, so the field is omitted.
 */
export function intakePerson(fields: {
  readonly email?: string | null;
  readonly name?: string | null;
  readonly phone?: string | null;
}): IntakePerson | undefined {
  const person: { email?: string; name?: string; phone?: string } = {};
  for (const key of ["email", "name", "phone"] as const) {
    const value = fields[key]?.trim();
    if (value) person[key] = value;
  }
  return Object.keys(person).length > 0 ? person : undefined;
}

/** One line inside the contract's 200 characters. It becomes the email subject. */
export function intakeSummary(text: string): string {
  const line = text.replace(/\s+/g, " ").trim();
  return line.length <= SUMMARY_MAX_CHARS
    ? line
    : `${line.slice(0, SUMMARY_MAX_CHARS - 1)}…`;
}
