/**
 * iOS-band claim guard.
 *
 * This band is the one place on the site that names spectral measurements —
 * H1−H2, passaggio, spectral tilt, CPP. None of them happen in the browser:
 * the studio measures pitch and range, and the register classifier ships only
 * in the native app. So the band has exactly two ways to go wrong, and both
 * have a test here.
 *
 * 1. The measures drift loose from the app that takes them, and a reader
 *    scanning the page reads them as things the free browser studio does.
 * 2. A measure describes more than the app actually reports. That is not
 *    hypothetical: this band claimed the passaggio was reported as "entry and
 *    exit frequency, both reported" until 2026-08-26. RangeAnalyzer.analyze
 *    walks the attempts in ascending pitch, takes the first note where
 *    confident chest gives way to mixed or falsetto, and `break`s — one
 *    Int?, no exit, no zone.
 *
 * Assertions run against the rendered HTML string rather than the MEASURES
 * array, mirroring components/discover/room-rail.test.tsx: the data being
 * right is not the failure mode, a reader seeing the wrong subject is.
 */
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IosBand } from "./ios-band";

/** Rendered markup with tags stripped, so assertions read the prose a visitor reads. */
const prose = renderToStaticMarkup(<IosBand />)
  .replace(/<[^>]+>/g, " ")
  .replace(/&#x27;|&apos;/g, "'")
  .replace(/&amp;/g, "&")
  .replace(/\s+/g, " ")
  .trim();

describe("the iOS band", () => {
  it("names the companion app as the subject of the spectral measures", () => {
    // Some sentence in the band has to hand these measurements to the app.
    // Without it the four <dt> terms read as a feature list for the free
    // browser studio sitting directly above them on the page.
    expect(prose).toMatch(/iPhone/);
    expect(prose).toMatch(/adds an analysis layer/i);
  });

  it("keeps the browser studio's own capabilities to what it measures", () => {
    expect(prose).toMatch(/web studio gives you live pitch, range and guided practice/i);
  });

  it("does not promise a passaggio entry/exit pair the app never reports", () => {
    // RangeAnalyzer.analyze returns `passaggioMIDI: Int?` — a single boundary.
    expect(prose).toMatch(/passaggio/i);
    expect(prose).not.toMatch(/exit frequency/i);
    expect(prose).not.toMatch(/entry and exit/i);
  });

  it("does not attribute any spectral measure to the browser or the extension", () => {
    // Each spectral term must not be introduced as something the browser does.
    for (const term of ["H1", "Spectral tilt", "Cepstral", "Passaggio"]) {
      expect(prose).toContain(term);
    }
    expect(prose).not.toMatch(/(browser|extension|web studio)[^.]*\b(H1|spectral tilt|cepstral|passaggio|classifies register)/i);
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
