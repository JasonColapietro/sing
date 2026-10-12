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

import { ProClient, WelcomePanel } from "./pro-client";

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

describe("restoring Pro on a new browser", () => {
  beforeEach(() => {
    proState.current = state();
  });

  it("gives every 'Already have Pro?' link a target in the server HTML", () => {
    // Locked book and Atlas chapters link to /pro#restore. Without the id the
    // buyer landed on the sales hero, about seven phone screens above a
    // closed form, under a button selling the same purchase again.
    const html = renderToStaticMarkup(<ProClient />);
    expect(html).toMatch(/<details[^>]*id="restore"/);
    expect(html).toContain("Already have Pro? Unlock it on this device");
  });

  it("turns the buy card's Pro key note into the way to the unlock form", () => {
    // Every buy link lands on #buy, an owner's on a second browser too, and
    // the unlock form sits about 1,400px further down, closed.
    const html = renderToStaticMarkup(<ProClient />);
    expect(html).toMatch(
      /<a[^>]*href="#restore"[^>]*>Your Pro key unlocks other browsers<\/a>/,
    );
  });

  it("leaves the note as plain text for a pass holder, who has no unlock form", () => {
    proState.current = state({
      active: true,
      plan: "monthly",
      status: "trialing",
      subscriptionId: "sub_pass",
      customerId: "cus_pass",
      currentPeriodEnd: "2026-11-10T12:00:00.000Z",
    });
    const html = renderToStaticMarkup(<ProClient />);
    expect(html).toContain("Your Pro key unlocks other browsers");
    expect(html).not.toContain('href="#restore"');
    expect(html).not.toMatch(/<details[^>]*id="restore"/);
  });

  it("sends the emailed Pro key to the unlock form, not the sales hero", () => {
    proState.current = state({
      active: true,
      plan: "lifetime",
      status: "active",
      paymentIntentId: "pi_lifetime",
      proKey: "suede-pro_test",
    });
    const html = renderToStaticMarkup(<ProClient />);
    expect(html).toContain(encodeURIComponent("/pro#restore"));
  });

  it("confirms a restored key in words a buyer recognises", () => {
    const html = renderToStaticMarkup(
      <WelcomePanel how="restore" proKey="suede-pro_test" periodEnd={null} />,
    );
    expect(html).toContain("Pro is unlocked on this browser");
    expect(html).not.toContain("Welcome to the gold channel");
    expect(html).toMatch(/href="\/book"/);
    expect(html).toMatch(/href="\/atlas"/);
    expect(html).toContain("suede-pro_test");
  });

  it("confirms a redeemed pass with its end date and nothing to cancel", () => {
    const html = renderToStaticMarkup(
      <WelcomePanel how="pass" proKey={null} periodEnd="November 10, 2026" />,
    );
    expect(html).toContain("Your 30-day pass is on");
    expect(html).toContain("until November 10, 2026");
    expect(html).toContain("ends by itself");
  });

  it("keeps the checkout welcome for a purchase", () => {
    const html = renderToStaticMarkup(
      <WelcomePanel how="purchase" proKey="suede-pro_test" periodEnd={null} />,
    );
    expect(html).toContain("Welcome to the gold channel");
    expect(html).toContain("Your Pro key");
  });

  it("puts a new buyer's key and its save line above the next-step buttons", () => {
    // Below them, on a 375x667 phone, "Save this now" sat under the tab bar.
    const html = renderToStaticMarkup(
      <WelcomePanel how="purchase" proKey="suede-pro_test" periodEnd={null} />,
    );
    const save = html.indexOf("Save this now");
    expect(save).toBeGreaterThan(-1);
    expect(save).toBeLessThan(html.indexOf("Sing your first pro warmup"));
  });
});

describe("Pro sales copy on the page", () => {
  beforeEach(() => {
    proState.current = state();
  });

  it("does not sell a song's free score record as Pro", () => {
    // Every song summary shows a personal best and a score sparkline to
    // every singer, so "song history" is not something Pro adds.
    const html = renderToStaticMarkup(<ProClient />);
    expect(html).not.toMatch(/scoring history|song history/i);
    expect(html).not.toMatch(/\bgenres?\b|voice-type routines/i);
  });

  it("says where free ends for the programs, and names the Pro ones", () => {
    // Two programs need Pro after week 1. A table headed "No asterisks" that
    // left them out was contradicted by the day-8 wall.
    const html = renderToStaticMarkup(<ProClient />);
    expect(html).toContain("4, plus week 1 of 2 more");
    expect(html).toContain("All 6");
    expect(html).toContain(
      "Both Pro programs in full (Mix in 4 weeks and The Measured Voice: 12 weeks)",
    );
  });

  it("does not say Pro keeps a record the free plan also keeps", () => {
    // Free stores the same sessions and range tests; /progress tells a free
    // singer "older sessions are stored — Pro shows all of them". Pro adds
    // the charts across them, not the keeping.
    const html = renderToStaticMarkup(<ProClient />);
    expect(html).not.toContain("Pro keeps the months");
    expect(html).not.toContain("long record of your own voice");
    expect(html).toContain("Pro charts the months behind it");
  });

  it("puts the price button straight under the headline on a phone", () => {
    // At 375x667 the paragraph pushed the button under the tab bar; on small
    // screens the buttons now come first and the paragraph follows.
    const html = renderToStaticMarkup(<ProClient />);
    const button = html.indexOf(">Get lifetime Pro: $79 once</a>");
    const wrapper = html.lastIndexOf('class="order-1 ', button);
    expect(button).toBeGreaterThan(-1);
    expect(wrapper).toBeGreaterThan(-1);
    expect(html.slice(wrapper, button)).toContain("sm:order-2");
    expect(html).toMatch(/<p class="order-2 [^"]*sm:order-1[^"]*">Suede Pro is the vocal coaching layer/);
  });
});
