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

  it("sells lifetime, shows monthly as disabled and sold out, never offers annual", () => {
    const html = renderToStaticMarkup(<ProClient />);

    expect(html).toContain("Early Access");
    expect(html).toContain("$4.99");
    expect(html).toContain("$79");
    expect(html).toContain("Lifetime");
    // No scarcity claim the checkout does not enforce.
    expect(html).not.toContain("first 10 members");
    expect(html).not.toContain("Founding offer");
    expect(html).toContain("Monthly: Sold out");
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Monthly · \$4\.99\/mo<\/button>/);
    expect(html).toContain("Get lifetime Pro: $79 once");
    expect(html).not.toContain("Go Pro: $4.99/month");
    expect(html).not.toContain("Keep the $4.99 monthly price");
    expect(html).not.toMatch(/\b(?:annual|yearly)\b/i);
  });

  it("lands every buy link on the Pro card, which states the no-limit benefit first", () => {
    const html = renderToStaticMarkup(<ProClient />);

    // The hero carries the price and jumps straight to the buy card.
    expect(html).toMatch(/<a[^>]*href="#buy"[^>]*>Get lifetime Pro: \$79 once<\/a>/);
    expect(html).toMatch(/<div[^>]*id="buy"/);
    expect(html).toContain("$79 once for lifetime access");
    expect(html).toContain(
      "No daily limit on guided practice: warmups, ear training, breath and songs",
    );
    expect(html).toContain("Your Pro key unlocks other browsers");
    // True with or without accounts: the cap needs none, and none is promised.
    expect(html).not.toMatch(/free accounts?/i);
    expect(html).not.toMatch(/no (?:account|sign-?up) (?:needed|required)/i);
  });

  it("treats a 30-day pass as a pass that ends, and offers lifetime during it", () => {
    proState.current = state({
      active: true,
      plan: "monthly",
      status: "trialing",
      subscriptionId: "sub_pass",
      customerId: "cus_pass",
      currentPeriodEnd: "2026-11-10T12:00:00.000Z",
      cancelAtPeriodEnd: false,
    });

    const html = renderToStaticMarkup(<ProClient />);

    expect(html).toContain("30-day pass");
    expect(html).toContain("Active: free pass");
    expect(html).toContain("then ends on its own");
    expect(html).toContain("Keep Pro for life: $79 once");
    // It never renews and there is nothing to cancel.
    expect(html).not.toContain("Renews");
    expect(html).not.toContain("Manage or cancel");
    // Labelled as the pass it is, not as the sold-out monthly plan.
    expect(html).toContain(">Pass<");
    expect(html).not.toContain(">Monthly<");
    // Nobody on a free pass has paid, so nobody on one is thanked for it.
    expect(html).not.toContain("Thanks for keeping the free studio free");
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
    expect(html).not.toContain("Keep Pro for life");
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
    expect(html).toContain("Thanks for keeping the free studio free");
    expect(html).not.toContain("Manage or cancel");
    expect(html).not.toContain("Renews");
    expect(html).not.toContain("Ends January");
  });
});
