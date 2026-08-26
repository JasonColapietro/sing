import { describe, expect, it } from "vitest";
import {
  PRICING,
  formatPrice,
  isCheckoutPlan,
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
    expect(formatPrice(59)).toBe("$59");
    expect(formatPrice(0)).toBe("$0");
  });
});

describe("PRICING", () => {
  it("keeps the Early Access offers on their intended billing shapes", () => {
    expect(PRICING.monthly.amount).toBe(4.99);
    expect(PRICING.monthly.interval).toBe("month");
    expect(PRICING.lifetime.amount).toBe(59);
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
  it("sells monthly and lifetime but never annual", () => {
    expect(isCheckoutPlan("monthly")).toBe(true);
    expect(isCheckoutPlan("lifetime")).toBe(true);
    expect(isCheckoutPlan("annual")).toBe(false);
  });
});

describe("Early Access headline", () => {
  it("shows both sellable prices without implying a lifetime subscription", () => {
    expect(proHeadline()).toBe("$4.99 a month or $59 for life");
    expect(proHeadlineLong()).toBe("Early Access: $4.99 a month or $59 once");
  });
});
