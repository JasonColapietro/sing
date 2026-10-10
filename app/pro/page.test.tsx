import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import Home from "@/app/page";
import ProPage from "./page";

function jsonLdFrom(html: string) {
  const match = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );
  expect(match, "missing pricing JSON-LD").not.toBeNull();
  return JSON.parse(match?.[1] ?? "null") as {
    "@graph": Array<Record<string, unknown>>;
  };
}

describe("/pro Early Access offers", () => {
  it("server-renders lifetime as the offer and monthly as sold out, without an annual offer", () => {
    const html = renderToStaticMarkup(<ProPage />);

    expect(html).toContain("$4.99");
    expect(html).toContain("$79");
    expect(html).toContain("Early Access");
    expect(html).not.toMatch(/\b(?:annual|yearly)\b/i);
  });

  it("marks monthly SoldOut and lifetime InStock as a one-time purchase", () => {
    const data = jsonLdFrom(renderToStaticMarkup(<ProPage />));
    const app = data["@graph"].find((node) =>
      String(node["@id"]).endsWith("/pro#product"),
    );
    // SoftwareApplication, never Product — a Product node enrols the page in
    // Google's Merchant listings report, which demands shipping fields that
    // do not exist for a subscription.
    expect(app?.["@type"]).toBe("SoftwareApplication");
    const offers = app?.offers as Array<{
      name: string;
      price: string;
      description: string;
      priceSpecification: {
        "@type": string;
        referenceQuantity?: { unitCode: string };
      };
    }>;

    expect(offers).toHaveLength(2);
    expect(offers.map((offer) => offer.name)).toEqual([
      "Suede Pro monthly",
      "Suede Pro lifetime access",
    ]);
    expect(offers[0]).toMatchObject({
      price: "4.99",
      availability: "https://schema.org/SoldOut",
      description:
        "Sold out. Renews monthly at $4.99 for existing subscribers only.",
      priceSpecification: {
        referenceQuantity: { unitCode: "MON" },
      },
    });
    expect(offers[1]).toMatchObject({
      price: "79.00",
      availability: "https://schema.org/InStock",
      description: "One payment for lifetime access. No renewal.",
      priceSpecification: { "@type": "PriceSpecification" },
    });
    expect(offers[1].priceSpecification.referenceQuantity).toBeUndefined();
    expect(JSON.stringify(offers)).not.toMatch(/annual|yearly|ANN/i);
    expect(JSON.stringify(offers)).not.toContain("—");
  });
});

describe("homepage Pro teaser", () => {
  it("states the lifetime price and that monthly is sold out", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("Early Access: $79 once for lifetime access");
    expect(html).toContain("Monthly ($4.99/mo): sold out");
    expect(html).toContain("Existing subscribers keep their price");
    expect(html).toContain("Lifetime never renews");
    expect(html).not.toContain("Cancel in one click");
  });
});
