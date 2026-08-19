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
