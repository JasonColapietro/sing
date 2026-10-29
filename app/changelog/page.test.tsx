import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import ChangelogPage from "./page";
import { PRICING, formatPrice } from "@/lib/pro-shared";

const html = renderToStaticMarkup(<ChangelogPage />);
const text = html.replace(/<[^>]+>/g, "").replace(/&#x27;|&apos;/g, "'");

describe("/changelog", () => {
  it("sends its priced ask to the buy card, behind the not-pro pre-paint marker", () => {
    const price = formatPrice(PRICING.lifetime.amount);
    const button = html.match(/<a[^>]*href="\/pro#buy"[^>]*>([^<]*)<\/a>/);
    expect(button?.[1]).toBe(`Go Pro: ${price} once`);
    // The only plain /pro links are release notes about the Pro page itself,
    // and none of them carries the price.
    const plain = [...html.matchAll(/<a[^>]*href="\/pro"[^>]*>([^<]*)<\/a>/g)].map((m) => m[1]);
    expect(plain).toEqual(["See what Pro adds"]);
    expect(plain.join(" ")).not.toContain(price);
    // The box sits inside NotPro, so a Pro owner never sees the price.
    const box = html.lastIndexOf("data-prepaint-plan=", html.indexOf('href="/pro#buy"'));
    expect(box).toBeGreaterThan(-1);
    expect(html.slice(box)).toMatch(/^data-prepaint-plan="not-pro"/);
  });

  it("describes no-range song scoring in the binding words", () => {
    expect(text).toContain(
      "Without a saved range, a song opens in the written key and is scored in either octave",
    );
  });
});
