import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ErrorInfo } from "next/dist/client/components/error-boundary";

import GlobalError from "./global-error";

describe("the global error page", () => {
  it("wires Try again to the retry prop Next passes", () => {
    // Next 16.3 renders global-error through the same boundary as error.tsx,
    // with { error, reset, retry }. The page read `unstable_retry`, the 16.2
    // name, which arrived undefined, so "Try again" threw and did nothing.
    const router = readFileSync(
      join(process.cwd(), "node_modules/next/dist/client/components/app-router.js"),
      "utf8",
    );
    expect(router).toMatch(/errorComponent: globalError\[0\]/);
    const boundary = readFileSync(
      join(process.cwd(), "node_modules/next/dist/client/components/error-boundary.js"),
      "utf8",
    );
    expect(boundary).toMatch(/reset: this\.reset,\s*retry: this\.retry/);
    const src = readFileSync(join(__dirname, "global-error.tsx"), "utf8");
    expect(src).toMatch(/onClick=\{\(\) => retry\(\)\}/);
    expect(src).not.toMatch(/unstable_retry\s*[,:()]/);
    // Compile-time: every prop the page reads is one Next hands it.
    const onlyNextProps: Exclude<keyof Parameters<typeof GlobalError>[0], keyof ErrorInfo> extends never
      ? true
      : false = true;
    expect(onlyNextProps).toBe(true);
  });

  it("renders its own document with the retry button and a way home", () => {
    const html = renderToStaticMarkup(
      <GlobalError error={Object.assign(new Error("boom"), { digest: "abc123" })} retry={() => {}} />,
    );
    expect(html).toMatch(/^<html lang="en">/);
    expect(html).toContain("The app failed to start");
    expect(html).toContain("Try again");
    expect(html).toContain('href="/"');
    expect(html).toContain("Reference abc123");
  });
});
