import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FamousVoices } from "@/components/landing/famous-voices";

describe("homepage famous voices", () => {
  it.each([
    ["Olivia Rodrigo", "olivia-rodrigo"],
    ["Reba McEntire", "reba-mcentire"],
    ["Alex Warren", "alex-warren"],
    ["Sam Smith", "sam-smith"],
    ["Arijit Singh", "arijit-singh"],
  ])("links the %s opportunity page from descriptive homepage context", (name, slug) => {
    const html = renderToStaticMarkup(<FamousVoices />);

    expect(html).toContain(`href="/singers/${slug}"`);
    expect(html).toContain(`>${name}<`);
  });
});
