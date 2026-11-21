/**
 * The buy bar that follows a free visitor down /pro. It mounts from an
 * effect, so in a static render it is always absent; the rule that shows it
 * and the states the page allows it in are tested directly.
 */
import { readFileSync } from "node:fs";
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

const { BuyBar, buyBarVisible } = await vi.importActual<typeof import("./buy-bar")>("./buy-bar");

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

describe("when the buy bar shows", () => {
  it("needs the page's leave, a first observation, and no buy button on screen", () => {
    expect(buyBarVisible(true, 0)).toBe(true);
    // Not yet observed is not "none on screen".
    expect(buyBarVisible(true, null)).toBe(false);
    expect(buyBarVisible(true, 1)).toBe(false);
    expect(buyBarVisible(true, 3)).toBe(false);
    expect(buyBarVisible(false, 0)).toBe(false);
  });

  it("is never in the server HTML, whatever the page allows", () => {
    const html = renderToStaticMarkup(
      <BuyBar enabled label="Get lifetime Pro" busy={false} error={null} onBuy={() => {}} watchKey="" />,
    );
    expect(html).toBe("");
  });

  it("watches every buy button on the page: hero, showcase, card and final call to action", () => {
    const html = renderToStaticMarkup(<ProClient />);
    const anchors = html.match(/<(?:button|div)[^>]*data-buy-anchor=""[^>]*>/g) ?? [];
    expect(anchors).toHaveLength(4);
    expect(anchors.filter((tag) => tag.startsWith("<button"))).toHaveLength(3);
    expect(anchors.some((tag) => tag.includes('id="buy"'))).toBe(true);
    // The card's own button sits inside the watched card.
    expect(html.match(/>Get lifetime Pro: \$79 once<\/button>/g)).toHaveLength(4);
  });
});

describe("who the page lets the buy bar follow", () => {
  it("a free visitor, with the price read from PRICING", () => {
    const props = barFor(state());
    expect(props.enabled).toBe(true);
    expect(props.label).toBe(`Get lifetime Pro: ${formatPrice(PRICING.lifetime.amount)} once`);
    expect(props.busy).toBe(false);
    expect(props.error).toBeNull();
    const source = readFileSync(new URL("./buy-bar.tsx", import.meta.url), "utf8");
    expect(source).not.toMatch(/\$\d/);
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
    const source = readFileSync(new URL("./pro-client.tsx", import.meta.url), "utf8");
    const call = source.slice(source.indexOf("<BuyBar"), source.indexOf("/>", source.indexOf("<BuyBar")));
    for (const guard of ["showPurchaseOptions", "!pro.active", "!paidButUnconfirmed", "!justUpgraded", 'checkout.kind !== "working"']) {
      expect(call, guard).toContain(guard);
    }
    expect(call).toContain('onBuy={() => goPro("bar")}');
  });
});

describe("the buy bar's manners", () => {
  const source = readFileSync(new URL("./buy-bar.tsx", import.meta.url), "utf8");

  it("clears the home indicator and pads the page so it covers no last line", () => {
    expect(source).toContain("pb-[env(safe-area-inset-bottom)]");
    expect(source).toContain("body.style.paddingBottom = PAGE_PAD");
    expect(source).toContain("body.style.paddingBottom = before");
  });

  it("animates in only where motion is welcome, and sits under the header and dialogs", () => {
    expect(source).toContain("motion-safe:animate-fadeup");
    expect(source).not.toMatch(/[^:]animate-fadeup/);
    expect(source).toMatch(/fixed inset-x-0 bottom-0 z-40/);
    expect(source).not.toContain("backdrop-blur");
  });

  it("stays focusable while busy, like the page's other buy buttons", () => {
    expect(source).toContain("aria-disabled={busy || undefined}");
    expect(source).not.toMatch(/\sdisabled=/);
  });
});
