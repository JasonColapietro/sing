import { readFileSync } from "node:fs";
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

import { checkEndingPlan, offersLifetimeBeforeLapse, ProClient, WelcomePanel } from "./pro-client";
import { SUPPORT_EMAIL } from "@/lib/organization";
import { PRO_PACKS_HREF } from "@/lib/pro-inventory";

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

  it("waits for a fresh check before offering lifetime to a subscriber whose plan is set to end", () => {
    // As cached (the server render, and every render before the forced
    // check returns): the plan reads as ending, and the page says so, but a
    // subscriber who resumed in Stripe's portal could still read like this,
    // so no lifetime purchase is offered on top of it yet.
    proState.current = state({
      active: true,
      plan: "monthly",
      status: "active",
      subscriptionId: "sub_x",
      customerId: "cus_x",
      currentPeriodEnd: "2026-11-10T12:00:00.000Z",
      cancelAtPeriodEnd: true,
      lastVerified: "2026-10-12T08:00:00.000Z",
    });
    const html = renderToStaticMarkup(<ProClient />);
    expect(html).toContain("Pro is set to end on");
    expect(html).toContain("Ends");
    expect(html).toContain("Manage or cancel");
    expect(html).not.toContain("Keep Pro for life");
    expect(html).not.toContain("Lifetime Pro is below");
  });

  it("never grows the hero with a lifetime pointer once the check returns", () => {
    // The ending-plan note is the same before and after the forced check; the
    // offer itself lives in the plans card and the final call to action, both
    // gated on that check (offersLifetimeBeforeLapse).
    const src = readFileSync(new URL("./pro-client.tsx", import.meta.url), "utf8");
    expect(src).not.toContain("Lifetime Pro is below");
    expect(src).toContain("{(onPass || lapsing) && (");
    expect(src).toContain('href={pro.active && !onPass && !lapsing ? "#plans" : "#buy"}');
  });

  it("offers lifetime to a subscriber whose plan a check on this visit found still ending", () => {
    const checkedFrom = Date.parse("2026-10-13T09:00:00.000Z");
    const after = "2026-10-13T09:00:01.000Z";
    const ending = state({
      active: true,
      plan: "monthly",
      status: "active",
      subscriptionId: "sub_x",
      cancelAtPeriodEnd: true,
      lastVerified: after,
    });
    expect(offersLifetimeBeforeLapse(ending, checkedFrom)).toBe(true);
    expect(offersLifetimeBeforeLapse({ ...ending, plan: "annual" }, checkedFrom)).toBe(true);
    // No check yet, or one that failed and left the older reading.
    expect(offersLifetimeBeforeLapse(ending, null)).toBe(false);
    expect(offersLifetimeBeforeLapse({ ...ending, lastVerified: "2026-10-12T08:00:00.000Z" }, checkedFrom)).toBe(false);
    // The check found it resumed: it renews, so no second purchase.
    expect(offersLifetimeBeforeLapse({ ...ending, cancelAtPeriodEnd: false }, checkedFrom)).toBe(false);
    // Payment trouble, a pass, lifetime, or Pro already gone.
    expect(offersLifetimeBeforeLapse({ ...ending, status: "past_due" }, checkedFrom)).toBe(false);
    expect(offersLifetimeBeforeLapse({ ...ending, status: "trialing" }, checkedFrom)).toBe(false);
    expect(offersLifetimeBeforeLapse({ ...ending, plan: "lifetime" }, checkedFrom)).toBe(false);
    expect(offersLifetimeBeforeLapse({ ...ending, active: false }, checkedFrom)).toBe(false);
  });

  it("withdraws the lifetime offer and checks again when /pro comes back from the back/forward cache", async () => {
    // Back from Stripe's portal, where the plan may have been resumed, the
    // restored page must not keep an offer made from the check before it.
    const settle: Array<() => void> = [];
    const revalidate = () => new Promise<void>((resolve) => settle.push(resolve));
    const reports: Array<number | null> = [];
    const page = new EventTarget();
    let clock = 1000;
    const restored = () => Object.assign(new Event("pageshow"), { persisted: true });
    const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

    const stop = checkEndingPlan(revalidate, (at) => reports.push(at), page, () => clock);
    expect(settle).toHaveLength(1);
    settle[0]();
    await flush();
    expect(reports).toEqual([1000]);

    // A fresh load's pageshow (persisted false) is not a restore.
    page.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: false }));
    expect(settle).toHaveLength(1);

    // Restored: the offer goes at once, and only the new check brings it back.
    clock = 5000;
    page.dispatchEvent(restored());
    expect(reports).toEqual([1000, null]);
    expect(settle).toHaveLength(2);
    // A second restore before that check settles: the older one is ignored.
    clock = 7000;
    page.dispatchEvent(restored());
    settle[1]();
    await flush();
    expect(reports).toEqual([1000, null, null]);
    settle[2]();
    await flush();
    expect(reports).toEqual([1000, null, null, 7000]);

    // Unmounted (the plan no longer reads as ending): nothing more is reported.
    stop();
    page.dispatchEvent(restored());
    expect(settle).toHaveLength(3);
    expect(reports).toEqual([1000, null, null, 7000]);
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
    // The cap wall's link says "in this browser"; the form it lands on says
    // the same, because Pro unlocks per browser, not per device.
    expect(html).toContain("Already have Pro? Unlock it in this browser");
    expect(html).not.toContain("Unlock it on this device");
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

describe("after the purchase", () => {
  beforeEach(() => {
    proState.current = state();
  });

  it("sends 'Sing your first pro warmup' to the Pro packs, not a free set", () => {
    const html = renderToStaticMarkup(
      <WelcomePanel how="purchase" proKey="suede-pro_test" periodEnd={null} />,
    );
    expect(html).toMatch(
      new RegExp(`<a[^>]*href="${PRO_PACKS_HREF}"[^>]*>\\s*Sing your first pro warmup`),
    );
  });

  it("sends a Pro member's 'Start a pro warmup' to the Pro packs", () => {
    proState.current = state({
      active: true,
      plan: "lifetime",
      status: "active",
      customerId: "cus_lifetime",
      paymentIntentId: "pi_lifetime",
    });
    const html = renderToStaticMarkup(<ProClient />);
    expect(html).toMatch(new RegExp(`<a[^>]*href="${PRO_PACKS_HREF}"[^>]*>\\s*Start a pro warmup`));
  });

  it("names the one support address, with the words around it intact", () => {
    const key = renderToStaticMarkup(
      <WelcomePanel how="purchase" proKey="suede-pro_test" periodEnd={null} />,
    );
    expect(key).toContain(`Lost it? Email ${SUPPORT_EMAIL}.`);
    const restore = renderToStaticMarkup(<ProClient />).replaceAll("&#x27;", "'");
    expect(restore).toContain(`Lost it? Email ${SUPPORT_EMAIL} and we'll send a new one.`);
  });
});
