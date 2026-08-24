import { afterEach, describe, expect, it, vi } from "vitest";

const KEY = "suede-sing:pro:v2";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("lifetime entitlement revalidation", () => {
  it("revalidates by PaymentIntent id and keeps checkout-earned credentials", async () => {
    const stored = new Map<string, string>([
      [
        KEY,
        JSON.stringify({
          active: true,
          plan: "lifetime",
          status: "succeeded",
          subscriptionId: null,
          paymentIntentId: "pi_lifetime",
          customerId: "cus_owner",
          email: "singer@example.com",
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          proKey: "suede-pro_lifetime",
          since: "2026-08-23T12:00:00.000Z",
          lastVerified: "2026-08-23T12:00:00.000Z",
        }),
      ],
    ]);
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => stored.get(key) ?? null,
        setItem: (key: string, value: string) => void stored.set(key, value),
        removeItem: (key: string) => void stored.delete(key),
      },
      addEventListener: () => {},
      location: { href: "https://sing.suedeai.ai/pro" },
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          active: true,
          plan: "lifetime",
          status: "succeeded",
          subscriptionId: null,
          paymentIntentId: "pi_lifetime",
          customerId: null,
          email: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          proKey: null,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.resetModules();
    const { getProState, revalidatePro } = await import("./pro");

    await revalidatePro({ force: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(path).toBe("/api/entitlement");
    expect(JSON.parse(String(init.body))).toEqual({
      paymentIntentId: "pi_lifetime",
    });
    expect(getProState()).toMatchObject({
      active: true,
      plan: "lifetime",
      subscriptionId: null,
      paymentIntentId: "pi_lifetime",
      customerId: "cus_owner",
      email: "singer@example.com",
      proKey: "suede-pro_lifetime",
    });
  });
});
