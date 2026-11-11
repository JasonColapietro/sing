/**
 * The app strip must keep current product boundaries: browser practice has a
 * shared daily allowance, register analysis belongs to the iPhone companion,
 * and the strip must not revive diagnostic claims. Assertions run against the
 * rendered prose a visitor actually sees.
 */
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PLAY_STORE_URL } from "@/lib/app-store";
import { IosBand } from "./ios-band";

const html = renderToStaticMarkup(<IosBand />);

/** Rendered markup with tags stripped, so assertions read the prose a visitor reads. */
const prose = html
  .replace(/<[^>]+>/g, " ")
  .replace(/&#x27;|&apos;/g, "'")
  .replace(/&amp;/g, "&")
  .replace(/\s+/g, " ")
  .trim();

describe("the iOS strip", () => {
  it("attributes register analysis to the iPhone companion", () => {
    expect(prose).toMatch(/iPhone app adds register analysis/i);
  });

  it("leaves the platform disclaimer to /voice", () => {
    expect(prose).not.toMatch(/features and purchase options can differ/i);
    expect(html).toContain('href="/voice"');
  });

  it("keeps the browser studio's own capabilities to what it measures", () => {
    expect(prose).toMatch(/web studio gives you live pitch and range testing with no daily clock/i);
    // The free plan's daily minutes are stated once, in the hero.
    expect(prose).not.toContain("free minutes of guided practice a day");
  });

  it("shows one product image of this site's own room, on paper", () => {
    expect(html).toMatch(/room-range\.png/);
    expect(html).not.toMatch(/shot-0\d/);
    expect(html).toMatch(/<figure class="figure /);
    expect(html.match(/<img /g)).toHaveLength(2); // the room and the badge
  });

  it("does not revive clinical, fixed-threshold or unsupported passaggio claims", () => {
    expect(prose).not.toMatch(/clinical|H1|cepstral|[+]6 dB|exit frequency|entry and exit|TonePrint/i);
  });
});

describe("the Android claim", () => {
  /**
   * Android is publicly listed on Google Play. Keep the homepage heading and
   * direct install link aligned with the platform named in the app schema.
   */
  const appStoreSource = readFileSync(
    new URL("../../lib/app-store.ts", import.meta.url),
    "utf8",
  );
  const hasPlayListing = /play\.google\.com/.test(appStoreSource);

  it("names Android only once a Play Store listing exists to back it", () => {
    if (hasPlayListing) {
      expect(prose).toMatch(/Android/i);
      return;
    }
    expect(prose).not.toMatch(/Android/i);
  });

  it("gives Android a heading and a direct install link", () => {
    expect(html).toMatch(/<h2[^>]*>Singing app for iPhone and Android:/);
    expect(html).toContain(`href="${PLAY_STORE_URL}"`);
  });

  it("still points somewhere real for the companion it does name", () => {
    expect(html).toMatch(/apps\.apple\.com/);
  });
});
