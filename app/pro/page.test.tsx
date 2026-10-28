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
    // One name for the paid tier: the page, its OG card and llms.txt all say
    // "Suede Pro"; this node used to say "Suede Sing Pro".
    expect(app?.name).toBe("Suede Pro");
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
        "Sold out. Existing subscribers keep renewing at the price they signed up at.",
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

describe("/pro structured data references", () => {
  it("defines every node its isPartOf pointers name, so each resolves on this page alone", () => {
    const data = jsonLdFrom(renderToStaticMarkup(<ProPage />));
    const ids = new Set(data["@graph"].map((node) => node["@id"]));
    const pointers = data["@graph"].flatMap((node) => {
      const ref = node.isPartOf as { "@id"?: string } | undefined;
      return ref?.["@id"] ? [ref["@id"]] : [];
    });
    // The page, the paid tier and the FAQ each point at something.
    expect(pointers.length).toBeGreaterThanOrEqual(3);
    for (const id of pointers) expect(ids, id).toContain(id);
    // Both site-level nodes carry the homepage's @ids and names.
    const site = data["@graph"].find((n) => n["@id"] === "https://sing.suedeai.ai/#website");
    const app = data["@graph"].find((n) => n["@id"] === "https://sing.suedeai.ai/#app");
    expect(site).toMatchObject({ "@type": "WebSite", name: "Suede Sing" });
    expect(app).toMatchObject({
      "@type": "WebApplication",
      name: "Suede Sing",
      applicationCategory: "EducationalApplication",
    });
  });
});

describe("homepage Pro teaser", () => {
  it("states the lifetime price, and leaves the sold-out monthly plan to /pro", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("Go Pro: $79 once");
    expect(html).toContain('href="/pro#buy"');
    // The first pricing fact a visitor reads is the price, never that
    // something sold out; the monthly plan and the renewal terms are /pro's.
    expect(html).not.toMatch(/sold out/i);
    expect(html).not.toContain("Never renews");
    expect(html).not.toContain("Cancel in one click");
    // Once on the page: the teaser button; the footer carries the other priced anchor.
    expect(html.match(/\$79 once/g)).toHaveLength(2);
  });
});
