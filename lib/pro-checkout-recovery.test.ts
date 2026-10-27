import { afterEach, describe, expect, it, vi } from "vitest";
import { INACTIVE, type Entitlement } from "./pro-shared";

const PENDING = "suede-sing:pro:pending-checkout";
const STARTED = "suede-sing:pro:started-checkout";
const PRO = "suede-sing:pro:v2";
const SESSION = "cs_test_processing_recovery";
const paid: Entitlement = {
  ...INACTIVE,
  active: true,
  plan: "lifetime",
  status: "succeeded",
  paymentIntentId: "pi_recovery",
  customerId: "cus_recovery",
  email: "singer@example.com",
  proKey: "suede-pro_recovery_fixture",
};

function storage() {
  const stored = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => void stored.set(key, value),
      removeItem: (key: string) => void stored.delete(key),
    },
  });
  return stored;
}

function reply(entitlement: Entitlement) {
  return new Response(JSON.stringify(entitlement), { status: 200 });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("checkout confirmation across page visits", () => {
  it("retains a processing return through repeated reloads, then unlocks the paid session", async () => {
    const stored = storage();
    let pro = await import("./pro");
    pro.rememberStartedCheckout(SESSION);
    expect(pro.rememberPendingCheckout(SESSION)).toBe(true);
    expect(stored.has(STARTED)).toBe(false);
    const fetch = vi.fn().mockImplementation(() => reply({ ...INACTIVE, status: "processing" }));
    vi.stubGlobal("fetch", fetch);

    for (let visit = 0; visit < 2; visit++) {
      expect(pro.pendingCheckout()).toBe(SESSION);
      const state = await pro.confirmCheckout(pro.pendingCheckout()!);
      expect(state).toMatchObject({ active: false, proKey: null, status: "processing" });
      expect(stored.get(PENDING)).toBe(SESSION);
      // Reload drops module memory and the stripped return URL. Only storage survives.
      vi.resetModules();
      pro = await import("./pro");
    }
    expect(fetch).toHaveBeenCalledTimes(2);

    fetch.mockImplementation(() => reply(paid));
    expect(await pro.confirmCheckout(pro.pendingCheckout()!)).toMatchObject(paid);
    expect(pro.pendingCheckout()).toBeNull();
    expect(JSON.parse(stored.get(PRO)!)).toMatchObject(paid);
    expect(fetch).toHaveBeenLastCalledWith("/api/entitlement", expect.objectContaining({
      body: JSON.stringify({ sessionId: SESSION }),
    }));

    vi.resetModules();
    pro = await import("./pro");
    expect(pro.getProState()).toMatchObject(paid);
    expect(pro.pendingCheckout()).toBeNull();
  });

  it.each(["expired", "canceled", "requires_payment_method", null])(
    "clears a pending checkout when Stripe definitively answers %s",
    async (status) => {
      const stored = storage();
      const pro = await import("./pro");
      pro.rememberPendingCheckout(SESSION);
      vi.stubGlobal("fetch", () => Promise.resolve(reply({ ...INACTIVE, status })));
      expect(await pro.confirmCheckout(SESSION)).toMatchObject({ active: false, status });
      expect(stored.has(PENDING)).toBe(false);
      expect(pro.getProState().active).toBe(false);
    },
  );

  it("clears an immediately paid checkout without leaving a redundant recovery attempt", async () => {
    storage();
    const pro = await import("./pro");
    pro.rememberPendingCheckout(SESSION);
    vi.stubGlobal("fetch", () => Promise.resolve(reply(paid)));
    expect(await pro.confirmCheckout(SESSION)).toMatchObject(paid);
    expect(pro.pendingCheckout()).toBeNull();
  });
});
