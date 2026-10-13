import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  counts: new Map<string, number>(),
  decr: vi.fn(),
  createCustomer: vi.fn(),
  createSubscription: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => null }));
vi.mock("@/lib/redis", () => ({
  getRedis: () => ({
    incr: async (key: string) => {
      const next = (dependencies.counts.get(key) ?? 0) + 1;
      dependencies.counts.set(key, next);
      return next;
    },
    decr: dependencies.decr,
  }),
}));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    customers: { create: dependencies.createCustomer },
    subscriptions: { create: dependencies.createSubscription },
  }),
  resolvePriceId: async () => "price_monthly",
  entitlementFrom: () => ({ active: true }),
}));

const { POST } = await import("./route");

function redeem(code: string) {
  return POST(
    new Request("https://sing.suedeai.ai/api/redeem", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    }),
  );
}

beforeEach(() => {
  process.env.PRO_COMP_CODES = "FRIENDS30";
  process.env.PRO_COMP_MAX_REDEMPTIONS = "1";
  dependencies.counts.clear();
  dependencies.decr.mockReset().mockImplementation(async (key: string) => {
    const next = (dependencies.counts.get(key) ?? 0) - 1;
    dependencies.counts.set(key, next);
    return next;
  });
  dependencies.createCustomer.mockReset().mockResolvedValue({ id: "cus_comp", email: null });
  dependencies.createSubscription.mockReset().mockResolvedValue({ id: "sub_comp" });
});

describe("POST /api/redeem", () => {
  it("answers 409 once a capped code is used up, and gives the slot back", async () => {
    expect((await redeem("friends30")).status).toBe(200);

    const second = await redeem("friends30");
    expect(second.status).toBe(409);
    expect(dependencies.counts.get("comp:used:FRIENDS30")).toBe(1);
    expect(dependencies.createSubscription).toHaveBeenCalledTimes(1);
  });

  it("still answers 409 when giving the slot back fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await redeem("friends30")).status).toBe(200);
    dependencies.decr.mockRejectedValue(new Error("upstash timeout"));

    const second = await redeem("friends30");
    expect(second.status).toBe(409);
    expect(dependencies.createSubscription).toHaveBeenCalledTimes(1);
  });

  it("retries a failed slot release so the counter is not left too high", async () => {
    expect((await redeem("friends30")).status).toBe(200);
    const decrement = dependencies.decr.getMockImplementation()!;
    dependencies.decr
      .mockRejectedValueOnce(new Error("upstash blip"))
      .mockImplementation(decrement);

    const second = await redeem("friends30");
    expect(second.status).toBe(409);
    expect(dependencies.decr).toHaveBeenCalledTimes(2);
    expect(dependencies.counts.get("comp:used:FRIENDS30")).toBe(1);
  });

  it("gives up after one retry when the store stays down", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await redeem("friends30")).status).toBe(200);
    dependencies.decr.mockRejectedValue(new Error("upstash down"));

    expect((await redeem("friends30")).status).toBe(409);
    expect(dependencies.decr).toHaveBeenCalledTimes(2);
  });
});
