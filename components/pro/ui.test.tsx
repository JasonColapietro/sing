import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LockedPanel, UpgradeCard } from "./ui";

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

describe("LockedPanel preview strength", () => {
  const panel = (sample: boolean) =>
    renderToStaticMarkup(
      <LockedPanel label="Take pitch analysis" gives="The pitch line of each take." sample={sample}>
        <svg />
      </LockedPanel>,
    );

  it("fades the singer's own data, which is the thing being held back", () => {
    expect(panel(false)).toContain("opacity-60");
  });

  it("draws a labelled sample at full strength: a faded sample shows nothing", () => {
    const html = panel(true);
    expect(html).not.toContain("opacity-60");
    expect(html).not.toContain("bg-gradient-to-t");
    // Still inert and hidden from assistive tech; the `gives` sentence carries it.
    expect(html).toContain('aria-hidden="true"');
  });
});
