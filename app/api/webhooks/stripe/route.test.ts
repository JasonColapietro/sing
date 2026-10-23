import Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ forwardToIntake: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/intake-forward", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/intake-forward")>()),
  forwardToIntake: mocks.forwardToIntake,
}));

const { POST } = await import("./route");

const WEBHOOK_SECRET = "whsec_test_sing_webhook_secret";

function signed(payload: string, secret = WEBHOOK_SECRET): Request {
  return new Request("https://sing.suedeai.ai/api/webhooks/stripe", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": Stripe.webhooks.generateTestHeaderString({ payload, secret }),
    },
    body: payload,
  });
}

function checkoutCompleted(overrides: Record<string, unknown> = {}, livemode = true) {
  return JSON.stringify({
    id: "evt_1Sing",
    object: "event",
    type: "checkout.session.completed",
    created: 1_792_750_000,
    livemode,
    data: {
      object: {
        id: "cs_live_secret_handle",
        object: "checkout.session",
        mode: "payment",
        amount_total: 7_900,
        currency: "usd",
        payment_status: "paid",
        customer: "cus_buyer",
        customer_email: null,
        subscription: null,
        payment_intent: "pi_secret_handle",
        customer_details: {
          email: "buyer@example.com",
          name: "Sam Singer",
          phone: null,
          address: { country: "US" },
        },
        metadata: { app: "suede-sing", offer: "early-access", plan: "lifetime" },
        ...overrides,
      },
    },
  });
}

beforeEach(() => {
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  mocks.forwardToIntake.mockReset().mockResolvedValue({ ok: true, duplicate: false });
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/webhooks/stripe", () => {
  it("refuses a payload signed with another secret and forwards nothing", async () => {
    const response = await POST(signed(checkoutCompleted(), "whsec_someone_else"));
    expect(response.status).toBe(400);
    expect(mocks.forwardToIntake).not.toHaveBeenCalled();
  });

  it("refuses a request with no signature and forwards nothing", async () => {
    const response = await POST(
      new Request("https://sing.suedeai.ai/api/webhooks/stripe", {
        method: "POST",
        body: checkoutCompleted(),
      }),
    );
    expect(response.status).toBe(400);
    expect(mocks.forwardToIntake).not.toHaveBeenCalled();
  });

  it("refuses a body altered after signing", async () => {
    const original = signed(checkoutCompleted());
    const tampered = new Request(original.url, {
      method: "POST",
      headers: original.headers,
      body: checkoutCompleted({ amount_total: 1 }),
    });
    expect((await POST(tampered)).status).toBe(400);
    expect(mocks.forwardToIntake).not.toHaveBeenCalled();
  });

  it("answers 503 without a webhook secret, so Stripe retries", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect((await POST(signed(checkoutCompleted()))).status).toBe(503);
    expect(mocks.forwardToIntake).not.toHaveBeenCalled();
  });

  it("forwards a completed Sing checkout once as a purchase keyed on the event id", async () => {
    const response = await POST(signed(checkoutCompleted()));
    expect(response.status).toBe(200);
    expect(mocks.forwardToIntake).toHaveBeenCalledOnce();
    const [event] = mocks.forwardToIntake.mock.calls[0]!;
    expect(event).toEqual({
      id: "stripe:evt_1Sing",
      kind: "purchase",
      property: "sing.suedeai.ai",
      occurredAt: new Date(1_792_750_000 * 1000).toISOString(),
      summary: "Suede Pro lifetime purchase, $79.00",
      person: { email: "buyer@example.com", name: "Sam Singer" },
      details: {
        plan: "lifetime",
        offer: "early-access",
        mode: "payment",
        amount: 79,
        currency: "usd",
        paymentStatus: "paid",
        country: "US",
        stripeCustomer: "cus_buyer",
        livemode: true,
      },
    });
  });

  it("never sends the ids /api/entitlement accepts", async () => {
    await POST(signed(checkoutCompleted()));
    const sent = JSON.stringify(mocks.forwardToIntake.mock.calls[0]![0]);
    expect(sent).not.toContain("cs_live_secret_handle");
    expect(sent).not.toContain("pi_secret_handle");
  });

  it("keeps the same id when Stripe redelivers the event", async () => {
    await POST(signed(checkoutCompleted()));
    await POST(signed(checkoutCompleted()));
    const ids = mocks.forwardToIntake.mock.calls.map(([event]) => event.id);
    expect(ids).toEqual(["stripe:evt_1Sing", "stripe:evt_1Sing"]);
  });

  it("marks a test-mode purchase in the summary", async () => {
    await POST(signed(checkoutCompleted({}, false)));
    const [event] = mocks.forwardToIntake.mock.calls[0]!;
    expect(event.summary).toBe("Test mode: Suede Pro lifetime purchase, $79.00");
    expect(event.details.livemode).toBe(false);
  });

  it("acknowledges another product's checkout without forwarding", async () => {
    const response = await POST(signed(checkoutCompleted({ metadata: { app: "other" } })));
    expect(response.status).toBe(200);
    expect(mocks.forwardToIntake).not.toHaveBeenCalled();
  });

  it("acknowledges other event types without forwarding", async () => {
    const payload = JSON.stringify({
      id: "evt_2",
      object: "event",
      type: "customer.created",
      created: 1_792_750_000,
      livemode: true,
      data: { object: { id: "cus_x", object: "customer" } },
    });
    expect((await POST(signed(payload))).status).toBe(200);
    expect(mocks.forwardToIntake).not.toHaveBeenCalled();
  });

  it("answers 503 when the hub is unreachable, so Stripe redelivers", async () => {
    mocks.forwardToIntake.mockResolvedValue({ ok: false, reason: "unreachable" });
    expect((await POST(signed(checkoutCompleted()))).status).toBe(503);
  });

  it("answers 200 when the hub refuses the event, since a retry cannot fix it", async () => {
    mocks.forwardToIntake.mockResolvedValue({ ok: false, reason: "rejected" });
    expect((await POST(signed(checkoutCompleted()))).status).toBe(200);
  });

  it("logs a hub refusal with the event id and kind, and no email", async () => {
    mocks.forwardToIntake.mockResolvedValue({ ok: false, reason: "rejected" });
    await POST(signed(checkoutCompleted()));
    const logged = vi.mocked(console.error).mock.calls.find(([message]) =>
      String(message).includes("refused"),
    );
    expect(logged).toBeDefined();
    expect(logged![1]).toEqual({ id: "stripe:evt_1Sing", kind: "purchase" });
    expect(JSON.stringify(logged)).not.toContain("buyer@example.com");
  });

  it("cuts a name over 120 characters and rescues an address the hub would refuse", async () => {
    await POST(
      signed(
        checkoutCompleted({
          customer_details: {
            email: "buyer@example",
            name: "S".repeat(300),
            phone: null,
            address: { country: "US" },
          },
        }),
      ),
    );
    const [event] = mocks.forwardToIntake.mock.calls[0]!;
    expect(event.person.name).toHaveLength(120);
    expect(event.person.email).toBeUndefined();
    expect(event.details.submitted_email).toBe("buyer@example");
  });
});
