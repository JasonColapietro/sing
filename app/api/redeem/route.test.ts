import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  counts: new Map<string, number>(),
  decr: vi.fn(),
  createCustomer: vi.fn(),
  createSubscription: vi.fn(),
  afterResponse: [] as Array<() => unknown>,
  forwardToIntake: vi.fn(),
}));

vi.mock("server-only", () => ({}));
// `after` needs a live request scope, which a direct handler call lacks, so
// the scheduled work is collected here and run by the test.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (task: () => unknown) => {
    dependencies.afterResponse.push(task);
  },
}));
vi.mock("@/lib/intake-forward", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/intake-forward")>()),
  forwardToIntake: dependencies.forwardToIntake,
}));
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
  dependencies.createSubscription
    .mockReset()
    .mockResolvedValue({ id: "sub_comp", trial_end: 1_795_000_000 });
  dependencies.afterResponse.length = 0;
  dependencies.forwardToIntake.mockReset().mockResolvedValue({ ok: true, duplicate: false });
});

describe("POST /api/redeem lead intake", () => {
  it("reports a granted pass as a lead after the response, without the code or subscription id", async () => {
    expect((await redeem(" friends30 ")).status).toBe(200);
    expect(dependencies.forwardToIntake).not.toHaveBeenCalled();
    expect(dependencies.afterResponse).toHaveLength(1);

    await dependencies.afterResponse[0]!();
    expect(dependencies.forwardToIntake).toHaveBeenCalledOnce();
    const [event] = dependencies.forwardToIntake.mock.calls[0]!;
    expect(event).toMatchObject({
      id: "comp:cus_comp",
      kind: "lead",
      property: "sing.suedeai.ai",
      summary: "Comp code redeemed",
      details: {
        compDays: 30,
        plan: "monthly",
        passEndsAt: new Date(1_795_000_000 * 1000).toISOString(),
        stripeCustomer: "cus_comp",
      },
    });
    expect(event.person).toBeUndefined();
    expect(event.details.compCodeRef).toMatch(/^[0-9a-f]{10}$/);
    const sent = JSON.stringify(event);
    expect(sent).not.toMatch(/friends30/i);
    expect(sent).not.toContain("sub_comp");
  });

  it("keeps the pass when the hub cannot be reached", async () => {
    dependencies.forwardToIntake.mockResolvedValue({ ok: false, reason: "unreachable" });
    const response = await redeem("friends30");
    await dependencies.afterResponse[0]!();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ active: true });
  });

  it("sends nothing when the code is refused", async () => {
    expect((await redeem("nope")).status).toBe(400);
    expect(dependencies.afterResponse).toHaveLength(0);
  });
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
