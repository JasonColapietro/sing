import { describe, expect, it } from "vitest";
import {
  PRICING,
  formatPrice,
  isCheckoutPlan,
  isPlanOnSale,
  isProPlan,
  proHeadline,
  proHeadlineLong,
} from "./pro-shared";

describe("formatPrice", () => {
  it("keeps the cents when there are cents", () => {
    expect(formatPrice(9.99)).toBe("$9.99");
    expect(formatPrice(6.5833333)).toBe("$6.58");
  });

  it("drops a trailing .00, which reads as a typo on a whole-dollar price", () => {
    expect(formatPrice(79)).toBe("$79");
    expect(formatPrice(0)).toBe("$0");
  });
});

describe("PRICING", () => {
  it("keeps the Early Access offers on their intended billing shapes", () => {
    expect(PRICING.monthly.amount).toBe(4.99);
    expect(PRICING.monthly.interval).toBe("month");
    expect(PRICING.lifetime.amount).toBe(79);
    expect(PRICING.lifetime.interval).toBe("one_time");
  });
});

describe("isProPlan", () => {
  it("keeps annual as a restorable entitlement while adding lifetime", () => {
    expect(isProPlan("monthly")).toBe(true);
    expect(isProPlan("annual")).toBe(true);
    expect(isProPlan("lifetime")).toBe(true);
    expect(isProPlan("weekly")).toBe(false);
  });
});

describe("isCheckoutPlan", () => {
  it("keeps monthly sold out: not on sale, still a known plan", () => {
    expect(isPlanOnSale("monthly")).toBe(false);
    expect(isPlanOnSale("lifetime")).toBe(true);
  });

  it("recognises monthly and lifetime but never annual", () => {
    expect(isCheckoutPlan("monthly")).toBe(true);
    expect(isCheckoutPlan("lifetime")).toBe(true);
    expect(isCheckoutPlan("annual")).toBe(false);
  });
});

describe("Early Access headline", () => {
  it("shows only the lifetime price without implying a lifetime subscription", () => {
    expect(proHeadline()).toBe("$79 once for lifetime access");
    expect(proHeadlineLong()).toBe(
      "Early Access: $79 once for lifetime access",
    );
  });
});
