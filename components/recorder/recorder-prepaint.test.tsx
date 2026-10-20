/**
 * /recorder's free-plan parts are in the server HTML, behind the pre-paint
 * "not-pro" marker, instead of mounting after hydration.
 *
 * Both the gate's "Free · Pro adds the coach" line (ProWhisper) and the locked
 * preview of Pro's pitch panel used to render nothing until the entitlement
 * cache had been read. Arriving after hydration they grew the deck column by
 * about 49px and 240px, which moved the A/B card (1280), the takes list (a
 * 768px tablet) and the page's closing sections (a 1440x1300 desktop) for
 * every free visitor: CLS 0.03 to 0.08.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { paintedFor } from "@/components/prepaint.testing";
import RecorderPageClient from "./recorder-page";

describe("/recorder before hydration", () => {
  const html = renderToStaticMarkup(<RecorderPageClient />);

  it("carries the locked pitch panel and the gate's Pro line for a free singer's first paint", () => {
    const free = paintedFor(html, { plan: "free" });
    expect(free).toContain("Take pitch analysis");
    expect(free).toContain("adds the coach");
  });

  it("hides both before the first paint for a Pro singer", () => {
    const pro = paintedFor(html, { plan: "pro" });
    expect(pro).not.toContain("Take pitch analysis");
    expect(pro).not.toContain("adds the coach");
    // The rest of the room is untouched.
    expect(pro).toContain("Record deck");
    expect(pro).toContain("Enable microphone");
  });
});
