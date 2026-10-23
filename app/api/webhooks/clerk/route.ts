import { clerkClient, type UserJSON } from "@clerk/nextjs/server";
import { verifyWebhook, type WebhookEvent } from "@clerk/nextjs/webhooks";
import { NextResponse, type NextRequest } from "next/server";
import {
  forwardToIntake,
  intakeContact,
  intakeProperty,
  intakeSummary,
  type IntakeEvent,
  type IntakeForwardResult,
} from "@/lib/intake-forward";

/**
 * Clerk webhook: tells the Suede AI lead intake hub about every new account
 * (`user.created` → signup) and every sign-in (`session.created` → login).
 * Before it existed, both lived only in the Clerk dashboard.
 *
 * It reports and stores nothing. Clerk keeps the account, so it is the copy
 * of record the contract asks a sender to hold before forwarding.
 *
 * Every request is verified with Clerk's verifyWebhook against
 * CLERK_WEBHOOK_SIGNING_SECRET (Clerk Dashboard → Webhooks → the endpoint →
 * Signing Secret). proxy.ts installs clerkMiddleware with no handler, so no
 * route is protected and Clerk's own unsigned-in POST reaches this one.
 *
 * What leaves the app: the person's primary email, name and phone as Clerk
 * holds them, the sign-in provider, and the Clerk user id. Never a profile
 * photo, token or IP address.
 *
 * Responses: 400 for a delivery that fails verification; 503 when the webhook
 * or the intake sender is not configured, or the hub could not be reached after
 * its retries, so Svix redelivers the same message later (the hub drops a
 * repeat by its id); 200 otherwise, including event types this route ignores
 * and an event the hub refused, which a redelivery would not fix.
 */

interface Account {
  readonly userId: string;
  readonly email: string | null;
  readonly name: string | null;
  readonly phone: string | null;
  readonly provider: string | null;
}

function fullName(first: string | null | undefined, last: string | null | undefined): string | null {
  const name = [first, last].filter((part) => part && part.trim()).join(" ").trim();
  return name || null;
}

/** The fields worth forwarding from a webhook's user payload. */
function accountFromJSON(user: UserJSON): Account {
  const email =
    user.email_addresses.find((entry) => entry.id === user.primary_email_address_id) ??
    user.email_addresses[0];
  const phone =
    user.phone_numbers.find((entry) => entry.id === user.primary_phone_number_id) ??
    user.phone_numbers[0];
  return {
    userId: user.id,
    email: email?.email_address ?? null,
    name: fullName(user.first_name, user.last_name),
    phone: phone?.phone_number ?? null,
    provider: user.external_accounts[0]?.provider ?? null,
  };
}

/**
 * The user behind a session. Clerk embeds it in the session payload; when it
 * does not, one Backend API read fills it in. If that fails too, the login
 * still goes out with the user id alone.
 */
async function accountForSession(
  userId: string,
  embedded: UserJSON | null | undefined,
): Promise<Account> {
  if (embedded) return accountFromJSON(embedded);
  try {
    const user = await (await clerkClient()).users.getUser(userId);
    return {
      userId,
      email: user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null,
      name: fullName(user.firstName, user.lastName),
      phone: user.primaryPhoneNumber?.phoneNumber ?? user.phoneNumbers[0]?.phoneNumber ?? null,
      provider: user.externalAccounts[0]?.provider ?? null,
    };
  } catch (error) {
    console.warn(
      "[webhooks/clerk] could not look up the session's user; forwarding the id only",
      error instanceof Error ? error.message : error,
    );
    return { userId, email: null, name: null, phone: null, provider: null };
  }
}

function asIso(milliseconds: number | null | undefined): string {
  return new Date(
    typeof milliseconds === "number" && Number.isFinite(milliseconds) ? milliseconds : Date.now(),
  ).toISOString();
}

function eventFor(
  kind: "signup" | "login",
  id: string,
  occurredAt: string,
  account: Account,
  extra: Readonly<Record<string, string | null>>,
): IntakeEvent {
  const who = account.email ?? account.name ?? account.userId;
  const summary =
    kind === "signup" ? `New Suede Sing account: ${who}` : `Suede Sing sign-in: ${who}`;
  const contact = intakeContact(account);
  return {
    id,
    kind,
    property: intakeProperty(),
    occurredAt,
    summary: intakeSummary(summary),
    person: contact.person,
    details: {
      ...contact.details,
      clerkUserId: account.userId,
      provider: account.provider,
      ...extra,
    },
  };
}

async function intakeEventFrom(evt: WebhookEvent): Promise<IntakeEvent | null> {
  if (evt.type === "user.created") {
    const account = accountFromJSON(evt.data);
    return eventFor("signup", `clerk:${evt.data.id}`, asIso(evt.data.created_at), account, {});
  }
  if (evt.type === "session.created") {
    const session = evt.data;
    const account = await accountForSession(session.user_id, session.user);
    return eventFor(
      "login",
      `clerk:session:${session.id}`,
      asIso(session.created_at),
      account,
      { device: session.latest_activity?.device_type ?? null },
    );
  }
  return null;
}

function respondTo(event: IntakeEvent, result: IntakeForwardResult): Response {
  if (!result.ok && result.reason === "rejected") {
    // A redelivery cannot fix a refusal, so Clerk gets a 200, but the event
    // is now lost unless someone acts on this line. Ids only, no PII.
    console.error("[webhooks/clerk] lead intake refused the event; it was not stored", {
      id: event.id,
      kind: event.kind,
    });
  }
  if (!result.ok && result.reason !== "rejected") {
    return NextResponse.json(
      { error: "Lead intake unavailable; retry later." },
      { status: 503 },
    );
  }
  return NextResponse.json({ received: true, forwarded: result.ok });
}

export async function POST(request: NextRequest): Promise<Response> {
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET?.trim();
  if (!signingSecret) {
    // Retryable, so Svix redelivers once the secret is set rather than every
    // signup in between being dropped.
    console.error(
      "[webhooks/clerk] CLERK_WEBHOOK_SIGNING_SECRET is not set; refusing the delivery so Clerk retries it.",
    );
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  let evt: WebhookEvent;
  try {
    evt = await verifyWebhook(request, { signingSecret });
  } catch (error) {
    console.warn(
      "[webhooks/clerk] verification failed",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Verification failed." }, { status: 400 });
  }

  const event = await intakeEventFrom(evt);
  if (!event) {
    return NextResponse.json({ received: true, forwarded: false });
  }
  return respondTo(event, await forwardToIntake(event));
}
