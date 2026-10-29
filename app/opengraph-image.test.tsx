import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/og", () => ({
  ImageResponse: class {
    constructor(
      public element: ReactNode,
      public options: Record<string, unknown>,
    ) {}
  },
}));

import Image from "./opengraph-image";
import { OG_IMAGE_SIZE, OG_IMAGE_TAGLINE } from "@/lib/og";

async function card() {
  return (await Image()) as unknown as { element: ReactNode; options: Record<string, unknown> };
}

describe("the sitewide share card", () => {
  it("sets the headline in Instrument Serif and the labels in the site's mono", async () => {
    const html = renderToStaticMarkup(<>{(await card()).element}</>);
    expect(html).toContain("font-family:Instrument Serif");
    expect(html).toContain("font-family:IBM Plex Mono");
    expect(html).toContain("Online singing practice");
    expect(html).toContain(OG_IMAGE_TAGLINE.replace("&", "&amp;"));
  });

  it("draws the settling trace, not a bar chart", async () => {
    const html = renderToStaticMarkup(<>{(await card()).element}</>);
    expect(html).toMatch(/<path d="M -20 260 C[^"]+L 1600 508"/);
    expect(html).toContain('stroke="#11615d"');
    expect(html).not.toContain("border-radius:8px");
  });

  it("draws at the shared size, and falls back to next/og's face when no font loads", async () => {
    const { options } = await card();
    expect(options).toMatchObject(OG_IMAGE_SIZE);
    // Under test the fetch is skipped, the same path a failed fetch takes.
    expect(options).not.toHaveProperty("fonts");
  });
});
