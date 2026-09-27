import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button, LinkButton } from "./ui";

describe("shared touch targets", () => {
  it.each(["sm", "md", "lg"] as const)("keeps %s controls at least 44px tall", (size) => {
    expect(renderToStaticMarkup(<Button size={size}>Start</Button>)).toContain("min-h-11");
    expect(renderToStaticMarkup(<LinkButton href="/range" size={size}>Test</LinkButton>)).toContain("min-h-11");
  });
});
