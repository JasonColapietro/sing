import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PRICING, formatPrice } from "@/lib/pro-shared";
import { rangeTestHref } from "@/lib/site";
import NotFound from "./not-found";

const html = renderToStaticMarkup(<NotFound />);
const text = html.replace(/<[^>]+>/g, "").replace(/&#x27;|&apos;/g, "'");

/** The opening tag of the first anchor pointing at `href`. */
function anchor(href: string): string {
  const tag = html.match(new RegExp(`<a[^>]*href="${href.replace(/[?#]/g, "\\$&")}"[^>]*>`))?.[0];
  if (!tag) throw new Error(`no link to ${href}`);
  return tag;
}

describe("404 page", () => {
  it("does not repeat the page title in the box below it", () => {
    expect(text).toContain("That page isn't here");
    expect(text).toContain("Try one of these");
    expect(text).not.toContain("Nothing at this address");
  });

  it("offers the range test first, then the song lookup and the studio as equals", () => {
    const order = [rangeTestHref(), "/can-you-sing", "/studio"].map((href) => html.indexOf(anchor(href)));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    for (const href of ["/can-you-sing", "/studio"]) {
      expect(anchor(href), href).toContain("border-field");
      expect(anchor(href), href).not.toContain("hover:bg-panel2");
    }
  });

  it("names Suede Pro once, in a quiet line below the practice links, with the price from the pricing code", () => {
    const price = formatPrice(PRICING.lifetime.amount);
    expect(text).toContain(`Or see what Suede Pro adds, ${price} once.`);
    expect(html).toMatch(/<a[^>]*href="\/pro#buy"[^>]*>what Suede Pro adds<\/a>/);
    expect(html.indexOf('href="/pro#buy"')).toBeGreaterThan(html.indexOf(anchor("/studio")));
    expect(html.match(/href="\/pro(#buy)?"/g)).toHaveLength(1);
  });

  it("has no em dash in its visible text", () => {
    expect(text).not.toContain("—");
  });
});
