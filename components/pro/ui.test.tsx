import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UpgradeCard } from "./ui";

describe("UpgradeCard purchase terms", () => {
  it("states the lifetime price, never the sold-out monthly plan, and never calls lifetime cancellable", () => {
    const html = renderToStaticMarkup(
      <UpgradeCard title="Your full report" body="Every note." context="Coach" />,
    );

    expect(html).toContain("Go Pro: $79 once");
    expect(html).toContain("Lifetime access · Never renews");
    // The price is printed once, on the button.
    expect(html.match(/\$79/g)).toHaveLength(1);
    expect(html).not.toContain("sold out");
    expect(html).toContain('href="/pro#buy"');
    expect(html).not.toContain("Cancel anytime ·");
  });
});
