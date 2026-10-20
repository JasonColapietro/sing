import { afterEach, describe, expect, it, vi } from "vitest";

const KEY = "suede-sing:pro:v2";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

function stubStorage(initial: Record<string, unknown>): Map<string, string> {
  const stored = new Map<string, string>([[KEY, JSON.stringify(initial)]]);
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => void stored.set(key, value),
      removeItem: (key: string) => void stored.delete(key),
    },
    addEventListener: () => {},
    location: { href: "https://sing.suedeai.ai/pro" },
  });
  return stored;
}

function reply(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

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

describe("a plan check that races a purchase", () => {
  // A subscriber whose plan is set to end buys lifetime. On the return from
  // Stripe, /pro confirms the checkout while the forced ending-plan check (or
  // ProSync's twelve-hourly one) is still in flight with the old subscription
  // id. That reply describes the old billing record: applied after the
  // purchase, it put the plan back to "monthly, ending", kept the new key
  // beside the old subscription id, and revoked the lifetime key once the old
  // period ran out.
  const ending = {
    active: true,
    plan: "monthly",
    status: "active",
    subscriptionId: "sub_old",
    paymentIntentId: null,
    customerId: "cus_old",
    email: "singer@example.com",
    currentPeriodEnd: "2026-10-22T12:00:00.000Z",
    cancelAtPeriodEnd: true,
    proKey: "old",
    since: "2026-08-01T12:00:00.000Z",
    lastVerified: "2026-10-20T08:00:00.000Z",
  };
  const lifetime = {
    active: true,
    plan: "lifetime",
    status: "succeeded",
    subscriptionId: null,
    paymentIntentId: "pi_new",
    customerId: "cus_new",
    email: "singer@example.com",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    proKey: "new",
  };
  const stillEnding = {
    ...ending,
    customerId: null,
    email: null,
    proKey: null,
  };

  it("keeps the lifetime purchase when the old subscription's reply lands after it", async () => {
    stubStorage(ending);
    let releaseSubscription = () => {};
    const subscriptionHeld = new Promise<void>((resolve) => {
      releaseSubscription = resolve;
    });
    const fetchMock = vi.fn(async (_path: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as Record<string, string>;
      if (body.sessionId) return reply(lifetime);
      await subscriptionHeld;
      return reply(stillEnding);
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.resetModules();
    const { confirmCheckout, getProState, revalidatePro } = await import("./pro");

    await Promise.all([
      revalidatePro({ force: true }),
      confirmCheckout("cs_x").finally(releaseSubscription),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toEqual({
      subscriptionId: "sub_old",
    });
    expect(getProState()).toMatchObject({
      active: true,
      plan: "lifetime",
      subscriptionId: null,
      paymentIntentId: "pi_new",
      customerId: "cus_new",
      cancelAtPeriodEnd: false,
      proKey: "new",
    });
  });

  it("keeps the purchase when a pass holder's routine check races it", async () => {
    // ProSync's unforced check runs on any page once the last one is twelve
    // hours old, including the page Stripe returns a 30-day pass holder to.
    stubStorage({
      ...ending,
      status: "trialing",
      cancelAtPeriodEnd: false,
      subscriptionId: "sub_pass",
      lastVerified: "2026-10-19T08:00:00.000Z",
    });
    let releaseSubscription = () => {};
    const subscriptionHeld = new Promise<void>((resolve) => {
      releaseSubscription = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_path: string, init: RequestInit) => {
        const body = JSON.parse(String(init.body)) as Record<string, string>;
        if (body.sessionId) return reply(lifetime);
        await subscriptionHeld;
        return reply({ ...stillEnding, status: "trialing", subscriptionId: "sub_pass" });
      }),
    );
    vi.resetModules();
    const { confirmCheckout, getProState, revalidatePro } = await import("./pro");

    await Promise.all([
      revalidatePro(),
      confirmCheckout("cs_x").finally(releaseSubscription),
    ]);

    expect(getProState()).toMatchObject({
      plan: "lifetime",
      status: "succeeded",
      subscriptionId: null,
      paymentIntentId: "pi_new",
      proKey: "new",
    });
  });

  it("still applies the reply when nothing replaced the entitlement meanwhile", async () => {
    stubStorage({ ...ending, cancelAtPeriodEnd: false });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => reply(stillEnding)),
    );
    vi.resetModules();
    const { getProState, revalidatePro } = await import("./pro");

    await revalidatePro({ force: true });

    expect(getProState()).toMatchObject({
      plan: "monthly",
      subscriptionId: "sub_old",
      cancelAtPeriodEnd: true,
      customerId: "cus_old",
      proKey: "old",
    });
  });
});
