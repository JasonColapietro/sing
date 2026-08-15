import { describe, expect, it } from "vitest";
import {
  PRICING,
  annualEnabled,
  annualSavingsPct,
  formatPrice,
  isProPlan,
  type PlanPrice,
  type ProPlan,
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
  it("prices the year below twelve months, or the yearly plan is a downgrade", () => {
    expect(PRICING.annual.amount).toBeLessThan(PRICING.monthly.amount * 12);
    expect(PRICING.annual.perMonth).toBeLessThan(PRICING.monthly.perMonth);
  });

  it("amortises each plan onto the same monthly number", () => {
    expect(PRICING.monthly.perMonth).toBe(PRICING.monthly.amount);
    expect(PRICING.annual.perMonth).toBeCloseTo(PRICING.annual.amount / 12, 10);
  });

  it("bills each plan on the interval its Stripe price recurs on", () => {
    expect(PRICING.monthly.interval).toBe("month");
    expect(PRICING.annual.interval).toBe("year");
  });
});

describe("annualSavingsPct", () => {
  it("compares a year of the annual plan against twelve monthly charges", () => {
    const pricing: Record<ProPlan, PlanPrice> = {
      monthly: { amount: 10, interval: "month", perMonth: 10, note: "" },
      annual: { amount: 90, interval: "year", perMonth: 7.5, note: "" },
    };
    expect(annualSavingsPct(pricing)).toBe(25);
  });

  it("reports a whole percentage for the shipped prices", () => {
    const pct = annualSavingsPct();
    expect(Number.isInteger(pct)).toBe(true);
    expect(pct).toBeGreaterThan(0);
  });
});

describe("annualEnabled", () => {
  it("is off unless the flag is explicitly set", () => {
    expect(annualEnabled(undefined)).toBe(false);
    expect(annualEnabled("")).toBe(false);
    expect(annualEnabled("0")).toBe(false);
    expect(annualEnabled("false")).toBe(false);
  });

  it("accepts the two spellings a deploy env is likely to carry", () => {
    expect(annualEnabled("1")).toBe(true);
    expect(annualEnabled("true")).toBe(true);
  });
});

describe("isProPlan", () => {
  it("accepts every plan PRICING quotes, so checkout can sell all of them", () => {
    for (const plan of Object.keys(PRICING)) {
      expect(isProPlan(plan)).toBe(true);
    }
  });
});
