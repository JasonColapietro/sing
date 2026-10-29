import { describe, expect, it } from "vitest";
import { OG_MONO, OG_SERIF, ogFontOptions, parseFontFaces } from "./og-font";

const CSS = `@font-face {
  font-family: 'IBM Plex Mono';
  font-style: normal;
  font-weight: 600;
  src: url(https://fonts.gstatic.com/l/font?kit=mono600) format('truetype');
}
@font-face {
  font-family: 'Instrument Serif';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/l/font?kit=serif) format('truetype');
}
@font-face {
  font-family: 'Instrument Serif';
  src: url(https://fonts.gstatic.com/s/serif.woff2) format('woff2');
}`;

describe("share-card fonts", () => {
  it("reads each TTF face's family, weight and URL, and skips formats next/og cannot draw", () => {
    expect(parseFontFaces(CSS)).toEqual([
      { family: OG_MONO, weight: 600, url: "https://fonts.gstatic.com/l/font?kit=mono600" },
      { family: OG_SERIF, weight: 400, url: "https://fonts.gstatic.com/l/font?kit=serif" },
    ]);
  });

  it("falls back to next/og's default face, with no fonts option, when the faces are unavailable", async () => {
    // Under vitest the loader never reaches the network, the same path a
    // failed or slow fetch takes in production.
    await expect(ogFontOptions("Suede Sing")).resolves.toEqual({});
  });
});
