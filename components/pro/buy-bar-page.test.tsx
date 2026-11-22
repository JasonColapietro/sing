/**
 * What /pro gives the buy bar: who it may follow, the words on its button,
 * and the elements on the page it watches. The bar's own behaviour is in
 * buy-bar.test.tsx.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProState } from "@/lib/pro";

const proState = vi.hoisted(() => ({ current: null as unknown as ProState }));
const bar = vi.hoisted(() => ({ props: [] as Array<Record<string, unknown>> }));

vi.mock("@/lib/pro", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/pro")>();
  return { ...actual, useProState: () => proState.current };
});
vi.mock("./buy-bar", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./buy-bar")>();
  return {
    ...actual,
    BuyBar: (props: Record<string, unknown>) => {
      bar.props.push(props);
      return null;
    },
  };
});

import { formatPrice, PRICING } from "@/lib/pro-shared";
import { ProClient } from "./pro-client";

const { BuyBar, buyBarAllowed } = await vi.importActual<typeof import("./buy-bar")>("./buy-bar");

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

/** The props /pro hands the bar for an entitlement. */
function barFor(pro: ProState) {
  proState.current = pro;
  bar.props.length = 0;
  renderToStaticMarkup(<ProClient />);
  expect(bar.props).toHaveLength(1);
  return bar.props[0];
}

beforeEach(() => {
  proState.current = state();
});

describe("what the buy bar watches on /pro", () => {
  it("is never in the server HTML, whatever the page allows", () => {
    const html = renderToStaticMarkup(
      <BuyBar enabled label="Get lifetime Pro" busy={false} error={null} onBuy={() => {}} />,
    );
    expect(html).toBe("");
  });

  it("every buy button on the page: hero, card and final call to action", () => {
    const html = renderToStaticMarkup(<ProClient />);
    const anchors = html.match(/<[a-z]+[^>]*data-buy-anchor=""[^>]*>/g) ?? [];
    // Three: the hero's button, the card's button and the last section's
    // button. The showcase's button is gone (was a fourth), so nothing else
    // needs watching.
    expect(anchors).toHaveLength(3);
    // Every one a button: the card itself was the third anchor (changed: a
    // phone scrolled through its lower half with its button gone above and
    // the bar held back by the card), so the card's own button is now.
    expect(anchors.filter((tag) => tag.startsWith("<button"))).toHaveLength(3);
    expect(anchors.some((tag) => tag.includes('id="buy"'))).toBe(false);
    const button = /<button[^>]*data-buy-anchor=""[^>]*>Get lifetime Pro: \$79 once<\/button>/g;
    expect(html.match(button)).toHaveLength(3);
    // The card's button is inside #buy and the card carries no anchor.
    const card = html.slice(html.indexOf('id="buy"'), html.indexOf(">Before you pay</h3>"));
    expect(card.match(button)).toHaveLength(1);
    expect(html.match(/<div[^>]*id="buy"[^>]*>/)![0]).not.toContain("data-buy-anchor");
  });

  it("and the two forms it covered on a phone: the pass code and the Pro key", () => {
    const html = renderToStaticMarkup(<ProClient />);
    const forms = html.match(/<form[^>]*>/g) ?? [];
    expect(forms).toHaveLength(2);
    for (const form of forms) expect(form).toContain('data-bar-yield=""');
    expect(html.match(/data-bar-yield=""/g)).toHaveLength(2);
    // The key form is the one inside #restore.
    const restore = html.slice(html.indexOf('<details id="restore"'));
    expect(restore.slice(0, restore.indexOf("</details>"))).toContain('data-bar-yield=""');
  });
});

describe("who the page lets the buy bar follow", () => {
  it("a free visitor, with the price read from PRICING", () => {
    const props = barFor(state());
    expect(props.enabled).toBe(true);
    expect(props.label).toBe(`Get lifetime Pro: ${formatPrice(PRICING.lifetime.amount)} once`);
    expect(props.busy).toBe(false);
    expect(props.error).toBeNull();
    expect(Object.keys(props).sort()).toEqual(["busy", "enabled", "error", "label", "onBuy"]);
  });

  it("no owner, subscriber or pass holder", () => {
    expect(barFor(state({ active: true, plan: "lifetime", status: "active", paymentIntentId: "pi_1" })).enabled).toBe(false);
    expect(barFor(state({ active: true, plan: "monthly", status: "active", subscriptionId: "sub_1" })).enabled).toBe(false);
    // A subscriber whose plan is ending has Pro today.
    expect(barFor(state({ active: true, plan: "monthly", status: "active", subscriptionId: "sub_1", cancelAtPeriodEnd: true })).enabled).toBe(false);
    // A pass holder is offered lifetime on the card, and followed by nothing.
    expect(barFor(state({ active: true, plan: "monthly", status: "trialing", subscriptionId: "sub_pass" })).enabled).toBe(false);
  });

  it("nobody while a payment is being confirmed, is unconfirmed, or was just welcomed", () => {
    // The page's rule, which it calls with its own state (the entitlement
    // cases above go through it): each of these alone turns the bar off.
    const buying = { purchasable: true, proActive: false, paidButUnconfirmed: false, justUpgraded: false, confirming: false };
    expect(buyBarAllowed(buying)).toBe(true);
    for (const key of ["proActive", "paidButUnconfirmed", "justUpgraded", "confirming"] as const) {
      expect(buyBarAllowed({ ...buying, [key]: true }), key).toBe(false);
    }
    expect(buyBarAllowed({ ...buying, purchasable: false })).toBe(false);
  });
});
