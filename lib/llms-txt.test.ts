/**
 * llms.txt guard.
 *
 * sing.suedeai.ai is the brand's canonical home, but until this file existed
 * the only llms.txt lived on the legacy print.suedeai.ai domain — an answer
 * engine resolving "Suede Sing Chrome extension" against the canonical host
 * found a 404. The file is a static asset, so nothing in the build fails if it
 * is deleted or if the store URL inside it rots; this test is what fails.
 *
 * The extension page is the other place the Web Store URL is hard-coded. The
 * two are asserted against the same literal so they cannot silently diverge —
 * if the store ID ever changes, both files and this test must move together.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { APP_NAME } from "./app-store";
import { SINGERS } from "./singers-data";

const STORE_URL =
  "https://chromewebstore.google.com/detail/dbimnmcokgmibdenmonoafhmdbjhpicd";

const llms = readFileSync(
  new URL("../public/llms.txt", import.meta.url),
  "utf8",
);

describe("public/llms.txt", () => {
  it("resolves the Chrome extension to the real Web Store listing", () => {
    expect(llms).toContain(STORE_URL);
    expect(llms).toContain("https://sing.suedeai.ai/extension");
  });

  it("speaks for the canonical host", () => {
    expect(llms).toContain("https://sing.suedeai.ai");
    expect(llms.startsWith("# Suede Sing")).toBe(true);
  });

  it("uses the same store URL as the extension page", () => {
    const page = readFileSync(
      new URL("../app/extension/page.tsx", import.meta.url),
      "utf8",
    );
    expect(page).toContain(STORE_URL);
  });
});

describe("public/llms.txt singers layer", () => {
  /**
   * The singers directory carries essentially all of this site's non-branded
   * search demand, and until now llms.txt gave it one line — so an answer
   * engine resolving "what is X's vocal range" found the product, not the
   * reference layer. These assertions keep that layer present AND keep the
   * numbers in it tied to the dataset, so adding singers cannot silently
   * leave a stale count published to every model that reads the file.
   */
  it("routes the question shapes people actually ask", () => {
    expect(llms).toContain("https://sing.suedeai.ai/singers");
    expect(llms).toContain("/singers/voice-type/");
    expect(llms).toContain("/singers/records");
    expect(llms).toMatch(/vocal range\?/i);
    expect(llms).toMatch(/voice type/i);
  });

  it("publishes the real singer count", () => {
    expect(llms).toContain(`${SINGERS.length} singer profiles`);
  });

  it("publishes voice-type counts that match the data", () => {
    const counts = new Map<string, number>();
    for (const s of SINGERS) {
      counts.set(s.voiceType, (counts.get(s.voiceType) ?? 0) + 1);
    }
    // The coverage line names each category with its live total.
    const line = llms
      .split("\n")
      .find((l) => l.startsWith("- Voice-type coverage"));
    expect(line).toBeDefined();
    for (const [voice, n] of counts) {
      expect(line).toContain(`${voice} ${n}`);
    }
  });

  it("keeps the ranges honestly characterised", () => {
    // The data file itself says these are cited figures, not measurements.
    // If llms.txt ever drops that framing, models will quote them as clinical.
    expect(llms).toMatch(/not laboratory measurements|approximate/i);
    const sourced = SINGERS.filter((s) => s.lowSource || s.highSource).length;
    expect(llms).toContain(`${sourced} profiles carry an explicit citation`);
  });
});

describe("public/llms.txt iPhone app name", () => {
  /**
   * lib/app-store.ts has been the single source for the app's name since it was
   * written ("say 'Suede Voice' whenever the copy means the app"). llms.txt and
   * app/extension/page.tsx both bypassed it and hardcoded "Suede Sing: Vocal
   * Coach" — a name that does not exist on the App Store. `itunes lookup
   * id6767763231` returns "Suede Voice: Vocal Range Test" (v1.5, 2026-08-15),
   * and llms.txt went further and declared the live name a retired one.
   *
   * That is worse in llms.txt than anywhere else: it is the file answer engines
   * read to learn what to call things, so the wrong name propagates as fact.
   */
  it("uses the name lib/app-store.ts publishes", () => {
    expect(llms).toContain(APP_NAME);
  });

  it("never revives the name that is not on the App Store", () => {
    expect(llms).not.toContain("Suede Sing: Vocal Coach,");
    expect(llms).not.toMatch(/iPhone app: Suede Sing/);
  });

  it("does not describe the live app name as retired", () => {
    // The old line said "Suede Voice ... were earlier working names".
    expect(llms).not.toMatch(
      /"Suede Voice"[^\n]*earlier working name/i,
    );
  });

  it("keeps the extension page on the same source", () => {
    const page = readFileSync(
      new URL("../app/extension/page.tsx", import.meta.url),
      "utf8",
    );
    expect(page).toContain('from "@/lib/app-store"');
    expect(page).not.toMatch(/>\s*Suede Sing: Vocal Coach\s*</);
  });
});
