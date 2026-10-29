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

import {
  checkEndingPlan,
  confirmFailureMessage,
  offersLifetimeBeforeLapse,
  ProClient,
  readCheckoutLanding,
  WelcomePanel,
} from "./pro-client";
import { NETWORK_ERROR_MESSAGE, ProApiError } from "@/lib/pro";
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
    // Monthly is named once, as sold out, in the plans blurb. It is never a
    // control: a struck-through option beside the one plan on sale read as a
    // broken toggle, so nothing on the page offers a disabled option.
    expect(html).toContain("The $4.99 monthly plan is sold out");
    expect(html).not.toContain('aria-label="Purchase option"');
    expect(html).not.toMatch(/<button[^>]*disabled[^>]*>[^<]*Monthly/);
    expect(html).toContain("Get lifetime Pro: $79 once");
    expect(html).not.toContain("Go Pro: $4.99/month");
    expect(html).not.toContain("Keep the $4.99 monthly price");
    expect(html).not.toMatch(/\b(?:annual|yearly)\b/i);
  });

  it("lands every buy link on the Pro card, which states the no-limit benefit first", () => {
    const html = renderToStaticMarkup(<ProClient />);

    // The hero carries the price and opens Checkout itself, like the card's
    // button: a priced button that only scrolled to an identical one cost a click.
    expect(html).toMatch(/<button[^>]*>Get lifetime Pro: \$79 once<\/button>/);
    expect(html).not.toMatch(/<a[^>]*href="#buy"[^>]*>Get lifetime Pro/);
    expect(html).toMatch(/<div[^>]*id="buy"/);
    expect(html).toContain("One payment. Lifetime Pro. No renewal.");
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
    // (The purchase toggle's struck "Monthly" option is not the plan label.)
    expect(html).toMatch(/<span class="font-mono text-4xl[^"]*">Pass<\/span>/);
    expect(html).not.toMatch(/<span class="font-mono text-4xl[^"]*">Monthly<\/span>/);
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

  it("does not start the ending-plan check while a purchase is being confirmed", () => {
    // On the return from buying lifetime the check would ask about the old
    // subscription; lib/pro-revalidation.test.ts covers the reply being
    // dropped, and this keeps the second $79 button from flashing meanwhile.
    // Not gated on the welcome: after a restored key for a plan that is still
    // ending, the lifetime offer has to show.
    const src = readFileSync(new URL("./pro-client.tsx", import.meta.url), "utf8");
    expect(src).toMatch(/const endingAsCached =[^;]*checkout\.kind !== "working";/);
    expect(src).not.toMatch(/const endingAsCached =[^;]*welcome/);
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
    expect(html).not.toContain("Welcome to Suede Pro");
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
    expect(html).toContain("Welcome to Suede Pro");
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
    expect(html).toContain("Pro charts your range over months");
    // Free also draws the weekly trend and the first two coach steps.
    expect(html).not.toContain("Free shows you today");
    expect(html).toContain("plans the first two steps of each day");
  });

  it("says pay-once in three places, and the checkout and on-device facts once each", () => {
    // The hero button, the buy-card price line and the final mono line carry
    // the offer; nothing else restates it, and no surface says "gold channel".
    const html = renderToStaticMarkup(<ProClient />).replaceAll("&#x27;", "'");
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    // The price on the three buttons (hero, buy card, final CTA), nowhere else.
    expect(text.match(/\$79 once/g)).toHaveLength(3);
    expect(text.match(/Get lifetime Pro: \$79 once/g)).toHaveLength(3);
    expect(text.match(/One payment\. Lifetime Pro\. No renewal\./g)).toHaveLength(1);
    expect(text.match(/One payment · Never renews/g)).toHaveLength(1);
    expect(text).not.toContain("$79 once for lifetime access");
    expect(text).not.toMatch(/pay once/i);
    expect(text.match(/Secure checkout by Stripe/g)).toHaveLength(1);
    expect(text.match(/never leaves? your device/gi)).toHaveLength(1);
    expect(text).not.toMatch(/gold channel/i);
    expect(html).toContain("Suede Pro · Early Access");
    expect(html).toContain(">Pricing<");
    // Exits are demoted: a text link in the hero, the studio link in the final mono line.
    expect(html).toMatch(/<a[^>]*href="\/studio"[^>]*>or keep practicing free<\/a>/);
    expect(html).not.toContain(">Back to the studio</a>\n");
    expect(html.match(/>Keep practicing free</g)).toHaveLength(1);
    expect(html).toMatch(/One payment<span[^>]*>·<\/span>Never renews<span[^>]*>·<\/span><a[^>]*href="\/studio"[^>]*>Back to the studio<\/a>/);
  });

  it("sells the per-note chart as one chart, not one charted over months", () => {
    // Pro's per-note chart is one tally with no time axis; only the range is
    // charted over time. Round 11 fixed this everywhere but the buy card.
    const html = renderToStaticMarkup(<ProClient />);
    expect(html).toContain("A per-note accuracy chart, and your range charted over months");
    expect(html).not.toMatch(/per-note accuracy and your range charted over/i);
    const src = readFileSync(new URL("./pro-client.tsx", import.meta.url), "utf8");
    expect(src).not.toContain("Per-note accuracy and your range charted over months");
  });

  it("puts the price button straight under the headline on a phone", () => {
    // At 375x667 the paragraph pushed the button under the tab bar; on small
    // screens the buttons now come first and the paragraph follows.
    const html = renderToStaticMarkup(<ProClient />);
    const button = html.indexOf(">Get lifetime Pro: $79 once</button>");
    const wrapper = html.lastIndexOf('class="order-1 ', button);
    expect(button).toBeGreaterThan(-1);
    expect(wrapper).toBeGreaterThan(-1);
    expect(html.slice(wrapper, button)).toContain("sm:order-2");
    expect(html).toMatch(/<p class="order-2 [^"]*sm:order-1[^"]*">Free scores every session/);
    expect(html).not.toContain("once with no renewal");
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

describe("the buy card's place in the Tab order", () => {
  beforeEach(() => {
    proState.current = state();
  });

  it("comes before the Free card in the source and on screen, at every width", () => {
    // Placed first by CSS order alone, Tab went from the toggle down to the
    // Free card's button and back up to the buy button. Then, first in the
    // source but moved right from sm up, a desktop's Tab went right before
    // left. No order class at all keeps screen and Tab order together.
    const html = renderToStaticMarkup(<ProClient />);
    const buy = html.indexOf('id="buy"');
    const buyButton = html.indexOf(">Get lifetime Pro: $79 once</button>", buy);
    const freeCard = html.lastIndexOf(">Keep practicing free</a>");
    expect(buy).toBeGreaterThan(-1);
    expect(buyButton).toBeGreaterThan(buy);
    expect(freeCard).toBeGreaterThan(buyButton);
    // Neither card, nor anything between the buy card and the Free card's
    // button, is reordered at any breakpoint.
    const cards = html.slice(buy, freeCard);
    expect(cards).toContain(">$0</span>");
    expect(cards).not.toMatch(/class="[^"]*\b(?:[a-z0-9]+:)?order-/);
  });
});

describe("the address /pro opens with", () => {
  it("confirms a real session id from Stripe's return", () => {
    expect(readCheckoutLanding("?checkout=success&session_id=cs_test_a1", null)).toEqual({
      kind: "confirm",
      sessionId: "cs_test_a1",
      fromUrl: true,
      marked: true,
    });
  });

  it("never parks or confirms a session id that is not one", () => {
    // It used to be parked, retried three times on every visit, read as "your
    // payment went through", and hide the buy button for good.
    expect(readCheckoutLanding("?checkout=success&session_id=bogus123", null)).toEqual({
      kind: "unreferenced",
      marked: true,
    });
    expect(readCheckoutLanding("?session_id=bogus123", null)).toEqual({
      kind: "unreferenced",
      marked: true,
    });
    // A real parked id still resumes.
    expect(readCheckoutLanding("?checkout=success&session_id=bogus123", "cs_test_parked")).toEqual({
      kind: "confirm",
      sessionId: "cs_test_parked",
      fromUrl: false,
      marked: true,
    });
    expect(readCheckoutLanding("", "bogus123")).toEqual({ kind: "none", marked: false });
  });

  it("says a checkout was cancelled only when Stripe's cancel address says so", () => {
    expect(readCheckoutLanding("?checkout=cancelled", null)).toEqual({ kind: "cancelled", marked: true });
    expect(readCheckoutLanding("?checkout=success", null)).toEqual({ kind: "unreferenced", marked: true });
    expect(readCheckoutLanding("?checkout=success&session_id=", null)).toEqual({
      kind: "unreferenced",
      marked: true,
    });
    expect(readCheckoutLanding("?checkout=whatever", null)).toEqual({ kind: "none", marked: true });
  });

  it("resumes a parked id on a plain visit, and leaves other queries alone", () => {
    expect(readCheckoutLanding("", "cs_test_parked")).toEqual({
      kind: "confirm",
      sessionId: "cs_test_parked",
      fromUrl: false,
      marked: false,
    });
    expect(readCheckoutLanding("?utm_source=mail", null)).toEqual({ kind: "none", marked: false });
    expect(readCheckoutLanding("?portal=1", "cs_test_parked")).toEqual({ kind: "portal" });
  });

  it("resolves a checkout this browser began and never returned from, quietly and only on a plain visit", () => {
    expect(readCheckoutLanding("", null, "cs_test_started")).toEqual({
      kind: "started",
      sessionId: "cs_test_started",
      marked: false,
    });
    // The return's own id, or a parked one, always wins.
    expect(readCheckoutLanding("?checkout=success&session_id=cs_test_a1", null, "cs_test_started")).toMatchObject({
      kind: "confirm",
      sessionId: "cs_test_a1",
    });
    expect(readCheckoutLanding("", "cs_test_parked", "cs_test_started")).toMatchObject({
      kind: "confirm",
      sessionId: "cs_test_parked",
    });
    // A success address that lost its id is confirmed from the started one,
    // and parked like an id the address carried.
    expect(readCheckoutLanding("?checkout=success", null, "cs_test_started")).toEqual({
      kind: "confirm",
      sessionId: "cs_test_started",
      fromUrl: true,
      marked: true,
    });
    // Stripe's cancel address, or junk, never resolves it.
    expect(readCheckoutLanding("?checkout=cancelled", null, "cs_test_started")).toEqual({
      kind: "cancelled",
      marked: true,
    });
    expect(readCheckoutLanding("", null, "bogus")).toEqual({ kind: "none", marked: false });
    // The cancel address also ends the checkout this browser began.
    const src = readFileSync(new URL("./pro-client.tsx", import.meta.url), "utf8");
    expect(src).toContain('if (landing.kind === "cancelled") clearStartedCheckout();');
  });

  it("says nothing cancelled or confirmable on a success address without a usable id", () => {
    const html = renderToStaticMarkup(<ProClient />);
    const src = readFileSync(new URL("./pro-client.tsx", import.meta.url), "utf8");
    // The cancelled note is gated on Stripe's cancel address alone.
    expect(src).toContain('{returnNote === "cancelled" && (');
    expect(src).not.toMatch(/setAbandoned\(true\)/);
    expect(html).not.toContain("Checkout cancelled");
  });
});

describe("a confirmation that fails", () => {
  it("promises a retry on reload only where one will happen", () => {
    const parked = confirmFailureMessage(new Error(NETWORK_ERROR_MESSAGE), true);
    expect(parked.definitive).toBe(false);
    expect(parked.message).toContain("Reload this page and we'll try again. Nothing is lost.");
    // Site data blocked: the address keeps the id, so a reload retries, but
    // leaving the page loses it, and the copy says to keep the reference.
    const blocked = confirmFailureMessage(new ProApiError("Stripe is down", 502), false);
    expect(blocked.definitive).toBe(false);
    expect(blocked.message).not.toContain("Nothing is lost");
    expect(blocked.message).toContain("copy the reference below");
    expect(blocked.message).toContain(SUPPORT_EMAIL);
  });

  it("does not tell someone a refused reference went through", () => {
    const refused = confirmFailureMessage(new ProApiError("Provide a checkout session id", 400), true);
    expect(refused.definitive).toBe(true);
    expect(refused.message).not.toContain("payment went through");
    expect(refused.message).toContain("reloading won't change it");
    expect(confirmFailureMessage(new ProApiError("busy", 429), true).definitive).toBe(false);
    // A firewall's 403 says nothing about the reference: the paid copy stays.
    const blockedByEdge = confirmFailureMessage(new ProApiError("Forbidden", 403), true);
    expect(blockedByEdge.definitive).toBe(false);
    expect(blockedByEdge.message).toContain("Reload this page and we'll try again.");
  });

  it("keeps the address until the id is parked or Stripe's answer makes it useless", () => {
    const src = readFileSync(new URL("./pro-client.tsx", import.meta.url), "utf8");
    expect(src).toContain("const parked = landing.fromUrl ? rememberPendingCheckout(sessionId) : true;");
    expect(src).toContain("if (landing.marked && parked) clearAddress();");
  });
});

describe("errors a screen reader hears", () => {
  it("announces the unlock, pass, billing-portal and PDF failures and ties each field to its error", () => {
    const src = readFileSync(new URL("./pro-client.tsx", import.meta.url), "utf8");
    expect(src.match(/<p id=\{errorId\} role="alert"/g)).toHaveLength(2);
    expect(src.match(/aria-describedby=\{failed \? errorId : undefined\}/g)).toHaveLength(2);
    expect(src.match(/aria-invalid=\{failed \|\| undefined\}/g)).toHaveLength(2);
    expect(src).toMatch(/\{portal\.kind === "error" && \(\s*<p role="alert"/);
    const pdf = readFileSync(new URL("../book/pdf-download.tsx", import.meta.url), "utf8");
    expect(pdf).toMatch(/\{state === "error" && \(\s*<span role="alert"/);
  });
});

describe("a Pro owner opening /pro#restore", () => {
  it("is told Pro is already on here, where the plans begin", () => {
    // The prerendered unlock form is the jump target, and hydration removes it
    // for an owner, who was left under the plans with nothing about restoring.
    const src = readFileSync(new URL("./pro-client.tsx", import.meta.url), "utf8");
    expect(src).toContain('if (window.location.hash !== "#restore" || !getProState().active) return;');
    expect(src).toContain("Pro is already unlocked in this browser");
    expect(src).toContain("{alreadyUnlocked && pro.active && !justUpgraded && (");
  });
});
