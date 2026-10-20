/**
 * ProWhisper, the one-line "Free · Pro adds the coach" under the mic gates of
 * /recorder, /studio, /warmups and /songs.
 *
 * It used to render nothing until the entitlement cache had been read, so it
 * mounted after hydration and grew the gate around it by about 49px. On
 * /recorder at 1280 that moved the A/B card under the deck for every free
 * visitor (CLS 0.03). It is now in the server HTML behind the pre-paint
 * "not-pro" marker: the inline script hides it before the first paint for a
 * Pro singer, and from hydration on it renders from the real entitlement.
 */
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { paintedFor } from "@/components/prepaint.testing";
import { ProWhisper } from "./gate";

describe("ProWhisper before hydration", () => {
  const html = renderToStaticMarkup(
    <main>
      <ProWhisper className="mt-4" />
    </main>,
  );

  it("is in the server HTML, so a free singer's gate has its full height from the first paint", () => {
    expect(html).toContain("adds the coach");
    expect(html).toContain('href="/pro#plans"');
  });

  it("carries the not-pro marker, so the pre-paint state hides it from a Pro singer", () => {
    expect(html).toMatch(/<p [^>]*data-prepaint-plan="not-pro"/);
    expect(paintedFor(html, { plan: "pro" })).not.toContain("adds the coach");
    expect(paintedFor(html, { plan: "free" })).toContain("adds the coach");
    expect(paintedFor(html, { plan: "capped" })).toContain("adds the coach");
  });

  it("decides from the real entitlement once hydrated, and drops the marker", () => {
    const source = readFileSync(new URL("./gate.tsx", import.meta.url), "utf8");
    const body = source.slice(source.indexOf("export function ProWhisper"), source.indexOf("export function ProCrescendoNudge"));
    expect(body).toContain("if (hydrated && isPro) return null;");
    expect(body).toContain('prepaintMarker(hydrated, { plan: "not-pro" })');
    // Not held back on the entitlement cache: that is what mounted it late.
    expect(body).not.toContain("useProReady");
  });
});
