import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ pathname: "/learn" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("@/lib/use-account-auth", () => ({
  useAccountAuth: () => ({ isLoaded: false, isSignedIn: false }),
}));

import Nav from "./nav";

describe("main navigation current location", () => {
  it.each([
    ["/", "/", "page"],
    ["/range", "/range", "page"],
    ["/learn/voice", "/warmups", "location"],
    ["/glossary/tessitura", "/warmups", "location"],
    ["/singers/olivia-rodrigo", "/songs", "location"],
    ["/recorder", "/range", "location"],
  ])("announces %s through the correct navigation link", (pathname, href, current) => {
    route.pathname = pathname;
    const html = renderToStaticMarkup(<Nav />);
    const links = html.match(/<a\b[^>]*aria-current="[^"]+"[^>]*>/g) ?? [];
    expect(links).toHaveLength(1);
    expect(links[0]).toContain(`href="${href}"`);
    expect(links[0]).toContain(`aria-current="${current}"`);
  });

  it("does not claim an unrelated prefix is a current destination", () => {
    route.pathname = "/learning";
    expect(renderToStaticMarkup(<Nav />)).not.toContain("aria-current=");
  });

  it("gives every desktop tab a 44px touch target", () => {
    const html = renderToStaticMarkup(<Nav />);
    const main = html.match(/<nav aria-label="Main"[^>]*>(.*?)<\/nav>/)?.[1] ?? "";
    const links = main.match(/<a\b[^>]*>/g) ?? [];
    expect(links).toHaveLength(5);
    for (const link of links) expect(link).toContain("min-h-11");
  });
});
