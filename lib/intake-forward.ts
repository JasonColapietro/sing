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
const NAME_MAX_CHARS = 120;
const EMAIL_MAX_CHARS = 320;
const PHONE_MAX_CHARS = 40;
const DETAIL_MAX_CHARS = 2_000;
/** The contract's limit is 32 KB; the hub answers 413 above it. */
export const INTAKE_MAX_BODY_BYTES = 32_768;

/**
 * The hub validates `person.email` with zod's email rule and answers 400 to an
 * address outside it. A 400 is never retried, so the event would be lost; an
 * address Clerk or Stripe accepted but the hub would refuse goes into
 * `details.submitted_email` instead. Same rule as seo-site's sender.
 */
const HUB_EMAIL =
  /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i;
const HUB_PHONE = /^[0-9+().\s-]*$/;

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
  const body = serializeIntakeEvent(event);
  if (body === null) {
    console.error("[intake] event over the 32 KB body cap even without details", {
      id: event.id,
      kind: event.kind,
    });
    return { ok: false, reason: "rejected" };
  }
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
    // hostname, not host: a port (localhost:3000) fails the hub's property rule.
    return new URL(SITE_URL).hostname.toLowerCase();
  } catch {
    return "sing.suedeai.ai";
  }
}

/** Cuts to a UTF-16 length (what the hub's max() counts) without splitting a surrogate pair. */
function clip(value: string, max: number): string {
  if (value.length <= max) return value;
  let end = max - 1;
  const code = value.charCodeAt(end - 1);
  if (code >= 0xd800 && code <= 0xdbff) end -= 1;
  return `${value.slice(0, end)}…`;
}

function oneLine(value: string, max: number): string {
  return clip(value.replace(/\s+/g, " ").trim(), max);
}

/**
 * The `person` block from whatever a provider handed over, keeping only
 * non-empty strings the hub accepts. Undefined when nothing is left, so the
 * field is omitted. Use {@link intakeContact} when a refused email or phone
 * should survive in `details`.
 */
export function intakePerson(fields: {
  readonly email?: string | null;
  readonly name?: string | null;
  readonly phone?: string | null;
}): IntakePerson | undefined {
  return intakeContact(fields).person;
}

/**
 * The `person` block plus the details that rescue what the hub would refuse:
 * an email failing its rule becomes `submitted_email`, a phone failing its
 * rule becomes `submitted_phone`. Names are cut to 120 characters on one line.
 */
export function intakeContact(fields: {
  readonly email?: string | null;
  readonly name?: string | null;
  readonly phone?: string | null;
}): {
  readonly person: IntakePerson | undefined;
  readonly details: Readonly<Record<string, string>>;
} {
  const person: { email?: string; name?: string; phone?: string } = {};
  const details: Record<string, string> = {};
  const email = fields.email?.trim();
  if (email) {
    if (email.length <= EMAIL_MAX_CHARS && HUB_EMAIL.test(email)) person.email = email;
    else details.submitted_email = clip(email, DETAIL_MAX_CHARS);
  }
  const name = fields.name ? oneLine(fields.name, NAME_MAX_CHARS) : "";
  if (name) person.name = name;
  const phone = fields.phone?.trim();
  if (phone) {
    if (phone.length <= PHONE_MAX_CHARS && HUB_PHONE.test(phone)) person.phone = phone;
    else details.submitted_phone = clip(phone, DETAIL_MAX_CHARS);
  }
  return {
    person: Object.keys(person).length > 0 ? person : undefined,
    details,
  };
}

/** One line inside the contract's 200 characters. It becomes the email subject. */
export function intakeSummary(text: string): string {
  return oneLine(text, SUMMARY_MAX_CHARS);
}

/**
 * The exact body to sign, kept under the 32 KB cap. Every event this app
 * builds is far below it; should one ever not be, `details` string values are
 * cut shorter, then dropped, rather than the hub answering 413 and the event
 * being lost. Null when even that cannot fit it.
 */
export function serializeIntakeEvent(event: IntakeEvent): string | null {
  const fits = (body: string) => Buffer.byteLength(body, "utf8") <= INTAKE_MAX_BODY_BYTES;
  const full = JSON.stringify(event);
  if (fits(full)) return full;
  if (event.details) {
    for (const max of [500, 120]) {
      const details = Object.fromEntries(
        Object.entries(event.details).map(([key, value]) => [
          key,
          typeof value === "string" ? clip(value, max) : value,
        ]),
      );
      const trimmed = JSON.stringify({ ...event, details });
      if (fits(trimmed)) return trimmed;
    }
    const { details: _dropped, ...rest } = event;
    void _dropped;
    const bare = JSON.stringify({ ...rest, details: { details_trimmed: true } });
    if (fits(bare)) return bare;
  }
  return null;
}
