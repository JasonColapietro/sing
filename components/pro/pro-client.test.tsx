import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProState } from "@/lib/pro";

const proState = vi.hoisted(() => ({
  current: null as unknown as ProState,
}));

vi.mock("@/lib/pro", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/pro")>();
  return {
    ...actual,
    useProState: () => proState.current,
  };
});

import { ProClient } from "./pro-client";

function state(overrides: Partial<ProState> = {}): ProState {
  return {
    active: false,
    plan: null,
    status: null,
    subscriptionId: null,
    paymentIntentId: null,
    customerId: null,
    email: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    proKey: null,
    since: null,
    lastVerified: null,
    ...overrides,
  };
}

describe("Pro purchase choices", () => {
  beforeEach(() => {
    proState.current = state();
  });

  it("sells the two Early Access choices and never offers annual", () => {
    const html = renderToStaticMarkup(<ProClient />);

    expect(html).toContain("Early Access");
    expect(html).toContain("$4.99");
    expect(html).toContain("$79");
    expect(html).toContain("Lifetime");
    expect(html).toContain(
      "Founding offer: $79 lifetime is limited to the first 10 members.",
    );
    expect(html).toContain(
      "Keep the $4.99 monthly price while your subscription remains active.",
    );
    expect(html).not.toMatch(/\b(?:annual|yearly)\b/i);
  });

  it("keeps legacy annual subscriptions visible and manageable", () => {
    proState.current = state({
      active: true,
      plan: "annual",
      status: "active",
      subscriptionId: "sub_legacy",
      customerId: "cus_legacy",
      currentPeriodEnd: "2027-01-01T00:00:00.000Z",
    });

    const html = renderToStaticMarkup(<ProClient />);

    expect(html).toContain("Annual plan");
    expect(html).toContain("Active: annual");
    expect(html).toContain("Manage or cancel");
    expect(html).toContain("Renews");
  });

  it("never shows subscription billing or cancellation controls to lifetime owners", () => {
    proState.current = state({
      active: true,
      plan: "lifetime",
      status: "active",
      // Deliberately stale subscription-shaped fields: the plan, not a stray
      // identifier, decides whether billing controls are appropriate.
      subscriptionId: "sub_stale",
      customerId: "cus_lifetime",
      currentPeriodEnd: "2027-01-01T00:00:00.000Z",
      cancelAtPeriodEnd: true,
      paymentIntentId: "pi_lifetime",
    });

    const html = renderToStaticMarkup(<ProClient />);

    expect(html).toContain("Lifetime access");
    expect(html).toContain("Active: lifetime");
    expect(html).toContain("No subscription");
    expect(html).not.toContain("Manage or cancel");
    expect(html).not.toContain("Renews");
    expect(html).not.toContain("Ends January");
  });
});
