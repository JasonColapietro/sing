import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UpgradeCard } from "./ui";

describe("UpgradeCard purchase terms", () => {
  it("states the lifetime price, never the sold-out monthly plan, and never calls lifetime cancellable", () => {
    const html = renderToStaticMarkup(
      <UpgradeCard title="Your full report" body="Every note." context="Coach" />,
    );

    expect(html).toContain("$79 once for lifetime access");
    expect(html).toContain("Never renews");
    expect(html).not.toContain("sold out");
    expect(html).toContain('href="/pro#buy"');
    expect(html).not.toContain("Cancel anytime ·");
  });
});
