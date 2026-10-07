import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { mintProKey, verifyProKey } = await import("./pro-key");

beforeEach(() => {
  process.env.PRO_KEY_SECRET = "test-pro-key-secret";
});

describe("Pro keys", () => {
  it("continues to verify a key minted for a legacy annual subscription", () => {
    const legacyKey =
      "suede-pro_Y3VzX2xlZ2FjeTpzdWJfYW5udWFs.1kVnyr1Rc4W4NRTrpnsSEJY7iJnYphOhyVEWJWTLbbs";

    expect(verifyProKey(legacyKey)).toEqual({
      kind: "subscription",
      customerId: "cus_legacy",
      subscriptionId: "sub_annual",
    });
  });

  it("mints a restorable key for a lifetime PaymentIntent", () => {
    const key = mintProKey("cus_lifetime", "pi_lifetime");

    expect(verifyProKey(key)).toEqual({
      kind: "lifetime",
      customerId: "cus_lifetime",
      paymentIntentId: "pi_lifetime",
    });
  });
});
