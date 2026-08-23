import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  retrieveSubscription: vi.fn(),
  retrievePaymentIntent: vi.fn(),
  store: new Map<string, unknown>(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => null }));
vi.mock("@/lib/redis", () => ({
  getRedis: () => ({
    get: async (key: string) => dependencies.store.get(key) ?? null,
    set: async (key: string, value: unknown) => {
      dependencies.store.set(key, value);
      return "OK";
    },
  }),
}));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    subscriptions: { retrieve: dependencies.retrieveSubscription },
    paymentIntents: { retrieve: dependencies.retrievePaymentIntent },
  }),
  isOurSubscription: (subscription: { ours?: boolean }) => subscription.ours,
  isOurLifetimePayment: (payment: { ours?: boolean }) => payment.ours,
}));

process.env.PRO_KEY_SECRET = "test-pro-key-secret-at-least-32-characters";

const { mintProKey } = await import("@/lib/pro-key");
const { POST } = await import("./route");

function request(body: Record<string, unknown>) {
  return POST(
    new Request("https://sing.suedeai.ai/api/sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  dependencies.store.clear();
  dependencies.retrieveSubscription.mockReset().mockResolvedValue({
    id: "sub_legacyAnnual",
    customer: "cus_annual",
    status: "active",
    ours: true,
  });
  dependencies.retrievePaymentIntent.mockReset().mockResolvedValue({
    id: "pi_lifetime",
    customer: "cus_lifetime",
    ours: true,
  });
});

describe("POST /api/sync", () => {
  it("keeps the legacy annual subscription namespace and validation path", async () => {
    const key = mintProKey("cus_annual", "sub_legacyAnnual");
    const response = await request({ key, state: { xp: 10 } });

    expect(response.status).toBe(200);
    expect(dependencies.retrieveSubscription).toHaveBeenCalledWith(
      "sub_legacyAnnual",
    );
    expect(dependencies.retrievePaymentIntent).not.toHaveBeenCalled();
    expect(dependencies.store.has("sync:state:sub_legacyAnnual")).toBe(true);
  });

  it("pushes and pulls lifetime progress under the payment-intent namespace", async () => {
    const key = mintProKey("cus_lifetime", "pi_lifetime");
    const push = await request({
      key,
      state: { xp: 79 },
      updatedAt: "2026-08-23T00:00:00.000Z",
    });

    expect(push.status).toBe(200);
    expect(dependencies.retrievePaymentIntent).toHaveBeenCalledWith(
      "pi_lifetime",
      { expand: ["customer", "latest_charge"] },
    );
    expect(dependencies.retrieveSubscription).not.toHaveBeenCalled();
    expect(dependencies.store.has("sync:state:pi_lifetime")).toBe(true);

    const pull = await request({ key });
    expect(pull.status).toBe(200);
    await expect(pull.json()).resolves.toMatchObject({
      state: { xp: 79 },
      updatedAt: "2026-08-23T00:00:00.000Z",
    });
  });
});
