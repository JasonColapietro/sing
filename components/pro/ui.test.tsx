import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UpgradeCard } from "./ui";

describe("UpgradeCard purchase terms", () => {
  it("says monthly is sold out and lifetime never renews without calling lifetime cancellable", () => {
    const html = renderToStaticMarkup(
      <UpgradeCard title="Your full report" body="Every note." context="Coach" />,
    );

    expect(html).toContain("Monthly plan sold out");
    expect(html).toContain("Lifetime never renews");
    expect(html).not.toContain("Cancel anytime ·");
  });
});
