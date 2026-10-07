import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UpgradeCard } from "./ui";

describe("UpgradeCard purchase terms", () => {
  it("covers both sellable billing shapes without calling lifetime cancellable", () => {
    const html = renderToStaticMarkup(
      <UpgradeCard title="Your full report" body="Every note." context="Coach" />,
    );

    expect(html).toContain("Monthly price stays while subscription is active");
    expect(html).toContain("Lifetime never renews");
    expect(html).not.toContain("Cancel anytime ·");
  });
});
