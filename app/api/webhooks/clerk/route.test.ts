import { createHmac, randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  forwardToIntake: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({ users: { getUser: mocks.getUser } }),
}));
vi.mock("@/lib/intake-forward", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/intake-forward")>()),
  forwardToIntake: mocks.forwardToIntake,
}));

const { POST } = await import("./route");

const SECRET_BYTES = randomBytes(24);
const SIGNING_SECRET = `whsec_${SECRET_BYTES.toString("base64")}`;

/** A delivery signed the way Svix signs Clerk's: v1,base64(HMAC(id.ts.body)). */
function delivery(
  payload: unknown,
  { msgId = "msg_2abcSvix", secret = SECRET_BYTES }: { msgId?: string; secret?: Buffer } = {},
): NextRequest {
  const body = JSON.stringify(payload);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", secret)
    .update(`${msgId}.${timestamp}.${body}`)
    .digest("base64");
  return new NextRequest("https://sing.suedeai.ai/api/webhooks/clerk", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "svix-id": msgId,
      "svix-timestamp": timestamp,
      "svix-signature": `v1,${signature}`,
    },
    body,
  });
}

const USER = {
  object: "user",
  id: "user_2singer",
  first_name: "Ada",
  last_name: "Lovelace",
  image_url: "https://img.clerk.com/photo.png",
  primary_email_address_id: "idn_primary",
  primary_phone_number_id: null,
  email_addresses: [
    { id: "idn_other", object: "email_address", email_address: "old@example.com" },
    { id: "idn_primary", object: "email_address", email_address: "ada@example.com" },
  ],
  phone_numbers: [],
  external_accounts: [{ object: "external_account", provider: "oauth_google" }],
  created_at: 1_792_748_000_000,
};

function userCreated() {
  return { type: "user.created", object: "event", data: USER };
}

function sessionCreated(user: unknown = USER) {
  return {
    type: "session.created",
    object: "event",
    data: {
      object: "session",
      id: "sess_2login",
      user_id: "user_2singer",
      client_id: "client_1",
      status: "active",
      created_at: 1_792_749_000_000,
      latest_activity: { device_type: "iPhone", is_mobile: true },
      user,
    },
  };
}

beforeEach(() => {
  process.env.CLERK_WEBHOOK_SIGNING_SECRET = SIGNING_SECRET;
  mocks.forwardToIntake.mockReset().mockResolvedValue({ ok: true, duplicate: false });
  mocks.getUser.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/webhooks/clerk", () => {
  it("refuses a delivery signed with another secret and forwards nothing", async () => {
    const response = await POST(delivery(userCreated(), { secret: randomBytes(24) }));
    expect(response.status).toBe(400);
    expect(mocks.forwardToIntake).not.toHaveBeenCalled();
  });

  it("refuses an unsigned request and forwards nothing", async () => {
    const response = await POST(
      new NextRequest("https://sing.suedeai.ai/api/webhooks/clerk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(userCreated()),
      }),
    );
    expect(response.status).toBe(400);
    expect(mocks.forwardToIntake).not.toHaveBeenCalled();
  });

  it("refuses a body altered after signing", async () => {
    const signed = delivery(userCreated());
    const tampered = new NextRequest(signed.url, {
      method: "POST",
      headers: signed.headers,
      body: JSON.stringify({ ...userCreated(), data: { ...USER, id: "user_forged" } }),
    });
    expect((await POST(tampered)).status).toBe(400);
    expect(mocks.forwardToIntake).not.toHaveBeenCalled();
  });

  it("answers 503 without a signing secret, so Clerk retries", async () => {
    delete process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    expect((await POST(delivery(userCreated()))).status).toBe(503);
    expect(mocks.forwardToIntake).not.toHaveBeenCalled();
  });

  it("forwards user.created once as a signup keyed on the user id", async () => {
    const response = await POST(delivery(userCreated()));
    expect(response.status).toBe(200);
    expect(mocks.forwardToIntake).toHaveBeenCalledOnce();
    const [event] = mocks.forwardToIntake.mock.calls[0]!;
    expect(event).toEqual({
      id: "clerk:user_2singer",
      kind: "signup",
      property: "sing.suedeai.ai",
      occurredAt: new Date(1_792_748_000_000).toISOString(),
      summary: "New Suede Sing account: ada@example.com",
      person: { email: "ada@example.com", name: "Ada Lovelace" },
      details: { clerkUserId: "user_2singer", provider: "oauth_google" },
    });
    expect(JSON.stringify(event)).not.toContain("img.clerk.com");
  });

  it("keeps the same id when Clerk redelivers the signup", async () => {
    await POST(delivery(userCreated(), { msgId: "msg_first" }));
    await POST(delivery(userCreated(), { msgId: "msg_retry" }));
    const ids = mocks.forwardToIntake.mock.calls.map(([event]) => event.id);
    expect(ids).toEqual(["clerk:user_2singer", "clerk:user_2singer"]);
  });

  it("forwards session.created once as a login with the embedded user's email", async () => {
    const response = await POST(delivery(sessionCreated()));
    expect(response.status).toBe(200);
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.forwardToIntake).toHaveBeenCalledOnce();
    const [event] = mocks.forwardToIntake.mock.calls[0]!;
    expect(event).toMatchObject({
      id: "clerk:session:sess_2login",
      kind: "login",
      occurredAt: new Date(1_792_749_000_000).toISOString(),
      person: { email: "ada@example.com", name: "Ada Lovelace" },
      details: { clerkUserId: "user_2singer", provider: "oauth_google", device: "iPhone" },
    });
  });

  it("looks the user up when the session payload carries none", async () => {
    mocks.getUser.mockResolvedValue({
      primaryEmailAddress: { emailAddress: "looked-up@example.com" },
      emailAddresses: [],
      firstName: "Grace",
      lastName: null,
      primaryPhoneNumber: null,
      phoneNumbers: [],
      externalAccounts: [],
    });
    await POST(delivery(sessionCreated(null)));
    expect(mocks.getUser).toHaveBeenCalledWith("user_2singer");
    const [event] = mocks.forwardToIntake.mock.calls[0]!;
    expect(event.person).toEqual({ email: "looked-up@example.com", name: "Grace" });
  });

  it("still forwards the login with the user id alone when the lookup fails", async () => {
    mocks.getUser.mockRejectedValue(new Error("no secret key"));
    expect((await POST(delivery(sessionCreated(null)))).status).toBe(200);
    const [event] = mocks.forwardToIntake.mock.calls[0]!;
    expect(event.id).toBe("clerk:session:sess_2login");
    expect(event.person).toBeUndefined();
    expect(event.details.clerkUserId).toBe("user_2singer");
  });

  it("acknowledges other event types without forwarding", async () => {
    const response = await POST(
      delivery({ type: "user.updated", object: "event", data: USER }),
    );
    expect(response.status).toBe(200);
    expect(mocks.forwardToIntake).not.toHaveBeenCalled();
  });

  it("answers 503 when the hub is unreachable, so Clerk redelivers", async () => {
    mocks.forwardToIntake.mockResolvedValue({ ok: false, reason: "unreachable" });
    expect((await POST(delivery(userCreated()))).status).toBe(503);
  });

  it("answers 200 when the hub refuses the event, since a retry cannot fix it", async () => {
    mocks.forwardToIntake.mockResolvedValue({ ok: false, reason: "rejected" });
    expect((await POST(delivery(userCreated()))).status).toBe(200);
  });
});
