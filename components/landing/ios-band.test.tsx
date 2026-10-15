/**
 * Restoring the original app band must keep current product boundaries:
 * browser practice has a shared daily allowance, register analysis belongs
 * to the iPhone companion, and the band must not revive diagnostic claims.
 * Assertions run against the rendered prose a visitor actually sees.
 */
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IosBand } from "./ios-band";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";

/** Rendered markup with tags stripped, so assertions read the prose a visitor reads. */
const prose = renderToStaticMarkup(<IosBand />)
  .replace(/<[^>]+>/g, " ")
  .replace(/&#x27;|&apos;/g, "'")
  .replace(/&amp;/g, "&")
  .replace(/\s+/g, " ")
  .trim();

describe("the iOS band", () => {
  it("attributes register analysis to the iPhone companion", () => {
    expect(prose).toMatch(/iPhone app adds register analysis/i);
    expect(prose).toMatch(/features and purchase options can differ between platforms/i);
  });

  it("keeps the browser studio's own capabilities to what it measures", () => {
    expect(prose).toMatch(/web studio gives you live pitch and range testing with no daily clock/i);
    expect(prose).toContain(`${FREE_DAILY_MINUTES} free minutes of guided practice a day`);
  });

  it("does not revive clinical, fixed-threshold or unsupported passaggio claims", () => {
    expect(prose).not.toMatch(/clinical|H1|cepstral|[+]6 dB|exit frequency|entry and exit|TonePrint/i);
  });
});

describe("the Android claim", () => {
  /**
   * The band read "the optional iPhone and Android companion" until 2026-08-26.
   * There was no Play Store listing behind it — details?id=ai.suedeai.suedevoice
   * returned 404 while com.spotify.music returned 200 from the same client, so
   * the absence was real rather than Google refusing the request. Android is
   * built, signed and R8-verified in the suede-voice repo, but step 3 of its
   * own release checklist ("Create the app in Play Console") had not been run.
   *
   * This guard is written to retire itself: it only forbids the claim while
   * lib/app-store.ts has no Play Store URL in it. Ship the listing, add the
   * constant, and the band is free to name Android again.
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

  it("still points somewhere real for the companion it does name", () => {
    expect(renderToStaticMarkup(<IosBand />)).toMatch(/apps\.apple\.com/);
  });
});
