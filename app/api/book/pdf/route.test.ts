import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  readFile: vi.fn(),
  retrieveSubscription: vi.fn(),
  retrievePaymentIntent: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("node:fs/promises", () => ({ readFile: dependencies.readFile }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => null }));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    subscriptions: { retrieve: dependencies.retrieveSubscription },
    paymentIntents: { retrieve: dependencies.retrievePaymentIntent },
  }),
  isStripeId: (value: unknown, prefix: string) =>
    typeof value === "string" &&
    value.startsWith(prefix) &&
    /^[A-Za-z0-9_]+$/.test(value),
  isOurSubscription: (subscription: { ours?: boolean }) => subscription.ours,
  entitlementFrom: (subscription: { active?: boolean }) => ({
    active: subscription.active === true,
  }),
  // Async now: it checks the lifetime policy, which can look up a dispute.
  // `disputeLookupFails` stands in for a dispute Stripe could not return.
  entitlementFromLifetime: async (payment: {
    active?: boolean;
    disputeLookupFails?: boolean;
  }) => {
    if (payment.disputeLookupFails) {
      throw new Error("Could not read the dispute on charge ch_lifetime.");
    }
    return { active: payment.active === true };
  },
}));

const { POST } = await import("./route");

function request(body: Record<string, unknown>) {
  return POST(
    new Request("https://sing.suedeai.ai/api/book/pdf", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  dependencies.readFile.mockReset().mockResolvedValue(Buffer.from("%PDF-test"));
  dependencies.retrieveSubscription.mockReset().mockResolvedValue({
    id: "sub_legacyAnnual",
    ours: true,
    active: true,
  });
  dependencies.retrievePaymentIntent.mockReset().mockResolvedValue({
    id: "pi_lifetime",
    active: true,
  });
});

describe("POST /api/book/pdf", () => {
  it("keeps serving PDFs to legacy annual subscribers", async () => {
    const response = await request({
      subscriptionId: "sub_legacyAnnual",
      book: "measured-voice",
    });

    expect(response.status).toBe(200);
    expect(dependencies.retrieveSubscription).toHaveBeenCalledWith(
      "sub_legacyAnnual",
      { expand: ["customer"] },
    );
    expect(dependencies.retrievePaymentIntent).not.toHaveBeenCalled();
    expect(response.headers.get("content-type")).toBe("application/pdf");
  });

  it("serves PDFs to an active lifetime purchaser", async () => {
    const response = await request({
      subscriptionId: null,
      paymentIntentId: "pi_lifetime",
      book: "atlas",
    });

    expect(response.status).toBe(200);
    expect(dependencies.retrievePaymentIntent).toHaveBeenCalledWith(
      "pi_lifetime",
      { expand: ["customer", "latest_charge"] },
    );
    expect(dependencies.retrieveSubscription).not.toHaveBeenCalled();
    expect(response.headers.get("content-disposition")).toContain(
      "the-voice-atlas.pdf",
    );
  });

  it("fails closed with a retryable 502 when a lifetime dispute cannot be read", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    dependencies.retrievePaymentIntent.mockResolvedValue({
      id: "pi_lifetime",
      active: true,
      disputeLookupFails: true,
    });

    const response = await request({
      paymentIntentId: "pi_lifetime",
      book: "measured-voice",
    });

    expect(response.status).toBe(502);
    expect(dependencies.readFile).not.toHaveBeenCalled();
  });
});
