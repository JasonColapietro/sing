import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button, LinkButton } from "./ui";

describe("shared touch targets", () => {
  it.each(["sm", "md", "lg"] as const)("keeps %s controls at least 44px tall", (size) => {
    expect(renderToStaticMarkup(<Button size={size}>Start</Button>)).toContain("min-h-11");
    expect(renderToStaticMarkup(<LinkButton href="/range" size={size}>Test</LinkButton>)).toContain("min-h-11");
  });
});

describe("shared button motion", () => {
  it("drops the press scale under prefers-reduced-motion", () => {
    expect(renderToStaticMarkup(<Button>Start</Button>)).toContain("motion-reduce:active:scale-100");
    expect(renderToStaticMarkup(<LinkButton href="/range">Test</LinkButton>)).toContain(
      "motion-reduce:active:scale-100",
    );
  });
});
