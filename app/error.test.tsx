import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ErrorInfo } from "next/dist/client/components/error-boundary";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import RoomError from "./error";

function render(error: Error) {
  return renderToStaticMarkup(<RoomError error={error} retry={() => {}} />);
}

describe("the room error page", () => {
  it("says a room that failed to download needs the connection back", () => {
    // Offline on /range, pressing "Start singing" with a stale saved range
    // failed to load the program probe's chunk; "most causes are momentary"
    // sent the singer to a retry that could not work until they reconnected.
    const chunk = Object.assign(
      new Error("Failed to load chunk /_next/static/chunks/0cjgeja_o3vmm.js from module 84802"),
      { name: "ChunkLoadError" },
    );
    const html = render(chunk);
    expect(html).toContain("Part of this room did not download");
    expect(html).toContain("back online");
    expect(html).not.toContain("an error in the page itself");
    expect(html).toContain("Try this room again");
  });

  it("keeps the general wording for any other error", () => {
    const html = render(new Error("boom"));
    expect(html).toContain("an error in the page itself");
    expect(html).not.toContain("did not download");
  });

  it("opens at the top, with the heading focused", () => {
    // The room it replaced could be scrolled 390px down a phone, which left
    // only the footer links on screen.
    const html = render(new Error("boom"));
    expect(html).toMatch(/<h1[^>]*tabindex="-1"[^>]*>\s*This room stopped working/);
    const src = readFileSync(join(__dirname, "error.tsx"), "utf8");
    expect(src).toMatch(/window\.scrollTo\(0, 0\);\s*headingRef\.current\?\.focus\(\{ preventScroll: true \}\);/);
  });

  it("wires Try this room again to the retry prop Next passes", () => {
    // Next 16.3 renders an error file with { error, reset, retry }. The page
    // read `unstable_retry`, the 16.2 name, which arrived undefined, so the
    // button threw "r is not a function" and did nothing.
    const boundary = readFileSync(
      join(process.cwd(), "node_modules/next/dist/client/components/error-boundary.js"),
      "utf8",
    );
    expect(boundary).toMatch(/reset: this\.reset,\s*retry: this\.retry/);
    const src = readFileSync(join(__dirname, "error.tsx"), "utf8");
    expect(src).toMatch(/onClick=\{\(\) => retry\(\)\}/);
    expect(src).not.toMatch(/unstable_retry\s*[,:()]/);
    // Compile-time: every prop the page reads is one Next hands it.
    const onlyNextProps: Exclude<keyof Parameters<typeof RoomError>[0], keyof ErrorInfo> extends never
      ? true
      : false = true;
    expect(onlyNextProps).toBe(true);
  });
});
