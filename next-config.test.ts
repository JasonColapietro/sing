import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("raw Vercel host redirects", () => {
  it("canonicalizes every path before Proxy and Clerk run", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toContainEqual({
      source: "/:path*",
      has: [{ type: "host", value: ".+\\.vercel\\.app" }],
      destination: "https://sing.suedeai.ai/:path*",
      permanent: true,
    });
  });
});
