import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { HONORED_LIFETIME_CENTS, PRICING } from "./pro-shared";

/**
 * The price lives in three places, and only one of them is type-checked.
 *
 * `scripts/stripe-setup.mjs` decides what Stripe is asked to charge, and
 * `scripts/pro-key.mjs` decides which past purchases the support tool calls
 * entitled. Both are plain node with no build step: `next build` only compiles
 * what the app graph reaches, `tsc --noEmit` does not read `.mjs`, and lint
 * has nothing to say about an integer. So a repricing that updates PRICING and
 * forgets a script fails silently — checkout refuses every session, or a
 * purchaser is told their real payment does not entitle them — and nothing in
 * CI notices.
 *
 * Reading the sources as text is the only gate available: importing either one
 * runs it, and both call Stripe at module scope.
 */

function scriptSource(name: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../scripts/${name}`, import.meta.url)),
    "utf8",
  );
}

/** The `unitAmount:` literal stripe-setup.mjs will create the plan at. */
function setupAmountFor(plan: string): number {
  const source = scriptSource("stripe-setup.mjs");
  const block = source.match(
    new RegExp(`key:\\s*"${plan}"[\\s\\S]*?unitAmount:\\s*(\\d+)`),
  );
  expect(block, `no unitAmount for the ${plan} plan`).not.toBeNull();
  return Number(block?.[1]);
}

describe("scripts/stripe-setup.mjs", () => {
  it("asks Stripe for exactly the amounts /pro quotes", () => {
    for (const plan of ["monthly", "lifetime"] as const) {
      expect(setupAmountFor(plan), `${plan} price`).toBe(
        Math.round(PRICING[plan].amount * 100),
      );
    }
  });
});

describe("scripts/pro-key.mjs", () => {
  const honored = scriptSource("pro-key.mjs").match(
    /HONORED_LIFETIME_CENTS\s*=\s*\[([^\]]*)\]/,
  );

  it("honors the same past lifetime prices the app does", () => {
    expect(honored, "no HONORED_LIFETIME_CENTS literal").not.toBeNull();
    const cents = (honored?.[1] ?? "")
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((value) => Number.isFinite(value));

    expect([...cents].sort()).toEqual([...HONORED_LIFETIME_CENTS].sort());
  });
});

describe("HONORED_LIFETIME_CENTS", () => {
  it("unlocks the price on sale today", () => {
    expect(HONORED_LIFETIME_CENTS).toContain(
      Math.round(PRICING.lifetime.amount * 100),
    );
  });

  /**
   * The whole point of the list. A lifetime purchase cannot be re-billed, so
   * dropping a retired amount revokes access that was paid for outright.
   */
  it("still unlocks the $79 launch price after the drop to $59", () => {
    expect(HONORED_LIFETIME_CENTS).toContain(7900);
  });
});
