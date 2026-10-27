import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/og", () => ({
  ImageResponse: class {
    constructor(public element: ReactNode) {}
  },
}));

import ProImage, { alt, contentType, generateImageMetadata, size } from "./opengraph-image";
import { metadata } from "./page";
import { OG_IMAGE_SIZE } from "@/lib/og";
import { PRICING, formatPrice, proHeadline } from "@/lib/pro-shared";

function drawn(): string {
  const result = ProImage() as unknown as { element: ReactNode };
  return renderToStaticMarkup(<>{result.element}</>);
}

/**
 * /pro shared with the sitewide card and its homepage alt text ("online
 * singing practice with live pitch feedback"), which says nothing about the
 * paid tier a shared /pro link is about.
 */
describe("/pro share card", () => {
  it("describes Pro and states the lifetime price from PRICING", () => {
    const price = formatPrice(PRICING.lifetime.amount);
    expect(alt).toMatch(/^Suede Pro: /);
    expect(alt).toContain("online vocal coach");
    expect(alt).toContain("free Suede Sing studio");
    expect(alt).toContain(`${price} once for lifetime access`);
    // The price is written once, in lib/pro-shared.ts; never a literal here.
    const src = readFileSync(path.join(__dirname, "opengraph-image.tsx"), "utf8");
    expect(src).not.toMatch(/\b79\b/);
  });

  it("draws the title, the price line and the feature line", () => {
    const html = drawn();
    expect(html).toContain("Suede Pro");
    expect(html).toContain(proHeadline());
    expect(html).toContain("Full coach plan, per-note accuracy, take analysis, two books");
  });

  it("is the sitewide card's size and type", () => {
    expect(size).toEqual(OG_IMAGE_SIZE);
    expect(contentType).toBe("image/png");
  });

  it("puts a version read off its words into the URL path", () => {
    const [meta, ...rest] = generateImageMetadata();
    expect(rest).toHaveLength(0);
    expect(meta).toEqual({
      id: expect.stringMatching(/^[0-9a-z]+$/),
      alt,
      size,
      contentType,
    });
  });

  it("is the card /pro ships: the page names no other image", () => {
    // withCanonicalOpenGraph injects the sitewide card into a route with no
    // openGraph of its own, and Next attaches a file-convention card only
    // when the route's openGraph declares no `images`.
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.openGraph).not.toHaveProperty("images");
  });
});
