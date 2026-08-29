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
  it("server-renders monthly and lifetime prices without an annual offer", () => {
    const html = renderToStaticMarkup(<ProPage />);

    expect(html).toContain("$4.99");
    expect(html).toContain("$79");
    expect(html).toContain("Early Access");
    expect(html).not.toMatch(/\b(?:annual|yearly)\b/i);
  });

  it("marks monthly as recurring and lifetime as a one-time purchase", () => {
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
      description:
        "Renews monthly at $4.99. Keep that price while the subscription remains active. Cancel anytime.",
      priceSpecification: {
        referenceQuantity: { unitCode: "MON" },
      },
    });
    expect(offers[1]).toMatchObject({
      price: "79.00",
      description: "One payment for lifetime access. No renewal.",
      priceSpecification: { "@type": "PriceSpecification" },
    });
    expect(offers[1].priceSpecification.referenceQuantity).toBeUndefined();
    expect(JSON.stringify(offers)).not.toMatch(/annual|yearly|ANN/i);
    expect(JSON.stringify(offers)).not.toContain("—");
  });
});

describe("homepage Pro teaser", () => {
  it("states both Early Access prices and the different billing shapes", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("Early Access: $4.99 a month or $79 once");
    expect(html).toContain(
      "The $4.99 monthly price stays while your subscription remains active",
    );
    expect(html).toContain("Monthly cancels anytime");
    expect(html).toContain("Lifetime never renews");
    expect(html).not.toContain("Cancel in one click");
  });
});
