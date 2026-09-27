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
    ["/learn", "/learn", "page"],
    ["/learn/voice", "/learn", "location"],
    ["/glossary/tessitura", "/learn", "location"],
    ["/singers/olivia-rodrigo", "/singers", "location"],
    ["/recorder", "/tools", "location"],
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
});
