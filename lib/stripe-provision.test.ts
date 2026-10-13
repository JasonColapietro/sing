import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PRO_SONGS } from "@/components/songs/data";

const api = vi.hoisted(() => ({
  pricesList: vi.fn(),
  pricesCreate: vi.fn(),
  productsSearch: vi.fn(),
  productsCreate: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("stripe", () => ({
  default: class {
    prices = { list: api.pricesList, create: api.pricesCreate };
    products = { search: api.productsSearch, create: api.productsCreate };
  },
}));

process.env.STRIPE_SECRET_KEY = "sk_test_provision";
const { resolvePriceId, PriceMismatchError, PriceNotConfiguredError, PRODUCT_DESCRIPTION } =
  await import("./stripe");

const monthlyPrice = {
  id: "price_new_monthly",
  active: true,
  currency: "usd",
  unit_amount: 499,
  recurring: { interval: "month" },
  product: "prod_existing",
};

beforeEach(() => {
  delete process.env.STRIPE_PRICE_MONTHLY;
  delete process.env.STRIPE_PRICE_LIFETIME;
  api.pricesList.mockReset();
  api.pricesCreate.mockReset();
  api.productsSearch.mockReset().mockResolvedValue({ data: [] });
  api.productsCreate.mockReset();
});

describe("resolvePriceId provisioning", () => {
  it("creates a missing monthly price on the existing product at the quoted amount", async () => {
    api.pricesList.mockImplementation(async ({ lookup_keys, active }) =>
      // The sellable key is absent; a legacy key still points at the product.
      lookup_keys[0] === "suede_pro_monthly" && active === undefined
        ? { data: [{ product: "prod_existing" }] }
        : { data: [] },
    );
    api.pricesCreate.mockResolvedValue(monthlyPrice);

    await expect(resolvePriceId("monthly")).resolves.toBe("price_new_monthly");
    expect(api.pricesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        product: "prod_existing",
        currency: "usd",
        unit_amount: 499,
        recurring: { interval: "month" },
        lookup_key: "suede_pro_monthly_early_access",
        transfer_lookup_key: true,
      }),
    );
    expect(api.productsCreate).not.toHaveBeenCalled();
  });

  it("creates a one-time lifetime price and the product when the account is empty", async () => {
    api.pricesList.mockResolvedValue({ data: [] });
    api.productsCreate.mockResolvedValue({ id: "prod_new" });
    api.pricesCreate.mockResolvedValue({
      id: "price_new_lifetime",
      active: true,
      currency: "usd",
      unit_amount: 7900,
      recurring: null,
      product: "prod_new",
    });

    await expect(resolvePriceId("lifetime")).resolves.toBe("price_new_lifetime");
    const args = api.pricesCreate.mock.calls[0][0];
    expect(args).toMatchObject({ product: "prod_new", unit_amount: 7900 });
    expect(args).not.toHaveProperty("recurring");
  });

  it("does not create anything when an active price already exists", async () => {
    api.pricesList.mockResolvedValue({ data: [monthlyPrice] });
    await expect(resolvePriceId("monthly")).resolves.toBe("price_new_monthly");
    expect(api.pricesCreate).not.toHaveBeenCalled();
  });

  it("still refuses an existing price at the wrong amount", async () => {
    api.pricesList.mockResolvedValue({
      data: [{ ...monthlyPrice, unit_amount: 999 }],
    });
    await expect(resolvePriceId("monthly")).rejects.toBeInstanceOf(
      PriceMismatchError,
    );
    expect(api.pricesCreate).not.toHaveBeenCalled();
  });

  it("reports not-configured when Stripe rejects the create", async () => {
    api.pricesList.mockResolvedValue({ data: [] });
    api.productsCreate.mockResolvedValue({ id: "prod_new" });
    api.pricesCreate.mockRejectedValue(new Error("restricted key"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(resolvePriceId("monthly")).rejects.toBeInstanceOf(
      PriceNotConfiguredError,
    );
  });
});

describe("the product description shown at checkout", () => {
  it("is the one the product is created with", async () => {
    api.pricesList.mockResolvedValue({ data: [] });
    api.productsCreate.mockResolvedValue({ id: "prod_new" });
    api.pricesCreate.mockResolvedValue({
      id: "price_new_lifetime",
      active: true,
      currency: "usd",
      unit_amount: 7900,
      recurring: null,
      product: "prod_new",
    });
    await resolvePriceId("lifetime");
    expect(api.productsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Suede Pro", description: PRODUCT_DESCRIPTION }),
    );
  });

  it("matches scripts/stripe-setup.mjs word for word", () => {
    const script = readFileSync(join(process.cwd(), "scripts/stripe-setup.mjs"), "utf8");
    const quoted = /const PRODUCT_DESCRIPTION =\s*"([^"]+)";/.exec(script)?.[1];
    expect(quoted).toBe(PRODUCT_DESCRIPTION);
  });

  it("sells the full plan, not planning itself, and no songbook", () => {
    // The free plan shows the coach plan's first two steps each day, as /pro
    // says, so planning is not something only Pro has.
    expect(PRODUCT_DESCRIPTION).toContain("the full adaptive daily plan (free shows its first two steps)");
    expect(PRODUCT_DESCRIPTION).not.toMatch(/adaptive daily plans/i);
    // Every song is free, so a buyer is not sold one.
    expect(PRO_SONGS).toHaveLength(0);
    expect(PRODUCT_DESCRIPTION).not.toMatch(/songbook|songs/i);
  });
});
